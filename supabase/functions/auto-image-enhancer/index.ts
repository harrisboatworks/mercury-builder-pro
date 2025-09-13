import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
      batchSize = 20,
      onlyMissingImages = true,
      enhanceExisting = false
    } = await req.json().catch(() => ({}))

    console.log('Starting automated image enhancement process...')

    // Find motors that need image enhancement
    let query = supabase
      .from('motor_models')
      .select('id, model, detail_url, images, image_url, make, horsepower')
      .not('detail_url', 'is', null)

    if (onlyMissingImages) {
      // Focus on motors with few or no images
      query = query.or('images.is.null,images.eq.[],jsonb_array_length(images).<.3')
    }

    const { data: motors, error: motorsError } = await query.limit(batchSize)

    if (motorsError) {
      throw new Error(`Failed to fetch motors: ${motorsError.message}`)
    }

    if (!motors || motors.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No motors need image enhancement',
        processed: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`Processing ${motors.length} motors for image enhancement`)

    let successful = 0
    let failed = 0
    const results = []

    for (const motor of motors) {
      try {
        console.log(`Enhancing images for: ${motor.model}`)

        // Step 1: Scrape for additional images
        const { data: scrapeData, error: scrapeError } = await supabase.functions.invoke('scrape-motor-details', {
          body: { motor_id: motor.id }
        })

        let newImagesFound = 0
        if (!scrapeError && scrapeData) {
          // Get updated motor data
          const { data: updatedMotor } = await supabase
            .from('motor_models')
            .select('images')
            .eq('id', motor.id)
            .single()

          if (updatedMotor?.images) {
            newImagesFound = Array.isArray(updatedMotor.images) ? updatedMotor.images.length : 0
          }
        }

        // Step 2: Enhance image quality by finding better versions
        if (enhanceExisting || newImagesFound === 0) {
          const existingImages = Array.isArray(motor.images) ? motor.images : []
          const enhancedImages = []

          for (const img of existingImages) {
            const enhancedUrl = await findBetterImageVersion(img.url)
            if (enhancedUrl && enhancedUrl !== img.url) {
              // Verify the enhanced image is accessible
              const response = await fetch(enhancedUrl, { method: 'HEAD' })
              if (response.ok) {
                enhancedImages.push({
                  ...img,
                  url: enhancedUrl,
                  quality: 'enhanced',
                  enhanced_at: new Date().toISOString()
                })
              } else {
                enhancedImages.push(img)
              }
            } else {
              enhancedImages.push(img)
            }
          }

          // Update with enhanced images
          if (enhancedImages.length > 0) {
            await supabase
              .from('motor_models')
              .update({ 
                images: enhancedImages,
                updated_at: new Date().toISOString()
              })
              .eq('id', motor.id)
          }
        }

        // Step 3: Generate thumbnails and optimize for web
        const { data: optimizeData } = await supabase.functions.invoke('optimize-motor-images', {
          body: { 
            motor_id: motor.id,
            generateThumbnails: true,
            convertToWebP: true
          }
        }).catch(() => ({ data: null }))

        successful++
        results.push({
          id: motor.id,
          model: motor.model,
          status: 'enhanced',
          newImagesFound,
          optimized: !!optimizeData
        })

        console.log(`✓ Enhanced images for ${motor.model}`)

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (error) {
        failed++
        console.error(`✗ Failed to enhance ${motor.model}: ${error.message}`)
        results.push({
          id: motor.id,
          model: motor.model,
          status: 'failed',
          error: error.message
        })
      }
    }

    const summary = {
      success: true,
      processed: motors.length,
      successful,
      failed,
      results,
      timestamp: new Date().toISOString()
    }

    console.log('Image enhancement completed:', summary)

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Image enhancement error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

// Helper function to find better quality versions of images
async function findBetterImageVersion(originalUrl: string): Promise<string | null> {
  const variations = []
  
  try {
    // Convert small to large
    if (originalUrl.includes('_small')) {
      variations.push(originalUrl.replace('_small', '_large'))
      variations.push(originalUrl.replace('_small', '_xlarge'))
    }
    
    // Convert thumb to detail/large
    if (originalUrl.includes('thumb')) {
      variations.push(originalUrl.replace('thumb', 'large'))
      variations.push(originalUrl.replace('thumb', 'detail'))
      variations.push(originalUrl.replace('thumb', 'full'))
    }
    
    // Try common size patterns
    if (originalUrl.includes('150x')) {
      variations.push(originalUrl.replace('150x', '800x'))
      variations.push(originalUrl.replace('150x', '1200x'))
    }
    
    // Try removing size constraints
    variations.push(originalUrl.replace(/\/w_\d+/, '/w_1200'))
    variations.push(originalUrl.replace(/\/h_\d+/, '/h_800'))
    
    // Test each variation
    for (const variation of variations) {
      try {
        const response = await fetch(variation, { method: 'HEAD' })
        if (response.ok) {
          const contentLength = response.headers.get('content-length')
          // Only return if significantly larger (better quality)
          if (contentLength && parseInt(contentLength) > 20000) { // > 20KB
            return variation
          }
        }
      } catch {
        // Skip failed variations
      }
    }
    
  } catch (error) {
    console.error('Error finding better image version:', error)
  }
  
  return null
}