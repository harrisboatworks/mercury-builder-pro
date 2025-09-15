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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const source = url.searchParams.get('source') || 'html';
    const page = parseInt(url.searchParams.get('page') ?? '1');
    const startTime = Date.now();

    console.log(`🚀 Starting scrape-inventory-v2 function`);
    console.log(`- Source: ${source}`);
    console.log(`- Page: ${page}`);

    // Test endpoints
    if (url.pathname.includes('/test')) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Function is working",
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (url.pathname.includes('/test-scrape')) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Test scrape endpoint working",
          motors_found: 0,
          test_mode: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize summary
    const summary = {
      motors_found: 0,
      motors_inserted: 0,
      motors_failed: 0,
      has_more_pages: false,
      in_stock_models_found: 0,
      brochure_models_found: 0,
      pages_scraped: 1,
      duration_seconds: '0.00',
      errors_count: 0,
      validation_passed: true,
      timestamp: new Date().toISOString()
    };

    if (source === 'html') {
      console.log(`🔍 Testing fetch to Harris Boat Works...`);
      
      try {
        const response = await fetch('https://www.harrisboatworks.ca/search/inventory/type/Outboard%20Motors/usage/New/sort/price-low');
        const text = await response.text();
        
        console.log(`✅ Fetch successful - HTML length: ${text.length} characters`);
        
        // Parse HTML for debugging
        const doc = new DOMParser().parseFromString(text, 'text/html');
        
        // Test different selectors to find what exists
        const selectors = [
          '.panel.search-result',
          '.search-result',
          '.panel',
          '.inventory-item',
          '.motor-item',
          '.product-item',
          'div[class*="result"]',
          'div[class*="motor"]',
          'div[class*="product"]',
          'div[class*="inventory"]',
          '.listing',
          '.item',
          '[data-inventory]',
          '.vehicle',
          '.unit'
        ];

        const selectorResults = {};
        for (const selector of selectors) {
          const elements = doc.querySelectorAll(selector);
          if (elements.length > 0) {
            selectorResults[selector] = elements.length;
            console.log(`🎯 Found ${elements.length} elements with selector: ${selector}`);
          }
        }

        // Get sample class names from divs
        const allDivs = doc.querySelectorAll('div[class]');
        const sampleClasses = Array.from(allDivs)
          .slice(0, 20)
          .map(div => div.className)
          .filter(className => className.length > 0);

        // Look for any elements that might contain motor data
        const potentialMotorElements = doc.querySelectorAll('div, article, section');
        const elementsWithText = Array.from(potentialMotorElements)
          .filter(el => el.textContent?.toLowerCase().includes('mercury') || 
                       el.textContent?.toLowerCase().includes('hp') ||
                       el.textContent?.toLowerCase().includes('outboard'))
          .slice(0, 5)
          .map(el => ({
            tagName: el.tagName,
            className: el.className,
            textSnippet: el.textContent?.substring(0, 100)
          }));

        console.log('🔧 Debugging results:', {
          selectorResults,
          totalDivs: allDivs.length,
          sampleClasses: sampleClasses.slice(0, 10),
          elementsWithMotorText: elementsWithText.length
        });
        
        summary.motors_found = Object.keys(selectorResults).length;
        summary.motors_inserted = 0;
        
        // Add debugging info to summary
        summary.debug_info = {
          html_length: text.length,
          selector_results: selectorResults,
          sample_classes: sampleClasses.slice(0, 10),
          total_divs: allDivs.length,
          elements_with_motor_text: elementsWithText
        };
        
      } catch (fetchError) {
        console.error('❌ Error fetching page:', fetchError);
        summary.errors_count++;
        throw fetchError;
      }
    }

    // Calculate final metrics
    const endTime = Date.now();
    summary.duration_seconds = ((endTime - startTime) / 1000).toFixed(2);
    summary.validation_passed = summary.errors_count === 0;

    const response = {
      success: true,
      data: {
        page: page,
        hasMore: summary.has_more_pages || false,
        motors_found: summary.motors_found,
        motors_saved: summary.motors_inserted,
        motors_failed: summary.errors_count,
        errors: summary.errors_count > 0 ? ['Check function logs for detailed error information'] : [],
        summary: summary
      }
    };

    console.log('✅ Scraping completed successfully:', JSON.stringify(summary, null, 2));
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Critical error in scrape-inventory-v2:', error);
    
    const errorResponse = {
      success: false,
      error: {
        name: error.name,
        message: error.message,
        timestamp: new Date().toISOString()
      },
      data: {
        motors_found: 0,
        motors_saved: 0,
        motors_failed: 1,
        errors: [error.message || 'Unknown error']
      }
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});