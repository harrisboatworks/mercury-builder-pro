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

// Firecrawl scraping function - matches pattern from scrape-motor-details
async function firecrawlScrape(url: string, apiKey: string): Promise<{ html?: string; markdown?: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
  
  console.log(`🔥 Scraping with Firecrawl: ${url}`);
  console.log(`🔑 Using API key: ${apiKey.substring(0, 8)}...`);
  
  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      url, 
      formats: ['html', 'markdown'], 
      onlyMainContent: false, // We want full page for inventory
      waitFor: 3000 // Wait for JavaScript to load
    }),
    signal: controller.signal,
  });
  
  clearTimeout(timeoutId);
  
  if (!res.ok) {
    throw new Error(`Firecrawl scrape failed: ${res.status} ${await res.text()}`);
  }
  
  const data = await res.json();
  console.log(`✅ Firecrawl scraped successfully`);
  
  // Support multiple possible response shapes
  const html = data?.data?.html || data?.html || null;
  const markdown = data?.data?.markdown || data?.markdown || null;
  
  console.log(`📏 Content lengths - HTML: ${html?.length || 0}, Markdown: ${markdown?.length || 0}`);
  
  return { html: html || undefined, markdown: markdown || undefined };
}

// Helper function with Firecrawl retry logic and fallback
async function fetchWithFirecrawl(url: string, apiKey: string, maxRetries: number = 2): Promise<string | null> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`🌐 Firecrawl attempt ${i + 1} for: ${url}`);
      const result = await firecrawlScrape(url, apiKey);
      
      if (result.html) {
        console.log(`✅ Firecrawl fetched ${result.html.length} characters from ${url}`);
        return result.html;
      } else {
        throw new Error('No HTML content returned from Firecrawl');
      }
    } catch (error) {
      console.error(`❌ Firecrawl attempt ${i + 1} failed:`, error.message);
      if (i === maxRetries - 1) {
        console.log(`⚠️ Firecrawl failed, trying direct fetch as fallback...`);
        try {
          const resp = await fetch(url);
          if (resp.ok) {
            const html = await resp.text();
            console.log(`✅ Direct fetch successful, got ${html.length} characters`);
            return html;
          }
        } catch (fallbackError) {
          console.error(`❌ Direct fetch also failed:`, fallbackError.message);
        }
        console.error(`💥 All ${maxRetries} Firecrawl attempts and fallback failed for ${url}`);
        return null;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 5000 * (i + 1)));
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

// Main scraping function with Firecrawl
async function scrapeInventory(firecrawlApiKey: string): Promise<MotorData[]> {
  const baseUrl = 'https://www.harrisboatworks.ca';
  // Use the specific URL provided by the user for Mercury outboard motors
  const inventoryUrl = `${baseUrl}/search/inventory/brand/Mercury/type/Outboard%20Motors/usage/New`;
  let allMotors: MotorData[] = [];
  let currentPage = 1;
  let maxPages = 20; // Increased limit since we expect more motors with JS rendering

  console.log(`🚀 Starting Firecrawl-powered scraping from: ${inventoryUrl}`);

  while (currentPage <= maxPages) {
    const pageUrl = currentPage === 1 ? inventoryUrl : `${inventoryUrl}?page=${currentPage}`;
    console.log(`🔄 Scraping page ${currentPage}: ${pageUrl}`);
    
    const html = await fetchWithFirecrawl(pageUrl, firecrawlApiKey);
    if (!html) {
      console.error(`❌ Failed to fetch page ${currentPage} with Firecrawl`);
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
    
    // Rate limiting - longer delay for Firecrawl
    await new Promise(resolve => setTimeout(resolve, 8000));
  }

  console.log(`🎉 Total motors scraped with Firecrawl: ${allMotors.length}`);
  return allMotors;
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // Health endpoint
    if (pathname.endsWith('/health')) {
      console.log('🏥 Health check endpoint called');
      return new Response(JSON.stringify({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        function: 'scrape-inventory-v2'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Test Firecrawl endpoint
    if (pathname.endsWith('/test-firecrawl')) {
      console.log('🧪 Testing Firecrawl endpoint called');
      
      // Check API key
      console.log(`🔑 FIRECRAWL_API_KEY exists: ${!!firecrawlApiKey}`);
      if (firecrawlApiKey) {
        console.log(`🔑 FIRECRAWL_API_KEY starts with: ${firecrawlApiKey.substring(0, 8)}...`);
      } else {
        return new Response(JSON.stringify({
          success: false,
          error: 'FIRECRAWL_API_KEY not found in environment variables',
          timestamp: new Date().toISOString()
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      try {
        console.log('🏠 Testing Firecrawl with homepage...');
        const testUrl = 'https://www.harrisboatworks.ca';
        const result = await firecrawlScrape(testUrl, firecrawlApiKey);
        
        return new Response(JSON.stringify({
          success: true,
          url: testUrl,
          html_length: result.html?.length || 0,
          markdown_length: result.markdown?.length || 0,
          has_html: !!result.html,
          has_markdown: !!result.markdown,
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (testError) {
        console.error('❌ Firecrawl test failed:', testError);
        return new Response(JSON.stringify({
          success: false,
          error: testError.message,
          error_type: testError.constructor.name,
          timestamp: new Date().toISOString()
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Main inventory scraping (default behavior)
    console.log('🚀 Starting Firecrawl-powered inventory scraping...');
    
    // Enhanced API key logging
    console.log(`🔑 FIRECRAWL_API_KEY exists: ${!!firecrawlApiKey}`);
    if (firecrawlApiKey) {
      console.log(`🔑 FIRECRAWL_API_KEY starts with: ${firecrawlApiKey.substring(0, 8)}...`);
    } else {
      throw new Error('FIRECRAWL_API_KEY is required but not found in environment variables');
    }
    
    // Scrape motors from website using Firecrawl
    const scrapedMotors = await scrapeInventory(firecrawlApiKey);
    
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
              harris_firecrawl: {
                success: true,
                scraped_at: motor.last_scraped,
                method: 'firecrawl'
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
    console.error('💥 Scraping failed with detailed error info:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 1000),
      cause: error.cause,
      timestamp: new Date().toISOString()
    });
    
    // Try to log to database even if main process failed
    try {
      await supabase
        .from('inventory_updates')
        .insert({
          status: 'failed',
          error_message: `${error.name}: ${error.message}`,
          motors_updated: 0,
          completed_at: new Date().toISOString(),
          is_scheduled: false
        });
    } catch (dbError) {
      console.error('📊 Failed to log error to database:', dbError);
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      error_name: error.name,
      error_details: error.stack?.substring(0, 500),
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});