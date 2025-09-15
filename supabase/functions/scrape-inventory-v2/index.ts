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

// Fixed Firecrawl scraping function with v1 API compatibility
async function firecrawlScrape(url: string, apiKey: string): Promise<{ html?: string; markdown?: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
  
  console.log(`🔥 Scraping with Firecrawl v1 API: ${url}`);
  console.log(`🔑 Using API key: ${apiKey.substring(0, 8)}...`);
  
  try {
    // Use simple v1 API configuration - same as scrape-motor-details
    const requestBody = { 
      url, 
      formats: ['html', 'markdown'],
      onlyMainContent: false // Need full page for inventory parsing
    };
    
    console.log(`📋 Firecrawl v1 request config:`, JSON.stringify(requestBody, null, 2));
    
    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    // Add debug logging as requested
    console.log('Firecrawl response status:', res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`❌ Firecrawl API error response:`, errorText);
      throw new Error(`Firecrawl scrape failed: ${res.status} ${errorText}`);
    }
    
    const data = await res.json();
    
    // Add comprehensive debug logs as requested
    console.log('Firecrawl raw response:', JSON.stringify(data).substring(0, 1000));
    console.log('Firecrawl markdown content:', data.data?.markdown?.substring(0, 500));
    console.log('Firecrawl HTML content:', data.data?.html?.substring(0, 500));
    console.log(`✅ Firecrawl response received, keys:`, Object.keys(data));
    
    // Support multiple possible response shapes (same as scrape-motor-details)
    const html = data?.data?.html || data?.html || null;
    const markdown = data?.data?.markdown || data?.markdown || null;
    
    console.log(`📏 Content lengths - HTML: ${html?.length || 0}, Markdown: ${markdown?.length || 0}`);
    
    // Enhanced content validation
    if (html) {
      const hasMotorPanels = html.includes('panel panel-default search-result');
      const hasSearchResults = html.includes('search-result');
      const hasInventoryData = html.includes('itemMake') || html.includes('Mercury');
      const hasJsonData = html.includes('datasource');
      
      console.log(`🔍 Content validation:`);
      console.log(`   • Motor panels: ${hasMotorPanels}`);
      console.log(`   • Search results: ${hasSearchResults}`);
      console.log(`   • Inventory data: ${hasInventoryData}`);
      console.log(`   • JSON data source: ${hasJsonData}`);
      
      if (!hasSearchResults && !hasInventoryData) {
        console.warn(`⚠️ HTML content may not contain expected inventory data`);
      }
    }
    
    return { html: html || undefined, markdown: markdown || undefined };
    
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`💥 Firecrawl error details:`, {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500)
    });
    
    if (error.name === 'AbortError') {
      throw new Error('Firecrawl request timed out after 30 seconds');
    }
    throw error;
  }
}

// Helper function with Firecrawl retry logic and fallback
async function fetchWithFirecrawl(url: string, apiKey: string, maxRetries: number = 2): Promise<string | null> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log('Scraping URL:', url);
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

// Enhanced parsing with content validation
function parseMotorsFromHTML(html: string, baseUrl: string): MotorData[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const motors: MotorData[] = [];

  if (!doc) {
    console.error('❌ Failed to parse HTML document');
    return motors;
  }

  // Enhanced content validation
  console.log(`📄 HTML content preview (first 500 chars):`, html.substring(0, 500));
  console.log(`🔍 Searching for motor panels in ${html.length} character HTML document`);
  
  // Try multiple selectors for motor panels
  let motorPanels = doc.querySelectorAll('.panel.panel-default.search-result');
  if (motorPanels.length === 0) {
    console.log(`⚠️ No panels found with primary selector, trying alternatives...`);
    motorPanels = doc.querySelectorAll('.search-result');
  }
  if (motorPanels.length === 0) {
    motorPanels = doc.querySelectorAll('[class*="search-result"]');
  }
  if (motorPanels.length === 0) {
    motorPanels = doc.querySelectorAll('.panel');
  }
  
  console.log(`🔍 Found ${motorPanels.length} motor panels with enhanced selectors`);

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

// Enhanced scraping function with better error handling and rate limiting
async function scrapeInventory(firecrawlApiKey: string): Promise<MotorData[]> {
  const baseUrl = 'https://www.harrisboatworks.ca';
  const inventoryUrl = `${baseUrl}/search/inventory/brand/Mercury/type/Outboard%20Motors/usage/New`;
  let allMotors: MotorData[] = [];
  let currentPage = 1;
  let maxPages = 25;
  let consecutiveEmptyPages = 0;

  console.log(`🚀 Starting Firecrawl v1 scraping from: ${inventoryUrl}`);
  console.log(`🎯 Target: Mercury outboard motors, max ${maxPages} pages`);

  while (currentPage <= maxPages) {
    const pageUrl = currentPage === 1 ? inventoryUrl : `${inventoryUrl}?page=${currentPage}`;
    console.log(`🔄 Scraping page ${currentPage}/${maxPages}: ${pageUrl}`);
    
    try {
      const html = await fetchWithFirecrawl(pageUrl, firecrawlApiKey);
      if (!html) {
        console.error(`❌ Failed to fetch page ${currentPage} with Firecrawl`);
        consecutiveEmptyPages++;
        if (consecutiveEmptyPages >= 3) {
          console.log(`⏹️ Stopping after ${consecutiveEmptyPages} consecutive failed pages`);
          break;
        }
        currentPage++;
        continue;
      }

      // Enhanced content validation before parsing
      if (html.length < 1000) {
        console.warn(`⚠️ Page ${currentPage} has suspiciously short content (${html.length} chars)`);
      }
      
      const hasExpectedContent = html.includes('Mercury') || html.includes('search-result') || html.includes('panel');
      if (!hasExpectedContent) {
        console.warn(`⚠️ Page ${currentPage} doesn't contain expected inventory content`);
      }

      const pageMotors = parseMotorsFromHTML(html, baseUrl);
      console.log(`📦 Found ${pageMotors.length} motors on page ${currentPage}`);
      
      if (pageMotors.length === 0) {
        consecutiveEmptyPages++;
        console.log(`ℹ️ No motors found on page ${currentPage} (${consecutiveEmptyPages} consecutive empty)`);
        
        if (consecutiveEmptyPages >= 3) {
          console.log(`⏹️ Stopping after ${consecutiveEmptyPages} consecutive pages with no motors`);
          break;
        }
      } else {
        consecutiveEmptyPages = 0; // Reset counter on successful page
        allMotors = allMotors.concat(pageMotors);
        console.log(`✅ Total motors collected so far: ${allMotors.length}`);
      }

      // Check for next page with enhanced validation
      const hasNext = hasNextPage(html);
      console.log(`🔄 Page ${currentPage} has next page: ${hasNext}`);
      
      if (!hasNext) {
        console.log(`🏁 Reached last page at page ${currentPage}`);
        break;
      }

      currentPage++;
      
      // Reduced rate limiting for v1 API - more reasonable delays
      const delay = Math.min(8000 + (currentPage * 500), 12000); // 8-12s delay, increasing per page
      console.log(`⏳ Waiting ${delay/1000}s before next page...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
    } catch (pageError) {
      console.error(`❌ Error processing page ${currentPage}:`, pageError.message);
      consecutiveEmptyPages++;
      
      if (consecutiveEmptyPages >= 3) {
        console.log(`⏹️ Too many consecutive errors, stopping`);
        break;
      }
      
      currentPage++;
      // Moderate delay after errors
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }

  console.log(`🎉 Firecrawl v1 scraping completed!`);
  console.log(`📊 Scraping summary:`);
  console.log(`   • Total motors found: ${allMotors.length}`);
  console.log(`   • Pages processed: ${currentPage - 1}`);
  console.log(`   • Max pages limit: ${maxPages}`);
  console.log(`   • Consecutive empty pages: ${consecutiveEmptyPages}`);
  
  if (allMotors.length === 0) {
    console.error(`❌ No motors were found. This could indicate:`);
    console.error(`   • Website structure changed`);
    console.error(`   • Firecrawl not rendering content properly`);
    console.error(`   • Inventory temporarily empty`);
    console.error(`   • Rate limiting or access restrictions`);
  }
  
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
        console.log('🧪 Testing Firecrawl v1 API with homepage...');
        const testUrl = 'https://www.harrisboatworks.ca';
        const result = await firecrawlScrape(testUrl, firecrawlApiKey);
        
        return new Response(JSON.stringify({
          success: true,
          url: testUrl,
          html_length: result.html?.length || 0,
          markdown_length: result.markdown?.length || 0,
          has_html: !!result.html,
          has_markdown: !!result.markdown,
          api_version: 'v1',
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (testError) {
        console.error('❌ Firecrawl v1 API test failed:', testError);
        return new Response(JSON.stringify({
          success: false,
          error: testError.message,
          error_type: testError.constructor.name,
          api_version: 'v1',
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