import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-session-id, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// Fallback content by HP range for when Perplexity is unavailable
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

const getFallbackIdealUses = (hp: number): string[] => {
  if (hp <= 6) {
    return ["Sailboat auxiliary power", "Dinghies and tenders", "Car-top boats and canoes", "Inflatable boats"];
  } else if (hp <= 15) {
    return ["Small aluminum fishing boats", "Inflatable boats (RIBs)", "Sailboat auxiliaries", "Jon boats and car-toppers"];
  } else if (hp <= 30) {
    return ["Medium aluminum boats", "Pontoon boats", "Fishing skiffs", "Sailboat auxiliaries"];
  } else if (hp <= 75) {
    return ["Bass boats", "Center consoles", "Pontoon boats", "Multi-species fishing boats"];
  } else if (hp <= 150) {
    return ["Bass boats", "Bay boats", "Flats boats", "Aluminum fishing boats"];
  } else if (hp <= 300) {
    return ["Offshore center consoles", "Bay boats", "Walkaround boats", "Large pontoons"];
  } else {
    return ["Offshore sport fishing", "Large center consoles", "Express cruisers", "Performance boats"];
  }
};

const getFallbackMercuryAdvantages = (hp: number): string[] => {
  const common = [
    "Best-in-class warranty with Get 7 promotion (7 years total)",
    "Mercury CSI Award-winning dealer network",
    "Industry-leading corrosion protection"
  ];
  
  if (hp <= 6) {
    return ["Lightest in class for easy portability", "Twist-grip throttle for intuitive control", ...common.slice(0, 1)];
  } else if (hp <= 15) {
    return ["Front-mounted shift for one-handed operation", "Shallow water drive standard", ...common.slice(0, 1)];
  } else if (hp <= 30) {
    return ["Electronic fuel injection for reliable starts", "Command Thrust gearcase available", ...common.slice(0, 1)];
  } else if (hp <= 75) {
    return ["BigFoot gearcase for superior low-speed thrust", "Adaptive Speed Control maintains RPM under load", ...common.slice(0, 1)];
  } else if (hp <= 150) {
    return ["Advanced Range Optimization (ARO) for fuel savings", "SmartCraft digital integration", ...common.slice(0, 1)];
  } else {
    return ["V8 power in a compact package", "Digital Throttle & Shift (DTS)", ...common.slice(0, 1)];
  }
};

const buildPerplexityPrompt = (hp: number, model: string, family: string): string => {
  return `Generate marketing content for the Mercury ${model} outboard motor (${hp}HP ${family}).

Return a JSON object with these exact fields:

1. "insights" - Array of exactly 3 compelling one-sentence reasons why boaters love this motor. Focus on reliability, performance, fuel economy, or ease of use. Keep each punchy and conversational.

2. "ideal_uses" - Array of 4 specific boat types or activities this motor is perfect for. Be specific (e.g., "16-18ft aluminum fishing boats" not just "boats").

3. "mercury_advantages" - Array of 3 competitive advantages Mercury has over Yamaha, Honda, and Suzuki in this HP class. Focus on unique features, technology, or value - don't mention competitor names directly.

Format as JSON only:
{
  "insights": ["reason 1", "reason 2", "reason 3"],
  "ideal_uses": ["use 1", "use 2", "use 3", "use 4"],
  "mercury_advantages": ["advantage 1", "advantage 2", "advantage 3"]
}`;
};

interface SpecSheetContent {
  insights: string[];
  ideal_uses: string[];
  mercury_advantages: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { motor } = await req.json();
    
    const hp = motor?.hp || motor?.horsepower || 100;
    const model = motor?.model || `${hp}HP FourStroke`;
    const family = motor?.family || 'FourStroke';

    // Default fallback content
    const fallbackContent: SpecSheetContent = {
      insights: getFallbackInsights(hp),
      ideal_uses: getFallbackIdealUses(hp),
      mercury_advantages: getFallbackMercuryAdvantages(hp)
    };

    if (!motor) {
      return new Response(
        JSON.stringify({ 
          error: "Motor data is required", 
          ...fallbackContent,
          source: 'fallback'
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try Perplexity if API key is available
    const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");
    
    if (!perplexityKey) {
      console.log("No Perplexity API key, using fallback content");
      return new Response(
        JSON.stringify({ 
          success: true, 
          ...fallbackContent,
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
              content: "You are a Mercury Marine expert helping create engaging marketing content for motor specification sheets. Always respond with valid JSON only, no markdown or explanation."
            },
            {
              role: "user",
              content: buildPerplexityPrompt(hp, model, family)
            }
          ],
          temperature: 0.7,
          max_tokens: 500,
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
            ...fallbackContent,
            source: 'fallback'
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const perplexityData = await perplexityResponse.json();
      const content = perplexityData.choices?.[0]?.message?.content || "";

      // Parse JSON object from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          
          // Validate and extract each field, falling back as needed
          const result: SpecSheetContent = {
            insights: Array.isArray(parsed.insights) && parsed.insights.length >= 3 
              ? parsed.insights.slice(0, 3) 
              : fallbackContent.insights,
            ideal_uses: Array.isArray(parsed.ideal_uses) && parsed.ideal_uses.length >= 3 
              ? parsed.ideal_uses.slice(0, 4) 
              : fallbackContent.ideal_uses,
            mercury_advantages: Array.isArray(parsed.mercury_advantages) && parsed.mercury_advantages.length >= 3 
              ? parsed.mercury_advantages.slice(0, 3) 
              : fallbackContent.mercury_advantages
          };

          return new Response(
            JSON.stringify({ 
              success: true, 
              ...result,
              source: 'perplexity',
              citations: perplexityData.citations || []
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } catch (parseError) {
          console.error("Failed to parse Perplexity JSON:", parseError);
        }
      }

      // Fallback if parsing failed
      return new Response(
        JSON.stringify({ 
          success: true, 
          ...fallbackContent,
          source: 'fallback'
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } catch (perplexityError) {
      console.error("Perplexity request failed:", perplexityError);
      return new Response(
        JSON.stringify({ 
          success: true, 
          ...fallbackContent,
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
        ideal_uses: getFallbackIdealUses(100),
        mercury_advantages: getFallbackMercuryAdvantages(100),
        source: 'fallback'
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
