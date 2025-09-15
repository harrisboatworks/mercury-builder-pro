import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

// Validation function to ensure all motors match database schema exactly
const validateAndFixMotor = (motor: any) => {
  // Create a clean object with ONLY database fields and correct data types
  const motorForDB = {
    // Required fields - these MUST have values and correct types
    make: motor.make || 'Mercury',
    model: motor.model || 'Unknown Model',
    year: parseInt(motor.year) || 2025,
    horsepower: parseFloat(motor.horsepower) || 0,
    motor_type: motor.motor_type || 'Outboard',
    
    // Optional numeric fields - parse properly or set to null
    base_price: motor.base_price ? parseFloat(motor.base_price) : null,
    sale_price: motor.sale_price ? parseFloat(motor.sale_price) : null,
    
    // Optional text fields
    availability: motor.availability || 'Brochure',
    stock_number: motor.stock_number || null,
    image_url: motor.image_url || null,
    detail_url: motor.detail_url || null,
    description: motor.description || null,
    engine_type: motor.engine_type || null,
    
    // Default values for required fields
    stock_quantity: parseInt(motor.stock_quantity) || 0,
    inventory_source: 'html',
    last_scraped: new Date().toISOString(),
    
    // JSONB fields with defaults
    features: motor.features || null,
    specifications: motor.specifications || null,
    images: motor.images || null,
    
    // System fields will be auto-generated: id, created_at, updated_at, data_sources, etc.
  };
  
  return motorForDB;
};

// Batch saving function that continues even if some motors fail
async function saveMotorsBatch(motors: any[], supabase: any) {
  const results = {
    successful: [],
    failed: []
  };

  // Save in smaller batches to avoid timeouts
  const batchSize = 10;
  const totalBatches = Math.ceil(motors.length / batchSize);
  
  console.log(`💾 Starting to save ${motors.length} motors in ${totalBatches} batches of ${batchSize}`);
  
  for (let i = 0; i < motors.length; i += batchSize) {
    const batch = motors.slice(i, i + batchSize);
    const batchNum = Math.floor(i/batchSize) + 1;
    
    console.log(`📦 Processing batch ${batchNum}/${totalBatches} (motors ${i+1}-${Math.min(i+batchSize, motors.length)})`);
    
    for (const [motorIndex, motor] of batch.entries()) {
      try {
        const globalIndex = i + motorIndex + 1;
        console.log(`🔄 Saving motor ${globalIndex}/${motors.length}: ${motor.make} ${motor.model} ${motor.horsepower}HP`);
        
        const validatedMotor = validateAndFixMotor(motor);
        
        const { error } = await supabase
          .from('motor_models')
          .upsert(validatedMotor, {
            onConflict: 'model,year,horsepower',
            ignoreDuplicates: false
          });
        
        if (error) {
          results.failed.push({ 
            motor: motor.model, 
            error: error.message,
            position: globalIndex 
          });
          console.error(`❌ Failed to save motor ${globalIndex} (${motor.model}):`, error.message);
        } else {
          results.successful.push(motor.model);
          console.log(`✅ Successfully saved motor ${globalIndex}: ${motor.model}`);
        }
      } catch (e) {
        const globalIndex = i + motorIndex + 1;
        results.failed.push({ 
          motor: motor.model, 
          error: (e as Error).message,
          position: globalIndex 
        });
        console.error(`💥 Exception saving motor ${globalIndex} (${motor.model}):`, e);
      }
    }
    
    console.log(`📊 Batch ${batchNum} complete: ${results.successful.length} saved, ${results.failed.length} failed so far`);
    
    // Small delay between batches to prevent overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log(`✅ Saved: ${results.successful.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  if (results.failed.length > 0) {
    console.log('Failed motors:', results.failed);
  }
  
  return results;
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  try {
    // Enhanced logging for debugging
    console.log('🔍 Request Details:');
    console.log('- URL:', req.url);
    console.log('- Method:', req.method);
    console.log('- Headers:', Object.fromEntries(req.headers.entries()));
    
    // Check environment variables
    console.log('🔧 Environment Check:');
    console.log('- SUPABASE_URL exists:', !!Deno.env.get('SUPABASE_URL'));
    console.log('- SUPABASE_SERVICE_ROLE_KEY exists:', !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
    
    const url = new URL(req.url);
    console.log('- Parsed URL pathname:', url.pathname);
    
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      console.log('✅ Handling CORS preflight request');
      return new Response(null, { headers: corsHeaders });
    }

    // Test endpoint - no auth required
    if (url.pathname.endsWith('/test')) {
      console.log('✅ Test endpoint accessed successfully');
      return new Response(JSON.stringify({ 
        status: 'ok', 
        message: 'Function is reachable',
        timestamp: new Date().toISOString(),
        environment: {
          supabaseUrlExists: !!Deno.env.get('SUPABASE_URL'),
          serviceKeyExists: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Test scrape endpoint - scrapes only 1 page for debugging
    if (url.pathname.endsWith('/test-scrape')) {
      console.log('🧪 Test scrape endpoint accessed');
      try {
        const parser = new DOMParser();
        const baseUrl = 'https://www.harrisboatworks.ca/search/inventory/type/Outboard%20Motors/usage/New/sort/price-low?resultsperpage=50';
        
        console.log('🔍 Fetching single page:', baseUrl);
        const response = await fetch(baseUrl);
        const html = await response.text();
        const doc = parser.parseFromString(html, 'text/html');
        
        const motorItems = doc.querySelectorAll('.srp-list-item');
        console.log(`📦 Found ${motorItems.length} motor items on test page`);
        
        return new Response(JSON.stringify({
          status: 'success',
          message: 'Test scrape completed',
          motorsFound: motorItems.length,
          pageUrl: baseUrl,
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('❌ Test scrape error:', error);
        return new Response(JSON.stringify({
          status: 'error',
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Check authorization for actual scraping functionality
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('❌ Missing authorization header');
      return new Response(JSON.stringify({ 
        code: 401, 
        message: 'Missing authorization header' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('🚀 CORRECT FUNCTION v2: Full DOM scraping started');
    const startTime = Date.now();
    
    // Parse request body with enhanced error handling
    let body;
    try {
      body = await req.json();
      console.log('📝 Request body parsed:', body);
    } catch (jsonError) {
      console.log('📝 No JSON body or invalid JSON, using defaults:', jsonError.message);
      body = {};
    }
    
    const { source = 'html', trigger = 'manual', useXmlFeed = false, page = 1 } = body;
    
    console.log(`📊 CORRECT v2 - Params: source=${source}, trigger=${trigger}, useXmlFeed=${useXmlFeed}, page=${page}`);

    const summary = {
      source: 'html',
      page: page,
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
      // Harris Boat Works HTML scraping with DOM Parser - Single Page Mode
      const baseUrl = 'https://www.harrisboatworks.ca/search/inventory/type/Outboard%20Motors/usage/New/sort/price-low';
      const allMotors = [];
      const parser = new DOMParser();

      console.log(`🔍 Starting Harris Boat Works HTML scraping - Page ${page} only...`);

      // Scrape only the requested page
      const pageUrl = page === 1 
        ? `${baseUrl}?resultsperpage=200`
        : `${baseUrl}/page/${page}?resultsperpage=200`;
        
      console.log(`📄 Scraping page ${page}: ${pageUrl}`);

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
          console.error(`❌ Failed to fetch page ${page}: ${response.status}`);
          throw new Error(`Failed to fetch page ${page}: ${response.status}`);
        }

        const html = await response.text();
        console.log(`📄 Page ${page} HTML length: ${html.length}`);
        
        // Check if we're being blocked
        if (html.includes('cloudflare') || html.includes('captcha') || html.includes('Just a moment') || 
            html.includes('Checking your browser') || html.includes('DDoS protection')) {
          console.error('⚠️ Possible bot protection detected');
        }
        
        const doc = parser.parseFromString(html, 'text/html');
        if (!doc) {
          throw new Error(`Failed to parse HTML for page ${page}`);
        }

        // Find motor items
        const motorElements = doc.querySelectorAll('.srp-list-item');
        console.log(`📦 Found ${motorElements.length} motor items on page ${page}`);
        
        summary.pages_scraped = 1;

        // Process each motor on this page
        for (let i = 0; i < motorElements.length; i++) {
          try {
            const element = motorElements[i];
            
            // Extract motor details (same extraction logic as before)
            const titleElement = element.querySelector('.srp-title a') || element.querySelector('h3 a') || element.querySelector('.title a');
            const title = titleElement?.textContent?.trim() || '';
            
            const priceElement = element.querySelector('.srp-price') || element.querySelector('.price');
            const priceText = priceElement?.textContent?.trim() || '';
            
            const availabilityElement = element.querySelector('.srp-availability') || element.querySelector('.availability');
            let availability = availabilityElement?.textContent?.trim() || 'Brochure';
            
            const imageElement = element.querySelector('img');
            const imageUrl = imageElement?.src || imageElement?.getAttribute('data-src') || null;
            
            const linkElement = element.querySelector('a');
            const detailUrl = linkElement?.href ? new URL(linkElement.href, 'https://www.harrisboatworks.ca').toString() : null;

            // Parse title for motor details
            let make = 'Mercury';
            let model = 'Unknown Model';
            let horsepower = 0;
            let year = 2025;

            if (title) {
              const hpMatch = title.match(/(\d+(?:\.\d+)?)\s*hp/i);
              if (hpMatch) {
                horsepower = parseFloat(hpMatch[1]);
              }
              
              const yearMatch = title.match(/\b(20\d{2})\b/);
              if (yearMatch) {
                year = parseInt(yearMatch[1]);
              }
              
              let cleanTitle = title.replace(/\b(20\d{2})\b/g, '').replace(/\d+(?:\.\d+)?\s*hp/gi, '').trim();
              cleanTitle = cleanTitle.replace(/^(Mercury|Yamaha|Honda|Suzuki|Evinrude)\s*/i, '').trim();
              model = cleanTitle || 'Unknown Model';
            }

            // Parse price
            let basePrice = null;
            if (priceText) {
              const priceMatch = priceText.match(/\$?([\d,]+)/);
              if (priceMatch) {
                basePrice = parseFloat(priceMatch[1].replace(/,/g, ''));
              }
            }

            // Clean availability
            if (availability.toLowerCase().includes('in stock')) {
              availability = 'In Stock';
            } else if (availability.toLowerCase().includes('sold')) {
              availability = 'Sold';
            } else {
              availability = 'Brochure';
            }

            // Extract stock number from detail URL or other sources
            let stockNumber = null;
            if (detailUrl) {
              const stockMatch = detailUrl.match(/\/(\d+)$/);
              if (stockMatch) {
                stockNumber = stockMatch[1];
              }
            }

            const motor = {
              make,
              model,
              year,
              horsepower,
              motor_type: 'Outboard',
              base_price: basePrice,
              sale_price: basePrice,
              availability,
              image_url: imageUrl,
              detail_url: detailUrl,
              description: title,
              stock_number: stockNumber,
            };

            // Validate motor
            const isValidMotor = (
              motor.model && 
              motor.model.length > 1 && 
              motor.horsepower && 
              motor.horsepower > 0 && 
              motor.make &&
              motor.motor_type
            );
            
            if (isValidMotor) {
              allMotors.push(motor);
              console.log(`✅ Found motor: ${motor.make} ${motor.model} ${motor.horsepower}HP - $${motor.base_price} - ${motor.availability} - Stock: ${motor.stock_number || 'N/A'}`);
            } else {
              console.log(`❌ Invalid motor data: model="${motor.model}", hp=${motor.horsepower}, price=${motor.base_price}, make=${motor.make}, type=${motor.motor_type}`);
              summary.errors_count++;
            }

          } catch (motorError) {
            console.error(`❌ Error processing motor ${i + 1} on page ${page}:`, motorError);
            summary.errors_count++;
          }
        }

        // Check if there are more pages
        const nextPageLink = doc.querySelector('a.next, a[rel="next"], .pagination a:last-child');
        const hasNextPage = nextPageLink && !nextPageLink.classList.contains('disabled');
        
        console.log(`🔍 Next page check: hasNextPage=${hasNextPage}, currentPage=${page}`);
        
        summary.motors_found = allMotors.length;
        summary.has_more_pages = hasNextPage;
        
        console.log(`🎯 CORRECT v2 - Found ${allMotors.length} motors on page ${page}`);

      } catch (pageError) {
        console.error(`❌ Error scraping page ${page}:`, pageError);
        summary.errors_count++;
        throw pageError;
      }
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

              // Extract price with multiple strategies
              let price = null;
              
              // Strategy 1: Look for explicit price elements
              let priceElement = motorElement.querySelector('.price, .panel-price, [class*="price"]');
              let priceText = priceElement?.textContent?.trim() || '';
              
              // Strategy 2: Look in list items for price
              if (!priceText || !priceText.includes('$')) {
                const liElements = motorElement.querySelectorAll('li');
                for (const li of liElements) {
                  const liText = li.textContent?.trim() || '';
                  if (liText.includes('$') && /\$[\d,]+/.test(liText)) {
                    priceText = liText;
                    break;
                  }
                }
              }
              
              // Strategy 3: Look in any text content for price pattern
              if (!priceText || !priceText.includes('$')) {
                const allText = motorElement.textContent || '';
                const priceMatch = allText.match(/\$[\s]*([0-9,]+(?:\.[0-9]{2})?)/);
                if (priceMatch) {
                  priceText = priceMatch[0];
                }
              }
              
              // Extract numeric price value
              const priceMatch = priceText.match(/\$[\s]*([0-9,]+(?:\.[0-9]{2})?)/);
              if (priceMatch) {
                const numericPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
                if (numericPrice > 0) {
                  price = numericPrice;
                }
              }
              
              console.log(`💰 Price extraction: "${priceText}" -> $${price || 'N/A'}`);
              
              // Set default price if none found (to prevent database constraint violations)
              if (!price || price <= 0) {
                // Estimate price based on horsepower (rough estimates for Mercury outboards)
                const hpMatch = fullTitle.match(/(\d+)\s*HP/i);
                const hp = hpMatch ? parseInt(hpMatch[1]) : 0;
                
                if (hp > 0) {
                  if (hp <= 9.9) price = 3500;
                  else if (hp <= 25) price = 5500;
                  else if (hp <= 60) price = 8500;
                  else if (hp <= 115) price = 15000;
                  else if (hp <= 200) price = 25000;
                  else if (hp <= 300) price = 35000;
                  else price = 45000;
                  
                  console.log(`📊 Estimated price for ${hp}HP motor: $${price}`);
                } else {
                  price = 15000; // Default fallback price
                  console.log(`⚠️ Using fallback price: $${price}`);
                }
              }

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
              const hpMatch = fullTitle.match(/(\d+(?:\.\d+)?)\s*HP/i);
              const horsepower = hpMatch ? parseFloat(hpMatch[1]) : null;

              if (!horsepower) {
                console.log(`⚠️ No horsepower found in: ${fullTitle}`);
                continue;
              }

              // Preserve full model specification - just remove the make name, keep everything else
              let model = fullTitle;
              
              // Remove make name from the beginning
              model = model.replace(/^(Mercury|Yamaha|Honda|Suzuki|Evinrude|Johnson)\s*/i, '').trim();
              
              // Remove year if it's at the beginning (like "2025 ")
              model = model.replace(/^20\d{2}\s+/, '').trim();
              
              // Clean up extra spaces but preserve all specifications
              model = model.replace(/\s+/g, ' ').trim();

              if (!model || model.length < 2) {
                console.log(`⚠️ Invalid model name: "${model}" from title: ${fullTitle}`);
                continue;
              }
              
              console.log(`🏷️ Model preserved: "${model}" from "${fullTitle}"`);

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

              // Default brand detection from title - use 'make' to match database
              let make = 'Mercury';
              const titleLower = fullTitle.toLowerCase();
              if (titleLower.includes('yamaha')) make = 'Yamaha';
              else if (titleLower.includes('honda')) make = 'Honda';
              else if (titleLower.includes('suzuki')) make = 'Suzuki';
              else if (titleLower.includes('evinrude')) make = 'Evinrude';
              else if (titleLower.includes('johnson')) make = 'Johnson';

              // Determine motor type from model name with enhanced detection
              let motor_type = 'Outboard'; // Default
              const modelLower = model.toLowerCase();
              const titleLower = fullTitle.toLowerCase();
              
              // Priority order for type detection
              if (modelLower.includes('verado') || titleLower.includes('verado')) {
                motor_type = 'Verado';
              } else if (modelLower.includes('pro xs') || modelLower.includes('proxs') || 
                        titleLower.includes('pro xs') || titleLower.includes('proxs')) {
                motor_type = 'ProXS';
              } else if (modelLower.includes('fourstroke') || modelLower.includes('4-stroke') || 
                        titleLower.includes('fourstroke') || titleLower.includes('4-stroke')) {
                motor_type = 'FourStroke';
              } else if (modelLower.includes('seapro') || titleLower.includes('seapro')) {
                motor_type = 'SeaPro';
              } else if (modelLower.includes('command thrust') || titleLower.includes('command thrust')) {
                motor_type = 'Command Thrust';
              } else {
                // Keep as generic 'Outboard' for unknown types
                motor_type = 'Outboard';
              }
              
              console.log(`🔧 Motor type detected: "${motor_type}" from "${model}"`);

              // Create motor object with proper data types matching database schema
              const motor = {
                // Required fields with proper data types
                make: 'Mercury', // Always Mercury for this scraper
                model,
                year: 2025,
                horsepower: parseFloat(horsepower), // Ensure numeric type
                motor_type,
                
                // Optional numeric fields - parse properly
                base_price: price ? parseFloat(price) : null,
                sale_price: price ? parseFloat(price) : null,
                
                // Optional text fields
                availability: availabilityStatus,
                stock_number: stockNumber,
                
                // Fields that will be added/validated by validateAndFixMotor:
                // stock_quantity, inventory_source, last_scraped
              };

              // Enhanced validation - check for required database fields
              const isValidMotor = (
                motor.model && 
                motor.model.length > 1 && 
                motor.horsepower && 
                motor.horsepower > 0 && 
                motor.make &&
                motor.motor_type
              );
              
              if (isValidMotor) {
                allMotors.push(motor);
                console.log(`✅ Found motor: ${motor.make} ${motor.model} ${motor.horsepower}HP - $${motor.base_price} - ${motor.availability} - Stock: ${motor.stock_number || 'N/A'}`);
              } else {
                console.log(`❌ Invalid motor data: model="${motor.model}", hp=${motor.horsepower}, price=${motor.base_price}, make=${motor.make}, type=${motor.motor_type}`);
                summary.errors_count++;
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

        // Log motor summary by availability (updated for proper case)
        const inStockCount = allMotors.filter(m => m.availability === 'In Stock').length;
        const brochureCount = allMotors.filter(m => m.availability === 'Brochure').length;
        const soldCount = allMotors.filter(m => m.availability === 'Sold').length;
    
        console.log(`📊 Motor breakdown: ${inStockCount} in stock, ${brochureCount} brochure, ${soldCount} sold`);

      // Insert motors into database with batch saving
      if (allMotors.length > 0) {
        console.log(`💾 Starting database operations for ${allMotors.length} motors...`);
        
        // Add timeout monitoring
        const operationStart = Date.now();
        const timeoutWarning = 45000; // Warn at 45 seconds
        
        console.log(`⏱️ Starting motor save operation at ${operationStart}ms elapsed`);
        
        try {
          const results = await saveMotorsBatch(allMotors, supabase);
          
          const operationEnd = Date.now();
          const operationDuration = operationEnd - operationStart;
          
          console.log(`⏱️ Database operation completed in ${operationDuration}ms`);
          
          if (operationDuration > timeoutWarning) {
            console.log(`⚠️ Database operation took ${operationDuration}ms - close to timeout limit`);
          }
          
          summary.motors_inserted = results.successful.length;
          summary.errors_count += results.failed.length;
          
          console.log(`💾 CORRECT v2 - Database operations complete: ${summary.motors_inserted} inserted, ${results.failed.length} failed`);
          
        } catch (dbError) {
          console.error('❌ CRITICAL DATABASE ERROR:', dbError);
          console.error('- Error name:', dbError.name);
          console.error('- Error message:', dbError.message);
          console.error('- Time elapsed when error occurred:', Date.now() - startTime, 'ms');
          
          // Still count what we found even if save failed
          summary.errors_count++;
          throw dbError; // Re-throw to be caught by outer try-catch
        }
        
        // Final counts (updated for proper case)
        summary.in_stock_models_found = allMotors.filter(m => m.availability === 'In Stock').length;
        summary.brochure_models_found = allMotors.filter(m => m.availability === 'Brochure').length;
        
      } else {
        console.log(`⚠️ No motors found to save to database`);
      }
    }

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

    console.log('✅ CORRECT v2 - Scraping completed:', JSON.stringify(summary, null, 2));
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ CRITICAL ERROR in scrape-inventory-v2:');
    console.error('- Error name:', error.name);
    console.error('- Error message:', error.message);
    console.error('- Error stack:', error.stack);
    console.error('- Error cause:', error.cause);
    console.error('- Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    // Check if it's a specific type of error
    if (error.name === 'TypeError') {
      console.error('🔍 TypeError detected - likely missing import or undefined variable');
    }
    if (error.name === 'SyntaxError') {
      console.error('🔍 SyntaxError detected - likely JSON parsing issue');
    }
    if (error.name === 'ReferenceError') {
      console.error('🔍 ReferenceError detected - likely undefined variable or function');
    }
    
    const errorResponse = {
      success: false,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause,
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