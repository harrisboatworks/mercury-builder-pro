import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
}

// Lazy initialize Supabase client
async function getServiceClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!url || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  return createClient(url, serviceKey);
}

// Clean text utility
function cleanText(text: string): string {
  return text?.toString()?.trim()?.replace(/\s+/g, ' ') || '';
}

// SMS notification helper for unmatched motors
async function sendUnmatchedMotorAlert(pendingReviews: any[]): Promise<void> {
  try {
    // Check if SMS alerts are enabled
    const enableSmsAlerts = Deno.env.get('ENABLE_SMS_ALERTS');
    const adminPhone = Deno.env.get('ADMIN_PHONE');
    
    if (enableSmsAlerts !== 'true' || !adminPhone) {
      console.log('[SMS] SMS alerts disabled or no admin phone configured');
      return;
    }
    
    // Rate limiting: Check if we sent an alert in the last 4 hours
    const supabase = await getServiceClient();
    const fourHoursAgo = new Date();
    fourHoursAgo.setHours(fourHoursAgo.getHours() - 4);
    
    const { data: recentAlerts } = await supabase
      .from('sms_logs')
      .select('created_at')
      .eq('to_phone', adminPhone)
      .like('message', '%motors need matching review%')
      .gte('created_at', fourHoursAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (recentAlerts && recentAlerts.length > 0) {
      console.log('[SMS] Rate limit: Unmatched motor alert sent in last 4 hours, skipping');
      return;
    }
    
    // Prepare SMS data
    const motorData = pendingReviews.map(review => ({
      name: review.scraped_motor_data?.name || 'Unknown Motor',
      model_display: review.potential_matches?.[0]?.model_display || 'Unknown',
      score: Math.round(review.confidence_score || 0)
    }));
    
    // Call SMS service
    const smsPayload = {
      to: adminPhone,
      message_type: 'unmatched_motors',
      customer_details: {
        count: pendingReviews.length,
        motors: motorData
      }
    };
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    const smsResponse = await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(smsPayload)
    });
    
    if (smsResponse.ok) {
      console.log(`[SMS] Successfully sent unmatched motor alert for ${pendingReviews.length} motors`);
    } else {
      const errorText = await smsResponse.text();
      console.error(`[SMS] Failed to send alert: ${smsResponse.status} - ${errorText}`);
    }
    
  } catch (error) {
    console.error('[SMS] Error sending unmatched motor alert:', error.message);
  }
}

// Parse HTML page for motor data
function parseHTMLMotors(htmlText: string): any[] {
  const motors = [];
  
  try {
    // Look for motor card patterns in the HTML
    // This regex looks for div elements that contain motor information
    const motorCardRegex = /<div[^>]*class="[^"]*(?:inventory-item|motor-card|unit-card|search-result)[^"]*"[^>]*>[\s\S]*?(?=<div[^>]*class="[^"]*(?:inventory-item|motor-card|unit-card|search-result)|$)/gi;
    const cardMatches = htmlText.match(motorCardRegex) || [];
    
    // Also try a more general approach - look for sections containing "Mercury" and price info
    const fallbackRegex = /<div[^>]*>[\s\S]*?Mercury[\s\S]*?\$[\d,]+[\s\S]*?<\/div>/gi;
    const fallbackMatches = htmlText.match(fallbackRegex) || [];
    
    const allMatches = [...cardMatches, ...fallbackMatches];
    console.log(`[HTML-PARSE] Found ${allMatches.length} potential motor sections`);
    
    for (const cardHtml of allMatches) {
      try {
        // Extract title/model name
        const titleMatch = cardHtml.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/i) || 
                          cardHtml.match(/<title[^>]*>(.*?)<\/title>/i) ||
                          cardHtml.match(/Mercury[^<]*(\d+(?:\.\d+)?[^<]*(?:HP|ELPT|EXLPT|ELH|MH)[^<]*)/i);
        
        // Extract price
        const priceMatch = cardHtml.match(/\$[\d,]+(?:\.\d{2})?/);
        
        // Extract stock number (look for patterns like "Stock #", "VIN", etc.)
        const stockMatch = cardHtml.match(/(?:Stock|VIN|Model)\s*[#:]?\s*([A-Z0-9]+)/i);
        
        // Only process if we found Mercury-related content
        if (titleMatch && (cardHtml.toLowerCase().includes('mercury') || (titleMatch[1] && titleMatch[1].toLowerCase().includes('mercury')))) {
          const modelName = cleanText(titleMatch[1] || titleMatch[0]);
          const price = priceMatch ? parseFloat(priceMatch[0].replace(/[^0-9.]/g, '')) : null;
          const stockNumber = stockMatch ? cleanText(stockMatch[1]) : `HTML-${Date.now()}-${motors.length}`;
          
          // Basic validation - must have model name
          if (modelName && modelName.length > 5) {
            motors.push({
              title: modelName,
              modelName: modelName,
              stockNumber: stockNumber,
              price: price,
              manufacturer: 'mercury',
              usage: 'new',
              model_type: 'outboard',
              source: 'html',
              htmlData: cardHtml.substring(0, 500) // Keep sample for debugging
            });
            
            console.log(`[HTML-PARSE] Found motor: "${modelName}" (Stock: ${stockNumber}, Price: $${price})`);
          }
        }
      } catch (parseError) {
        console.log(`[HTML-PARSE] Error parsing motor card: ${parseError.message}`);
      }
    }
  } catch (error) {
    console.log(`[HTML-PARSE] Overall parsing error: ${error.message}`);
  }
  
  return motors;
}

// Merge XML and HTML data, giving priority to XML
function mergeMotorData(xmlMotors: any[], htmlMotors: any[]): any[] {
  const merged = [];
  const usedStockNumbers = new Set();
  
  // Add all XML motors first (they have priority)
  for (const xmlMotor of xmlMotors) {
    merged.push({ ...xmlMotor, source: 'xml' });
    usedStockNumbers.add(xmlMotor.stockNumber.toLowerCase());
  }
  
  // Add HTML motors that don't conflict with XML motors
  for (const htmlMotor of htmlMotors) {
    const stockKey = htmlMotor.stockNumber.toLowerCase();
    
    // Skip if this stock number already exists from XML
    if (usedStockNumbers.has(stockKey)) {
      console.log(`[MERGE] Skipping HTML motor "${htmlMotor.modelName}" - stock number ${htmlMotor.stockNumber} already exists in XML`);
      continue;
    }
    
    // Check for model name similarity to avoid duplicates
    let isDuplicate = false;
    for (const existingMotor of merged) {
      if (areSimilarMotors(htmlMotor.modelName, existingMotor.modelName)) {
        console.log(`[MERGE] Skipping HTML motor "${htmlMotor.modelName}" - similar to existing "${existingMotor.modelName}"`);
        isDuplicate = true;
        break;
      }
    }
    
    if (!isDuplicate) {
      merged.push({ ...htmlMotor, source: 'html' });
      usedStockNumbers.add(stockKey);
    }
  }
  
  return merged;
}

// Helper to check if two motor names are similar (avoid duplicates)
function areSimilarMotors(name1: string, name2: string): boolean {
  const clean1 = name1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const clean2 = name2.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // If one string contains the other or they're very similar
  if (clean1.includes(clean2) || clean2.includes(clean1)) {
    return true;
  }
  
  // Check if they have the same HP and similar rigging codes
  const hp1 = name1.match(/(\d+(?:\.\d+)?)/);
  const hp2 = name2.match(/(\d+(?:\.\d+)?)/);
  
  if (hp1 && hp2 && hp1[1] === hp2[1]) {
    // Same HP - check for rigging code overlap
    const codes1 = name1.match(/\b(ELPT|ELHPT|EXLPT|EH|MH|MLH|XL|XXL|CT|EFI|DTS)\b/gi) || [];
    const codes2 = name2.match(/\b(ELPT|ELHPT|EXLPT|EH|MH|MLH|XL|XXL|CT|EFI|DTS)\b/gi) || [];
    
    // If they share rigging codes, likely the same motor
    const commonCodes = codes1.filter(c1 => codes2.some(c2 => c1.toLowerCase() === c2.toLowerCase()));
    if (commonCodes.length > 0) {
      return true;
    }
  }
  
  return false;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    console.log('[STOCK-SYNC] Starting hybrid XML + HTML stock inventory sync...');
    
    const supabase = await getServiceClient();
    const body = await req.json().catch(() => ({}));
    const { preview = false } = body;
    
    // Create sync log entry
    const { data: syncLog, error: logError } = await supabase
      .from('sync_logs')
      .insert({ 
        sync_type: 'stock',
        status: 'running',
        details: { preview, method: 'hybrid_xml_html' }
      })
      .select()
      .single();
    
    if (logError) console.log(`[SYNC-LOG] Error creating log: ${logError.message}`);
    
    // Step 1: Fetch XML inventory from Harris Boat Works
    console.log('[STOCK-SYNC] Fetching XML inventory from Harris...');
    const xmlUrl = 'https://www.harrisboatworks.ca/unitinventory_univ.xml';
    const xmlResponse = await fetch(xmlUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Stock-Sync/1.0)' }
    });
    
    if (!xmlResponse.ok) {
      throw new Error(`XML fetch failed: ${xmlResponse.status} ${xmlResponse.statusText}`);
    }
    
    const xmlText = await xmlResponse.text();
    console.log(`[STOCK-SYNC] Fetched XML feed (${xmlText.length} chars)`);
    
    // Step 2: Parse XML and filter Mercury motors
    console.log('[STOCK-SYNC] Parsing XML for Mercury motors...');
    
    // Extract all items using regex
    const itemMatches = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];
    console.log(`[STOCK-SYNC] Found ${itemMatches.length} total items in XML`);
    
    // Process Mercury motors with simplified filtering
    const mercuryMotors = [];
    const processedCount = { total: 0, mercury: 0, new_condition: 0, valid: 0 };

    // XML field extraction helper
    const extractField = (item: string, patterns: string[]) => {
      for (const pattern of patterns) {
        const regex = new RegExp(pattern, 'i');
        const match = item.match(regex);
        if (match) {
          return cleanText(match[1]);
        }
      }
      return '';
    };

    for (const item of itemMatches) {
      processedCount.total++;
      
      // Extract basic fields using correct XML field names
      const manufacturer = extractField(item, [
        '<manufacturer>(.*?)</manufacturer>',
        '<make>(.*?)</make>'
      ]).toLowerCase();
      
      const usage = extractField(item, [
        '<usage>(.*?)</usage>',
        '<condition>(.*?)</condition>',
        '<new>(.*?)</new>'
      ]).toLowerCase();
      
      const model_type = extractField(item, [
        '<model_type>(.*?)</model_type>',
        '<type>(.*?)</type>'
      ]).toLowerCase();
      
      const title = extractField(item, ['<title>(.*?)</title>']);
      const modelName = extractField(item, ['<model_name>(.*?)</model_name>']) || title;
      
      // Filter 1: Mercury only (exact match)
      const isMercury = manufacturer.toLowerCase() === 'mercury';
      
      if (!isMercury) continue;
      processedCount.mercury++;
      
      // Filter 2: Must be outboard motor
      const isOutboard = model_type.includes('outboard');
      
      if (!isOutboard) continue;
      
      // Filter 3: New condition only (exact match)
      const isNew = usage === 'new';
      
      if (!isNew) continue;
      processedCount.new_condition++;
      
      // Extract additional data
      const stockNumber = extractField(item, [
        '<stocknumber>(.*?)</stocknumber>',
        '<stock_number>(.*?)</stock_number>',
        '<vin>(.*?)</vin>'
      ]);
      
      const price = extractField(item, [
        '<price>(.*?)</price>',
        '<internetprice>(.*?)</internetprice>',
        '<msrp>(.*?)</msrp>'
      ]);
      
      // Only keep motors with stock numbers (indicates they're real inventory)
      if (!stockNumber) continue;
      
      processedCount.valid++;
      
      mercuryMotors.push({
        title,
        modelName,
        stockNumber,
        price: price ? parseFloat(price.replace(/[^0-9.]/g, '')) : null,
        manufacturer,
        usage,
        model_type,
        xmlData: item
      });
      
      console.log(`[STOCK-SYNC] Found Mercury motor: "${modelName}" (Stock: ${stockNumber})`);
    }
    
    console.log(`[STOCK-SYNC] Processed ${processedCount.total} items → ${processedCount.mercury} Mercury → ${processedCount.new_condition} New & Outboard → ${processedCount.valid} Valid`);
    console.log(`[STOCK-SYNC] Found ${mercuryMotors.length} Mercury motors in XML feed`);
    
    // Step 2.5: Scrape HTML page for additional motors
    console.log('[STOCK-SYNC] Scraping HTML page for in-stock motors...');
    const htmlUrl = 'https://www.harrisboatworks.ca/search/inventory/availability/In%20Stock/brand/Mercury/usage/New';
    
    let htmlMotors = [];
    try {
      const htmlResponse = await fetch(htmlUrl, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        }
      });
      
      if (htmlResponse.ok) {
        const htmlText = await htmlResponse.text();
        console.log(`[STOCK-SYNC] Fetched HTML page (${htmlText.length} chars)`);
        
        // Parse HTML for motor data
        htmlMotors = parseHTMLMotors(htmlText);
        console.log(`[STOCK-SYNC] Found ${htmlMotors.length} motors from HTML page`);
      } else {
        console.log(`[STOCK-SYNC] HTML fetch failed: ${htmlResponse.status} - continuing with XML only`);
      }
    } catch (htmlError) {
      console.log(`[STOCK-SYNC] HTML scraping error: ${htmlError.message} - continuing with XML only`);
    }
    
    // Step 2.6: Merge XML and HTML data (XML takes precedence)
    const allMotors = mergeMotorData(mercuryMotors, htmlMotors);
    console.log(`[STOCK-SYNC] Total motors after merge: ${allMotors.length} (${mercuryMotors.length} XML + ${htmlMotors.length} HTML → ${allMotors.length} unique)`);
    
    // Step 3: Fetch existing database motors
    const { data: dbMotors, error: dbError } = await supabase
      .from('motor_models')
      .select('id, model_display, horsepower, model_number, in_stock, stock_quantity, stock_number, availability')
      .order('horsepower', { ascending: true });
    
    if (dbError) {
      throw new Error(`Database fetch error: ${dbError.message}`);
    }
    
    console.log(`[STOCK-SYNC] Found ${dbMotors.length} motors in database`);
    
    // Step 4: Fuzzy match XML motors to database motors
    const matches = [];
    const stockUpdates = [];
    
    // Helper function to extract HP from model name
    function extractHP(modelName: string): number | null {
      const hpMatch = modelName.match(/(\d+(?:\.\d+)?)\s*(?:hp|HP)/i);
      if (hpMatch) {
        return parseFloat(hpMatch[1]);
      }
      // Try without HP suffix (e.g., "25 ELPT")
      const numMatch = modelName.match(/\b(\d+(?:\.\d+)?)\s+[A-Z]/);
      if (numMatch) {
        const hp = parseFloat(numMatch[1]);
        if (hp >= 2.5 && hp <= 600) return hp;
      }
      return null;
    }
    
    // Helper function to extract rigging codes
    function extractRiggingCodes(modelName: string): string[] {
      const codes = [];
      const codePattern = /\b(ELPT|ELHPT|EXLPT|EH|MH|MLH|XL|XXL|CT|EFI|DTS)\b/gi;
      const matches = modelName.match(codePattern);
      if (matches) {
        codes.push(...matches.map(c => c.toUpperCase()));
      }
      return codes;
    }
    
    // Enhanced match scoring with stricter criteria for auto-matching
    function calculateMatchScore(xmlMotor: any, dbMotor: any): { score: number; isAutoMatch: boolean; details: any } {
      let score = 0;
      const details = { hp: false, family: false, rigging: false };
      let isAutoMatch = true;
      
      // HP matching (40% weight) - EXACT match required for auto-match
      const xmlHP = extractHP(xmlMotor.modelName);
      const dbHP = dbMotor.horsepower;
      
      if (xmlHP && dbHP) {
        const hpDiff = Math.abs(xmlHP - dbHP);
        if (hpDiff === 0) {
          score += 40;
          details.hp = true;
        } else {
          isAutoMatch = false;
          if (hpDiff <= 5) score += 30;
          else if (hpDiff <= 10) score += 20;
          else if (hpDiff <= 20) score += 10;
        }
      } else {
        isAutoMatch = false;
      }
      
      // Model family matching (30% weight) - EXACT match required for auto-match
      const xmlFamily = (xmlMotor.modelName || '').toLowerCase();
      const dbFamily = (dbMotor.model_display || '').toLowerCase();
      
      let familyMatch = false;
      if (xmlFamily.includes('fourstroke') && dbFamily.includes('fourstroke')) familyMatch = true;
      else if (xmlFamily.includes('proxs') && dbFamily.includes('proxs')) familyMatch = true;
      else if (xmlFamily.includes('verado') && dbFamily.includes('verado')) familyMatch = true;
      else if (xmlFamily.includes('seapro') && dbFamily.includes('seapro')) familyMatch = true;
      else if (xmlFamily.includes('racing') && dbFamily.includes('racing')) familyMatch = true;
      
      if (familyMatch) {
        score += 30;
        details.family = true;
      } else {
        isAutoMatch = false;
        // Partial matches for manual review
        if (xmlFamily && dbFamily) score += 15;
      }
      
      // Rigging code matching (30% weight) - EXACT codes required for auto-match
      const xmlCodes = extractRiggingCodes(xmlMotor.modelName);
      const dbCodes = extractRiggingCodes(dbMotor.model_display || '');
      
      const commonCodes = xmlCodes.filter(code => 
        dbCodes.some(dbCode => dbCode === code)
      );
      
      if (xmlCodes.length > 0 && commonCodes.length === xmlCodes.length) {
        score += 30;
        details.rigging = true;
      } else {
        isAutoMatch = false;
        if (commonCodes.length > 0) {
          score += 20 * (commonCodes.length / Math.max(xmlCodes.length, 1));
        }
      }
      
      // Auto-match requires 90%+ score AND exact matches in all categories
      isAutoMatch = isAutoMatch && score >= 90;
      
      return { 
        score: Math.min(score, 100), 
        isAutoMatch,
        details
      };
    }
    
    // 2-TIER MATCHING SYSTEM: Auto-match high confidence, queue uncertain matches
    const pendingReviews = [];
    let autoMatched = 0;
    let queuedForReview = 0;
    let rejected = 0;

    // Check for existing historical mappings first
    const { data: historicalMappings } = await supabase
      .from('motor_match_mappings')
      .select('*')
      .eq('is_active', true);

    // Helper to extract motor identification data
    function extractMotorData(motor: any) {
      return {
        name: motor.modelName,
        source: motor.source || 'xml',
        hp: extractHP(motor.modelName),
        family: getMotorFamily(motor.modelName),
        code: extractRiggingCodes(motor.modelName).join('-'),
        stock: motor.stockNumber
      };
    }

    function getMotorFamily(modelName: string): string {
      const name = modelName.toLowerCase();
      if (name.includes('fourstroke')) return 'FourStroke';
      if (name.includes('proxs')) return 'ProXS';
      if (name.includes('verado')) return 'Verado';
      if (name.includes('seapro')) return 'SeaPro';
      if (name.includes('racing')) return 'Racing';
      return '';
    }

    for (const motor of allMotors) {
      const motorData = extractMotorData(motor);
      let bestMatches = [];
      
      // Check historical mappings first
      const historicalMatch = historicalMappings?.find(mapping => 
        mapping.scraped_pattern === motorData.name
      );
      
      if (historicalMatch) {
        const dbMotor = dbMotors.find(m => m.id === historicalMatch.motor_model_id);
        if (dbMotor) {
          // Use historical mapping - auto-match
          autoMatched++;
          
          const wasInStock = dbMotor.in_stock;
          const nowInStock = true;
          
          if (!wasInStock && nowInStock) {
            stockUpdates.push({
              motor_id: dbMotor.id,
              model_display: dbMotor.model_display,
              new_stock_status: nowInStock,
              new_quantity: 1,
              new_stock_number: motor.stockNumber,
              new_dealer_price: motor.price,
              new_availability: 'In Stock',
              match_score: 1.0,
              match_reason: `Historical mapping: "${motorData.name}" → "${dbMotor.model_display}"`
            });
          }
          
          console.log(`[HISTORICAL MATCH] "${motorData.name}" (${motorData.source}) → "${dbMotor.model_display}" (100%)`);
          continue;
        }
      }
      
      // Calculate match scores for all database motors
      for (const dbMotor of dbMotors) {
        const matchResult = calculateMatchScore(motor, dbMotor);
        bestMatches.push({
          motor: dbMotor,
          ...matchResult
        });
      }
      
      // Sort by score descending
      bestMatches.sort((a, b) => b.score - a.score);
      
      const topMatch = bestMatches[0];
      
      if (topMatch && topMatch.score >= 90 && topMatch.isAutoMatch) {
        // AUTO-MATCH: High confidence (90%+) with exact criteria
        autoMatched++;
        
        const wasInStock = topMatch.motor.in_stock;
        const nowInStock = true;
        
        if (!wasInStock && nowInStock) {
          stockUpdates.push({
            motor_id: topMatch.motor.id,
            model_display: topMatch.motor.model_display,
            new_stock_status: nowInStock,
            new_quantity: 1,
            new_stock_number: motor.stockNumber,
            new_dealer_price: motor.price,
            new_availability: 'In Stock',
            match_score: topMatch.score / 100,
            match_reason: `Auto-match: "${motorData.name}" → "${topMatch.motor.model_display}" (${Math.round(topMatch.score)}%)`
          });
        }
        
        console.log(`[AUTO-MATCH] "${motorData.name}" (${motorData.source}) → "${topMatch.motor.model_display}" (${topMatch.score}%)`);
        
      } else if (topMatch && topMatch.score >= 60) {
        // MANUAL REVIEW: Medium confidence (60-89%)
        queuedForReview++;
        
        const top3Matches = bestMatches.slice(0, 3).map(match => ({
          motor_id: match.motor.id,
          model_display: match.motor.model_display,
          horsepower: match.motor.horsepower,
          match_score: match.score,
          match_details: match.details,
          current_stock_status: match.motor.in_stock
        }));
        
        pendingReviews.push({
          scraped_motor_data: motorData,
          potential_matches: top3Matches,
          confidence_score: topMatch.score
        });
        
        console.log(`[REVIEW QUEUE] "${motorData.name}" (${motorData.source}) → Top match: "${topMatch.motor.model_display}" (${topMatch.score}%)`);
        
      } else {
        // REJECT: Low confidence (<60%)
        rejected++;
        console.log(`[REJECTED] "${motorData.name}" (${motorData.source}) → No suitable match (${topMatch ? topMatch.score : 0}%)`);
      }
    }
    
    console.log(`[STOCK-SYNC] Processing results: ${autoMatched} auto-matched, ${queuedForReview} queued for review, ${rejected} rejected`);

    // Store pending reviews in database (if any and not preview mode)
    if (pendingReviews.length > 0 && !preview) {
      for (const review of pendingReviews) {
        await supabase
          .from('pending_motor_matches')
          .insert(review);
      }
      console.log(`[STOCK-SYNC] Stored ${pendingReviews.length} matches for manual review`);
    }
    
    console.log(`[STOCK-SYNC] Matched ${autoMatched} of ${allMotors.length} total motors to database (${autoMatched} auto, ${queuedForReview} review, ${rejected} rejected)`);
    
    // Step 5: Prepare out-of-stock updates (mark unmatched motors as out of stock)
    const matchedMotorIds = new Set(stockUpdates.map(u => u.motor_id));
    const outOfStockUpdates = dbMotors
      .filter(motor => motor.in_stock && !matchedMotorIds.has(motor.id))
      .map(motor => ({
        motor_id: motor.id,
        model_display: motor.model_display,
        new_stock_status: false,
        new_quantity: 0,
        new_stock_number: null,
        new_dealer_price: null,
        new_availability: 'Brochure',
        match_score: 1.0,
        match_reason: 'Not found in XML feed - marked out of stock'
      }));
    
    const allUpdates = [...stockUpdates, ...outOfStockUpdates];
    
    // Calculate summary
    const changesSummary = {
      newly_in_stock: stockUpdates.length,
      newly_out_of_stock: outOfStockUpdates.length,
      still_in_stock: 0,
      total_changes: allUpdates.length
    };
    
    console.log(`[STOCK-SYNC] Changes: ${changesSummary.newly_in_stock} newly in stock, ${changesSummary.newly_out_of_stock} newly out of stock`);
    
    // Enhanced summary for 2-tier system
    const summary = {
      motors_processed: allMotors.length,
      auto_matched: autoMatched,
      queued_for_review: queuedForReview,
      rejected: rejected,
      newly_in_stock: stockUpdates.length,
      newly_out_of_stock: outOfStockUpdates.length,
      stock_updates: stockUpdates.map(u => ({
        id: u.motor_id,
        model_display: u.model_display,
        action: u.new_stock_status ? 'mark_in_stock' : 'mark_out_of_stock',
        was_in_stock: !u.new_stock_status,
        now_in_stock: u.new_stock_status,
        match_score: Math.round(u.match_score * 100),
        match_quality: u.match_score >= 0.9 ? 'auto' : 'manual',
        scraped_motor: u.match_reason
      })),
      pending_reviews: preview ? pendingReviews : []
    };

    // Step 6: Apply updates or return preview
    if (preview) {
      // Return preview data
      const previewResult = {
        success: true,
        xml_motors_found: mercuryMotors.length,
        html_motors_found: htmlMotors.length,
        summary,
        changes_summary: changesSummary,
        stock_updates: allUpdates
      };
      
      // Update sync log
      if (syncLog?.id) {
        await supabase
          .from('sync_logs')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString(),
            motors_processed: allMotors.length,
            motors_in_stock: stockUpdates.length,
            details: { 
              preview: true, 
              method: 'hybrid_xml_html_2tier',
              xml_motors: mercuryMotors.length,
              html_motors: htmlMotors.length,
              total_motors: allMotors.length,
              auto_matched: autoMatched,
              queued_for_review: queuedForReview,
              rejected: rejected,
              ...changesSummary 
            }
          })
          .eq('id', syncLog.id);
      }
      
      return new Response(JSON.stringify(previewResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Apply actual updates
    let updatesApplied = 0;
    
    for (const update of allUpdates) {
      try {
        const { error: updateError } = await supabase
          .from('motor_models')
          .update({
            in_stock: update.new_stock_status,
            stock_quantity: update.new_quantity,
            stock_number: update.new_stock_number,
            dealer_price_live: update.new_dealer_price,
            availability: update.new_availability,
            last_stock_check: new Date().toISOString()
          })
          .eq('id', update.motor_id);
        
        if (updateError) {
          console.error(`[UPDATE-ERROR] Motor ${update.motor_id}: ${updateError.message}`);
        } else {
          updatesApplied++;
        }
      } catch (error) {
        console.error(`[UPDATE-EXCEPTION] Motor ${update.motor_id}:`, error);
      }
    }
    
    console.log(`[STOCK-SYNC] Applied ${updatesApplied} of ${allUpdates.length} updates`);
    
    // Send SMS notification for unmatched motors (if enabled and new ones found)
    if (pendingReviews.length > 0) {
      await sendUnmatchedMotorAlert(pendingReviews);
    }
    
    // Update sync log
    if (syncLog?.id) {
      await supabase
        .from('sync_logs')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          motors_processed: allMotors.length,
          motors_in_stock: stockUpdates.length,
          details: { 
            preview: false,
            method: 'hybrid_xml_html',
            xml_motors: mercuryMotors.length,
            html_motors: htmlMotors.length,
            total_motors: allMotors.length,
            updates_applied: updatesApplied,
            ...changesSummary
          }
        })
        .eq('id', syncLog.id);
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: '2-tier stock sync completed successfully',
      xml_motors_found: mercuryMotors.length,
      html_motors_found: htmlMotors.length,
      summary,
      updates_applied: updatesApplied,
      changes_summary: changesSummary
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('[STOCK-SYNC] Error:', error);
    
    // Update sync log with error
    const supabase = await getServiceClient();
    if (syncLog?.id) {
      await supabase
        .from('sync_logs')
        .update({ 
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', syncLog.id);
    }
    
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
