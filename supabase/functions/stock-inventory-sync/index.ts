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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const DEBUG_VERSION = 'v3.1-debug-' + new Date().toISOString().substring(0,16);
    console.log(`[STOCK-SYNC] Starting stock inventory sync ${DEBUG_VERSION}...`);
    
    const supabase = await getServiceClient();
    const body = await req.json().catch(() => ({}));
    const { preview = false } = body;
    
    // Create sync log entry with version tracking
    const { data: syncLog, error: logError } = await supabase
      .from('sync_logs')
      .insert({ 
        sync_type: 'stock',
        status: 'running',
        details: { version: DEBUG_VERSION, preview }
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
    
    // Parse XML using regex approach (like working sync function)
    console.log('[STOCK-SYNC] Parsing XML with regex approach...');
    
    // Extract all items using regex
    const itemMatches = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];
    console.log(`[STOCK-SYNC] Found ${itemMatches.length} total items in XML`);
    
    // Add debugging for XML structure
    if (itemMatches.length > 0) {
      console.log('[STOCK-SYNC] First item sample:', itemMatches[0].substring(0, 500));
    } else {
      console.log('[STOCK-SYNC] WARNING: No <item> tags found in XML');
      console.log('[STOCK-SYNC] XML sample:', xmlText.substring(0, 1000));
    }
    
    // Step 2: Process and filter Mercury motors with comprehensive debugging
    const mercuryMotors = [];
    const debugStats = {
      total_items: itemMatches.length,
      mercury_pass: 0,
      mercury_fail: 0,
      condition_pass: 0,
      condition_fail: 0,
      boat_exclusion_pass: 0,
      boat_exclusion_fail: 0,
      motor_detection_pass: 0,
      motor_detection_fail: 0,
      final_valid: 0,
      sample_failures: {
        mercury_detection: [],
        condition_filtering: [],
        boat_exclusions: [],
        motor_detection: []
      }
    };
    
    console.log(`[DEBUG] Starting to process ${itemMatches.length} XML items`);
    
    // XML field extraction helper
    const extractField = (item: string, patterns: string[]) => {
      for (const pattern of patterns) {
        const regex = new RegExp(pattern, 'i');
        const match = item.match(regex);
        if (match) {
          return match[1]?.trim() || '';
        }
      }
      return '';
    };
    
    for (let i = 0; i < itemMatches.length; i++) {
      const item = itemMatches[i];
      // Extract basic fields with debug logging
      const manufacturer = extractField(item, [
        '<manufacturer>(.*?)</manufacturer>',
        '<make>(.*?)</make>',
        '<brand>(.*?)</brand>',
        '<mfg>(.*?)</mfg>'
      ]).toLowerCase();
      
      const condition = extractField(item, [
        '<condition>(.*?)</condition>',
        '<status>(.*?)</status>',
        '<state>(.*?)</state>',
        '<unitcondition>(.*?)</unitcondition>'
      ]).toLowerCase();
      
      const category = extractField(item, [
        '<category>(.*?)</category>',
        '<type>(.*?)</type>',
        '<producttype>(.*?)</producttype>',
        '<vehicletype>(.*?)</vehicletype>',
        '<unittype>(.*?)</unittype>'
      ]).toLowerCase();
      
      const title = extractField(item, [
        '<title>(.*?)</title>',
        '<name>(.*?)</name>',
        '<model>(.*?)</model>',
        '<unitname>(.*?)</unitname>'
      ]);
      
      const description = extractField(item, [
        '<description><!\\[CDATA\\[(.*?)\\]\\]></description>',
        '<description>(.*?)</description>',
        '<desc>(.*?)</desc>'
      ]);

      // Debug log every 10th item in detail
      if (i % 10 === 0 || i < 5) {
        console.log(`[DEBUG-ITEM-${i}] Title: "${title}"`);
        console.log(`[DEBUG-ITEM-${i}] Manufacturer: "${manufacturer}"`);
        console.log(`[DEBUG-ITEM-${i}] Condition: "${condition}"`);
        console.log(`[DEBUG-ITEM-${i}] Category: "${category}"`);
        console.log(`[DEBUG-ITEM-${i}] Description preview: "${description.substring(0, 100)}..."`);
      }

      // STEP 1: Mercury detection with detailed logging
      const titleLower = title.toLowerCase();
      const descLower = description.toLowerCase();
      const isMercury = manufacturer.includes('mercury') || 
                       (titleLower.includes('mercury') && !titleLower.includes('legend'));
      
      if (isMercury) {
        debugStats.mercury_pass++;
      } else {
        debugStats.mercury_fail++;
        if (debugStats.sample_failures.mercury_detection.length < 5) {
          debugStats.sample_failures.mercury_detection.push({
            title,
            manufacturer,
            reason: `No Mercury found in manufacturer:"${manufacturer}" or title:"${title}"`
          });
        }
        if (i < 20) { // Debug first 20 failures in detail
          console.log(`[DEBUG-MERCURY-FAIL-${i}] Title: "${title}" | Manufacturer: "${manufacturer}"`);
        }
        continue; // Skip non-Mercury items
      }
      
      // STEP 2: Condition filtering with detailed logging
      const isNew = !condition.includes('used') && 
                   !condition.includes('pre-owned') && 
                   !condition.includes('preowned');
      
      if (isNew) {
        debugStats.condition_pass++;
      } else {
        debugStats.condition_fail++;
        if (debugStats.sample_failures.condition_filtering.length < 5) {
          debugStats.sample_failures.condition_filtering.push({
            title,
            condition,
            reason: `Condition "${condition}" indicates used/pre-owned`
          });
        }
        if (i < 20) {
          console.log(`[DEBUG-CONDITION-FAIL-${i}] Title: "${title}" | Condition: "${condition}"`);
        }
        continue; // Skip used items
      }
      
      // STEP 3: Smart exclusion filtering - only exclude clear non-motors
      const hardExclusions = [
        'legend', 'uttern', 'pontoon', 'deck boat', 'fishing boat',
        'bass boat', 'jon boat', 'aluminum boat', 'fiberglass boat', 
        'trailer', 'pwc', 'jet ski', 'atv', 'utv', 'snowmobile'
      ];
      
      // Only exclude if title contains hard exclusions (not description)
      const titleMatchedExclusions = hardExclusions.filter(exclusion => 
        titleLower.includes(exclusion)
      );
      
      // Special case: If title contains "mercury" + motor terms, don't exclude
      const hasMotorTermsInTitle = titleLower.includes('fourstroke') || 
        titleLower.includes('pro xs') || titleLower.includes('proxs') ||
        titleLower.includes('seapro') || titleLower.includes('verado') ||
        /\d+\s*hp/.test(titleLower);
      
      const isBoatOrOther = titleMatchedExclusions.length > 0 && !hasMotorTermsInTitle;
      
      if (!isBoatOrOther) {
        debugStats.boat_exclusion_pass++;
      } else {
        debugStats.boat_exclusion_fail++;
        if (debugStats.sample_failures.boat_exclusions.length < 5) {
          debugStats.sample_failures.boat_exclusions.push({
            title,
            category,
            matched_exclusions: titleMatchedExclusions,
            reason: `Contains exclusion terms in title: ${titleMatchedExclusions.join(', ')}`
          });
        }
        if (i < 20) {
          console.log(`[DEBUG-BOAT-FAIL-${i}] Title: "${title}" | Matched exclusions: [${titleMatchedExclusions.join(', ')}]`);
        }
        continue; // Skip boats and other excluded items
      }
      
      // STEP 4: Motor detection with detailed logging
      const mercuryMotorRequired = [
        'fourstroke', 'four stroke', 'four-stroke',
        'proxs', 'pro xs', 'pro-xs',
        'seapro', 'sea pro', 'sea-pro',
        'verado', 'racing', 'outboard'
      ];
      
      const mercuryRiggingCodes = [
        'elpt', 'elhpt', 'exlpt', 'eh', 'mh', 'lh',
        'xl', 'xxl', 'xxxl',
        'ct', 'command thrust',
        'efi', 'dts', 'tiller'
      ];
      
      // HP detection with reasonable ranges
      const hpMatch = titleLower.match(/(\d+(?:\.\d+)?)\s*hp/);
      const hasValidHP = hpMatch && parseFloat(hpMatch[1]) >= 2.5 && parseFloat(hpMatch[1]) <= 600;
      
      const matchedMotorIndicators = mercuryMotorRequired.filter(indicator => 
        titleLower.includes(indicator) || descLower.includes(indicator)
      );
      const hasMotorIndicator = matchedMotorIndicators.length > 0;
      
      const matchedRiggingCodes = mercuryRiggingCodes.filter(code =>
        titleLower.includes(code) || descLower.includes(code)
      );
      const hasRiggingCode = matchedRiggingCodes.length > 0;
      
      // Motor must have HP OR motor indicator OR rigging code
      const isMotor = hasValidHP || hasMotorIndicator || hasRiggingCode;
      
      if (isMotor) {
        debugStats.motor_detection_pass++;
        console.log(`[DEBUG-MOTOR-PASS-${i}] "${title}" | HP: ${hpMatch ? hpMatch[1] : 'none'} | Indicators: [${matchedMotorIndicators.join(',')}] | Rigging: [${matchedRiggingCodes.join(',')}]`);
      } else {
        debugStats.motor_detection_fail++;
        if (debugStats.sample_failures.motor_detection.length < 5) {
          debugStats.sample_failures.motor_detection.push({
            title,
            hp_match: hpMatch ? hpMatch[1] : null,
            motor_indicators: matchedMotorIndicators,
            rigging_codes: matchedRiggingCodes,
            reason: 'No HP, motor indicators, or rigging codes found'
          });
        }
        if (i < 20) {
          console.log(`[DEBUG-MOTOR-FAIL-${i}] "${title}" | HP: ${hpMatch ? hpMatch[1] : 'none'} | Indicators: [${matchedMotorIndicators.join(',')}] | Rigging: [${matchedRiggingCodes.join(',')}]`);
        }
        continue; // Skip non-motor items
      }
      
      // FINAL: All checks passed - this is a valid Mercury motor
      debugStats.final_valid++;
      console.log(`[DEBUG-VALID-${debugStats.final_valid}] PASSED ALL FILTERS: "${title}"`);

      // Create motor object if valid
      mercuryMotors.push({
        xmlData: item,
        extractedData: {
          title,
          description,
          manufacturer,
          condition,
          category,
          stockNumber: extractField(item, [
            '<stocknumber>(.*?)</stocknumber>',
            '<stock_number>(.*?)</stock_number>',
            '<vin>(.*?)</vin>',
            '<id>(.*?)</id>'
          ]),
          price: extractField(item, [
            '<price>(.*?)</price>',
            '<cost>(.*?)</cost>',
            '<msrp>(.*?)</msrp>'
          ]),
          quantity: extractField(item, [
            '<quantity>(.*?)</quantity>',
            '<qty>(.*?)</qty>',
            '<stock>(.*?)</stock>'
          ]) || '1'
        }
      });
    }
    
    // COMPREHENSIVE DEBUG SUMMARY
    console.log(`[DEBUG-SUMMARY] ======= FILTERING RESULTS =======`);
    console.log(`[DEBUG-SUMMARY] Total XML items processed: ${debugStats.total_items}`);
    console.log(`[DEBUG-SUMMARY] Mercury detection - Pass: ${debugStats.mercury_pass}, Fail: ${debugStats.mercury_fail}`);
    console.log(`[DEBUG-SUMMARY] Condition filtering - Pass: ${debugStats.condition_pass}, Fail: ${debugStats.condition_fail}`);
    console.log(`[DEBUG-SUMMARY] Boat exclusion - Pass: ${debugStats.boat_exclusion_pass}, Fail: ${debugStats.boat_exclusion_fail}`);
    console.log(`[DEBUG-SUMMARY] Motor detection - Pass: ${debugStats.motor_detection_pass}, Fail: ${debugStats.motor_detection_fail}`);
    console.log(`[DEBUG-SUMMARY] Final valid Mercury motors: ${debugStats.final_valid}`);
    
    // Log sample failures for analysis
    console.log(`[DEBUG-SUMMARY] ======= SAMPLE FAILURES =======`);
    if (debugStats.sample_failures.mercury_detection.length > 0) {
      console.log(`[DEBUG-SAMPLE-MERCURY-FAILS]`);
      debugStats.sample_failures.mercury_detection.forEach((failure, i) => {
        console.log(`  ${i + 1}. "${failure.title}" - ${failure.reason}`);
      });
    }
    
    if (debugStats.sample_failures.condition_filtering.length > 0) {
      console.log(`[DEBUG-SAMPLE-CONDITION-FAILS]`);
      debugStats.sample_failures.condition_filtering.forEach((failure, i) => {
        console.log(`  ${i + 1}. "${failure.title}" - ${failure.reason}`);
      });
    }
    
    if (debugStats.sample_failures.boat_exclusions.length > 0) {
      console.log(`[DEBUG-SAMPLE-BOAT-FAILS]`);
      debugStats.sample_failures.boat_exclusions.forEach((failure, i) => {
        console.log(`  ${i + 1}. "${failure.title}" - ${failure.reason}`);
      });
    }
    
    if (debugStats.sample_failures.motor_detection.length > 0) {
      console.log(`[DEBUG-SAMPLE-MOTOR-FAILS]`);
      debugStats.sample_failures.motor_detection.forEach((failure, i) => {
        console.log(`  ${i + 1}. "${failure.title}" - HP:${failure.hp_match}, Indicators:[${failure.motor_indicators.join(',')}], Rigging:[${failure.rigging_codes.join(',')}]`);
      });
    }
    
    console.log(`[STOCK-SYNC] Filtered to ${mercuryMotors.length} Mercury outboard motors`);
    
    // Store debug stats in database for analysis
    try {
      await supabase
        .from('sync_logs')
        .update({ 
          details: { 
            version: DEBUG_VERSION, 
            debug_stats: debugStats,
            xml_items_count: itemMatches.length,
            mercury_motors_found: mercuryMotors.length
          }
        })
        .eq('id', syncLog?.id);
    } catch (e) {
      console.log('[DEBUG] Could not store debug stats:', e.message);
    }
    
    // Step 3: Fetch existing database motors
    const { data: dbMotors, error: dbError } = await supabase
      .from('motor_models')
      .select('id, model_display, horsepower, family, in_stock, stock_quantity, stock_number, availability')
      .order('horsepower', { ascending: true });
    
    if (dbError) {
      throw new Error(`Database fetch error: ${dbError.message}`);
    }
    
    console.log(`[STOCK-SYNC] Found ${dbMotors.length} motors in database`);
    
    // Step 4: Match XML motors to database motors using improved algorithm
    const matches: Array<{
      xmlMotor: any;
      dbMotor: any;
      score: number;
      reason: string;
    }> = [];
    
    // Enhanced normalization functions (from working sync)
    function normalizeTitle(title: string): { normalized: string, hp: number | null, codes: string[] } {
      let normalized = title
        .replace(/^\d{4}\s+/i, '') // Remove year at start
        .replace(/mercury\s+/i, '') // Remove Mercury brand
        .replace(/fourstroke\s+/i, 'FS ') // Normalize FourStroke
        .replace(/pro\s+xs®?\s+/i, 'ProXS ') // Normalize Pro XS
        .replace(/\s+/g, ' ') // Clean up spacing
        .trim();

      // Enhanced HP extraction
      const hpPatterns = [
        /^(\d+(?:\.\d+)?)\s+[A-Z]/,       // "9.9 EH", "115 L"
        /(\d+(?:\.\d+)?)\s*hp\b/i,        // "25hp", "25 hp"
        /(\d+(?:\.\d+)?)\s*HP\b/,         // "25HP", "25 HP"
        /\b(\d+(?:\.\d+)?)\s*horsepower\b/i, // "25 horsepower"
      ];
      
      let hp = null;
      for (const pattern of hpPatterns) {
        const match = normalized.match(pattern);
        if (match) {
          const hpValue = parseFloat(match[1]);
          if (hpValue > 0 && hpValue <= 1000) {
            hp = hpValue;
            break;
          }
        }
      }

      // Extract rigging codes
      const codes = [];
      const codeMatches = normalized.match(/\b(ELPT|ELHPT|EXLPT|EH|MH|XL|XXL|Command Thrust|CT|EFI|PROXS|ProXS|Pro XS|L)\b/gi);
      if (codeMatches) {
        codes.push(...codeMatches.map(c => c.toUpperCase().replace(/PRO\s*XS/i, 'PROXS')));
      }

      return { normalized, hp, codes };
    }

    function calculateMatchScore(xmlData: any, dbData: any): number {
      let score = 0;
      
      // HP match is most important (50 points)
      if (xmlData.hp && dbData.hp && xmlData.hp === dbData.hp) {
        score += 50;
      } else if (xmlData.hp && dbData.hp && Math.abs(xmlData.hp - dbData.hp) <= 5) {
        score += 25; // Close HP match
      }

      // Code matching (30 points total)
      const commonCodes = xmlData.codes.filter((code: string) => 
        dbData.codes.some((dbCode: string) => dbCode.includes(code) || code.includes(dbCode))
      );
      score += commonCodes.length * 10;

      // Text similarity (20 points)
      const xmlWords = xmlData.normalized.toLowerCase().split(/\s+/);
      const dbWords = dbData.normalized.toLowerCase().split(/\s+/);
      const commonWords = xmlWords.filter((word: string) => 
        dbWords.some((dbWord: string) => dbWord.includes(word) || word.includes(dbWord))
      );
      score += Math.min(commonWords.length * 3, 20);

      return score;
    }
    
    for (const mercuryMotor of mercuryMotors) {
      const extractedData = mercuryMotor.extractedData;
      const xmlData = normalizeTitle(extractedData.title);
      console.log(`[MATCH] Processing XML: "${extractedData.title}" (HP: ${xmlData.hp}, Codes: [${xmlData.codes.join(',')}])`);
      
      let bestMatch = null;
      let bestScore = 0;
      let bestReason = '';
      
      for (const dbMotor of dbMotors) {
        const dbData = normalizeTitle(dbMotor.model_display || '');
        const score = calculateMatchScore(xmlData, dbData);
        
        if (score > bestScore && score >= 40) { // Minimum score threshold
          bestScore = score;
          bestMatch = dbMotor;
          bestReason = `Score ${score}: HP=${xmlData.hp}→${dbData.hp}, Codes=[${xmlData.codes.join(',')}]→[${dbData.codes.join(',')}]`;
        }
      }
      
      if (bestMatch) {
        console.log(`[MATCH] Found match: ${bestReason}`);
        matches.push({
          xmlMotor: mercuryMotor,
          dbMotor: bestMatch,
          score: bestScore,
          reason: bestReason
        });
      } else {
        console.log(`[MATCH] No match for: "${extractedData.title}"`);
      }
    }
    
    console.log(`[STOCK-SYNC] Found ${matches.length} matches`);
    
    // Step 5: Prepare stock updates using extracted data
    const stockUpdates = [];
    const matchedDbMotorIds = new Set();
    
    for (const match of matches) {
      const extractedData = match.xmlMotor.extractedData;
      const stockQuantity = parseInt(cleanText(extractedData.quantity || '1')) || 1;
      const stockNumber = cleanText(extractedData.stockNumber || '');
      const price = parseFloat(cleanText(extractedData.price || '0').replace(/[,$]/g, '')) || 0;
      
      stockUpdates.push({
        id: match.dbMotor.id,
        in_stock: true,
        stock_quantity: stockQuantity,
        stock_number: stockNumber,
        availability: 'In Stock',
        last_stock_check: new Date().toISOString(),
        ...(price > 0 && { dealer_price_live: price }), // Update price if available
        match_info: {
          xml_title: extractedData.title,
          match_reason: match.reason,
          match_score: match.score
        }
      });
      
      matchedDbMotorIds.add(match.dbMotor.id);
    }
    
    // Step 6: Mark unmatched motors as out of stock
    const unmatchedMotors = dbMotors.filter(motor => 
      !matchedDbMotorIds.has(motor.id) && motor.in_stock
    );
    
    for (const motor of unmatchedMotors) {
      stockUpdates.push({
        id: motor.id,
        in_stock: false,
        stock_quantity: 0,
        stock_number: null,
        availability: 'Brochure',
        last_stock_check: new Date().toISOString(),
        match_info: {
          xml_title: null,
          match_reason: 'No match found in XML inventory',
          match_score: 0
        }
      });
    }
    
    console.log(`[STOCK-SYNC] Prepared ${stockUpdates.length} stock updates`);
    
    // Step 7: Preview or Apply updates
    if (preview) {
      console.log('[STOCK-SYNC] Preview mode - no database changes made');
      return new Response(JSON.stringify({
        success: true,
        preview: true,
        xml_motors_found: mercuryMotors.length,
        db_motors_total: dbMotors.length,
        matches_found: matches.length,
        stock_updates: stockUpdates.map(update => ({
          motor_id: update.id,
          model_display: dbMotors.find(m => m.id === update.id)?.model_display,
          new_stock_status: update.in_stock,
          new_quantity: update.stock_quantity,
          match_reason: update.match_info.match_reason,
          match_score: update.match_info.match_score
        })),
        changes_summary: {
          newly_in_stock: stockUpdates.filter(u => u.in_stock && !dbMotors.find(m => m.id === u.id)?.in_stock).length,
          newly_out_of_stock: stockUpdates.filter(u => !u.in_stock && dbMotors.find(m => m.id === u.id)?.in_stock).length,
          still_in_stock: stockUpdates.filter(u => u.in_stock && dbMotors.find(m => m.id === u.id)?.in_stock).length
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Step 8: Apply updates to database
    let updatedCount = 0;
    for (const update of stockUpdates) {
      const { match_info, ...updateData } = update;
      
      const { error: updateError } = await supabase
        .from('motor_models')
        .update(updateData)
        .eq('id', update.id);
      
      if (updateError) {
        console.error(`[STOCK-SYNC] Update failed for motor ${update.id}:`, updateError);
      } else {
        updatedCount++;
      }
    }
    
    console.log(`[STOCK-SYNC] Successfully updated ${updatedCount} motors`);
    
    // Step 9: Log sync activity
    const { error: logError } = await supabase
      .from('sync_logs')
      .insert({
        sync_type: 'stock_only',
        status: 'completed',
        motors_processed: stockUpdates.length,
        motors_in_stock: stockUpdates.filter(u => u.in_stock).length,
        details: {
          xml_motors_found: mercuryMotors.length,
          matches_found: matches.length,
          updated_count: updatedCount,
          match_quality: {
            excellent: matches.filter(m => m.score >= 0.9).length,
            good: matches.filter(m => m.score >= 0.7 && m.score < 0.9).length,
            fair: matches.filter(m => m.score >= 0.6 && m.score < 0.7).length
          }
        },
        completed_at: new Date().toISOString()
      });
    
    if (logError) {
      console.error('[STOCK-SYNC] Logging failed:', logError);
    }
    
    return new Response(JSON.stringify({
      success: true,
      preview: false,
      xml_motors_found: mercuryMotors.length,
      db_motors_total: dbMotors.length,
      matches_found: matches.length,
      updates_applied: updatedCount,
      changes_summary: {
        newly_in_stock: stockUpdates.filter(u => u.in_stock && !dbMotors.find(m => m.id === u.id)?.in_stock).length,
        newly_out_of_stock: stockUpdates.filter(u => !u.in_stock && dbMotors.find(m => m.id === u.id)?.in_stock).length,
        still_in_stock: stockUpdates.filter(u => u.in_stock && dbMotors.find(m => m.id === u.id)?.in_stock).length
      },
      message: `Stock sync completed. Updated ${updatedCount} motor records.`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('[STOCK-SYNC] Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      details: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});