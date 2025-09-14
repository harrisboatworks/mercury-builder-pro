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
}

interface ScrapeResult {
  description?: string;
  features?: string[];
  specifications?: any;
  images?: string[];
}

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
    // Search Mercury Marine website
    const searchUrl = `https://www.mercurymarine.com/en/us/engines/outboard/?q=${encodeURIComponent(model + ' ' + horsepower)}`;
    
    const firecrawlResponse = await fetch('https://api.firecrawl.dev/v0/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: searchUrl,
        formats: ['markdown', 'html'],
      }),
    });

    if (!firecrawlResponse.ok) {
      throw new Error(`Firecrawl API error: ${firecrawlResponse.status}`);
    }

    const data = await firecrawlResponse.json();
    
    return {
      description: extractMercuryDescription(data.markdown),
      features: extractMercuryFeatures(data.markdown),
      specifications: extractMercurySpecs(data.markdown),
      images: extractMercuryImages(data.html, 'https://www.mercurymarine.com'),
    };
    
  } catch (error) {
    console.error('Mercury scraping error:', error);
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

function extractMercuryDescription(markdown: string): string | null {
  if (!markdown) return null;
  
  const lines = markdown.split('\n');
  for (const line of lines) {
    if (line.includes('outboard') && line.length > 50 && line.length < 300) {
      return line.trim();
    }
  }
  return null;
}

function extractMercuryFeatures(markdown: string): string[] {
  if (!markdown) return [];
  
  const features: string[] = [];
  const featurePatterns = [
    /•\s*(.+)/g,
    /\*\s*(.+)/g,
    /Features?:\s*(.+)/gi,
  ];
  
  for (const pattern of featurePatterns) {
    let match;
    while ((match = pattern.exec(markdown)) !== null) {
      const feature = match[1].trim();
      if (feature.length > 5 && feature.length < 100) {
        features.push(feature);
      }
    }
  }
  
  return [...new Set(features)].slice(0, 10);
}

function extractMercurySpecs(markdown: string): any {
  if (!markdown) return {};
  
  const specs: any = {};
  const specPatterns = [
    /(\w+(?:\s+\w+)*?):\s*([^\n]+)/g,
    /(\w+)\s*-\s*([^\n]+)/g,
  ];
  
  for (const pattern of specPatterns) {
    let match;
    while ((match = pattern.exec(markdown)) !== null) {
      const key = match[1].trim().toLowerCase();
      const value = match[2].trim();
      
      if (value.length < 50 && !specs[key]) {
        specs[key] = value;
      }
    }
  }
  
  return specs;
}

function extractMercuryImages(html: string, baseUrl: string): string[] {
  if (!html) return [];
  
  const imageRegex = /<img[^>]+src=['"([^'"]+)['"][^>]*>/gi;
  const images: string[] = [];
  let match;
  
  while ((match = imageRegex.exec(html)) !== null) {
    let imageUrl = match[1];
    if (imageUrl.startsWith('/')) {
      imageUrl = baseUrl + imageUrl;
    }
    
    if (imageUrl.includes('outboard') || imageUrl.includes('motor') || imageUrl.includes('engine')) {
      images.push(imageUrl);
    }
  }
  
  return [...new Set(images)].slice(0, 5);
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