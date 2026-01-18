import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get sheet URL and GID from request or database
    let sheetUrl: string;
    let sheetGid: string;
    const body = await req.json().catch(() => ({}));
    
    if (body.sheetUrl) {
      sheetUrl = body.sheetUrl;
      sheetGid = body.sheetGid || '1042549170'; // Default to correct GID
    } else {
      // Get from database
      const { data: config } = await supabase
        .from('google_sheets_config')
        .select('sheet_url, sheet_gid, auto_sync_enabled')
        .single();
      
      if (!config || !config.auto_sync_enabled) {
        return new Response(
          JSON.stringify({ success: false, error: 'Auto-sync is disabled or not configured' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      sheetUrl = config.sheet_url;
      sheetGid = config.sheet_gid || '1042549170'; // Default to correct GID
    }

    console.log('🔄 Starting Google Sheets sync:', sheetUrl);
    console.log('📋 Using sheet GID:', sheetGid);

    // IMPORTANT: This function ONLY READS from the Google Sheet
    // It NEVER writes or modifies the sheet in any way
    // All updates go to the Supabase motor_models table only
    
    // Convert various Google Sheets URL formats to CSV export format
    let csvUrl = sheetUrl;
    
    // Handle /edit URLs (most common when sharing from Google Sheets)
    if (sheetUrl.includes('/edit')) {
      // Extract the spreadsheet ID
      const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match) {
        // Use the configured GID
        csvUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv&gid=${sheetGid}`;
      }
    } else if (sheetUrl.includes('/pubhtml')) {
      csvUrl = sheetUrl.replace('/pubhtml', '/pub');
      // Override with configured sheet gid
      const baseUrl = csvUrl.split('?')[0];
      csvUrl = `${baseUrl}?gid=${sheetGid}&output=csv`;
    } else if (!sheetUrl.includes('/export')) {
      // Generic fallback - try to convert to export URL with configured sheet
      const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match) {
        csvUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv&gid=${sheetGid}`;
      }
    }
    
    console.log('📋 Targeting sheet GID:', sheetGid);
    console.log('📄 Fetching CSV from:', csvUrl);

    // Fetch CSV directly from Google Sheets
    const csvResponse = await fetch(csvUrl);

    if (!csvResponse.ok) {
      throw new Error(`Failed to fetch Google Sheet: ${csvResponse.statusText}`);
    }

    const csvText = await csvResponse.text();
    console.log('📄 CSV content length:', csvText.length);
    
    // CRITICAL: Validate that we received CSV data, not HTML
    if (csvText.startsWith('<!DOCTYPE') || csvText.includes('<html>') || csvText.includes('<!doctype')) {
      console.error('❌ Received HTML instead of CSV. Check sheet GID and sharing settings.');
      console.error('📄 Response preview:', csvText.substring(0, 500));
      throw new Error(`Received HTML instead of CSV. The sheet GID (${sheetGid}) may be incorrect, or the sheet may not be properly shared. Please verify the GID matches your "New Mercury Motors" tab.`);
    }

    // Parse CSV with proper handling of quoted fields
    function parseCSVLine(line: string): string[] {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++; // Skip next quote
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    }

    // Parse CSV to extract Mercury motors only
    // Expected columns: A1(ID), Name, Type, Brand, Model, Year, Price, Condition, Details, URL, Last Updated
    // Indices:           0      1     2     3      4      5     6      7          8        9    10
    const lines = csvText.split('\n');
    const motorNames: string[] = [];
    let totalRows = 0;
    let mercuryMotorsFound = 0;

    for (let i = 1; i < lines.length; i++) { // Skip header row (i=0)
      if (!lines[i].trim()) continue; // Skip empty lines
      totalRows++;
      
      const columns = parseCSVLine(lines[i]);
      
      // Column indices based on the sheet structure:
      // 0: ID, 1: Name, 2: Type, 3: Brand, 4: Model, 5: Year, 6: Price, 7: Condition
      const name = columns[1] || '';
      const type = columns[2] || '';
      const brand = columns[3] || '';
      const model = columns[4] || '';
      const condition = columns[7] || '';
      
      // Filter: Only NEW MERCURY OUTBOARD MOTORS
      const isMercury = brand.toLowerCase().trim() === 'mercury';
      const isOutboard = type.toLowerCase().includes('outboard') || type.toLowerCase().includes('motor');
      const isNew = condition.toLowerCase().trim() === 'new';
      
      if (isMercury && isOutboard && isNew) {
        mercuryMotorsFound++;
        // Use the Model column (more precise) or fall back to Name
        const motorName = model || name;
        if (motorName && motorName.length > 2) {
          motorNames.push(motorName);
          console.log(`✅ New Mercury motor [row ${i}]: ${motorName}`);
        }
      }
    }

    console.log(`📋 Sheet stats: ${totalRows} total rows, ${mercuryMotorsFound} new Mercury motors found`);
    console.log('📋 Motor names to match:', motorNames);

    // Reset all motors to out of stock first
    const { error: resetError } = await supabase
      .from('motor_models')
      .update({
        in_stock: false,
        availability: null,
        stock_quantity: 0,
      })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all

    if (resetError) {
      console.error('Error resetting stock:', resetError);
    }

    // Helper function to parse motor name and extract components
    function parseMotorName(name: string): {
      hp: number | null;
      riggingCode: string | null;
      family: string | null;
      hasCommandThrust: boolean;
    } {
      // Normalize text
      let normalized = name
        .replace(/®/g, '') // Remove ®
        .replace(/\s*HP\s*/gi, ' ') // Remove "HP"
        .replace(/\s*EFI\s*/gi, ' ') // Remove "EFI"
        .replace(/Pro\s*XS/gi, 'ProXS') // Normalize Pro XS
        .trim();

      // Extract horsepower (look for number patterns)
      const hpMatch = normalized.match(/(\d+(?:\.\d+)?)\s*HP|\b(\d+(?:\.\d+)?)\b/i);
      const hp = hpMatch ? parseFloat(hpMatch[1] || hpMatch[2]) : null;

      // Extract rigging codes (common patterns)
      const riggingMatch = normalized.match(/\b(EXLPT|ELHPT|ELPT|ELH|MRC|MXXL|MXL|MLH|MH|XXL|XL|CT)\b/i);
      const riggingCode = riggingMatch ? riggingMatch[1].toUpperCase() : null;

      // Check for Command Thrust
      const hasCommandThrust = /command\s*thrust|\bCT\b/i.test(normalized);

      // Extract family
      let family: string | null = null;
      if (/verado/i.test(normalized)) {
        family = 'Verado';
      } else if (/pro\s*xs|proxs/i.test(normalized)) {
        family = 'ProXS';
      } else if (/sea\s*pro|seapro/i.test(normalized)) {
        family = 'SeaPro';
      } else if (/four\s*stroke|fourstroke/i.test(normalized)) {
        family = 'FourStroke';
      }

      return { hp, riggingCode, family, hasCommandThrust };
    }

    // Match and update motors from the sheet
    const matchedMotors: string[] = [];
    const unmatchedModels: string[] = [];

    for (const modelName of motorNames) {
      const parsed = parseMotorName(modelName);
      console.log(`🔍 Parsing "${modelName}":`, JSON.stringify(parsed));

      // Build query with multiple criteria for better matching
      let query = supabase
        .from('motor_models')
        .select('id, model_display, horsepower');

      // Apply filters based on what we extracted
      if (parsed.hp !== null) {
        query = query.eq('horsepower', parsed.hp);
      }

      // STRICT MATCHING: If rigging code detected, it MUST match exactly
      if (parsed.riggingCode) {
        query = query.ilike('model_display', `%${parsed.riggingCode}%`);
      }

      if (parsed.family) {
        query = query.ilike('model_display', `%${parsed.family}%`);
      }

      // For Command Thrust, check both "CT" and "Command Thrust"
      if (parsed.hasCommandThrust) {
        query = query.or('model_display.ilike.%Command Thrust%,model_display.ilike.%CT%');
      }

      query = query.limit(1);

      let { data: motors, error: searchError } = await query;

      // ADDITIONAL VALIDATION: If rigging code was detected in sheet, verify exact match
      if (motors && motors.length > 0 && parsed.riggingCode) {
        const motor = motors[0];
        const motorHasRiggingCode = motor.model_display.toUpperCase().includes(parsed.riggingCode);
        
        if (!motorHasRiggingCode) {
          console.log(`⚠️ Rigging code mismatch: "${modelName}" (wants ${parsed.riggingCode}) vs "${motor.model_display}" - skipping`);
          motors = []; // Clear match to prevent false positive
        }
      }

      // Fallback: If no match found with CT filter, retry without CT requirement
      if (parsed.hasCommandThrust && (!motors || motors.length === 0) && !searchError) {
        console.log(`⚠️ No match with CT filter for "${modelName}", retrying without CT...`);
        
        let fallbackQuery = supabase
          .from('motor_models')
          .select('id, model_display, horsepower');

        if (parsed.hp !== null) {
          fallbackQuery = fallbackQuery.eq('horsepower', parsed.hp);
        }

        if (parsed.riggingCode) {
          fallbackQuery = fallbackQuery.ilike('model_display', `%${parsed.riggingCode}%`);
        }

        if (parsed.family) {
          fallbackQuery = fallbackQuery.ilike('model_display', `%${parsed.family}%`);
        }

        fallbackQuery = fallbackQuery.limit(1);

        const fallbackResult = await fallbackQuery;
        motors = fallbackResult.data;
        searchError = fallbackResult.error;
        
        // ADDITIONAL VALIDATION for fallback too
        if (motors && motors.length > 0 && parsed.riggingCode) {
          const motor = motors[0];
          const motorHasRiggingCode = motor.model_display.toUpperCase().includes(parsed.riggingCode);
          
          if (!motorHasRiggingCode) {
            console.log(`⚠️ Fallback rigging code mismatch: "${modelName}" vs "${motor.model_display}" - skipping`);
            motors = [];
          } else {
            console.log(`✅ Fallback match found: "${motors[0].model_display}"`);
          }
        } else if (motors && motors.length > 0) {
          console.log(`✅ Fallback match found: "${motors[0].model_display}"`);
        }
      }

      if (searchError) {
        console.error(`Error searching for ${modelName}:`, searchError);
        unmatchedModels.push(modelName);
        continue;
      }

      if (motors && motors.length > 0) {
        const motor = motors[0];
        
        // Fetch current stock quantity to properly increment
        const { data: currentMotor } = await supabase
          .from('motor_models')
          .select('stock_quantity')
          .eq('id', motor.id)
          .single();

        const newQuantity = (currentMotor?.stock_quantity || 0) + 1;
        
        // Update this motor with incremented stock quantity
        const { error: updateError } = await supabase
          .from('motor_models')
          .update({
            in_stock: true,
            availability: 'In Stock',
            stock_quantity: newQuantity,
            last_stock_check: new Date().toISOString(),
          })
          .eq('id', motor.id);

        if (updateError) {
          console.error(`Error updating ${modelName}:`, updateError);
          unmatchedModels.push(modelName);
        } else {
          matchedMotors.push(motor.model_display);
          console.log(`✅ Matched: ${modelName} → ${motor.model_display} (qty: ${newQuantity})`);
        }
      } else {
        unmatchedModels.push(modelName);
        console.log(`❌ No match found for: ${modelName}`);
      }
    }

    // Update sync log
    await supabase
      .from('sync_logs')
      .insert({
        sync_type: 'google_sheets',
        status: 'completed',
        motors_processed: motorNames.length,
        motors_in_stock: matchedMotors.length,
        details: {
          matched: matchedMotors,
          unmatched: unmatchedModels,
          sheet_url: sheetUrl,
          sheet_gid: sheetGid,
          filter: 'New Mercury Outboard Motors only',
        },
        completed_at: new Date().toISOString(),
      });

    // Update config last sync time
    await supabase
      .from('google_sheets_config')
      .update({ last_sync: new Date().toISOString() })
      .eq('sheet_url', sheetUrl);

    // Send email notification if there are unmatched motors
    if (unmatchedModels.length > 0) {
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      const adminEmail = Deno.env.get('ADMIN_EMAIL');
      
      if (resendApiKey && adminEmail) {
        try {
          const emailHtml = `
            <h2>🔍 Google Sheets Sync - Unmatched Motors Detected</h2>
            <p>The following <strong>${unmatchedModels.length}</strong> new Mercury motor(s) from your Google Sheet could not be matched to motors in the database:</p>
            <ul>
              ${unmatchedModels.map(motor => `<li><strong>${motor}</strong></li>`).join('')}
            </ul>
            <hr />
            <p><strong>Summary:</strong></p>
            <ul>
              <li>New Mercury motors in sheet: ${motorNames.length}</li>
              <li>Successfully matched: ${matchedMotors.length}</li>
              <li>Unmatched: ${unmatchedModels.length}</li>
            </ul>
            <p>Please review these motors and ensure they exist in your motor_models database with the correct model_display names.</p>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">Synced from: ${sheetUrl} (GID: ${sheetGid})</p>
          `;

          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Motor Inventory Sync <system@hbwsales.ca>',
              to: [adminEmail],
              subject: `⚠️ ${unmatchedModels.length} Unmatched Motors in Sync`,
              html: emailHtml,
            }),
          });

          if (response.ok) {
            console.log('✅ Email notification sent successfully to', adminEmail);
          } else {
            const error = await response.text();
            console.error('❌ Failed to send email:', error);
          }
        } catch (emailError) {
          console.error('❌ Error sending email notification:', emailError);
          // Don't fail the sync if email fails
        }
      } else {
        console.log('⚠️ Email notification skipped: Missing RESEND_API_KEY or ADMIN_EMAIL');
      }
    }

    console.log('✅ Sync completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        motorsFound: motorNames.length,
        motorsMatched: matchedMotors.length,
        motorsUnmatched: unmatchedModels.length,
        matched: matchedMotors,
        unmatched: unmatchedModels,
        filter: 'New Mercury Outboard Motors only',
        sheetGid: sheetGid,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Sync error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
