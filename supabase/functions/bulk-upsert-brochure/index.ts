import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { parseMercuryRigCodes, buildMercuryModelKey } from '../_shared/mercury-codes.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

function getSupabaseClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!url || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  
  return createClient(url, serviceKey);
}

// Parse CSV string to array of objects
function parseCSV(csvContent: string): any[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const results: any[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    // Parse CSV row handling quoted values with commas
    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
    
    if (values.length >= headers.length) {
      const row: any = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || '';
      });
      results.push(row);
    }
  }
  
  return results;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  try {
    const body = await req.json();
    const { csv, url, rows } = body;
    
    let parsedRows: any[] = [];
    
    if (csv) {
      // Parse CSV content directly
      parsedRows = parseCSV(csv);
      console.log(`[BulkUpsertBrochure] Parsed ${parsedRows.length} rows from CSV content`);
    } else if (url) {
      // Download CSV from URL
      console.log(`[BulkUpsertBrochure] Downloading CSV from: ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download CSV: ${response.status} ${response.statusText}`);
      }
      const csvContent = await response.text();
      parsedRows = parseCSV(csvContent);
      console.log(`[BulkUpsertBrochure] Parsed ${parsedRows.length} rows from downloaded CSV`);
    } else if (rows && Array.isArray(rows)) {
      // Use provided rows array directly
      parsedRows = rows;
      console.log(`[BulkUpsertBrochure] Using ${parsedRows.length} provided rows`);
    } else {
      return new Response(JSON.stringify({ error: 'Must provide csv, url, or rows' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    if (parsedRows.length === 0) {
      return new Response(JSON.stringify({ 
        rows_parsed: 0, 
        rows_created: 0, 
        rows_updated: 0, 
        rows_skipped: 0,
        message: 'No rows to process'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const supabase = getSupabaseClient();
    const skipReasons: Record<string, number> = {};
    const upsertRows: any[] = [];
    
    // Process each row
    for (const row of parsedRows) {
      try {
        // Extract and validate required fields
        const model = String(row.model || '').trim();
        const family = String(row.family || 'FourStroke').trim();
        const horsepower = row.horsepower ? Number(row.horsepower) : null;
        const fuel_type = String(row.fuel_type || '').trim();
        const rigging_code = String(row.rigging_code || '').trim();
        
        if (!model) {
          skipReasons['missing_model'] = (skipReasons['missing_model'] || 0) + 1;
          continue;
        }

        // Parse Mercury rigging codes using shared system
        const rigInput = `${model} ${rigging_code}`.trim();
        const rig = parseMercuryRigCodes(rigInput);
        
        // Build model key using shared system - NEVER trust incoming model_key
        const calculatedModelKey = buildMercuryModelKey({
          family: family,
          hp: horsepower,
          hasEFI: fuel_type.toLowerCase().includes('efi') || (horsepower && horsepower >= 15),
          rig: rig,
          modelNo: String(row.mercury_model_no || '').trim() || undefined
        });

        if (!calculatedModelKey) {
          skipReasons['invalid_model_key'] = (skipReasons['invalid_model_key'] || 0) + 1;
          continue;
        }

        // Parse numeric fields
        const dealer_price = row.dealer_price ? Number(String(row.dealer_price).replace(/[^0-9.]/g, '')) : null;
        const msrp = row.msrp ? Number(String(row.msrp).replace(/[^0-9.]/g, '')) : null;
        
        // Parse boolean fields
        const has_power_trim = String(row.has_power_trim || 'false').toLowerCase() === 'true';
        const has_command_thrust = String(row.has_command_thrust || 'false').toLowerCase() === 'true';
        
        // Parse source_doc_urls (semicolon separated)
        let source_doc_urls = [];
        if (row.source_doc_urls && String(row.source_doc_urls).trim()) {
          source_doc_urls = String(row.source_doc_urls).split(';').map(u => u.trim()).filter(u => u);
        }

        const upsertRow = {
          make: 'Mercury',
          model: model,
          model_key: calculatedModelKey,
          mercury_model_no: String(row.mercury_model_no || '').trim() || null,
          year: 2025,
          motor_type: family,
          family: family,
          horsepower: horsepower,
          fuel_type: fuel_type || null,
          model_code: String(row.mercury_model_no || '').trim() || null,
          shaft_code: rig.shaft_code,
          shaft_inches: rig.shaft_inches,
          start_type: rig.start_type,
          control_type: rig.control_type,
          has_power_trim: has_power_trim || rig.has_power_trim,
          has_command_thrust: has_command_thrust || rig.has_command_thrust,
          dealer_price: dealer_price,
          msrp: msrp,
          price_source: String(row.price_source || 'csv_import').trim(),
          msrp_calc_source: String(row.msrp_calc_source || 'csv_import').trim(),
          hero_image_url: String(row.hero_image_url || '').trim() || null,
          source_doc_urls: source_doc_urls.length > 0 ? source_doc_urls : null,
          is_brochure: true,
          in_stock: false,
          availability: 'Brochure',
          last_scraped: new Date().toISOString(),
          inventory_source: 'csv_import'
        };

        upsertRows.push(upsertRow);

      } catch (error) {
        console.error(`[BulkUpsertBrochure] Error processing row:`, error);
        skipReasons['processing_error'] = (skipReasons['processing_error'] || 0) + 1;
      }
    }

    console.log(`[BulkUpsertBrochure] Prepared ${upsertRows.length} rows for upsert`);

    if (upsertRows.length === 0) {
      return new Response(JSON.stringify({ 
        rows_parsed: parsedRows.length,
        rows_created: 0, 
        rows_updated: 0, 
        rows_skipped: parsedRows.length,
        top_skip_reasons: skipReasons
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Get existing records to determine creates vs updates
    const existingKeys = upsertRows.map(r => r.model_key);
    const { data: existingRecords } = await supabase
      .from('motor_models')
      .select('model_key')
      .in('model_key', existingKeys)
      .eq('is_brochure', true);

    const existingKeySet = new Set((existingRecords || []).map(r => r.model_key));
    
    // Perform upsert
    const { error: upsertError } = await supabase
      .from('motor_models')
      .upsert(upsertRows, { 
        onConflict: 'model_key',
        ignoreDuplicates: false 
      });

    if (upsertError) {
      console.error('[BulkUpsertBrochure] Upsert error:', upsertError);
      return new Response(JSON.stringify({ error: upsertError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Calculate counts
    const rows_created = upsertRows.filter(r => !existingKeySet.has(r.model_key)).length;
    const rows_updated = upsertRows.filter(r => existingKeySet.has(r.model_key)).length;
    const rows_skipped = parsedRows.length - upsertRows.length;

    console.log(`[BulkUpsertBrochure] Success: ${rows_created} created, ${rows_updated} updated, ${rows_skipped} skipped`);

    return new Response(JSON.stringify({
      success: true,
      rows_parsed: parsedRows.length,
      rows_created: rows_created,
      rows_updated: rows_updated,
      rows_skipped: rows_skipped,
      top_skip_reasons: skipReasons
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('[BulkUpsertBrochure] Unexpected error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to bulk upsert brochure data', 
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});