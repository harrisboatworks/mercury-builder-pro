import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CONTROL_IMAGES = {
  tiller: {
    url: 'https://www.mercurymarine.com/sp/en/gauges-and-controls/controls/tiller-handles/_jcr_content/root/container/pagesection_52925364/columnrow_copy_copy_/item_1695064113060/image_copy.coreimg.100.1280.png/1742304095249/mm-ga-co-controls-tiller-product-3.png',
    filename: 'tiller-handle.png'
  },
  remote: {
    url: 'https://www.mercurymarine.com/us/en/gauges-and-controls/controls/mechanical/_jcr_content/root/container/pagesection_2099454495/columnrow_copy_copy_/item_1638780568902_c/image_copy_copy.coreimg.100.1280.png/1696350068622/mm-ga-co-controls-mechanical-product-4.png',
    filename: 'remote-control.png'
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results: Record<string, { success: boolean; url?: string; error?: string }> = {};

    for (const [key, config] of Object.entries(CONTROL_IMAGES)) {
      console.log(`[download-control-images] Downloading ${key} from Mercury CDN...`);
      
      try {
        // Fetch image from Mercury CDN
        const response = await fetch(config.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }

        const imageBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(imageBuffer);
        
        console.log(`[download-control-images] Downloaded ${key}: ${uint8Array.length} bytes`);

        // Upload to Supabase Storage
        const storagePath = `controls/${config.filename}`;
        
        const { error: uploadError } = await supabase.storage
          .from('motor-images')
          .upload(storagePath, uint8Array, {
            contentType: 'image/png',
            upsert: true,
            cacheControl: '31536000' // 1 year cache
          });

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('motor-images')
          .getPublicUrl(storagePath);

        console.log(`[download-control-images] Uploaded ${key} to: ${publicUrl}`);
        
        results[key] = { success: true, url: publicUrl };
      } catch (error) {
        console.error(`[download-control-images] Error with ${key}:`, error);
        results[key] = { success: false, error: String(error) };
      }
    }

    return new Response(JSON.stringify({
      success: true,
      results,
      urls: {
        tiller: results.tiller?.url,
        remote: results.remote?.url
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[download-control-images] Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: String(error) 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
