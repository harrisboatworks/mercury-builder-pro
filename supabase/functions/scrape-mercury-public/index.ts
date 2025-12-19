import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "../_shared/cors.ts";

// Mercury public product page URLs by HP range and family
const MERCURY_PRODUCT_PAGES: Record<string, { url: string; hpRange: [number, number] }[]> = {
  'FourStroke': [
    { url: 'https://www.mercurymarine.com/us/en/engines/outboard/fourstroke/fourstroke-2.5-15hp', hpRange: [2.5, 15] },
    { url: 'https://www.mercurymarine.com/us/en/engines/outboard/fourstroke/fourstroke-15-20hp', hpRange: [15, 20] },
    { url: 'https://www.mercurymarine.com/us/en/engines/outboard/fourstroke/fourstroke-25-60hp', hpRange: [25, 60] },
    { url: 'https://www.mercurymarine.com/us/en/engines/outboard/fourstroke/fourstroke-75-150hp', hpRange: [75, 150] },
    { url: 'https://www.mercurymarine.com/us/en/engines/outboard/fourstroke/fourstroke-175-300hp', hpRange: [175, 300] },
  ],
  'Pro XS': [
    { url: 'https://www.mercurymarine.com/us/en/engines/outboard/pro-xs/pro-xs-115hp', hpRange: [115, 115] },
    { url: 'https://www.mercurymarine.com/us/en/engines/outboard/pro-xs/pro-xs-150hp', hpRange: [150, 150] },
    { url: 'https://www.mercurymarine.com/us/en/engines/outboard/pro-xs/pro-xs-175-300hp', hpRange: [175, 300] },
  ],
  'Verado': [
    { url: 'https://www.mercurymarine.com/us/en/engines/outboard/verado/verado-175-300hp', hpRange: [175, 300] },
    { url: 'https://www.mercurymarine.com/us/en/engines/outboard/verado/verado-350-400hp', hpRange: [350, 400] },
    { url: 'https://www.mercurymarine.com/us/en/engines/outboard/verado/v10', hpRange: [400, 450] },
  ],
  'SeaPro': [
    { url: 'https://www.mercurymarine.com/us/en/engines/outboard/seapro/seapro-fourstroke', hpRange: [15, 300] },
  ],
  'ProKicker': [
    { url: 'https://www.mercurymarine.com/us/en/engines/outboard/prokicker', hpRange: [9.9, 25] },
  ],
};

// Find the best matching product page URL for a given HP and family
function getProductPageUrl(hp: number, family: string): string | null {
  const familyPages = MERCURY_PRODUCT_PAGES[family];
  if (!familyPages) {
    // Try FourStroke as fallback
    const fallback = MERCURY_PRODUCT_PAGES['FourStroke'];
    for (const page of fallback) {
      if (hp >= page.hpRange[0] && hp <= page.hpRange[1]) {
        return page.url;
      }
    }
    return null;
  }
  
  for (const page of familyPages) {
    if (hp >= page.hpRange[0] && hp <= page.hpRange[1]) {
      return page.url;
    }
  }
  return null;
}

// Extract image URLs from page content
function extractImageUrls(content: string, links: string[]): string[] {
  const imageUrls: Set<string> = new Set();
  
  // Pattern 1: shop.mercurymarine.com CDN URLs
  const shopCdnPattern = /https?:\/\/shop\.mercurymarine\.com\/media\/catalog\/product[^\s"'<>]+\.(jpg|jpeg|png|webp)/gi;
  let match;
  while ((match = shopCdnPattern.exec(content)) !== null) {
    imageUrls.add(match[0]);
  }
  
  // Pattern 2: Mercury Marine CDN URLs
  const mercuryCdnPattern = /https?:\/\/[^\s"'<>]*mercurymarine[^\s"'<>]*\.(jpg|jpeg|png|webp)/gi;
  while ((match = mercuryCdnPattern.exec(content)) !== null) {
    // Skip thumbnails and small images
    if (!match[0].includes('thumbnail') && !match[0].includes('small')) {
      imageUrls.add(match[0]);
    }
  }
  
  // Pattern 3: Check links array for image URLs
  for (const link of links) {
    if (link.match(/\.(jpg|jpeg|png|webp)$/i)) {
      if (link.includes('mercurymarine') || link.includes('mercury')) {
        imageUrls.add(link);
      }
    }
  }
  
  // Pattern 4: General product image patterns
  const productImagePattern = /https?:\/\/[^\s"'<>]+\/(?:product|engine|outboard)[^\s"'<>]*\.(jpg|jpeg|png|webp)/gi;
  while ((match = productImagePattern.exec(content)) !== null) {
    imageUrls.add(match[0]);
  }
  
  return Array.from(imageUrls);
}

// Filter images to only keep high-quality, relevant ones
function filterImages(urls: string[], hp: number): string[] {
  return urls.filter(url => {
    // Skip obvious thumbnails and icons
    if (url.includes('thumb') || url.includes('icon') || url.includes('logo')) {
      return false;
    }
    // Skip very small dimension indicators
    if (url.match(/[_-](\d{2,3})x(\d{2,3})\./)) {
      return false;
    }
    // Prefer larger images
    if (url.includes('large') || url.includes('detail') || url.includes('hero')) {
      return true;
    }
    return true;
  });
}

// Download image and upload to Supabase Storage
async function downloadAndUploadImage(
  supabase: any,
  imageUrl: string,
  motorId: string,
  index: number
): Promise<string | null> {
  try {
    console.log(`[Public] Downloading image: ${imageUrl}`);
    
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/*',
      },
    });
    
    if (!response.ok) {
      console.error(`[Public] Failed to download: ${response.status}`);
      return null;
    }
    
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    if (bytes.length < 1000) {
      console.log(`[Public] Image too small (${bytes.length} bytes), skipping`);
      return null;
    }
    
    // Generate filename
    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
    const filename = `mercury-public/${motorId}/${Date.now()}-${index}.${ext}`;
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('motor-images')
      .upload(filename, bytes, {
        contentType,
        upsert: true,
      });
    
    if (uploadError) {
      console.error(`[Public] Upload failed:`, uploadError);
      return null;
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('motor-images')
      .getPublicUrl(filename);
    
    console.log(`[Public] Uploaded successfully: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error(`[Public] Error processing image:`, error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { hp, family, motorId, dryRun = false, batchUpdate = false } = await req.json();
    
    console.log(`[Public] Starting scrape for HP=${hp}, Family=${family}, Motor=${motorId}, BatchUpdate=${batchUpdate}`);
    
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      throw new Error('FIRECRAWL_API_KEY not configured');
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Find the right product page URL
    const productPageUrl = getProductPageUrl(hp, family);
    if (!productPageUrl) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `No product page URL found for HP=${hp}, Family=${family}`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`[Public] Scraping URL: ${productPageUrl}`);
    
    // Use Firecrawl to scrape the public page
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: productPageUrl,
        formats: ['markdown', 'html', 'links'],
        onlyMainContent: false,
        waitFor: 5000, // Wait for images to load
        timeout: 60000,
      }),
    });
    
    if (!scrapeResponse.ok) {
      const errorText = await scrapeResponse.text();
      console.error(`[Public] Firecrawl error: ${errorText}`);
      throw new Error(`Firecrawl failed: ${scrapeResponse.status}`);
    }
    
    const scrapeData = await scrapeResponse.json();
    console.log(`[Public] Scrape successful, processing content...`);
    
    const content = (scrapeData.data?.markdown || '') + ' ' + (scrapeData.data?.html || '');
    const links = scrapeData.data?.links || [];
    
    // Extract image URLs
    const allImageUrls = extractImageUrls(content, links);
    console.log(`[Public] Found ${allImageUrls.length} total image URLs`);
    
    // Filter to high-quality images
    const filteredUrls = filterImages(allImageUrls, hp);
    console.log(`[Public] Filtered to ${filteredUrls.length} quality images`);
    
    // If batch update mode, find all matching motors
    let matchingMotors: { id: string; model_display: string }[] = [];
    if (batchUpdate) {
      // Build family filter based on the family parameter
      const familyFilters: string[] = [];
      if (family === 'FourStroke') {
        familyFilters.push('FourStroke', 'fourstroke', 'Four Stroke');
      } else if (family === 'Pro XS') {
        familyFilters.push('Pro XS', 'ProXS', 'proxs');
      } else if (family === 'Verado') {
        familyFilters.push('Verado', 'verado');
      } else if (family === 'SeaPro') {
        familyFilters.push('SeaPro', 'seapro', 'Sea Pro');
      } else if (family === 'ProKicker') {
        familyFilters.push('ProKicker', 'prokicker', 'Pro Kicker');
      }
      
      // Query for motors matching HP and family
      let query = supabase
        .from('motor_models')
        .select('id, model_display')
        .eq('horsepower', hp);
      
      // Filter by family if we have filters
      if (familyFilters.length > 0) {
        // Use model_display ILIKE patterns to match family
        const familyPattern = familyFilters.map(f => `%${f}%`).join(',');
        query = query.or(familyFilters.map(f => `model_display.ilike.%${f}%`).join(','));
      }
      
      const { data: motors, error: motorsError } = await query;
      
      if (motorsError) {
        console.error(`[Public] Error fetching motors:`, motorsError);
      } else {
        matchingMotors = motors || [];
        console.log(`[Public] Found ${matchingMotors.length} matching motors for HP=${hp}, Family=${family}`);
      }
    }
    
    if (dryRun) {
      return new Response(
        JSON.stringify({
          success: true,
          dryRun: true,
          productPageUrl,
          imagesFound: filteredUrls.length,
          imageUrls: filteredUrls.slice(0, 20), // Return first 20 for preview
          matchingMotors: batchUpdate ? matchingMotors.map(m => ({ id: m.id, display: m.model_display })) : [],
          matchingMotorCount: matchingMotors.length,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Download and upload images
    // Use a shared folder for batch updates, individual motor folder otherwise
    const uploadFolder = batchUpdate ? `${hp}hp-${family.toLowerCase().replace(/\s+/g, '-')}` : (motorId || 'unknown');
    const uploadedUrls: string[] = [];
    const limit = Math.min(filteredUrls.length, 10); // Max 10 images per batch
    
    for (let i = 0; i < limit; i++) {
      const uploadedUrl = await downloadAndUploadImage(supabase, filteredUrls[i], uploadFolder, i);
      if (uploadedUrl) {
        uploadedUrls.push(uploadedUrl);
      }
    }
    
    console.log(`[Public] Uploaded ${uploadedUrls.length} images`);
    
    // Track which motors were updated
    const updatedMotors: { id: string; display: string }[] = [];
    
    if (uploadedUrls.length > 0) {
      if (batchUpdate && matchingMotors.length > 0) {
        // Batch update all matching motors
        for (const motor of matchingMotors) {
          const { error: updateError } = await supabase
            .from('motor_models')
            .update({
              images: uploadedUrls,
              image_url: uploadedUrls[0],
              hero_image_url: uploadedUrls[0],
              updated_at: new Date().toISOString(),
            })
            .eq('id', motor.id);
          
          if (updateError) {
            console.error(`[Public] Failed to update motor ${motor.id}:`, updateError);
          } else {
            console.log(`[Public] Updated motor ${motor.id} (${motor.model_display})`);
            updatedMotors.push({ id: motor.id, display: motor.model_display || '' });
          }
        }
        console.log(`[Public] Batch updated ${updatedMotors.length}/${matchingMotors.length} motors`);
      } else if (motorId) {
        // Single motor update (original behavior)
        const { error: updateError } = await supabase
          .from('motor_models')
          .update({
            images: uploadedUrls,
            image_url: uploadedUrls[0],
            hero_image_url: uploadedUrls[0],
            updated_at: new Date().toISOString(),
          })
          .eq('id', motorId);
        
        if (updateError) {
          console.error(`[Public] Failed to update motor:`, updateError);
        } else {
          console.log(`[Public] Updated motor ${motorId} with ${uploadedUrls.length} images`);
          updatedMotors.push({ id: motorId, display: '' });
        }
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        productPageUrl,
        imagesFound: filteredUrls.length,
        imagesUploaded: uploadedUrls.length,
        uploadedUrls,
        batchUpdate,
        motorsUpdated: updatedMotors.length,
        updatedMotors,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[Public] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

