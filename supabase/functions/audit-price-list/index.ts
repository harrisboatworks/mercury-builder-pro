import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { Resend } from "npm:resend@2.0.0";
import { requireAdmin } from "../_shared/admin-auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ... keep existing code (interfaces)

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Admin auth check
  const authResult = await requireAdmin(req, corsHeaders);
  if (authResult instanceof Response) return authResult;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
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
          dealer_price: parseFloat(item.dealer_price || item.our_price || item.price) || 0,
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
    const changesApplied: ChangeRecord[] = [];
    const motorsInserted: PriceListMotor[] = [];

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
          details: `${plMotor.horsepower}HP - $${plMotor.dealer_price}`,
          fixed: false,
        });

        // Auto-insert new motor if autoFix enabled
        if (autoFix && !dryRun) {
          console.log(`[audit-price-list] Auto-inserting new motor: ${modelNumber}`);
          
          // Determine motor type from model display
          let motorType = 'Outboard';
          const displayLower = plMotor.model_display.toLowerCase();
          if (displayLower.includes('verado')) motorType = 'Verado';
          else if (displayLower.includes('pro xs')) motorType = 'Pro XS';
          else if (displayLower.includes('seapro')) motorType = 'SeaPro';
          else if (displayLower.includes('prokicker')) motorType = 'ProKicker';
          else if (displayLower.includes('fourstroke')) motorType = 'FourStroke';

          const { error: insertError } = await supabase
            .from('motor_models')
            .insert({
              model_number: modelNumber,
              model_display: plMotor.model_display,
              dealer_price: plMotor.dealer_price,
              horsepower: plMotor.horsepower,
              motor_type: motorType,
              model: 'Outboard',
              is_brochure: true,
              year: new Date().getFullYear(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (!insertError) {
            motorsInserted.push(plMotor);
            discrepancies[discrepancies.length - 1].fixed = true;
          } else {
            console.error(`[audit-price-list] Failed to insert ${modelNumber}: ${insertError.message}`);
          }
        }
        continue;
      }

      // Build updates object for this motor
      const updates: Record<string, any> = {};

      // Check for name mismatch
      const plDisplayClean = (plMotor.model_display || '').trim().toLowerCase();
      const dbDisplayClean = (dbMotor.model_display || '').trim().toLowerCase();
      
      if (plDisplayClean && dbDisplayClean && plDisplayClean !== dbDisplayClean) {
        discrepancies.push({
          type: 'name_mismatch',
          model_number: modelNumber,
          price_list_value: plMotor.model_display,
          database_value: dbMotor.model_display,
          fixed: false,
        });
        updates.model_display = plMotor.model_display;
      }

      // Check for dealer price mismatch (allow 1% tolerance)
      if (plMotor.dealer_price > 0) {
        const dbPrice = dbMotor.dealer_price || 0;
        const priceDiff = Math.abs(plMotor.dealer_price - dbPrice);
        const tolerance = plMotor.dealer_price * 0.01;
        
        if (priceDiff > tolerance) {
          discrepancies.push({
            type: 'price_mismatch',
            model_number: modelNumber,
            price_list_value: plMotor.dealer_price,
            database_value: dbMotor.dealer_price,
            details: `Difference: $${priceDiff.toFixed(2)}`,
            fixed: false,
          });
          updates.dealer_price = plMotor.dealer_price;
        }
      }

      // Note: MSRP is NOT synced from price list (not available there)
      // MSRP comes from Mercury official sources and is maintained separately

      // Check for HP mismatch
      if (plMotor.horsepower > 0 && dbMotor.horsepower !== plMotor.horsepower) {
        discrepancies.push({
          type: 'hp_mismatch',
          model_number: modelNumber,
          price_list_value: plMotor.horsepower,
          database_value: dbMotor.horsepower,
          fixed: false,
        });
        updates.horsepower = plMotor.horsepower;
      }

      // Apply updates if autoFix enabled and there are changes
      if (autoFix && !dryRun && Object.keys(updates).length > 0) {
        console.log(`[audit-price-list] Updating ${modelNumber}:`, updates);
        
        const { error: updateError } = await supabase
          .from('motor_models')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('model_number', modelNumber);

        if (!updateError) {
          // Mark discrepancies as fixed and record changes
          for (const [field, newValue] of Object.entries(updates)) {
            const oldValue = (dbMotor as any)[field];
            changesApplied.push({
              model_number: modelNumber,
              model_display: plMotor.model_display,
              field,
              old_value: oldValue,
              new_value: newValue,
            });
          }
          
          // Mark related discrepancies as fixed
          for (const d of discrepancies) {
            if (d.model_number === modelNumber && !d.fixed) {
              d.fixed = true;
            }
          }
        } else {
          console.error(`[audit-price-list] Failed to update ${modelNumber}: ${updateError.message}`);
        }
      }
    }

    // Check for motors in database but not in price list
    for (const [modelNumber, dbMotor] of dbMotorMap) {
      if (!priceListMotors.has(modelNumber)) {
        discrepancies.push({
          type: 'extra_in_db',
          model_number: modelNumber,
          database_value: dbMotor.model_display,
          details: `${dbMotor.horsepower}HP - Not found in official price list (is_brochure: ${dbMotor.is_brochure})`,
        });
      }
    }

    // Build summary
    const summary = {
      price_list_count: priceListMotors.size,
      database_count: dbMotorMap.size,
      total_discrepancies: discrepancies.length,
      missing_in_db: discrepancies.filter(d => d.type === 'missing_in_db').length,
      extra_in_db: discrepancies.filter(d => d.type === 'extra_in_db').length,
      name_mismatches: discrepancies.filter(d => d.type === 'name_mismatch').length,
      price_mismatches: discrepancies.filter(d => d.type === 'price_mismatch').length,
      hp_mismatches: discrepancies.filter(d => d.type === 'hp_mismatch').length,
      changes_applied: changesApplied.length,
      motors_inserted: motorsInserted.length,
      dry_run: dryRun,
      auto_fix: autoFix,
    };

    console.log(`[audit-price-list] Audit complete:`, summary);

    // Insert log entry
    await supabase.from('cron_job_logs').insert({
      job_name: 'price-list-audit',
      status: 'completed',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      motors_found: priceListMotors.size,
      motors_updated: changesApplied.length + motorsInserted.length,
      result: {
        summary,
        changes_applied: changesApplied.slice(0, 50),
        motors_inserted: motorsInserted.slice(0, 50),
        discrepancies: discrepancies.slice(0, 100),
      },
    });

    // Send email summary if there were changes or issues
    if (resendApiKey && !dryRun && (changesApplied.length > 0 || motorsInserted.length > 0 || discrepancies.length > 0)) {
      try {
        const resend = new Resend(resendApiKey);
        
        // Format price changes for email
        const priceChangesHtml = changesApplied
          .filter(c => c.field === 'dealer_price' || c.field === 'msrp')
          .map(c => `<tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${c.model_display}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${c.field}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">$${typeof c.old_value === 'number' ? c.old_value.toLocaleString() : c.old_value || 'N/A'}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">$${typeof c.new_value === 'number' ? c.new_value.toLocaleString() : c.new_value}</td>
          </tr>`)
          .join('');

        const newMotorsHtml = motorsInserted
          .map(m => `<tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${m.model_number}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${m.model_display}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${m.horsepower}HP</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">$${m.dealer_price.toLocaleString()}</td>
          </tr>`)
          .join('');

        const unresolvedIssues = discrepancies.filter(d => !d.fixed && d.type !== 'extra_in_db');
        const unresolvedHtml = unresolvedIssues.length > 0 
          ? unresolvedIssues.slice(0, 20).map(d => `<li>${d.model_number}: ${d.type} - ${d.details || ''}</li>`).join('')
          : '<li>None</li>';

        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
            <h1 style="color: #1e3a5f; border-bottom: 2px solid #1e3a5f; padding-bottom: 10px;">
              🔄 Price List Sync Report
            </h1>
            
            <p style="color: #6b7280;">
              Automated sync completed on ${new Date().toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <div style="background: #f0f9ff; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h2 style="margin-top: 0; color: #1e3a5f;">📊 Summary</h2>
              <ul style="list-style: none; padding: 0;">
                <li>✅ <strong>${changesApplied.length}</strong> updates applied</li>
                <li>➕ <strong>${motorsInserted.length}</strong> new motors added</li>
                <li>⚠️ <strong>${unresolvedIssues.length}</strong> issues need attention</li>
              </ul>
            </div>

            ${priceChangesHtml ? `
            <h2 style="color: #1e3a5f;">💰 Price Updates Applied</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 10px; text-align: left;">Motor</th>
                  <th style="padding: 10px; text-align: left;">Field</th>
                  <th style="padding: 10px; text-align: left;">Old Price</th>
                  <th style="padding: 10px; text-align: left;">New Price</th>
                </tr>
              </thead>
              <tbody>${priceChangesHtml}</tbody>
            </table>
            ` : ''}

            ${newMotorsHtml ? `
            <h2 style="color: #1e3a5f;">➕ New Motors Added</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 10px; text-align: left;">Model #</th>
                  <th style="padding: 10px; text-align: left;">Name</th>
                  <th style="padding: 10px; text-align: left;">HP</th>
                  <th style="padding: 10px; text-align: left;">Price</th>
                </tr>
              </thead>
              <tbody>${newMotorsHtml}</tbody>
            </table>
            ` : ''}

            <h2 style="color: #1e3a5f;">⚠️ Issues Requiring Attention</h2>
            <ul>${unresolvedHtml}</ul>

            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px;">
              This is an automated report from the Harris Boat Works price list sync system.
              <br>View full details in the <a href="https://supabase.com/dashboard/project/eutsoqdpjurknjsshxes/editor/29614">cron_job_logs table</a>.
            </p>
          </div>
        `;

        await resend.emails.send({
          from: 'system@hbwsales.ca',
          to: ['info@harrisboatworks.ca'],
          reply_to: 'info@harrisboatworks.ca',
          subject: `🔄 Price List Sync: ${changesApplied.length} updates, ${motorsInserted.length} new motors`,
          html: emailHtml,
        });

        console.log('[audit-price-list] Email summary sent successfully');
      } catch (emailError) {
        console.error('[audit-price-list] Failed to send email:', emailError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        summary,
        changes_applied: changesApplied,
        motors_inserted: motorsInserted,
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
