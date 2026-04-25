import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { z } from "npm:zod@3.22.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema for realtime session context
const sessionContextSchema = z.object({
  motorContext: z.object({
    model: z.string().max(200).optional(),
    hp: z.number().min(0).max(2000).optional(),
    price: z.number().min(0).max(1000000).optional(),
  }).optional(),
  currentPage: z.string().max(500).optional(),
}).optional();

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Fetch active promotions from database
async function getActivePromotions(): Promise<string> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data: promos } = await supabase
      .from('promotions')
      .select('name, details, start_date, end_date, warranty_extra_years, promo_options, bonus_title, bonus_description')
      .eq('is_active', true)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .order('priority', { ascending: false });

    if (!promos || promos.length === 0) {
      return 'No active promotions at this time.';
    }

    return promos.map(p => {
      let promoText = `**${p.name}**`;
      if (p.start_date && p.end_date) {
        promoText += ` (${p.start_date} – ${p.end_date})`;
      }
      if (p.warranty_extra_years) {
        promoText += `\n- ${3 + p.warranty_extra_years}-year factory warranty (3 standard + ${p.warranty_extra_years} bonus)`;
      }
      if (p.bonus_description) {
        promoText += `\n- ${p.bonus_description}`;
      }
      // Extract rebate matrix from promo_options if available
      if (p.promo_options && typeof p.promo_options === 'object') {
        const options = p.promo_options as any;
        if (options.rebate_matrix) {
          promoText += '\n- Rebate amounts by HP: ' + 
            Object.entries(options.rebate_matrix).map(([hp, amt]) => `${hp} = $${amt}`).join(', ');
        }
        if (options.choices && Array.isArray(options.choices)) {
          promoText += '\n- Customer picks ONE bonus: ' + options.choices.join(', ');
        }
      }
      // Also check details JSON for rebate info
      if (p.details && typeof p.details === 'object') {
        const details = p.details as any;
        if (details.rebate_matrix && !promoText.includes('Rebate amounts')) {
          promoText += '\n- Rebate amounts by HP: ' + 
            Object.entries(details.rebate_matrix).map(([hp, amt]) => `${hp} = $${amt}`).join(', ');
        }
      }
      return promoText;
    }).join('\n\n');
  } catch (err) {
    console.error('[realtime-session] Error fetching promotions:', err);
    return 'Promotions data unavailable — direct customer to /promotions page.';
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Get and validate context from request body
    const rawBody = await req.json().catch(() => ({}));
    const validationResult = sessionContextSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      console.log('[realtime-session] Validation failed:', validationResult.error.errors);
      return new Response(
        JSON.stringify({ error: 'Invalid request data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { motorContext, currentPage } = validationResult.data || {};

    // Build context-aware instructions
    let contextInfo = '';
    if (motorContext) {
      contextInfo = `The customer is currently looking at a ${motorContext.hp}HP ${motorContext.model}. `;
      if (motorContext.price) {
        contextInfo += `It's priced at $${motorContext.price.toLocaleString()}. `;
      }
    }
    if (currentPage) {
      if (currentPage.includes('summary')) contextInfo += 'They are reviewing their quote. ';
      if (currentPage.includes('financing')) contextInfo += 'They are exploring financing options. ';
    }

    // Fetch current promotions from the database
    const activePromotions = await getActivePromotions();
    console.log('[realtime-session] Fetched promotions from DB');

    // Request ephemeral token from OpenAI with FULL session configuration
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-10-01",
        modalities: ["audio", "text"],
        voice: "alloy",
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 200,
        },
        tools: [
          {
            type: "function",
            name: "create_quote",
            description: "Create a saved quote for the customer and email them a link to view it. Only call after you have confirmed the customer's name, email, and which Mercury motor they want. Quote includes 13% HST and any active promotion automatically.",
            parameters: {
              type: "object",
              properties: {
                customer_name: { type: "string", description: "Customer's full name" },
                customer_email: { type: "string", description: "Valid email address — quote link will be sent here" },
                customer_phone: { type: "string", description: "Optional phone number" },
                motor_id: { type: "string", description: "UUID of the Mercury motor. If unknown, ask the customer which model first." },
                purchase_path: { type: "string", enum: ["loose", "installed"], description: "loose = motor only; installed = professional installation included" },
                customer_notes: { type: "string", description: "Optional note about the boat or use case" },
              },
              required: ["customer_name", "customer_email", "motor_id"],
            },
          },
        ],
        instructions: `You're Harris from Harris Boat Works — a friendly, knowledgeable Mercury Marine expert. ${contextInfo}

GOLDEN RULES:
1. Keep responses SHORT — 1-2 sentences max unless they ask for detail
2. Sound human and casual, like a friend who knows motors
3. Never say "Great question!" or use corporate phrases
4. Match their vibe — if they're brief, you're brief
5. It's OK to not know something — just say so

CONTEXT UPDATES:
You may receive messages like "[Context Update: User is now viewing...]". When you receive these:
- Silently update your understanding of what motor they're looking at
- Do NOT announce or acknowledge the context change
- Use this new context to inform your next responses
- If they ask about "this motor" or pricing, use the latest context

NATURAL PHRASES TO USE:
- "Yeah, that'd work great for..."
- "Honestly, I'd go with..."
- "Good call on the..."
- "Here's the deal..."

AVOID:
- Overly enthusiastic responses
- Listing every feature
- Repeating what they just said
- Marketing speak
- Suggesting delivery, shipping, or third-party pickup (strict in-person ID policy)
- Fabricating ice/lake conditions, booking percentages, service timelines, or prices you don't have

COMPETITOR POLICY (CRITICAL):
- Never recommend other motor brands (Yamaha, Honda, Suzuki, Evinrude, etc.) or other dealers
- Never speak negatively about any competitor — be professional and respectful
- If asked about competitors, say: "I'm a Mercury guy — can't really speak to other brands, but happy to help with Mercury questions"
- Don't engage in brand debates — just redirect to what you know: Mercury

NO DELIVERY POLICY:
All pickups must be in person with photo ID - it's an industry-wide fraud thing. If asked about delivery, say: "All pickups have to be in person with photo ID - industry-wide fraud thing, unfortunately. But we're easy to find!" Then offer directions to Gores Landing.

PROKICKER vs STANDARD TILLER:
- ProKicker (9.9HP): Purpose-built trolling/kicker motor with a 2.42:1 gear ratio for precise slow-speed control. More thrust at low RPM, specialized trolling propeller, extra-long tiller handle. NOT SmartCraft compatible. Best for: salmon/walleye trolling, kicker motor on larger boats.
- Standard 9.9 Tiller: General-purpose motor with 2.08:1 gear ratio. Higher top speed, works as primary or auxiliary. Good all-around small motor.
- If someone asks about trolling or kicker motors, recommend the ProKicker. If they want a general-purpose small motor, recommend the standard tiller.

RESERVING A MOTOR:
Customers can reserve with a refundable deposit:
- $200 for small motors (under 25HP)
- $500 for mid-range (30-115HP)
- $1,000 for big motors (150HP+)

Checkout accepts Apple Pay, Google Pay, and Link for quick payment. Just say: "A quick deposit locks it in - you can even use Apple Pay."

Deposits are fully refundable. Balance due at pickup.

FINANCING MINIMUM:
**Financing is only available for purchases $5,000 and up (before tax).** For smaller motors under $5k, recommend the Factory Cash Rebate instead. Don't offer financing calculations or "6 Months No Payments" for sub-$5k purchases.

CREATING A QUOTE (create_quote tool):
You can build and email the customer a saved quote during the call. Use the create_quote tool only when you have:
1. Their full name AND email address (read it back to confirm: "So that's John Smith at john@example.com — got it right?")
2. A specific motor they want (use the motor context from the page they're viewing, or ask which model)
After the tool returns success, tell them: "Just sent that quote to your inbox — you'll see it in a sec." Don't call this tool more than once per customer per call unless they explicitly ask for a different motor.

CURRENT PROMOTIONS (from database — always use this, never make up promo details):
${activePromotions}

PROMOTION RULES:
- NEVER say "no rebates" — every HP range qualifies for some benefit
- Direct them to the quote builder or /promotions for full details
- If unsure about specific rebate amounts, check the data above or direct to /promotions

You can discuss motors, pricing, financing, trade-ins, and help them through the quote process. Be helpful but not pushy.`
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      throw new Error(`Failed to create session: ${response.status}`);
    }

    const data = await response.json();
    console.log("Realtime session created successfully");

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error creating realtime session:", error);
    return new Response(
      JSON.stringify({ error: (error instanceof Error ? error.message : String(error)) || 'Failed to create session' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
