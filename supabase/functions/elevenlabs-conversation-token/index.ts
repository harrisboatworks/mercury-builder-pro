import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ELEVENLABS_AGENT_ID = "agent_0501kdexvsfkfx8a240g7ts27dy1";

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Fetch active promotions only - no full inventory (agent uses tools for real-time lookups)
async function getActivePromotions() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data: promotions, error } = await supabase
      .from('promotions')
      .select('name, discount_percentage, discount_fixed_amount, bonus_title, end_date')
      .eq('is_active', true)
      .or(`start_date.is.null,start_date.lte.${today}`)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .order('priority', { ascending: false })
      .limit(3);
    
    if (error) {
      console.error('Error fetching promotions:', error);
      return [];
    }
    return promotions || [];
  } catch (error) {
    console.error('Error in getActivePromotions:', error);
    return [];
  }
}

// Model suffix decoder - kept compact for quick reference
const MODEL_SUFFIX_GUIDE = `
## MODEL SUFFIX DECODER:
- M = Manual pull-start, E = Electric start
- H = Short shaft (15"), L = Long (20"), XL = Extra-long (25"), XXL = 30"
- PT = Power Trim, CT = Command Thrust (for heavy boats/pontoons)
- Example: 9.9ELH = 9.9HP Electric start, Long shaft, tiller Handle
`;

// Format promotion data - kept minimal
function formatPromotionData(promotions: any[]) {
  if (!promotions.length) return "";
  
  let formatted = "\n## CURRENT PROMOTIONS:\n";
  promotions.forEach(promo => {
    const discount = promo.discount_percentage > 0 ? `${promo.discount_percentage}% off` : 
                     promo.discount_fixed_amount > 0 ? `$${promo.discount_fixed_amount} off` : '';
    const bonus = promo.bonus_title ? ` + ${promo.bonus_title}` : '';
    const endDate = promo.end_date ? ` (until ${promo.end_date})` : '';
    formatted += `- ${promo.name}: ${discount}${bonus}${endDate}\n`;
  });
  return formatted;
}

// Map page paths to human-readable descriptions
function getPageDescription(currentPage: string): string {
  const pageDescriptions: Record<string, string> = {
    '/': 'the homepage',
    '/motors': 'the motors catalog',
    '/motor/': 'a specific motor details page',
    '/quote': 'the quote builder',
    '/quote/motor': 'selecting a motor in the quote builder',
    '/quote/package': 'choosing options/packages',
    '/quote/purchase-path': 'deciding between loose motor or professional installation',
    '/quote/trade-in': 'the trade-in value section',
    '/quote/summary': 'the quote summary',
    '/quote/contact': 'the quote contact form',
    '/about': 'the About Harris Boat Works page',
    '/financing': 'the financing options page',
    '/contact': 'the contact page',
  };
  
  // Find matching page (check for partial matches for dynamic routes)
  const match = Object.entries(pageDescriptions)
    .find(([path]) => currentPage === path || (path.endsWith('/') && currentPage.startsWith(path)));
  
  return match?.[1] || currentPage;
}

// Build quote context section for the prompt
function buildQuoteContextPrompt(quoteContext: any): string {
  if (!quoteContext) return "";
  
  const parts: string[] = [];
  
  if (quoteContext.boatInfo) {
    const boat = quoteContext.boatInfo;
    const boatParts = [];
    if (boat.length) boatParts.push(`${boat.length} ft`);
    if (boat.type) boatParts.push(boat.type);
    if (boat.make) boatParts.push(boat.make);
    if (boat.currentHp) boatParts.push(`currently powered by ${boat.currentHp}HP`);
    if (boatParts.length > 0) {
      parts.push(`- Their boat: ${boatParts.join(' ')}`);
    }
  }
  
  if (quoteContext.selectedMotor) {
    parts.push(`- Motor in their quote: ${quoteContext.selectedMotor.model} (${quoteContext.selectedMotor.hp}HP)`);
  }
  
  if (quoteContext.packageSelection) {
    parts.push(`- Package selected: ${quoteContext.packageSelection}`);
  }
  
  if (quoteContext.purchasePath) {
    const pathDesc = quoteContext.purchasePath === 'loose' 
      ? 'Taking motor home (loose purchase)' 
      : 'Professional installation at the shop';
    parts.push(`- Purchase type: ${pathDesc}`);
  }
  
  if (quoteContext.tradeInValue) {
    parts.push(`- Trade-in value: $${quoteContext.tradeInValue.toLocaleString()}`);
  }
  
  if (parts.length === 0) return "";
  
  return `
## CUSTOMER'S QUOTE PROGRESS (Use naturally if relevant - don't announce it):
${parts.join('\n')}
This is background info to help you give personalized answers. Reference their boat specs or quote naturally when relevant, but don't say "I see you have a boat in your quote..." - just use the info conversationally.
`;
}

// Build returning customer context for personalization
function buildReturningCustomerPrompt(previousContext: any): string {
  if (!previousContext || previousContext.totalPreviousChats === 0) return "";
  
  const parts: string[] = [];
  parts.push(`\n## RETURNING CUSTOMER (Use naturally - don't be creepy about it):`);
  parts.push(`This customer has talked with us ${previousContext.totalPreviousChats} time(s) before.`);
  
  if (previousContext.lastVisitDate) {
    parts.push(`Last visit: ${previousContext.lastVisitDate}`);
  }
  
  if (previousContext.recentMotorsViewed?.length > 0) {
    parts.push(`Motors they've looked at: ${previousContext.recentMotorsViewed.slice(0, 3).join(', ')}`);
  }
  
  parts.push(`\nYou can greet them warmly like "Hey, good to hear from you again!" but don't announce that you remember them - just use the context naturally.`);
  
  return parts.join('\n');
}

// Build the dynamic system prompt - OPTIMIZED: no full inventory, uses tools instead
async function buildSystemPrompt(
  motorContext?: { model: string; hp: number; price?: number } | null,
  currentPage?: string | null,
  quoteContext?: any,
  previousSessionContext?: any
) {
  // Only fetch promotions - inventory is accessed via tools
  const promotions = await getActivePromotions();
  const promotionData = formatPromotionData(promotions);
  
  // Current motor context if viewing one
  let currentMotorContext = "";
  if (motorContext) {
    const priceInfo = motorContext.price ? `priced at $${motorContext.price.toLocaleString()} CAD` : '';
    currentMotorContext = `\n## CURRENT MOTOR: ${motorContext.model} (${motorContext.hp}HP) ${priceInfo}\n`;
  }
  
  // Page context
  let pageContext = "";
  if (currentPage) {
    const pageDesc = getPageDescription(currentPage);
    pageContext = `Customer is on ${pageDesc}. `;
  }
  
  // Quote/boat context
  const quoteContextPrompt = buildQuoteContextPrompt(quoteContext);
  
  // Returning customer context
  const returningCustomerPrompt = buildReturningCustomerPrompt(previousSessionContext);

  const systemPrompt = `You're Harris from Harris Boat Works — a friendly Mercury Marine expert in Ontario, Canada.

## VOICE RULES:
- Keep responses SHORT: 1-3 sentences max
- Sound natural, like a friend who knows motors
- Never say "Great question!" or corporate phrases

## WHEN USING TOOLS (IMPORTANT):
When you need to look something up, ALWAYS give a quick acknowledgement FIRST before the tool runs:
- "Let me check on that for you..."
- "One sec, I'll look that up..."
- "Bear with me, just checking..."
- "Let me see what we've got..."
This lets the customer know you're on it. Then use the tool and respond naturally with the info.

## INVENTORY ACCESS:
You have tools to check motors, prices, and availability. Use them when customers ask about specific motors.
${currentMotorContext}
${MODEL_SUFFIX_GUIDE}
${promotionData}
${quoteContextPrompt}
${returningCustomerPrompt}

## KEY KNOWLEDGE:
- FourStroke: Fuel efficient, quiet, perfect for fishing/pontoons
- Pro XS: Racing/tournament performance
- SeaPro: Commercial/heavy duty  
- Verado: Premium supercharged performance

## POLICIES:
${pageContext}- All prices in CAD. No delivery - in-person pickup only at Gores Landing, ON.
- Guide customers to quote builder for exact pricing.`;

  return systemPrompt;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse body first to check for warmup
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // No body or invalid JSON, that's fine
    }
    
    // WARMUP SHORTCUT: If this is just a warmup call, return immediately
    // This warms the Deno runtime without expensive DB/ElevenLabs calls
    if (body?.warmup === true) {
      console.log('[Token] Warmup request - returning early (function is warm)');
      return new Response(
        JSON.stringify({ ok: true, warmed: true, timestamp: Date.now() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      console.error('ELEVENLABS_API_KEY is not set');
      throw new Error('ElevenLabs API key not configured');
    }

    // Extract context from body
    const motorContext = body?.motorContext || null;
    const currentPage = body?.currentPage || null;
    const quoteContext = body?.quoteContext || null;
    const previousSessionContext = body?.previousSessionContext || null;

    console.log('Building dynamic system prompt with context:', { motorContext, currentPage, hasQuoteContext: !!quoteContext, hasReturningContext: !!previousSessionContext });
    
    // Build the system prompt with real inventory data, page context, quote context, and returning customer context
    const systemPrompt = await buildSystemPrompt(motorContext, currentPage, quoteContext, previousSessionContext);
    console.log('System prompt built, length:', systemPrompt.length);

    console.log('Requesting conversation token for agent:', ELEVENLABS_AGENT_ID);

    // Request a conversation token from ElevenLabs
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${ELEVENLABS_AGENT_ID}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Conversation token received successfully');

    // Return token AND system prompt for overrides
    return new Response(JSON.stringify({ 
      token: data.token,
      systemPrompt: systemPrompt,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating conversation token:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
