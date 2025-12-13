import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { mercurySpecsDatabase, findMercurySpecs } from "../_shared/mercury-specs-database.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapeResult {
  motorId: string;
  model: string;
  hp: number;
  success: boolean;
  source: 'firecrawl' | 'perplexity' | 'static-database' | 'failed';
  updatedFields: string[];
  error?: string;
}

// Extract HP from model string
function extractHp(model: string): number | null {
  const hpMatch = model.match(/(\d+(?:\.\d+)?)\s*(?:hp|HP)/i);
  if (hpMatch) {
    return parseFloat(hpMatch[1]);
  }
  
  // Try to find numbers that look like HP (common patterns)
  const patterns = [
    /^(\d+(?:\.\d+)?)\s+/,  // Number at start
    /\s(\d+(?:\.\d+)?)\s*$/,  // Number at end
    /(?:fourstroke|pro\s*xs|prokicker|verado)\s*(\d+)/i,  // After family name
  ];
  
  for (const pattern of patterns) {
    const match = model.match(pattern);
    if (match) {
      const num = parseFloat(match[1]);
      if (num >= 2 && num <= 600) {
        return num;
      }
    }
  }
  
  return null;
}

// Extract family from model string
function extractFamily(model: string): string | null {
  const modelLower = model.toLowerCase();
  
  if (modelLower.includes('verado')) return 'Verado';
  if (modelLower.includes('pro xs') || modelLower.includes('proxs')) return 'Pro XS';
  if (modelLower.includes('prokicker')) return 'ProKicker';
  if (modelLower.includes('seapro') || modelLower.includes('sea pro')) return 'SeaPro';
  if (modelLower.includes('fourstroke') || modelLower.includes('four stroke')) return 'FourStroke';
  
  return null;
}

// Try to scrape with Firecrawl
async function scrapeWithFirecrawl(url: string, apiKey: string): Promise<any | null> {
  try {
    console.log('Attempting Firecrawl scrape:', url);
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    if (!response.ok) {
      console.log('Firecrawl request failed:', response.status);
      return null;
    }

    const data = await response.json();
    const markdown = data.data?.markdown || data.markdown;
    
    if (!markdown || markdown.length < 100) {
      console.log('Firecrawl: no useful content');
      return null;
    }

    console.log('Firecrawl: got content, length:', markdown.length);
    
    // Extract useful info from markdown
    const result: any = {};
    
    // Try to extract description (first paragraph)
    const descMatch = markdown.match(/^(.{50,500}?)\n\n/s);
    if (descMatch) {
      result.description = descMatch[1].replace(/[#*]/g, '').trim();
    }
    
    // Try to extract features (bullet points)
    const features: string[] = [];
    const bulletMatches = markdown.matchAll(/[-•*]\s+([^\n]+)/g);
    for (const match of bulletMatches) {
      const feature = match[1].trim();
      if (feature.length > 10 && feature.length < 200 && !feature.includes('http')) {
        features.push(feature);
      }
    }
    if (features.length > 0) {
      result.features = features.slice(0, 10);
    }
    
    // Try to extract specs from tables or key-value pairs
    const specs: Record<string, string> = {};
    const specPatterns = [
      /displacement[:\s]+([^\n]+)/i,
      /cylinders?[:\s]+(\d+)/i,
      /weight[:\s]+([^\n]+)/i,
      /gear ratio[:\s]+([^\n]+)/i,
      /fuel system[:\s]+([^\n]+)/i,
      /starting[:\s]+([^\n]+)/i,
    ];
    
    for (const pattern of specPatterns) {
      const match = markdown.match(pattern);
      if (match) {
        const key = pattern.source.split('[')[0].replace(/\\/g, '');
        specs[key] = match[1].trim();
      }
    }
    if (Object.keys(specs).length > 0) {
      result.specifications = specs;
    }
    
    return Object.keys(result).length > 0 ? result : null;
  } catch (error) {
    console.error('Firecrawl error:', error);
    return null;
  }
}

// Try to get info from Perplexity
async function searchWithPerplexity(hp: number, family: string | null, apiKey: string): Promise<any | null> {
  try {
    const query = `Mercury Marine ${hp}hp ${family || 'FourStroke'} outboard specifications features weight displacement`;
    console.log('Searching Perplexity:', query);
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { 
            role: 'system', 
            content: `You are a marine engine data extractor. Return ONLY a valid JSON object with these fields:
{
  "description": "1-2 sentence product description",
  "features": ["feature 1", "feature 2", "...up to 8 features"],
  "specifications": {
    "displacement": "value",
    "cylinders": number,
    "weight": "value with unit",
    "gearRatio": "value",
    "fuelSystem": "type",
    "recommendedFuel": "octane"
  }
}
Do not include any text before or after the JSON.`
          },
          { role: 'user', content: query }
        ],
        search_domain_filter: ['mercurymarine.com'],
      }),
    });

    if (!response.ok) {
      console.log('Perplexity request failed:', response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.log('Perplexity: no content');
      return null;
    }

    // Try to parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('Perplexity: parsed JSON successfully');
        return parsed;
      } catch (e) {
        console.log('Perplexity: JSON parse failed');
      }
    }

    return null;
  } catch (error) {
    console.error('Perplexity error:', error);
    return null;
  }
}

// Main scrape function for a single motor
async function scrapeMotor(
  motor: any,
  supabase: any,
  firecrawlKey: string | undefined,
  perplexityKey: string | undefined
): Promise<ScrapeResult> {
  const result: ScrapeResult = {
    motorId: motor.id,
    model: motor.model,
    hp: motor.horsepower || 0,
    success: false,
    source: 'failed',
    updatedFields: [],
  };

  // Extract HP if not in database
  if (!result.hp) {
    result.hp = extractHp(motor.model) || 0;
  }

  if (!result.hp) {
    result.error = 'Could not determine HP';
    return result;
  }

  const family = extractFamily(motor.model);
  let scraped: any = null;
  let detailUrl = motor.detail_url;

  // 1. Try Firecrawl if we have URL
  if (firecrawlKey) {
    // Construct Mercury URL if we don't have one
    if (!detailUrl) {
      detailUrl = constructMercuryUrl(result.hp, family);
    }
    
    if (detailUrl) {
      scraped = await scrapeWithFirecrawl(detailUrl, firecrawlKey);
      if (scraped) {
        result.source = 'firecrawl';
      }
    }
  }

  // 2. Try Perplexity as fallback
  if (!scraped && perplexityKey) {
    scraped = await searchWithPerplexity(result.hp, family, perplexityKey);
    if (scraped) {
      result.source = 'perplexity';
    }
  }

  // 3. Use static database as final fallback
  if (!scraped) {
    const staticSpecs = findMercurySpecs(result.hp, family || undefined);
    if (staticSpecs) {
      scraped = {
        description: staticSpecs.description,
        features: staticSpecs.features,
        specifications: staticSpecs.specifications,
      };
      detailUrl = staticSpecs.url;
      result.source = 'static-database';
    }
  }

  if (!scraped) {
    result.error = 'No data sources returned results';
    return result;
  }

  // Prepare update data
  const updateData: any = {};
  
  if (scraped.description && (!motor.description || motor.description.length < 50)) {
    updateData.description = scraped.description;
    result.updatedFields.push('description');
  }
  
  if (scraped.features && Array.isArray(scraped.features) && scraped.features.length > 0) {
    // Merge with existing features
    const existingFeatures = Array.isArray(motor.features) ? motor.features : [];
    const newFeatures = [...new Set([...existingFeatures, ...scraped.features])];
    if (newFeatures.length > existingFeatures.length) {
      updateData.features = newFeatures;
      result.updatedFields.push('features');
    }
  }
  
  if (scraped.specifications && typeof scraped.specifications === 'object') {
    // Merge with existing specs
    const existingSpecs = motor.specifications && typeof motor.specifications === 'object' 
      ? motor.specifications 
      : {};
    const mergedSpecs = { ...existingSpecs, ...scraped.specifications };
    if (Object.keys(mergedSpecs).length > Object.keys(existingSpecs).length) {
      updateData.specifications = mergedSpecs;
      result.updatedFields.push('specifications');
    }
  }
  
  // Skip detail_url to avoid unique constraint issues (multiple motors share same Mercury page)

  // Update if we have changes
  if (Object.keys(updateData).length > 0) {
    updateData.last_scraped = new Date().toISOString();
    
    const { error } = await supabase
      .from('motor_models')
      .update(updateData)
      .eq('id', motor.id);

    if (error) {
      result.error = `Database update failed: ${error.message}`;
      return result;
    }
    
    result.success = true;
  } else {
    result.success = true;
    result.error = 'No new data to update';
  }

  return result;
}

// Construct Mercury URL based on HP
function constructMercuryUrl(hp: number, family: string | null): string | null {
  const baseUrl = 'https://www.mercurymarine.com/en/us/engines/outboard';
  
  if (family?.toLowerCase() === 'verado') {
    return `${baseUrl}/verado/${hp}hp/`;
  }
  
  if (family?.toLowerCase() === 'pro xs') {
    return `${baseUrl}/pro-xs/${hp}hp/`;
  }
  
  if (family?.toLowerCase() === 'prokicker') {
    return `${baseUrl}/prokicker/${hp}hp/`;
  }
  
  // FourStroke ranges
  if (hp <= 3.5) return `${baseUrl}/fourstroke/2-5hp-3-5hp/`;
  if (hp <= 6) return `${baseUrl}/fourstroke/4hp-6hp/`;
  if (hp <= 9.9) return `${baseUrl}/fourstroke/8hp-9-9hp/`;
  if (hp <= 20) return `${baseUrl}/fourstroke/15hp-20hp/`;
  if (hp <= 30) return `${baseUrl}/fourstroke/25hp-30hp/`;
  if (hp <= 60) return `${baseUrl}/fourstroke/40hp-60hp/`;
  if (hp <= 115) return `${baseUrl}/fourstroke/75hp-115hp/`;
  if (hp <= 150) return `${baseUrl}/fourstroke/150hp/`;
  if (hp <= 225) return `${baseUrl}/fourstroke/175hp-225hp/`;
  
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { 
      batch_size = 10, 
      offset = 0,
      motor_id,  // Optional: scrape specific motor
      prioritize_missing = true,  // Prioritize motors without descriptions
      background = false  // Run as background task
    } = body;

    console.log('Mercury catalog scrape started', { 
      batch_size, 
      offset, 
      motor_id,
      background,
      hasFirecrawl: !!firecrawlKey, 
      hasPerplexity: !!perplexityKey 
    });

    // Build query
    let query = supabase
      .from('motor_models')
      .select('id, model, horsepower, description, features, specifications, detail_url, family, motor_type')
      .eq('make', 'Mercury');

    if (motor_id) {
      query = query.eq('id', motor_id);
    } else if (prioritize_missing) {
      // Prioritize motors without descriptions
      query = query
        .or('description.is.null,description.eq.')
        .order('horsepower', { ascending: true })
        .range(offset, offset + batch_size - 1);
    } else {
      query = query
        .order('horsepower', { ascending: true })
        .range(offset, offset + batch_size - 1);
    }

    const { data: motors, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch motors: ${error.message}`);
    }

    if (!motors || motors.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No motors to process',
          results: [],
          summary: { total: 0, updated: 0, failed: 0 }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${motors.length} motors`);

    // Background processing function
    async function processMotors() {
      const results: ScrapeResult[] = [];
      
      for (const motor of motors) {
        const result = await scrapeMotor(motor, supabase, firecrawlKey, perplexityKey);
        results.push(result);
        console.log(`Processed ${motor.model}: ${result.success ? 'success' : 'failed'} (${result.source})`);
        
        // Small delay between requests to avoid rate limiting
        await new Promise(r => setTimeout(r, 500));
      }

      const summary = {
        total: results.length,
        updated: results.filter(r => r.success && r.updatedFields.length > 0).length,
        failed: results.filter(r => !r.success).length,
        sources: {
          firecrawl: results.filter(r => r.source === 'firecrawl').length,
          perplexity: results.filter(r => r.source === 'perplexity').length,
          staticDatabase: results.filter(r => r.source === 'static-database').length,
        }
      };

      console.log('Scrape completed:', summary);
      return { results, summary };
    }

    if (background) {
      // Run as background task - return immediately
      EdgeRuntime.waitUntil(processMotors());
      
      return new Response(
        JSON.stringify({
          success: true,
          message: `Background processing started for ${motors.length} motors`,
          motorsQueued: motors.length,
          next_offset: offset + batch_size
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Synchronous processing
    const { results, summary } = await processMotors();

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${summary.total} motors, updated ${summary.updated}`,
        results,
        summary,
        next_offset: offset + batch_size
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Mercury catalog scrape error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
