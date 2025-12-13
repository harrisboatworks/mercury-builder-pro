import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { findMercurySpecs, getAvailableHpValues } from "../_shared/mercury-specs-database.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapeResult {
  motorId: string;
  model: string;
  hp: number;
  success: boolean;
  source: 'static-database' | 'perplexity' | 'firecrawl' | 'failed';
  updatedFields: string[];
  error?: string;
}

// Extract HP from model string
function extractHp(model: string): number | null {
  const hpMatch = model.match(/(\d+(?:\.\d+)?)\s*(?:hp|HP)/i);
  if (hpMatch) {
    return parseFloat(hpMatch[1]);
  }
  
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

// Enhanced family detection with more variants
function extractFamily(model: string): string | null {
  const modelLower = model.toLowerCase();
  
  // Check for specific families in order of specificity
  if (modelLower.includes('verado')) return 'Verado';
  if (modelLower.includes('pro xs') || modelLower.includes('proxs') || modelLower.includes('pro-xs')) return 'Pro XS';
  if (modelLower.includes('prokicker') || modelLower.includes('pro kicker')) return 'ProKicker';
  if (modelLower.includes('seapro') || modelLower.includes('sea pro') || modelLower.includes('sea-pro')) return 'SeaPro';
  if (modelLower.includes('command thrust') || modelLower.includes('ct')) return 'Command Thrust';
  if (modelLower.includes('sail power') || modelLower.includes('sailpower')) return 'Sail Power';
  if (modelLower.includes('fourstroke') || modelLower.includes('four stroke') || modelLower.includes('4-stroke')) return 'FourStroke';
  if (modelLower.includes('efi')) return 'FourStroke EFI';
  
  return null;
}

// Clean and validate description content - CRITICAL for filtering promotional content
function cleanDescription(text: string | undefined | null): string | null {
  if (!text || typeof text !== 'string') return null;
  
  let cleaned = text;
  
  // Remove markdown images
  cleaned = cleaned.replace(/!\[.*?\]\(.*?\)/g, '');
  
  // Remove markdown links but keep text
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  
  // Remove URLs
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, '');
  
  // Remove HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, '');
  
  // Promotional/banner content patterns to reject entirely
  const promotionalPatterns = [
    /step up to the all-new/i,
    /get the facts/i,
    /zero compromises/i,
    /mercury marine homepage/i,
    /browse our/i,
    /learn more about/i,
    /visit our/i,
    /click here/i,
    /^engines$/i,
    /^outboard$/i,
    /carousel/i,
    /banner/i,
    /\|\s*$/,  // Trailing pipe (table remnants)
  ];
  
  for (const pattern of promotionalPatterns) {
    if (pattern.test(cleaned)) {
      console.log('Rejected promotional content:', cleaned.substring(0, 100));
      return null;
    }
  }
  
  // Clean up whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  // Remove lines that are too short or are navigation text
  const lines = cleaned.split(/[.!?]/).filter(line => {
    const trimmed = line.trim();
    return trimmed.length > 20 && !trimmed.match(/^(home|engines|outboard|about|contact)/i);
  });
  
  cleaned = lines.join('. ').trim();
  if (!cleaned.endsWith('.')) cleaned += '.';
  
  // Validate length - too short or too long is suspicious
  if (cleaned.length < 50) {
    console.log('Rejected: too short after cleaning:', cleaned);
    return null;
  }
  if (cleaned.length > 1000) {
    // Truncate to first 1000 chars at sentence boundary
    cleaned = cleaned.substring(0, 1000);
    const lastPeriod = cleaned.lastIndexOf('.');
    if (lastPeriod > 500) {
      cleaned = cleaned.substring(0, lastPeriod + 1);
    }
  }
  
  return cleaned;
}

// Clean features array - remove promotional items
function cleanFeatures(features: any): string[] | null {
  if (!Array.isArray(features)) return null;
  
  const cleanedFeatures = features
    .filter((f): f is string => typeof f === 'string')
    .map(f => f.trim())
    .filter(f => {
      // Must be reasonable length
      if (f.length < 10 || f.length > 200) return false;
      
      // No URLs or markdown
      if (f.includes('http') || f.includes('[') || f.includes('](')) return false;
      
      // No promotional text
      if (/learn more|click|visit|browse|shop now/i.test(f)) return false;
      
      return true;
    });
  
  return cleanedFeatures.length > 0 ? cleanedFeatures.slice(0, 12) : null;
}

// Get data from static database - PRIMARY SOURCE
function getStaticDatabaseData(hp: number, family: string | null): {
  description: string | null;
  features: string[] | null;
  specifications: Record<string, any> | null;
  url: string | null;
} | null {
  const staticSpecs = findMercurySpecs(hp, family || undefined);
  
  if (!staticSpecs) {
    console.log(`No static specs for ${hp}hp ${family || 'FourStroke'}`);
    return null;
  }
  
  console.log(`Found static specs for ${hp}hp ${staticSpecs.family}`);
  
  return {
    description: staticSpecs.description,
    features: staticSpecs.features,
    specifications: staticSpecs.specifications,
    url: staticSpecs.url,
  };
}

// Try Perplexity for supplementary info - SECONDARY SOURCE
async function searchWithPerplexity(hp: number, family: string | null, apiKey: string): Promise<{
  description?: string;
  features?: string[];
  specifications?: Record<string, any>;
} | null> {
  try {
    const query = `Mercury Marine ${hp}hp ${family || 'FourStroke'} outboard motor. What are the key features and selling points?`;
    console.log('Perplexity search:', query);
    
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
            content: `You are a marine engine expert. Provide factual information about Mercury outboard motors. Return ONLY valid JSON:
{
  "description": "1-2 sentences about this specific motor model",
  "features": ["feature 1", "feature 2", "...max 8 features"],
  "specifications": {"key": "value"}
}
No markdown, no explanations, just the JSON object.`
          },
          { role: 'user', content: query }
        ],
        search_domain_filter: ['mercurymarine.com', 'boatingmag.com'],
      }),
    });

    if (!response.ok) {
      console.log('Perplexity failed:', response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) return null;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Clean the results
        return {
          description: cleanDescription(parsed.description) || undefined,
          features: cleanFeatures(parsed.features) || undefined,
          specifications: parsed.specifications,
        };
      } catch (e) {
        console.log('Perplexity JSON parse failed');
      }
    }

    return null;
  } catch (error) {
    console.error('Perplexity error:', error);
    return null;
  }
}

// Firecrawl - LAST RESORT with strict filtering
async function scrapeWithFirecrawl(url: string, apiKey: string): Promise<{
  description?: string;
  features?: string[];
} | null> {
  try {
    console.log('Firecrawl scrape:', url);
    
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
      console.log('Firecrawl failed:', response.status);
      return null;
    }

    const data = await response.json();
    const markdown = data.data?.markdown || data.markdown;
    
    if (!markdown || markdown.length < 100) {
      console.log('Firecrawl: no content');
      return null;
    }

    const result: { description?: string; features?: string[] } = {};
    
    // Try to extract a clean description from the first substantial paragraph
    const paragraphs = markdown.split(/\n\n+/);
    for (const para of paragraphs) {
      const cleaned = cleanDescription(para);
      if (cleaned) {
        result.description = cleaned;
        break;
      }
    }
    
    // Extract bullet point features with strict filtering
    const features: string[] = [];
    const bulletMatches = markdown.matchAll(/[-•*]\s+([^\n]+)/g);
    for (const match of bulletMatches) {
      const feature = match[1].trim();
      if (feature.length > 15 && feature.length < 150 && 
          !feature.includes('http') && 
          !feature.match(/learn more|click|browse/i)) {
        features.push(feature);
      }
    }
    
    const cleanedFeatures = cleanFeatures(features);
    if (cleanedFeatures) {
      result.features = cleanedFeatures;
    }
    
    return Object.keys(result).length > 0 ? result : null;
  } catch (error) {
    console.error('Firecrawl error:', error);
    return null;
  }
}

// Main scrape function - PRIORITY: Static DB > Perplexity > Firecrawl
async function scrapeMotor(
  motor: any,
  supabase: any,
  firecrawlKey: string | undefined,
  perplexityKey: string | undefined,
  forceRefresh: boolean = false
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
    result.hp = extractHp(motor.model) || extractHp(motor.model_display || '') || 0;
  }

  if (!result.hp) {
    result.error = 'Could not determine HP';
    return result;
  }

  const family = extractFamily(motor.model) || extractFamily(motor.model_display || '');
  
  console.log(`Processing: ${motor.model} (${result.hp}hp ${family || 'FourStroke'})`);
  
  // ============ PRIORITY 1: STATIC DATABASE (Primary Source) ============
  const staticData = getStaticDatabaseData(result.hp, family);
  
  let finalDescription: string | null = null;
  let finalFeatures: string[] | null = null;
  let finalSpecs: Record<string, any> | null = null;
  
  if (staticData) {
    finalDescription = staticData.description;
    finalFeatures = staticData.features;
    finalSpecs = staticData.specifications;
    result.source = 'static-database';
    console.log(`Static DB: Got description (${finalDescription?.length || 0} chars), ${finalFeatures?.length || 0} features, ${Object.keys(finalSpecs || {}).length} specs`);
  }
  
  // ============ PRIORITY 2: PERPLEXITY (Supplementary) ============
  // Only use if we're missing data from static DB
  if (perplexityKey && (!finalDescription || !finalFeatures)) {
    const perplexityData = await searchWithPerplexity(result.hp, family, perplexityKey);
    
    if (perplexityData) {
      if (!finalDescription && perplexityData.description) {
        finalDescription = perplexityData.description;
        result.source = 'perplexity';
      }
      
      if (!finalFeatures && perplexityData.features) {
        finalFeatures = perplexityData.features;
        if (!staticData) result.source = 'perplexity';
      }
      
      // Merge specs if static didn't have them
      if (perplexityData.specifications) {
        finalSpecs = { ...(perplexityData.specifications || {}), ...(finalSpecs || {}) };
      }
      
      console.log(`Perplexity: Supplemented with description=${!!perplexityData.description}, features=${perplexityData.features?.length || 0}`);
    }
  }
  
  // ============ PRIORITY 3: FIRECRAWL (Last Resort) ============
  // Only if we still have no description
  if (firecrawlKey && !finalDescription) {
    const mercuryUrl = staticData?.url || constructMercuryUrl(result.hp, family);
    
    if (mercuryUrl) {
      const firecrawlData = await scrapeWithFirecrawl(mercuryUrl, firecrawlKey);
      
      if (firecrawlData) {
        if (!finalDescription && firecrawlData.description) {
          finalDescription = firecrawlData.description;
          result.source = 'firecrawl';
        }
        
        if (!finalFeatures && firecrawlData.features) {
          finalFeatures = firecrawlData.features;
        }
        
        console.log(`Firecrawl: Got description=${!!firecrawlData.description}, features=${firecrawlData.features?.length || 0}`);
      }
    }
  }
  
  // ============ PREPARE UPDATE ============
  if (!finalDescription && !finalFeatures && !finalSpecs) {
    result.error = 'No data from any source';
    return result;
  }
  
  const updateData: any = {};
  
  // Update description if new or refreshing
  if (finalDescription && (forceRefresh || !motor.description || motor.description.length < 50 || isPromotionalContent(motor.description))) {
    updateData.description = finalDescription;
    result.updatedFields.push('description');
  }
  
  // Update features - merge new with existing valid ones
  if (finalFeatures && finalFeatures.length > 0) {
    const existingFeatures = cleanFeatures(motor.features) || [];
    const allFeatures = [...new Set([...finalFeatures, ...existingFeatures])];
    
    if (forceRefresh || allFeatures.length > existingFeatures.length || existingFeatures.length === 0) {
      updateData.features = allFeatures.slice(0, 12);
      result.updatedFields.push('features');
    }
  }
  
  // Update specifications - static DB takes precedence
  if (finalSpecs && Object.keys(finalSpecs).length > 0) {
    const existingSpecs = (motor.specifications && typeof motor.specifications === 'object') 
      ? motor.specifications 
      : {};
    
    // Static specs override existing, then merge any additional
    const mergedSpecs = { ...existingSpecs, ...finalSpecs };
    
    if (forceRefresh || Object.keys(mergedSpecs).length > Object.keys(existingSpecs).length) {
      updateData.specifications = mergedSpecs;
      result.updatedFields.push('specifications');
    }
  }
  
  // Perform update
  if (Object.keys(updateData).length > 0) {
    updateData.last_scraped = new Date().toISOString();
    updateData.last_enriched = new Date().toISOString();
    
    const { error } = await supabase
      .from('motor_models')
      .update(updateData)
      .eq('id', motor.id);

    if (error) {
      result.error = `Database update failed: ${error.message}`;
      return result;
    }
    
    result.success = true;
    console.log(`Updated ${motor.model}: ${result.updatedFields.join(', ')}`);
  } else {
    result.success = true;
    result.error = 'No new data to update';
  }

  return result;
}

// Check if existing description is promotional/garbage
function isPromotionalContent(text: string | null): boolean {
  if (!text) return false;
  
  const promotionalIndicators = [
    /step up to/i,
    /get the facts/i,
    /zero compromises/i,
    /!\[/,  // Markdown images
    /\[.*\]\(/,  // Markdown links
    /https?:\/\//,  // URLs
    /browse our/i,
    /learn more/i,
  ];
  
  return promotionalIndicators.some(pattern => pattern.test(text));
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
  if (family?.toLowerCase() === 'seapro') {
    return `${baseUrl}/seapro/${hp}hp/`;
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
  if (hp <= 300) return `${baseUrl}/fourstroke/250hp-300hp/`;
  
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

    const body = await req.json().catch(() => ({}));
    const { 
      batch_size = 10, 
      offset = 0,
      motor_id,
      prioritize_missing = true,
      background = false,
      refresh = false,  // NEW: Force refresh all data
      clear_bad_data = false  // NEW: Clear promotional content first
    } = body;

    console.log('Mercury catalog scrape started', { 
      batch_size, 
      offset, 
      motor_id,
      background,
      refresh,
      clear_bad_data,
      hasFirecrawl: !!firecrawlKey, 
      hasPerplexity: !!perplexityKey 
    });

    // NEW: Clear bad/promotional data if requested
    if (clear_bad_data) {
      console.log('Clearing promotional descriptions...');
      const { data: badDescriptions, error: clearError } = await supabase
        .from('motor_models')
        .update({ 
          description: null, 
          features: null,
          last_scraped: null 
        })
        .eq('make', 'Mercury')
        .or('description.ilike.%step up to%,description.ilike.%get the facts%,description.ilike.%![%,description.ilike.%http%')
        .select('id');
      
      if (clearError) {
        console.error('Failed to clear bad data:', clearError);
      } else {
        console.log(`Cleared ${badDescriptions?.length || 0} motors with promotional content`);
      }
    }

    // Build query
    let query = supabase
      .from('motor_models')
      .select('id, model, model_display, horsepower, description, features, specifications, detail_url, family, motor_type')
      .eq('make', 'Mercury');

    if (motor_id) {
      query = query.eq('id', motor_id);
    } else if (refresh) {
      // Refresh mode: process all motors
      query = query
        .order('horsepower', { ascending: true })
        .range(offset, offset + batch_size - 1);
    } else if (prioritize_missing) {
      // Prioritize motors without descriptions or with promotional content
      query = query
        .or('description.is.null,description.eq.,features.is.null')
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

    async function processMotors() {
      const results: ScrapeResult[] = [];
      
      for (const motor of motors) {
        const result = await scrapeMotor(motor, supabase, firecrawlKey, perplexityKey, refresh);
        results.push(result);
        console.log(`${result.success ? '✓' : '✗'} ${motor.model}: ${result.source} (${result.updatedFields.join(', ') || 'no changes'})`);
        
        // Delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 300));
      }

      const summary = {
        total: results.length,
        updated: results.filter(r => r.success && r.updatedFields.length > 0).length,
        noChanges: results.filter(r => r.success && r.updatedFields.length === 0).length,
        failed: results.filter(r => !r.success).length,
        sources: {
          staticDatabase: results.filter(r => r.source === 'static-database').length,
          perplexity: results.filter(r => r.source === 'perplexity').length,
          firecrawl: results.filter(r => r.source === 'firecrawl').length,
        }
      };

      console.log('Scrape completed:', summary);
      return { results, summary };
    }

    if (background) {
      EdgeRuntime.waitUntil(processMotors());
      
      return new Response(
        JSON.stringify({
          success: true,
          message: `Background processing started for ${motors.length} motors`,
          motorsQueued: motors.length,
          next_offset: offset + batch_size,
          refresh,
          clear_bad_data
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { results, summary } = await processMotors();

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${summary.total} motors, updated ${summary.updated}, from static DB: ${summary.sources.staticDatabase}`,
        results,
        summary,
        next_offset: offset + batch_size
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
