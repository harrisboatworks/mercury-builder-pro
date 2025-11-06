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

    // Get sheet URL from request or database
    let sheetUrl: string;
    const body = await req.json().catch(() => ({}));
    
    if (body.sheetUrl) {
      sheetUrl = body.sheetUrl;
    } else {
      // Get from database
      const { data: config } = await supabase
        .from('google_sheets_config')
        .select('sheet_url, auto_sync_enabled')
        .single();
      
      if (!config || !config.auto_sync_enabled) {
        return new Response(
          JSON.stringify({ success: false, error: 'Auto-sync is disabled or not configured' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      sheetUrl = config.sheet_url;
    }

    console.log('🔄 Starting Google Sheets sync:', sheetUrl);

    // Convert pubhtml URL to CSV format for direct parsing
    let csvUrl = sheetUrl;
    if (sheetUrl.includes('/pubhtml')) {
      csvUrl = sheetUrl.replace('/pubhtml', '/pub');
      // Replace any existing parameters with output=csv
      if (csvUrl.includes('?')) {
        const baseUrl = csvUrl.split('?')[0];
        const urlParams = new URLSearchParams(csvUrl.split('?')[1]);
        const gid = urlParams.get('gid') || '0';
        csvUrl = `${baseUrl}?gid=${gid}&output=csv`;
      } else {
        csvUrl = `${csvUrl}?output=csv`;
      }
    }

    console.log('📄 Fetching CSV from:', csvUrl);

    // Fetch CSV directly from Google Sheets
    const csvResponse = await fetch(csvUrl);

    if (!csvResponse.ok) {
      throw new Error(`Failed to fetch Google Sheet: ${csvResponse.statusText}`);
    }

    const csvText = await csvResponse.text();
    console.log('📄 CSV content length:', csvText.length);

    // Parse CSV to extract motor names from Column B (index 1)
    const lines = csvText.split('\n');
    const motorNames: string[] = [];

    for (let i = 1; i < lines.length; i++) { // Skip header row (i=0)
      if (!lines[i].trim()) continue; // Skip empty lines
      
      // Split by comma, handle quoted values
      const columns = lines[i].split(',').map(col => col.trim().replace(/^["']|["']$/g, ''));
      const modelName = columns[1]; // Column B has the motor model names
      
      // Filter out years, empty values, and non-motor entries
      if (modelName && modelName.length > 2 && !modelName.match(/^\d{4}$/) && modelName !== 'Model') {
        motorNames.push(modelName);
      }
    }

    console.log('📋 Extracted motor names:', motorNames.length, motorNames.slice(0, 5));

    // Reset all motors to out of stock first
    const { error: resetError } = await supabase
      .from('motor_models')
      .update({
        in_stock: false,
        availability: 'Brochure',
        stock_quantity: 0,
      })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all

    if (resetError) {
      console.error('Error resetting stock:', resetError);
    }

    // Match and update motors from the sheet
    const matchedMotors: string[] = [];
    const unmatchedModels: string[] = [];

    for (const modelName of motorNames) {
      // Try to match by model_display (case-insensitive, partial match)
      const { data: motors, error: searchError } = await supabase
        .from('motor_models')
        .select('id, model_display')
        .ilike('model_display', `%${modelName}%`)
        .limit(1);

      if (searchError) {
        console.error(`Error searching for ${modelName}:`, searchError);
        unmatchedModels.push(modelName);
        continue;
      }

      if (motors && motors.length > 0) {
        const motor = motors[0];
        
        // Update this motor to in stock
        const { error: updateError } = await supabase
          .from('motor_models')
          .update({
            in_stock: true,
            availability: 'In Stock',
            stock_quantity: 1,
            last_stock_check: new Date().toISOString(),
          })
          .eq('id', motor.id);

        if (updateError) {
          console.error(`Error updating ${modelName}:`, updateError);
          unmatchedModels.push(modelName);
        } else {
          matchedMotors.push(motor.model_display);
          console.log(`✅ Matched: ${modelName} → ${motor.model_display}`);
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
        },
        completed_at: new Date().toISOString(),
      });

    // Update config last sync time
    await supabase
      .from('google_sheets_config')
      .update({ last_sync: new Date().toISOString() })
      .eq('sheet_url', sheetUrl);

    console.log('✅ Sync completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        motorsFound: motorNames.length,
        motorsMatched: matchedMotors.length,
        motorsUnmatched: unmatchedModels.length,
        matched: matchedMotors,
        unmatched: unmatchedModels,
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
