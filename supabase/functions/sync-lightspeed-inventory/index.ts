import { createClient } from "npm:@supabase/supabase-js@2.53.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startedAt = new Date().toISOString();
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Helper: send admin SMS via existing send-sms function (handles Twilio + ADMIN_PHONE resolution)
  async function notifyAdmin(subject: string, body: string) {
    try {
      await supabase.functions.invoke('send-sms', {
        body: {
          to: 'admin',
          message: `${subject}\n${body}`.slice(0, 1500),
          messageType: 'manual',
        },
      });
    } catch (e) {
      console.error('Failed to send admin SMS notification:', e);
    }
  }

  try {
    console.log('🔄 Starting Lightspeed inventory sync from mercury_motor_inventory view');

    // ── 1. Fetch all available NEW Mercury motors from the Lightspeed view ──
    const { data: inventory, error: inventoryError } = await supabase
      .from('mercury_motor_inventory')
      .select('model, model_year, stock_number, dealer_price, msrp, availability_status, available_for_sale')
      .eq('new_used', 'N')
      .eq('model_year', 2026)
      .eq('available_for_sale', true);

    if (inventoryError) {
      throw new Error(`Failed to read mercury_motor_inventory: ${inventoryError.message}`);
    }

    console.log(`📦 Found ${inventory?.length || 0} available new Mercury motors in Lightspeed`);

    // ── 2. Group inventory by model to get quantities and best prices ──
    const modelGroups = new Map<string, {
      qty: number;
      stockNumbers: string[];
      dealerPrice: number;
      msrp: number;
      modelYear: number;
    }>();

    for (const unit of inventory || []) {
      const key = unit.model;
      const existing = modelGroups.get(key);
      if (existing) {
        existing.qty++;
        existing.stockNumbers.push(unit.stock_number);
        // Use the most recent year's pricing
        if (unit.model_year > existing.modelYear) {
          existing.dealerPrice = unit.dealer_price;
          existing.msrp = unit.msrp;
          existing.modelYear = unit.model_year;
        }
      } else {
        modelGroups.set(key, {
          qty: 1,
          stockNumbers: [unit.stock_number],
          dealerPrice: unit.dealer_price,
          msrp: unit.msrp,
          modelYear: unit.model_year,
        });
      }
    }

    console.log(`📋 ${modelGroups.size} unique models in stock`);

    // ── 3. Reset all motors to out of stock (preserve Excluded) ──
    const { error: resetError } = await supabase
      .from('motor_models')
      .update({
        in_stock: false,
        availability: null,
        stock_quantity: 0,
      })
      .neq('id', '00000000-0000-0000-0000-000000000000')
      .neq('availability', 'Exclude');

    if (resetError) {
      console.error('Error resetting stock:', resetError);
    }

    // ── 4. Parse motor name helper (same logic as Google Sheets sync) ──
    function parseMotorName(name: string): {
      hp: number | null;
      riggingCode: string | null;
      family: string | null;
      hasCommandThrust: boolean;
    } {
      let normalized = name
        .replace(/®/g, '')
        .replace(/\s*HP\s*/gi, ' ')
        .replace(/\s*EFI\s*/gi, ' ')
        .replace(/Pro\s*XS/gi, 'ProXS')
        .trim();

      const hpMatch = normalized.match(/(\d+(?:\.\d+)?)\s*HP|\b(\d+(?:\.\d+)?)\b/i);
      const hp = hpMatch ? parseFloat(hpMatch[1] || hpMatch[2]) : null;

      let family: string | null = null;
      if (/verado/i.test(normalized)) family = 'Verado';
      else if (/pro\s*xs|proxs/i.test(normalized)) family = 'ProXS';
      else if (/sea\s*pro|seapro/i.test(normalized)) family = 'SeaPro';
      else if (/four\s*stroke|fourstroke/i.test(normalized)) family = 'FourStroke';
      else if (/prokicker/i.test(normalized)) family = 'ProKicker';

      const riggingMatch = normalized.match(/\b(EXLHPT|EXLPT|ELHPT|ELPT|ELH|EPT|EH|MRC|MXXL|MXL|MLH|MH|ML|EL|XXL|XL|L|CT)\b/i);
      let riggingCode = riggingMatch ? riggingMatch[1].toUpperCase() : null;

      // For Pro XS motors, translate L/XL to full codes
      if (riggingCode && (family === 'ProXS' || /pro\s*xs/i.test(normalized))) {
        if (riggingCode === 'L') {
          riggingCode = 'ELPT';
          console.log(`  Pro XS translation: L → ELPT`);
        } else if (riggingCode === 'XL') {
          riggingCode = 'EXLPT';
          console.log(`  Pro XS translation: XL → EXLPT`);
        }
      }

      const hasCommandThrust = /command\s*thrust|\bCT\b/i.test(normalized);

      return { hp, riggingCode, family, hasCommandThrust };
    }

    // ── 5. Match inventory models to motor_models and update ──
    const matchedMotors: string[] = [];
    const unmatchedModels: string[] = [];

    for (const [modelName, group] of modelGroups) {
      const parsed = parseMotorName(modelName);
      console.log(`🔍 Parsing "${modelName}":`, JSON.stringify(parsed));

      if (!parsed.riggingCode && !parsed.hp) {
        console.log(`⚠️ Cannot parse "${modelName}" - skipping`);
        unmatchedModels.push(modelName);
        continue;
      }

      // Build query
      let query = supabase
        .from('motor_models')
        .select('id, model_display, horsepower, availability');

      if (parsed.hp !== null) {
        query = query.eq('horsepower', parsed.hp);
      }

      if (parsed.riggingCode) {
        query = query.ilike('model_display', `%${parsed.riggingCode}%`);
      }

      if (parsed.family) {
        query = query.ilike('model_display', `%${parsed.family}%`);
      }

      if (parsed.hasCommandThrust) {
        query = query.or('model_display.ilike.%Command Thrust%,model_display.ilike.%CT%');
      } else {
        query = query.not('model_display', 'ilike', '%Command Thrust%');
      }

      query = query.limit(5);

      const { data: motors, error: searchError } = await query;

      if (searchError) {
        console.error(`Error searching for ${modelName}:`, searchError);
        unmatchedModels.push(modelName);
        continue;
      }

      // Filter out excluded motors
      const validMotors = (motors || []).filter(m => m.availability !== 'Exclude');

      if (validMotors.length > 0) {
        // Update ALL matching motors (brochure + inventory variants)
        for (const motor of validMotors) {
          const { error: updateError } = await supabase
            .from('motor_models')
            .update({
              in_stock: true,
              availability: 'In Stock',
              stock_quantity: group.qty,
              dealer_price_live: group.dealerPrice,
              last_stock_check: new Date().toISOString(),
              inventory_source: 'lightspeed',
            })
            .eq('id', motor.id);

          if (updateError) {
            console.error(`Error updating ${motor.model_display}:`, updateError);
          }
        }

        matchedMotors.push(`${modelName} → ${validMotors.map(m => m.model_display).join(', ')} (qty: ${group.qty})`);
        console.log(`✅ Matched: ${modelName} → ${validMotors.map(m => m.model_display).join(', ')} (qty: ${group.qty}, dealer: $${group.dealerPrice})`);
      } else {
        unmatchedModels.push(modelName);
        console.log(`❌ No match for: ${modelName}`);
      }
    }

    // ── 6. Log the sync ──
    await supabase
      .from('sync_logs')
      .insert({
        sync_type: 'lightspeed',
        status: 'completed',
        motors_processed: modelGroups.size,
        motors_in_stock: matchedMotors.length,
        details: {
          matched: matchedMotors,
          unmatched: unmatchedModels,
          source: 'mercury_motor_inventory view (Lightspeed 3PA API)',
          total_units: inventory?.length || 0,
          unique_models: modelGroups.size,
        },
        completed_at: new Date().toISOString(),
      });

    // ── 7. Email notification for unmatched motors ──
    if (unmatchedModels.length > 0) {
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      const adminEmail = Deno.env.get('MERCURY_DEALER_EMAIL');

      if (resendApiKey && adminEmail) {
        try {
          const emailHtml = `
            <h2>🔍 Lightspeed Inventory Sync - Unmatched Motors</h2>
            <p>The following <strong>${unmatchedModels.length}</strong> motor(s) from Lightspeed could not be matched to the catalog:</p>
            <ul>${unmatchedModels.map(m => `<li><strong>${m}</strong></li>`).join('')}</ul>
            <hr />
            <p><strong>Summary:</strong></p>
            <ul>
              <li>Total units available: ${inventory?.length || 0}</li>
              <li>Unique models: ${modelGroups.size}</li>
              <li>Successfully matched: ${matchedMotors.length}</li>
              <li>Unmatched: ${unmatchedModels.length}</li>
            </ul>
            <p>These motors exist in Lightspeed but have no matching entry in the website catalog.</p>
          `;

          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Motor Inventory Sync <system@hbwsales.ca>',
              to: [adminEmail],
              subject: `⚠️ ${unmatchedModels.length} Unmatched Motors in Lightspeed Sync`,
              html: emailHtml,
            }),
          });
          console.log('📧 Unmatched motors email sent');
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
        }
      }
    }

    const result = {
      success: true,
      source: 'lightspeed',
      totalUnitsAvailable: inventory?.length || 0,
      uniqueModels: modelGroups.size,
      matched: matchedMotors.length,
      unmatched: unmatchedModels.length,
      matchedDetails: matchedMotors,
      unmatchedDetails: unmatchedModels,
    };

    console.log('✅ Lightspeed sync complete:', JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Lightspeed sync error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
