import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Detect category for optimized Perplexity querying
function detectCategory(query: string): string {
  const lowerQuery = query.toLowerCase();
  
  if (/part\s*number|part\s*#|filter|spark\s*plug|prop|propeller|impeller|thermostat|gasket|seal|oil\s*filter|fuel\s*filter/.test(lowerQuery)) {
    return 'parts';
  }
  if (/weight|dimension|fuel\s*consumption|displacement|bore|stroke|gear\s*ratio|rpm|compression|alternator|battery/.test(lowerQuery)) {
    return 'specs';
  }
  if (/warranty|coverage|extended|protection|claim/.test(lowerQuery)) {
    return 'warranty';
  }
  if (/maintenance|service|interval|oil\s*change|winteriz|flush|fogging|lube|grease/.test(lowerQuery)) {
    return 'maintenance';
  }
  if (/problem|issue|won't|doesn't|not\s*working|error|alarm|beep|overheat|stall|rough/.test(lowerQuery)) {
    return 'troubleshooting';
  }
  
  return 'general';
}

// Build optimized prompt based on category
function buildPrompt(query: string, category: string, motorContext?: string): string {
  const motorRef = motorContext ? `for a ${motorContext}` : 'for Mercury outboard motors';
  
  const categoryPrompts: Record<string, string> = {
    parts: `Find the exact Mercury Marine part number ${motorRef}. Include:
- Part number (e.g., 35-877769K01)
- OEM vs aftermarket options if relevant
- Compatible models/years
Query: ${query}`,
    
    specs: `Provide verified technical specifications ${motorRef}. Include exact numbers with units.
Query: ${query}`,
    
    warranty: `Explain Mercury Marine warranty coverage ${motorRef}. Include:
- Standard coverage period
- What's covered/excluded
- Extended warranty options
Query: ${query}`,
    
    maintenance: `Provide maintenance information ${motorRef}. Include:
- Recommended intervals
- Specific products/fluids needed
- Part numbers if relevant
Query: ${query}`,
    
    troubleshooting: `Help diagnose this issue ${motorRef}. Include:
- Likely causes
- Basic checks owner can do
- When to see a dealer (always recommend professional service for repairs)
Query: ${query}`,
    
    general: `Answer this question ${motorRef} with verified information.
Query: ${query}`
  };
  
  return categoryPrompts[category] || categoryPrompts.general;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, category: providedCategory, motor_context } = await req.json();
    
    if (!query) {
      return new Response(
        JSON.stringify({ success: false, error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
    if (!PERPLEXITY_API_KEY) {
      console.error('[voice-perplexity] Missing PERPLEXITY_API_KEY');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Perplexity not configured',
          fallback: "I don't have access to verify that right now. Let me connect you with our service team who can confirm those details."
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Auto-detect category if not provided
    const category = providedCategory || detectCategory(query);
    console.log(`[voice-perplexity] Query: "${query}", Category: ${category}, Motor: ${motor_context || 'none'}`);

    // Build optimized prompt
    const prompt = buildPrompt(query, category, motor_context);

    // Call Perplexity API with search focused on Mercury/boating
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
            content: `You are a Mercury Marine technical expert. Provide concise, accurate answers optimized for voice responses.
Keep answers under 100 words unless technical detail requires more.
Always cite official sources when possible (mercurymarine.com, owner's manuals).
For part numbers, always verify against Mercury parts catalogs.
For troubleshooting, always recommend professional service for repairs.
If you're not 100% certain, say so - it's better to recommend confirming with a dealer.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        search_domain_filter: ['mercurymarine.com', 'mercury.com', 'boats.com'],
        search_recency_filter: 'year'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[voice-perplexity] API error: ${response.status}`, errorText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Perplexity API error: ${response.status}`,
          fallback: "I couldn't verify that information right now. Our team can help confirm the details."
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || '';
    const citations = data.citations || [];

    console.log(`[voice-perplexity] Got answer (${answer.length} chars), ${citations.length} citations`);

    // Determine confidence based on citations and content
    let confidence: 'high' | 'medium' | 'low' = 'medium';
    if (citations.some((c: string) => c.includes('mercurymarine.com'))) {
      confidence = 'high';
    } else if (citations.length === 0) {
      confidence = 'low';
    }

    return new Response(
      JSON.stringify({
        success: true,
        answer,
        sources: citations,
        confidence,
        category
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[voice-perplexity] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        fallback: "I ran into an issue looking that up. Let me have someone get back to you with the details."
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
