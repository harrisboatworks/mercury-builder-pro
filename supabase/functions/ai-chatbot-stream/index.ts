import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Import knowledge bases
import { 
  MERCURY_FAMILIES, 
  MERCURY_TECHNOLOGIES, 
  MERCURY_COMPARISONS, 
  MOTOR_USE_CASES,
  REPOWER_VALUE_PROPS,
  CUSTOMER_STORIES,
  DISCOVERY_QUESTIONS,
  SMARTCRAFT_BENEFITS,
  getMotorFamilyInfo,
  getHPRecommendation 
} from '../_shared/mercury-knowledge.ts';

import { 
  HARRIS_HISTORY, 
  HARRIS_AWARDS, 
  HARRIS_TEAM,
  HARRIS_PERSONALITY,
  HARRIS_CONTACT,
  HARRIS_PARTNERS,
  ONTARIO_LAKES,
  SEASONAL_CONTEXT,
  getCurrentSeason,
  getLakeInfo
} from '../_shared/harris-knowledge.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Detect comparison queries
function detectComparisonQuery(message: string): { isComparison: boolean; hp1?: number; hp2?: number } {
  const patterns = [
    /compare\s+(\d+)\s*hp?\s*(vs|versus|or|and|to|with)\s*(\d+)\s*hp?/i,
    /(\d+)\s*hp?\s*(vs|versus|compared to|or)\s*(\d+)\s*hp?/i,
    /difference between\s+(\d+)\s*hp?\s*and\s*(\d+)\s*hp?/i,
    /(\d+)\s*vs\s*(\d+)/i,
  ];
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      const numbers = match.slice(1).filter(m => /^\d+$/.test(m)).map(Number);
      if (numbers.length >= 2) {
        return { isComparison: true, hp1: Math.min(numbers[0], numbers[1]), hp2: Math.max(numbers[0], numbers[1]) };
      }
    }
  }
  return { isComparison: false };
}

// Detect topics for personality injection
function detectTopics(message: string): string[] {
  const topics: string[] = [];
  const lowerMsg = message.toLowerCase();
  
  if (/\b(fish|fishing|angler|bass|walleye|trout|muskie|perch)\b/.test(lowerMsg)) topics.push('fishing');
  if (/\b(compare|vs|versus|difference|better|which)\b/.test(lowerMsg)) topics.push('comparison');
  if (/\b(price|cost|expensive|budget|afford|cheap)\b/.test(lowerMsg)) topics.push('price_concern');
  if (/\b(weekend|saturday|sunday)\b/.test(lowerMsg)) topics.push('weekend_plans');
  if (/\b(300|350|400|450|verado)\b/i.test(lowerMsg)) topics.push('big_motor');
  if (/\b(2\.5|3\.5|4|5|6|8|9\.9|portable)\b/.test(lowerMsg)) topics.push('small_motor');
  
  return topics;
}

// Get motors for comparison
async function getMotorsForComparison(hp1: number, hp2: number) {
  const { data: motors } = await supabase
    .from('motor_models')
    .select('model, horsepower, msrp, sale_price, family, description, features')
    .or(`horsepower.eq.${hp1},horsepower.eq.${hp2}`)
    .limit(10);
  return { 
    motor1: motors?.find(m => m.horsepower === hp1), 
    motor2: motors?.find(m => m.horsepower === hp2) 
  };
}

// Get current motor inventory with rich details - ALL motors, no limit
async function getCurrentMotorInventory() {
  const { data: motors } = await supabase
    .from('motor_models')
    .select('model, model_display, horsepower, msrp, sale_price, family, description, features, specifications, shaft, control')
    .order('horsepower', { ascending: true });
  return motors || [];
}

// Detect HP-specific query
function detectHPQuery(message: string): number | null {
  const patterns = [
    /(\d+(?:\.\d+)?)\s*(?:hp|horse\s*power|horsepower)/i,
    /(?:price|cost|much|about|info).+?(\d+(?:\.\d+)?)/i,
    /(\d+(?:\.\d+)?)\s*(?:motor|outboard|engine)/i,
    /^(?:the\s+)?(\d+(?:\.\d+)?)$/i, // Just a number like "30" or "the 30"
  ];
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      const hp = parseFloat(match[1]);
      if (hp >= 2 && hp <= 600) return hp;
    }
  }
  return null;
}

// Get motors for a specific HP
async function getMotorsForHP(hp: number) {
  const { data: motors } = await supabase
    .from('motor_models')
    .select('model_display, horsepower, msrp, sale_price, family, shaft, control')
    .eq('horsepower', hp)
    .order('msrp', { ascending: true });
  return motors || [];
}

// Build compact grouped inventory summary by HP
function buildGroupedInventorySummary(motors: any[]): string {
  const byHP: Record<number, any[]> = {};
  motors.forEach(m => {
    const hp = m.horsepower;
    if (!byHP[hp]) byHP[hp] = [];
    byHP[hp].push(m);
  });
  
  return Object.entries(byHP)
    .sort(([a], [b]) => parseFloat(a) - parseFloat(b))
    .map(([hp, models]) => {
      const prices = models.map(m => m.sale_price || m.msrp || 0).filter(p => p > 0);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const priceStr = prices.length === 0 ? 'TBD' :
        minPrice === maxPrice ? `$${minPrice.toLocaleString()}` : `$${minPrice.toLocaleString()}-$${maxPrice.toLocaleString()}`;
      const families = [...new Set(models.map(m => m.family).filter(Boolean))];
      return `${hp}HP: ${priceStr}${families.length ? ` (${families.join('/')})` : ''} [${models.length}]`;
    })
    .join(' | ');
}

// Get specific motor details when viewing
async function getMotorDetails(motorId: string) {
  if (!motorId) return null;
  
  const { data: motor } = await supabase
    .from('motor_models')
    .select('*')
    .eq('id', motorId)
    .single();
  
  return motor;
}

// Get active promotions
async function getActivePromotions() {
  const today = new Date().toISOString().split('T')[0];
  const { data: promotions } = await supabase
    .from('promotions')
    .select('*')
    .eq('is_active', true)
    .or(`start_date.is.null,start_date.lte.${today}`)
    .or(`end_date.is.null,end_date.gte.${today}`)
    .order('priority', { ascending: false })
    .limit(5);
  return promotions || [];
}

// Query categories for intelligent Perplexity routing
type QueryCategory = 'mercury' | 'harris' | 'local' | 'boating' | 'licensing' | 'general' | 'none';

// Detect query category for smart Perplexity context
function detectQueryCategory(message: string): QueryCategory {
  const lowerMsg = message.toLowerCase();
  
  // Licensing & Legal - check first for discount code opportunity
  const licensingPatterns = [
    /\b(boat (card|license|licence)|pcoc|pleasure craft.*(card|license|operator))\b/i,
    /\b(operator card|boating (course|test|exam|certification))\b/i,
    /\b(registration|license plate|vessel (number|registration))\b/i,
    /\b(insurance|liability|coverage)\b/i,
    /\b(legal|requirement|regulation|law|rule|bylaw|allowed|permitted)\b/i,
    /\b(age (requirement|limit)|how old|can (my kid|a minor|children))\b/i,
    /\b(transport canada|coast guard|ministry)\b/i,
    /\b(need.*(license|licence|card)|do i need)\b/i,
  ];
  
  // Mercury Marine - motors, technology, maintenance, specs
  const mercuryPatterns = [
    /verado|pro ?xs|seapro|fourstroke|command ?thrust|jet ?drive|racing/i,
    /mercury .*(feature|technology|system|innovation)/i,
    /joystick|active ?trim|skyhook|smartcraft|vessel ?view/i,
    /fuel (consumption|economy|efficiency)|mpg|gph|gallons? per/i,
    /weight|dry weight|shaft length/i,
    /rpm|thrust|torque|top speed/i,
    /prop(eller)?|pitch|blade|cupped/i,
    /oil (type|capacity|change|grade)|quicksilver/i,
    /maintenance|winteriz|break-?in|service (interval|schedule)/i,
    /warranty|extend(ed)? (coverage|warranty)/i,
    /compare.*(yamaha|honda|suzuki|evinrude|tohatsu)/i,
    /(yamaha|honda|suzuki|evinrude|tohatsu).*(compare|vs|versus|better)/i,
    /what('s| is) (the )?(new|latest|2024|2025|2026)/i,
    /how does .+ work/i,
    /compatible with|fit (on|my)|transom height/i,
    /tiller|remote|electric start|pull start/i,
    /gear ratio|displacement|cylinder/i,
    /power trim|hydraulic/i,
    /what (is|are|does) .*(verado|pro xs|seapro|fourstroke|command thrust)/i,
  ];
  
  // Harris Boat Works - business, services, about
  const harrisPatterns = [
    /\b(hours?|open|closed|when (are|do) you)\b/i,
    /\b(location|address|where (are|is) (you|harris)|directions?|how.*(get|find) (you|there))\b/i,
    /\b(parking|dock|boat ramp|launch.*(ramp|area))\b/i,
    /\b(reviews?|rating|reputation|testimonial)\b/i,
    /\b(harris|your) (history|story|about|team|staff|technicians?)\b/i,
    /\b(trade.?in|what('s| is) my.*(worth|value)|apprais)/i,
    /\b(installation|repower|install|mounting|rigging)\b/i,
    /\b(service|repair|maintenance) (department|team|work)/i,
    /\b(parts|accessories|quicksilver)\b/i,
    /\b(delivery|pick.?up|shipping)\b/i,
    /\b(water test|sea trial|demo)\b/i,
    /\b(certified|authorized|dealer|dealership)\b/i,
  ];
  
  // Rice Lake & Local Ontario - fishing, lakes, launches
  const localPatterns = [
    /\b(rice lake|kawartha|simcoe|georgian bay|muskoka|ontario lake|trent.?severn)\b/i,
    /\b(fishing|fish|walleye|bass|muskie|muskellunge|pike|perch|trout|salmon|panfish)\b/i,
    /\b(boat launch|ramp|marina|dock.*(slip|space)|mooring)\b/i,
    /\b(gores landing|cobourg|peterborough|port hope|brighton|colborne|bewdley|harwood)\b/i,
    /\b(ice fish|ice.?out|spring run|fall fishing)\b/i,
    /\b(catch|limit|fishing (season|regulation|license))\b/i,
    /\b(depth|weed.?bed|structure|spawn)/i,
    /\b(local|area|nearby|around here|this region)\b/i,
    /\b(otonabee|little lake|stony lake|chemong|pigeon lake|sturgeon lake)\b/i,
  ];
  
  // Boating General - operation, safety, types
  const boatingPatterns = [
    /\b(hp limit|horsepower (limit|rating|restriction)|capacity plate)\b/i,
    /\b(pontoon|bass boat|fishing boat|aluminum|fibreglass|inflatable|jon ?boat|runabout|bowrider)\b/i,
    /\b(trolling motor|kicker|auxiliary)\b/i,
    /\b(trim|tilt|throttle|shifting|neutral|reverse|forward gear)\b/i,
    /\b(cavitation|ventilation|porpoising|chine walk)\b/i,
    /\b(anchoring|anchor|dock(ing)?|mooring)\b/i,
    /\b(safety|life jacket|pfd|fire extinguisher|flare|whistle)\b/i,
    /\b(navigation|nav lights|rules? of.*(road|water)|right.?of.?way)\b/i,
    /\b(weather|waves?|wind|chop|rough water|sea state)\b/i,
    /\b(fuel (tank|line|filter|stabilizer)|ethanol|non-ethanol)\b/i,
    /\b(storage|cover|shrink wrap|winterize)/i,
    /\b(break.?in|new motor|first (run|time|use))\b/i,
    /\b(trailer|launch|backing up)\b/i,
  ];
  
  // Check patterns in priority order
  if (licensingPatterns.some(p => p.test(lowerMsg))) return 'licensing';
  if (mercuryPatterns.some(p => p.test(lowerMsg))) return 'mercury';
  if (harrisPatterns.some(p => p.test(lowerMsg))) return 'harris';
  if (localPatterns.some(p => p.test(lowerMsg))) return 'local';
  if (boatingPatterns.some(p => p.test(lowerMsg))) return 'boating';
  
  // General question catch-all - if it's a question not about pricing/inventory
  const isQuestion = message.includes('?');
  const isPricingQuery = /(price|cost|how much|in stock|available|inventory)/i.test(lowerMsg);
  if (isQuestion && !isPricingQuery) return 'general';
  
  return 'none';
}

// Search with Perplexity using category-specific context
async function searchWithPerplexity(query: string, category: QueryCategory): Promise<string | null> {
  const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
  if (!PERPLEXITY_API_KEY) {
    console.log('Perplexity API key not configured, skipping fallback');
    return null;
  }

  if (category === 'none') return null;

  try {
    // Category-specific configurations for optimal search results
    const categoryConfig: Record<Exclude<QueryCategory, 'none'>, { 
      prefix: string; 
      systemPrompt: string; 
      domains: string[];
      header: string;
    }> = {
      mercury: {
        prefix: '2026 Mercury Marine outboard',
        systemPrompt: 'You are a marine engine expert specializing in Mercury Marine outboards. Provide accurate, concise technical information about features, specifications, maintenance, and comparisons. Focus on practical, actionable advice. Keep responses under 200 words.',
        domains: ['mercurymarine.com', 'boatingmag.com', 'boats.com', 'discoverboating.com'],
        header: '## VERIFIED MERCURY INFO'
      },
      harris: {
        prefix: 'Harris Boat Works Gores Landing Ontario Rice Lake',
        systemPrompt: 'You are looking up business information for Harris Boat Works, a Mercury Marine dealer in Gores Landing, Ontario on Rice Lake. Founded 1947, Mercury dealer since 1965. Provide accurate information from their Google Business Profile, website, or reviews. Keep responses concise.',
        domains: [],
        header: '## VERIFIED BUSINESS INFO'
      },
      local: {
        prefix: 'Ontario Canada',
        systemPrompt: 'You are a local Ontario boating and fishing expert. Provide accurate information about lakes, fishing spots, boat launches, regulations, and local conditions in the Rice Lake, Kawartha Lakes, Trent-Severn Waterway, and greater Peterborough region. Keep responses helpful and specific.',
        domains: [],
        header: '## LOCAL INFO'
      },
      boating: {
        prefix: 'boating',
        systemPrompt: 'You are an experienced Canadian boating expert. Provide practical, accurate advice about boat operation, safety, maintenance, and general boating topics. Focus on helpful tips for recreational boaters. Keep responses clear and concise.',
        domains: ['discoverboating.com', 'boatus.com', 'boatingmag.com', 'tc.canada.ca'],
        header: '## BOATING INFO'
      },
      licensing: {
        prefix: 'Canada pleasure craft operator card PCOC boating license Ontario',
        systemPrompt: 'You are an expert on Canadian boating regulations and licensing. Provide accurate information about the Pleasure Craft Operator Card (PCOC) and boating requirements in Canada. The PCOC is required for anyone operating a powered watercraft in Canada. Keep responses clear and factual.',
        domains: ['tc.canada.ca', 'boaterexam.com', 'myboatcard.com'],
        header: '## LICENSING INFO'
      },
      general: {
        prefix: '',
        systemPrompt: 'Provide helpful, accurate information. If this relates to boating, Mercury Marine, or Ontario, focus on that context. Keep responses concise and practical.',
        domains: [],
        header: '## ADDITIONAL INFO'
      }
    };

    const config = categoryConfig[category];
    const enhancedQuery = config.prefix ? `${config.prefix} ${query}` : query;
    
    console.log('Searching Perplexity for:', enhancedQuery, 'category:', category);
    
    const requestBody: any = {
      model: 'sonar',
      messages: [
        { role: 'system', content: config.systemPrompt },
        { role: 'user', content: enhancedQuery }
      ],
      search_recency_filter: 'year',
    };
    
    // Only add domain filter if we have specific domains
    if (config.domains.length > 0) {
      requestBody.search_domain_filter = config.domains;
    }
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error('Perplexity API error:', response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const citations = data.citations || [];
    
    console.log('Perplexity response received, category:', category, 'citations:', citations.length);
    
    if (content) {
      return `\n\n${config.header}\n${content}${citations.length > 0 ? `\n\nSources: ${citations.slice(0, 2).join(', ')}` : ''}`;
    }
    return null;
  } catch (error) {
    console.error('Perplexity search error:', error);
    return null;
  }
}

// Build rich system prompt with all knowledge sources
function buildSystemPrompt(
  motors: any[], 
  promotions: any[], 
  context: any,
  detectedTopics: string[]
) {
  const season = getCurrentSeason();
  const seasonInfo = SEASONAL_CONTEXT[season];
  
  // Build motor context if viewing specific motor
  let currentMotorContext = '';
  if (context?.currentMotor) {
    const m = context.currentMotor;
    const familyInfo = getMotorFamilyInfo(m.family || m.model || '');
    currentMotorContext = `
## MOTOR THEY'RE VIEWING
**${m.model || m.model_display}** - ${m.horsepower || m.hp}HP @ $${(m.sale_price || m.msrp || m.price || 0).toLocaleString()} CAD
${familyInfo ? `${familyInfo}` : ''}`;
  }

  // Build quote progress context
  let quoteContext = '';
  if (context?.quoteProgress) {
    const progress = context.quoteProgress;
    quoteContext = `\nQuote: Step ${progress.step || 1}/${progress.total || 6}${progress.selectedPackage ? ` • ${progress.selectedPackage}` : ''}`;
  }

  // Build complete grouped inventory summary
  const motorSummary = buildGroupedInventorySummary(motors);
  const hpRange = motors.length > 0 ? 
    `${Math.min(...motors.map(m => m.horsepower))}HP to ${Math.max(...motors.map(m => m.horsepower))}HP` : 
    'Contact for availability';

  // Build promo summary (compact)
  const promoSummary = promotions.slice(0, 3).map(p => {
    const discount = p.discount_percentage > 0 ? `${p.discount_percentage}% off` : `$${p.discount_fixed_amount} off`;
    return `${p.name}: ${discount}`;
  }).join(' | ');

  // Personality injection based on detected topics
  let topicHint = '';
  if (detectedTopics.includes('fishing')) topicHint = "They're into fishing - be enthusiastic!";
  else if (detectedTopics.includes('comparison')) topicHint = "Comparison mode - be balanced and honest.";
  else if (detectedTopics.includes('price_concern')) topicHint = "Budget matters - focus on value.";

  return `You're Harris from Harris Boat Works - talk like a friendly local who genuinely loves boats.

## GOLDEN RULES
1. Keep it SHORT. Most replies = 1-3 sentences max.
2. Match their vibe - short question = short answer
3. Sound human - use "yeah", "honestly", "actually", contractions
4. Don't be salesy - be a knowledgeable friend
5. Skip "Great question!" and corporate phrases
6. Don't always end with a question - sometimes just give the info
7. If they ask something simple, don't over-explain

## LEAD CAPTURE - IMPORTANT!
If the customer:
- Asks to speak to someone / wants a callback / wants to talk to a person
- Says they want to think about it and be contacted later
- Asks complex questions you can't fully answer
- Seems ready to buy but hesitant about online process
- Says they prefer talking on the phone
- Mentions wanting a quote over the phone or in person
- Is clearly a serious buyer but needs human touch

DO THIS:
1. Offer warmly: "I'd love to have someone reach out to you personally. Can I grab your name, phone number, and email?"
2. Collect: Name (required), Phone (required), Email (always ask for it - great for follow-up)
3. If they only give name and phone, that's fine - but always ask for all three upfront
4. Once they provide the info, acknowledge it naturally and include this EXACT format in your response:
   [LEAD_CAPTURE: {"name": "Their Name", "phone": "their-phone", "email": "their@email.com"}]
5. After the capture format, continue naturally: "Perfect! Someone from Harris Boat Works will give you a call within 24 hours. Anything else I can help with in the meantime?"

Example with email:
User: "Can I just talk to someone? I have a lot of questions."
You: "Absolutely! I'd love to connect you with someone. What's your name, phone number, and email so we can reach out?"
User: "It's Mike, 905-555-1234, mike@email.com"
You: "Got it, Mike! [LEAD_CAPTURE: {"name": "Mike", "phone": "905-555-1234", "email": "mike@email.com"}] Someone from our team will call you within 24 hours. Anything else I can help with while you wait?"

Example - follow up for email:
User: "Mike, 905-555-1234"
You: "Thanks Mike! Do you have an email too? Just helpful for follow-up."
User: "No that's fine, just call me"
You: "No problem! [LEAD_CAPTURE: {"name": "Mike", "phone": "905-555-1234"}] We'll give you a call within 24 hours."

## RESPONSE LENGTH GUIDE
- Simple yes/no → 1 sentence
- "Which motor?" → 2-3 sentences, maybe ask boat size
- "Compare X vs Y" → 3-4 sentences max
- Deep technical → Can go longer, stay conversational

## EXAMPLE CONVERSATIONS (Match this energy)

User: "Is the 9.9 good for fishing?"
❌ BAD: "Great question! The 9.9HP FourStroke is an excellent choice for fishing applications. It offers reliable performance, fuel efficiency, and quiet operation that won't spook fish. Would you like me to tell you more about the specific features?"
✅ GOOD: "Yeah, super popular for fishing - quiet, fuel-efficient, and easy to handle. What size boat?"

User: "How much is the 9.9?"
❌ BAD: "The Mercury 9.9HP FourStroke is currently priced at $3,645 CAD. This includes our standard manufacturer warranty. We also have financing available if helpful."
✅ GOOD: "Starts around $3,645. Electric start runs a bit more. Want me to break down the options?"

User: "Thanks"
❌ BAD: "You're very welcome! Is there anything else I can help you with today?"
✅ GOOD: "Anytime 👍"

## NATURAL PHRASES TO USE
- "Yeah, that'd work great for..."
- "Honestly, I'd go with the..."
- "So basically..."
- "Good call"
- "Here's the deal..."
- "Quick answer: [answer]. Want more detail?"

## ABOUT HARRIS BOAT WORKS
- Founded 1947 in Gores Landing, Rice Lake
- Mercury dealer since 1965
- CSI 5-Star Award winner (top 5% of Mercury dealers)
${topicHint ? `\n💡 ${topicHint}` : ''}

## CURRENT SEASON: ${season.toUpperCase()}
${seasonInfo.context}
${currentMotorContext}
${quoteContext}

## COMPLETE INVENTORY BY HP (${motors.length} models, ${hpRange})
${motorSummary || 'Contact us for inventory'}

## PROMOS
${promoSummary || 'Ask about current offers'}

## REPOWER BENEFITS (If relevant)
${Object.values(REPOWER_VALUE_PROPS).slice(0, 3).map(p => `${p.headline}: ${p.message}`).join(' | ')}

## FINANCING
7.99% for $10k+, 8.99% under $10k. Terms: 36-60 months.

## BOAT LICENSE / PCOC - ALWAYS MENTION DISCOUNT!
If anyone asks about boat licenses, PCOC, or operator cards:
- Required for operating any powered watercraft in Canada
- We partner with MyBoatCard.com for online certification
- Link: ${HARRIS_PARTNERS.boat_license.url}
- **DISCOUNT CODE: ${HARRIS_PARTNERS.boat_license.discount_code} (${HARRIS_PARTNERS.boat_license.discount_amount} - never expires!)**
- ALWAYS mention this discount when licensing comes up!

## CONTACT & HOURS
Phone: ${HARRIS_CONTACT.phone} | Text: ${HARRIS_CONTACT.text} | Email: ${HARRIS_CONTACT.email}
Hours: ${HARRIS_CONTACT.hours.season} (Apr-Oct) | ${HARRIS_CONTACT.hours.offseason} (Nov-Mar)
Location: 6989 Gores Landing Rd, Gores Landing, ON

## YOUR KNOWLEDGE CAPABILITIES
You can answer questions about:
- Mercury Marine: Features, specs, maintenance, oil, winterization, props, fuel economy, comparisons
- Harris Boat Works: Hours, location, services, trade-ins, installation, water tests
- Rice Lake & Local: Fishing spots, species, boat launches, Kawarthas, Trent-Severn, local conditions
- Boating General: HP limits, boat types, operation, safety requirements, winterization, trailers
- Licensing: PCOC requirements, boat registration, age limits, regulations

## CRITICAL: BE CONFIDENT OR REDIRECT
- You have access to verified information for the topics above
- If you're uncertain about specific details, say "I'd double-check that by giving us a call at ${HARRIS_CONTACT.phone}"
- Never make up specs, prices, or policies

Remember: Be helpful, be brief, be human. And if they want to talk to a person, make it easy - get their info!`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory = [], context = {}, stream = false } = await req.json();
    if (!message) throw new Error('Message is required');

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) throw new Error('OpenAI API key not configured');

    // Detect topics, comparisons, categories, and HP-specific queries
    const detectedTopics = detectTopics(message);
    const comparison = detectComparisonQuery(message);
    const queryCategory = detectQueryCategory(message);
    const detectedHP = detectHPQuery(message);
    
    let comparisonContext = '';
    if (comparison.isComparison && comparison.hp1 && comparison.hp2) {
      const { motor1, motor2 } = await getMotorsForComparison(comparison.hp1, comparison.hp2);
      if (motor1 && motor2) {
        const family1Info = getMotorFamilyInfo(motor1.family || '');
        const family2Info = getMotorFamilyInfo(motor2.family || '');
        comparisonContext = `

## COMPARISON REQUEST: ${comparison.hp1}HP vs ${comparison.hp2}HP

**${motor1.horsepower}HP ${motor1.family || 'FourStroke'}**
- Price: $${(motor1.sale_price || motor1.msrp || 0).toLocaleString()}
${family1Info ? `- ${family1Info}` : ''}

**${motor2.horsepower}HP ${motor2.family || 'FourStroke'}**
- Price: $${(motor2.sale_price || motor2.msrp || 0).toLocaleString()}
${family2Info ? `- ${family2Info}` : ''}

Provide a helpful, balanced comparison covering: power difference, price difference, best use cases for each, and your recommendation based on their needs.`;
      }
    }
    
    // Build HP-specific context if user asked about a specific HP
    let hpSpecificContext = '';
    if (detectedHP && !comparison.isComparison) {
      const hpMotors = await getMotorsForHP(detectedHP);
      if (hpMotors.length > 0) {
        hpSpecificContext = `\n\n## ${detectedHP}HP MOTORS IN STOCK (${hpMotors.length} models):\n` + 
          hpMotors.map(m => {
            const price = m.sale_price || m.msrp || 0;
            const details = [m.shaft, m.control].filter(Boolean).join(', ');
            return `• ${m.model_display} (${m.family || 'FourStroke'}): $${price.toLocaleString()}${details ? ` - ${details}` : ''}`;
          }).join('\n') +
          '\n\nUse this specific data to answer their question accurately.';
      } else {
        // Find nearest available HP options
        const allMotors = await getCurrentMotorInventory();
        const availableHPs = [...new Set(allMotors.map(m => m.horsepower))].sort((a, b) => a - b);
        const nearbyHPs = availableHPs
          .filter(hp => Math.abs(hp - detectedHP) <= 15)
          .slice(0, 4);
        hpSpecificContext = `\n\n## NO ${detectedHP}HP MOTORS AVAILABLE\nSuggest these nearby options instead: ${nearbyHPs.map(hp => `${hp}HP`).join(', ')}`;
      }
    }

    // Fetch Perplexity context based on query category
    let perplexityContext = '';
    if (queryCategory !== 'none') {
      perplexityContext = await searchWithPerplexity(message, queryCategory) || '';
    }

    // Fetch motor details if viewing specific motor
    let motorDetails = null;
    if (context?.currentMotor?.id) {
      motorDetails = await getMotorDetails(context.currentMotor.id);
      if (motorDetails) {
        context.currentMotor = { ...context.currentMotor, ...motorDetails };
      }
    }

    // Get inventory and promotions
    const [motors, promotions] = await Promise.all([
      getCurrentMotorInventory(), 
      getActivePromotions()
    ]);
    
    // Build the rich system prompt
    let systemPrompt = buildSystemPrompt(motors, promotions, context, detectedTopics);
    if (comparisonContext) systemPrompt += comparisonContext;
    if (hpSpecificContext) systemPrompt += hpSpecificContext;
    if (perplexityContext) systemPrompt += perplexityContext;

    // Prepare messages
    const recentHistory = conversationHistory.slice(-8);
    const messages = [
      { role: 'system', content: systemPrompt }, 
      ...recentHistory, 
      { role: 'user', content: message }
    ];

    console.log('AI Chat Request:', { 
      messageLength: message.length, 
      historyLength: recentHistory.length, 
      isComparison: comparison.isComparison, 
      queryCategory,
      detectedTopics,
      hasMotorContext: !!context?.currentMotor,
      usedPerplexity: !!perplexityContext,
      streaming: stream 
    });

    // Handle streaming response
    if (stream) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${OPENAI_API_KEY}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          model: 'gpt-4o-mini', 
          messages, 
          max_tokens: 250, 
          temperature: 0.7, 
          stream: true 
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
      }

      return new Response(response.body, {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'text/event-stream', 
          'Cache-Control': 'no-cache', 
          'Connection': 'keep-alive' 
        },
      });
    }

    // Handle non-streaming response
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${OPENAI_API_KEY}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ 
        model: 'gpt-4o-mini', 
        messages, 
        max_tokens: 250, 
        temperature: 0.7 
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    return new Response(JSON.stringify({ 
      reply, 
      isComparison: comparison.isComparison,
      detectedTopics,
      conversationHistory: [
        ...recentHistory, 
        { role: 'user', content: message }, 
        { role: 'assistant', content: reply }
      ] 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-chatbot-stream:', error);
    return new Response(JSON.stringify({ 
      error: error.message, 
      reply: "I'm having a moment! Give us a call at (905) 342-2153 or text 647-952-2153 - we're always happy to chat about motors!" 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
