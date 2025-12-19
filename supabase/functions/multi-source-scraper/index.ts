import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapeRequest {
  motor_id?: string;
  source_name?: string;
  batch_size?: number;
  background?: boolean;
  custom_url?: string;
  source_type?: string;
  include_custom_sources?: boolean;
}

interface ScrapeResult {
  description?: string;
  features?: string[];
  specifications?: any;
  images?: string[];
}

// Schema for FIRE-1 agent structured extraction
const motorDataSchema = {
  type: "object",
  properties: {
    description: { 
      type: "string", 
      description: "2-3 sentence conversational product description focusing on benefits and use cases" 
    },
    features: { 
      type: "array", 
      items: { type: "string" },
      description: "6-10 key features and benefits as bullet points"
    },
    specifications: {
      type: "object",
      properties: {
        displacement: { type: "string", description: "Engine displacement in cc or L" },
        cylinders: { type: "number", description: "Number of cylinders" },
        boreStroke: { type: "string", description: "Bore x stroke dimensions" },
        gearRatio: { type: "string", description: "Gear ratio" },
        weight: { type: "string", description: "Dry weight" },
        fuelSystem: { type: "string", description: "Fuel injection type" },
        ignition: { type: "string", description: "Ignition system type" },
        exhaustSystem: { type: "string", description: "Exhaust system type" },
        engineType: { type: "string", description: "Engine type (inline, V, etc.)" },
        alternatorOutput: { type: "string", description: "Alternator output in amps" },
        recommendedFuel: { type: "string", description: "Recommended fuel type/octane" },
        oilCapacity: { type: "string", description: "Oil capacity" },
        coolingSystem: { type: "string", description: "Cooling system type" },
        propShaftHorsepower: { type: "string", description: "Prop shaft horsepower rating" },
        maxRPM: { type: "string", description: "Maximum RPM range" },
        shaftLengths: { type: "array", items: { type: "string" }, description: "Available shaft lengths" },
        steering: { type: "string", description: "Steering type" },
        tiltTrim: { type: "string", description: "Tilt and trim system" }
      },
      description: "Technical specifications extracted from the page"
    },
    images: {
      type: "array",
      items: { type: "string" },
      description: "Product image URLs (full URLs only)"
    }
  },
  required: ["description", "features", "specifications"]
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY')!;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json() as ScrapeRequest;

    console.log('Multi-source scraper request:', body);

    // Get active data sources
    const { data: sources, error: sourcesError } = await supabase
      .from('motor_data_sources')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true });

    if (sourcesError) {
      console.error('Error fetching data sources:', sourcesError);
      throw sourcesError;
    }

    // Get custom sources for motors if enabled
    let customSources = [];
    if (body.include_custom_sources !== false) {
      const customSourcesQuery = supabase
        .from('motor_custom_sources')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: true });

      if (body.motor_id) {
        customSourcesQuery.eq('motor_id', body.motor_id);
      }

      const { data: customSourcesData, error: customSourcesError } = await customSourcesQuery;
      
      if (customSourcesError) {
        console.error('Error fetching custom sources:', customSourcesError);
      } else {
        customSources = customSourcesData || [];
      }
    }

    // Get motors to scrape
    let motorsQuery = supabase
      .from('motor_models')
      .select('id, model, horsepower, detail_url, data_sources, manual_overrides');

    if (body.motor_id) {
      motorsQuery = motorsQuery.eq('id', body.motor_id);
    } else {
      motorsQuery = motorsQuery.limit(body.batch_size || 10);
    }

    const { data: motors, error: motorsError } = await motorsQuery;

    if (motorsError) {
      console.error('Error fetching motors:', motorsError);
      throw motorsError;
    }

    const results = [];
    
    for (const motor of motors) {
      console.log(`Processing motor: ${motor.model}`);
      
      const enrichedData: any = {
        description: null,
        features: [],
        specifications: {},
        images: [],
        data_sources: motor.data_sources || {},
      };

      // Process each source in priority order (or custom URL if provided)
      if (body.custom_url) {
        // Handle custom URL scraping
        console.log(`Scraping from custom URL: ${body.custom_url}`);
        
        try {
          const sourceData = await scrapeWithFirecrawlAgent(body.custom_url, firecrawlApiKey);
          
          // Merge data from custom URL
          if (sourceData.description && !enrichedData.description) {
            enrichedData.description = sourceData.description;
          }
          
          if (sourceData.features?.length) {
            enrichedData.features = [...new Set([...enrichedData.features, ...sourceData.features])];
          }
          
          if (sourceData.specifications && Object.keys(sourceData.specifications).length) {
            enrichedData.specifications = { ...enrichedData.specifications, ...sourceData.specifications };
          }
          
          if (sourceData.images?.length) {
            enrichedData.images = [...new Set([...enrichedData.images, ...sourceData.images])];
          }

          // Update data sources to include custom URL
          enrichedData.data_sources.custom = {
            scraped_at: new Date().toISOString(),
            success: true,
            url: body.custom_url,
            agent: 'FIRE-1',
          };

        } catch (error) {
          console.error(`Error scraping from custom URL:`, error);
          
          enrichedData.data_sources.custom = {
            scraped_at: new Date().toISOString(),
            success: false,
            error: error.message,
            url: body.custom_url,
          };
        }
      } else {
        // Process motor-specific custom sources first
        const motorCustomSources = customSources.filter(cs => cs.motor_id === motor.id);
        
        for (const customSource of motorCustomSources) {
          console.log(`Processing custom source: ${customSource.source_name} (${customSource.source_type})`);
          
          try {
            let sourceData: ScrapeResult = {};
            
            switch (customSource.source_type) {
              case 'direct_url':
              case 'gallery_url':
              case 'dropbox':
              case 'google_drive':
              case 'pdf_url':
              case 'api_endpoint':
                sourceData = await scrapeWithFirecrawlAgent(customSource.source_url, firecrawlApiKey);
                break;
            }

            // Merge data from custom source
            if (sourceData.description && !enrichedData.description) {
              enrichedData.description = sourceData.description;
            }
            
            if (sourceData.features?.length) {
              enrichedData.features = [...new Set([...enrichedData.features, ...sourceData.features])];
            }
            
            if (sourceData.specifications && Object.keys(sourceData.specifications).length) {
              enrichedData.specifications = { ...enrichedData.specifications, ...sourceData.specifications };
            }
            
            if (sourceData.images?.length) {
              enrichedData.images = [...new Set([...enrichedData.images, ...sourceData.images])];
            }

            // Update custom source success tracking
            await supabase
              .from('motor_custom_sources')
              .update({
                success_rate: Math.min(100, (customSource.success_rate + 10)),
                last_scraped: new Date().toISOString(),
              })
              .eq('id', customSource.id);

            // Update data sources to include custom source
            enrichedData.data_sources[`custom_${customSource.id}`] = {
              scraped_at: new Date().toISOString(),
              success: true,
              source_name: customSource.source_name,
              source_type: customSource.source_type,
              agent: 'FIRE-1',
            };

          } catch (error) {
            console.error(`Error scraping from custom source ${customSource.source_name}:`, error);
            
            enrichedData.data_sources[`custom_${customSource.id}`] = {
              scraped_at: new Date().toISOString(),
              success: false,
              error: error.message,
              source_name: customSource.source_name,
              source_type: customSource.source_type,
            };

            // Update custom source failure tracking
            await supabase
              .from('motor_custom_sources')
              .update({
                success_rate: Math.max(0, (customSource.success_rate - 5)),
                last_scraped: new Date().toISOString(),
              })
              .eq('id', customSource.id);
          }
        }

        // Process each source in priority order
        for (const source of sources) {
        if (body.source_name && source.name !== body.source_name) {
          continue;
        }

        console.log(`Scraping from source: ${source.name}`);
        
        try {
          let sourceData: ScrapeResult = {};
          
          switch (source.name) {
            case 'harris':
              if (motor.detail_url) {
                sourceData = await scrapeHarris(motor.detail_url, firecrawlApiKey);
              }
              break;
              
            case 'mercury_official':
              sourceData = await scrapeMercuryOfficial(motor.model, motor.horsepower, firecrawlApiKey);
              break;
              
            case 'reviews':
              sourceData = await scrapeReviews(motor.model, motor.horsepower, firecrawlApiKey);
              break;
          }

          // Merge data with priority handling
          if (sourceData.description && !enrichedData.description) {
            enrichedData.description = sourceData.description;
          }
          
          if (sourceData.features?.length) {
            enrichedData.features = [...new Set([...enrichedData.features, ...sourceData.features])];
          }
          
          if (sourceData.specifications && Object.keys(sourceData.specifications).length) {
            enrichedData.specifications = { ...enrichedData.specifications, ...sourceData.specifications };
          }
          
          if (sourceData.images?.length) {
            enrichedData.images = [...new Set([...enrichedData.images, ...sourceData.images])];
          }

          // Update source status
          enrichedData.data_sources[source.name] = {
            scraped_at: new Date().toISOString(),
            success: true,
            agent: source.name === 'mercury_official' ? 'FIRE-1' : undefined,
          };

          // Update source success rate
          await supabase
            .from('motor_data_sources')
            .update({
              success_rate: Math.min(100, (source.success_rate + 10)),
              last_scraped: new Date().toISOString(),
            })
            .eq('id', source.id);

        } catch (error) {
          console.error(`Error scraping from ${source.name}:`, error);
          
          enrichedData.data_sources[source.name] = {
            scraped_at: new Date().toISOString(),
            success: false,
            error: error.message,
          };

          // Log enrichment failure
          await supabase.from('motor_enrichment_log').insert({
            motor_id: motor.id,
            source_name: source.name,
            action: 'scraped',
            success: false,
            error_message: error.message,
           });
         }
       }
      } // End of custom URL vs sources processing

      // Calculate data quality score
      const qualityScore = calculateQualityScore(enrichedData);

      // Apply manual overrides (highest priority)
      const finalData = applyManualOverrides(enrichedData, motor.manual_overrides || {});

      // Update motor with enriched data
      const { error: updateError } = await supabase
        .from('motor_models')
        .update({
          description: finalData.description,
          features: finalData.features,
          specifications: finalData.specifications,
          images: finalData.images,
          data_sources: finalData.data_sources,
          data_quality_score: qualityScore,
          last_enriched: new Date().toISOString(),
        })
        .eq('id', motor.id);

      if (updateError) {
        console.error('Error updating motor:', updateError);
      } else {
        console.log(`Successfully enriched motor: ${motor.model}`);
        
        // Log successful enrichment
        await supabase.from('motor_enrichment_log').insert({
          motor_id: motor.id,
          source_name: 'multi-source',
          action: 'merged',
          data_added: finalData,
          success: true,
        });
      }

      results.push({
        motor_id: motor.id,
        model: motor.model,
        quality_score: qualityScore,
        success: !updateError,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Multi-source scraper error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function scrapeHarris(detailUrl: string, apiKey: string): Promise<ScrapeResult> {
  // Use existing scrape-motor-details function
  const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/scrape-motor-details`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
    },
    body: JSON.stringify({ detail_url: detailUrl }),
  });
  
  const result = await response.json();
  return result.success ? result.data : {};
}

async function scrapeMercuryOfficial(model: string, horsepower: number, apiKey: string): Promise<ScrapeResult> {
  try {
    // Build Mercury Marine product URL
    const searchUrl = `https://www.mercurymarine.com/en/us/engines/outboard/?q=${encodeURIComponent(model + ' ' + horsepower)}`;
    
    console.log(`[Firecrawl FIRE-1] Extracting Mercury official data from: ${searchUrl}`);
    
    const extractionPrompt = `
You are extracting outboard motor product information from Mercury Marine's official website.

EXTRACTION REQUIREMENTS:
1. Description: Write a 2-3 sentence conversational description focusing on what makes this motor special and ideal use cases. Do NOT include pricing information.

2. Features: Extract 6-10 key features and benefits. Format as concise bullet points.

3. Specifications: Extract all technical specifications you can find including:
   - Displacement, cylinders, bore/stroke
   - Weight, gear ratio
   - Fuel system, ignition
   - Alternator output, cooling system
   - Available shaft lengths
   - Maximum RPM range

4. Images: Extract full product image URLs only (not icons or thumbnails).

Focus on official Mercury Marine specifications. Be accurate and thorough.
`;

    const response = await fetch('https://api.firecrawl.dev/v1/extract', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        urls: [searchUrl],
        schema: motorDataSchema,
        prompt: extractionPrompt,
        enableWebSearch: false,
        allowExternalLinks: false,
        agent: {
          model: 'FIRE-1'
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Firecrawl FIRE-1] API error: ${response.status} - ${errorText}`);
      throw new Error(`Firecrawl FIRE-1 API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[Firecrawl FIRE-1] Mercury extraction response:`, JSON.stringify(data).substring(0, 500));
    
    if (!data.success) {
      throw new Error(data.error || 'Firecrawl FIRE-1 extraction failed');
    }

    // Extract from the response - handle both array and direct object formats
    const extractedData = Array.isArray(data.data) ? data.data[0] : data.data;
    
    if (!extractedData) {
      console.log('[Firecrawl FIRE-1] No data extracted from Mercury page');
      return {};
    }

    const result: ScrapeResult = {
      description: extractedData.description || null,
      features: extractedData.features || [],
      specifications: extractedData.specifications || {},
      images: extractedData.images || [],
    };

    console.log(`[Firecrawl FIRE-1] Mercury extraction successful:`, {
      hasDescription: !!result.description,
      featuresCount: result.features?.length || 0,
      specsCount: Object.keys(result.specifications || {}).length,
      imagesCount: result.images?.length || 0
    });

    return result;
    
  } catch (error) {
    console.error('[Firecrawl FIRE-1] Mercury scraping error:', error);
    return {};
  }
}

async function scrapeReviews(model: string, horsepower: number, apiKey: string): Promise<ScrapeResult> {
  try {
    // Search boating review sites
    const searchTerms = `${model} ${horsepower}hp outboard motor review`;
    const searchUrl = `https://www.boatingmag.com/search/?q=${encodeURIComponent(searchTerms)}`;
    
    // Implementation would be similar to Mercury scraping
    // For now, return empty object
    return {};
    
  } catch (error) {
    console.error('Reviews scraping error:', error);
    return {};
  }
}

// Unified FIRE-1 agent extraction for custom URLs
async function scrapeWithFirecrawlAgent(url: string, apiKey: string): Promise<ScrapeResult> {
  if (!apiKey) {
    console.warn('Firecrawl API key not available for custom URL scraping');
    return {};
  }

  try {
    console.log(`[Firecrawl FIRE-1] Extracting motor data from: ${url}`);
    
    const extractionPrompt = `
You are extracting outboard motor product information from a dealer or manufacturer website.

EXTRACTION REQUIREMENTS:
1. Description: Write a 2-3 sentence conversational description focusing on what makes this motor special and ideal use cases. Do NOT include pricing information.

2. Features: Extract 6-10 key features and benefits. Format as concise bullet points.

3. Specifications: Extract all technical specifications you can find including:
   - Displacement, cylinders, bore/stroke
   - Weight, gear ratio
   - Fuel system, ignition
   - Alternator output, cooling system
   - Available shaft lengths
   - Maximum RPM range

4. Images: Extract full product image URLs only (not icons or thumbnails).

Be accurate and thorough. Only include information that is explicitly stated on the page.
`;

    const response = await fetch('https://api.firecrawl.dev/v1/extract', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        urls: [url],
        schema: motorDataSchema,
        prompt: extractionPrompt,
        enableWebSearch: false,
        allowExternalLinks: false,
        agent: {
          model: 'FIRE-1'
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Firecrawl FIRE-1] API error: ${response.status} - ${errorText}`);
      throw new Error(`Firecrawl FIRE-1 API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[Firecrawl FIRE-1] Custom URL extraction response:`, JSON.stringify(data).substring(0, 500));
    
    if (!data.success) {
      throw new Error(data.error || 'Firecrawl FIRE-1 extraction failed');
    }

    // Extract from the response - handle both array and direct object formats
    const extractedData = Array.isArray(data.data) ? data.data[0] : data.data;
    
    if (!extractedData) {
      console.log('[Firecrawl FIRE-1] No data extracted from custom URL');
      return {};
    }

    const result: ScrapeResult = {
      description: extractedData.description || null,
      features: extractedData.features || [],
      specifications: extractedData.specifications || {},
      images: extractedData.images || [],
    };

    console.log(`[Firecrawl FIRE-1] Custom URL extraction successful:`, {
      hasDescription: !!result.description,
      featuresCount: result.features?.length || 0,
      specsCount: Object.keys(result.specifications || {}).length,
      imagesCount: result.images?.length || 0
    });

    return result;

  } catch (error) {
    console.error('[Firecrawl FIRE-1] Error extracting from custom URL:', error);
    throw error;
  }
}

function calculateQualityScore(data: any): number {
  let score = 0;
  
  if (data.description) score += 25;
  if (data.features?.length > 0) score += 25;
  if (Object.keys(data.specifications || {}).length > 0) score += 25;
  if (data.images?.length > 0) score += 25;
  
  // Bonus points for completeness
  if (data.features?.length >= 5) score += 10;
  if (Object.keys(data.specifications || {}).length >= 5) score += 10;
  if (data.images?.length >= 3) score += 10;
  
  return Math.min(100, score);
}

function applyManualOverrides(data: any, overrides: any): any {
  return {
    ...data,
    ...overrides,
    features: overrides.features || data.features,
    specifications: { ...(data.specifications || {}), ...(overrides.specifications || {}) },
  };
}
