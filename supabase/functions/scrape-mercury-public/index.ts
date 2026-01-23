import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
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

// Family keywords to exclude when scraping a specific family
const FAMILY_EXCLUSIONS: Record<string, string[]> = {
  'FourStroke': ['verado', 'v10', 'v12', 'proxs', 'pro-xs', 'seapro', 'sea-pro', 'prokicker', 'jet', '_jet_', '-jet-'],
  'Pro XS': ['verado', 'v10', 'v12', 'fourstroke', 'four-stroke', 'seapro', 'sea-pro', 'prokicker', 'jet', '_jet_'],
  'Verado': ['fourstroke', 'four-stroke', 'proxs', 'pro-xs', 'seapro', 'sea-pro', 'prokicker', 'jet', '_jet_'],
  'SeaPro': ['verado', 'v10', 'v12', 'proxs', 'pro-xs', 'fourstroke', 'prokicker'],
  'ProKicker': ['verado', 'v10', 'v12', 'proxs', 'pro-xs', 'seapro', 'fourstroke', 'jet'],
};

// HP values that should be excluded for specific target HPs (jet models, etc.)
const HP_EXCLUSIONS: Record<number, number[]> = {
  150: [105, 80, 65, 40], // 105hp jet, 80hp jet, etc.
  115: [80, 65, 40],
  100: [80, 65],
  90: [65, 40],
  75: [40, 65],
};

// Check if a URL is a hash-based CDN URL with no descriptive info
function isHashBasedUrl(url: string): boolean {
  // Match URLs that end with hash-like filenames (32+ hex chars)
  const hashPattern = /\/[a-f0-9]{32,}\.(jpg|jpeg|png|webp)$/i;
  return hashPattern.test(url);
}

// Marketing/accessory content to exclude
const MARKETING_EXCLUSIONS = [
  'experience-fragment', 'gauges_and_controls', 'gauge', 'gauges',
  'joystick', 'joystick-piloting', 'vesselview', 'smartcraft',
  'appscreen', 'app-and-connectivity', 'display', 'screen',
  'controls', 'controlpanel', 'control-panel', 'helm',
  'rigging', 'propeller', 'prop', 'hardware', 'accessories',
  'warranty', 'trophy', 'award', 'icon', 'badge', 'label',
];

// Keywords that indicate a real motor image
const MOTOR_KEYWORDS = [
  'hp', 'outboard', 'engine', 'motor', 'fourstroke', 'four-stroke',
  'verado', 'proxs', 'pro-xs', 'seapro', 'sea-pro', 'prokicker',
  'port', 'stbd', 'starboard', 'profile', 'webgrouping',
];

// Filter images to only keep high-quality, relevant ones for the specific HP and family
function filterImages(urls: string[], hp: number, family: string, controlType?: string): { url: string; score: number }[] {
  const urlLower = (url: string) => url.toLowerCase();
  const exclusions = FAMILY_EXCLUSIONS[family] || [];
  const hpExclusions = HP_EXCLUSIONS[hp] || [];
  
  const scored = urls.map(url => {
    const lower = urlLower(url);
    let score = 0;
    let excluded = false;
    
    // === EXCLUSION CHECKS ===
    
    // Skip obvious thumbnails, icons, logos
    if (lower.includes('thumb') || lower.includes('icon') || lower.includes('logo')) {
      excluded = true;
    }
    
    // Skip very small dimension indicators (e.g., 100x100)
    if (url.match(/[_-](\d{2,3})x(\d{2,3})\./)) {
      excluded = true;
    }
    
    // Skip gallery/lifestyle/promotional images
    if (lower.includes('gallery') || lower.includes('lifestyle') || lower.includes('dealer') || 
        lower.includes('banner') || lower.includes('promo') || lower.includes('boat-') ||
        lower.includes('fishing') || lower.includes('action') || lower.includes('hero-image') ||
        lower.includes('carousel') || lower.includes('slider')) {
      excluded = true;
    }
    
    // NEW: Exclude marketing/accessory content (gauges, joysticks, displays, app screens)
    for (const excl of MARKETING_EXCLUSIONS) {
      if (lower.includes(excl)) {
        console.log(`[Public] Excluding marketing content (${excl}): ${url.substring(0, 80)}`);
        excluded = true;
        break;
      }
    }
    
    // Exclude wrong motor families
    for (const excl of exclusions) {
      if (lower.includes(excl)) {
        console.log(`[Public] Excluding image (wrong family: ${excl}): ${url.substring(0, 80)}`);
        excluded = true;
        break;
      }
    }
    
    // Check for HP values in the URL and exclude if wrong HP
    const hpMatches = lower.match(/(\d+)hp/g);
    if (hpMatches) {
      for (const match of hpMatches) {
        const imageHp = parseInt(match.replace('hp', ''), 10);
        
        // Check if this HP is in the exclusion list for our target HP
        if (hpExclusions.includes(imageHp)) {
          console.log(`[Public] Excluding image (excluded HP: ${imageHp}): ${url.substring(0, 80)}`);
          excluded = true;
          break;
        }
        
        if (imageHp !== hp) {
          // Allow close HP values (within same family range is ok for generic shots)
          // But exclude definitely wrong ones
          const hpDiff = Math.abs(imageHp - hp);
          if (hpDiff > 25) {
            console.log(`[Public] Excluding image (wrong HP: ${imageHp} vs ${hp}): ${url.substring(0, 80)}`);
            excluded = true;
            break;
          } else if (hpDiff > 10) {
            score -= 10; // Moderate penalty for nearby but not exact HP
          } else {
            score -= 5; // Slight penalty for close HP
          }
        } else {
          // Exact HP match - big bonus!
          score += 30;
        }
      }
    }
    
    // Exclude tiller images when looking for remote motors
    if (controlType === 'Remote' || controlType === 'remote') {
      if (lower.includes('tiller') || lower.includes('_t_') || lower.includes('-t-') || 
          lower.includes('_t.') || lower.includes('-t.') || lower.includes('tiller-handle')) {
        console.log(`[Public] Excluding image (tiller for remote motor): ${url.substring(0, 80)}`);
        excluded = true;
      }
    }
    
    // Exclude remote images when looking for tiller motors
    if (controlType === 'Tiller' || controlType === 'tiller') {
      if (lower.includes('remote') || lower.includes('_r_') || lower.includes('-r-') ||
          lower.includes('_r.') || lower.includes('-r.')) {
        console.log(`[Public] Excluding image (remote for tiller motor): ${url.substring(0, 80)}`);
        excluded = true;
      }
    }
    
    if (excluded) {
      return { url, score: -1000 };
    }
    
    // === MOTOR IMAGE REQUIREMENT ===
    // Check if URL contains any motor-related keywords
    const hasMotorKeyword = MOTOR_KEYWORDS.some(kw => lower.includes(kw));
    if (!hasMotorKeyword) {
      // No motor keywords at all - this is probably not a motor image
      console.log(`[Public] Penalizing URL with no motor keywords: ${url.substring(0, 80)}`);
      score -= 40; // Heavy penalty for non-motor images
    }
    
    // === SCORING BONUSES ===
    
    // HEAVILY penalize hash-based URLs (can't verify content)
    if (isHashBasedUrl(url)) {
      score -= 50; // Strong penalty - these images can't be verified
      console.log(`[Public] Penalizing hash-based URL: ${url.substring(0, 60)}`);
    }
    
    // Prefer images with target HP in filename
    if (lower.includes(`${hp}hp`)) {
      score += 35; // Increased bonus for exact HP
    }
    
    // Prefer images with descriptive filenames
    if (lower.includes(`${hp}`) && (lower.includes('fourstroke') || lower.includes('fs') || 
        lower.includes('verado') || lower.includes('proxs') || lower.includes('seapro'))) {
      score += 25;
    }
    
    // Prefer webgrouping images (Mercury's standard product shots)
    if (lower.includes('webgrouping')) {
      score += 30;
    }
    
    // Prefer product/engine shots from shop CDN with descriptive names
    if (lower.includes('shop.mercurymarine.com/media/catalog/product') && !isHashBasedUrl(url)) {
      score += 20;
    }
    
    // Prefer images with family name
    const familyLower = family.toLowerCase().replace(/\s+/g, '');
    if (lower.includes(familyLower) || lower.includes(family.toLowerCase().replace(/\s+/g, '-'))) {
      score += 15;
    }
    
    // Prefer port-side or starboard profile shots
    if (lower.includes('port') || lower.includes('stbd') || lower.includes('starboard') || lower.includes('profile')) {
      score += 15;
    }
    
    // Prefer larger/detail images
    if (lower.includes('large') || lower.includes('detail')) {
      score += 10;
    }
    
    // Prefer PNG (usually higher quality cutouts) but only if descriptive
    if (lower.endsWith('.png') && !isHashBasedUrl(url)) {
      score += 5;
    }
    
    return { url, score };
  });
  
  // Filter out excluded images AND low-scoring non-motor images, sort by score descending
  return scored
    .filter(item => item.score > -50) // Must have at least some positive indicators
    .sort((a, b) => b.score - a.score);
}

// Check if image is mostly blank/white (transparent PNG or corrupt)
function isImageMostlyBlank(bytes: Uint8Array): boolean {
  // Quick check: if file is very small, it might be corrupt
  if (bytes.length < 5000) {
    return true;
  }
  
  // Sample some bytes from the image data (skip header)
  // A mostly white/blank image will have very uniform byte values
  const sampleStart = Math.min(1000, Math.floor(bytes.length * 0.1));
  const sampleEnd = Math.min(bytes.length - 100, sampleStart + 2000);
  
  if (sampleEnd <= sampleStart) {
    return false; // Can't sample, assume it's ok
  }
  
  let uniformCount = 0;
  const threshold = 250; // Near-white values
  
  for (let i = sampleStart; i < sampleEnd; i += 3) {
    if (bytes[i] > threshold && bytes[i + 1] > threshold && bytes[i + 2] > threshold) {
      uniformCount++;
    }
  }
  
  const sampleSize = (sampleEnd - sampleStart) / 3;
  const uniformRatio = uniformCount / sampleSize;
  
  // If more than 80% of sampled pixels are near-white, it's probably blank
  return uniformRatio > 0.8;
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
    
    // Minimum size check - 10KB for meaningful images
    if (bytes.length < 10000) {
      console.log(`[Public] Image too small (${bytes.length} bytes), skipping`);
      return null;
    }
    
    // Check for blank/white images
    if (isImageMostlyBlank(bytes)) {
      console.log(`[Public] Image appears mostly blank, skipping: ${imageUrl.substring(0, 60)}`);
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
    const { hp, family, motorId, controlType, dryRun = false, batchUpdate = false } = await req.json();
    
    console.log(`[Public] Starting scrape for HP=${hp}, Family=${family}, Control=${controlType}, Motor=${motorId}, BatchUpdate=${batchUpdate}`);
    
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
    
    // Filter to high-quality images with HP, family, and control type awareness
    const scoredUrls = filterImages(allImageUrls, hp, family, controlType);
    const filteredUrls = scoredUrls.slice(0, 10).map(item => item.url); // Take top 10 scored images
    console.log(`[Public] Filtered to ${filteredUrls.length} quality images (from ${allImageUrls.length} total)`);
    console.log(`[Public] Top scored URLs:`, scoredUrls.slice(0, 5).map(s => ({ url: s.url.substring(0, 60), score: s.score })));
    
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
    
    // Download and upload images - limit to 5 quality images
    // Use a shared folder for batch updates, individual motor folder otherwise
    const uploadFolder = batchUpdate ? `${hp}hp-${family.toLowerCase().replace(/\s+/g, '-')}` : (motorId || 'unknown');
    const uploadedUrls: string[] = [];
    const limit = Math.min(filteredUrls.length, 5); // Max 5 images per batch for quality
    
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

