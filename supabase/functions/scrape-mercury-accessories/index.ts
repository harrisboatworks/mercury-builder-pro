import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { requireAdmin } from "../_shared/admin-auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ... keep existing code (interfaces, scrapeProductImage, extractProductImage functions)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Admin auth check
  const authResult = await requireAdmin(req, corsHeaders);
  if (authResult instanceof Response) return authResult;

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
