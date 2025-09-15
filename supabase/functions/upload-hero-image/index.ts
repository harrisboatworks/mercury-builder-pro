import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

// Lazy initialize Supabase client
async function getServiceClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!url || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  return createClient(url, serviceKey);
}

// Convert data URL to blob
function dataURLtoBlob(dataURL: string): Blob {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

// Download image from URL
async function downloadImage(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: HTTP ${response.status}`);
  }
  return await response.blob();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { model_key, url, file_data, dry_run = false } = await req.json();
    
    if (!model_key) {
      throw new Error('model_key is required');
    }
    
    if (!url && !file_data) {
      throw new Error('Either url or file_data must be provided');
    }
    
    console.log(`Processing hero image for model_key: ${model_key}`);
    
    let imageBlob: Blob;
    let fileExtension = 'jpg';
    
    if (url) {
      // Download from URL
      imageBlob = await downloadImage(url);
      // Try to determine extension from URL or content type
      const urlExt = url.split('.').pop()?.toLowerCase();
      if (urlExt && ['jpg', 'jpeg', 'png', 'webp'].includes(urlExt)) {
        fileExtension = urlExt === 'jpeg' ? 'jpg' : urlExt;
      } else if (imageBlob.type) {
        fileExtension = imageBlob.type.split('/')[1] || 'jpg';
      }
    } else if (file_data) {
      // Convert from base64 or data URL
      if (file_data.startsWith('data:')) {
        imageBlob = dataURLtoBlob(file_data);
        const mimeType = file_data.split(';')[0].split(':')[1];
        fileExtension = mimeType.split('/')[1] || 'jpg';
      } else {
        // Assume base64
        const binaryString = atob(file_data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        imageBlob = new Blob([bytes], { type: 'image/jpeg' });
      }
    } else {
      throw new Error('No valid image source provided');
    }
    
    if (dry_run) {
      return new Response(JSON.stringify({
        success: true,
        dry_run: true,
        model_key,
        file_path: `mercury/heroes/${model_key}.${fileExtension}`,
        file_size: imageBlob.size,
        file_type: imageBlob.type
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const supabase = await getServiceClient();
    
    // Upload to storage
    const fileName = `mercury/heroes/${model_key}.${fileExtension}`;
    console.log(`Uploading to storage: ${fileName}`);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('motor-images')
      .upload(fileName, imageBlob, { 
        upsert: true,
        contentType: imageBlob.type 
      });
    
    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw uploadError;
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('motor-images')
      .getPublicUrl(fileName);
    
    console.log(`Image uploaded successfully: ${publicUrl}`);
    
    // Update motor models with hero image URL
    const { data: updateData, error: updateError } = await supabase
      .from('motor_models')
      .update({ hero_image_url: publicUrl })
      .eq('model_key', model_key)
      .eq('is_brochure', true)
      .is('hero_image_url', null);
    
    if (updateError) {
      console.error('Database update error:', updateError);
      throw updateError;
    }
    
    // Get count of updated models
    const { count } = await supabase
      .from('motor_models')
      .select('id', { count: 'exact', head: true })
      .eq('model_key', model_key)
      .eq('hero_image_url', publicUrl);
    
    console.log(`Updated ${count || 0} motor models with hero image`);
    
    return new Response(JSON.stringify({
      success: true,
      model_key,
      hero_image_url: publicUrl,
      models_updated: count || 0,
      storage_path: fileName
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in upload-hero-image:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});