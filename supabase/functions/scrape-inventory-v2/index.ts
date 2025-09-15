import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.45/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to validate and fix motor data
function validateAndFixMotor(motor: any) {
  return {
    title: motor.title || 'Unknown Motor',
    price_msrp: motor.price_msrp || null,
    price_sale: motor.price_sale || null,
    availability: motor.availability || 'Unknown',
    image_url: motor.image_url || null,
    detail_url: motor.detail_url || null,
    stock_number: motor.stock_number || null,
    horsepower: motor.horsepower || null,
    model: motor.model || null,
    make: motor.make || 'Mercury',
    motor_type: motor.motor_type || 'Outboard',
    source: 'harris-boat-works',
    last_scraped: new Date().toISOString()
  };
}

// Helper function to save motors in batches
async function saveMotorsBatch(motors: any[], supabase: any) {
  const results = { inserted: 0, failed: [] as any[] };
  
  for (const motor of motors) {
    try {
      const validatedMotor = validateAndFixMotor(motor);
      const { error } = await supabase
        .from('motor_models')
        .upsert(validatedMotor, { 
          onConflict: 'stock_number',
          ignoreDuplicates: false 
        });
      
      if (error) {
        console.error('Database error for motor:', validatedMotor.title, error);
        results.failed.push({ motor: validatedMotor, error: error.message });
      } else {
        results.inserted++;
      }
    } catch (err) {
      console.error('Validation error for motor:', motor.title, err);
      results.failed.push({ motor, error: err.message });
    }
  }
  
  return results;
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  try {
    // Test 1: Can we even respond?
    console.log('Function started');
    
    // Test 2: Can we fetch?
    const response = await fetch('https://www.harrisboatworks.ca/robots.txt');
    const robotsTxt = await response.text();
    
    return new Response(
      JSON.stringify({ 
        test: 'basic',
        robots_fetched: robotsTxt.length > 0,
        robots_length: robotsTxt.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error.message,
        type: 'fetch_failed'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});