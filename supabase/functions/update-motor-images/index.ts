import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting motor image quality update...')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all motors with thumb/low-quality images
    const { data: motorsWithThumbImages, error: fetchError } = await supabase
      .from('motor_models')
      .select('id, model, image_url')
      .or('image_url.ilike.%thumb%,image_url.ilike.%ThumbGenerator%')

    if (fetchError) {
      console.error('Error fetching motors:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch motors', details: fetchError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log(`Found ${motorsWithThumbImages?.length || 0} motors with thumb images`)

    if (!motorsWithThumbImages || motorsWithThumbImages.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No motors with thumb images found', updated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let updatedCount = 0
    const failedUpdates: any[] = []

    // Process each motor
    for (const motor of motorsWithThumbImages) {
      try {
        let newImageUrl = motor.image_url

        // Convert ThumbGenerator URLs to direct image URLs
        if (motor.image_url.includes('ThumbGenerator')) {
          const imgMatch = motor.image_url.match(/img=([^&]+)/)
          if (imgMatch) {
            // Extract the actual image path and make it a direct URL
            const imagePath = decodeURIComponent(imgMatch[1])
            newImageUrl = `https:${imagePath}`
          }
        }
        
        // Convert any remaining thumb references to detail
        newImageUrl = newImageUrl.replace('/thumb/', '/detail/')
        
        // Only update if the URL actually changed
        if (newImageUrl !== motor.image_url) {
          console.log(`Updating motor ${motor.model}: ${motor.image_url} -> ${newImageUrl}`)
          
          const { error: updateError } = await supabase
            .from('motor_models')
            .update({ image_url: newImageUrl, updated_at: new Date().toISOString() })
            .eq('id', motor.id)

          if (updateError) {
            console.error(`Failed to update motor ${motor.id}:`, updateError)
            failedUpdates.push({ id: motor.id, model: motor.model, error: updateError.message })
          } else {
            updatedCount++
          }
        }
      } catch (error) {
        console.error(`Error processing motor ${motor.id}:`, error)
        failedUpdates.push({ id: motor.id, model: motor.model, error: (error as Error).message })
      }
    }

    console.log(`Image quality update completed. Updated: ${updatedCount}, Failed: ${failedUpdates.length}`)

    return new Response(
      JSON.stringify({ 
        message: 'Motor image update completed',
        totalProcessed: motorsWithThumbImages.length,
        updated: updatedCount,
        failed: failedUpdates.length,
        failedUpdates: failedUpdates
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Update motor images error:', error)
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: (error as Error)?.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})