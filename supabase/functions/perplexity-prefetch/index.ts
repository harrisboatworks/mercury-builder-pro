import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Simple in-memory cache with 24-hour TTL
const insightsCache = new Map<string, { insights: string[]; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface MotorContext {
  id?: string;
  hp: number;
  model: string;
  family?: string;
}

// Generate a cache key for the motor
function getCacheKey(motor: MotorContext): string {
  return `${motor.hp}-${motor.family || 'unknown'}-${motor.model}`.toLowerCase().replace(/\s+/g, '-');
}

// Get current season for seasonal context
function getCurrentSeason(): 'winter' | 'spring' | 'summer' | 'fall' {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}

// Build insight-generating queries based on motor characteristics
function buildInsightQueries(motor: MotorContext): string[] {
  const queries: string[] = [];
  const hp = motor.hp;
  const family = motor.family?.toLowerCase() || '';
  const model = motor.model?.toLowerCase() || '';
  const season = getCurrentSeason();
  
  // Base query about this specific motor
  queries.push(`Mercury ${hp}HP ${motor.family || 'outboard'} key advantages unique selling points features`);
  
  // HP-specific insights
  if (hp <= 6) {
    queries.push(`Mercury portable outboard ${hp}HP weight portability storage tips`);
    queries.push(`${hp}HP outboard motor best uses applications small boat tender dinghy`);
  } else if (hp <= 15) {
    queries.push(`Mercury ${hp}HP outboard fuel economy trolling performance`);
    queries.push(`${hp}HP outboard motor aluminum fishing boat recommended`);
  } else if (hp <= 30) {
    queries.push(`Mercury ${hp}HP outboard break-in procedure first 10 hours recommendations`);
    queries.push(`${hp}HP outboard motor pontoon fishing boat performance`);
  } else if (hp <= 60) {
    queries.push(`Mercury ${hp}HP FourStroke reliability features technology`);
    queries.push(`${hp}HP outboard motor versatility performance medium boat`);
  } else if (hp <= 115) {
    queries.push(`Mercury ${hp}HP outboard WOT RPM fuel consumption specs`);
    queries.push(`${hp}HP outboard performance features mid-range boat`);
  } else if (hp <= 200) {
    queries.push(`Mercury ${hp}HP Verado ProXS technology advantages`);
    queries.push(`${hp}HP outboard big water performance capabilities`);
  } else {
    queries.push(`Mercury ${hp}HP Verado high horsepower technology features`);
    queries.push(`${hp}HP outboard offshore performance tournament fishing`);
  }
  
  // Family-specific insights
  if (family.includes('verado')) {
    queries.push(`Mercury Verado supercharged advantages quiet operation benefits`);
  } else if (family.includes('proxs') || model.includes('pro xs')) {
    queries.push(`Mercury Pro XS performance racing tournament fishing advantages`);
  } else if (family.includes('seapro') || model.includes('seapro')) {
    queries.push(`Mercury SeaPro commercial reliability heavy duty applications`);
  } else if (family.includes('prokicker') || model.includes('kicker')) {
    queries.push(`Mercury ProKicker trolling kicker motor advantages features`);
  }
  
  // Seasonal tips
  if (season === 'spring') {
    queries.push(`Mercury outboard spring commissioning checklist startup tips`);
  } else if (season === 'fall') {
    queries.push(`Mercury outboard winterization storage preparation tips`);
  } else if (season === 'summer') {
    queries.push(`Mercury outboard hot weather operation cooling tips`);
  }
  
  // Return top 3-4 most relevant queries
  return queries.slice(0, 4);
}

// Call Perplexity API to get insights
async function fetchInsightsFromPerplexity(query: string, motor: MotorContext): Promise<string | null> {
  const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
  if (!PERPLEXITY_API_KEY) {
    console.error('[prefetch] Missing PERPLEXITY_API_KEY');
    return null;
  }

  try {
    const systemPrompt = `You are a Mercury Marine expert providing quick, interesting facts for customers browsing motors.
Generate ONE short insight (1-2 sentences max) that would be interesting to someone considering this motor.
Focus on practical benefits, unique features, or lesser-known advantages.
Be conversational and engaging - this will be used as a "Did you know?" tip.
Don't be salesy. Be genuinely helpful.
Examples of good insights:
- "The ${motor.hp}HP's break-in procedure only takes 10 hours - vary your throttle and avoid sustained WOT."
- "At typical cruise, this motor sips about X gallons per hour - great for full-day fishing."
- "The built-in fuel tank means one less thing to store after your trip."`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        max_tokens: 100,
        temperature: 0.3,
        search_domain_filter: ['mercurymarine.com', 'anyflip.com/bookcase/iuuc', 'boatingmag.com'],
        search_recency_filter: 'year'
      }),
    });

    if (!response.ok) {
      console.error(`[prefetch] Perplexity API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (content) {
      // Clean up the response - remove any markdown, quotes, etc.
      return content
        .replace(/^["']|["']$/g, '')
        .replace(/^(Did you know\??:?\s*)/i, '')
        .trim();
    }
    return null;
  } catch (error) {
    console.error('[prefetch] Error fetching insight:', error);
    return null;
  }
}

// Generate fallback insights if Perplexity fails
function generateFallbackInsights(motor: MotorContext): string[] {
  const hp = motor.hp;
  const fallbacks: string[] = [];
  
  if (hp <= 6) {
    fallbacks.push(`At ${hp}HP, this is one of the most portable motors in Mercury's lineup - easy to transport and store.`);
    fallbacks.push(`Portables like this have a built-in fuel tank, so there's no extra gear to manage.`);
  } else if (hp <= 15) {
    fallbacks.push(`The ${hp}HP is a popular choice for aluminum fishing boats - great balance of power and fuel economy.`);
    fallbacks.push(`These smaller motors are fantastic for trolling - quiet and easy on fuel.`);
  } else if (hp <= 30) {
    fallbacks.push(`The first 10 hours are the break-in period - vary your throttle and avoid prolonged wide-open throttle.`);
    fallbacks.push(`A 25L fuel tank is included with tiller models - one less thing to buy.`);
  } else if (hp <= 60) {
    fallbacks.push(`The ${hp}HP FourStroke is known for reliability - Mercury's engineering shines in this range.`);
    fallbacks.push(`This is a versatile power range - works great on everything from fishing boats to small pontoons.`);
  } else if (hp <= 115) {
    fallbacks.push(`Mid-range motors like the ${hp}HP offer excellent fuel efficiency at cruise speeds.`);
    fallbacks.push(`Mercury's fuel injection system optimizes performance across all RPM ranges.`);
  } else {
    fallbacks.push(`High-horsepower Mercury motors feature advanced technologies like adaptive speed control.`);
    fallbacks.push(`Verado motors are supercharged - that's why they feel so responsive at any speed.`);
  }
  
  return fallbacks.slice(0, 3);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { motor } = await req.json();
    
    if (!motor || !motor.hp) {
      return new Response(
        JSON.stringify({ success: false, error: 'Motor context with HP is required', insights: [] }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cacheKey = getCacheKey(motor);
    console.log(`[prefetch] Request for motor: ${motor.hp}HP ${motor.family || ''} ${motor.model || ''}, key: ${cacheKey}`);

    // Check cache first
    const cached = insightsCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
      console.log(`[prefetch] Cache hit for ${cacheKey}`);
      return new Response(
        JSON.stringify({ success: true, insights: cached.insights, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate queries and fetch insights in parallel
    const queries = buildInsightQueries(motor);
    console.log(`[prefetch] Fetching ${queries.length} insights for ${cacheKey}`);
    
    const insightPromises = queries.map(q => fetchInsightsFromPerplexity(q, motor));
    const results = await Promise.all(insightPromises);
    
    // Filter out nulls and deduplicate
    let insights = results
      .filter((r): r is string => r !== null && r.length > 20)
      .filter((insight, index, self) => 
        self.findIndex(i => i.toLowerCase().includes(insight.toLowerCase().slice(0, 30))) === index
      );
    
    // If we didn't get enough insights, add fallbacks
    if (insights.length < 3) {
      const fallbacks = generateFallbackInsights(motor);
      insights = [...insights, ...fallbacks].slice(0, 5);
    }

    // Cache the results
    insightsCache.set(cacheKey, { insights, timestamp: Date.now() });
    console.log(`[prefetch] Cached ${insights.length} insights for ${cacheKey}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        insights,
        cached: false,
        motorContext: {
          hp: motor.hp,
          family: motor.family,
          model: motor.model
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[prefetch] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        insights: []
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
