import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type MotorFamily = 'Verado' | 'Pro XS' | 'FourStroke' | 'ProKicker' | 'SeaPro';

interface Motor {
  id: string;
  model_display?: string;
  horsepower?: number;
  model_number?: string;
  family?: string;
}

interface HpFamilyGroup {
  key: string;
  hp: number;
  family: MotorFamily;
  motors: Motor[];
}

// Classify motor into family based on model display
function classifyMotorFamily(modelDisplay: string): MotorFamily {
  const model = (modelDisplay || '').toUpperCase();
  
  if (model.includes('PROKICKER') || model.includes('PRO KICKER') || model.includes('PRO-KICKER')) {
    return 'ProKicker';
  }
  if (model.includes('PRO XS') || model.includes('PROXS') || model.includes('PRO-XS')) {
    return 'Pro XS';
  }
  if (model.includes('SEAPRO') || model.includes('SEA PRO') || model.includes('SEA-PRO')) {
    return 'SeaPro';
  }
  if (model.includes('VERADO')) {
    return 'Verado';
  }
  return 'FourStroke';
}

// Group motors by HP + Family
function groupMotorsByHpFamily(motors: Motor[]): HpFamilyGroup[] {
  const groups = new Map<string, HpFamilyGroup>();
  
  for (const motor of motors) {
    const hp = motor.horsepower || 0;
    const family = classifyMotorFamily(motor.model_display || '');
    const key = `${hp}-${family}`;
    
    if (!groups.has(key)) {
      groups.set(key, { key, hp, family, motors: [] });
    }
    groups.get(key)!.motors.push(motor);
  }
  
  return Array.from(groups.values()).sort((a, b) => a.hp - b.hp);
}

// Build Product Knowledge Portal URL for motor family/HP
function buildProductKnowledgeUrl(hp: number, family: MotorFamily): string {
  const baseUrl = 'https://productknowledge.mercurymarine.com/#/products/outboards';
  
  // Map family to Product Knowledge Portal paths
  // Based on structure: /#/products/outboards/{category}/{hp}
  const familyPath: Record<MotorFamily, string> = {
    'Verado': 'v6-verado',
    'Pro XS': 'pro-xs',
    'FourStroke': 'v6-fourstroke',
    'ProKicker': 'portable-fourstroke',
    'SeaPro': 'seapro',
  };
  
  // Adjust path based on HP range
  let path = familyPath[family] || 'v6-fourstroke';
  
  // Handle FourStroke HP ranges for different categories
  if (family === 'FourStroke') {
    if (hp <= 20) {
      path = 'portable-fourstroke';
    } else if (hp <= 30) {
      path = 'portable-fourstroke';
    } else if (hp <= 60) {
      path = 'mid-power-fourstroke';
    } else if (hp <= 115) {
      path = 'v4-fourstroke';
    } else {
      path = 'v6-fourstroke';
    }
  }
  
  return `${baseUrl}/${path}/${hp}`;
}

// Scrape Product Knowledge Portal using Firecrawl with automated login
async function scrapeProductKnowledgePortal(
  url: string, 
  firecrawlApiKey: string,
  dealerEmail: string,
  dealerPassword: string
): Promise<{ success: boolean; images: string[]; html?: string; error?: string }> {
  console.log('[Mercury Scrape] Scraping Product Knowledge Portal:', url);
  console.log('[Mercury Scrape] Using automated login with dealer credentials');

  try {
    // Start directly at the product URL - site will redirect to login if not authenticated
    // After login, use executeJavascript to navigate back to the product page
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url, // Start at product URL directly - will redirect to login
        formats: ['html', 'links'],
        waitFor: 5000,
        timeout: 120000,
        actions: [
          // Wait for SPA/redirect to login page
          { type: 'wait', milliseconds: 3000 },
          
          // Fill in login form
          { type: 'click', selector: 'input[type="email"], input[name="email"], input[name="username"], input[id*="email"], input[placeholder*="email" i], input[placeholder*="user" i]' },
          { type: 'write', text: dealerEmail },
          
          { type: 'click', selector: 'input[type="password"], input[name="password"], input[id*="password"]' },
          { type: 'write', text: dealerPassword },
          
          { type: 'wait', milliseconds: 500 },
          
          // Submit login
          { type: 'click', selector: 'button[type="submit"], input[type="submit"], .login-button, .btn-login' },
          
          // Wait for authentication
          { type: 'wait', milliseconds: 8000 },
          
          // Navigate to the product page using JavaScript (replacing invalid 'goto')
          { type: 'executeJavascript', script: `window.location.href = '${url}';` },
          
          // Wait for product page to load
          { type: 'wait', milliseconds: 6000 },
          
          // Scroll to load lazy images
          { type: 'scroll', direction: 'down', amount: 1000 },
          { type: 'wait', milliseconds: 1500 },
          { type: 'scroll', direction: 'down', amount: 1000 },
          { type: 'wait', milliseconds: 1500 },
          { type: 'scroll', direction: 'down', amount: 1000 },
          { type: 'wait', milliseconds: 2000 },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Mercury Scrape] Firecrawl error:', response.status, errorText);
      return { success: false, images: [], error: `Firecrawl returned ${response.status}: ${errorText}` };
    }

    const data = await response.json();
    console.log('[Mercury Scrape] Firecrawl response success:', data.success);
    
    const html = data.data?.html || data.html || '';
    
    if (!html) {
      console.log('[Mercury Scrape] No HTML content returned');
      return { success: false, images: [], error: 'No HTML content returned - login may have failed' };
    }
    
    // Check if we got a login page instead of content
    if (html.toLowerCase().includes('sign in') && html.toLowerCase().includes('password') && !html.toLowerCase().includes('product')) {
      console.log('[Mercury Scrape] Still on login page - authentication failed');
      return { success: false, images: [], error: 'Authentication failed - still on login page' };
    }
    
    const imageUrls = extractImageUrls(html);
    console.log('[Mercury Scrape] Found', imageUrls.length, 'images from Product Knowledge Portal');
    
    return { success: true, images: imageUrls, html };
  } catch (error) {
    console.error('[Mercury Scrape] Error:', error);
    return { success: false, images: [], error: (error as Error).message };
  }
}

// Extract image URLs from HTML content
function extractImageUrls(html: string): string[] {
  const images: string[] = [];
  
  // Match img src attributes
  const imgSrcMatches = html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi);
  for (const match of imgSrcMatches) {
    const src = match[1];
    if (isValidMotorImage(src)) {
      images.push(normalizeImageUrl(src));
    }
  }
  
  // Match background-image URLs
  const bgImageMatches = html.matchAll(/background-image:\s*url\(["']?([^"')]+)["']?\)/gi);
  for (const match of bgImageMatches) {
    const src = match[1];
    if (isValidMotorImage(src)) {
      images.push(normalizeImageUrl(src));
    }
  }
  
  // Match data-src for lazy-loaded images
  const dataSrcMatches = html.matchAll(/data-src=["']([^"']+)["']/gi);
  for (const match of dataSrcMatches) {
    const src = match[1];
    if (isValidMotorImage(src)) {
      images.push(normalizeImageUrl(src));
    }
  }
  
  // Match srcset images
  const srcsetMatches = html.matchAll(/srcset=["']([^"']+)["']/gi);
  for (const match of srcsetMatches) {
    const srcset = match[1];
    const urls = srcset.split(',').map(s => s.trim().split(' ')[0]);
    for (const src of urls) {
      if (isValidMotorImage(src)) {
        images.push(normalizeImageUrl(src));
      }
    }
  }
  
  // Match any Mercury CDN image URLs in the HTML
  const cdnMatches = html.matchAll(/https?:\/\/[^"'\s]*(?:mercury|productknowledge)[^"'\s]*\.(?:jpg|jpeg|png|webp)/gi);
  for (const match of cdnMatches) {
    const src = match[0];
    if (isValidMotorImage(src)) {
      images.push(normalizeImageUrl(src));
    }
  }
  
  // Deduplicate
  return [...new Set(images)];
}

// Check if URL is a valid motor image
function isValidMotorImage(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  
  if (lowerUrl.includes('logo') || 
      lowerUrl.includes('icon') || 
      lowerUrl.includes('sprite') ||
      lowerUrl.includes('placeholder') ||
      lowerUrl.includes('avatar') ||
      lowerUrl.includes('loading') ||
      lowerUrl.includes('blank') ||
      lowerUrl.includes('.svg') ||
      lowerUrl.includes('1x1') ||
      lowerUrl.includes('tracking') ||
      lowerUrl.includes('pixel') ||
      lowerUrl.includes('spacer') ||
      lowerUrl.includes('favicon') ||
      lowerUrl.includes('spinner') ||
      lowerUrl.length < 10) {
    return false;
  }
  
  // Look for motor-related keywords in URL
  const hasMotorKeyword = lowerUrl.includes('motor') || 
                          lowerUrl.includes('engine') || 
                          lowerUrl.includes('outboard') ||
                          lowerUrl.includes('product') ||
                          lowerUrl.includes('mercury') ||
                          lowerUrl.includes('verado') ||
                          lowerUrl.includes('fourstroke') ||
                          lowerUrl.includes('seapro') ||
                          lowerUrl.includes('prokicker') ||
                          lowerUrl.includes('pro-xs');
  
  const hasImageExt = lowerUrl.includes('.jpg') || 
                      lowerUrl.includes('.jpeg') || 
                      lowerUrl.includes('.png') || 
                      lowerUrl.includes('.webp');
  
  return hasImageExt || (hasMotorKeyword && !lowerUrl.includes('.svg'));
}

// Normalize relative URLs to absolute
function normalizeImageUrl(url: string): string {
  if (url.startsWith('//')) {
    return 'https:' + url;
  }
  if (url.startsWith('/')) {
    return 'https://productknowledge.mercurymarine.com' + url;
  }
  return url;
}

// Upload image to Supabase storage with group-based path
async function uploadImageToStorage(
  supabase: any,
  imageUrl: string,
  groupKey: string,
  index: number
): Promise<string | null> {
  try {
    console.log('[Upload] Fetching image:', imageUrl);
    
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://productknowledge.mercurymarine.com/',
      },
    });
    
    if (!response.ok) {
      console.error('[Upload] Failed to fetch image:', response.status);
      return null;
    }
    
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    let ext = 'jpg';
    if (contentType.includes('png')) ext = 'png';
    else if (contentType.includes('webp')) ext = 'webp';
    
    // Use group-based path: mercury/{HP}-{Family}/{index}.jpg
    const fileName = `mercury/${groupKey}/${index}.${ext}`;
    
    const { data, error } = await supabase.storage
      .from('motor-images')
      .upload(fileName, uint8Array, {
        contentType,
        upsert: true,
      });
    
    if (error) {
      console.error('[Upload] Storage error:', error);
      return null;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('motor-images')
      .getPublicUrl(fileName);
    
    console.log('[Upload] Uploaded successfully:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('[Upload] Error:', error);
    return null;
  }
}

// Insert image into motor_media table
async function insertMotorMedia(
  supabase: any,
  motorId: string,
  imageUrl: string,
  groupKey: string,
  index: number
): Promise<boolean> {
  try {
    const { error } = await supabase.from('motor_media').upsert({
      motor_id: motorId,
      media_url: imageUrl,
      media_type: 'image',
      media_category: index === 0 ? 'hero' : 'gallery',
      display_order: index,
      is_active: true,
      metadata: { 
        source: 'mercury_product_knowledge', 
        hp_family: groupKey,
        scraped_at: new Date().toISOString()
      }
    }, {
      onConflict: 'motor_id,media_url'
    });
    
    if (error) {
      console.error('[Motor Media] Insert error:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('[Motor Media] Error:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { motorIds, dryRun = false, batchSize = 50, maxImagesPerGroup = 10, includeOutOfStock = true } = await req.json();

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      throw new Error('FIRECRAWL_API_KEY not configured');
    }

    const dealerEmail = Deno.env.get('MERCURY_DEALER_EMAIL');
    const dealerPassword = Deno.env.get('MERCURY_DEALER_PASSWORD');
    
    if (!dealerEmail || !dealerPassword) {
      throw new Error('MERCURY_DEALER_EMAIL and MERCURY_DEALER_PASSWORD must be configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[Main] Starting Mercury Product Knowledge Portal scrape with automated login...');
    console.log('[Main] Target: productknowledge.mercurymarine.com');

    // Get motors to process
    let query = supabase
      .from('motor_models')
      .select('id, model_display, horsepower, model_number, family');
    
    if (!includeOutOfStock) {
      query = query.eq('in_stock', true);
    }

    if (motorIds && motorIds.length > 0) {
      query = query.in('id', motorIds);
    }

    const { data: motors, error: motorsError } = await query.limit(batchSize);

    if (motorsError) {
      throw motorsError;
    }

    // Group motors by HP + Family
    const groups = groupMotorsByHpFamily(motors || []);
    console.log('[Main] Found', groups.length, 'unique HP+Family groups from', motors?.length || 0, 'motors');

    const results = {
      processed: 0,
      groupsProcessed: 0,
      totalMotorsUpdated: 0,
      totalImagesFound: 0,
      totalImagesUploaded: 0,
      errors: [] as string[],
      groups: [] as any[],
    };

    for (const group of groups) {
      try {
        console.log(`[Main] Processing group: ${group.key} (${group.motors.length} motors)`);
        
        const searchUrl = buildProductKnowledgeUrl(group.hp, group.family);
        const scrapeResult = await scrapeProductKnowledgePortal(
          searchUrl, 
          firecrawlApiKey,
          dealerEmail,
          dealerPassword
        );
        
        if (!scrapeResult.success || scrapeResult.images.length === 0) {
          results.errors.push(`Group ${group.key}: ${scrapeResult.error || 'No images found'}`);
          results.groups.push({
            key: group.key,
            hp: group.hp,
            family: group.family,
            motorCount: group.motors.length,
            status: 'no_images',
            url: searchUrl,
            error: scrapeResult.error,
          });
          continue;
        }

        const imagesToProcess = scrapeResult.images.slice(0, maxImagesPerGroup);
        results.totalImagesFound += imagesToProcess.length;

        if (dryRun) {
          results.groups.push({
            key: group.key,
            hp: group.hp,
            family: group.family,
            motorCount: group.motors.length,
            motorIds: group.motors.map(m => m.id),
            motorDisplays: group.motors.map(m => m.model_display),
            status: 'dry_run',
            imagesFound: imagesToProcess.length,
            imageUrls: imagesToProcess.slice(0, 5),
            targetUrl: searchUrl,
          });
        } else {
          // Upload images for this group
          const uploadedImages: { url: string; index: number }[] = [];
          
          for (let i = 0; i < imagesToProcess.length; i++) {
            const uploadedUrl = await uploadImageToStorage(
              supabase,
              imagesToProcess[i],
              group.key,
              i
            );
            
            if (uploadedUrl) {
              uploadedImages.push({ url: uploadedUrl, index: i });
              results.totalImagesUploaded++;
            }
          }

          if (uploadedImages.length > 0) {
            const imagesArray = uploadedImages.map((img, idx) => ({
              url: img.url,
              type: idx === 0 ? 'hero' : 'gallery',
              source: 'mercury_product_knowledge'
            }));

            // Update ALL motors in this group
            for (const motor of group.motors) {
              await supabase
                .from('motor_models')
                .update({ 
                  hero_image_url: uploadedImages[0].url,
                  images: imagesArray,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', motor.id);

              for (const img of uploadedImages) {
                await insertMotorMedia(
                  supabase,
                  motor.id,
                  img.url,
                  group.key,
                  img.index
                );
              }
              
              results.totalMotorsUpdated++;
            }

            results.groups.push({
              key: group.key,
              hp: group.hp,
              family: group.family,
              motorCount: group.motors.length,
              status: 'success',
              imagesUploaded: uploadedImages.length,
              motorsUpdated: group.motors.length,
              heroImage: uploadedImages[0].url,
            });
          }
        }

        results.groupsProcessed++;
        results.processed++;

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error) {
        console.error('[Main] Error processing group:', group.key, error);
        results.errors.push(`${group.key}: ${(error as Error).message}`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      dryRun,
      results,
      message: dryRun 
        ? `Dry run complete. Found ${results.totalImagesFound} images across ${results.groupsProcessed} groups.`
        : `Scraped ${results.totalImagesUploaded} images and updated ${results.totalMotorsUpdated} motors.`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Main] Fatal error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: (error as Error).message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
