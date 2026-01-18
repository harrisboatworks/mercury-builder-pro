import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Fallback insights by HP range for when Perplexity is unavailable
const getFallbackInsights = (hp: number): string[] => {
  if (hp <= 6) {
    return [
      "Ultra-lightweight design makes this perfect for car-top boats and easy solo launching",
      "The built-in fuel tank means less gear to haul and fewer connections to worry about",
      "Exceptionally quiet operation won't disturb the fish or your neighbors at the dock"
    ];
  } else if (hp <= 15) {
    return [
      "The perfect balance of portability and power for tenders, inflatables, and small aluminum boats",
      "Simple, reliable design means minimal maintenance and years of trouble-free operation",
      "Fuel-sipping efficiency lets you stay on the water longer without refueling"
    ];
  } else if (hp <= 30) {
    return [
      "Smooth 4-stroke power delivers excellent low-end torque for quick hole shots",
      "Electronic fuel injection provides instant, reliable starts in any weather",
      "Compact design fits tight transoms while delivering serious performance"
    ];
  } else if (hp <= 75) {
    return [
      "Proven reliability that commercial operators and guides trust day in, day out",
      "Outstanding fuel economy at cruising speeds means lower operating costs",
      "Quick acceleration gets you to your fishing spot faster"
    ];
  } else if (hp <= 150) {
    return [
      "Tournament-proven performance trusted by competitive anglers across North America",
      "Advanced fuel injection delivers instant throttle response at any RPM",
      "Industry-leading power-to-weight ratio for better boat performance"
    ];
  } else if (hp <= 300) {
    return [
      "V8 power delivers exhilarating acceleration and effortless cruising at any speed",
      "Mercury's legendary reliability is backed by the best warranty in the industry",
      "Digital throttle and shift provides precise, cable-free control"
    ];
  } else {
    return [
      "Flagship V8 performance engineered for serious offshore anglers and center console owners",
      "Joystick Piloting compatibility makes docking and maneuvering effortless",
      "Contra-rotating propellers eliminate torque steer for confident handling"
    ];
  }
};

const buildPerplexityPrompt = (hp: number, model: string, family: string): string => {
  return `Generate exactly 3 compelling one-sentence reasons why boaters love the Mercury ${model} outboard motor.

Focus on practical, real-world benefits that resonate with buyers:
- Reliability and peace of mind
- Performance characteristics (hole shot, fuel economy, top speed)
- Ease of use and maintenance
- Value compared to competitors

Keep each sentence punchy and conversational - like advice from a trusted marine dealer.
Do NOT mention warranty or promotions. Focus on the motor itself.

Format as a JSON array: ["reason 1", "reason 2", "reason 3"]`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { motor } = await req.json();
    
    if (!motor) {
      return new Response(
        JSON.stringify({ error: "Motor data is required", insights: getFallbackInsights(100) }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const hp = motor.hp || motor.horsepower || 100;
    const model = motor.model || `${hp}HP FourStroke`;
    const family = motor.family || 'FourStroke';

    // Try Perplexity if API key is available
    const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");
    
    if (!perplexityKey) {
      console.log("No Perplexity API key, using fallback insights");
      return new Response(
        JSON.stringify({ 
          success: true, 
          insights: getFallbackInsights(hp),
          source: 'fallback'
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    try {
      const perplexityResponse = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${perplexityKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sonar",
          messages: [
            {
              role: "system",
              content: "You are a Mercury Marine expert helping create engaging marketing content for motor specification sheets. Keep responses concise and benefit-focused. Always respond with valid JSON."
            },
            {
              role: "user",
              content: buildPerplexityPrompt(hp, model, family)
            }
          ],
          temperature: 0.7,
          max_tokens: 300,
          search_domain_filter: [
            "mercurymarine.com",
            "boatingmag.com",
            "sportfishingmag.com",
            "bassmaster.com"
          ],
          search_recency_filter: "year"
        }),
      });

      if (!perplexityResponse.ok) {
        console.error("Perplexity API error:", perplexityResponse.status);
        return new Response(
          JSON.stringify({ 
            success: true, 
            insights: getFallbackInsights(hp),
            source: 'fallback'
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const perplexityData = await perplexityResponse.json();
      const content = perplexityData.choices?.[0]?.message?.content || "";

      // Parse JSON array from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const insights = JSON.parse(jsonMatch[0]);
          if (Array.isArray(insights) && insights.length >= 3) {
            return new Response(
              JSON.stringify({ 
                success: true, 
                insights: insights.slice(0, 3),
                source: 'perplexity',
                citations: perplexityData.citations || []
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        } catch (parseError) {
          console.error("Failed to parse Perplexity JSON:", parseError);
        }
      }

      // Fallback if parsing failed
      return new Response(
        JSON.stringify({ 
          success: true, 
          insights: getFallbackInsights(hp),
          source: 'fallback'
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } catch (perplexityError) {
      console.error("Perplexity request failed:", perplexityError);
      return new Response(
        JSON.stringify({ 
          success: true, 
          insights: getFallbackInsights(hp),
          source: 'fallback'
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        insights: getFallbackInsights(100),
        source: 'fallback'
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
