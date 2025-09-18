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
    console.log('[STOCK-SYNC] Starting stock inventory sync v2.0...');
    
    const supabase = await getServiceClient();
    const body = await req.json().catch(() => ({}));
    const { preview = false } = body;
    
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
    
    // Step 2: Process and filter Mercury motors
    const mercuryMotors = [];
    
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
    
    for (const item of itemMatches) {
      // Extract basic fields
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

      // STRICT Mercury detection
      const titleLower = title.toLowerCase();
      const descLower = description.toLowerCase();
      const isMercury = manufacturer.includes('mercury') || 
                       (titleLower.includes('mercury') && !titleLower.includes('legend'));
      
      // STRICT condition filtering - exclude used/pre-owned
      const isNew = !condition.includes('used') && 
                   !condition.includes('pre-owned') && 
                   !condition.includes('preowned');
      
      // STRICT boat exclusion
      const boatExclusions = [
        'legend', 'uttern', 'pontoon', 'deck boat', 'fishing boat',
        'bass boat', 'jon boat', 'aluminum boat', 'fiberglass boat',
        'boat', 'vessel', 'watercraft', 'hull',
        'trailer', 'pwc', 'jet ski', 'atv', 'utv', 'snowmobile',
        'parts', 'accessories', 'propeller', 'prop', 'controls'
      ];
      
      const isBoatOrOther = boatExclusions.some(exclusion => 
        titleLower.includes(exclusion) || 
        descLower.includes(exclusion) || 
        category.includes(exclusion)
      );
      
      // STRICT motor detection - require Mercury outboard motor indicators
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
      
      const hasMotorIndicator = mercuryMotorRequired.some(indicator => 
        titleLower.includes(indicator) || descLower.includes(indicator)
      );
      
      const hasRiggingCode = mercuryRiggingCodes.some(code =>
        titleLower.includes(code) || descLower.includes(code)
      );
      
      // Motor must have HP OR motor indicator OR rigging code
      const isMotor = hasValidHP || hasMotorIndicator || hasRiggingCode;
      
      // Final filtering logic - all must be true
      const isValid = isMercury && isNew && !isBoatOrOther && isMotor;
      
      // Create motor object if valid
      if (isValid) {
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
    }
    
    console.log(`[STOCK-SYNC] Filtered to ${mercuryMotors.length} Mercury outboard motors`);
    
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