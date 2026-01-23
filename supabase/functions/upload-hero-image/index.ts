import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { model_key, url, dry_run = false } = await req.json()

    if (!model_key || !url) {
      return new Response(
        JSON.stringify({ success: false, error: 'model_key and url are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log(`🖼️ upload-hero-image: ${model_key} → ${url}`)

    // Check if model exists and is brochure
    const { data: model, error: modelError } = await supabase
      .from('motor_models')
      .select('id, model, model_key, hero_image_url')
      .eq('model_key', model_key)
      .eq('is_brochure', true)
      .single()

    if (modelError || !model) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Model with key '${model_key}' not found or not a brochure model`,
          stored: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    if (dry_run) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          model_key,
          model: model.model,
          url,
          dry_run: true,
          message: `Would download and store hero image for ${model.model}`,
          stored: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    try {
      // Download the image
      console.log(`📥 Downloading image from: ${url}`)
      const imageResponse = await fetch(url)
      
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.status} ${imageResponse.statusText}`)
      }

      const imageBuffer = await imageResponse.arrayBuffer()
      const imageBlob = new Blob([imageBuffer])
      
      // Determine file extension from URL or content-type
      let fileExtension = 'jpg'
      const contentType = imageResponse.headers.get('content-type')
      if (contentType?.includes('png')) fileExtension = 'png'
      else if (contentType?.includes('webp')) fileExtension = 'webp'
      else if (url.toLowerCase().includes('.png')) fileExtension = 'png'
      else if (url.toLowerCase().includes('.webp')) fileExtension = 'webp'

      const fileName = `mercury/${model_key}.${fileExtension}`

      // Upload to Supabase Storage
      console.log(`☁️ Uploading to storage: ${fileName}`)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('hero-images')
        .upload(fileName, imageBlob, {
          contentType: contentType || `image/${fileExtension}`,
          upsert: true
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        throw new Error(`Storage upload failed: ${uploadError.message}`)
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('hero-images')
        .getPublicUrl(fileName)

      const publicUrl = publicUrlData.publicUrl

      // Update motor_models record
      console.log(`🔄 Updating model record with hero URL: ${publicUrl}`)
      const { error: updateError } = await supabase
        .from('motor_models')
        .update({ hero_image_url: publicUrl })
        .eq('id', model.id)

      if (updateError) {
        console.error('Model update error:', updateError)
        throw new Error(`Failed to update model: ${updateError.message}`)
      }

      console.log(`✅ Successfully stored hero image for ${model_key}`)

      return new Response(
        JSON.stringify({ 
          success: true,
          stored: true,
          model_key,
          model: model.model,
          public_url: publicUrl,
          file_name: fileName,
          original_url: url
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (downloadError) {
      console.error('Image processing error:', downloadError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Image processing failed: ${downloadError.message}`,
          stored: false,
          model_key
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

  } catch (error) {
    console.error('upload-hero-image error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message, stored: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})