import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

// SIMPLIFIED TEST VERSION - Debug deployment issues
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 SIMPLIFIED v2: Function started successfully');
    
    const body = await req.json().catch(() => ({}));
    const { source = 'html', trigger = 'manual' } = body;
    
    console.log(`📊 Request params: source=${source}, trigger=${trigger}`);

    // Test basic functionality first
    const testResponse = {
      success: true,
      message: "SIMPLIFIED v2 function is working!",
      timestamp: new Date().toISOString(),
      params: { source, trigger },
      summary: {
        source: 'test',
        motors_found: 0,
        motors_hydrated: 0,
        motors_inserted: 0,
        brochure_models_found: 0,
        in_stock_models_found: 0,
        pages_scraped: 0,
        duration_seconds: '0.00',
        errors_count: 0,
        validation_passed: true,
        timestamp: new Date().toISOString()
      }
    };

    console.log('✅ Returning test response');
    
    return new Response(JSON.stringify(testResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Function error:', error);
    
    const errorResponse = {
      success: false,
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString(),
      summary: {
        source: 'error',
        motors_found: 0,
        motors_hydrated: 0,
        motors_inserted: 0,
        brochure_models_found: 0,
        in_stock_models_found: 0,
        pages_scraped: 0,
        duration_seconds: '0.00',
        errors_count: 1,
        validation_passed: false,
        timestamp: new Date().toISOString()
      }
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});