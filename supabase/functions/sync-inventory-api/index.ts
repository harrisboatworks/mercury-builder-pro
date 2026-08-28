import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { pingMotorUpdates } from "../_shared/indexnow.ts";

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

    // Track which motors' user-visible content actually changed so we can
    // ping ONLY those to IndexNow (not "every in-stock motor every run").
    const changedModelKeys: string[] = [];

    // Process each motor
    for (const motor of motors) {
      try {
        const nextAvailability = motor.availability || 'In Stock';
        const nextBasePrice = parseFloat(motor.price) || null;
        const nextDescription = motor.description ?? null;

        // Snapshot prior user-visible fields for change detection.
        const { data: prior } = await supabase
          .from('motor_models')
          .select('id, model_key, availability, base_price, description')
          .eq('stock_number', motor.stock_number)
          .maybeSingle();

        const motorData = {
          stock_number: motor.stock_number,
          make: motor.make || 'Mercury',
          model: motor.model,
          horsepower: parseFloat(motor.horsepower) || 0,
          year: parseInt(motor.year) || 2026,
          motor_type: motor.motor_type || 'Outboard',
          base_price: nextBasePrice,
          availability: nextAvailability,
          image_url: motor.image_url,
          detail_url: motor.detail_url,
          description: nextDescription,
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
          continue;
        }

        if (prior) {
          updated++;
          const priorPrice = prior.base_price == null ? null : Number(prior.base_price);
          const priceChanged =
            (priorPrice == null) !== (nextBasePrice == null) ||
            (priorPrice != null && nextBasePrice != null &&
              Math.abs(priorPrice - nextBasePrice) > 1);
          const availabilityChanged = prior.availability !== nextAvailability;
          const descriptionChanged = (prior.description ?? null) !== nextDescription;

          if (prior.model_key && (priceChanged || availabilityChanged || descriptionChanged)) {
            changedModelKeys.push(prior.model_key);
          }
        } else {
          // Newly inserted — worth pinging once we know its model_key.
          inserted++;
          const { data: fresh } = await supabase
            .from('motor_models')
            .select('model_key')
            .eq('stock_number', motor.stock_number)
            .maybeSingle();
          if (fresh?.model_key) changedModelKeys.push(fresh.model_key);
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
      motors_changed_for_indexnow: changedModelKeys.length,
      timestamp: new Date().toISOString()
    };

    console.log('✅ Sync completed:', summary);

    // Fire IndexNow ping ONLY for motors whose user-visible content changed.
    pingMotorUpdates(changedModelKeys, 'inventory-api-sync');

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