import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapedImage {
  productName: string;
  imageUrl: string;
  partNumber?: string;
  category?: string;
}

// Scrape product page using Firecrawl to find the image
async function scrapeProductImage(
  firecrawlApiKey: string,
  supabase: any,
  partNumber: string,
  productName: string
): Promise<string | null> {
  // Try multiple URLs based on part number
  const searchUrls = [
    `https://www.crowleymarine.com/mercury/${partNumber}`,
    `https://www.boats.net/product/${partNumber}`,
    `https://www.mercuryparts.com/parts/${partNumber}`,
  ];

  // First try Firecrawl search to find the product page
  try {
    console.log(`Searching for ${partNumber} via Firecrawl...`);
    const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `Mercury Marine ${partNumber} ${productName}`,
        limit: 5,
      }),
    });

    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      const results = searchData.data || [];
      
      // Look for marine parts sites in search results
      for (const result of results) {
        const url = result.url || '';
        if (url.includes('crowley') || url.includes('boats.net') || url.includes('mercury') || url.includes('marineengine')) {
          console.log(`Found product page for ${partNumber}: ${url}`);
          
          // Scrape this page for images
          const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: url,
              formats: ['html'],
              onlyMainContent: false,
            }),
          });

          if (scrapeResponse.ok) {
            const scrapeData = await scrapeResponse.json();
            const html = scrapeData.data?.html || '';
            
            // Extract product image from HTML
            const imageUrl = extractProductImage(html, partNumber);
            if (imageUrl) {
              const uploadedUrl = await uploadImageToStorage(supabase, imageUrl, `accessory-${partNumber}`);
              if (uploadedUrl) {
                console.log(`Uploaded image for ${partNumber}: ${uploadedUrl}`);
                return uploadedUrl;
              }
            }
          }
        }
      }
    }
  } catch (e) {
    console.log(`Firecrawl search failed for ${partNumber}:`, e);
  }

  // Fallback: Try scraping Mercury's own pages
  try {
    const mercuryUrl = `https://www.mercurymarine.com/us/en/product/mercury-${partNumber.toLowerCase()}`;
    console.log(`Trying Mercury direct URL: ${mercuryUrl}`);
    
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: mercuryUrl,
        formats: ['html'],
        onlyMainContent: false,
      }),
    });

    if (scrapeResponse.ok) {
      const scrapeData = await scrapeResponse.json();
      const html = scrapeData.data?.html || '';
      
      const imageUrl = extractProductImage(html, partNumber);
      if (imageUrl) {
        const uploadedUrl = await uploadImageToStorage(supabase, imageUrl, `accessory-${partNumber}`);
        if (uploadedUrl) {
          console.log(`Uploaded Mercury image for ${partNumber}: ${uploadedUrl}`);
          return uploadedUrl;
        }
      }
    }
  } catch (e) {
    console.log(`Mercury scrape failed for ${partNumber}:`, e);
  }

  console.log(`No image found for part number ${partNumber} (${productName})`);
  return null;
}

// Extract product image URL from HTML
function extractProductImage(html: string, partNumber: string): string | null {
  // Look for product images in various patterns
  const patterns = [
    // Mercury product images
    /src="(https:\/\/[^"]*(?:product|parts?|accessories)[^"]*\.(jpg|jpeg|png|webp)[^"]*)"/gi,
    // Crowley Marine images
    /src="(https:\/\/[^"]*crowley[^"]*\.(jpg|jpeg|png|webp)[^"]*)"/gi,
    // Boats.net images
    /src="(https:\/\/[^"]*boats\.net[^"]*\.(jpg|jpeg|png|webp)[^"]*)"/gi,
    // General product images
    /src="(https:\/\/[^"]+\.(jpg|jpeg|png|webp))"/gi,
    // Data-src for lazy loaded images
    /data-src="(https:\/\/[^"]+\.(jpg|jpeg|png|webp)[^"]*)"/gi,
  ];

  for (const pattern of patterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      const url = match[1];
      if (url && !url.includes('logo') && !url.includes('icon') && !url.includes('thumb') && 
          !url.includes('placeholder') && !url.includes('50x') && !url.includes('100x')) {
        // Prefer images that mention the part number or product-related keywords
        if (url.includes(partNumber) || url.includes('product') || url.includes('part') || 
            url.includes('image') || url.includes('gallery')) {
          return url.split(' ')[0];
        }
      }
    }
  }

  // Fallback: get the first reasonable product image
  for (const pattern of patterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      const url = match[1];
      if (url && !url.includes('logo') && !url.includes('icon') && !url.includes('thumb') && 
          !url.includes('placeholder') && !url.includes('nav') && !url.includes('header') &&
          !url.includes('footer') && !url.includes('banner')) {
        return url.split(' ')[0];
      }
    }
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      throw new Error('FIRECRAWL_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results: ScrapedImage[] = [];

    // Define all products with their part numbers - prioritize covers first
    const allProducts = [
      // Motor Covers (prioritize these)
      { name: 'Vented Splash Cover (75-115HP)', partNumber: '8M0104228', category: 'accessory' },
      { name: 'Vented Splash Cover (150HP)', partNumber: '8M0104229', category: 'accessory' },
      { name: 'Vented Splash Cover (175-225HP V6)', partNumber: '8M0104231', category: 'accessory' },
      { name: 'Vented Splash Cover (250-300HP V8)', partNumber: '8M0104232', category: 'accessory' },
      
      // Electronics
      { name: 'SmartCraft Connect Mobile', partNumber: '8M0173128', category: 'electronics' },
      
      // Maintenance Kits
      { name: '100-Hour Service Kit (Under 25HP)', partNumber: '8M0151469', category: 'maintenance' },
      { name: '100-Hour Service Kit (40-60HP)', partNumber: '8M0232733', category: 'maintenance' },
      { name: '100-Hour Service Kit (75-115HP)', partNumber: '8M0097854', category: 'maintenance' },
      { name: '100-Hour Service Kit (150HP)', partNumber: '8M0094232', category: 'maintenance' },
      { name: '100-Hour Service Kit (175-300HP)', partNumber: '8M0149929', category: 'maintenance' },
      { name: '300-Hour Service Kit (40-60HP)', partNumber: '8M0090559', category: 'maintenance' },
      { name: '300-Hour Service Kit (75-115HP)', partNumber: '8M0097855', category: 'maintenance' },
      { name: '300-Hour Service Kit (150HP)', partNumber: '8M0094233', category: 'maintenance' },
      { name: '300-Hour Service Kit (175-225HP)', partNumber: '8M0149930', category: 'maintenance' },
      { name: '300-Hour Service Kit (250-300HP)', partNumber: '8M0149931', category: 'maintenance' },
      { name: 'Oil Change Kit (40-60HP)', partNumber: '8M0081916', category: 'maintenance' },
      { name: 'Oil Change Kit (75-115HP)', partNumber: '8M0107510', category: 'maintenance' },
      { name: 'Oil Change Kit (150HP)', partNumber: '8M0188357', category: 'maintenance' },
      { name: 'Oil Change Kit (175-225HP)', partNumber: '8M0187621', category: 'maintenance' },
      { name: 'Oil Change Kit (250-300HP)', partNumber: '8M0187622', category: 'maintenance' },
    ];

    // Scrape first 10 products (covers + key items, stay within timeout limits)
    const productsToScrape = allProducts.slice(0, 10);
    
    for (const product of productsToScrape) {
      console.log(`Scraping image for ${product.name} (${product.partNumber})...`);
      
      const imageUrl = await scrapeProductImage(
        firecrawlApiKey,
        supabase,
        product.partNumber,
        product.name
      );

      const placeholders: Record<string, string> = {
        electronics: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
        maintenance: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
        accessory: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop',
      };

      results.push({
        productName: product.name,
        imageUrl: imageUrl || placeholders[product.category] || placeholders.maintenance,
        partNumber: product.partNumber,
        category: product.category,
      });
    }

    // Add remaining products with placeholders (to be scraped in future calls)
    for (const product of allProducts.slice(10)) {
      const placeholders: Record<string, string> = {
        electronics: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
        maintenance: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
        accessory: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop',
      };

      results.push({
        productName: product.name,
        imageUrl: placeholders[product.category] || placeholders.maintenance,
        partNumber: product.partNumber,
        category: product.category,
      });
    }

    // Update motor_options table with scraped images
    console.log('Updating motor_options table with scraped images...');
    let updatedCount = 0;
    
    for (const result of results) {
      if (result.partNumber && result.imageUrl && !result.imageUrl.includes('unsplash')) {
        const { error } = await supabase
          .from('motor_options')
          .update({ image_url: result.imageUrl })
          .eq('part_number', result.partNumber);
        
        if (!error) {
          updatedCount++;
          console.log(`Updated ${result.partNumber} with image: ${result.imageUrl}`);
        } else {
          console.log(`Failed to update ${result.partNumber}: ${error.message}`);
        }
      }
    }

    const successfulImages = results.filter(r => !r.imageUrl.includes('unsplash')).length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Scraped ${productsToScrape.length} products, found ${successfulImages} real images, updated ${updatedCount} database records`,
        products: results,
        stats: {
          total: results.length,
          scraped: productsToScrape.length,
          imagesFound: successfulImages,
          databaseUpdates: updatedCount,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error scraping Mercury accessories:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function uploadImageToStorage(
  supabase: any,
  imageUrl: string,
  fileName: string
): Promise<string | null> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.log(`Failed to download image from ${imageUrl}`);
      return null;
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();
    const extension = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
    const storagePath = `accessories/${fileName}.${extension}`;

    const { data, error } = await supabase.storage
      .from('motor-images')
      .upload(storagePath, arrayBuffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error('Storage upload error:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('motor-images')
      .getPublicUrl(storagePath);

    return urlData?.publicUrl || null;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
}
