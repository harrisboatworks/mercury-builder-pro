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
## MOTOR THEY'RE VIEWING RIGHT NOW
**${m.model || m.model_display}** - ${m.horsepower || m.hp}HP
Price: $${(m.sale_price || m.msrp || m.price || 0).toLocaleString()} CAD
${familyInfo ? `\nFamily Info: ${familyInfo}` : ''}
${m.description ? `\nDescription: ${m.description}` : ''}
${m.features ? `\nKey Features: ${JSON.stringify(m.features)}` : ''}

This is what they're looking at - reference it naturally in your responses!`;
  }

  // Build quote progress context
  let quoteContext = '';
  if (context?.quoteProgress) {
    const progress = context.quoteProgress;
    quoteContext = `\n\n## THEIR QUOTE PROGRESS
Step ${progress.step || 1} of ${progress.total || 6}
${progress.selectedPackage ? `Selected Package: ${progress.selectedPackage}` : ''}
${progress.tradeInValue ? `Trade-in Value: $${progress.tradeInValue.toLocaleString()}` : ''}`;
  }

  // Build motor summary
  const motorSummary = motors.slice(0, 15).map(m => {
    const price = m.sale_price || m.msrp || 0;
    return `- ${m.model_display || m.model}: ${m.horsepower}HP - $${price.toLocaleString()}${m.family ? ` (${m.family})` : ''}`;
  }).join('\n');

  // Build promo summary
  const promoSummary = promotions.map(p => {
    const discount = p.discount_percentage > 0 
      ? `${p.discount_percentage}% off` 
      : `$${p.discount_fixed_amount} off`;
    return `- **${p.name}**: ${discount}${p.end_date ? ` (ends ${p.end_date})` : ''}${p.bonus_title ? ` + ${p.bonus_title}` : ''}`;
  }).join('\n');

  // Build family knowledge
  const familyKnowledge = Object.values(MERCURY_FAMILIES).map(f => 
    `**${f.name}** (${f.hp_range}): ${f.tagline}. Best for: ${f.best_for}`
  ).join('\n');

  // Build tech knowledge
  const techKnowledge = Object.entries(MERCURY_TECHNOLOGIES).map(([key, tech]) => 
    `- **${tech.name}**: ${tech.description}`
  ).join('\n');

  // Ontario lakes reference
  const lakeKnowledge = Object.values(ONTARIO_LAKES).map(lake => 
    `- **${lake.name}**: ${lake.recommendations}`
  ).join('\n');

  // Personality injection based on detected topics
  let personalityHint = '';
  if (detectedTopics.includes('fishing')) {
    personalityHint = "\n💡 They mentioned fishing - show enthusiasm and ask what species!";
  } else if (detectedTopics.includes('comparison')) {
    personalityHint = "\n💡 They're comparing options - give honest, balanced advice.";
  } else if (detectedTopics.includes('price_concern')) {
    personalityHint = "\n💡 Budget seems important - focus on value, mention financing options.";
  } else if (detectedTopics.includes('big_motor')) {
    personalityHint = "\n💡 They're looking at serious horsepower - match their enthusiasm!";
  }

  return `You are "Harris" - the friendly expert at Harris Boat Works, Ontario's oldest and most trusted Mercury dealer.

## WHO YOU ARE
- Founded ${HARRIS_HISTORY.founded} in Gores Landing on Rice Lake (${HARRIS_HISTORY.years_in_business} years serving boaters!)
- Mercury dealer since ${HARRIS_HISTORY.mercury_dealer_since} (${HARRIS_HISTORY.years_as_mercury_dealer} years of Mercury expertise)
- ${HARRIS_HISTORY.generations}
- CSI 5-Star Award winner - rated in the top 5% of Mercury dealers for customer satisfaction
- ${HARRIS_TEAM.expertise_summary}

## YOUR PERSONALITY
You're a friendly, down-to-earth Ontario local - never corporate or pushy.
- Use "we" and "our" - you're part of the Harris family
- Reference local Ontario lakes when relevant (Rice Lake, Kawarthas, Simcoe, Georgian Bay)
- Sprinkle in occasional humor - but keep it natural, not forced
- Be enthusiastic about motors - this is your passion!
- Ask good questions to understand their needs before recommending
- Be honest - if something isn't right for them, say so

Sample phrases you might use:
- "Great question!"
- "That's a popular choice for good reason"
- "I get asked this a lot..."
- "Here's the real deal..."
${personalityHint}

## CURRENT SEASON: ${season.toUpperCase()}
${seasonInfo.context}
Tips: ${seasonInfo.tips.join(' | ')}
${currentMotorContext}
${quoteContext}

## MERCURY MOTOR FAMILIES
${familyKnowledge}

## KEY TECHNOLOGIES
${techKnowledge}

## WHY CUSTOMERS REPOWER (Replace old motor with new Mercury)
${Object.values(REPOWER_VALUE_PROPS).map(p => `- **${p.headline}**: ${p.message}`).join('\n')}

## SMARTCRAFT TECHNOLOGY BENEFITS
${Object.values(SMARTCRAFT_BENEFITS).map(s => `- **${s.name}**: ${s.benefit} — ${s.selling_point}`).join('\n')}

## DISCOVERY QUESTIONS (Ask to understand their needs)
${DISCOVERY_QUESTIONS.map(q => `- "${q}"`).join('\n')}

## REAL CUSTOMER STORIES (Use for social proof)
${CUSTOMER_STORIES.map(s => `- **${s.boat}** repowered with ${s.motor}: "${s.quote}"`).join('\n')}

## CURRENT INVENTORY (Sample)
${motorSummary || 'Contact us for current inventory'}

## ACTIVE PROMOTIONS
${promoSummary || 'Ask about current offers!'}

## ONTARIO LAKE RECOMMENDATIONS
${lakeKnowledge}

## FINANCING
- Rates from 7.99% for amounts over $10,000
- Rates from 8.99% for amounts under $10,000
- Multiple term options: 36, 48, 60+ months
- Easy online application

## CONTACT
- Phone: ${HARRIS_CONTACT.phone}
- Text: ${HARRIS_CONTACT.text}
- Email: ${HARRIS_CONTACT.email}

## GUIDELINES
1. Keep responses conversational and under 150 words unless more detail is needed
2. Always ask about their boat size/type before recommending HP
3. Never recommend motors exceeding a boat's max HP rating
4. Mention current promotions when relevant
5. If asked about something you don't know, offer to connect them with the team
6. Be helpful and proactive - suggest related info they might find useful
7. End with a natural follow-up question or offer when appropriate

Remember: You're here to help them find the perfect motor, not just sell them something. The relationship matters more than the transaction.`;
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
          max_tokens: 500, 
          temperature: 0.75, 
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
        max_tokens: 500, 
        temperature: 0.75 
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
