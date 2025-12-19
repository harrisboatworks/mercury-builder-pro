import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Maximum groups to process per invocation to prevent timeout
const MAX_GROUPS_PER_RUN = 5;
const SCRAPE_TIMEOUT_MS = 60000; // 60 seconds per scrape

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

interface ScrapeResult {
  success: boolean;
  images: string[];
  html?: string;
  screenshot?: string;
  error?: string;
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
  
  const familyPath: Record<MotorFamily, string> = {
    'Verado': 'v6-verado',
    'Pro XS': 'pro-xs',
    'FourStroke': 'v6-fourstroke',
    'ProKicker': 'portable-fourstroke',
    'SeaPro': 'seapro',
  };
  
  let path = familyPath[family] || 'v6-fourstroke';
  
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

// Scrape using Firecrawl Agent Mode (FIRE-1) for automated login
async function scrapeWithAgentMode(
  url: string,
  firecrawlApiKey: string,
  dealerEmail: string,
  dealerPassword: string,
  hp: number,
  family: string
): Promise<ScrapeResult> {
  console.log('[Agent Mode] Scraping with FIRE-1 agent:', url);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SCRAPE_TIMEOUT_MS);
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        url: 'https://productknowledge.mercurymarine.com',
        formats: ['html', 'links', 'screenshot'],
        timeout: 90000,
        waitFor: 3000,
        agent: {
          model: 'FIRE-1',
          prompt: `You are logging into a Mercury Marine dealer portal.

1. First, you'll see a login page. Fill in the login form:
   - Email/Username field: Enter "${dealerEmail}"
   - Password field: Enter "${dealerPassword}"
   - Click the login/submit button

2. After logging in successfully, navigate to the products section for outboard motors.

3. Navigate to find ${hp} horsepower ${family} motors. Look for product images.

4. Once you find the product page with motor images, scroll down to load all images.

5. The goal is to capture all product images of Mercury ${hp}HP ${family} outboard motors.`,
        },
      }),
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Agent Mode] Firecrawl error:', response.status, errorText);
      return { success: false, images: [], error: `Agent mode returned ${response.status}: ${errorText}` };
    }

    const data = await response.json();
    console.log('[Agent Mode] Response success:', data.success);
    
    const html = data.data?.html || data.html || '';
    const screenshot = data.data?.screenshot || data.screenshot || '';
    
    if (screenshot) {
      console.log('[Agent Mode] Screenshot captured (base64 length):', screenshot.length);
    }
    
    if (!html) {
      console.log('[Agent Mode] No HTML content returned');
      return { 
        success: false, 
        images: [], 
        screenshot,
        error: 'No HTML content returned from agent' 
      };
    }
    
    const imageUrls = extractImageUrls(html);
    console.log('[Agent Mode] Found', imageUrls.length, 'images');
    
    return { success: true, images: imageUrls, html, screenshot };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[Agent Mode] Request timed out after', SCRAPE_TIMEOUT_MS, 'ms');
      return { success: false, images: [], error: 'Request timed out' };
    }
    console.error('[Agent Mode] Error:', error);
    return { success: false, images: [], error: (error as Error).message };
  }
}

// Fallback: Simple scrape with manual actions
async function scrapeWithActions(
  url: string, 
  firecrawlApiKey: string,
  dealerEmail: string,
  dealerPassword: string
): Promise<ScrapeResult> {
  console.log('[Actions Mode] Scraping with manual actions:', url);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SCRAPE_TIMEOUT_MS);
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        url: 'https://productknowledge.mercurymarine.com',
        formats: ['html', 'links', 'screenshot'],
        waitFor: 3000,
        timeout: 60000,
        actions: [
          { type: 'wait', milliseconds: 2000 },
          { type: 'screenshot' },
          { type: 'click', selector: 'input[type="email"], input[name="email"], input[name="username"], #email, #username' },
          { type: 'write', text: dealerEmail },
          { type: 'click', selector: 'input[type="password"], input[name="password"], #password' },
          { type: 'write', text: dealerPassword },
          { type: 'wait', milliseconds: 300 },
          { type: 'click', selector: 'button[type="submit"], input[type="submit"], .login-btn, .btn-primary' },
          { type: 'wait', milliseconds: 5000 },
          { type: 'screenshot' },
          { type: 'executeJavascript', script: `window.location.href = '${url}';` },
          { type: 'wait', milliseconds: 4000 },
          { type: 'scroll', direction: 'down', amount: 800 },
          { type: 'wait', milliseconds: 1000 },
          { type: 'scroll', direction: 'down', amount: 800 },
          { type: 'wait', milliseconds: 1000 },
        ],
      }),
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Actions Mode] Firecrawl error:', response.status, errorText);
      return { success: false, images: [], error: `Actions mode returned ${response.status}: ${errorText}` };
    }

    const data = await response.json();
    console.log('[Actions Mode] Response success:', data.success);
    
    const html = data.data?.html || data.html || '';
    const screenshot = data.data?.screenshot || data.screenshot || '';
    
    if (screenshot) {
      console.log('[Actions Mode] Screenshot captured');
    }
    
    if (!html) {
      return { success: false, images: [], screenshot, error: 'No HTML content returned' };
    }
    
    // Check if still on login page
    if (html.toLowerCase().includes('sign in') && html.toLowerCase().includes('password') && !html.toLowerCase().includes('outboard')) {
      console.log('[Actions Mode] Still on login page - authentication failed');
      return { success: false, images: [], screenshot, error: 'Authentication failed - still on login page' };
    }
    
    const imageUrls = extractImageUrls(html);
    console.log('[Actions Mode] Found', imageUrls.length, 'images');
    
    return { success: true, images: imageUrls, html, screenshot };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[Actions Mode] Request timed out');
      return { success: false, images: [], error: 'Request timed out' };
    }
    console.error('[Actions Mode] Error:', error);
    return { success: false, images: [], error: (error as Error).message };
  }
}

// Main scrape function that tries Agent mode first, then falls back to Actions
async function scrapeProductKnowledgePortal(
  url: string, 
  firecrawlApiKey: string,
  dealerEmail: string,
  dealerPassword: string,
  hp: number,
  family: string
): Promise<ScrapeResult> {
  console.log('[Scrape] Starting scrape for:', url);
  
  // Try Agent mode first (FIRE-1)
  let result = await scrapeWithAgentMode(url, firecrawlApiKey, dealerEmail, dealerPassword, hp, family);
  
  if (result.success && result.images.length > 0) {
    console.log('[Scrape] Agent mode succeeded with', result.images.length, 'images');
    return result;
  }
  
  console.log('[Scrape] Agent mode failed or no images, trying Actions mode...');
  
  // Fallback to Actions mode
  result = await scrapeWithActions(url, firecrawlApiKey, dealerEmail, dealerPassword);
  
  return result;
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

// Save debug screenshot to storage
async function saveDebugScreenshot(
  supabase: any,
  screenshot: string,
  groupKey: string,
  mode: string
): Promise<string | null> {
  if (!screenshot) return null;
  
  try {
    console.log('[Debug] Saving screenshot, input length:', screenshot.length);
    
    // Firecrawl may return screenshot as:
    // 1. data:image/png;base64,... (with prefix)
    // 2. Pure base64 string (no prefix)
    // 3. URL to the screenshot
    
    let bytes: Uint8Array;
    
    // Check if it's a URL
    if (screenshot.startsWith('http://') || screenshot.startsWith('https://')) {
      console.log('[Debug] Screenshot is URL, fetching...');
      const response = await fetch(screenshot);
      if (!response.ok) {
        console.error('[Debug] Failed to fetch screenshot URL:', response.status);
        return null;
      }
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      bytes = new Uint8Array(arrayBuffer);
    } else {
      // It's base64, possibly with data: prefix
      // Remove data: prefix and any whitespace/newlines
      let base64Data = screenshot.replace(/^data:image\/\w+;base64,/, '');
      base64Data = base64Data.replace(/[\s\r\n]/g, ''); // Remove all whitespace
      
      console.log('[Debug] Base64 first 100 chars:', base64Data.substring(0, 100));
      console.log('[Debug] Base64 last 50 chars:', base64Data.substring(base64Data.length - 50));
      console.log('[Debug] Base64 cleaned length:', base64Data.length);
      
      try {
        const binaryStr = atob(base64Data);
        bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        console.log('[Debug] Decoded to', bytes.length, 'bytes');
      } catch (decodeError) {
        console.error('[Debug] Failed to decode base64:', decodeError);
        console.error('[Debug] Base64 sample causing error:', base64Data.substring(0, 200));
        return null;
      }
    }
    
    const fileName = `mercury/debug/${groupKey.replace(/[^a-zA-Z0-9-]/g, '_')}-${mode}-${Date.now()}.png`;
    console.log('[Debug] Uploading to:', fileName, 'size:', bytes.length);
    
    const { error } = await supabase.storage
      .from('motor-images')
      .upload(fileName, bytes, {
        contentType: 'image/png',
        upsert: true,
      });
    
    if (error) {
      console.error('[Debug] Failed to save screenshot:', error);
      return null;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('motor-images')
      .getPublicUrl(fileName);
    
    console.log('[Debug] Screenshot saved:', publicUrl);
    return publicUrl;
  } catch (e) {
    console.error('[Debug] Error saving screenshot:', e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      motorIds, 
      dryRun = false, 
      batchSize = 50, 
      maxImagesPerGroup = 10, 
      includeOutOfStock = true,
      maxGroups = MAX_GROUPS_PER_RUN,
      startFromGroup = 0,
      saveScreenshots = true,
    } = await req.json();

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

    console.log('[Main] Starting Mercury scrape with Agent Mode (FIRE-1)...');
    console.log('[Main] Max groups per run:', maxGroups);
    console.log('[Main] Starting from group:', startFromGroup);

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
    const allGroups = groupMotorsByHpFamily(motors || []);
    
    // Apply pagination - only process a subset of groups to prevent timeout
    const groups = allGroups.slice(startFromGroup, startFromGroup + maxGroups);
    const hasMoreGroups = allGroups.length > startFromGroup + maxGroups;
    
    console.log('[Main] Total groups:', allGroups.length);
    console.log('[Main] Processing groups', startFromGroup, 'to', startFromGroup + groups.length);

    const results = {
      processed: 0,
      groupsProcessed: 0,
      totalGroups: allGroups.length,
      startedFromGroup: startFromGroup,
      hasMoreGroups,
      nextStartGroup: hasMoreGroups ? startFromGroup + maxGroups : null,
      totalMotorsUpdated: 0,
      totalImagesFound: 0,
      totalImagesUploaded: 0,
      errors: [] as string[],
      groups: [] as any[],
      debugScreenshots: [] as string[],
    };

    for (const group of groups) {
      try {
        console.log(`[Main] Processing group ${results.groupsProcessed + 1}/${groups.length}: ${group.key}`);
        
        const searchUrl = buildProductKnowledgeUrl(group.hp, group.family);
        const scrapeResult = await scrapeProductKnowledgePortal(
          searchUrl, 
          firecrawlApiKey,
          dealerEmail,
          dealerPassword,
          group.hp,
          group.family
        );
        
        // Save debug screenshot if available
        if (saveScreenshots && scrapeResult.screenshot) {
          const screenshotUrl = await saveDebugScreenshot(
            supabase, 
            scrapeResult.screenshot, 
            group.key,
            scrapeResult.success ? 'success' : 'failed'
          );
          if (screenshotUrl) {
            results.debugScreenshots.push(screenshotUrl);
          }
        }
        
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
            hasScreenshot: !!scrapeResult.screenshot,
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
            hasScreenshot: !!scrapeResult.screenshot,
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

        // Short delay between groups
        await new Promise(resolve => setTimeout(resolve, 2000));
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
      nextBatch: hasMoreGroups ? {
        startFromGroup: startFromGroup + maxGroups,
        remainingGroups: allGroups.length - (startFromGroup + maxGroups),
      } : null,
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
