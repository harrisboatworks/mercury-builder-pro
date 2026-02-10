import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { requireAdmin } from "../_shared/admin-auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ... keep existing code (motorSchema, generateModelKey, parseModelDisplay)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Admin auth check
  const authResult = await requireAdmin(req, corsHeaders);
  if (authResult instanceof Response) return authResult;

  const startTime = Date.now();
  
  try {
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!FIRECRAWL_API_KEY) {
      throw new Error('FIRECRAWL_API_KEY not configured');
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request body for options
    let body: { dryRun?: boolean; syncToDb?: boolean } = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    
    const dryRun = body.dryRun ?? false;
    const syncToDb = body.syncToDb ?? true;

    console.log('🤖 Starting Firecrawl FIRE-1 Agent extraction...');
    console.log('Options:', { dryRun, syncToDb });

    // Call Firecrawl Extract API with FIRE-1 agent
    const extractResponse = await fetch('https://api.firecrawl.dev/v1/extract', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        urls: ['https://www.harrisboatworks.ca/search/inventory/availability/In%20Stock/type/Outboard%20Motors/usage/New/sort/price-low'],
        prompt: `Extract ALL new Mercury outboard motors currently shown as in stock on this page.
For each motor, extract:
- Year (model year, usually 2024 or 2025)
- Make (should be Mercury)
- Model name (full name like "FourStroke 25 ELH EFI" or "Verado 300 XL")
- Horsepower (numeric HP value)
- Sale price (the current/sale price, NOT the original MSRP. Look for "Now" or discounted price)
- MSRP (the original "Was" or MSRP price if shown)
- Stock number (dealer stock #)
- Availability status
- Image URL (main product image)
- Detail page URL
- Motor family (FourStroke, SeaPro, ProXS, Verado, Racing, Jet, or Avator)
- Shaft length code (MH, MLH, ELH, ELPT, EXLPT, XL, XXL, CXL)
- Control type (Tiller or Remote)
- Start type (Manual or Electric)

Be thorough and extract every motor listing on the page, including all pagination if present.
Only include Mercury brand motors. Ignore boats, trailers, accessories, and used/pre-owned items.`,
        schema: motorSchema,
        agent: {
          model: 'FIRE-1'
        }
      }),
    });

    if (!extractResponse.ok) {
      const errorText = await extractResponse.text();
      console.error('Firecrawl API error:', extractResponse.status, errorText);
      throw new Error(`Firecrawl API failed: ${extractResponse.status} - ${errorText}`);
    }

    const extractResult = await extractResponse.json();
    console.log('📦 Firecrawl extraction complete');
    console.log('Raw result keys:', Object.keys(extractResult));

    // Extract motors from result
    const motors = extractResult.data?.motors || extractResult.motors || [];
    console.log(`Found ${motors.length} motors in extraction`);

    if (motors.length === 0) {
      console.warn('No motors extracted - check extraction result:', JSON.stringify(extractResult).slice(0, 500));
      return new Response(JSON.stringify({
        success: true,
        warning: 'No motors found in extraction',
        extractResult: extractResult,
        executionTime: Date.now() - startTime
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Log sample motor for debugging
    console.log('Sample motor:', JSON.stringify(motors[0], null, 2));

    // Transform motors to database format
    const transformedMotors = motors
      .filter((m: any) => m.make?.toLowerCase() === 'mercury' && m.horsepower > 0)
      .map((m: any) => {
        const modelKey = generateModelKey(m);
        const modelDisplay = parseModelDisplay(m.model_name || '', m.horsepower);
        
        return {
          model_key: modelKey,
          model_number: m.stock_number || modelKey,
          model: 'Outboard',
          model_display: modelDisplay,
          horsepower: m.horsepower,
          year: m.year || 2025,
          motor_type: 'Outboard',
          family: m.motor_family || 'FourStroke',
          shaft: m.shaft_code || null,
          control_type: m.control_type || null,
          start_type: m.start_type || null,
          sale_price: m.sale_price || null,
          msrp: m.msrp || null,
          dealer_price: m.sale_price || null, // Use sale price as dealer price
          stock_number: m.stock_number || null,
          availability: 'In Stock',
          in_stock: true,
          image_url: m.image_url || null,
          detail_url: m.detail_url || null,
          inventory_source: 'firecrawl-agent',
          last_scraped: new Date().toISOString(),
          last_stock_check: new Date().toISOString()
        };
      });

    console.log(`Transformed ${transformedMotors.length} motors for database`);

    if (dryRun) {
      return new Response(JSON.stringify({
        success: true,
        dryRun: true,
        motorsExtracted: motors.length,
        motorsTransformed: transformedMotors.length,
        sample: transformedMotors.slice(0, 3),
        executionTime: Date.now() - startTime
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!syncToDb) {
      return new Response(JSON.stringify({
        success: true,
        motorsExtracted: motors.length,
        motorsTransformed: transformedMotors.length,
        motors: transformedMotors,
        executionTime: Date.now() - startTime
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Sync to database
    console.log('🔄 Syncing to database...');

    // Get current stock numbers from extraction
    const extractedStockNumbers = transformedMotors
      .map((m: any) => m.stock_number)
      .filter((s: string | null) => s !== null);

    // Mark motors NOT in the new data as "Out of Stock" (only those previously from firecrawl-agent)
    if (extractedStockNumbers.length > 0) {
      const { error: markError, count: markedCount } = await supabase
        .from('motor_models')
        .update({ 
          availability: 'Out of Stock', 
          in_stock: false,
          last_stock_check: new Date().toISOString()
        })
        .eq('inventory_source', 'firecrawl-agent')
        .eq('in_stock', true)
        .not('stock_number', 'in', `(${extractedStockNumbers.map((s: string) => `"${s}"`).join(',')})`);

      if (markError) {
        console.warn('Error marking out of stock:', markError);
      } else {
        console.log(`Marked ${markedCount || 0} motors as out of stock`);
      }
    }

    // Upsert transformed motors
    let inserted = 0;
    let updated = 0;
    let errors: string[] = [];

    for (const motor of transformedMotors) {
      // Check if exists by stock_number
      const { data: existing } = await supabase
        .from('motor_models')
        .select('id')
        .eq('stock_number', motor.stock_number)
        .single();

      if (existing) {
        // Update existing
        const { error: updateError } = await supabase
          .from('motor_models')
          .update({
            ...motor,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (updateError) {
          errors.push(`Update ${motor.stock_number}: ${updateError.message}`);
        } else {
          updated++;
        }
      } else {
        // Insert new
        const { error: insertError } = await supabase
          .from('motor_models')
          .insert(motor);

        if (insertError) {
          errors.push(`Insert ${motor.stock_number}: ${insertError.message}`);
        } else {
          inserted++;
        }
      }
    }

    // Log sync result
    await supabase.from('sync_logs').insert({
      sync_type: 'firecrawl-agent',
      status: errors.length > 0 ? 'partial' : 'completed',
      motors_processed: transformedMotors.length,
      motors_in_stock: transformedMotors.length,
      details: {
        extracted: motors.length,
        transformed: transformedMotors.length,
        inserted,
        updated,
        errors: errors.slice(0, 10) // Limit error log
      },
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString()
    });

    const executionTime = Date.now() - startTime;
    console.log(`✅ Sync complete in ${executionTime}ms: ${inserted} inserted, ${updated} updated, ${errors.length} errors`);

    return new Response(JSON.stringify({
      success: true,
      summary: {
        motorsExtracted: motors.length,
        motorsTransformed: transformedMotors.length,
        inserted,
        updated,
        errors: errors.length
      },
      executionTime,
      ...(errors.length > 0 && { errorSamples: errors.slice(0, 5) })
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Firecrawl agent error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime: Date.now() - startTime
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
