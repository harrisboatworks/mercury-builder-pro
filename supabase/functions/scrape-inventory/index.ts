import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

// UPDATED: Fixed inventory scraper with proper filtering - Version 2.0
// CORS headers - Updated with latest fixes
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Utility functions
async function fetchWithRetry(url: string, maxRetries = 3): Promise<string | null> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`🌐 Fetching (attempt ${i + 1}/${maxRetries}): ${url}`);
      const response = await fetch(url);
      
      // DEBUG: Log response details
      console.log(`📄 HTTP Response Status: ${response.status} ${response.statusText}`);
      console.log(`📄 Response Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`);
      
      if (response.ok) {
        const html = await response.text();
        console.log(`📄 HTML Length: ${html.length} characters`);
        console.log(`📄 First 500 chars: ${html.substring(0, 500)}`);
        console.log(`📄 Contains 'mercury': ${html.toLowerCase().includes('mercury')}`);
        console.log(`📄 Contains 'search-result': ${html.includes('search-result')}`);
        return html;
      } else {
        console.warn(`❌ HTTP ${response.status}: ${response.statusText} for ${url}`);
      }
    } catch (error) {
      console.warn(`Fetch attempt ${i + 1} failed:`, error);
    }
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  return null;
}

async function sendFailureAlert(subject: string, details: any) {
  try {
    const enabled = (Deno.env.get('ENABLE_EMAIL_ALERTS') || 'false').toLowerCase() === 'true';
    const apiKey = Deno.env.get('RESEND_API_KEY');
    
    console.warn(JSON.stringify({
      event: 'inventory_scrape_alert',
      subject,
      details,
      timestamp: new Date().toISOString(),
    }));

    if (!enabled || !apiKey) return;

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'alerts@harrisboatworks.local',
        to: [Deno.env.get('ALERT_EMAIL_TO') || 'admin@harrisboatworks.ca'],
        subject,
        html: `<pre>${JSON.stringify(details, null, 2)}</pre>`
      })
    });
  } catch (error) {
    console.error('Failed to send alert:', error);
  }
}

interface MotorData {
  id: string;
  make: string;
  model: string;
  year: number;
  base_price: number;
  motor_type: string;
  horsepower: number;
  engine_type?: string;
  image_url?: string;
  availability?: string;
  stock_number?: string;
  description?: string;
  features?: string[];
  specifications?: Record<string, any>;
  detail_url?: string;
  images?: Array<{
    url: string;
    type: string;
    source: 'scraped' | 'manual';
    scraped_at?: string;
  }>;
}

interface XMLItem {
  id: string;
  title: string;
  link: string;
  description: string;
  category?: string;
  price?: string;
  condition?: string;
  availability?: string;
  images?: string[];
}

// Main inventory scraping logic
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Get request body to check for XML preference
  let body = {};
  try {
    if (req.body) {
      body = await req.json();
    }
  } catch (e) {
    // Ignore JSON parsing errors, use default empty body
  }

  const forceXml = body.source === 'xml' || body.useXmlFeed === true;
  const xmlFeedUrl = 'https://www.harrisboatworks.ca/unitinventory_univ.xml';

  // Start tracking this inventory update
  const { data: trackingRecord, error: trackingError } = await supabase
    .from('inventory_updates')
    .insert({
      status: 'running',
      is_scheduled: req.headers.get('x-vercel-cron') === '1'
    })
    .select()
    .single();

  if (trackingError) {
    console.error('Failed to create tracking record:', trackingError);
  }

  try {
    console.log('🚀 Starting inventory scrape...');
    
    // Performance metrics tracking
    const scrapingStats = {
      startTime: Date.now(),
      endTime: null,
      xmlMotorsFound: 0,
      htmlMotorsFound: 0,
      brochureModelsFound: 0,
      inStockModelsFound: 0,
      pagesScraped: 0,
      errors: [],
      duration: null,
      source: 'unknown'
    };
    
    let allMotors: MotorData[] = [];

    // Try XML feed first, fallback to HTML scraping
    let useXmlSuccess = false;
    
    if (forceXml || Math.random() > 0.5) { // 50% chance to try XML first, or forced
      console.log('📡 Attempting XML feed scraping...');
      try {
        const xmlMotors = await scrapeXMLInventory(xmlFeedUrl);
        if (xmlMotors && xmlMotors.length > 0) {
          allMotors = xmlMotors;
          useXmlSuccess = true;
          scrapingStats.xmlMotorsFound = xmlMotors.length;
          scrapingStats.inStockModelsFound = xmlMotors.filter(m => m.availability === 'In Stock' || m.availability === 'Available').length;
          scrapingStats.source = 'xml';
          console.log(`✅ XML scraping successful: ${xmlMotors.length} Mercury motors found (${scrapingStats.inStockModelsFound} in-stock)`);
        } else {
          console.log('⚠️ XML scraping returned no Mercury motors, falling back to HTML');
        }
      } catch (xmlError) {
        console.warn('⚠️ XML scraping failed, falling back to HTML:', xmlError);
        scrapingStats.errors.push(`XML Error: ${xmlError.message}`);
      }
    }

    // Fallback to HTML scraping if XML failed or wasn't attempted - BROCHURE ONLY
    if (!useXmlSuccess) {
      console.log('🌐 Using HTML scraping for BROCHURE models only...');
      let page = 1;
      let totalBrochureModels = 0;
      let totalInStockModels = 0;
      let totalPagesScraped = 0;
      const baseUrl = 'https://www.harrisboatworks.ca';
      // Updated URL with higher results per page to capture more models
      const inventoryUrl = `${baseUrl}/search/inventory/type/Outboard%20Motors/usage/New/sort/price-low?resultsperpage=200`;

      while (true) {
        const pageUrl = page === 1 ? inventoryUrl : `${inventoryUrl}&page=${page}`;
        console.log(`📄 Fetching Mercury brochure models page ${page}: ${pageUrl}`);

        const pageData = await fetchWithRetry(pageUrl, 3);
        if (!pageData) {
          console.error(`❌ Failed to fetch page ${page} after retries`);
          break;
        }

        const pageMotors = parseBrochureMotorData(pageData, baseUrl);
        const brochureCount = pageMotors.filter(m => m.availability === 'Brochure').length;
        const inStockCount = pageMotors.filter(m => m.availability === 'In Stock').length;
        
        totalBrochureModels += brochureCount;
        totalInStockModels += inStockCount;
        totalPagesScraped++;
        
        console.log(`⚙️ Page ${page} results: ${pageMotors.length} total motors (${brochureCount} brochure, ${inStockCount} in-stock)`);
        console.log(`📊 Running totals: ${totalBrochureModels} brochure, ${totalInStockModels} in-stock across ${totalPagesScraped} pages`);

        if (pageMotors.length === 0) {
          console.log('📋 No more motors found, stopping pagination');
          break;
        }

        allMotors = allMotors.concat(pageMotors);
        
        // Enhanced pagination detection
        const hasNextPage = checkForNextPage(pageData, page);
        
        if (!hasNextPage) {
          console.log('📄 No next page found, stopping pagination');
          break;
        }

        page++;
        
        // Safety check to prevent infinite loops (increased limit for more models)
        if (page > 50) {
          console.log('⚠️ Reached page limit (50), stopping');
          break;
        }

        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      // Final summary logging
      console.log(`🎯 FINAL SCRAPING SUMMARY:`);
      console.log(`   📑 Total Pages Scraped: ${totalPagesScraped}`);
      console.log(`   📚 Brochure Models Found: ${totalBrochureModels}`);
      console.log(`   📦 In-Stock Models Found: ${totalInStockModels}`);
      console.log(`   🔢 Total Motors Collected: ${allMotors.length}`);
    }

    console.log(`🔍 Total motors found before hydration: ${allMotors.length}`);

    // Hydrate with detailed specs (limit for performance)
    console.log('💧 Starting hydration with detailed specs...');
    const hydratedMotors = await hydrateWithDetails(allMotors.slice(0, 100));
    
    console.log(`💧 Hydration complete. Processing ${hydratedMotors.length} motors`);

    // Clear existing data and insert new data
    const { error: deleteError } = await supabase
      .from('motor_models')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
      console.error('❌ Error clearing existing data:', deleteError);
      throw deleteError;
    }

    // Insert new data in batches with detailed error logging
    const batchSize = 10;
    let insertedCount = 0;
    
    for (let i = 0; i < hydratedMotors.length; i += batchSize) {
      const batch = hydratedMotors.slice(i, i + batchSize);
      
      console.log(`🔄 Inserting batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(hydratedMotors.length/batchSize)}`);
      console.log(`📦 Batch contains ${batch.length} motors:`, batch.map(m => `${m.model} (${m.horsepower}HP, $${m.base_price})`));
      
      const { data: insertResult, error: insertError } = await supabase
        .from('motor_models')
        .insert(batch)
        .select('id, model');

      if (insertError) {
        console.error(`❌ Error inserting batch ${Math.floor(i/batchSize) + 1}:`, insertError);
        console.error(`📋 Failed batch data sample:`, batch[0]);
        scrapingStats.errors.push(`Batch ${Math.floor(i/batchSize) + 1} insert error: ${insertError.message}`);
        
        // Try to continue with remaining batches
        continue;
      }
      
      insertedCount += batch.length;
      console.log(`✅ Successfully inserted batch ${Math.floor(i/batchSize) + 1}: ${insertResult?.length || batch.length} motors`);
      console.log(`📊 Progress: ${insertedCount}/${hydratedMotors.length} motors inserted`);
    }

    // Trigger price scraping
    console.log('💰 Triggering price scrape...');
    try {
      const { error: priceError } = await supabase.functions.invoke('scrape-motor-prices', {
        body: { trigger: 'post-inventory-update' }
      });
      
      if (priceError) {
        console.warn('⚠️ Price scrape failed:', priceError);
      } else {
        console.log('✅ Price scrape triggered successfully');
      }
    } catch (priceErr) {
      console.warn('⚠️ Price scrape trigger failed:', priceErr);
    }

    // Update tracking record with completion
    if (trackingRecord) {
      await supabase
        .from('inventory_updates')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          motors_updated: insertedCount,
          data_source_errors: useXmlSuccess ? { xml: null, html: null } : { xml: 'fallback_used', html: null }
        })
        .eq('id', trackingRecord.id);
    }

    console.log(`🎉 Inventory scrape completed successfully!`);
    console.log(`📊 Summary:`);
    console.log(`   • Source: ${useXmlSuccess ? 'XML Feed' : 'HTML Scraping'}`);
    console.log(`   • Motors found: ${allMotors.length}`);
    console.log(`   • Motors hydrated: ${hydratedMotors.length}`);
    console.log(`   • Motors inserted: ${insertedCount}`);
    console.log(`   • Duration: ${(scrapingStats.duration / 1000).toFixed(2)}s`);
    console.log(`   • Success Rate: ${scrapingStats.errors.length === 0 ? '100%' : `${((allMotors.length / (allMotors.length + scrapingStats.errors.length)) * 100).toFixed(1)}%`}`);

    return new Response(JSON.stringify({
      success: true,
      summary: {
        source: useXmlSuccess ? 'xml' : 'html',
        motors_found: allMotors.length,
        motors_hydrated: hydratedMotors.length,
        motors_inserted: insertedCount,
        brochure_models_found: scrapingStats.brochureModelsFound,
        in_stock_models_found: scrapingStats.inStockModelsFound,
        pages_scraped: scrapingStats.pagesScraped,
        duration_seconds: (scrapingStats.duration / 1000).toFixed(2),
        errors_count: scrapingStats.errors.length,
        validation_passed: scrapingStats.brochureModelsFound >= 80 || useXmlSuccess,
        timestamp: new Date().toISOString()
      },
      performance: scrapingStats
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Scraping failed:', error);

    // Update tracking record with error
    if (trackingRecord) {
      await supabase
        .from('inventory_updates')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error.message
        })
        .eq('id', trackingRecord.id);
    }

    // Send failure alert for critical errors
    try {
      await sendFailureAlert(error.message, {
        timestamp: new Date().toISOString(),
        error: error.stack || error.message
      });
    } catch (alertError) {
      console.error('Failed to send failure alert:', alertError);
    }

    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// XML Feed Scraping Function
async function scrapeXMLInventory(xmlUrl: string): Promise<MotorData[]> {
  console.log(`📡 Fetching XML feed: ${xmlUrl}`);
  
  const response = await fetchWithRetry(xmlUrl, 3);
  if (!response) {
    throw new Error('Failed to fetch XML feed');
  }

  console.log('🔍 Parsing XML content...');
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(response, 'text/xml');
  
  if (!xmlDoc) {
    throw new Error('Failed to parse XML content');
  }

  const items = xmlDoc.querySelectorAll('item');
  console.log(`📦 Found ${items.length} total items in XML feed`);

  const mercuryMotors: MotorData[] = [];
  let filteredCount = 0;

  for (const item of items) {
    try {
      const xmlItem = parseXMLItem(item);
      if (!xmlItem) continue;

      // Filter for Mercury outboard motors only
      if (isMercuryOutboardMotor(xmlItem)) {
        const motorData = convertXMLToMotorData(xmlItem);
        if (motorData) {
          mercuryMotors.push(motorData);
        }
      } else {
        filteredCount++;
      }
    } catch (error) {
      console.warn('⚠️ Error parsing XML item:', error);
    }
  }

  console.log(`🎣 Filtered to ${mercuryMotors.length} Mercury outboard motors (${filteredCount} non-motor items excluded)`);
  return mercuryMotors;
}

// Parse individual XML item
function parseXMLItem(item: Element): XMLItem | null {
  try {
    const id = item.querySelector('id')?.textContent?.trim() || '';
    const title = item.querySelector('title')?.textContent?.trim() || '';
    const link = item.querySelector('link')?.textContent?.trim() || '';
    const description = item.querySelector('description')?.textContent?.trim() || '';
    const category = item.querySelector('category')?.textContent?.trim() || '';
    const price = item.querySelector('price')?.textContent?.trim() || '';
    const condition = item.querySelector('condition')?.textContent?.trim() || '';
    const availability = item.querySelector('availability')?.textContent?.trim() || 'Available';

    // Extract images from description or dedicated image fields
    const images: string[] = [];
    const imgMatches = description.match(/https?:\/\/[^\s\"'>]+\.(?:jpg|jpeg|png|gif|webp)/gi);
    if (imgMatches) {
      images.push(...imgMatches);
    }

    return {
      id,
      title,
      link,
      description,
      category,
      price,
      condition,
      availability,
      images
    };
  } catch (error) {
    console.warn('Error parsing XML item:', error);
    return null;
  }
}

// Check if item is a Mercury outboard motor
function isMercuryOutboardMotor(item: XMLItem): boolean {
  const title = item.title.toLowerCase();
  const description = item.description.toLowerCase();
  const category = (item.category || '').toLowerCase();

  // Must contain "mercury" and "outboard" or specific motor indicators
  const hasMercury = title.includes('mercury') || description.includes('mercury');
  const hasOutboard = title.includes('outboard') || description.includes('outboard') || 
                     title.includes('fourstroke') || title.includes('verado') || 
                     title.includes('pro xs') || title.includes('pro-xs');

  // Exclude boats, pontoons, trailers, and accessories
  const excludeTerms = [
    'boat', 'pontoon', 'trailer', 'parts', 'prop', 'propeller', 
    'hull', 'deck', 'cabin', 'cuddy', 'bowrider', 'runabout',
    'ski', 'wake', 'fishing boat', 'bass boat', 'aluminum boat'
  ];
  
  const hasExcludedTerms = excludeTerms.some(term => 
    title.includes(term) || description.includes(term) || category.includes(term)
  );

  // Must be new condition (not used)
  const isNew = !title.includes('used') && !title.includes('pre-owned') && 
                (item.condition === '' || item.condition?.toLowerCase().includes('new'));

  return hasMercury && hasOutboard && !hasExcludedTerms && isNew;
}

// Convert XML item to MotorData format
function convertXMLToMotorData(item: XMLItem): MotorData | null {
  try {
    const title = item.title;
    const description = item.description;

    // Extract year (default to 2025 if not found)
    const yearMatch = title.match(/(\d{4})/);
    const year = yearMatch ? parseInt(yearMatch[1]) : 2025;

    // Extract horsepower
    const hpMatch = title.match(/(\d+\.?\d*)\s*hp/i) || description.match(/(\d+\.?\d*)\s*hp/i);
    const horsepower = hpMatch ? parseFloat(hpMatch[1]) : 0;

    if (horsepower === 0) {
      console.warn(`⚠️ Could not extract horsepower from: ${title}`);
      return null;
    }

    // Extract motor model
    let model = title;
    if (title.toLowerCase().includes('mercury')) {
      const mercuryIndex = title.toLowerCase().indexOf('mercury');
      model = title.substring(mercuryIndex).trim();
    }

    // Determine motor type
    const motorType = getMotorTypeFromTitle(title);

    // Extract price
    let basePrice = 0;
    const priceMatch = (item.price || description).match(/\$?([\d,]+\.?\d*)/);
    if (priceMatch) {
      basePrice = parseFloat(priceMatch[1].replace(/,/g, ''));
    }

    // Extract images
    const images = item.images?.map((url, index) => ({
      url: toAbsoluteUrl(url, 'https://www.harrisboatworks.ca'),
      type: index === 0 ? 'main' : 'detail',
      source: 'scraped' as const,
      scraped_at: new Date().toISOString()
    })) || [];

    const motorData: MotorData = {
      id: crypto.randomUUID(),
      make: 'Mercury',
      model: model,
      year: year,
      base_price: basePrice,
      motor_type: motorType,
      horsepower: horsepower,
      image_url: images[0]?.url || null,
      availability: item.availability || 'Available',
      description: description.substring(0, 500), // Limit description length
      detail_url: item.link,
      images: images,
    };

    return motorData;
  } catch (error) {
    console.warn('Error converting XML item to motor data:', error);
    return null;
  }
}

// Determine motor type from title - FIXED to always return valid type
function getMotorTypeFromTitle(title: string): string {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('verado')) return 'Verado';
  if (titleLower.includes('pro xs') || titleLower.includes('pro-xs') || titleLower.includes('proxs')) return 'ProXS';
  if (titleLower.includes('fourstroke') || titleLower.includes('four stroke')) return 'FourStroke';
  if (titleLower.includes('racing')) return 'Racing';
  if (titleLower.includes('command thrust')) return 'Command Thrust';
  
  // Default fallback - never return empty
  return 'Outboard';
}

// Convert relative URLs to absolute
function toAbsoluteUrl(url: string, baseUrl: string): string {
  if (url.startsWith('http')) return url;
  if (url.startsWith('//')) return 'https:' + url;
  if (url.startsWith('/')) return baseUrl + url;
  return baseUrl + '/' + url;
}

// HTML parsing for BROCHURE motors only - fixed CSS selectors
function parseBrochureMotorData(html: string, baseUrl: string): MotorData[] {
  // DEBUG: Log raw HTML response details
  console.log(`📄 Raw HTML Length: ${html.length} characters`);
  console.log(`📄 First 500 chars of HTML: ${html.substring(0, 500)}`);
  console.log(`📄 Contains 'mercury' (case insensitive): ${html.toLowerCase().includes('mercury')}`);
  console.log(`📄 Contains 'search-result': ${html.includes('search-result')}`);
  console.log(`📄 Contains 'panel': ${html.includes('panel')}`);
  console.log(`📄 Contains 'new-models': ${html.includes('new-models')}`);
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  if (!doc) {
    console.error('Failed to parse HTML');
    return [];
  }

  const motors: MotorData[] = [];
  
  // DEBUG: Test multiple selector strategies
  const motorElements1 = doc.querySelectorAll('.panel.search-result');
  const motorElements2 = doc.querySelectorAll('.search-result');
  const motorElements3 = doc.querySelectorAll('.panel');
  const motorElements4 = doc.querySelectorAll('[class*="search"]');
  const motorElements5 = doc.querySelectorAll('[class*="result"]');
  const motorElements6 = doc.querySelectorAll('[class*="motor"]');
  const motorElements7 = doc.querySelectorAll('[class*="inventory"]');
  
  console.log(`🔍 SELECTOR DEBUG:`);
  console.log(`  .panel.search-result: ${motorElements1.length} elements`);
  console.log(`  .search-result: ${motorElements2.length} elements`);
  console.log(`  .panel: ${motorElements3.length} elements`);
  console.log(`  [class*="search"]: ${motorElements4.length} elements`);
  console.log(`  [class*="result"]: ${motorElements5.length} elements`);
  console.log(`  [class*="motor"]: ${motorElements6.length} elements`);
  console.log(`  [class*="inventory"]: ${motorElements7.length} elements`);
  
  // Try to find any elements with common inventory classes
  const allDivs = doc.querySelectorAll('div[class]');
  console.log(`📊 Total divs with classes: ${allDivs.length}`);
  
  // Sample some class names to understand page structure
  const classNames = Array.from(allDivs).slice(0, 10).map(el => el.className).filter(cn => cn);
  console.log(`📊 Sample class names: ${JSON.stringify(classNames)}`);
  
  // Look for motor listings in the HTML - updated selectors for actual website structure
  const motorElements = doc.querySelectorAll('.panel.search-result, .search-result');
  
  console.log(`🔍 Found ${motorElements.length} potential motor elements`);
  
  for (const element of motorElements) {
    try {
      // Look for the motor title in the results heading
      const titleElement = element.querySelector('h3.results-heading a, .results-heading a');
      const title = titleElement?.textContent?.trim() || '';
      
      // Skip if not a Mercury motor or if no title found
      if (!title || !title.toLowerCase().includes('mercury')) {
        continue;
      }

      console.log(`🔍 Processing motor: ${title}`);
      
      // Get the detail URL and check if it's a brochure model
      const linkElement = element.querySelector('a[href*="inventory"]');
      const detailUrl = linkElement ? toAbsoluteUrl(linkElement.getAttribute('href') || '', baseUrl) : '';
      
      // Check availability text to determine if this is a brochure model
      const availabilityElement = element.querySelector('.availability, .stock-status, .motor-availability, [class*="availability"], [class*="stock"]');
      const initialAvailabilityText = availabilityElement?.textContent?.trim() || '';
      
      // Only process brochure models for HTML scraping (skip in-stock models)
      if (initialAvailabilityText.toLowerCase().includes('in stock')) {
        console.log(`⏭️ Skipping in-stock model: ${initialAvailabilityText}`);
        continue;
      }
      
      // If it contains "brochure" or doesn't have availability info, treat as brochure model
      const isBrochureModel = initialAvailabilityText.toLowerCase().includes('brochure') || !initialAvailabilityText;
      if (!isBrochureModel) {
        console.log(`⏭️ Skipping non-brochure model: ${initialAvailabilityText}`);
        continue;
      }
      
      console.log(`✅ Processing brochure model with availability: ${initialAvailabilityText || 'No availability info'}`);
      
      // Extract brochure URL (optional for brochure models)
      const brochureLinks = element.querySelectorAll('a[href*="brochure"], a[href*=".pdf"]');
      const brochureUrl = brochureLinks.length > 0 ? brochureLinks[0].getAttribute('href') : '';
      
      // Extract price from display price or JSON data
      let basePrice = 0;
      const priceElement = element.querySelector('[itemprop="price"], .display-price-box span');
      if (priceElement) {
        const priceText = priceElement.textContent?.trim() || '';
        console.log(`💰 Raw price text: "${priceText}"`);
        
        // Clean and extract numeric price
        const numericMatch = priceText.match(/\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
        if (numericMatch) {
          basePrice = parseFloat(numericMatch[1].replace(',', ''));
          console.log(`💰 Parsed price: $${basePrice}`);
        }
      }
      
      // Skip if no price is found for brochure models
      if (basePrice === 0) {
        console.log(`⏭️ Skipping motor with no price: ${title}`);
        continue;
      }
      
      // Skip empty or invalid titles
      if (!title || title.length < 3) {
        console.log(`⏭️ Skipping invalid title: "${title}"`);
        continue;
      }
      
      // Extract year (default to current year)
      const yearMatch = title.match(/(\d{4})/);
      const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
      
      // FIXED: Detect availability using proper DOM traversal instead of :contains()
      let availability = 'Brochure'; // Default for brochure models
      let availabilityText = '';
      
      // Look for status in label elements
      const statusLabel = element.querySelector('.label-success, .label-warning, .label-danger, .label');
      const statusText = statusLabel?.textContent?.trim().toLowerCase() || '';
      
      // FIXED: Find availability in table rows using proper DOM traversal
      const tableRows = element.querySelectorAll('table tr');
      for (const row of tableRows) {
        const cells = row.querySelectorAll('td');
        for (let i = 0; i < cells.length - 1; i++) {
          const cellText = cells[i].textContent?.trim().toLowerCase() || '';
          if (cellText.includes('availability')) {
            availabilityText = cells[i + 1]?.textContent?.trim().toLowerCase() || '';
            break;
          }
        }
        if (availabilityText) break;
        
        // Also check for strong tags in cells
        const strongElements = row.querySelectorAll('strong');
        for (const strong of strongElements) {
          if (strong.textContent?.trim().toLowerCase().includes('availability')) {
            const parentCell = strong.closest('td');
            if (parentCell && parentCell.nextElementSibling) {
              availabilityText = parentCell.nextElementSibling.textContent?.trim().toLowerCase() || '';
              break;
            }
          }
        }
        if (availabilityText) break;
      }
      
      // Combine all status indicators
      const allStatusText = `${statusText} ${availabilityText}`.toLowerCase();
      
      console.log(`📊 Status text for ${title}: "${allStatusText}"`);
      
      // CRITICAL FILTER: Skip any "In Stock" items - those come from XML
      if (allStatusText.includes('in stock')) {
        console.log(`⏭️ Skipping IN STOCK item (handled by XML): ${title}`);
        continue;
      }
      
      // Set availability for brochure items
      if (allStatusText.includes('brochure') || allStatusText.includes('order') || allStatusText.includes('custom order')) {
        availability = 'Brochure';
      } else if (allStatusText.includes('available')) {
        availability = 'Brochure'; // Treat as brochure since it's from /new-models/
      } else if (allStatusText.includes('sold') || allStatusText.includes('out of stock') || allStatusText.includes('unavailable')) {
        availability = 'Sold';
      }

      // Extract stock number if available (usually null for brochure items)
      let stockNumber = null;
      if (jsonData && jsonData.stockNumber) {
        stockNumber = jsonData.stockNumber;
      } else {
        // FIXED: Find stock number using proper DOM traversal
        for (const row of tableRows) {
          const strongElements = row.querySelectorAll('strong');
          for (const strong of strongElements) {
            if (strong.textContent?.trim().toLowerCase().includes('stock')) {
              const parentCell = strong.closest('td');
              if (parentCell && parentCell.nextElementSibling) {
                stockNumber = parentCell.nextElementSibling.textContent?.trim() || null;
                break;
              }
            }
          }
          if (stockNumber) break;
        }
      }
      
      
      // CRITICAL FIX: Validate all required fields before creating motor data
      if (!title.trim()) {
        console.log(`⏭️ Skipping motor with empty title`);
        continue;
      }
      
      const motorType = getMotorTypeFromTitle(title);
      if (!motorType) {
        console.log(`⏭️ Skipping motor with no motor type: ${title}`);
        continue;
      }
      
      console.log(`✅ Creating motor data for: ${title} (HP: ${horsepower}, Price: $${basePrice}, Type: ${motorType})`);
      
      const motorData: MotorData = {
        id: crypto.randomUUID(),
        make: 'Mercury',
        model: title.trim(),
        year: year,
        base_price: basePrice,
        motor_type: motorType,
        horsepower: horsepower,
        image_url: imageUrl || null,
        availability: availability,
        stock_quantity: 0, // Brochure items have no stock
        stock_number: stockNumber,
        inventory_source: 'html',
        last_stock_check: new Date().toISOString(),
        detail_url: detailUrl || null,
        description: title.substring(0, 500), // Add description
        engine_type: motorType.includes('FourStroke') ? 'FourStroke' : null,
        images: imageUrl ? [{
          url: imageUrl,
          type: 'main',
          source: 'scraped' as const,
          scraped_at: new Date().toISOString()
        }] : [],
        features: [], // Initialize as empty array
        specifications: {}, // Initialize as empty object
        last_scraped: new Date().toISOString()
      };
      
      motors.push(motorData);
      console.log(`✅ Added BROCHURE motor: ${title} - ${availability} (HP: ${horsepower}, Price: $${basePrice})`);
    } catch (error) {
      console.warn('Error parsing motor element:', error);
    }
  }
  
  console.log(`🏁 Processed ${motors.length} motors from HTML`);
  return motors;
}

async function hydrateWithDetails(motors: MotorData[]): Promise<MotorData[]> {
  const hydratedMotors: MotorData[] = [];
  
  for (const motor of motors) {
    try {
      // If we have a detail URL, try to fetch additional information
      if (motor.detail_url) {
        const detailHtml = await fetchWithRetry(motor.detail_url, 2);
        if (detailHtml) {
          const parser = new DOMParser();
          const detailDoc = parser.parseFromString(detailHtml, 'text/html');
          
          if (detailDoc) {
            // Extract additional specifications
            const specElements = detailDoc.querySelectorAll('.spec, .specification, .feature');
            const specifications: Record<string, any> = {};
            
            for (const spec of specElements) {
              const label = spec.querySelector('.label, .spec-label')?.textContent?.trim();
              const value = spec.querySelector('.value, .spec-value')?.textContent?.trim();
              if (label && value) {
                specifications[label] = value;
              }
            }
            
            // Extract additional images
            const additionalImages = detailDoc.querySelectorAll('img[src*="motor"], img[src*="engine"], img[src*="outboard"]');
            const images = motor.images || [];
            
            for (const img of additionalImages) {
              const src = img.getAttribute('src');
              if (src && !images.some(existing => existing.url === src)) {
                images.push({
                  url: toAbsoluteUrl(src, 'https://www.harrisboatworks.ca'),
                  type: 'detail',
                  source: 'scraped' as const,
                  scraped_at: new Date().toISOString()
                });
              }
            }
            
            motor.specifications = specifications;
            motor.images = images;
          }
        }
      }
      
      hydratedMotors.push(motor);
      
      // Add small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.warn(`Error hydrating motor ${motor.model}:`, error);
      // Still add the motor even if hydration fails
      hydratedMotors.push(motor);
    }
  }
  
  return hydratedMotors;
}

// Enhanced pagination detection function
function checkForNextPage(html: string, currentPage: number): boolean {
  // Multiple ways to detect if there's a next page
  const nextPageIndicators = [
    'Next Page',
    'aria-label="Next"',
    'class="next"',
    'rel="next"',
    `page=${currentPage + 1}`,
    `>Next</`,
    `>${currentPage + 1}</`,
    'pagination-next',
    'page-next'
  ];
  
  // Check for "Showing X of Y results" pattern to determine total
  const resultsPattern = /showing\s+\d+\s*-?\s*\d+\s+of\s+(\d+)/i;
  const resultsMatch = html.match(resultsPattern);
  if (resultsMatch) {
    const totalResults = parseInt(resultsMatch[1]);
    const resultsPerPage = 200; // Our current setting
    const expectedPages = Math.ceil(totalResults / resultsPerPage);
    console.log(`📊 Found ${totalResults} total results, expecting ${expectedPages} pages`);
    
    if (currentPage < expectedPages) {
      console.log(`📄 Page ${currentPage} of ${expectedPages} - continuing`);
      return true;
    }
  }
  
  // Check for any next page indicators
  const hasNextIndicator = nextPageIndicators.some(indicator => 
    html.toLowerCase().includes(indicator.toLowerCase())
  );
  
  if (hasNextIndicator) {
    console.log(`📄 Next page indicator found on page ${currentPage}`);
    return true;
  }
  
  // Check for numbered pagination links beyond current page
  const pageNumberPattern = new RegExp(`page=(${currentPage + 1}|${currentPage + 2})`, 'g');
  const hasNextPageNumber = pageNumberPattern.test(html);
  
  if (hasNextPageNumber) {
    console.log(`📄 Next page number found after page ${currentPage}`);
    return true;
  }
  
  console.log(`📄 No next page indicators found for page ${currentPage}`);
  return false;
}
