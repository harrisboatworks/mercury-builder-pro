const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapeOptions {
  dryRun?: boolean;
  hpMin?: number;
  hpMax?: number;
  batchSize?: number;
  specificMotorId?: string;
}

interface MotorModel {
  id: string;
  model_display: string;
  horsepower: number;
  family?: string;
  motor_type?: string;
}

interface ScrapeResult {
  motorId: string;
  modelDisplay: string;
  hp: number;
  success: boolean;
  url?: string;
  imagesFound: number;
  heroImage?: string;
  galleryImages?: string[];
  error?: string;
}

// Build URL slug from model_display
function buildAlberniSlug(modelDisplay: string): string {
  if (!modelDisplay) return '';
  
  return modelDisplay
    .toLowerCase()
    .replace(/®/g, '')                    // Remove ® symbol
    .replace(/\./g, '-')                   // 9.9 → 9-9
    .replace(/\s+/g, '-')                  // spaces → dashes
    .replace(/-+/g, '-')                   // collapse multiple dashes
    .replace(/^-|-$/g, '')                 // trim leading/trailing dashes
    .trim();
}

// Get category path based on HP
function getCategoryPath(hp: number, modelDisplay: string): string {
  const isProXS = modelDisplay?.toLowerCase().includes('proxs');
  
  if (hp <= 30) {
    return '2.5-30-hp-mercury-fourstroke';
  } else if (hp <= 150) {
    return '40-150-hp-mercury-fourstroke';
  } else {
    return '200-300-hp-mercury-fourstroke';
  }
}

// Build the full product URL
function buildProductUrl(modelDisplay: string, hp: number): string {
  const category = getCategoryPath(hp, modelDisplay);
  const slug = buildAlberniSlug(modelDisplay);
  return `https://www.albernipowermarine.com/boat-engines-outboard-motors-for-sale/mercury-outboards/${category}/${slug}`;
}

// Generate alternate URL patterns to try
function getAlternateUrls(modelDisplay: string, hp: number): string[] {
  const baseUrl = buildProductUrl(modelDisplay, hp);
  const slug = buildAlberniSlug(modelDisplay);
  const category = getCategoryPath(hp, modelDisplay);
  const baseCategory = `https://www.albernipowermarine.com/boat-engines-outboard-motors-for-sale/mercury-outboards/${category}`;
  
  const alternates: string[] = [baseUrl];
  
  // Try with -01 suffix (common for variants)
  alternates.push(`${baseCategory}/${slug}-01`);
  
  // Try without "efi" if present
  if (slug.includes('-efi')) {
    alternates.push(`${baseCategory}/${slug.replace('-efi', '')}`);
  }
  
  // Try with just HP and basic model code
  const hpSlug = hp.toString().replace('.', '-');
  const modelCodes = ['elh', 'elpt', 'exlpt', 'mh', 'mlh', 'xl', 'xxl', 'cxl'];
  
  for (const code of modelCodes) {
    if (slug.includes(code)) {
      // Try simplified version: {hp}{code}-fourstroke
      alternates.push(`${baseCategory}/${hpSlug}${code}-fourstroke`);
      alternates.push(`${baseCategory}/${hpSlug}-${code}-fourstroke`);
      break;
    }
  }
  
  return [...new Set(alternates)]; // Remove duplicates
}

// Filter valid motor images from scraped URLs
function filterValidImages(imageUrls: string[]): string[] {
  const validImages: string[] = [];
  
  for (const url of imageUrls) {
    // Must be from Alberni's AWS CDN
    if (!url.includes('aws.albernipowermarine.com')) continue;
    
    // Skip logos and promotional images
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('apm-brand')) continue;
    if (lowerUrl.includes('go-boldly')) continue;
    if (lowerUrl.includes('logo')) continue;
    if (lowerUrl.includes('youtube')) continue;
    if (lowerUrl.includes('thumbnail')) continue;
    if (lowerUrl.includes('banner')) continue;
    if (lowerUrl.includes('promo')) continue;
    if (lowerUrl.includes('sale')) continue;
    if (lowerUrl.includes('clearance')) continue;
    if (lowerUrl.includes('boat-show')) continue;
    if (lowerUrl.includes('icon')) continue;
    if (lowerUrl.includes('button')) continue;
    
    // Prefer actual motor images
    if (
      lowerUrl.includes('mercury-marine') ||
      lowerUrl.includes('mercury-') ||
      lowerUrl.includes('fourstroke') ||
      lowerUrl.includes('hp') ||
      lowerUrl.includes('detail-image') ||
      lowerUrl.includes('port') ||
      lowerUrl.includes('stbd') ||
      lowerUrl.includes('rear') ||
      lowerUrl.includes('front')
    ) {
      validImages.push(url);
    }
  }
  
  return [...new Set(validImages)]; // Remove duplicates
}

// Scrape a single product page using Firecrawl
async function scrapeProductPage(url: string, apiKey: string): Promise<string[]> {
  try {
    console.log(`Scraping: ${url}`);
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['html', 'links'],
        onlyMainContent: false,
        waitFor: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Firecrawl error for ${url}:`, errorData);
      return [];
    }

    const data = await response.json();
    
    // Extract image URLs from HTML content
    const imageUrls: string[] = [];
    
    // Get links that are images
    if (data.data?.links) {
      for (const link of data.data.links) {
        if (typeof link === 'string' && link.match(/\.(jpg|jpeg|png|webp)$/i)) {
          imageUrls.push(link);
        }
      }
    }
    
    // Parse HTML for image src attributes
    if (data.data?.html) {
      const imgMatches = data.data.html.match(/src=["']([^"']+aws\.albernipowermarine\.com[^"']+)["']/gi);
      if (imgMatches) {
        for (const match of imgMatches) {
          const urlMatch = match.match(/src=["']([^"']+)["']/i);
          if (urlMatch && urlMatch[1]) {
            imageUrls.push(urlMatch[1]);
          }
        }
      }
      
      // Also try data-src for lazy-loaded images
      const dataSrcMatches = data.data.html.match(/data-src=["']([^"']+aws\.albernipowermarine\.com[^"']+)["']/gi);
      if (dataSrcMatches) {
        for (const match of dataSrcMatches) {
          const urlMatch = match.match(/data-src=["']([^"']+)["']/i);
          if (urlMatch && urlMatch[1]) {
            imageUrls.push(urlMatch[1]);
          }
        }
      }
    }
    
    return filterValidImages(imageUrls);
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return [];
  }
}

// Main scraping function for a single motor
async function scrapeMotorImages(
  motor: MotorModel,
  apiKey: string,
  dryRun: boolean
): Promise<ScrapeResult> {
  const result: ScrapeResult = {
    motorId: motor.id,
    modelDisplay: motor.model_display,
    hp: motor.horsepower,
    success: false,
    imagesFound: 0,
  };

  try {
    const urls = getAlternateUrls(motor.model_display, motor.horsepower);
    let images: string[] = [];
    let successUrl = '';

    // Try each URL until we find images
    for (const url of urls) {
      result.url = url;
      images = await scrapeProductPage(url, apiKey);
      
      if (images.length >= 2) {
        successUrl = url;
        break;
      }
      
      // Rate limiting - wait 1.5 seconds between requests
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    if (images.length > 0) {
      result.success = true;
      result.url = successUrl || urls[0];
      result.heroImage = images[0];
      result.galleryImages = images.slice(0, 8); // Max 8 gallery images
      result.imagesFound = images.length;
    } else {
      result.error = 'No valid images found on any URL variant';
    }

    return result;
  } catch (error) {
    result.error = (error as Error).message;
    return result;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'FIRECRAWL_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse options
    const body = await req.json().catch(() => ({}));
    const options: ScrapeOptions = {
      dryRun: body.dryRun ?? false,
      hpMin: body.hpMin,
      hpMax: body.hpMax,
      batchSize: body.batchSize ?? 10,
      specificMotorId: body.specificMotorId,
    };

    console.log('Scrape options:', options);

    // Build query for motors
    let query = supabase
      .from('motor_models')
      .select('id, model_display, horsepower, family, motor_type')
      .not('model_display', 'is', null)
      .order('horsepower', { ascending: true });

    if (options.specificMotorId) {
      query = query.eq('id', options.specificMotorId);
    } else {
      if (options.hpMin !== undefined) {
        query = query.gte('horsepower', options.hpMin);
      }
      if (options.hpMax !== undefined) {
        query = query.lte('horsepower', options.hpMax);
      }
    }

    query = query.limit(options.batchSize);

    const { data: motors, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching motors:', fetchError);
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!motors || motors.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No motors to process', results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${motors.length} motors...`);

    const results: ScrapeResult[] = [];
    let successCount = 0;
    let failCount = 0;

    // Process motors sequentially with rate limiting
    for (const motor of motors) {
      const result = await scrapeMotorImages(motor, firecrawlApiKey, options.dryRun);
      results.push(result);

      if (result.success) {
        successCount++;

        // Update database if not dry run
        if (!options.dryRun && result.heroImage) {
          const updateData: Record<string, unknown> = {
            image_url: result.heroImage,
            images: result.galleryImages,
            updated_at: new Date().toISOString(),
          };

          const { error: updateError } = await supabase
            .from('motor_models')
            .update(updateData)
            .eq('id', motor.id);

          if (updateError) {
            console.error(`Failed to update motor ${motor.id}:`, updateError);
            result.error = `DB update failed: ${updateError.message}`;
          } else {
            console.log(`Updated motor ${motor.id} with ${result.imagesFound} images`);
          }

          // Log to enrichment log
          await supabase.from('motor_enrichment_log').insert({
            motor_id: motor.id,
            source_name: 'alberni_power_marine',
            action: 'image_scrape',
            success: true,
            data_added: {
              image_url: result.heroImage,
              images_count: result.galleryImages?.length || 0,
              url_scraped: result.url,
            },
          });
        }
      } else {
        failCount++;
        console.log(`No images found for ${motor.model_display} (${motor.horsepower}HP)`);

        // Log failure
        if (!options.dryRun) {
          await supabase.from('motor_enrichment_log').insert({
            motor_id: motor.id,
            source_name: 'alberni_power_marine',
            action: 'image_scrape',
            success: false,
            error_message: result.error,
          });
        }
      }

      // Rate limiting between motors
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const response = {
      success: true,
      dryRun: options.dryRun,
      totalProcessed: motors.length,
      successCount,
      failCount,
      results: results.map(r => ({
        modelDisplay: r.modelDisplay,
        hp: r.hp,
        success: r.success,
        imagesFound: r.imagesFound,
        url: r.url,
        heroImage: r.heroImage,
        error: r.error,
      })),
    };

    console.log(`Scraping complete. Success: ${successCount}, Failed: ${failCount}`);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in scrape-motor-images:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
