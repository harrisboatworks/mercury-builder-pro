import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
      // Harris Boat Works HTML scraping
      const baseUrl = 'https://www.harrisboatworks.ca/search/inventory/type/Outboard%20Motors/usage/New/sort/price-low';
      const allMotors = [];
      const parser = new DOMParser();

      console.log(`🔍 Starting Harris Boat Works HTML scraping - Page ${page}`);

      const pageUrl = page === 1 
        ? baseUrl 
        : `${baseUrl}/page/${page}`;

      console.log(`📄 Fetching page: ${pageUrl}`);

      try {
        const response = await fetch(pageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();
        console.log(`📄 Page content length: ${html.length} characters`);

        // Check for bot protection
        if (html.includes('blocked') || html.includes('bot') || html.includes('cloudflare')) {
          console.log('🚫 Possible bot protection detected');
        }

        const doc = parser.parseFromString(html, 'text/html');
        
        // Try multiple selectors for motor elements
        const selectors = [
          '.product-item',
          '.inventory-item', 
          '.motor-listing',
          '[data-product-id]',
          '.listing-item'
        ];

        let motorElements: Element[] = [];
        for (const selector of selectors) {
          motorElements = Array.from(doc.querySelectorAll(selector));
          if (motorElements.length > 0) {
            console.log(`✅ Found ${motorElements.length} motors using selector: ${selector}`);
            break;
          }
        }

        if (motorElements.length === 0) {
          console.log('⚠️ No motor elements found with any selector');
          console.log('📄 Sample HTML snippet:', html.substring(0, 500));
        }

        // Extract motor data
        for (let i = 0; i < motorElements.length; i++) {
          const element = motorElements[i];
          try {
            const motor: any = {};

            // Extract title
            const titleSelectors = ['h3', 'h2', '.title', '.product-title', '.name'];
            for (const selector of titleSelectors) {
              const titleEl = element.querySelector(selector);
              if (titleEl?.textContent?.trim()) {
                motor.title = titleEl.textContent.trim();
                break;
              }
            }

            // Extract prices
            const priceSelectors = ['.price', '.cost', '.amount', '[data-price]'];
            for (const selector of priceSelectors) {
              const priceEl = element.querySelector(selector);
              if (priceEl?.textContent) {
                const priceText = priceEl.textContent.replace(/[^\d,.-]/g, '');
                const priceNum = parseFloat(priceText.replace(/,/g, ''));
                if (!isNaN(priceNum)) {
                  motor.price_msrp = priceNum;
                  motor.price_sale = priceNum;
                  break;
                }
              }
            }

            // Extract availability
            const availabilitySelectors = ['.status', '.availability', '.stock-status'];
            for (const selector of availabilitySelectors) {
              const statusEl = element.querySelector(selector);
              if (statusEl?.textContent?.trim()) {
                const statusText = statusEl.textContent.trim();
                motor.availability = statusText.includes('Stock') ? 'In Stock' : 'Brochure';
                break;
              }
            }

            // Extract image URL
            const img = element.querySelector('img');
            if (img) {
              motor.image_url = img.src || img.getAttribute('data-src');
            }

            // Extract detail URL
            const link = element.querySelector('a');
            if (link?.href) {
              motor.detail_url = link.href.startsWith('http') ? link.href : `https://www.harrisboatworks.ca${link.href}`;
            }

            // Extract horsepower from title
            if (motor.title) {
              const hpMatch = motor.title.match(/(\d+(?:\.\d+)?)\s*HP/i);
              if (hpMatch) {
                motor.horsepower = parseFloat(hpMatch[1]);
              }
            }

            // Set defaults
            motor.make = 'Mercury';
            motor.motor_type = 'Outboard';
            motor.stock_number = `harris-${i + 1}-page-${page}`;
            motor.model = motor.title?.split(' ')[0] || 'Unknown';

            if (motor.title && motor.price_msrp) {
              allMotors.push(motor);
              console.log(`✅ Motor ${i + 1}: ${motor.title} - $${motor.price_msrp}`);
            }

          } catch (error) {
            console.error(`❌ Error extracting motor ${i + 1}:`, error);
            summary.errors_count++;
          }
        }

        summary.motors_found = allMotors.length;
        console.log(`📊 Total motors found: ${allMotors.length}`);

        // Save to database
        if (allMotors.length > 0) {
          try {
            console.log(`💾 Saving ${allMotors.length} motors to database...`);
            const results = await saveMotorsBatch(allMotors, supabase);
            
            summary.motors_inserted = results.inserted;
            summary.motors_failed = results.failed.length;
            summary.errors_count += results.failed.length;
            
            console.log(`💾 Database operations complete: ${summary.motors_inserted} inserted, ${results.failed.length} failed`);
            
          } catch (dbError) {
            console.error('❌ Database error:', dbError);
            summary.errors_count++;
            throw dbError;
          }
          
          // Final counts
          summary.in_stock_models_found = allMotors.filter(m => m.availability === 'In Stock').length;
          summary.brochure_models_found = allMotors.filter(m => m.availability === 'Brochure').length;
        } else {
          console.log('⚠️ No motors found to save to database');
        }

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