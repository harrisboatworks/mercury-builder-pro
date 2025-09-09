import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function fetchWithRetry(url: string, init?: RequestInit, maxRetries = 3, initialDelayMs = 500): Promise<Response> {
  let attempt = 0
  let delay = initialDelayMs
  while (true) {
    try {
      const res = await fetch(url, init)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res
    } catch (e) {
      attempt++
      if (attempt > maxRetries) throw e
      await new Promise((r) => setTimeout(r, delay))
      delay *= 2
    }
  }
}

async function sendFailureAlert(subject: string, message: string) {
  try {
    const enabled = (Deno.env.get('ENABLE_EMAIL_ALERTS') || 'false').toLowerCase() === 'true'
    const apiKey = Deno.env.get('RESEND_API_KEY')
    const to = Deno.env.get('ALERT_EMAIL_TO')
    const from = Deno.env.get('ALERT_EMAIL_FROM') || 'alerts@harrisboatworks.local'

    // Always emit a structured log for observability
    console.warn(JSON.stringify({
      event: 'scrape_inventory_alert',
      mode: enabled ? 'email' : 'log-only',
      subject,
      message,
      timestamp: new Date().toISOString(),
    }))

    // Short-circuit if alerts are disabled or provider not configured
    if (!enabled || !apiKey || !to) return

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: to.split(',').map((s) => s.trim()).filter(Boolean),
        subject,
        html: `<pre>${message.replace(/</g, '&lt;')}</pre>`
      })
    })
    if (!res.ok) {
      console.error('Failed to send alert email', await res.text())
    }
  } catch (e) {
    console.error('Email alert error', e)
  }
}

interface MotorData {
  make: string
  model: string
  year: number
  horsepower: number
  base_price: number
  sale_price?: number | null
  motor_type: string
  engine_type?: string
  image_url?: string
  availability: string
  stock_number?: string | null
  description?: string | null
  features?: string[]
  specifications?: Record<string, unknown> | null
  detail_url?: string | null
}


Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let updateTrackingId: string | null = null;
  let isScheduled = false;

  try {
    // Parse request body to check if this is a scheduled run
    const body = await req.json().catch(() => ({}));
    isScheduled = body.scheduled === true;
    
    console.log(`Starting Harris Boat Works inventory scrape (scheduled: ${isScheduled})...`)
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Track the update start
    const { data: trackingData, error: trackingError } = await supabase
      .from('inventory_updates')
      .insert({
        status: 'running',
        is_scheduled: isScheduled
      })
      .select('id')
      .single();

    if (trackingError) {
      console.error('Failed to create tracking record:', trackingError);
    } else {
      updateTrackingId = trackingData.id;
      console.log(`Started inventory update (ID: ${updateTrackingId})`);
    }

    // If this is a scheduled run, start background processing
    if (isScheduled) {
      EdgeRuntime.waitUntil(processInventoryUpdate(supabase, updateTrackingId));
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Scheduled inventory update started',
          trackingId: updateTrackingId
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Fetch all pages of Harris Boat Works inventory
    let allMotors: MotorData[] = []
    let pageNumber = 1
    let hasMorePages = true
    
    while (hasMorePages && pageNumber <= 10) { // Safety limit of 10 pages
      const url = pageNumber === 1 
        ? 'https://www.harrisboatworks.ca/search/inventory/brand/Mercury/sort/price-low'
        : `https://www.harrisboatworks.ca/search/inventory/brand/Mercury/sort/price-low/page/${pageNumber}`
      
      console.log(`Fetching page ${pageNumber}: ${url}`)
      
      const response = await fetchWithRetry(url)
      if (!response.ok) {
        console.log(`Failed to fetch page ${pageNumber}: ${response.status}`)
        break
      }
      
      const html = await response.text()
      const pageMotors = parseMotorData(html)
      
      if (pageMotors.length === 0) {
        console.log(`No motors found on page ${pageNumber}, stopping`)
        hasMorePages = false
      } else {
        console.log(`Found ${pageMotors.length} motors on page ${pageNumber}`)
        allMotors = allMotors.concat(pageMotors)
        pageNumber++
        
        // Check if there are more results (looking for pagination indicators)
        if (!html.includes('next') && !html.includes(`page/${pageNumber}`)) {
          hasMorePages = false
        }
      }
      
      // Small delay between requests to be respectful
      if (hasMorePages) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    console.log(`Total motors collected from all pages: ${allMotors.length}`)
    const motorsBasic = allMotors
    
    if (motorsBasic.length === 0) {
      throw new Error('No motors found on page')
    }

    // Hydrate with detailed specs from product pages when available
    const motors = await hydrateWithDetails(motorsBasic)

    // Clear existing data and insert new data
    const { error: deleteError } = await supabase
      .from('motor_models')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
    
    if (deleteError) {
      console.error('Error clearing existing data:', deleteError)
    }

    // Insert new motor data
    const { data, error } = await supabase
      .from('motor_models')
      .insert(motors.map((m) => ({
        make: m.make,
        model: m.model,
        year: m.year,
        base_price: m.base_price,
        sale_price: m.sale_price ?? null,
        motor_type: m.motor_type,
        engine_type: m.engine_type ?? null,
        horsepower: m.horsepower,
        image_url: m.image_url ?? null,
        availability: m.availability,
        stock_number: m.stock_number ?? null,
        description: m.description ?? null,
        features: m.features ?? [],
        specifications: m.specifications ?? {},
        detail_url: m.detail_url ?? null,
      })))
      .select()

    if (error) {
      console.error('Error inserting motors:', error)
      throw error
    }

    // Compute simple status counts for logging
    let discounted = 0, msrp_only = 0, call_for_price = 0;
    const rows = Array.isArray(data) ? data : [];
    for (const r of rows as any[]) {
      const base = typeof r.base_price === 'number' ? r.base_price : 0;
      const sale = typeof r.sale_price === 'number' ? r.sale_price : null;
      if (!(base > 0)) {
        call_for_price++;
      } else if (typeof sale === 'number' && sale > 0 && sale < base) {
        discounted++;
      } else {
        msrp_only++;
      }
    }

    // Compute subtitle health metrics
    let subtitles_non_empty = 0, subtitles_suppressed = 0;
    const total_motors = rows.length;

    // Helpers scoped to this block to avoid polluting global scope
    const FEATURE_WORDS = ['Command Thrust','ProKicker','Big Tiller','Jet','SeaPro','Verado','Pro XS'] as const;
    const SHAFT_ROTATION_CODES = ['XL','XXL','CXL'] as const;
    const CONTROL_TRIM_CODES = ['DTS','CT'] as const;
    const START_SHAFT_TRIM_BUNDLES = ['MH','MLH','ELH','ELPT','EXLPT'] as const;
    const PRIORITY_LIST: string[][] = [
      [...FEATURE_WORDS],
      [...SHAFT_ROTATION_CODES],
      [...CONTROL_TRIM_CODES],
      [...START_SHAFT_TRIM_BUNDLES],
    ];
    const BRAND_REGEX = /\bmercury(?:\s+marine)?\b|mercury®|^merc\.\b/gi;
    const normalize = (s: string) => ` ${s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} `;
    const tokenPresent = (haystackNorm: string, token: string) => haystackNorm.includes(` ${token.toLowerCase()} `);
const cleanModel = (year: number, model: string) => {
  let m = model || '';
  const yr = String(year).trim();
  // Remove ALL leading year tokens (this year or any 20xx), including repeated with punctuation
  const reYear = new RegExp(`^\\s*(?:${yr}|20\\d{2})(?:\\s|[-:–—·.:])*\\s*`, 'i');
  while (reYear.test(m)) {
    m = m.replace(reYear, '');
  }
  // remove brand tokens (keep product lines like Verado/Pro XS/SeaPro)
  m = m.replace(BRAND_REGEX, ' ');
  m = m.replace(/\s+/g, ' ').trim();
  return m;
};

const stripYearAndBrand = (text: string, year: number) => {
  let t = text || '';
  const yearAnyRe = new RegExp(`\\b(?:${year}|20\\d{2})\\b`, 'gi');
  t = t.replace(yearAnyRe, ' ');
  t = t.replace(BRAND_REGEX, ' ');
  return t;
};

    const getOriginalVariantTokens = (raw: string): string[] => {
      const rawNorm = normalize(raw);
      const picked: string[] = [];
      const seen = new Set<string>();
      for (const group of PRIORITY_LIST) {
        for (const token of group) {
          if (tokenPresent(rawNorm, token)) {
            const key = token.toUpperCase();
            if (!seen.has(key)) { seen.add(key); picked.push(token); }
          }
        }
      }
      return picked;
    };

    for (const r of rows as any[]) {
      const titleModel = cleanModel(r.year, String(r.model || ''));
      const finalTitle = `${r.year} ${titleModel}`.trim();
      const titleNorm = normalize(finalTitle);

      // Build raw text source (model + description), strip year/brand for fair token detection
      const rawSource = stripYearAndBrand(`${String(r.model || '')} ${String(r.description || '')}`, r.year);
      const originalVariantTokens = getOriginalVariantTokens(rawSource);
      // Filter out tokens that already appear in the cleaned title
      const removedTokens: string[] = [];
      const displayTokens: string[] = [];
      for (const tok of originalVariantTokens) {
        if (tokenPresent(titleNorm, tok)) {
          removedTokens.push(tok);
        } else {
          displayTokens.push(tok);
        }
      }
      // Limit to max 3
      const limited = displayTokens.slice(0, 3);
      if (limited.length > 0) {
        subtitles_non_empty++;
      } else if (originalVariantTokens.length > 0) {
        subtitles_suppressed++;
        // Per-card debug line to help diagnose suppression
        console.log(`subtitle_suppressed_all_tokens_in_title: ${JSON.stringify({ title: finalTitle, originalVariantTokens, removedTokens })}`);
      }
    }

    // Human-friendly scrape summary line for quick verification
    console.log(`discounted: ${discounted} | msrp_only: ${msrp_only} | call_for_price: ${call_for_price} | subtitles_non_empty: ${subtitles_non_empty} | subtitles_suppressed: ${subtitles_suppressed} | total_motors: ${total_motors}`);

    // Step 5: Update motor prices from Mercury pricelist
    let priceUpdateData = { successfulUpdates: 0, matchesFound: 0, errors: [] };
    try {
      console.log('Updating motor prices from Mercury pricelist...');
      
      const priceUpdateResult = await supabase.functions.invoke('scrape-motor-prices');
      
      if (priceUpdateResult.error) {
        console.error('Failed to update motor prices:', priceUpdateResult.error);
      } else if (priceUpdateResult.data) {
        priceUpdateData = priceUpdateResult.data;
        console.log(`Price update completed: ${priceUpdateData.successfulUpdates || 0} motors updated`);
      }
    } catch (error) {
      console.error('Error updating motor prices:', error);
      priceUpdateData.errors.push(error.message);
    }

    const summary = {
      event: 'scrape_inventory_complete',
      updatedCount: rows.length,
      collectedCount: motors.length,
      discounted,
      msrp_only,
      call_for_price,
      subtitles_non_empty,
      subtitles_suppressed,
      total_motors,
      pricesUpdated: priceUpdateData.successfulUpdates,
      priceMatchesFound: priceUpdateData.matchesFound,
      timestamp: new Date().toISOString(),
    } as const;
    console.log(JSON.stringify(summary))

    // Update tracking record on success
    if (updateTrackingId) {
      await supabase
        .from('inventory_updates')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          motors_updated: rows.length
        })
        .eq('id', updateTrackingId);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: data?.length || 0,
        motors: data?.slice(0, 5), // Return first 5 as sample
        trackingId: updateTrackingId
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Scraping error:', error)
    console.error(JSON.stringify({
      event: 'scrape_inventory_error',
      message: (error as any)?.message || 'Unknown error',
      stack: (error as any)?.stack || null,
      timestamp: new Date().toISOString(),
    }))

    // Update tracking record on failure
    if (updateTrackingId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      await supabase
        .from('inventory_updates')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: (error as any)?.message || 'Unknown error'
        })
        .eq('id', updateTrackingId);
    }

    try {
      await sendFailureAlert(
        'HBW Inventory Scrape Failed',
        typeof (error as any)?.message === 'string' ? (error as any).message : JSON.stringify(error)
      )
    } catch (e) {
      console.error('Failed to send failure email', e)
    }
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error as any)?.message || 'Unknown error',
        trackingId: updateTrackingId
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

// Background processing function for scheduled updates
async function processInventoryUpdate(supabase: any, trackingId: string | null) {
  try {
    console.log('Processing scheduled inventory update in background...');
    
    // Fetch all pages of Harris Boat Works inventory
    let allMotors: MotorData[] = []
    let pageNumber = 1
    let hasMorePages = true
    
    while (hasMorePages && pageNumber <= 10) { // Safety limit of 10 pages
      const url = pageNumber === 1 
        ? 'https://www.harrisboatworks.ca/search/inventory/brand/Mercury/sort/price-low'
        : `https://www.harrisboatworks.ca/search/inventory/brand/Mercury/sort/price-low/page/${pageNumber}`
      
      console.log(`Background: Fetching page ${pageNumber}: ${url}`)
      
      const response = await fetchWithRetry(url)
      if (!response.ok) {
        console.log(`Background: Failed to fetch page ${pageNumber}: ${response.status}`)
        break
      }
      
      const html = await response.text()
      const pageMotors = parseMotorData(html)
      
      if (pageMotors.length === 0) {
        console.log(`Background: No motors found on page ${pageNumber}, stopping`)
        hasMorePages = false
      } else {
        console.log(`Background: Found ${pageMotors.length} motors on page ${pageNumber}`)
        allMotors = allMotors.concat(pageMotors)
        pageNumber++
        
        // Check if there are more results
        if (!html.includes('next') && !html.includes(`page/${pageNumber}`)) {
          hasMorePages = false
        }
      }
      
      // Longer delay for background processing to be more respectful
      if (hasMorePages) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
    
    console.log(`Background: Total motors collected: ${allMotors.length}`)
    
    if (allMotors.length === 0) {
      throw new Error('No motors found during background update')
    }

    // Hydrate with detailed specs
    const motors = await hydrateWithDetails(allMotors)

    // Clear existing data and insert new data
    const { error: deleteError } = await supabase
      .from('motor_models')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    
    if (deleteError) {
      console.error('Background: Error clearing existing data:', deleteError)
    }

    // Insert new motor data
    const { data, error } = await supabase
      .from('motor_models')
      .insert(motors.map((m) => ({
        make: m.make,
        model: m.model,
        year: m.year,
        base_price: m.base_price,
        sale_price: m.sale_price ?? null,
        motor_type: m.motor_type,
        engine_type: m.engine_type ?? null,
        horsepower: m.horsepower,
        image_url: m.image_url ?? null,
        availability: m.availability,
        stock_number: m.stock_number ?? null,
        description: m.description ?? null,
        features: m.features ?? [],
        specifications: m.specifications ?? {},
        detail_url: m.detail_url ?? null,
      })))
      .select()

    if (error) {
      console.error('Background: Error inserting motors:', error)
      throw error
    }

    const rows = Array.isArray(data) ? data : [];
    console.log(`Background: Successfully updated ${rows.length} motors`)

    // Step 5: Update motor prices from Mercury pricelist (Background)
    try {
      console.log('Background: Updating motor prices from Mercury pricelist...');
      
      const priceUpdateResult = await supabase.functions.invoke('scrape-motor-prices');
      
      if (priceUpdateResult.error) {
        console.error('Background: Failed to update motor prices:', priceUpdateResult.error);
      } else if (priceUpdateResult.data) {
        const priceData = priceUpdateResult.data;
        console.log(`Background: Price update completed: ${priceData.successfulUpdates || 0} motors updated`);
      }
    } catch (error) {
      console.error('Background: Error updating motor prices:', error);
    }

    // Update tracking record on success
    if (trackingId) {
      await supabase
        .from('inventory_updates')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          motors_updated: rows.length
        })
        .eq('id', trackingId);
    }

    console.log('Background inventory update completed successfully');
  } catch (error) {
    console.error('Background inventory update failed:', error);
    
    // Update tracking record on failure
    if (trackingId) {
      await supabase
        .from('inventory_updates')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: (error as any)?.message || 'Unknown error'
        })
        .eq('id', trackingId);
    }
    
    // Send failure alert
    try {
      await sendFailureAlert(
        'HBW Scheduled Inventory Update Failed',
        `Background update failed: ${(error as any)?.message || 'Unknown error'}`
      )
    } catch (e) {
      console.error('Failed to send background failure alert', e)
    }
  }
}

function parseMotorData(html: string): MotorData[] {
  const motors: MotorData[] = []
  
  try {
    console.log('Starting to parse motor data from HTML...')
    
    // Strategy 1: Extract structured JSON data from hidden datasource spans
    const datasourceMatches = html.match(/<span class="datasource hidden[^>]*>[\s\S]*?<\/span>/gi) || []
    
    for (const spanMatch of datasourceMatches) {
      try {
        // Extract JSON from the span content
        const jsonMatch = spanMatch.match(/>\s*({.*})\s*</s)
        if (jsonMatch) {
          const motorData = JSON.parse(jsonMatch[1])
          
          // Extract horsepower from the name or item field
          const motorName = motorData.name || motorData.item || ''
          const hpMatch = motorName.match(/(\d+(?:\.\d+)?)\s*(?:HP|bhp)/i)
          const hp = hpMatch ? parseFloat(hpMatch[1]) : 0
          
          if (hp > 0 && motorData.itemMake === 'Mercury') {
            // Determine availability - check for sold status
            let availability = 'Brochure'
            if (motorData.stockNumber) {
              availability = 'In Stock'
            }
            
            // Check for sold indicators
            const soldIndicators = [
              motorData.sold === true,
              motorData.itemAvailability === 'Sold',
              motorData.itemAvailability === 'Unavailable',
              /sold|unavailable/i.test(motorData.itemName || ''),
              /sold|unavailable/i.test(motorData.itemDescription || '')
            ]
            
            if (soldIndicators.some(Boolean)) {
              availability = 'Sold'
            }
            // Prefer detail images over thumbnails for better quality
            let imageUrl = getMotorImageUrl(motorName) // fallback
            if (motorData.itemThumbNailUrl) {
              const thumbUrl = `https:${motorData.itemThumbNailUrl}`
              // Convert thumb URLs to detail URLs for better quality
              imageUrl = thumbUrl.replace('/thumb/', '/detail/')
            }
            
            const currentPrice = typeof motorData.itemPrice === 'number' ? motorData.itemPrice : 0;
            const unitPrice = typeof motorData.unitPrice === 'number' ? motorData.unitPrice : 0;
            const displayPrice = typeof motorData.itemDisplayPrice === 'string' ? parseFloat(motorData.itemDisplayPrice.replace(/[^0-9.]/g, '')) : 0;
            const basePrice = unitPrice || displayPrice || currentPrice || 0;
            const salePrice = ((unitPrice > 0 && currentPrice > 0 && currentPrice < unitPrice) || motorData.itemOnSale === true) ? (currentPrice || null) : null;

            const motor: MotorData = {
              make: 'Mercury',
              model: motorName.replace(/ - Mercury$/, ''),
              year: motorData.itemYear || 2025,
              horsepower: hp,
              base_price: basePrice,
              sale_price: salePrice,
              motor_type: getMotorType(motorName),
              image_url: imageUrl,
              availability: availability,
              stock_number: motorData.stockNumber || null,
              detail_url: motorData.itemUrl ? toAbsoluteUrl(motorData.itemUrl) : null,
            }
            motors.push(motor)
          }
        }
      } catch (e) {
        console.error('Error parsing datasource JSON:', e)
      }
    }

    // Strategy 2: Parse title and price from HTML structure if JSON fails
    if (motors.length === 0) {
      console.log('JSON parsing failed, trying HTML structure parsing...')
      
      const unitCardMatches = html.match(/<div class="row unit-card">[\s\S]*?(?=<div class="row unit-card">|$)/gi) || []
      
      for (const cardHtml of unitCardMatches) {
        try {
          // Extract title
          const titleMatch = cardHtml.match(/<h3[^>]*results-heading[^>]*>[\s\S]*?<a[^>]*title="([^"]*Mercury[^"]*)"[^>]*>/i)
          if (!titleMatch) continue
          
          const fullTitle = titleMatch[1]
          const hpMatch = fullTitle.match(/(\d+(?:\.\d+)?)\s*(?:HP|bhp)/i)
          if (!hpMatch) continue
          
          const hp = parseFloat(hpMatch[1])
          
          // Extract base price candidate
          const priceMatch = cardHtml.match(/<span[^>]*itemprop=\"price\"[^>]*>\$([0-9,]+(?:\.\d{2})?)<\/span>/i)
          const basePriceCandidate = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0
          
          // Try to extract sale price patterns: "Sale Price", "Now", or "On Sale"
          const saleMatchA = cardHtml.match(/(?:Sale\s*Price|Now)\s*\$([0-9,]+(?:\.\d{2})?)/i)
          const saleMatchB = cardHtml.match(/<span[^>]*class=\"[^\"]*sale[^\"]*\"[^>]*>\$([0-9,]+(?:\.\d{2})?)<\/span>/i)
          const saleMatchC = cardHtml.match(/On\s*Sale\s*\$([0-9,]+(?:\.\d{2})?)/i)
          const salePrice = saleMatchA
            ? parseFloat(saleMatchA[1].replace(/,/g, ''))
            : saleMatchB
              ? parseFloat(saleMatchB[1].replace(/,/g, ''))
              : saleMatchC
                ? parseFloat(saleMatchC[1].replace(/,/g, ''))
                : null
          
          // If we have "You Save", infer base price
          const saveMatch = cardHtml.match(/You\s*Save\s*\$([0-9,]+(?:\.\d{2})?)/i)
          const inferredBasePrice = (salePrice && saveMatch)
            ? (salePrice + parseFloat(saveMatch[1].replace(/,/g, '')))
            : basePriceCandidate
          
          // Extract availability - check for sold, in stock, or default to brochure
          const availabilityMatch = cardHtml.match(/<span class=\"label[^\"]*\"[^>]*>([^<]+)</i)
          let availability = availabilityMatch ? availabilityMatch[1].trim() : 'Brochure'
          
          // Check for sold indicators in various places
          const soldIndicators = [
            /sold/i,
            /unavailable/i,
            /out\s*of\s*stock/i
          ]
          
          const isSold = soldIndicators.some(pattern => 
            pattern.test(availability) || 
            pattern.test(cardHtml) ||
            pattern.test(fullTitle)
          )
          
          if (isSold) {
            availability = 'Sold'
          } else if (availability.toLowerCase().includes('stock')) {
            availability = 'In Stock'
          }
          
          // Extract image URL
          const imageMatch = cardHtml.match(/src=\"([^\"]*ThumbGenerator[^\"]*)\"/) || 
                           cardHtml.match(/data-srcset=\"([^\"]*ThumbGenerator[^\"]*)\"/)
          const imageUrl = imageMatch ? imageMatch[1] : getMotorImageUrl(fullTitle)
          
          // Extract detail URL
          const linkMatch = cardHtml.match(/<a[^>]*href=\"([^\"]+)\"[^>]*title=\"[^\"]*Mercury[^\"]*\"/i)
          const detailUrl = linkMatch ? toAbsoluteUrl(linkMatch[1]) : null
          
          const motor: MotorData = {
            make: 'Mercury',
            model: fullTitle.replace(/ - Mercury$/, ''),
            year: 2025,
            horsepower: hp,
            base_price: inferredBasePrice || 0,
            sale_price: salePrice,
            motor_type: getMotorType(fullTitle),
            image_url: imageUrl,
            availability: availability,
            stock_number: null,
            detail_url: detailUrl,
          }
          motors.push(motor)
          
        } catch (e) {
          console.error('Error parsing unit card:', e)
        }
      }
    }

  } catch (error) {
    console.error('Error parsing motor data:', error)
  }

  // Remove duplicates based on model name and horsepower
  const uniqueMotors = motors.filter((motor, index, self) => 
    index === self.findIndex(m => m.model === motor.model && m.horsepower === motor.horsepower)
  )

  console.log(`Parsed ${uniqueMotors.length} unique motors from page`)
  return uniqueMotors
}

function toAbsoluteUrl(href: string): string {
  if (!href) return href
  if (href.startsWith('http')) return href
  return `https://www.harrisboatworks.ca${href.startsWith('/') ? '' : '/'}${href}`
}

function normalizeTitle(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim()
}

async function fetchDetailSpecs(url: string): Promise<{ description?: string | null; features?: string[]; specifications?: Record<string, unknown> }> {
  try {
    const res = await fetchWithRetry(url)
    if (!res.ok) throw new Error(`Detail fetch failed: ${res.status}`)
    const html = await res.text()

    const specEntries: Record<string, string> = {}
    const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi
    let m
    while ((m = liRegex.exec(html)) !== null) {
      const raw = m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      const kvMatch = raw.match(/^(Weight|Shaft(?: Length)?|Start(?:ing)?(?: System)?|Control(?:s)?|Fuel(?: System| Type)?|Warranty|Displacement|Gear(?: Ratio| Shift)?|Alternator|Prop(?: Range|eller Options)?|Cooling|Cylinders|Bore(?:\/?|\s*&\s*)Stroke|Steering(?: Type)?|Trim(?:\/?|\s*&\s*)Tilt|Ignition|Fuel Induction|Exhaust(?: System)?)[\s:–-]+(.+)$/i)
      if (kvMatch) {
        const label = kvMatch[1].toLowerCase()
        const value = kvMatch[2].trim()
        specEntries[label] = value
      }
    }

    const map = (k: string) => specEntries[k] || null
    const specifications: Record<string, unknown> = {
      weight: map('weight'),
      shaftLength: map('shaft') || map('shaft length'),
      startType: map('start') || map('starting') || map('starting system'),
      controls: map('controls') || map('control'),
      fuelSystem: map('fuel system') || map('fuel type'),
      displacement: map('displacement'),
      gearRatio: map('gear ratio'),
      gearShift: map('gear shift'),
      alternator: map('alternator'),
      propRange: map('prop range') || map('propeller options'),
      cooling: map('cooling'),
      cylinders: map('cylinders'),
      boreStroke: map('bore/stroke') || map('bore & stroke') || map('bore stroke'),
      steeringType: map('steering') || map('steering type'),
      trimTilt: map('trim/tilt') || map('trim & tilt') || map('trim tilt'),
      ignition: map('ignition'),
      fuelInduction: map('fuel induction'),
      exhaustSystem: map('exhaust system') || map('exhaust'),
      warranty: map('warranty'),
    }

    // Features list
    const features: string[] = []
    const featureListMatches = html.match(/<ul[^>]*class=\"[^\"]*(features|product-features)[^\"]*\"[^>]*>[\s\S]*?<\/ul>/i)
    if (featureListMatches) {
      const list = featureListMatches[0]
      const li = list.match(/<li[^>]*>[\s\S]*?<\/li>/gi) || []
      for (const item of li) {
        const text = item.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
        if (text) features.push(text)
      }
    }

    // Description
    let description: string | null = null
    const descMatch = html.match(/<div[^>]*class=\"[^\"]*(product-description|description)[^\"]*\"[^>]*>[\s\S]*?<\/div>/i)
    if (descMatch) {
      description = descMatch[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    } else {
      const meta = html.match(/<meta[^>]*name=\"description\"[^>]*content=\"([^\"]+)\"[^>]*>/i)
      if (meta) description = meta[1]
    }

    return { description, features, specifications }
  } catch (e) {
    console.error('Detail scrape failed', e)
    return { specifications: {}, features: [], description: null }
  }
}

async function hydrateWithDetails(items: MotorData[]): Promise<MotorData[]> {
  const concurrency = 4
  const result: MotorData[] = new Array(items.length)
  let index = 0

  async function worker() {
    while (true) {
      const current = index++
      if (current >= items.length) break
      const m = items[current]
      if (m.detail_url) {
        const details = await fetchDetailSpecs(m.detail_url)
        result[current] = {
          ...m,
          description: details.description ?? m.description ?? null,
          features: (details.features && details.features.length) ? details.features : (m.features || []),
          specifications: { powerHP: m.horsepower, ...(m.specifications || {}), ...(details.specifications || {}) },
        }
      } else {
        result[current] = { ...m, specifications: { powerHP: m.horsepower, ...(m.specifications || {}) } }
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()))
  return result
}

function getMotorType(name: string): string {
  const lowerName = name.toLowerCase()
  if (lowerName.includes('verado')) return 'Verado'
  if (lowerName.includes('pro xs')) return 'Pro XS'
  if (lowerName.includes('fourstroke')) return 'FourStroke'
  return 'Outboard'
}

function createMotorFromData(name: string, hp: number, price: number): MotorData {
  let motorType = 'Outboard'
  if (name.toLowerCase().includes('fourstroke')) {
    motorType = 'FourStroke'
  } else if (name.toLowerCase().includes('pro xs')) {
    motorType = 'Pro XS'
  } else if (name.toLowerCase().includes('verado')) {
    motorType = 'Verado'
  }

  return {
    make: 'Mercury',
    model: name,
    year: 2025,
    horsepower: hp,
    base_price: price || estimatePrice(hp),
    motor_type: motorType,
    image_url: getMotorImageUrl(name),
    availability: price > 0 ? 'In Stock' : 'Brochure',
  }
}

function estimatePrice(hp: number): number {
  // Price estimation based on horsepower
  if (hp <= 10) return 1000 + (hp * 200)
  if (hp <= 25) return 3000 + ((hp - 10) * 100)
  if (hp <= 60) return 4500 + ((hp - 25) * 140)
  if (hp <= 115) return 9200 + ((hp - 60) * 110)
  if (hp <= 200) return 15500 + ((hp - 115) * 130)
  return 28500 + ((hp - 200) * 100)
}

function getMotorImageUrl(name: string): string {
  const cleanName = name.toLowerCase()
  
  if (cleanName.includes('2.5')) return 'https://cdnmedia.endeavorsuite.com/images/catalogs/23872/products/detail/7b55e247-7752-4f77-a716-56afa3df9f57.jpg'
  if (cleanName.includes('3.5')) return 'https://cdnmedia.endeavorsuite.com/images/catalogs/23872/products/detail/3.5EFI.jpg'
  if (cleanName.includes('5')) return 'https://cdnmedia.endeavorsuite.com/images/catalogs/23872/products/detail/5EFI.jpg'
  if (cleanName.includes('6')) return 'https://cdnmedia.endeavorsuite.com/images/catalogs/23872/products/detail/6EFI.jpg'
  if (cleanName.includes('9.9')) return 'https://cdnmedia.endeavorsuite.com/images/organizations/873ce1ca-42a6-40ae-ac55-07757f842998/inventory/13450257/9.9EFI.jpg'
  if (cleanName.includes('15')) return 'https://cdnmedia.endeavorsuite.com/images/catalogs/23872/products/detail/15EFI.jpg'
  if (cleanName.includes('20')) return 'https://cdnmedia.endeavorsuite.com/images/catalogs/23872/products/detail/20EFI.jpg'
  if (cleanName.includes('25')) return 'https://cdnmedia.endeavorsuite.com/images/catalogs/23872/products/detail/25EFI.jpg'
  if (cleanName.includes('30')) return 'https://cdnmedia.endeavorsuite.com/images/catalogs/23872/products/detail/30EFI.jpg'
  if (cleanName.includes('40')) return 'https://cdnmedia.endeavorsuite.com/images/catalogs/23872/products/detail/40EFI.jpg'
  if (cleanName.includes('50')) return 'https://cdnmedia.endeavorsuite.com/images/catalogs/23872/products/detail/50EFI.jpg'
  if (cleanName.includes('60')) return 'https://cdnmedia.endeavorsuite.com/images/catalogs/23872/products/detail/60EFI.jpg'
  if (cleanName.includes('75')) return 'https://cdnmedia.endeavorsuite.com/images/catalogs/23872/products/detail/75EFI.jpg'
  if (cleanName.includes('90')) return 'https://cdnmedia.endeavorsuite.com/images/catalogs/23872/products/detail/90EFI.jpg'
  if (cleanName.includes('115')) return 'https://cdnmedia.endeavorsuite.com/images/catalogs/23872/products/detail/115ProXS.jpg'
  if (cleanName.includes('150')) return 'https://cdnmedia.endeavorsuite.com/images/catalogs/23872/products/detail/150ProXS.jpg'
  if (cleanName.includes('175')) return 'https://cdnmedia.endeavorsuite.com/images/catalogs/23872/products/detail/175ProXS.jpg'
  if (cleanName.includes('200') && cleanName.includes('pro')) return 'https://cdnmedia.endeavorsuite.com/images/catalogs/23872/products/detail/200ProXS.jpg'
  if (cleanName.includes('200')) return 'https://cdnmedia.endeavorsuite.com/images/catalogs/23872/products/detail/200Verado.jpg'
  if (cleanName.includes('250')) return 'https://cdnmedia.endeavorsuite.com/images/catalogs/23872/products/detail/250Verado.jpg'
  if (cleanName.includes('300')) return 'https://cdnmedia.endeavorsuite.com/images/catalogs/23872/products/detail/300Verado.jpg'
  if (cleanName.includes('350')) return 'https://cdnmedia.endeavorsuite.com/images/catalogs/23872/products/detail/350Verado.jpg'
  if (cleanName.includes('400')) return 'https://cdnmedia.endeavorsuite.com/images/catalogs/23872/products/detail/400Verado.jpg'
  
  // Default Mercury logo
  return 'https://cdnmedia.endeavorsuite.com/images/catalogs/23872/products/detail/mercury-logo.jpg'
}