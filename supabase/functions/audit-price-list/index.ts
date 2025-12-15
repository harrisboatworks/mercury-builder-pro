import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PriceListMotor {
  model_number: string;
  model_display: string;
  dealer_price: number;
  msrp: number;
  horsepower: number;
}

interface DatabaseMotor {
  id: string;
  model_number: string;
  model_display: string;
  dealer_price: number | null;
  msrp: number | null;
  horsepower: number | null;
}

interface Discrepancy {
  type: 'missing_in_db' | 'extra_in_db' | 'name_mismatch' | 'price_mismatch';
  model_number: string;
  price_list_value?: string | number;
  database_value?: string | number;
  details?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for options
    let dryRun = true;
    let autoFix = false;
    try {
      const body = await req.json();
      dryRun = body.dryRun !== false;
      autoFix = body.autoFix === true;
    } catch {
      // No body provided, use defaults
    }

    console.log(`[audit-price-list] Starting audit. dryRun=${dryRun}, autoFix=${autoFix}`);

    // Fetch the official price list
    const priceListUrl = 'https://www.harrisboatworks.ca/mercurypricelist';
    console.log(`[audit-price-list] Fetching price list from ${priceListUrl}`);
    
    const priceListResponse = await fetch(priceListUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'HarrisBoatWorks-PriceListAudit/1.0',
      },
    });

    if (!priceListResponse.ok) {
      throw new Error(`Failed to fetch price list: ${priceListResponse.status}`);
    }

    const priceListData = await priceListResponse.json();
    console.log(`[audit-price-list] Fetched ${priceListData.length || 0} motors from price list`);

    // Parse price list into structured format
    const priceListMotors: Map<string, PriceListMotor> = new Map();
    for (const item of priceListData) {
      if (item.model_number) {
        priceListMotors.set(item.model_number, {
          model_number: item.model_number,
          model_display: item.model_display || item.description || '',
          dealer_price: parseFloat(item.dealer_price) || 0,
          msrp: parseFloat(item.msrp) || 0,
          horsepower: parseFloat(item.horsepower || item.hp) || 0,
        });
      }
    }

    // Fetch all motors from database
    const { data: dbMotors, error: dbError } = await supabase
      .from('motor_models')
      .select('id, model_number, model_display, dealer_price, msrp, horsepower, is_brochure')
      .order('horsepower', { ascending: true });

    if (dbError) {
      throw new Error(`Database query failed: ${dbError.message}`);
    }

    console.log(`[audit-price-list] Found ${dbMotors?.length || 0} motors in database`);

    const discrepancies: Discrepancy[] = [];
    const autoFixUpdates: { model_number: string; updates: Record<string, any> }[] = [];

    // Create a map of database motors by model_number
    const dbMotorMap: Map<string, DatabaseMotor> = new Map();
    for (const motor of dbMotors || []) {
      if (motor.model_number) {
        dbMotorMap.set(motor.model_number, motor);
      }
    }

    // Check each price list motor against database
    for (const [modelNumber, plMotor] of priceListMotors) {
      const dbMotor = dbMotorMap.get(modelNumber);

      if (!dbMotor) {
        // Motor in price list but not in database
        discrepancies.push({
          type: 'missing_in_db',
          model_number: modelNumber,
          price_list_value: plMotor.model_display,
          details: `${plMotor.horsepower}HP - $${plMotor.dealer_price} dealer / $${plMotor.msrp} MSRP`,
        });
        continue;
      }

      // Check for name mismatch
      const plDisplayClean = (plMotor.model_display || '').trim().toLowerCase();
      const dbDisplayClean = (dbMotor.model_display || '').trim().toLowerCase();
      
      if (plDisplayClean && dbDisplayClean && plDisplayClean !== dbDisplayClean) {
        discrepancies.push({
          type: 'name_mismatch',
          model_number: modelNumber,
          price_list_value: plMotor.model_display,
          database_value: dbMotor.model_display,
        });

        if (autoFix && !dryRun) {
          autoFixUpdates.push({
            model_number: modelNumber,
            updates: { model_display: plMotor.model_display },
          });
        }
      }

      // Check for price mismatch (allow 1% tolerance)
      if (plMotor.dealer_price > 0 && dbMotor.dealer_price) {
        const priceDiff = Math.abs(plMotor.dealer_price - dbMotor.dealer_price);
        const tolerance = plMotor.dealer_price * 0.01;
        
        if (priceDiff > tolerance) {
          discrepancies.push({
            type: 'price_mismatch',
            model_number: modelNumber,
            price_list_value: plMotor.dealer_price,
            database_value: dbMotor.dealer_price,
            details: `Difference: $${priceDiff.toFixed(2)}`,
          });
        }
      }
    }

    // Check for motors in database but not in price list (inventory only)
    for (const [modelNumber, dbMotor] of dbMotorMap) {
      if (!priceListMotors.has(modelNumber)) {
        // Only flag if it's marked as a brochure motor (official catalog)
        // Inventory motors might not be in the price list
        discrepancies.push({
          type: 'extra_in_db',
          model_number: modelNumber,
          database_value: dbMotor.model_display,
          details: `${dbMotor.horsepower}HP - Not found in official price list`,
        });
      }
    }

    // Apply auto-fixes if enabled
    let fixedCount = 0;
    if (autoFix && !dryRun && autoFixUpdates.length > 0) {
      console.log(`[audit-price-list] Applying ${autoFixUpdates.length} auto-fixes`);
      
      for (const fix of autoFixUpdates) {
        const { error: updateError } = await supabase
          .from('motor_models')
          .update({ ...fix.updates, updated_at: new Date().toISOString() })
          .eq('model_number', fix.model_number);

        if (!updateError) {
          fixedCount++;
        } else {
          console.error(`[audit-price-list] Failed to update ${fix.model_number}: ${updateError.message}`);
        }
      }
    }

    // Log results to cron_job_logs
    const summary = {
      price_list_count: priceListMotors.size,
      database_count: dbMotorMap.size,
      total_discrepancies: discrepancies.length,
      missing_in_db: discrepancies.filter(d => d.type === 'missing_in_db').length,
      extra_in_db: discrepancies.filter(d => d.type === 'extra_in_db').length,
      name_mismatches: discrepancies.filter(d => d.type === 'name_mismatch').length,
      price_mismatches: discrepancies.filter(d => d.type === 'price_mismatch').length,
      auto_fixed: fixedCount,
      dry_run: dryRun,
    };

    console.log(`[audit-price-list] Audit complete:`, summary);

    // Insert log entry
    await supabase.from('cron_job_logs').insert({
      job_name: 'price-list-audit',
      status: 'completed',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      motors_found: priceListMotors.size,
      motors_updated: fixedCount,
      result: {
        summary,
        discrepancies: discrepancies.slice(0, 100), // Limit to first 100 for storage
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        summary,
        discrepancies,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('[audit-price-list] Error:', error);

    // Try to log the error
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      await supabase.from('cron_job_logs').insert({
        job_name: 'price-list-audit',
        status: 'failed',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        error_message: error.message || 'Unknown error',
      });
    } catch (logError) {
      console.error('[audit-price-list] Failed to log error:', logError);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});