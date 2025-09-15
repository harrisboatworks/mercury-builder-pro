import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting inventory sync from API');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch from your main site's API endpoint
    const response = await fetch('https://www.harrisboatworks.ca/api/inventory.php');
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const motors = await response.json();
    console.log(`📦 Fetched ${motors.length} motors from API`);

    let inserted = 0;
    let updated = 0;
    let failed = 0;

    // Process each motor
    for (const motor of motors) {
      try {
        const motorData = {
          stock_number: motor.stock_number,
          make: motor.make || 'Mercury',
          model: motor.model,
          horsepower: parseFloat(motor.horsepower) || 0,
          year: parseInt(motor.year) || 2025,
          motor_type: motor.motor_type || 'Outboard',
          base_price: parseFloat(motor.price) || null,
          availability: motor.availability || 'In Stock',
          image_url: motor.image_url,
          detail_url: motor.detail_url,
          description: motor.description,
          features: motor.features ? JSON.parse(motor.features) : [],
          specifications: motor.specifications ? JSON.parse(motor.specifications) : {},
          inventory_source: 'api',
          last_scraped: new Date().toISOString(),
          data_sources: {
            harris: {
              success: true,
              scraped_at: new Date().toISOString()
            }
          }
        };

        const { error } = await supabase
          .from('motor_models')
          .upsert(motorData, { 
            onConflict: 'stock_number',
            ignoreDuplicates: false 
          });

        if (error) {
          console.error('❌ Database error:', error);
          failed++;
        } else {
          // Check if it was insert or update
          const { data: existing } = await supabase
            .from('motor_models')
            .select('id')
            .eq('stock_number', motor.stock_number)
            .single();
          
          if (existing) {
            updated++;
          } else {
            inserted++;
          }
        }
      } catch (err) {
        console.error('❌ Processing error:', err);
        failed++;
      }
    }

    const summary = {
      success: true,
      motors_fetched: motors.length,
      motors_inserted: inserted,
      motors_updated: updated,
      motors_failed: failed,
      timestamp: new Date().toISOString()
    };

    console.log('✅ Sync completed:', summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Sync failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});