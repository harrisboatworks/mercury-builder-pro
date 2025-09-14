import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

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
    console.log('🚀 CORRECT FUNCTION v2: Full DOM scraping started');
    const startTime = Date.now();
    
    const body = await req.json().catch(() => ({}));
    const { source = 'html', trigger = 'manual', useXmlFeed = false } = body;
    
    console.log(`📊 CORRECT v2 - Params: source=${source}, trigger=${trigger}, useXmlFeed=${useXmlFeed}`);

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
      // Harris Boat Works HTML scraping with DOM Parser
      const baseUrl = 'https://www.harrisboatworks.ca/search/inventory/type/Outboard%20Motors/usage/New/sort/price-low';
      let currentPage = 1;
      let hasMorePages = true;
      const allMotors = [];
      const parser = new DOMParser();

      console.log('🔍 Starting Harris Boat Works HTML scraping with DOMParser...');

      while (hasMorePages && currentPage <= 5) { // Limit to 5 pages to prevent timeout
        const pageUrl = currentPage === 1 
          ? `${baseUrl}?resultsperpage=200`
          : `${baseUrl}/page/${currentPage}?resultsperpage=200`;
          
        console.log(`📄 Scraping page ${currentPage}: ${pageUrl}`);

        try {
          const response = await fetch(pageUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
              'Accept-Encoding': 'gzip, deflate, br',
              'DNT': '1',
              'Connection': 'keep-alive',
              'Upgrade-Insecure-Requests': '1'
            }
          });

          if (!response.ok) {
            console.error(`❌ Failed to fetch page ${currentPage}: ${response.status}`);
            break;
          }

          const html = await response.text();
          console.log(`📄 Page ${currentPage} HTML length: ${html.length}`);
          
          // DEBUG: Log what we actually received
          console.log(`📄 First 2000 chars of HTML: ${html.substring(0, 2000)}`);
          
          // Check if we're being blocked
          if (html.includes('cloudflare') || html.includes('captcha') || html.includes('Just a moment') || 
              html.includes('Checking your browser') || html.includes('DDoS protection')) {
            console.error('⚠️ Possible bot protection detected');
          }
          
          // Check for common error pages
          if (html.includes('404') || html.includes('Not Found') || html.includes('Access Denied')) {
            console.error('⚠️ Possible 404 or access denied page');
          }
          
          const doc = parser.parseFromString(html, 'text/html');
          if (!doc) {
            console.error(`❌ Failed to parse HTML for page ${currentPage}`);
            break;
          }

          // DEBUG: Check what HTML structure we actually have
          const allDivs = doc.querySelectorAll('div[class]');
          console.log(`📊 Total divs with classes: ${allDivs.length}`);
          
          // Log first 10 class names to understand structure
          const sampleClasses = Array.from(allDivs).slice(0, 10).map(d => d.className);
          console.log(`📊 Sample classes: ${JSON.stringify(sampleClasses)}`);
          
          // Check for common inventory-related class patterns
          const inventoryPatterns = ['inventory', 'product', 'item', 'result', 'motor', 'panel', 'card', 'listing'];
          const matchingElements = inventoryPatterns.map(pattern => {
            const elements = doc.querySelectorAll(`[class*="${pattern}"]`);
            return { pattern, count: elements.length };
          });
          console.log(`📊 Inventory-related elements: ${JSON.stringify(matchingElements)}`);
          
          // Check page title and main content
          const title = doc.querySelector('title')?.textContent || '';
          console.log(`📄 Page title: "${title}"`);
          
          // Look for any text that mentions motors or Mercury
          const bodyText = doc.body?.textContent || '';
          const hasMotorText = bodyText.toLowerCase().includes('motor') || bodyText.toLowerCase().includes('mercury');
          console.log(`🔍 Page contains motor/mercury text: ${hasMotorText}`);
          
          if (hasMotorText) {
            // Find text snippets around "motor" or "mercury"
            const motorMatches = bodyText.match(/.{0,50}(motor|mercury).{0,50}/gi) || [];
            console.log(`🔍 Motor text samples: ${JSON.stringify(motorMatches.slice(0, 3))}`);
          }

          // DEBUG: First let's understand the HTML structure
          if (currentPage === 1) {
            console.log(`🔍 DEBUG: Analyzing HTML structure on first page...`);
            const allDivs = doc.querySelectorAll('div');
            console.log(`📋 Total div elements found: ${allDivs.length}`);
            
            // Look for common inventory patterns
            const potentialMotorContainers = doc.querySelectorAll('[class*="result"], [class*="item"], [class*="product"], [class*="panel"], [class*="card"]');
            console.log(`🎯 Potential motor containers: ${potentialMotorContainers.length}`);
            
            // Log first few container classes
            for (let i = 0; i < Math.min(5, potentialMotorContainers.length); i++) {
              const container = potentialMotorContainers[i];
              console.log(`📦 Container ${i + 1} classes: "${container.className}"`);
              const textSample = container.textContent?.substring(0, 100) || '';
              console.log(`📝 Text sample: "${textSample}"`);
            }
          }
          
          // Try multiple selector strategies
          let motorElements = doc.querySelectorAll('.panel.search-result');
          console.log(`🎯 Strategy 1 (.panel.search-result): ${motorElements.length} elements`);
          
          if (motorElements.length === 0) {
            motorElements = doc.querySelectorAll('.search-result');
            console.log(`🎯 Strategy 2 (.search-result): ${motorElements.length} elements`);
          }
          
          if (motorElements.length === 0) {
            motorElements = doc.querySelectorAll('[class*="search-result"]');
            console.log(`🎯 Strategy 3 ([class*="search-result"]): ${motorElements.length} elements`);
          }
          
          if (motorElements.length === 0) {
            motorElements = doc.querySelectorAll('.panel');
            console.log(`🎯 Strategy 4 (.panel): ${motorElements.length} elements`);
          }
          
          if (motorElements.length === 0) {
            motorElements = doc.querySelectorAll('[class*="item"], [class*="product"]');
            console.log(`🎯 Strategy 5 (item/product patterns): ${motorElements.length} elements`);
          }

          if (motorElements.length === 0) {
            console.log(`📋 No motors found on page ${currentPage} with any selector strategy, ending pagination`);
            hasMorePages = false;
            break;
          }

          summary.pages_scraped++;

          for (let i = 0; i < motorElements.length; i++) {
            const motorElement = motorElements[i];
            
            try {
              // DEBUG: Log motor element structure for first few motors
              if (currentPage === 1 && i < 3) {
                console.log(`🔍 DEBUG Motor ${i + 1} HTML sample:`, motorElement.outerHTML.substring(0, 500));
                const allLinks = motorElement.querySelectorAll('a');
                console.log(`🔗 Links found in motor ${i + 1}: ${allLinks.length}`);
                allLinks.forEach((link, idx) => {
                  console.log(`  Link ${idx + 1}: "${link.textContent?.trim()}" (href: ${link.href})`);
                });
              }
              
              // Try multiple selector strategies for title
              let titleElement = motorElement.querySelector('h4.panel-title a, .panel-title a');
              if (!titleElement) titleElement = motorElement.querySelector('h4 a, h3 a, h2 a');
              if (!titleElement) titleElement = motorElement.querySelector('.title a, [class*="title"] a');
              if (!titleElement) titleElement = motorElement.querySelector('a[href*="detail"], a[href*="inventory"]');
              if (!titleElement) titleElement = motorElement.querySelector('a');
              
              if (!titleElement) {
                console.log(`⚠️ No title element found for motor ${i + 1} on page ${currentPage}`);
                if (currentPage === 1 && i < 3) {
                  console.log(`🔍 Available text content:`, motorElement.textContent?.substring(0, 200));
                }
                continue;
              }
              
              const fullTitle = titleElement.textContent?.trim() || '';
              if (!fullTitle) {
                console.log(`⚠️ Empty title for motor ${i + 1} on page ${currentPage}`);
                continue;
              }

              console.log(`🔍 Processing: ${fullTitle}`);

              // Extract price
              const priceElement = motorElement.querySelector('.price, .panel-price, [class*="price"]');
              const priceText = priceElement?.textContent?.trim() || '';
              const priceMatch = priceText.match(/\$([0-9,]+)/);
              const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : null;

              // Extract availability text
              const availabilityElement = motorElement.querySelector('.availability, .stock-status, [class*="availability"], [class*="stock"]');
              let availability = availabilityElement?.textContent?.trim() || '';
              
              // Also check for availability in list items
              if (!availability) {
                const liElements = motorElement.querySelectorAll('li');
                for (const li of liElements) {
                  const liText = li.textContent?.trim() || '';
                  if (liText.toLowerCase().includes('stock') || liText.toLowerCase().includes('availability') || 
                      liText.toLowerCase().includes('available') || liText.toLowerCase().includes('sold')) {
                    availability = liText;
                    break;
                  }
                }
              }

              console.log(`📋 Availability text: "${availability}"`);

              // Extract stock number
              const allText = motorElement.textContent || '';
              const stockMatch = allText.match(/Stock\s*#?:?\s*([A-Za-z0-9\-_]+)/i);
              const stockNumber = stockMatch ? stockMatch[1].trim() : null;

              // Parse horsepower from title
              const hpMatch = fullTitle.match(/(\d+)\s*HP/i);
              const horsepower = hpMatch ? parseInt(hpMatch[1]) : null;

              if (!horsepower) {
                console.log(`⚠️ No horsepower found in: ${fullTitle}`);
                continue;
              }

              // Extract model (everything before HP)
              let model = fullTitle;
              if (hpMatch) {
                const hpIndex = fullTitle.toLowerCase().indexOf(hpMatch[0].toLowerCase());
                model = fullTitle.substring(0, hpIndex).trim();
              }

              // Clean up model name
              model = model.replace(/^(Mercury|Yamaha|Honda|Suzuki|Evinrude|Johnson)\s*/i, '').trim();
              model = model.replace(/\s+/g, ' ').trim();

              if (!model || model.length < 2) {
                console.log(`⚠️ Invalid model name: "${model}" from title: ${fullTitle}`);
                continue;
              }

              // Determine availability status based on text analysis (proper case for UI)
              let availabilityStatus = 'Brochure'; // default

              const availLower = availability.toLowerCase();
              if (availLower.includes('in stock') || availLower.includes('available') || 
                  availLower.includes('ready') || availLower.includes('on hand')) {
                availabilityStatus = 'In Stock';
              } else if (availLower.includes('sold') || availLower.includes('unavailable') || 
                        availLower.includes('not available') || availLower.includes('out of stock')) {
                availabilityStatus = 'Sold';
              } else if (availLower.includes('special order') || availLower.includes('order') || 
                        availLower.includes('brochure') || availLower.includes('contact')) {
                availabilityStatus = 'Brochure';
              }

              // Default brand detection from title
              let brand = 'Mercury';
              const titleLower = fullTitle.toLowerCase();
              if (titleLower.includes('yamaha')) brand = 'Yamaha';
              else if (titleLower.includes('honda')) brand = 'Honda';
              else if (titleLower.includes('suzuki')) brand = 'Suzuki';
              else if (titleLower.includes('evinrude')) brand = 'Evinrude';
              else if (titleLower.includes('johnson')) brand = 'Johnson';

              const motor = {
                model,
                horsepower,
                brand,
                base_price: price,
                sale_price: price,
                availability: availabilityStatus,
                stock_number: stockNumber,
                source_url: pageUrl,
                last_scraped: new Date().toISOString()
              };

              // Validate motor data
              if (motor.model && motor.model.length > 1 && motor.horsepower && motor.horsepower > 0) {
                allMotors.push(motor);
                console.log(`✅ Found motor: ${motor.brand} ${motor.model} ${motor.horsepower}HP - ${motor.availability} - Stock: ${motor.stock_number || 'N/A'}`);
              } else {
                console.log(`❌ Invalid motor data: model="${motor.model}", hp=${motor.horsepower}`);
              }

            } catch (motorError) {
              console.error(`❌ Error processing motor ${i + 1} on page ${currentPage}:`, motorError);
              summary.errors_count++;
            }
          }

          // Check for next page using DOM
          const nextPageLink = doc.querySelector('a.next, a[rel="next"], .pagination a:last-child');
          const hasNextPage = nextPageLink && !nextPageLink.classList.contains('disabled');
          
          console.log(`🔍 Next page check: hasNextPage=${hasNextPage}, motorsFound=${motorElements.length}`);
          
          hasMorePages = hasNextPage && motorElements.length > 0;
          currentPage++;
          
          // Add delay between requests
          if (hasMorePages) {
            console.log(`⏰ Waiting 2 seconds before next page...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
        } catch (pageError) {
          console.error(`❌ Error scraping page ${currentPage}:`, pageError);
          summary.errors_count++;
          hasMorePages = false;
        }
      }

      summary.motors_found = allMotors.length;
      console.log(`🎯 CORRECT v2 - Found ${allMotors.length} total motors from ${summary.pages_scraped} pages`);

          // Log motor summary by availability (updated for proper case)
          const inStockCount = allMotors.filter(m => m.availability === 'In Stock').length;
          const brochureCount = allMotors.filter(m => m.availability === 'Brochure').length;
          const soldCount = allMotors.filter(m => m.availability === 'Sold').length;
      
      console.log(`📊 Motor breakdown: ${inStockCount} in stock, ${brochureCount} brochure, ${soldCount} sold`);

      // Insert motors into database
      if (allMotors.length > 0) {
        try {
          console.log(`💾 Starting database operations for ${allMotors.length} motors...`);
          
          for (let i = 0; i < allMotors.length; i++) {
            const motor = allMotors[i];
            
            try {
              // Check if motor exists (by model, horsepower, and brand)
              const { data: existing, error: selectError } = await supabase
                .from('motor_models')
                .select('id, model, horsepower, brand')
                .eq('model', motor.model)
                .eq('horsepower', motor.horsepower)
                .eq('brand', motor.brand)
                .maybeSingle();

              if (selectError) {
                console.error(`❌ Error checking existing motor ${i + 1}:`, selectError);
                summary.errors_count++;
                continue;
              }

              if (existing) {
                // Update existing motor
                const { error: updateError } = await supabase
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

                if (updateError) {
                  console.error(`❌ Error updating motor ${i + 1}:`, updateError);
                  summary.errors_count++;
                } else {
                  summary.motors_hydrated++;
                  console.log(`🔄 Updated: ${motor.brand} ${motor.model} ${motor.horsepower}HP`);
                }
              } else {
                // Insert new motor
                const { error: insertError } = await supabase
                  .from('motor_models')
                  .insert([motor]);

                if (insertError) {
                  console.error(`❌ Error inserting motor ${i + 1}:`, insertError);
                  summary.errors_count++;
                } else {
                  summary.motors_inserted++;
                  console.log(`➕ Inserted: ${motor.brand} ${motor.model} ${motor.horsepower}HP`);
                }
              }
            } catch (motorDbError) {
              console.error(`❌ Database error for motor ${i + 1}:`, motorDbError);
              summary.errors_count++;
            }
          }

          // Final counts (updated for proper case)
          summary.in_stock_models_found = allMotors.filter(m => m.availability === 'In Stock').length;
          summary.brochure_models_found = allMotors.filter(m => m.availability === 'Brochure').length;
          
          console.log(`💾 CORRECT v2 - Database operations complete: ${summary.motors_inserted} inserted, ${summary.motors_hydrated} updated`);
          
        } catch (dbError) {
          console.error('❌ Database error:', dbError);
          summary.errors_count++;
        }
      } else {
        console.log(`⚠️ No motors found to save to database`);
      }
    }

    const endTime = Date.now();
    summary.duration_seconds = ((endTime - startTime) / 1000).toFixed(2);
    summary.validation_passed = summary.errors_count === 0;

    const response = {
      success: true,
      message: `CORRECT v2 - Found ${summary.motors_found} Mercury motors using ${source.toUpperCase()} source with DOMParser`,
      timestamp: new Date().toISOString(),
      summary
    };

    console.log('✅ CORRECT v2 - Scraping completed:', JSON.stringify(summary, null, 2));
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ CORRECT v2 - Function error:', error);
    
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