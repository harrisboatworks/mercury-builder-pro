import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mercury Portal authentication
async function authenticateMercuryPortal(): Promise<{ cookies: string; token: string } | null> {
  const email = Deno.env.get('MERCURY_DEALER_EMAIL');
  const password = Deno.env.get('MERCURY_DEALER_PASSWORD');
  
  if (!email || !password) {
    console.error('[Mercury Auth] Missing dealer credentials');
    return null;
  }

  console.log('[Mercury Auth] Attempting login for:', email);
  
  try {
    // Mercury portal uses a standard login endpoint
    const loginResponse = await fetch('https://productknowledge.mercurymarine.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: JSON.stringify({ 
        email, 
        password,
        rememberMe: true 
      }),
    });

    if (!loginResponse.ok) {
      console.error('[Mercury Auth] Login failed:', loginResponse.status, await loginResponse.text());
      return null;
    }

    // Extract cookies from response
    const setCookieHeaders = loginResponse.headers.getSetCookie?.() || [];
    const cookies = setCookieHeaders.map(c => c.split(';')[0]).join('; ');
    
    // Also try to get auth token from response body
    const loginData = await loginResponse.json();
    const token = loginData.token || loginData.accessToken || '';
    
    console.log('[Mercury Auth] Login successful, got session cookies:', cookies.length > 0);
    
    return { cookies, token };
  } catch (error) {
    console.error('[Mercury Auth] Login error:', error);
    return null;
  }
}

// Scrape Mercury portal with authentication using Firecrawl
async function scrapeMercuryWithFirecrawl(
  url: string, 
  session: { cookies: string; token: string },
  firecrawlApiKey: string
): Promise<{ success: boolean; images: string[]; html?: string }> {
  console.log('[Mercury Scrape] Scraping URL:', url);
  
  const headers: Record<string, string> = {
    'Cookie': session.cookies,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  };
  
  if (session.token) {
    headers['Authorization'] = `Bearer ${session.token}`;
  }

  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['html', 'markdown'],
        headers,
        waitFor: 5000, // Wait for dynamic content
        timeout: 30000,
      }),
    });

    if (!response.ok) {
      console.error('[Mercury Scrape] Firecrawl error:', response.status);
      return { success: false, images: [] };
    }

    const data = await response.json();
    const html = data.data?.html || data.html || '';
    
    // Extract image URLs from HTML
    const imageUrls = extractImageUrls(html);
    console.log('[Mercury Scrape] Found', imageUrls.length, 'images');
    
    return { success: true, images: imageUrls, html };
  } catch (error) {
    console.error('[Mercury Scrape] Error:', error);
    return { success: false, images: [] };
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
  
  // Deduplicate
  return [...new Set(images)];
}

// Check if URL is a valid motor image (not icon, logo, etc.)
function isValidMotorImage(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  
  // Skip common non-product images
  if (lowerUrl.includes('logo') || 
      lowerUrl.includes('icon') || 
      lowerUrl.includes('sprite') ||
      lowerUrl.includes('placeholder') ||
      lowerUrl.includes('avatar') ||
      lowerUrl.includes('loading') ||
      lowerUrl.includes('blank') ||
      lowerUrl.includes('.svg') ||
      lowerUrl.includes('1x1') ||
      lowerUrl.length < 10) {
    return false;
  }
  
  // Must be an image format
  return lowerUrl.includes('.jpg') || 
         lowerUrl.includes('.jpeg') || 
         lowerUrl.includes('.png') || 
         lowerUrl.includes('.webp');
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

// Build Mercury portal product URL from motor info
function buildMercuryProductUrl(motor: { model_display?: string; horsepower?: number; model_number?: string }): string {
  // Mercury portal URL patterns - will need discovery/adjustment
  // Try search-based approach first
  const searchTerm = motor.model_display || motor.model_number || '';
  return `https://productknowledge.mercurymarine.com/#/search?q=${encodeURIComponent(searchTerm)}`;
}

// Upload image to Supabase storage
async function uploadImageToStorage(
  supabase: any,
  imageUrl: string,
  motorId: string,
  index: number
): Promise<string | null> {
  try {
    console.log('[Upload] Fetching image:', imageUrl);
    
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
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
    
    // Determine file extension
    let ext = 'jpg';
    if (contentType.includes('png')) ext = 'png';
    else if (contentType.includes('webp')) ext = 'webp';
    
    const fileName = `${motorId}/mercury-${index}.${ext}`;
    
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
    
    // Get public URL
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { motorIds, dryRun = false, batchSize = 5 } = await req.json();

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      throw new Error('FIRECRAWL_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate with Mercury portal
    console.log('[Main] Authenticating with Mercury portal...');
    const session = await authenticateMercuryPortal();
    
    if (!session) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to authenticate with Mercury portal. Check credentials.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Get motors to process
    let query = supabase
      .from('motor_models')
      .select('id, model_display, horsepower, model_number, image_url, family')
      .eq('in_stock', true);

    if (motorIds && motorIds.length > 0) {
      query = query.in('id', motorIds);
    }

    const { data: motors, error: motorsError } = await query.limit(batchSize);

    if (motorsError) {
      throw motorsError;
    }

    console.log('[Main] Processing', motors?.length || 0, 'motors');

    const results = {
      processed: 0,
      imagesFound: 0,
      imagesUploaded: 0,
      errors: [] as string[],
      details: [] as any[],
    };

    for (const motor of motors || []) {
      try {
        console.log('[Main] Processing motor:', motor.model_display);
        
        const productUrl = buildMercuryProductUrl(motor);
        const scrapeResult = await scrapeMercuryWithFirecrawl(productUrl, session, firecrawlApiKey);
        
        if (!scrapeResult.success || scrapeResult.images.length === 0) {
          results.details.push({
            motorId: motor.id,
            modelDisplay: motor.model_display,
            status: 'no_images',
            url: productUrl,
          });
          continue;
        }

        results.imagesFound += scrapeResult.images.length;

        if (dryRun) {
          results.details.push({
            motorId: motor.id,
            modelDisplay: motor.model_display,
            status: 'dry_run',
            imagesFound: scrapeResult.images.length,
            imageUrls: scrapeResult.images.slice(0, 3), // Show first 3
          });
        } else {
          // Upload best image (first one, usually main product image)
          const uploadedUrl = await uploadImageToStorage(
            supabase,
            scrapeResult.images[0],
            motor.id,
            0
          );

          if (uploadedUrl) {
            // Update motor with new image
            await supabase
              .from('motor_models')
              .update({ 
                image_url: uploadedUrl,
                updated_at: new Date().toISOString(),
              })
              .eq('id', motor.id);

            results.imagesUploaded++;
            results.details.push({
              motorId: motor.id,
              modelDisplay: motor.model_display,
              status: 'success',
              imageUrl: uploadedUrl,
            });
          }
        }

        results.processed++;

        // Rate limiting - wait between requests
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error('[Main] Error processing motor:', motor.id, error);
        results.errors.push(`${motor.model_display}: ${(error as Error).message}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, ...results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Main] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
