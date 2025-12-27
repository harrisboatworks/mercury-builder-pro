import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Detect category for optimized Perplexity querying
function detectCategory(query: string): string {
  const lowerQuery = query.toLowerCase();
  
  // Check for accessories/boat equipment first (non-Mercury products)
  if (/trolling\s*motor|minn\s*kota|motorguide|fish\s*finder|depth\s*finder|gps|chartplotter|garmin|lowrance|humminbird|rod\s*holder|livewell|trailer|anchor|dock|mooring|life\s*jacket|pfd|seat|pedestal|bimini|cover|fender|bilge\s*pump|electronics/.test(lowerQuery)) {
    return 'accessories';
  }
  
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
    accessories: `Search Harris Boat Works marine catalogue (marinecatalogue.ca) for boat accessories and equipment. Include:
- Product name and description
- Price if available (CAD)
- Catalogue section/page reference if possible
- Available brands/options
Keep response conversational and under 75 words.
Query: ${query}`,

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

    // Determine search domains based on category
    const searchDomains = category === 'accessories' 
      ? ['marinecatalogue.ca', 'mercurymarine.com']
      : ['mercurymarine.com'];
    
    const systemPrompt = category === 'accessories'
      ? `You are a helpful marine accessories expert for Harris Boat Works. Search their catalogue at marinecatalogue.ca. Give short, conversational answers for voice. Under 75 words. Include pricing and where to find items when available.`
      : `You are a Mercury Marine expert. Give short, direct answers for voice. Under 50 words. Include part numbers when asked. If unsure, say so.`;

    // Call Perplexity API with search focused on appropriate domains
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
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: category === 'accessories' ? 200 : 150,
        temperature: 0.1,
        search_domain_filter: searchDomains,
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
