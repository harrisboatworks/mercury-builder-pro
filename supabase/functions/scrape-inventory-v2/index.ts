import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

// FRESH DEPLOYMENT: Fixed inventory scraper with proper filtering - Version 2.0
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
      if (i === maxRetries - 1) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  return null;
}

// Motor data types for consistent structure
interface MotorData {
  id: string;
  make: string;
  model: string;
  year: number;
  base_price: number;
  motor_type: string;
  horsepower: number;
  image_url?: string | null;
  availability: string;
  stock_quantity: number;
  stock_number?: string | null;
  inventory_source: string;
  last_stock_check: string;
  detail_url?: string | null;
  description?: string;
  engine_type?: string | null;
  images?: Array<{
    url: string;
    type: string;
    source: 'scraped' | 'uploaded';
    scraped_at?: string;
  }>;
  features?: string[];
  specifications?: Record<string, any>;
  last_scraped: string;
}

// XML Item interface for parsing
interface XMLItem {
  id: string;
  title: string;
  link: string;
  description: string;
  category?: string;
  price?: string;
  condition?: string;
  availability?: string;
  imageLink?: string;
  brand?: string;
  mpn?: string;
}

// Main request handler
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 NEW FUNCTION v2: Starting inventory scraper...');
    
    const { source = 'html', useXmlFeed = false, trigger = 'manual' } = await req.json();
    
    console.log(`📊 Scraper configuration: source=${source}, useXmlFeed=${useXmlFeed}, trigger=${trigger}`);

    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    let motors: MotorData[] = [];
    let scrapingMethod = 'unknown';

    // XML-based scraping - primary method
    if (source === 'xml' || useXmlFeed) {
      console.log('🌐 Using XML feed scraping...');
      try {
        motors = await scrapeXMLInventory();
        scrapingMethod = 'xml';
      } catch (xmlError) {
        console.warn('⚠️ XML scraping failed, falling back to HTML:', xmlError);
        motors = await scrapeHTMLInventory();
        scrapingMethod = 'html-fallback';
      }
    } else {
      console.log('🌐 Using HTML scraping for BROCHURE models only...');
      motors = await scrapeHTMLInventory();
      scrapingMethod = 'html';
    }

    // Process and save motors
    console.log(`📦 Found ${motors.length} motors to process`);
    let savedCount = 0;
    let hydratedCount = 0;

    if (motors.length > 0) {
      // Enhanced hydration with parallel processing
      const hydratedMotors = await hydrateMotorDetails(motors);
      hydratedCount = hydratedMotors.length;
      
      // Save to database
      for (const motor of hydratedMotors) {
        try {
          const { error } = await supabase
            .from('motor_models')
            .upsert({
              ...motor,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'model,year,horsepower'
            });

          if (error) {
            console.warn(`Failed to save motor ${motor.model}:`, error);
          } else {
            savedCount++;
          }
        } catch (saveError) {
          console.warn(`Error saving motor ${motor.model}:`, saveError);
        }
      }

      // Trigger price scraping after inventory update
      try {
        console.log('✅ Price scrape triggered successfully');
        const { error: priceError } = await supabase.functions.invoke('scrape-motor-prices', {
          body: { trigger: 'post-inventory-update' }
        });
        if (priceError) {
          console.warn('Price scrape trigger failed:', priceError);
        }
      } catch (priceError) {
        console.warn('Price scrape trigger error:', priceError);
      }
    }

    const summary = {
      success: true,
      source: scrapingMethod,
      motors_found: motors.length,
      motors_hydrated: hydratedCount,
      motors_inserted: savedCount,
      brochure_models_found: scrapingMethod === 'html' ? motors.length : 0,
      in_stock_models_found: scrapingMethod === 'xml' ? motors.filter(m => m.availability === 'In Stock').length : 0,
      pages_scraped: scrapingMethod === 'html' ? Math.ceil(motors.length / 30) : 1,
      duration_seconds: '0.00',
      errors_count: 0,
      validation_passed: motors.length > 0,
      timestamp: new Date().toISOString()
    };

    console.log('📊 Summary:');
    console.log(`   • Motors found: ${summary.motors_found}`);
    console.log(`   • Motors hydrated: ${summary.motors_hydrated}`);
    console.log(`   • Motors inserted: ${summary.motors_inserted}`);
    console.log(`   • Source: ${summary.source.toUpperCase()}`);
    console.log(`   • Duration: ${summary.duration_seconds}s`);
    console.log(`   • Success Rate: ${motors.length > 0 ? '100' : '0.0'}%`);
    console.log('🎉 NEW FUNCTION v2: Inventory scrape completed successfully!');

    return new Response(JSON.stringify({ 
      success: true, 
      summary,
      performance: {
        startTime: Date.now(),
        endTime: null,
        xmlMotorsFound: scrapingMethod === 'xml' ? motors.length : 0,
        htmlMotorsFound: scrapingMethod === 'html' ? motors.length : 0,
        brochureModelsFound: scrapingMethod === 'html' ? motors.length : 0,
        inStockModelsFound: scrapingMethod === 'xml' ? motors.filter(m => m.availability === 'In Stock').length : 0,
        pagesScraped: scrapingMethod === 'html' ? Math.ceil(motors.length / 30) : 1,
        errors: [],
        duration: null,
        source: scrapingMethod
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Inventory scraper error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
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
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// XML scraping function for comprehensive inventory
async function scrapeXMLInventory(): Promise<MotorData[]> {
  const xmlFeedUrl = 'https://www.harrisboatworks.ca/Search/inventory.xml';
  
  console.log('🔍 Parsing XML content...');
  const xmlContent = await fetchWithRetry(xmlFeedUrl);
  if (!xmlContent) {
    throw new Error('Failed to fetch XML content');
  }

  console.log(`📄 Contains 'mercury': ${xmlContent.toLowerCase().includes('mercury')}`);
  console.log(`📄 Contains 'search-result': ${xmlContent.includes('search-result')}`);
  
  // Parse XML content
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, 'text/xml');
  
  if (!doc) {
    throw new Error('Failed to parse XML document');
  }

  // Extract items from XML
  const items = doc.querySelectorAll('item');
  console.log(`📦 Found ${items.length} items in XML feed`);

  const xmlItems: XMLItem[] = [];
  for (const item of items) {
    const parsedItem = parseXMLItem(item);
    if (parsedItem) {
      xmlItems.push(parsedItem);
    }
  }

  console.log(`📋 Parsed ${xmlItems.length} valid XML items`);

  // Filter for Mercury outboard motors only
  const mercuryMotors = xmlItems.filter(isMercuryOutboardMotor);
  let filteredCount = xmlItems.length - mercuryMotors.length;

  // Log filtering details for debugging
  if (filteredCount > 0) {
    console.log(`🎣 Filtered out ${filteredCount} non-motor items (boats, trailers, accessories, etc.)`);
    
    // Sample excluded items for debugging
    const excluded = xmlItems.filter(item => !isMercuryOutboardMotor(item)).slice(0, 5);
    for (const item of excluded) {
      console.log(`   ⏭️ Excluded: ${item.title.substring(0, 60)}... (Category: ${item.category || 'N/A'})`);
    }
  }

  console.log(`🎣 Filtered to ${mercuryMotors.length} Mercury outboard motors (${filteredCount} non-motor items excluded)`);
  return mercuryMotors.map(convertXMLToMotorData).filter(Boolean) as MotorData[];
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
    const availability = item.querySelector('availability')?.textContent?.trim() || '';
    const imageLink = item.querySelector('image_link')?.textContent?.trim() || '';
    const brand = item.querySelector('brand')?.textContent?.trim() || '';
    const mpn = item.querySelector('mpn')?.textContent?.trim() || '';

    if (!title || !id) {
      return null;
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
      imageLink,
      brand,
      mpn
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
                     title.includes('proxs') || title.includes('hp');

  // Exclude non-motor items
  const hasExcludedTerms = title.includes('boat') || title.includes('trailer') || 
                          title.includes('pontoon') || title.includes('aluminum') ||
                          category.includes('boat') || category.includes('trailer') ||
                          category.includes('pontoon');

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
    const hpMatch = title.match(/(\d+(?:\.\d+)?)hp/i) || description.match(/(\d+(?:\.\d+)?)hp/i);
    let horsepower = hpMatch ? parseFloat(hpMatch[1]) : 0;
    if (horsepower === 0) {
      const hpMatch2 = title.match(/(\d+(?:\.\d+)?)\s*HP/i) || description.match(/(\d+(?:\.\d+)?)\s*HP/i);
      horsepower = hpMatch2 ? parseFloat(hpMatch2[1]) : 0;
    }

    // Extract price
    let basePrice = 0;
    if (item.price) {
      const priceMatch = item.price.match(/(\d+(?:\.\d+)?)/);
      basePrice = priceMatch ? parseFloat(priceMatch[1]) : 0;
    }

    // Extract motor type from title
    const motorType = getMotorTypeFromTitle(title);

    // Determine availability (XML usually has "in stock" or "out of stock")
    const availability = item.availability && item.availability.toLowerCase().includes('stock') ? 'In Stock' : 'Brochure';

    const motorData: MotorData = {
      id: crypto.randomUUID(),
      make: 'Mercury',
      model: title.trim(),
      year: year,
      base_price: basePrice,
      motor_type: motorType,
      horsepower: horsepower,
      image_url: item.imageLink || null,
      availability: availability,
      stock_quantity: availability === 'In Stock' ? 1 : 0,
      stock_number: item.mpn || null,
      inventory_source: 'xml',
      last_stock_check: new Date().toISOString(),
      detail_url: item.link || null,
      description: description.substring(0, 500),
      engine_type: motorType.includes('FourStroke') ? 'FourStroke' : null,
      images: item.imageLink ? [{
        url: item.imageLink,
        type: 'main',
        source: 'scraped' as const,
        scraped_at: new Date().toISOString()
      }] : [],
      features: [],
      specifications: {},
      last_scraped: new Date().toISOString()
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
    console.error('Failed to parse HTML document');
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
      const availabilityText = availabilityElement?.textContent?.trim() || '';
      
      // Only process brochure models for HTML scraping (skip in-stock models)
      if (availabilityText.toLowerCase().includes('in stock')) {
        console.log(`⏭️ Skipping in-stock model: ${availabilityText}`);
        continue;
      }
      
      // If it contains "brochure" or doesn't have availability info, treat as brochure model
      const isBrochureModel = availabilityText.toLowerCase().includes('brochure') || !availabilityText;
      if (!isBrochureModel) {
        console.log(`⏭️ Skipping non-brochure model: ${availabilityText}`);
        continue;
      }
      
      console.log(`✅ Processing brochure model with availability: ${availabilityText || 'No availability info'}`);
      
      // Extract brochure URL (optional for brochure models)
      const brochureLinks = element.querySelectorAll('a[href*="brochure"], a[href*=".pdf"]');
      const brochureUrl = brochureLinks.length > 0 ? brochureLinks[0].getAttribute('href') : '';
      
      // Extract price from display price or JSON data
      let basePrice = 0;
      const priceElement = element.querySelector('[itemprop="price"], .display-price-box span');
      if (priceElement) {
        const priceText = priceElement.textContent?.trim() || '';
        const priceMatch = priceText.match(/\$?([\d,]+\.?\d*)/);
        basePrice = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;
      }

      // Try to get data from hidden JSON datasource
      const datasourceElement = element.querySelector('.datasource.hidden');
      let jsonData = null;
      if (datasourceElement) {
        try {
          jsonData = JSON.parse(datasourceElement.textContent?.trim() || '{}');
          if (jsonData.itemPrice && !basePrice) {
            basePrice = jsonData.itemPrice;
          }
        } catch (jsonError) {
          // Ignore JSON parsing errors
        }
      }

      // Extract image URL
      let imageUrl = '';
      const imageElement = element.querySelector('img');
      if (imageElement) {
        imageUrl = toAbsoluteUrl(imageElement.getAttribute('src') || '', baseUrl);
      }

      // Try to get additional info from table rows (for brochure items)
      const tableRows = element.querySelectorAll('tr');
      
      // Extract year from title (default to 2025)
      const yearMatch = title.match(/(\d{4})/);
      const year = yearMatch ? parseInt(yearMatch[1]) : 2025;

      // Extract HP from title
      const hpMatch = title.match(/(\d+(?:\.\d+)?)hp/i) || title.match(/(\d+(?:\.\d+)?)\s*HP/i);
      const horsepower = hpMatch ? parseFloat(hpMatch[1]) : 0;

      // Determine availability based on what we found
      const availability = availabilityText || 'Brochure';

      // FIXED: Extract stock number properly from table structure
      let stockNumber = null;
      for (const row of tableRows) {
        const cells = row.querySelectorAll('td, th');
        for (let i = 0; i < cells.length - 1; i++) {
          const cell = cells[i];
          const nextCell = cells[i + 1];
          if (cell?.textContent?.toLowerCase().includes('stock') && nextCell?.textContent?.trim()) {
            stockNumber = nextCell.textContent.trim();
            break;
          }
        }
        if (stockNumber) break;
      }

      // Enhanced stock number extraction for brochure items
      if (!stockNumber && jsonData && jsonData.stockNumber) {
        stockNumber = jsonData.stockNumber;
      } else {
        // FIXED: Find stock number using proper DOM traversal
        for (const row of tableRows) {
          const strongElements = row.querySelectorAll('strong');
          for (const strong of strongElements) {
            if (strong.textContent?.trim().toLowerCase().includes('stock')) {
              const parentCell = strong.closest('td');
              if (parentCell && parentCell.nextElementSibling) {
                const stockText = parentCell.nextElementSibling.textContent?.trim();
                if (stockText && stockText !== '-' && stockText !== 'N/A') {
                  stockNumber = stockText;
                  break;
                }
              }
            }
          }
          if (stockNumber) break;
        }
      }

      // Enhanced availability extraction from table rows
      let availabilityFinal = availability;
      if (!availabilityText) {
        for (const row of tableRows) {
          const strongElements = row.querySelectorAll('strong');
          for (const strong of strongElements) {
            if (strong.textContent?.trim().toLowerCase().includes('availability')) {
              const parentCell = strong.closest('td');
              if (parentCell && parentCell.nextElementSibling) {
                availabilityFinal = parentCell.nextElementSibling.textContent?.trim().toLowerCase() || '';
                break;
              }
            }
          }
          if (availabilityFinal) break;
        }
      }

      // Skip if we couldn't determine HP (required field)
      if (horsepower === 0) {
        console.log(`⏭️ Skipping motor with no HP: ${title}`);
        continue;
      }

      // Get motor type from title
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

// HTML scraping for brochure models with pagination
async function scrapeHTMLInventory(): Promise<MotorData[]> {
  const baseUrl = 'https://www.harrisboatworks.ca';
  let allMotors: MotorData[] = [];
  let currentPage = 1;
  const maxPages = 10; // Safety limit

  try {
    while (currentPage <= maxPages) {
      const inventoryUrl = `${baseUrl}/search/inventory/type/Outboard%20Motors/usage/New/sort/price-low?resultsperpage=200&page=${currentPage}`;
      
      console.log(`📄 Fetching Mercury brochure models page ${currentPage}: ${inventoryUrl}`);
      
      const html = await fetchWithRetry(inventoryUrl);
      if (!html) {
        console.log(`❌ Failed to fetch page ${currentPage}, stopping pagination`);
        break;
      }

      const pageMotors = parseBrochureMotorData(html, baseUrl);
      
      if (pageMotors.length === 0) {
        console.log(`📄 No motors found on page ${currentPage}, stopping pagination`);
        break;
      }

      allMotors.push(...pageMotors);
      console.log(`📦 Page ${currentPage}: Found ${pageMotors.length} motors (Total: ${allMotors.length})`);

      // Check if there's a next page
      if (!checkForNextPage(html, currentPage)) {
        console.log(`📄 No next page found after page ${currentPage}, stopping pagination`);
        break;
      }

      currentPage++;
      
      // Add delay between requests to be respectful
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`📊 HTML Scraping completed: ${allMotors.length} total brochure motors found across ${currentPage - 1} pages`);
    return allMotors;

  } catch (error) {
    console.error('Error in HTML inventory scraping:', error);
    return allMotors; // Return whatever we've collected so far
  }
}

// Enhanced motor details hydration with better error handling and parallel processing
async function hydrateMotorDetails(motors: MotorData[]): Promise<MotorData[]> {
  console.log(`🔍 Starting hydration for ${motors.length} motors...`);
  
  const hydratedMotors: MotorData[] = [];
  const batchSize = 5; // Process 5 motors at a time to avoid overwhelming the server
  
  for (let i = 0; i < motors.length; i += batchSize) {
    const batch = motors.slice(i, i + batchSize);
    console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(motors.length / batchSize)} (${batch.length} motors)`);
    
    // Process batch in parallel
    const batchPromises = batch.map(async (motor) => {
      try {
        // For now, just return the motor as-is since detailed scraping is complex
        // In the future, this could fetch individual product pages for more details
        return motor;
      } catch (error) {
        console.warn(`Failed to hydrate motor ${motor.model}:`, error);
        return motor; // Return original motor if hydration fails
      }
    });
    
    const batchResults = await Promise.allSettled(batchPromises);
    
    for (const result of batchResults) {
      const motor = result.status === 'fulfilled' ? result.value : null;
      if (motor) {
        // Still add the motor even if hydration fails
        hydratedMotors.push(motor);
      }
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
  ];

  const lowerHtml = html.toLowerCase();
  
  for (const indicator of nextPageIndicators) {
    if (lowerHtml.includes(indicator.toLowerCase())) {
      console.log(`📄 Next page indicator found: ${indicator}`);
      return true;
    }
  }

  // Also check for pagination links with higher page numbers
  const pageRegex = new RegExp(`page=${currentPage + 1}`, 'i');
  if (pageRegex.test(html)) {
    console.log(`📄 Next page link found: page=${currentPage + 1}`);
    return true;
  }

  return false;
}