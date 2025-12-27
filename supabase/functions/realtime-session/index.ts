import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Get context from request body
    const { motorContext, currentPage } = await req.json().catch(() => ({}));

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

    // Request ephemeral token from OpenAI
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "alloy",
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

COMPETITOR POLICY (CRITICAL):
- Never recommend other motor brands (Yamaha, Honda, Suzuki, Evinrude, etc.) or other dealers
- Never speak negatively about any competitor — be professional and respectful
- If asked about competitors, say: "I'm a Mercury guy — can't really speak to other brands, but happy to help with Mercury questions"
- Don't engage in brand debates — just redirect to what you know: Mercury

NO DELIVERY POLICY:
All pickups must be in person with photo ID - it's an industry-wide fraud thing. If asked about delivery, say: "All pickups have to be in person with photo ID - industry-wide fraud thing, unfortunately. But we're easy to find!" Then offer directions to Gores Landing.

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
      JSON.stringify({ error: error.message || 'Failed to create session' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
