import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapedImage {
  productName: string;
  imageUrl: string;
  partNumber?: string;
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

    // 1. Scrape SmartCraft Connect Mobile page
    console.log('Scraping SmartCraft Connect Mobile page...');
    const smartcraftResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://www.mercurymarine.com/us/en/gauges-and-controls/smartcraft/smartcraft-connect-mobile',
        formats: ['html', 'links'],
        onlyMainContent: false,
      }),
    });

    if (smartcraftResponse.ok) {
      const smartcraftData = await smartcraftResponse.json();
      const html = smartcraftData.data?.html || '';
      
      // Extract SmartCraft product image - look for high-res product images
      const imagePatterns = [
        /src="(https:\/\/[^"]*mercurymarine[^"]*smartcraft[^"]*\.(jpg|jpeg|png|webp)[^"]*)"/gi,
        /src="(https:\/\/[^"]*mercury[^"]*connect[^"]*\.(jpg|jpeg|png|webp)[^"]*)"/gi,
        /data-src="(https:\/\/[^"]*\.(jpg|jpeg|png|webp)[^"]*)"/gi,
        /srcset="([^"]+)"/gi,
      ];
      
      let smartcraftImage = null;
      for (const pattern of imagePatterns) {
        const matches = html.matchAll(pattern);
        for (const match of matches) {
          const url = match[1];
          if (url && (url.includes('smartcraft') || url.includes('connect') || url.includes('product'))) {
            // Prefer larger images
            if (!url.includes('thumb') && !url.includes('icon') && !url.includes('50x') && !url.includes('100x')) {
              smartcraftImage = url.split(' ')[0]; // Handle srcset
              break;
            }
          }
        }
        if (smartcraftImage) break;
      }

      // Fallback: extract any large product image
      if (!smartcraftImage) {
        const allImgMatches = html.matchAll(/src="(https:\/\/[^"]+\.(jpg|jpeg|png|webp))"/gi);
        for (const match of allImgMatches) {
          const url = match[1];
          if (url && !url.includes('logo') && !url.includes('icon') && !url.includes('thumb')) {
            smartcraftImage = url;
            break;
          }
        }
      }

      if (smartcraftImage) {
        // Upload to Supabase Storage
        const uploadedUrl = await uploadImageToStorage(supabase, smartcraftImage, 'smartcraft-connect-mobile');
        results.push({
          productName: 'SmartCraft Connect Mobile',
          imageUrl: uploadedUrl || smartcraftImage,
          partNumber: '8M0173128',
        });
        console.log('SmartCraft image found:', uploadedUrl || smartcraftImage);
      } else {
        console.log('No SmartCraft image found, using placeholder');
        results.push({
          productName: 'SmartCraft Connect Mobile',
          imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
          partNumber: '8M0173128',
        });
      }
    }

    // 2. Scrape Maintenance Kits page
    console.log('Scraping Maintenance Kits page...');
    const maintenanceResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://www.mercurymarine.com/ca/en/parts-and-service/parts-and-lubricants/maintenance-kits',
        formats: ['html', 'links'],
        onlyMainContent: false,
      }),
    });

    let maintenanceKitImage = null;
    if (maintenanceResponse.ok) {
      const maintenanceData = await maintenanceResponse.json();
      const html = maintenanceData.data?.html || '';
      
      // Extract maintenance kit image
      const kitImagePatterns = [
        /src="(https:\/\/[^"]*maintenance[^"]*kit[^"]*\.(jpg|jpeg|png|webp)[^"]*)"/gi,
        /src="(https:\/\/[^"]*service[^"]*kit[^"]*\.(jpg|jpeg|png|webp)[^"]*)"/gi,
        /src="(https:\/\/[^"]*mercury[^"]*\.(jpg|jpeg|png|webp)[^"]*)"/gi,
      ];
      
      for (const pattern of kitImagePatterns) {
        const matches = html.matchAll(pattern);
        for (const match of matches) {
          const url = match[1];
          if (url && !url.includes('logo') && !url.includes('icon') && !url.includes('thumb')) {
            maintenanceKitImage = url;
            break;
          }
        }
        if (maintenanceKitImage) break;
      }

      if (maintenanceKitImage) {
        const uploadedUrl = await uploadImageToStorage(supabase, maintenanceKitImage, 'maintenance-kit-generic');
        maintenanceKitImage = uploadedUrl || maintenanceKitImage;
        console.log('Maintenance kit image found:', maintenanceKitImage);
      }
    }

    // Use placeholder for maintenance kits if no image found
    const kitPlaceholder = maintenanceKitImage || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop';

    // Add all maintenance kit products with the same image
    const maintenanceKits = [
      { name: '100-Hour Service Kit (Under 25HP)', partNumber: '8M0151469' },
      { name: '100-Hour Service Kit (40-60HP)', partNumber: '8M0232733' },
      { name: '100-Hour Service Kit (75-115HP)', partNumber: '8M0097854' },
      { name: '100-Hour Service Kit (150HP)', partNumber: '8M0094232' },
      { name: '100-Hour Service Kit (175-300HP)', partNumber: '8M0149929' },
      { name: '300-Hour Service Kit (40-60HP)', partNumber: '8M0090559' },
      { name: '300-Hour Service Kit (75-115HP)', partNumber: '8M0097855' },
      { name: '300-Hour Service Kit (150HP)', partNumber: '8M0094233' },
      { name: '300-Hour Service Kit (175-225HP)', partNumber: '8M0149930' },
      { name: '300-Hour Service Kit (250-300HP)', partNumber: '8M0149931' },
      { name: 'Oil Change Kit (40-60HP)', partNumber: '8M0081916' },
      { name: 'Oil Change Kit (75-115HP)', partNumber: '8M0107510' },
      { name: 'Oil Change Kit (150HP)', partNumber: '8M0188357' },
      { name: 'Oil Change Kit (175-225HP)', partNumber: '8M0187621' },
      { name: 'Oil Change Kit (250-300HP)', partNumber: '8M0187622' },
    ];

    for (const kit of maintenanceKits) {
      results.push({
        productName: kit.name,
        imageUrl: kitPlaceholder,
        partNumber: kit.partNumber,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Scraped ${results.length} product images`,
        products: results,
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
    // Download the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.log(`Failed to download image from ${imageUrl}`);
      return null;
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();
    const extension = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
    const storagePath = `accessories/${fileName}.${extension}`;

    // Upload to Supabase Storage
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

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('motor-images')
      .getPublicUrl(storagePath);

    return urlData?.publicUrl || null;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
}
