import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Utility functions
async function fetchWithRetry(url: string, maxRetries = 3): Promise<string | null> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return await response.text();
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
          console.log(`✅ XML scraping successful: ${xmlMotors.length} Mercury motors found`);
        } else {
          console.log('⚠️ XML scraping returned no Mercury motors, falling back to HTML');
        }
      } catch (xmlError) {
        console.warn('⚠️ XML scraping failed, falling back to HTML:', xmlError);
      }
    }

    // Fallback to HTML scraping if XML failed or wasn't attempted
    if (!useXmlSuccess) {
      console.log('🌐 Using HTML scraping as fallback...');
      let page = 1;
      const baseUrl = 'https://www.harrisboatworks.ca';
      const inventoryUrl = `${baseUrl}/new-models/?resultsperpage=50`;

      while (true) {
        const pageUrl = page === 1 ? inventoryUrl : `${inventoryUrl}&page=${page}`;
        console.log(`📄 Fetching page ${page}: ${pageUrl}`);

        const pageData = await fetchWithRetry(pageUrl, 3);
        if (!pageData) {
          console.error(`❌ Failed to fetch page ${page} after retries`);
          break;
        }

        const motors = parseMotorData(pageData, baseUrl);
        console.log(`⚙️ Found ${motors.length} motors on page ${page}`);

        if (motors.length === 0) {
          console.log('📋 No more motors found, stopping pagination');
          break;
        }

        allMotors = allMotors.concat(motors);
        
        // Check if there's a next page
        const hasNextPage = pageData.includes('Next Page') || 
                           pageData.includes('aria-label="Next"') ||
                           pageData.includes(`page=${page + 1}`);
        
        if (!hasNextPage) {
          console.log('📄 No next page found, stopping pagination');
          break;
        }

        page++;
        
        // Safety check to prevent infinite loops
        if (page > 20) {
          console.log('⚠️ Reached page limit (20), stopping');
          break;
        }

        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
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

    // Insert new data in batches
    const batchSize = 10;
    let insertedCount = 0;
    
    for (let i = 0; i < hydratedMotors.length; i += batchSize) {
      const batch = hydratedMotors.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from('motor_models')
        .insert(batch);

      if (insertError) {
        console.error(`❌ Error inserting batch ${Math.floor(i/batchSize) + 1}:`, insertError);
        throw insertError;
      }
      
      insertedCount += batch.length;
      console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(hydratedMotors.length/batchSize)} (${insertedCount}/${hydratedMotors.length} motors)`);
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

    return new Response(JSON.stringify({
      success: true,
      summary: {
        source: useXmlSuccess ? 'xml' : 'html',
        motors_found: allMotors.length,
        motors_hydrated: hydratedMotors.length,
        motors_inserted: insertedCount,
        timestamp: new Date().toISOString()
      }
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

// Determine motor type from title
function getMotorTypeFromTitle(title: string): string {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('verado')) return 'Verado';
  if (titleLower.includes('pro xs') || titleLower.includes('pro-xs')) return 'ProXS';
  if (titleLower.includes('fourstroke') || titleLower.includes('four stroke')) return 'FourStroke';
  
  return 'Outboard';
}

// Convert relative URLs to absolute
function toAbsoluteUrl(url: string, baseUrl: string): string {
  if (url.startsWith('http')) return url;
  if (url.startsWith('//')) return 'https:' + url;
  if (url.startsWith('/')) return baseUrl + url;
  return baseUrl + '/' + url;
}

// HTML parsing fallback functions
function parseMotorData(html: string, baseUrl: string): MotorData[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  if (!doc) {
    console.error('Failed to parse HTML');
    return [];
  }

  const motors: MotorData[] = [];
  
  // Look for motor listings in the HTML
  const motorElements = doc.querySelectorAll('.inventory-item, .product-item, .motor-listing');
  
  for (const element of motorElements) {
    try {
      const titleElement = element.querySelector('h2, h3, .title, .product-title');
      const title = titleElement?.textContent?.trim() || '';
      
      // Skip if not a Mercury motor
      if (!title.toLowerCase().includes('mercury')) continue;
      
      const priceElement = element.querySelector('.price, .cost, .amount');
      const priceText = priceElement?.textContent?.trim() || '';
      const priceMatch = priceText.match(/\$?([\d,]+\.?\d*)/);
      const basePrice = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;
      
      const linkElement = element.querySelector('a[href]');
      const detailUrl = linkElement ? toAbsoluteUrl(linkElement.getAttribute('href') || '', baseUrl) : '';
      
      const imageElement = element.querySelector('img');
      const imageUrl = imageElement ? toAbsoluteUrl(imageElement.getAttribute('src') || '', baseUrl) : '';
      
      // Extract horsepower from title
      const hpMatch = title.match(/(\d+\.?\d*)\s*hp/i);
      const horsepower = hpMatch ? parseFloat(hpMatch[1]) : 0;
      
      if (horsepower === 0) continue; // Skip if no horsepower found
      
      // Extract year (default to current year)
      const yearMatch = title.match(/(\d{4})/);
      const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
      
      // Detect availability/stock status from the HTML content
      let availability = 'Brochure'; // Default availability
      let stockQuantity = 0;
      
      // Look for stock indicators in various places
      const stockElement = element.querySelector('.stock-status, .availability, .status, .inventory-status');
      const stockText = stockElement?.textContent?.trim().toLowerCase() || '';
      
      // Check the main element text for stock indicators
      const elementText = element.textContent?.toLowerCase() || '';
      
      // Also check for badge or status indicators
      const badgeElement = element.querySelector('.badge, .tag, .status-badge, .stock-badge');
      const badgeText = badgeElement?.textContent?.trim().toLowerCase() || '';
      
      // Combine all text sources for availability detection
      const allText = `${stockText} ${elementText} ${badgeText}`.toLowerCase();
      
      if (allText.includes('in stock') || allText.includes('available now') || allText.includes('ready to ship')) {
        availability = 'In Stock';
        stockQuantity = 1; // Assume at least 1 if marked as in stock
      } else if (allText.includes('available') && !allText.includes('brochure')) {
        availability = 'Available';
      } else if (allText.includes('brochure') || allText.includes('order') || allText.includes('custom order')) {
        availability = 'Brochure';
      } else if (allText.includes('sold') || allText.includes('out of stock') || allText.includes('unavailable')) {
        availability = 'Sold';
      }
      
      const motorData: MotorData = {
        id: crypto.randomUUID(),
        make: 'Mercury',
        model: title,
        year: year,
        base_price: basePrice,
        motor_type: getMotorTypeFromTitle(title),
        horsepower: horsepower,
        image_url: imageUrl,
        availability: availability,
        stock_quantity: stockQuantity,
        inventory_source: 'html',
        last_stock_check: new Date().toISOString(),
        detail_url: detailUrl,
        images: imageUrl ? [{
          url: imageUrl,
          type: 'main',
          source: 'scraped' as const,
          scraped_at: new Date().toISOString()
        }] : []
      };
      
      motors.push(motorData);
    } catch (error) {
      console.warn('Error parsing motor element:', error);
    }
  }
  
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
