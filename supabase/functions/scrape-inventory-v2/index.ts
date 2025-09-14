import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 NEW FUNCTION v2: Full scraping started');
    const startTime = Date.now();
    
    const body = await req.json().catch(() => ({}));
    const { source = 'html', trigger = 'manual', useXmlFeed = false } = body;
    
    console.log(`📊 NEW v2 - Params: source=${source}, trigger=${trigger}, useXmlFeed=${useXmlFeed}`);

    const summary = {
      source: 'html',
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
    };

    if (source === 'html') {
      // Harris Boat Works HTML scraping
      const baseUrl = 'https://www.harrisboatworks.ca/search/inventory/type/Outboard%20Motors/usage/New/sort/price-low';
      let currentPage = 1;
      let hasMorePages = true;
      const allMotors = [];

      console.log('🔍 Starting Harris Boat Works HTML scraping...');
      
      // DEBUG: Test basic connectivity first
      console.log("🔬 DEBUG: About to fetch from harrisboatworks.ca");
      try {
        const testFetch = await fetch("https://www.harrisboatworks.ca/search/inventory/type/Outboard%20Motors/usage/New/sort/price-low?resultsperpage=200");
        console.log("🔬 DEBUG: Response status:", testFetch.status);
        console.log("🔬 DEBUG: Response headers:", Object.fromEntries(testFetch.headers.entries()));
        
        if (testFetch.ok) {
          const testHtml = await testFetch.text();
          console.log("🔬 DEBUG: HTML length:", testHtml.length);
          console.log("🔬 DEBUG: Contains 'mercury':", testHtml.toLowerCase().includes('mercury'));
          console.log("🔬 DEBUG: Contains 'panel':", testHtml.includes('panel'));
          console.log("🔬 DEBUG: Contains 'search-result':", testHtml.includes('search-result'));
          
          // Check for specific patterns
          const panelCount = (testHtml.match(/class="[^"]*panel[^"]*search-result/g) || []).length;
          console.log("🔬 DEBUG: Found panel.search-result elements:", panelCount);
          
          // Sample of HTML structure
          const firstPanelMatch = testHtml.match(/<div[^>]*class="[^"]*panel[^"]*search-result[^"]*"[^>]*>.*?<\/div>/s);
          if (firstPanelMatch) {
            console.log("🔬 DEBUG: First panel HTML sample (first 500 chars):", firstPanelMatch[0].substring(0, 500));
          } else {
            console.log("🔬 DEBUG: No panel elements found with regex");
          }
          
        } else {
          console.log("🔬 DEBUG: Fetch failed with status:", testFetch.status);
          const errorText = await testFetch.text();
          console.log("🔬 DEBUG: Error response:", errorText.substring(0, 1000));
        }
      } catch (debugError) {
        console.error("🔬 DEBUG: Fetch error:", debugError);
      }

      while (hasMorePages && currentPage <= 5) { // Limit to 5 pages to prevent timeout
        const pageUrl = currentPage === 1 ? baseUrl : `${baseUrl}/page/${currentPage}`;
        console.log(`📄 Scraping page ${currentPage}: ${pageUrl}`);

        try {
          const response = await fetch(pageUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });

          if (!response.ok) {
            console.error(`❌ Failed to fetch page ${currentPage}: ${response.status}`);
            break;
          }

          const html = await response.text();
          summary.pages_scraped++;

          // Parse HTML using regex patterns
          const motorPanelRegex = /<div[^>]*class="[^"]*panel[^"]*search-result[^"]*"[^>]*>(.*?)<\/div>(?=\s*<div[^>]*class="[^"]*panel[^"]*search-result|<\/div>\s*<\/div>)/gs;
          const motorPanels = [...html.matchAll(motorPanelRegex)];

          console.log(`🎯 Found ${motorPanels.length} motor panels on page ${currentPage}`);

          for (const panel of motorPanels) {
            const panelHtml = panel[1];
            
            // Extract motor details using regex
            const titleMatch = panelHtml.match(/<h4[^>]*class="[^"]*panel-title[^"]*"[^>]*>.*?<a[^>]*>(.*?)<\/a>/s);
            const priceMatch = panelHtml.match(/<span[^>]*class="[^"]*price[^"]*"[^>]*>.*?\$([0-9,]+)/s);
            const availabilityMatch = panelHtml.match(/<li[^>]*class="[^"]*availability[^"]*"[^>]*>(.*?)<\/li>/s);
            const stockMatch = panelHtml.match(/Stock\s*#:\s*([^<\s]+)/i);

            if (titleMatch) {
              const fullTitle = titleMatch[1].replace(/<[^>]*>/g, '').trim();
              const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : null;
              const availability = availabilityMatch ? availabilityMatch[1].replace(/<[^>]*>/g, '').trim() : '';
              const stockNumber = stockMatch ? stockMatch[1].trim() : null;

              // Parse model and horsepower from title
              const hpMatch = fullTitle.match(/(\d+)\s*HP/i);
              const horsepower = hpMatch ? parseInt(hpMatch[1]) : null;

              // Extract model (everything before HP or clean up title)
              let model = fullTitle;
              if (hpMatch) {
                model = fullTitle.substring(0, fullTitle.toLowerCase().indexOf(hpMatch[0].toLowerCase())).trim();
              }

              // Clean up model name
              model = model.replace(/^(Mercury|Yamaha|Honda|Suzuki)\s*/i, '').trim();
              model = model.replace(/\s+/g, ' ').trim();

              // Determine availability status
              let availabilityStatus = 'brochure'; // default
              if (availability.toLowerCase().includes('in stock') || availability.toLowerCase().includes('available')) {
                availabilityStatus = 'in_stock';
              } else if (availability.toLowerCase().includes('sold') || availability.toLowerCase().includes('unavailable')) {
                availabilityStatus = 'sold';
              }

              const motor = {
                model,
                horsepower,
                base_price: price,
                sale_price: price,
                availability: availabilityStatus,
                stock_number: stockNumber,
                brand: 'Mercury', // Default for Harris Boat Works
                source_url: pageUrl,
                last_scraped: new Date().toISOString()
              };

              // Filter out invalid motors
              if (motor.model && motor.model.length > 1 && motor.horsepower && motor.horsepower > 0) {
                allMotors.push(motor);
                console.log(`✅ Found motor: ${motor.model} ${motor.horsepower}HP - ${motor.availability}`);
              }
            }
          }

          // Check for next page
          const nextPageRegex = /<a[^>]*class="[^"]*next[^"]*"[^>]*href="[^"]*"/i;
          hasMorePages = nextPageRegex.test(html) && motorPanels.length > 0;
          
          currentPage++;
          
          // Add delay between requests
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (pageError) {
          console.error(`❌ Error scraping page ${currentPage}:`, pageError);
          summary.errors_count++;
          break;
        }
      }

      summary.motors_found = allMotors.length;
      console.log(`🎯 NEW v2 - Found ${allMotors.length} total motors from ${summary.pages_scraped} pages`);

      // Insert motors into database
      if (allMotors.length > 0) {
        try {
          for (const motor of allMotors) {
            // Check if motor exists
            const { data: existing } = await supabase
              .from('motor_models')
              .select('id')
              .eq('model', motor.model)
              .eq('horsepower', motor.horsepower)
              .eq('brand', motor.brand)
              .single();

            if (existing) {
              // Update existing
              const { error } = await supabase
                .from('motor_models')
                .update({
                  base_price: motor.base_price,
                  sale_price: motor.sale_price,
                  availability: motor.availability,
                  stock_number: motor.stock_number,
                  last_scraped: motor.last_scraped,
                  source_url: motor.source_url
                })
                .eq('id', existing.id);

              if (!error) {
                summary.motors_hydrated++;
              }
            } else {
              // Insert new
              const { error } = await supabase
                .from('motor_models')
                .insert(motor);

              if (!error) {
                summary.motors_inserted++;
              }
            }
          }

          // Count by availability
          summary.in_stock_models_found = allMotors.filter(m => m.availability === 'in_stock').length;
          summary.brochure_models_found = allMotors.filter(m => m.availability === 'brochure').length;
          
          console.log(`💾 NEW v2 - Database: ${summary.motors_inserted} inserted, ${summary.motors_hydrated} updated`);
          
        } catch (dbError) {
          console.error('❌ Database error:', dbError);
          summary.errors_count++;
        }
      }
    }

    const endTime = Date.now();
    summary.duration_seconds = ((endTime - startTime) / 1000).toFixed(2);
    summary.validation_passed = summary.errors_count === 0;

    const response = {
      success: true,
      message: `NEW v2 - Found ${summary.motors_found} Mercury motors using ${source.toUpperCase()} source`,
      timestamp: new Date().toISOString(),
      summary
    };

    console.log('✅ NEW v2 - Scraping completed:', JSON.stringify(summary, null, 2));
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ NEW v2 - Function error:', error);
    
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