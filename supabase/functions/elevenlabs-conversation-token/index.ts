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

// Fetch current motor inventory
async function getCurrentMotorInventory() {
  try {
    const { data: motors, error } = await supabase
      .from('motor_models')
      .select('model, model_display, model_number, horsepower, dealer_price, msrp, availability, motor_type, year, in_stock')
      .order('horsepower', { ascending: true })
      .limit(100);
    
    if (error) {
      console.error('Error fetching motors:', error);
      return [];
    }
    return motors || [];
  } catch (error) {
    console.error('Error in getCurrentMotorInventory:', error);
    return [];
  }
}

// Fetch active promotions
async function getActivePromotions() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data: promotions, error } = await supabase
      .from('promotions')
      .select('name, discount_percentage, discount_fixed_amount, bonus_title, bonus_description, end_date')
      .eq('is_active', true)
      .or(`start_date.is.null,start_date.lte.${today}`)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .order('priority', { ascending: false })
      .limit(5);
    
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

// Format motor data for the prompt
function formatMotorData(motors: any[]) {
  if (!motors.length) return "\n[No inventory data available]\n";
  
  let formatted = "\n## CURRENT INVENTORY (REAL-TIME DATA):\n";
  formatted += "You have access to live inventory and pricing. Use these exact prices when customers ask.\n\n";
  
  motors.forEach(motor => {
    const price = motor.dealer_price || motor.msrp;
    const priceStr = price ? `$${Math.round(price).toLocaleString()} CAD` : 'Call for pricing';
    const stockStr = motor.in_stock ? 'IN STOCK' : (motor.availability || 'Available');
    const displayName = motor.model_display || motor.model;
    formatted += `- ${displayName} - ${motor.horsepower}HP - ${priceStr} - ${stockStr}\n`;
  });
  
  formatted += `
## MODEL SUFFIX DECODER (CRITICAL - Use this to explain models to customers):

**Start Type:**
- M = Manual pull-start
- E = Electric start (with manual backup)

**Shaft Length (Transom Height):**
- H = Short shaft (15" transom - rare, mostly dinghies)
- L = Long shaft (20" transom - most common for aluminum boats)
- XL = Extra-long shaft (25" transom - fiberglass boats, larger vessels)
- XXL = Extra-extra-long (30" transom - large offshore boats)

**Steering/Control Type:**
- H (at end) = Tiller handle (operator steers from motor)
- PT = Power Trim (hydraulic trim/tilt)
- No suffix = Remote steering (console-mounted controls)

**Common Combinations Explained:**
- MH = Manual start, tiller Handle (simplest, budget-friendly)
- ELH = Electric start, Long shaft, tiller Handle (popular for fishing boats)
- ELPT = Electric start, Long shaft, Power Trim (remote steering)
- EXLPT = Electric start, Extra-Long shaft, Power Trim

**Special Designations:**
- CT = Command Thrust (high-thrust lower unit for heavy boats/pontoons)
- DTS = Digital Throttle & Shift (fly-by-wire controls)
- CMS = Command Module System
- JPO = Jet Pump Outboard

**Example Conversations:**
- Customer: "What's the difference between 9.9MH and 9.9ELH?"
  You: "The MH is manual pull-start with a tiller. The ELH adds electric start - just turn a key. Both are tiller-steered for 20-inch transoms. The electric start is about $800 more but worth it if you're starting the motor a lot."

- Customer: "I have a pontoon, what do I need?"
  You: "For pontoons I'd look at the Command Thrust models - they have CT in the name. The bigger prop pushes more water at low speeds which is perfect for heavy boats like pontoons."
`;
  
  return formatted;
}

// Format promotion data for the prompt
function formatPromotionData(promotions: any[]) {
  if (!promotions.length) return "";
  
  let formatted = "\n## CURRENT PROMOTIONS:\n";
  
  promotions.forEach(promo => {
    formatted += `**${promo.name}**\n`;
    if (promo.discount_percentage > 0) {
      formatted += `- ${promo.discount_percentage}% off\n`;
    }
    if (promo.discount_fixed_amount > 0) {
      formatted += `- $${promo.discount_fixed_amount} off\n`;
    }
    if (promo.bonus_title) {
      formatted += `- Bonus: ${promo.bonus_title}\n`;
    }
    if (promo.end_date) {
      formatted += `- Valid until: ${promo.end_date}\n`;
    }
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

// Build the dynamic system prompt with real inventory data
async function buildSystemPrompt(
  motorContext?: { model: string; hp: number; price?: number } | null,
  currentPage?: string | null,
  quoteContext?: any
) {
  const [motors, promotions] = await Promise.all([
    getCurrentMotorInventory(),
    getActivePromotions()
  ]);
  
  const motorData = formatMotorData(motors);
  const promotionData = formatPromotionData(promotions);
  
  // Add specific motor context if provided
  let currentMotorContext = "";
  if (motorContext) {
    const priceInfo = motorContext.price ? `priced at $${motorContext.price.toLocaleString()} CAD` : '';
    currentMotorContext = `\n## CURRENT CONTEXT:\nThe user is currently viewing the ${motorContext.model} (${motorContext.hp}HP) ${priceInfo}. Focus on this motor when answering questions unless they ask about something else.\n`;
  }
  
  // Add page context as subtle background info
  let pageContext = "";
  if (currentPage) {
    const pageDesc = getPageDescription(currentPage);
    pageContext = `\n## PAGE CONTEXT (Background - don't proactively mention):\nThe customer is currently on ${pageDesc}. This is FYI only - let them lead the conversation. Don't say "I see you're on..." unless they ask where they are or need navigation help.\n`;
  }
  
  // Add quote/boat context
  const quoteContextPrompt = buildQuoteContextPrompt(quoteContext);

  const systemPrompt = `You're Harris from Harris Boat Works — a friendly, knowledgeable Mercury Marine expert who sounds like a friend who happens to know everything about outboard motors. You work at an authorized Mercury Premier dealer in Ontario, Canada.

## VOICE CONVERSATION RULES:
1. Keep responses SHORT - 1-3 sentences max for voice
2. Sound natural and conversational, like talking to a friend
3. NEVER say "Great question!" or "Absolutely!" or other corporate phrases
4. Match their energy - short question = short answer
5. It's OK to not know something — just say so naturally
6. Don't end every response with a question

## NATURAL PHRASES TO USE:
- "Yeah, that'd work great for..."
- "Honestly, I'd go with..."
- "Here's the deal..."
- "For what you're describing, I'd look at..."
- "That's a solid choice"

## PRICING RULES (CRITICAL):
- When asked about pricing, give the EXACT price from inventory if available
- Always say "Canadian dollars" or "CAD" when mentioning prices
- If price isn't in inventory, say "I'd need to check the current price on that one"
- Guide to quote builder for exact quotes: "Want the exact breakdown? Check our quote builder"

## Your Expertise:
- Mercury outboard motors, features, and specifications
- Helping customers find the right motor for their boat
- Current inventory and promotions
- Repower expertise (70% of benefit for 30% of cost)

${currentMotorContext}
${pageContext}
${quoteContextPrompt}
${motorData}
${promotionData}

## KEY KNOWLEDGE:
- FourStroke: Fuel efficient, quiet, perfect for fishing/pontoons
- Pro XS: Racing/tournament performance
- SeaPro: Commercial/heavy duty
- Verado: Premium supercharged performance

## NO DELIVERY POLICY:
We DO NOT deliver motors. All pickups must be in-person at Gores Landing with valid ID.
If asked about delivery: "We don't do delivery - all pickups have to be in person with ID. It's an industry thing - too many scams. But we're easy to get to!"

## LOCATION:
Harris Boat Works, Gores Landing, Ontario, Canada. We serve Canadian customers with Canadian pricing.`;

  return systemPrompt;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      console.error('ELEVENLABS_API_KEY is not set');
      throw new Error('ElevenLabs API key not configured');
    }

    // Parse request body for motor, page, and quote context
    let motorContext = null;
    let currentPage = null;
    let quoteContext = null;
    try {
      const body = await req.json();
      motorContext = body?.motorContext || null;
      currentPage = body?.currentPage || null;
      quoteContext = body?.quoteContext || null;
    } catch {
      // No body or invalid JSON, that's fine
    }

    console.log('Building dynamic system prompt with context:', { motorContext, currentPage, hasQuoteContext: !!quoteContext });
    
    // Build the system prompt with real inventory data, page context, and quote context
    const systemPrompt = await buildSystemPrompt(motorContext, currentPage, quoteContext);
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
