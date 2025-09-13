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
      batchSize = 10, 
      forceRedownload = false, 
      autoRetry = false,
      qualityEnhancement = false,
      selfHeal = false
    } = await req.json().catch(() => ({}))

    console.log(`Starting image migration with batch size: ${batchSize}`)

    // Get motors that need image migration
    let query = supabase
      .from('motor_models')
      .select('id, model, image_url, images, make, horsepower')
      .not('image_url', 'is', null)

    if (!forceRedownload) {
      // Only get motors that haven't been migrated yet (no internal images)
      query = query.or('images.is.null,images.eq.[]')
    }

    const { data: motors, error: motorsError } = await query.limit(batchSize)

    if (motorsError) {
      throw new Error(`Failed to fetch motors: ${motorsError.message}`)
    }

    if (!motors || motors.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No motors need image migration',
        processed: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`Processing ${motors.length} motors`)

    let successful = 0
    let failed = 0
    const results = []

    for (const motor of motors) {
      let attempts = 0;
      const maxAttempts = autoRetry ? 3 : 1;
      
      while (attempts < maxAttempts) {
        try {
          console.log(`Processing motor: ${motor.model} (${motor.id}), attempt ${attempts + 1}`)

          if (!motor.image_url) {
            console.log(`Skipping motor ${motor.model} - no image URL`)
            break;
          }

          // Self-healing: Check if image URL is still valid
          if (selfHeal) {
            const headResponse = await fetch(motor.image_url, { method: 'HEAD' });
            if (!headResponse.ok) {
              console.log(`Image URL broken for ${motor.model}, attempting auto-fix...`);
              // Try to find alternative URL patterns
              const altUrls = generateAlternativeUrls(motor.image_url);
              let foundWorking = false;
              
              for (const altUrl of altUrls) {
                const testResponse = await fetch(altUrl, { method: 'HEAD' });
                if (testResponse.ok) {
                  motor.image_url = altUrl;
                  foundWorking = true;
                  console.log(`✓ Found working alternative URL: ${altUrl}`);
                  break;
                }
              }
              
              if (!foundWorking) {
                throw new Error(`All image URLs failed for ${motor.model}`);
              }
            }
          }

          // Download the image with timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
          
          const imageResponse = await fetch(motor.image_url, {
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; ImageBot/1.0)'
            }
          });
          clearTimeout(timeoutId);
          
          if (!imageResponse.ok) {
            throw new Error(`Failed to download image: ${imageResponse.status}`)
          }

          const imageBlob = await imageResponse.blob()
          
          // Quality check
          if (qualityEnhancement && imageBlob.size < 5000) {
            throw new Error(`Image too small (${imageBlob.size} bytes), likely low quality`);
          }
          
          const imageBuffer = await imageBlob.arrayBuffer()

        // Generate a clean filename
        const fileExtension = motor.image_url.split('.').pop()?.toLowerCase() || 'jpg'
        const cleanModel = motor.model.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
        const fileName = `${motor.make?.toLowerCase()}-${cleanModel}-${motor.horsepower}hp.${fileExtension}`
        const filePath = `motors/${fileName}`

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('motor-images')
          .upload(filePath, new Uint8Array(imageBuffer), {
            contentType: imageBlob.type || 'image/jpeg',
            upsert: true
          })

        if (uploadError) {
          throw new Error(`Failed to upload image: ${uploadError.message}`)
        }

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('motor-images')
          .getPublicUrl(filePath)

        // Update motor record with new image
        const newImages = Array.isArray(motor.images) ? [...motor.images] : []
        
        // Add the new image if it's not already there
        if (!newImages.some(img => img.url === publicUrl)) {
          newImages.push({
            url: publicUrl,
            type: 'main',
            source: 'migrated',
            original_url: motor.image_url
          })
        }

        const { error: updateError } = await supabase
          .from('motor_models')
          .update({
            images: newImages,
            // Keep the original image_url as fallback
            updated_at: new Date().toISOString()
          })
          .eq('id', motor.id)

        if (updateError) {
          throw new Error(`Failed to update motor record: ${updateError.message}`)
        }

        successful++
        results.push({
          id: motor.id,
          model: motor.model,
          status: 'success',
          new_url: publicUrl
        })

          break;
        }

        successful++
        results.push({
          id: motor.id,
          model: motor.model,
          status: 'success',
          new_url: publicUrl,
          attempt: attempts + 1
        })

        console.log(`✓ Successfully migrated image for ${motor.model}`)
        break; // Success, exit retry loop

      } catch (error) {
        attempts++;
        console.error(`✗ Attempt ${attempts} failed for ${motor.model}: ${error.message}`)
        
        if (attempts >= maxAttempts) {
          failed++
          results.push({
            id: motor.id,
            model: motor.model,
            status: 'failed',
            error: error.message,
            attempts
          })
        } else {
          console.log(`Retrying ${motor.model} (${attempts}/${maxAttempts})...`)
          await new Promise(resolve => setTimeout(resolve, 2000)) // Wait before retry
        }
      }
  }

  const summary = {
    success: true,
    processed: motors.length,
    successful,
    failed,
    results
  }

  console.log('Migration completed:', summary)

  return new Response(JSON.stringify(summary), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

} catch (error) {
  console.error('Migration error:', error)
  return new Response(JSON.stringify({
    success: false,
    error: error.message
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 500,
  })
}
})

// Helper function to generate alternative URLs
function generateAlternativeUrls(originalUrl: string): string[] {
const alternatives = []

try {
  // Convert thumb to detail
  if (originalUrl.includes('/thumb/')) {
    alternatives.push(originalUrl.replace('/thumb/', '/detail/'))
    alternatives.push(originalUrl.replace('/thumb/', '/large/'))
  }
  
  // Try different size variations
  if (originalUrl.includes('_thumb')) {
    alternatives.push(originalUrl.replace('_thumb', '_large'))
    alternatives.push(originalUrl.replace('_thumb', '_detail'))
  }
  
  // Try HTTPS if HTTP
  if (originalUrl.startsWith('http://')) {
    alternatives.push(originalUrl.replace('http://', 'https://'))
  }
  
} catch (error) {
  console.error('Error generating alternative URLs:', error)
}

return alternatives
}
