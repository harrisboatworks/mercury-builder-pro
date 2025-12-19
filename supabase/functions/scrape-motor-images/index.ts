import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapeOptions {
  dryRun?: boolean;
  hpMin?: number;
  hpMax?: number;
  batchSize?: number;
  offset?: number;
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
  imagesUploaded: number;
  heroImage?: string;
  galleryImages?: string[];
  error?: string;
}

// Schema for FIRE-1 agent image extraction
const imageExtractionSchema = {
  type: "object",
  properties: {
    productImages: {
      type: "array",
      items: { type: "string" },
      description: "Full absolute URLs of product images only (motors, engines). Exclude logos, icons, thumbnails, banners, promotional images, and social media icons."
    },
    heroImage: {
      type: "string",
      description: "The main/hero product image URL - typically the largest, highest quality image of the motor"
    }
  },
  required: ["productImages"]
};

// Normalize motor family string for consistent matching
function normalizeFamily(family?: string): string {
  if (!family) return 'fourstroke';
  const f = family.toLowerCase().replace(/\s+/g, '');
  if (f.includes('proxs') || f.includes('pro-xs')) return 'proxs';
  if (f.includes('seapro') || f.includes('sea-pro')) return 'seapro';
  if (f.includes('verado')) return 'verado';
  return 'fourstroke';
}

// Build URL slug from model_display with family awareness
function buildAlberniSlug(modelDisplay: string, family?: string): string {
  if (!modelDisplay) return '';
  
  const normalizedFamily = normalizeFamily(family);
  
  // Clean the model display: remove Mercury prefix, registered marks, and all family names
  let slug = modelDisplay
    .toLowerCase()
    .replace(/^mercury\s*/i, '')
    .replace(/®/g, '')
    .replace(/\s*fourstroke\s*/gi, '')
    .replace(/\s*pro\s*xs\s*/gi, '')
    .replace(/\s*seapro\s*/gi, '')
    .replace(/\s*sea\s*pro\s*/gi, '')
    .replace(/\s*verado\s*/gi, '')
    .replace(/\./g, '-')
    .replace(/\s+/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .trim();
  
  // Add the correct family suffix based on actual family
  switch (normalizedFamily) {
    case 'proxs':
      slug += '-pro-xs';
      break;
    case 'seapro':
      slug += '-seapro';
      break;
    case 'verado':
      slug += '-verado';
      break;
    default:
      slug += '-fourstroke';
  }
  
  return slug;
}

// Get category path based on HP and family
function getCategoryPath(hp: number, family?: string): string {
  const normalizedFamily = normalizeFamily(family);
  
  switch (normalizedFamily) {
    case 'proxs':
      // Pro XS: 115-300 HP range
      return '115-300-hp-mercury-pro-xs';
    case 'seapro':
      // SeaPro ranges
      if (hp <= 60) return '15-60-hp-mercury-seapro';
      if (hp <= 100) return '75-100-hp-mercury-seapro';
      return '115-200-hp-mercury-seapro';
    case 'verado':
      // Verado: typically 175-400 HP range
      return '200-400-hp-mercury-verado';
    default:
      // FourStroke ranges
      if (hp <= 30) return '2.5-30-hp-mercury-fourstroke';
      if (hp <= 150) return '40-150-hp-mercury-fourstroke';
      return '200-300-hp-mercury-fourstroke';
  }
}

// Build the full product URL with family awareness
function buildProductUrl(modelDisplay: string, hp: number, family?: string): string {
  const category = getCategoryPath(hp, family);
  const slug = buildAlberniSlug(modelDisplay, family);
  return `https://www.albernipowermarine.com/product/mercury-outboards/${category}/${slug}`;
}

// Download image from external URL
async function downloadImage(url: string): Promise<{
  buffer: Uint8Array;
  contentType: string;
} | null> {
  try {
    console.log(`Downloading image: ${url}`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HarrisBoatWorks/1.0)',
      },
    });
    
    if (!response.ok) {
      console.error(`Failed to download ${url}: ${response.status}`);
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    return { 
      buffer: new Uint8Array(arrayBuffer), 
      contentType 
    };
  } catch (error) {
    console.error(`Error downloading ${url}:`, error);
    return null;
  }
}

// Upload image to Supabase Storage
async function uploadToStorage(
  supabase: ReturnType<typeof createClient>,
  motorId: string,
  imageIndex: number,
  imageData: Uint8Array,
  contentType: string
): Promise<string | null> {
  try {
    const ext = contentType.includes('png') ? 'png' : 
                contentType.includes('webp') ? 'webp' : 'jpg';
    const path = `mercury/${motorId}/${imageIndex}.${ext}`;
    
    console.log(`Uploading to storage: ${path}`);
    
    const { data, error } = await supabase.storage
      .from('motor-images')
      .upload(path, imageData, {
        contentType,
        upsert: true,
        cacheControl: '31536000',
      });
      
    if (error) {
      console.error(`Upload error for ${path}:`, error);
      return null;
    }
    
    const { data: urlData } = supabase.storage
      .from('motor-images')
      .getPublicUrl(path);
      
    console.log(`Uploaded successfully: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error) {
    console.error(`Error uploading image:`, error);
    return null;
  }
}

// Poll for extraction completion - Firecrawl extract is async
async function pollForExtraction(jobId: string, apiKey: string, maxWaitMs = 60000): Promise<any> {
  const startTime = Date.now();
  let attempts = 0;
  
  while (Date.now() - startTime < maxWaitMs) {
    attempts++;
    await new Promise(r => setTimeout(r, 2000)); // Wait 2 seconds between polls
    
    console.log(`[Firecrawl FIRE-1] Poll attempt ${attempts} for job ${jobId}`);
    
    const response = await fetch(`https://api.firecrawl.dev/v1/extract/${jobId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    if (!response.ok) {
      console.error(`[Firecrawl FIRE-1] Poll error: ${response.status}`);
      continue;
    }
    
    const result = await response.json();
    console.log(`[Firecrawl FIRE-1] Poll status: ${result.status}`);
    
    if (result.status === 'completed') {
      return result.data;
    }
    
    if (result.status === 'failed') {
      throw new Error(`Extraction failed: ${result.error || 'Unknown error'}`);
    }
  }
  
  throw new Error('Extraction timeout - exceeded 60 seconds');
}

// Validate if image URL matches expected HP (filter wrong-HP images)
function validateImageHpMatch(imageUrl: string, targetHp: number): boolean {
  const url = imageUrl.toLowerCase();
  
  // Extract HP numbers from URL patterns
  const hpPatterns = [
    /(\d+(?:\.\d+)?)\s*hp/gi,
    /(\d+(?:\.\d+)?)-hp/gi,
    /-(\d+)-(?:fourstroke|outboard|motor)/gi,
    /\/(\d+)hp\//gi,
  ];
  
  for (const pattern of hpPatterns) {
    let match;
    while ((match = pattern.exec(url)) !== null) {
      const foundHp = parseFloat(match[1]);
      // If we find a different HP in the URL, reject it
      if (foundHp > 1 && foundHp <= 600 && Math.abs(foundHp - targetHp) > 2) {
        console.log(`[HP Validation] Rejecting image with HP ${foundHp}, expected ${targetHp}: ${imageUrl}`);
        return false;
      }
    }
  }
  
  // Check for "related products" or "similar items" in path
  if (url.includes('related') || url.includes('similar') || url.includes('also-like')) {
    console.log(`[HP Validation] Rejecting related product image: ${imageUrl}`);
    return false;
  }
  
  return true;
}

// FIRE-1 agent extraction for images
async function scrapeImagesWithFire1(url: string, apiKey: string, hp: number): Promise<string[]> {
  console.log(`[Firecrawl FIRE-1] Extracting images from: ${url} for ${hp} HP motor`);
  
  const extractionPrompt = `
You are extracting product images from a marine dealer website for a ${hp} HP outboard motor.

CRITICAL: Only extract images showing a ${hp} HP motor. The HP number "${hp}" should be visible on the motor cowling in photos, or the page context should clearly indicate this is the ${hp} HP model.

EXTRACTION REQUIREMENTS:
1. Extract ONLY product images of the ${hp} HP motor/engine itself
2. Prioritize high-quality images (large, clear, professional photos)
3. The hero image should be the main product shot showing the ${hp} HP motor

STRICTLY EXCLUDE these types of images:
- Company logos and branding images
- Navigation icons and buttons
- Social media icons
- Promotional banners and sale graphics
- Thumbnails (URLs containing 'thumb', 'small', '-320', 'icon')
- Images from "Similar Items", "Related Products", "You May Also Like" sections
- Images of different HP motors - if you see a motor showing a different HP number (like 20, 40, 60, etc. that is NOT ${hp}), do NOT include it
- Lifestyle/action shots that don't clearly show the motor
- Cart icons, wishlist icons, comparison icons

Return full absolute URLs only. Quality over quantity - only include images you're confident show the ${hp} HP motor.
`;

  try {
    const response = await fetch('https://api.firecrawl.dev/v1/extract', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        urls: [url],
        schema: imageExtractionSchema,
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
      return [];
    }

    const data = await response.json();
    console.log(`[Firecrawl FIRE-1] Initial response:`, JSON.stringify(data).substring(0, 500));
    
    if (!data.success) {
      console.error('[Firecrawl FIRE-1] Extraction failed:', data.error);
      return [];
    }

    // Handle async job - poll for completion if we get a job ID
    let extractedData;
    if (data.id && !data.data) {
      console.log(`[Firecrawl FIRE-1] Got job ID ${data.id}, polling for completion...`);
      const pollResult = await pollForExtraction(data.id, apiKey);
      extractedData = Array.isArray(pollResult) ? pollResult[0] : pollResult;
    } else {
      extractedData = Array.isArray(data.data) ? data.data[0] : data.data;
    }
    
    if (!extractedData) {
      console.log('[Firecrawl FIRE-1] No images extracted');
      return [];
    }

    // Collect images, prioritizing hero image first
    const rawImages: string[] = [];
    
    if (extractedData.heroImage && typeof extractedData.heroImage === 'string') {
      rawImages.push(extractedData.heroImage);
    }
    
    if (Array.isArray(extractedData.productImages)) {
      for (const img of extractedData.productImages) {
        if (typeof img === 'string' && img.startsWith('http') && !rawImages.includes(img)) {
          rawImages.push(img);
        }
      }
    }

    // PHASE 2: Validate images match target HP
    const validatedImages = rawImages.filter(imgUrl => validateImageHpMatch(imgUrl, hp));
    
    console.log(`[Firecrawl FIRE-1] Found ${rawImages.length} images, ${validatedImages.length} passed HP validation for ${hp} HP`);
    return validatedImages.slice(0, 10); // Max 10 images

  } catch (error) {
    console.error('[Firecrawl FIRE-1] Image extraction error:', error);
    return [];
  }
}

// Main scraping function for a single motor
async function scrapeMotorImages(
  motor: MotorModel,
  apiKey: string,
  supabase: ReturnType<typeof createClient>,
  dryRun: boolean
): Promise<ScrapeResult> {
  const result: ScrapeResult = {
    motorId: motor.id,
    modelDisplay: motor.model_display,
    hp: motor.horsepower,
    success: false,
    imagesFound: 0,
    imagesUploaded: 0,
  };

  try {
    const productUrl = buildProductUrl(motor.model_display, motor.horsepower, motor.family);
    result.url = productUrl;
    
    // Use FIRE-1 agent for image extraction
    const scrapedImageUrls = await scrapeImagesWithFire1(productUrl, apiKey, motor.horsepower);
    
    result.imagesFound = scrapedImageUrls.length;

    if (scrapedImageUrls.length === 0) {
      result.error = 'No valid images found';
      return result;
    }

    // If dry run, just report what we found
    if (dryRun) {
      result.success = true;
      result.heroImage = scrapedImageUrls[0];
      result.galleryImages = scrapedImageUrls.slice(0, 8);
      return result;
    }

    // Download and upload images to our storage
    const uploadedUrls: string[] = [];
    const maxImages = Math.min(scrapedImageUrls.length, 8);

    for (let i = 0; i < maxImages; i++) {
      const sourceUrl = scrapedImageUrls[i];
      
      const imageData = await downloadImage(sourceUrl);
      if (!imageData) {
        console.log(`Failed to download image ${i} for motor ${motor.id}`);
        continue;
      }

      const uploadedUrl = await uploadToStorage(
        supabase,
        motor.id,
        i,
        imageData.buffer,
        imageData.contentType
      );

      if (uploadedUrl) {
        uploadedUrls.push(uploadedUrl);
      }

      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (uploadedUrls.length > 0) {
      result.success = true;
      result.heroImage = uploadedUrls[0];
      result.galleryImages = uploadedUrls;
      result.imagesUploaded = uploadedUrls.length;
    } else {
      result.error = 'Failed to download/upload any images';
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
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse options
    const body = await req.json().catch(() => ({}));
    const options: ScrapeOptions = {
      dryRun: body.dryRun ?? false,
      hpMin: body.hpMin,
      hpMax: body.hpMax,
      batchSize: body.batchSize ?? 10,
      offset: body.offset ?? 0,
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

    const offset = options.offset ?? 0;
    query = query.range(offset, offset + (options.batchSize ?? 10) - 1);

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

    console.log(`Processing ${motors.length} motors with FIRE-1 agent...`);

    const results: ScrapeResult[] = [];
    let successCount = 0;
    let failCount = 0;
    let totalImagesUploaded = 0;

    for (const motor of motors) {
      const result = await scrapeMotorImages(motor, firecrawlApiKey, supabase, options.dryRun ?? false);
      results.push(result);

      if (result.success) {
        successCount++;
        totalImagesUploaded += result.imagesUploaded;

        if (!options.dryRun && result.heroImage) {
          const imagesArray = result.galleryImages?.map((url, idx) => ({
            url,
            type: idx === 0 ? 'hero' : 'gallery',
            source: 'fire1_scraped',
            uploaded_at: new Date().toISOString(),
          })) || [];

          const { error: updateError } = await supabase
            .from('motor_models')
            .update({
              image_url: result.heroImage,
              hero_image_url: result.heroImage,
              images: imagesArray,
              updated_at: new Date().toISOString(),
            })
            .eq('id', motor.id);

          if (updateError) {
            console.error(`Failed to update motor ${motor.id}:`, updateError);
            result.error = `DB update failed: ${updateError.message}`;
          } else {
            console.log(`Updated motor ${motor.id} with ${result.imagesUploaded} images`);
          }

          await supabase.from('motor_enrichment_log').insert({
            motor_id: motor.id,
            source_name: 'fire1_image_scraper',
            action: 'image_scrape_and_upload',
            success: true,
            data_added: {
              image_url: result.heroImage,
              images_count: result.galleryImages?.length || 0,
              images_uploaded: result.imagesUploaded,
              url_scraped: result.url,
            },
          });
        }
      } else {
        failCount++;
        console.log(`No images found for ${motor.model_display} (${motor.horsepower}HP)`);

        if (!options.dryRun) {
          await supabase.from('motor_enrichment_log').insert({
            motor_id: motor.id,
            source_name: 'fire1_image_scraper',
            action: 'image_scrape_and_upload',
            success: false,
            error_message: result.error,
          });
        }
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const response = {
      success: true,
      dryRun: options.dryRun,
      agent: 'FIRE-1',
      totalProcessed: motors.length,
      successCount,
      failCount,
      totalImagesUploaded,
      storageBucket: 'motor-images',
      results: results.map(r => ({
        modelDisplay: r.modelDisplay,
        hp: r.hp,
        success: r.success,
        imagesFound: r.imagesFound,
        imagesUploaded: r.imagesUploaded,
        url: r.url,
        heroImage: r.heroImage,
        error: r.error,
      })),
    };

    console.log(`Scraping complete. Success: ${successCount}, Failed: ${failCount}, Images uploaded: ${totalImagesUploaded}`);

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
