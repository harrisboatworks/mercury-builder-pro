import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { 
      prioritize_missing_images = false, 
      batch_size = 5,
      background = false 
    } = await req.json()

    console.log('Starting batch motor details scraping...', {
      prioritize_missing_images,
      batch_size,
      background
    });

    // Build query to find motors needing scraping
    let query = supabaseClient
      .from('motor_models')
      .select('id, model, detail_url, last_scraped, images, image_url')
      .not('detail_url', 'is', null);

    if (prioritize_missing_images) {
      // Prioritize motors without multiple images
      query = query.or('images.is.null,images.eq.[]');
    } else {
      // Normal scraping - motors not scraped recently
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      query = query.or(`last_scraped.is.null,last_scraped.lt.${sevenDaysAgo.toISOString()}`);
    }

    const { data: motors, error: fetchError } = await query
      .limit(batch_size)
      .order('last_scraped', { ascending: true, nullsFirst: true });

    if (fetchError) {
      console.error('Failed to fetch motors:', fetchError);
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!motors?.length) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No motors need scraping', 
          processed: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${motors.length} motors to scrape`);

    // Process motors in background if requested
    if (background) {
      // Use EdgeRuntime.waitUntil for background processing
      const backgroundTask = async () => {
        for (const motor of motors) {
          try {
            console.log(`Background scraping motor: ${motor.model}`);
            
            const { error } = await supabaseClient.functions.invoke('scrape-motor-details', {
              body: { motor_id: motor.id }
            });

            if (!error) {
              await supabaseClient
                .from('motor_models')
                .update({ last_scraped: new Date().toISOString() })
                .eq('id', motor.id);
            }

            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 2000));
          } catch (error) {
            console.error(`Background scraping failed for ${motor.id}:`, error);
          }
        }
      };

      // Start background task
      EdgeRuntime.waitUntil(backgroundTask());

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Started background scraping for ${motors.length} motors`,
          processed: motors.length 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Synchronous processing
    let successful = 0;
    let failed = 0;

    for (const motor of motors) {
      try {
        console.log(`Scraping motor: ${motor.model}`);
        
        const { error } = await supabaseClient.functions.invoke('scrape-motor-details', {
          body: { motor_id: motor.id }
        });

        if (error) {
          console.error(`Failed to scrape motor ${motor.id}:`, error);
          failed++;
        } else {
          console.log(`Successfully scraped motor ${motor.id}`);
          
          // Update last_scraped timestamp
          await supabaseClient
            .from('motor_models')
            .update({ last_scraped: new Date().toISOString() })
            .eq('id', motor.id);
          
          successful++;
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error processing motor ${motor.id}:`, error);
        failed++;
      }
    }

    const result = {
      success: true,
      message: 'Batch motor scraping completed',
      totalFound: motors.length,
      successful,
      failed
    };

    console.log('Batch scraping results:', result);
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Batch scraping error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unexpected error' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
})