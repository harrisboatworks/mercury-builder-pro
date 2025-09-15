import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.45/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MotorData {
  stock_number: string;
  make: string;
  model: string;
  horsepower: number;
  year: number;
  motor_type: string;
  base_price: number | null;
  sale_price: number | null;
  availability: string;
  image_url: string | null;
  detail_url: string | null;
  description: string | null;
  inventory_source: string;
  last_scraped: string;
}

// Helper function to fetch with retry
async function fetchWithRetry(url: string, maxRetries: number = 3): Promise<string | null> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`🌐 Fetching: ${url} (attempt ${i + 1})`);
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      console.log(`✅ Fetched ${html.length} characters from ${url}`);
      return html;
    } catch (error) {
      console.error(`❌ Fetch attempt ${i + 1} failed:`, error.message);
      if (i === maxRetries - 1) {
        console.error(`💥 All ${maxRetries} attempts failed for ${url}`);
        return null;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  return null;
}

// Parse motors from HTML page
function parseMotorsFromHTML(html: string, baseUrl: string): MotorData[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const motors: MotorData[] = [];

  if (!doc) {
    console.error('❌ Failed to parse HTML document');
    return motors;
  }

  // Find all motor result panels
  const motorPanels = doc.querySelectorAll('.panel.panel-default.search-result');
  console.log(`🔍 Found ${motorPanels.length} motor panels`);

  motorPanels.forEach((panel, index) => {
    try {
      // Look for hidden JSON data source
      const datasourceSpan = panel.querySelector('span.datasource.hidden');
      if (datasourceSpan) {
        const jsonText = datasourceSpan.textContent?.trim();
        if (jsonText) {
          try {
            const motorJson = JSON.parse(jsonText);
            
            const motor: MotorData = {
              stock_number: motorJson.stockNumber || `UNKNOWN_${Date.now()}_${index}`,
              make: motorJson.itemMake || 'Mercury',
              model: motorJson.itemModel || 'Unknown Model',
              horsepower: parseFloat(motorJson.itemPrice) ? parseFloat(motorJson.itemMake?.match(/(\d+)HP/)?.[1] || '0') : 0,
              year: parseInt(motorJson.itemYear) || 2025,
              motor_type: motorJson.itemType || 'Outboard',
              base_price: motorJson.unitPrice ? parseFloat(motorJson.unitPrice) : null,
              sale_price: motorJson.itemPrice ? parseFloat(motorJson.itemPrice) : null,
              availability: motorJson.usageStatus === 'New' ? 'In Stock' : 'Unknown',
              image_url: motorJson.itemThumbNailUrl ? `https:${motorJson.itemThumbNailUrl}` : null,
              detail_url: motorJson.itemUrl ? `https://www.harrisboatworks.ca${motorJson.itemUrl}` : null,
              description: `${motorJson.itemYear} ${motorJson.itemMake} ${motorJson.itemModel}`,
              inventory_source: 'html',
              last_scraped: new Date().toISOString()
            };

            // Extract horsepower from model name if not found
            if (!motor.horsepower || motor.horsepower === 0) {
              const hpMatch = motor.model.match(/(\d+(?:\.\d+)?)HP/i);
              if (hpMatch) {
                motor.horsepower = parseFloat(hpMatch[1]);
              }
            }

            motors.push(motor);
            console.log(`✅ Parsed motor: ${motor.year} ${motor.make} ${motor.model} (${motor.horsepower}HP)`);
          } catch (jsonError) {
            console.error(`❌ Failed to parse JSON for motor ${index}:`, jsonError);
          }
        }
      }
      
      // Fallback to HTML parsing if JSON not found
      if (!datasourceSpan) {
        const titleElement = panel.querySelector('.results-heading a');
        const priceElement = panel.querySelector('[itemprop="price"]');
        const stockElement = panel.querySelector('td:contains("Stock #") + td');
        
        if (titleElement) {
          const titleText = titleElement.textContent?.trim() || '';
          const yearMatch = titleText.match(/(\d{4})/);
          const hpMatch = titleText.match(/(\d+(?:\.\d+)?)HP/i);
          
          const motor: MotorData = {
            stock_number: stockElement?.textContent?.trim() || `HTML_${Date.now()}_${index}`,
            make: 'Mercury',
            model: titleText.replace(/^\d{4}\s*/, '').replace(/\s*-\s*Mercury$/, ''),
            horsepower: hpMatch ? parseFloat(hpMatch[1]) : 0,
            year: yearMatch ? parseInt(yearMatch[1]) : 2025,
            motor_type: 'Outboard',
            base_price: null,
            sale_price: priceElement ? parseFloat(priceElement.textContent?.replace(/[$,]/g, '') || '0') : null,
            availability: 'In Stock',
            image_url: null,
            detail_url: titleElement.getAttribute('href') ? `https://www.harrisboatworks.ca${titleElement.getAttribute('href')}` : null,
            description: titleText,
            inventory_source: 'html_fallback',
            last_scraped: new Date().toISOString()
          };

          motors.push(motor);
          console.log(`✅ Parsed motor (fallback): ${motor.year} ${motor.make} ${motor.model}`);
        }
      }
    } catch (error) {
      console.error(`❌ Error parsing motor panel ${index}:`, error);
    }
  });

  return motors;
}

// Check for pagination
function hasNextPage(html: string): boolean {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const nextButton = doc?.querySelector('a[aria-label="Next"]');
  return nextButton !== null && !nextButton.classList.contains('disabled');
}

// Main scraping function
async function scrapeInventory(): Promise<MotorData[]> {
  const baseUrl = 'https://www.harrisboatworks.ca';
  const inventoryUrl = `${baseUrl}/search/inventory/type/Outboard%20Motors/usage/New`;
  let allMotors: MotorData[] = [];
  let currentPage = 1;
  let maxPages = 10; // Safety limit

  while (currentPage <= maxPages) {
    const pageUrl = currentPage === 1 ? inventoryUrl : `${inventoryUrl}?page=${currentPage}`;
    console.log(`🔄 Scraping page ${currentPage}: ${pageUrl}`);
    
    const html = await fetchWithRetry(pageUrl);
    if (!html) {
      console.error(`❌ Failed to fetch page ${currentPage}`);
      break;
    }

    const pageMotors = parseMotorsFromHTML(html, baseUrl);
    console.log(`📦 Found ${pageMotors.length} motors on page ${currentPage}`);
    
    if (pageMotors.length === 0) {
      console.log(`ℹ️ No motors found on page ${currentPage}, stopping`);
      break;
    }

    allMotors = allMotors.concat(pageMotors);

    // Check for next page
    if (!hasNextPage(html)) {
      console.log(`ℹ️ No more pages after page ${currentPage}`);
      break;
    }

    currentPage++;
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`🎉 Total motors scraped: ${allMotors.length}`);
  return allMotors;
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting inventory scraping...');
    
    // Scrape motors from website
    const scrapedMotors = await scrapeInventory();
    
    if (scrapedMotors.length === 0) {
      throw new Error('No motors were scraped from the website');
    }

    // Save to database
    let inserted = 0;
    let updated = 0;
    let failed = 0;

    console.log(`💾 Saving ${scrapedMotors.length} motors to database...`);

    for (const motor of scrapedMotors) {
      try {
        const { error } = await supabase
          .from('motor_models')
          .upsert({
            stock_number: motor.stock_number,
            make: motor.make,
            model: motor.model,
            horsepower: motor.horsepower,
            year: motor.year,
            motor_type: motor.motor_type,
            base_price: motor.base_price,
            sale_price: motor.sale_price,
            availability: motor.availability,
            image_url: motor.image_url,
            detail_url: motor.detail_url,
            description: motor.description,
            inventory_source: motor.inventory_source,
            last_scraped: motor.last_scraped,
            data_sources: {
              harris: {
                success: true,
                scraped_at: motor.last_scraped
              }
            }
          }, { 
            onConflict: 'stock_number',
            ignoreDuplicates: false 
          });

        if (error) {
          console.error('❌ Database error:', error);
          failed++;
        } else {
          inserted++;
        }
      } catch (err) {
        console.error('❌ Processing error:', err);
        failed++;
      }
    }

    // Log inventory update
    await supabase
      .from('inventory_updates')
      .insert({
        status: 'completed',
        motors_updated: inserted,
        completed_at: new Date().toISOString(),
        is_scheduled: false
      });

    const summary = {
      success: true,
      motors_scraped: scrapedMotors.length,
      motors_inserted: inserted,
      motors_failed: failed,
      timestamp: new Date().toISOString()
    };

    console.log('✅ Scraping completed:', summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Scraping failed:', error);
    
    // Log failed update
    await supabase
      .from('inventory_updates')
      .insert({
        status: 'failed',
        error_message: error.message,
        motors_updated: 0,
        completed_at: new Date().toISOString(),
        is_scheduled: false
      });
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});