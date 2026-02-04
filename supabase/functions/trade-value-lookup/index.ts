import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-session-id',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

interface TradeValueRequest {
  brand: string;
  year: number;
  horsepower: number;
  model?: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
}

interface TradeValueResponse {
  success: boolean;
  low?: number;
  high?: number;
  retailLow?: number;
  retailHigh?: number;
  sources?: string[];
  rawResponse?: string;
  error?: string;
  confidence: 'high' | 'medium' | 'low';
}

// Parse trade value from Perplexity response
function parseTradeValue(response: string): { 
  low: number; 
  high: number; 
  retailLow?: number;
  retailHigh?: number;
} | null {
  // Match patterns like "$8,500 - $9,500" or "8500-9500 CAD" or "$8,500 to $9,500"
  const patterns = [
    // Trade-in specific patterns
    /trade[- ]?in[^:]*:\s*\$?([\d,]+)\s*[-–to]+\s*\$?([\d,]+)/i,
    /wholesale[^:]*:\s*\$?([\d,]+)\s*[-–to]+\s*\$?([\d,]+)/i,
    // Generic range patterns
    /\$?([\d,]+)\s*[-–to]+\s*\$?([\d,]+)\s*(?:CAD|Canadian)?/i,
    // Single value pattern (will use as both low and high with margin)
    /(?:value|worth|priced?)[^$]*\$?([\d,]+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = response.match(pattern);
    if (match) {
      const value1 = parseInt(match[1].replace(/,/g, ''));
      const value2 = match[2] ? parseInt(match[2].replace(/,/g, '')) : null;
      
      if (value2) {
        return {
          low: Math.min(value1, value2),
          high: Math.max(value1, value2),
        };
      } else if (value1 > 100) {
        // Single value - create a range
        return {
          low: Math.round(value1 * 0.85),
          high: Math.round(value1 * 1.15),
        };
      }
    }
  }
  
  // Try to find retail value separately
  const retailPattern = /retail[^:]*:\s*\$?([\d,]+)\s*[-–to]+\s*\$?([\d,]+)/i;
  const retailMatch = response.match(retailPattern);
  
  return null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY') || Deno.env.get('PERPLEXITY_API_KEY_1');
    
    if (!PERPLEXITY_API_KEY) {
      console.error('PERPLEXITY_API_KEY not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Perplexity API key not configured',
          confidence: 'low' 
        } as TradeValueResponse),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: TradeValueRequest = await req.json();
    const { brand, year, horsepower, model, condition } = body;

    // Validate required fields
    if (!brand || !year || !horsepower || !condition) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: brand, year, horsepower, condition',
          confidence: 'low'
        } as TradeValueResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the search query
    const modelStr = model ? ` ${model}` : '';
    const conditionDescriptions: Record<string, string> = {
      excellent: 'excellent condition, low hours, like new',
      good: 'good condition, well maintained, normal wear',
      fair: 'fair condition, higher hours, needs minor work',
      poor: 'poor condition, needs repair'
    };
    
    const query = `${year} ${brand} ${horsepower}HP${modelStr} outboard motor wholesale trade-in value CAD Canadian dollars. What is the dealer trade-in value for this motor in ${conditionDescriptions[condition]}? Provide a price range in Canadian dollars.`;

    console.log('Perplexity query:', query);

    // Call Perplexity API
    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
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
            content: `You are a marine valuation expert specializing in outboard motors. Provide trade-in values in Canadian dollars (CAD).
                      
IMPORTANT: Return a low-high range for wholesale/trade-in value that a dealer would offer.
Format your response clearly with:
- Trade-in value: $X,XXX - $X,XXX CAD
- Retail price (if available): $X,XXX - $X,XXX CAD

Consider the condition carefully:
- Excellent: Near-new, low hours, full service history
- Good: Normal wear, regularly serviced
- Fair: Higher hours, may need minor work
- Poor: Needs significant repair

Always cite your sources for pricing data.`
          },
          { role: 'user', content: query }
        ],
        search_domain_filter: [
          'boattrader.com', 
          'boats.com', 
          'kijiji.ca',
          'jdpower.com',
          'nada.com',
          'marinebluebook.com',
          'yachtworld.com'
        ],
        search_recency_filter: 'year'
      }),
    });

    if (!perplexityResponse.ok) {
      const errorText = await perplexityResponse.text();
      console.error('Perplexity API error:', perplexityResponse.status, errorText);
      
      // Check for rate limiting
      if (perplexityResponse.status === 429) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Rate limited - please try again in a moment',
            confidence: 'low'
          } as TradeValueResponse),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Perplexity API error: ${perplexityResponse.status}`,
          confidence: 'low'
        } as TradeValueResponse),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await perplexityResponse.json();
    const content = data.choices?.[0]?.message?.content || '';
    const citations = data.citations || [];

    console.log('Perplexity response:', content);
    console.log('Citations:', citations);

    // Parse the response to extract values
    const parsed = parseTradeValue(content);

    if (!parsed) {
      console.warn('Could not parse trade value from response');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Could not extract trade value from market data',
          rawResponse: content,
          sources: citations,
          confidence: 'low'
        } as TradeValueResponse),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine confidence based on response quality
    let confidence: 'high' | 'medium' | 'low' = 'medium';
    if (citations.length >= 2 && parsed.high - parsed.low < parsed.low * 0.5) {
      confidence = 'high';
    } else if (citations.length === 0 || parsed.high - parsed.low > parsed.low) {
      confidence = 'low';
    }

    const response: TradeValueResponse = {
      success: true,
      low: parsed.low,
      high: parsed.high,
      retailLow: parsed.retailLow,
      retailHigh: parsed.retailHigh,
      sources: citations.slice(0, 5), // Limit to 5 sources
      rawResponse: content,
      confidence,
    };

    console.log('Returning trade value:', response);

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Trade value lookup error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        confidence: 'low'
      } as TradeValueResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
