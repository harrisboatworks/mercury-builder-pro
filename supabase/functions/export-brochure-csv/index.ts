import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

// Convert array of objects to CSV string
function arrayToCSV(data: any[]): string {
  if (!data.length) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return String(value);
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseClient();
    
    console.log('[ExportBrochureCSV] Fetching brochure data...');
    
    // Fetch all brochure rows with all the Mercury rigging attributes
    const { data: brochureData, error } = await supabase
      .from('motor_models')
      .select(`
        model,
        model_key,
        family,
        horsepower,
        fuel_type,
        model_code,
        shaft_code,
        shaft_inches,
        start_type,
        control_type,
        has_power_trim,
        has_command_thrust,
        mercury_model_no,
        dealer_price,
        msrp,
        price_source,
        msrp_calc_source,
        hero_image_url,
        source_doc_urls,
        created_at,
        updated_at
      `)
      .eq('is_brochure', true)
      .order('family', { ascending: true })
      .order('horsepower', { ascending: true })
      .order('model_key', { ascending: true });

    if (error) {
      console.error('[ExportBrochureCSV] Database error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    console.log(`[ExportBrochureCSV] Found ${brochureData?.length || 0} brochure rows`);

    if (!brochureData || brochureData.length === 0) {
      return new Response('model,model_key,family,horsepower,fuel_type,rigging_code,shaft_code,shaft_inches,start_type,control_type,has_power_trim,has_command_thrust,mercury_model_no,dealer_price,msrp,price_source,msrp_calc_source,hero_image_url,source_doc_urls\n', {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="brochure-catalog.csv"',
          ...corsHeaders
        }
      });
    }

    // Transform data for CSV export
    const csvData = brochureData.map(row => ({
      model: row.model || '',
      model_key: row.model_key || '',
      family: row.family || '',
      horsepower: row.horsepower || '',
      fuel_type: row.fuel_type || '',
      rigging_code: row.model_code || '',
      shaft_code: row.shaft_code || '',
      shaft_inches: row.shaft_inches || '',
      start_type: row.start_type || '',
      control_type: row.control_type || '',
      has_power_trim: row.has_power_trim || false,
      has_command_thrust: row.has_command_thrust || false,
      mercury_model_no: row.mercury_model_no || '',
      dealer_price: row.dealer_price || '',
      msrp: row.msrp || '',
      price_source: row.price_source || '',
      msrp_calc_source: row.msrp_calc_source || '',
      hero_image_url: row.hero_image_url || '',
      source_doc_urls: Array.isArray(row.source_doc_urls) ? row.source_doc_urls.join(';') : ''
    }));

    const csvContent = arrayToCSV(csvData);
    const timestamp = new Date().toISOString().split('T')[0];
    
    console.log(`[ExportBrochureCSV] Generated CSV with ${csvData.length} rows`);

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="brochure-catalog-${timestamp}.csv"`,
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('[ExportBrochureCSV] Unexpected error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to export brochure CSV', 
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});