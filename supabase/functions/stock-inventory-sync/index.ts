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
    console.log('[STOCK-SYNC] Starting XML-based stock inventory sync...');
    
    const supabase = await getServiceClient();
    const body = await req.json().catch(() => ({}));
    const { preview = false } = body;
    
    // Create sync log entry
    const { data: syncLog, error: logError } = await supabase
      .from('sync_logs')
      .insert({ 
        sync_type: 'stock',
        status: 'running',
        details: { preview, method: 'xml_direct' }
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
    console.log(`[STOCK-SYNC] Found ${mercuryMotors.length} Mercury motors in stock`);
    
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
    
    // Helper function to calculate match score
    function calculateMatchScore(xmlMotor: any, dbMotor: any): number {
      let score = 0;
      
      // Extract HP from both
      const xmlHP = extractHP(xmlMotor.modelName);
      const dbHP = dbMotor.horsepower;
      
      // HP match is crucial (60 points)
      if (xmlHP && dbHP && xmlHP === dbHP) {
        score += 60;
      } else if (xmlHP && dbHP && Math.abs(xmlHP - dbHP) <= 0.1) {
        score += 50; // Very close HP match
      }
      
      // Rigging code matches (30 points)
      const xmlCodes = extractRiggingCodes(xmlMotor.modelName);
      const dbCodes = extractRiggingCodes(dbMotor.model_display || '');
      
      const commonCodes = xmlCodes.filter(code => 
        dbCodes.some(dbCode => dbCode === code)
      );
      
      if (commonCodes.length > 0) {
        score += 30 * (commonCodes.length / Math.max(xmlCodes.length, dbCodes.length));
      }
      
      // Family/series matches (10 points)
      const xmlFamily = xmlMotor.modelName.toLowerCase();
      const dbFamily = (dbMotor.model_display || '').toLowerCase();
      
      if (xmlFamily.includes('fourstroke') && dbFamily.includes('fourstroke')) score += 10;
      if (xmlFamily.includes('proxs') && dbFamily.includes('proxs')) score += 10;
      if (xmlFamily.includes('seapro') && dbFamily.includes('seapro')) score += 10;
      if (xmlFamily.includes('verado') && dbFamily.includes('verado')) score += 10;
      
      return Math.min(score, 100); // Cap at 100
    }
    
    // Match each XML motor to database motors
    for (const xmlMotor of mercuryMotors) {
      let bestMatch = null;
      let bestScore = 0;
      
      for (const dbMotor of dbMotors) {
        const score = calculateMatchScore(xmlMotor, dbMotor);
        if (score > bestScore && score >= 50) { // Minimum 50% match required
          bestScore = score;
          bestMatch = dbMotor;
        }
      }
      
      if (bestMatch) {
        matches.push({
          xmlMotor,
          dbMotor: bestMatch,
          score: bestScore,
          reason: `HP: ${extractHP(xmlMotor.modelName)} → ${bestMatch.horsepower}, Codes: ${extractRiggingCodes(xmlMotor.modelName).join(',')}`
        });
        
        // Prepare stock update
        stockUpdates.push({
          motor_id: bestMatch.id,
          model_display: bestMatch.model_display,
          new_stock_status: true,
          new_quantity: 1,
          new_stock_number: xmlMotor.stockNumber,
          new_dealer_price: xmlMotor.price,
          new_availability: 'In Stock',
          match_score: bestScore / 100,
          match_reason: `Matched XML "${xmlMotor.modelName}" to DB "${bestMatch.model_display}"`
        });
        
        console.log(`[MATCH] "${xmlMotor.modelName}" → "${bestMatch.model_display}" (${Math.round(bestScore)}%)`);
      } else {
        console.log(`[NO-MATCH] "${xmlMotor.modelName}" - no suitable database match found`);
      }
    }
    
    console.log(`[STOCK-SYNC] Matched ${matches.length} of ${mercuryMotors.length} XML motors to database`);
    
    // Step 5: Prepare out-of-stock updates (mark unmatched motors as out of stock)
    const matchedMotorIds = new Set(matches.map(m => m.dbMotor.id));
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
      still_in_stock: 0, // Could calculate this if needed
      total_changes: allUpdates.length
    };
    
    console.log(`[STOCK-SYNC] Changes: ${changesSummary.newly_in_stock} newly in stock, ${changesSummary.newly_out_of_stock} newly out of stock`);
    
    // Step 6: Apply updates or return preview
    if (preview) {
      // Return preview data
      const previewResult = {
        success: true,
        xml_motors_found: mercuryMotors.length,
        db_motors_total: dbMotors.length,
        matches_found: matches.length,
        stock_updates: allUpdates,
        changes_summary: changesSummary
      };
      
      // Update sync log
      if (syncLog?.id) {
        await supabase
          .from('sync_logs')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString(),
            motors_processed: mercuryMotors.length,
            motors_in_stock: stockUpdates.length,
            details: { 
              preview: true, 
              method: 'xml_direct',
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
    
    // Update sync log
    if (syncLog?.id) {
      await supabase
        .from('sync_logs')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          motors_processed: mercuryMotors.length,
          motors_in_stock: stockUpdates.length,
          details: { 
            preview: false,
            method: 'xml_direct',
            updates_applied: updatesApplied,
            ...changesSummary
          }
        })
        .eq('id', syncLog.id);
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Stock sync completed successfully',
      xml_motors_found: mercuryMotors.length,
      matches_found: matches.length,
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
