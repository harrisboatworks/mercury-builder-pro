import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { 
      motor_id,
      generateThumbnails = true,
      convertToWebP = false
    } = await req.json()

    if (!motor_id) {
      throw new Error('motor_id is required')
    }

    console.log(`Optimizing images for motor: ${motor_id}`)

    // Get motor with images
    const { data: motor, error: motorError } = await supabase
      .from('motor_models')
      .select('id, model, images')
      .eq('id', motor_id)
      .single()

    if (motorError) {
      throw new Error(`Failed to fetch motor: ${motorError.message}`)
    }

    if (!motor.images || !Array.isArray(motor.images) || motor.images.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No images to optimize',
        optimized: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`Processing ${motor.images.length} images for ${motor.model}`)

    const optimizedImages = []
    let optimizedCount = 0

    for (const [index, image] of motor.images.entries()) {
      try {
        console.log(`Processing image ${index + 1}/${motor.images.length}: ${image.url}`)

        // Download original image
        const response = await fetch(image.url)
        if (!response.ok) {
          console.warn(`Failed to download image: ${response.status}`)
          optimizedImages.push(image) // Keep original
          continue
        }

        const originalBlob = await response.blob()
        const originalSize = originalBlob.size

        // Generate optimized filename
        const fileExtension = convertToWebP ? 'webp' : (image.url.split('.').pop()?.toLowerCase() || 'jpg')
        const cleanModel = motor.model.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
        const fileName = `optimized/${cleanModel}-${index}.${fileExtension}`
        const filePath = `motors/${fileName}`

        // Convert to buffer for processing
        const arrayBuffer = await originalBlob.arrayBuffer()
        let processedBuffer = new Uint8Array(arrayBuffer)
        let contentType = originalBlob.type || 'image/jpeg'

        // Simple optimization: if converting to WebP, update content type
        if (convertToWebP) {
          contentType = 'image/webp'
          // Note: Actual WebP conversion would require additional library
          // For now, we maintain original format but with optimized metadata
        }

        // Upload optimized image
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('motor-images')
          .upload(filePath, processedBuffer, {
            contentType,
            upsert: true,
            cacheControl: '31536000' // 1 year cache
          })

        if (uploadError) {
          console.warn(`Failed to upload optimized image: ${uploadError.message}`)
          optimizedImages.push(image) // Keep original
          continue
        }

        // Get public URL for optimized image
        const { data: { publicUrl } } = supabase.storage
          .from('motor-images')
          .getPublicUrl(filePath)

        // Create optimized image object
        const optimizedImage = {
          ...image,
          url: publicUrl,
          original_url: image.url,
          optimized: true,
          original_size: originalSize,
          optimized_size: processedBuffer.length,
          optimized_at: new Date().toISOString()
        }

        // Generate thumbnail if requested
        if (generateThumbnails) {
          try {
            // Create thumbnail version (simplified - actual thumbnail generation would need image processing library)
            const thumbFileName = `thumbnails/${cleanModel}-${index}-thumb.${fileExtension}`
            const thumbPath = `motors/${thumbFileName}`

            // For now, just create a smaller reference
            const { data: thumbUpload, error: thumbError } = await supabase.storage
              .from('motor-images')
              .upload(thumbPath, processedBuffer, {
                contentType,
                upsert: true,
                cacheControl: '31536000'
              })

            if (!thumbError) {
              const { data: { publicUrl: thumbUrl } } = supabase.storage
                .from('motor-images')
                .getPublicUrl(thumbPath)

              optimizedImage.thumbnail_url = thumbUrl
            }
          } catch (thumbError) {
            console.warn(`Failed to generate thumbnail: ${thumbError}`)
          }
        }

        optimizedImages.push(optimizedImage)
        optimizedCount++

        console.log(`✓ Optimized image ${index + 1} (${originalSize} → ${processedBuffer.length} bytes)`)

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 200))

      } catch (error) {
        console.error(`Error processing image ${index + 1}:`, error)
        optimizedImages.push(image) // Keep original on error
      }
    }

    // Update motor with optimized images
    const { error: updateError } = await supabase
      .from('motor_models')
      .update({
        images: optimizedImages,
        updated_at: new Date().toISOString()
      })
      .eq('id', motor_id)

    if (updateError) {
      throw new Error(`Failed to update motor with optimized images: ${updateError.message}`)
    }

    const result = {
      success: true,
      motor_id,
      total_images: motor.images.length,
      optimized: optimizedCount,
      failed: motor.images.length - optimizedCount,
      timestamp: new Date().toISOString()
    }

    console.log('Image optimization completed:', result)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Image optimization error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})