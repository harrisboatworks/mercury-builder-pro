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
      
      // Extract SmartCraft product image
      const imagePatterns = [
        /src="(https:\/\/[^"]*mercurymarine[^"]*smartcraft[^"]*\.(jpg|jpeg|png|webp)[^"]*)"/gi,
        /src="(https:\/\/[^"]*mercury[^"]*connect[^"]*\.(jpg|jpeg|png|webp)[^"]*)"/gi,
        /data-src="(https:\/\/[^"]*\.(jpg|jpeg|png|webp)[^"]*)"/gi,
      ];
      
      let smartcraftImage = null;
      for (const pattern of imagePatterns) {
        const matches = html.matchAll(pattern);
        for (const match of matches) {
          const url = match[1];
          if (url && (url.includes('smartcraft') || url.includes('connect') || url.includes('product'))) {
            if (!url.includes('thumb') && !url.includes('icon') && !url.includes('50x') && !url.includes('100x')) {
              smartcraftImage = url.split(' ')[0];
              break;
            }
          }
        }
        if (smartcraftImage) break;
      }

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
        const uploadedUrl = await uploadImageToStorage(supabase, smartcraftImage, 'smartcraft-connect-mobile');
        results.push({
          productName: 'SmartCraft Connect Mobile',
          imageUrl: uploadedUrl || smartcraftImage,
          partNumber: '8M0173128',
          category: 'electronics',
        });
        console.log('SmartCraft image found:', uploadedUrl || smartcraftImage);
      } else {
        console.log('No SmartCraft image found, using placeholder');
        results.push({
          productName: 'SmartCraft Connect Mobile',
          imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
          partNumber: '8M0173128',
          category: 'electronics',
        });
      }
    }

    // 2. Scrape individual maintenance kit product pages for unique images
    console.log('Scraping individual maintenance kit pages...');
    
    const maintenanceProducts = [
      { 
        name: '100-Hour Service Kit (Under 25HP)', 
        partNumber: '8M0151469',
        url: 'https://www.mercurymarine.com/us/en/product/mercury-8m0151469-100-hour-maintenance-kit-under-25hp'
      },
      { 
        name: '100-Hour Service Kit (40-60HP)', 
        partNumber: '8M0232733',
        url: 'https://www.mercurymarine.com/us/en/product/mercury-8m0232733-100-hour-maintenance-kit-40-60hp'
      },
      { 
        name: '100-Hour Service Kit (75-115HP)', 
        partNumber: '8M0097854',
        url: 'https://www.mercurymarine.com/us/en/product/mercury-8m0097854-21l-4-cyl-100-hour-maintenance-kit'
      },
      { 
        name: '100-Hour Service Kit (150HP)', 
        partNumber: '8M0094232',
        url: 'https://www.mercurymarine.com/us/en/product/mercury-8m0094232-30l-100-hour-maintenance-kit'
      },
      { 
        name: '100-Hour Service Kit (175-300HP)', 
        partNumber: '8M0149929',
        url: 'https://www.mercurymarine.com/us/en/product/mercury-8m0149929-v6-v8-100-hour-maintenance-kit'
      },
      { 
        name: '300-Hour Service Kit (40-60HP)', 
        partNumber: '8M0090559',
        url: 'https://www.mercurymarine.com/us/en/product/mercury-8m0090559-300-hour-service-kit'
      },
      { 
        name: '300-Hour Service Kit (75-115HP)', 
        partNumber: '8M0097855',
        url: 'https://www.mercurymarine.com/us/en/product/mercury-8m0097855-21l-4-cyl-300-hour-maintenance-kit'
      },
      { 
        name: '300-Hour Service Kit (150HP)', 
        partNumber: '8M0094233',
        url: 'https://www.mercurymarine.com/us/en/product/mercury-8m0094233-30l-300-hour-maintenance-kit'
      },
      { 
        name: '300-Hour Service Kit (175-225HP)', 
        partNumber: '8M0149930',
        url: 'https://www.mercurymarine.com/us/en/product/mercury-8m0149930-v6-300-hour-maintenance-kit'
      },
      { 
        name: '300-Hour Service Kit (250-300HP)', 
        partNumber: '8M0149931',
        url: 'https://www.mercurymarine.com/us/en/product/mercury-8m0149931-v8-300-hour-maintenance-kit'
      },
      { 
        name: 'Oil Change Kit (40-60HP)', 
        partNumber: '8M0081916',
        url: 'https://www.mercurymarine.com/us/en/product/mercury-8m0081916-oil-change-kit'
      },
      { 
        name: 'Oil Change Kit (75-115HP)', 
        partNumber: '8M0107510',
        url: 'https://www.mercurymarine.com/us/en/product/mercury-8m0107510-oil-change-kit'
      },
      { 
        name: 'Oil Change Kit (150HP)', 
        partNumber: '8M0188357',
        url: 'https://www.mercurymarine.com/us/en/product/mercury-8m0188357-oil-change-kit'
      },
      { 
        name: 'Oil Change Kit (175-225HP)', 
        partNumber: '8M0187621',
        url: 'https://www.mercurymarine.com/us/en/product/mercury-8m0187621-oil-change-kit'
      },
      { 
        name: 'Oil Change Kit (250-300HP)', 
        partNumber: '8M0187622',
        url: 'https://www.mercurymarine.com/us/en/product/mercury-8m0187622-oil-change-kit'
      },
    ];

    // Scrape a few key products for unique images
    for (const product of maintenanceProducts.slice(0, 6)) {
      try {
        console.log(`Scraping: ${product.name}`);
        const productResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: product.url,
            formats: ['html'],
            onlyMainContent: false,
          }),
        });

        if (productResponse.ok) {
          const productData = await productResponse.json();
          const html = productData.data?.html || '';
          
          // Extract product image
          const imgMatch = html.match(/src="(https:\/\/[^"]*(?:product|maintenance|kit|mercury)[^"]*\.(jpg|jpeg|png|webp)[^"]*)"/i);
          let imageUrl = imgMatch?.[1];
          
          if (!imageUrl) {
            const fallbackMatch = html.match(/src="(https:\/\/[^"]+\.(jpg|jpeg|png))"/i);
            imageUrl = fallbackMatch?.[1];
          }
          
          if (imageUrl && !imageUrl.includes('logo') && !imageUrl.includes('icon')) {
            const fileName = `maintenance-${product.partNumber}`;
            const uploadedUrl = await uploadImageToStorage(supabase, imageUrl, fileName);
            results.push({
              productName: product.name,
              imageUrl: uploadedUrl || imageUrl,
              partNumber: product.partNumber,
              category: 'maintenance',
            });
            console.log(`${product.name} image uploaded:`, uploadedUrl || imageUrl);
          } else {
            results.push({
              productName: product.name,
              imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
              partNumber: product.partNumber,
              category: 'maintenance',
            });
          }
        }
      } catch (err) {
        console.error(`Error scraping ${product.name}:`, err);
        results.push({
          productName: product.name,
          imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
          partNumber: product.partNumber,
          category: 'maintenance',
        });
      }
    }

    // Add remaining maintenance kits with placeholder
    for (const product of maintenanceProducts.slice(6)) {
      results.push({
        productName: product.name,
        imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
        partNumber: product.partNumber,
        category: 'maintenance',
      });
    }

    // 3. Scrape Motor Covers page
    console.log('Scraping Motor Covers pages...');
    
    const coverProducts = [
      {
        name: 'Attwood Outboard Motor Cover (40-60HP)',
        partNumber: 'ATT-10541',
        url: 'https://www.mercurymarine.com/us/en/product/attwood-outboard-motor-cover',
        hpRange: '40-60HP',
      },
      {
        name: 'Mercury Vented Splash Cover (75-115HP)',
        partNumber: 'MRC-VS-75115',
        url: 'https://www.mercurymarine.com/us/en/product/mercury-vented-splash-cover-75-115hp',
        hpRange: '75-115HP',
      },
      {
        name: 'Mercury Vented Splash Cover (150HP)',
        partNumber: 'MRC-VS-150',
        url: 'https://www.mercurymarine.com/us/en/product/mercury-vented-splash-cover-150hp',
        hpRange: '150HP',
      },
      {
        name: 'Mercury Vented Splash Cover (175-225HP V6)',
        partNumber: 'MRC-VS-V6',
        url: 'https://www.mercurymarine.com/us/en/product/mercury-vented-splash-cover-v6',
        hpRange: '175-225HP',
      },
      {
        name: 'Mercury Vented Splash Cover (250-300HP V8)',
        partNumber: 'MRC-VS-V8',
        url: 'https://www.mercurymarine.com/us/en/product/mercury-vented-splash-cover-v8',
        hpRange: '250-300HP',
      },
    ];

    // Scrape motor covers
    const coversResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://www.mercurymarine.com/us/en/product/mercury-vented-splash-cover',
        formats: ['html'],
        onlyMainContent: false,
      }),
    });

    let coverImage = null;
    if (coversResponse.ok) {
      const coverData = await coversResponse.json();
      const html = coverData.data?.html || '';
      
      const coverImgMatch = html.match(/src="(https:\/\/[^"]*(?:cover|splash|motor)[^"]*\.(jpg|jpeg|png|webp)[^"]*)"/i);
      coverImage = coverImgMatch?.[1];
      
      if (!coverImage) {
        const fallbackMatch = html.match(/src="(https:\/\/[^"]+\.(jpg|jpeg|png))"/i);
        coverImage = fallbackMatch?.[1];
      }
      
      if (coverImage && !coverImage.includes('logo') && !coverImage.includes('icon')) {
        const uploadedUrl = await uploadImageToStorage(supabase, coverImage, 'motor-cover-vented');
        coverImage = uploadedUrl || coverImage;
        console.log('Motor cover image uploaded:', coverImage);
      }
    }

    // Use placeholder if no cover image found
    const coverPlaceholder = coverImage || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop';

    for (const cover of coverProducts) {
      results.push({
        productName: cover.name,
        imageUrl: coverPlaceholder,
        partNumber: cover.partNumber,
        category: 'accessory',
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
