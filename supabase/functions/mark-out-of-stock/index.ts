import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Lazy initialize Supabase client
async function getServiceClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!url || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  return createClient(url, serviceKey);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { model_keys, all_brochure_models = false } = await req.json();
    const supabase = await getServiceClient();

    if (all_brochure_models) {
      // Mark all brochure models as out of stock (safety operation for inventory updates)
      const { data, error } = await supabase
        .from('motor_models')
        .update({ 
          in_stock: false,
          availability: 'Out of Stock',
          last_scraped: new Date().toISOString()
        })
        .eq('is_brochure', true)
        .eq('in_stock', true);

      if (error) throw error;

      console.log('Marked all brochure models as out of stock for inventory refresh');
      
      return new Response(JSON.stringify({
        success: true,
        action: 'mark_all_brochure_out_of_stock',
        message: 'All brochure models marked as out of stock'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!model_keys || !Array.isArray(model_keys)) {
      throw new Error('model_keys must be provided as an array');
    }

    // Mark specific models as out of stock by model_key
    const { data, error } = await supabase
      .from('motor_models')
      .update({ 
        in_stock: false,
        availability: 'Out of Stock',
        last_scraped: new Date().toISOString()
      })
      .in('model_key', model_keys);

    if (error) throw error;

    console.log(`Marked ${model_keys.length} models as out of stock:`, model_keys);

    return new Response(JSON.stringify({
      success: true,
      action: 'mark_specific_out_of_stock',
      marked_out_of_stock: model_keys.length,
      model_keys
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error marking models out of stock:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});