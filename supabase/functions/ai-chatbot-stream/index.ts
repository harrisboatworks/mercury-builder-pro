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

// Get current motor inventory with rich details
async function getCurrentMotorInventory() {
  const { data: motors } = await supabase
    .from('motor_models')
    .select('model, model_display, horsepower, msrp, sale_price, family, description, features, specifications')
    .order('horsepower', { ascending: true })
    .limit(50);
  return motors || [];
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

// Detect if question needs external knowledge (Perplexity fallback)
function needsExternalKnowledge(message: string): boolean {
  const lowerMsg = message.toLowerCase();
  const externalPatterns = [
    /what('s| is) (the |a )?(new|latest|2024|2025)/i,
    /how does .+ work/i,
    /technical spec(ification)?s? (for|of|on)/i,
    /fuel consumption|fuel economy|mpg|gph/i,
    /weight (of|for)|dry weight/i,
    /warranty (cover|include|policy)/i,
    /compare (to|with|against) (yamaha|honda|suzuki|evinrude)/i,
    /compatible with|fit (on|my)/i,
    /prop(eller)? (size|pitch|recommendation)/i,
    /oil (type|capacity|change)/i,
    /maintenance (schedule|interval|requirement)/i,
  ];
  return externalPatterns.some(pattern => pattern.test(lowerMsg));
}

// Search with Perplexity for detailed/technical questions
async function searchWithPerplexity(query: string): Promise<string | null> {
  const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
  if (!PERPLEXITY_API_KEY) {
    console.log('Perplexity API key not configured, skipping fallback');
    return null;
  }

  try {
    console.log('Searching Perplexity for:', query);
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { 
            role: 'system', 
            content: 'You are a marine engine expert. Provide accurate, concise technical information about Mercury Marine outboard motors. Focus on specifications, features, and practical advice. Keep responses under 200 words.' 
          },
          { role: 'user', content: query }
        ],
        search_domain_filter: ['mercurymarine.com', 'boatingmag.com', 'boats.com'],
        search_recency_filter: 'year',
      }),
    });

    if (!response.ok) {
      console.error('Perplexity API error:', response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const citations = data.citations || [];
    
    console.log('Perplexity response received, citations:', citations.length);
    
    if (content) {
      return `\n\n## VERIFIED TECHNICAL INFO (from Mercury Marine)\n${content}${citations.length > 0 ? `\n\nSources: ${citations.slice(0, 2).join(', ')}` : ''}`;
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

  // Build motor summary (compact)
  const motorSummary = motors.slice(0, 12).map(m => 
    `${m.horsepower}HP ${m.family || ''}: $${(m.sale_price || m.msrp || 0).toLocaleString()}`
  ).join(' | ');

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
1. Offer warmly: "I'd love to have someone reach out to you personally. Can I grab your name and best number to call?"
2. Collect: Name (required), Phone (required), Email (optional but helpful)
3. Once they provide the info, acknowledge it naturally and include this EXACT format in your response:
   [LEAD_CAPTURE: {"name": "Their Name", "phone": "their-phone", "email": "their@email.com"}]
4. After the capture format, continue naturally: "Perfect! Someone from Harris Boat Works will give you a call within 24 hours. Anything else I can help with in the meantime?"

Example:
User: "Can I just talk to someone? I have a lot of questions."
You: "Absolutely! I'd love to connect you with someone. What's your name and best number to reach you?"
User: "It's Mike, 905-555-1234"
You: "Got it, Mike! [LEAD_CAPTURE: {"name": "Mike", "phone": "905-555-1234"}] Someone from our team will call you within 24 hours. Is there anything I can help with while you wait?"

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

## INVENTORY (Quick ref)
${motorSummary || 'Contact us for inventory'}

## PROMOS
${promoSummary || 'Ask about current offers'}

## REPOWER BENEFITS (If relevant)
${Object.values(REPOWER_VALUE_PROPS).slice(0, 3).map(p => `${p.headline}: ${p.message}`).join(' | ')}

## FINANCING
7.99% for $10k+, 8.99% under $10k. Terms: 36-60 months.

## CONTACT
Phone: ${HARRIS_CONTACT.phone} | Text: ${HARRIS_CONTACT.text} | Email: ${HARRIS_CONTACT.email}

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

    // Detect topics and comparisons
    const detectedTopics = detectTopics(message);
    const comparison = detectComparisonQuery(message);
    const needsPerplexity = needsExternalKnowledge(message);
    
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

    // Fetch Perplexity context for technical questions
    let perplexityContext = '';
    if (needsPerplexity) {
      perplexityContext = await searchWithPerplexity(message) || '';
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
