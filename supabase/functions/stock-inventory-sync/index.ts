import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { XMLParser } from "https://esm.sh/fast-xml-parser@4"

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

// Extract HP from motor title
function extractHP(title: string): number | null {
  const hpMatch = title.match(/(\d+(?:\.\d+)?)\s*hp/i);
  return hpMatch ? Number(hpMatch[1]) : null;
}

// Extract motor family
function extractFamily(title: string): string {
  if (/four\s*stroke|fourstroke/i.test(title)) return 'FourStroke';
  if (/pro\s*xs|proxs/i.test(title)) return 'ProXS';
  if (/sea\s*pro|seapro/i.test(title)) return 'SeaPro';
  if (/verado/i.test(title)) return 'Verado';
  if (/racing/i.test(title)) return 'Racing';
  return 'FourStroke'; // Default
}

// Extract rigging codes
function extractRiggingCodes(title: string): string[] {
  const codes: string[] = [];
  const upperTitle = title.toUpperCase();
  
  // Multi-character codes first
  if (upperTitle.includes('ELHPT')) codes.push('ELHPT');
  else if (upperTitle.includes('ELPT')) codes.push('ELPT');
  else if (upperTitle.includes('EXLPT')) codes.push('EXLPT');
  else if (upperTitle.includes('ELH')) codes.push('ELH');
  else if (upperTitle.includes('MLH')) codes.push('MLH');
  else if (upperTitle.includes('EH')) codes.push('EH');
  else if (upperTitle.includes('MH')) codes.push('MH');
  
  // Single character codes
  if (!codes.length) {
    if (upperTitle.includes('XL')) codes.push('XL');
    else if (upperTitle.includes('L')) codes.push('L');
    else if (upperTitle.includes('S')) codes.push('S');
  }
  
  return codes;
}

// Calculate text similarity (simple Levenshtein-based)
function calculateSimilarity(text1: string, text2: string): number {
  const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, '');
  const s1 = normalize(text1);
  const s2 = normalize(text2);
  
  if (s1 === s2) return 1.0;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Match XML motor to database motor
function findBestMatch(xmlMotor: any, dbMotors: any[]): { motor: any; score: number; reason: string } | null {
  let bestMatch = null;
  let bestScore = 0;
  let bestReason = '';
  
  const xmlTitle = cleanText(xmlMotor.title || '');
  const xmlHP = extractHP(xmlTitle);
  const xmlFamily = extractFamily(xmlTitle);
  const xmlRigging = extractRiggingCodes(xmlTitle);
  
  console.log(`[MATCH] XML Motor: "${xmlTitle}" (${xmlHP}HP, ${xmlFamily}, [${xmlRigging.join(',')}])`);
  
  for (const dbMotor of dbMotors) {
    const dbDisplay = cleanText(dbMotor.model_display || '');
    const dbHP = dbMotor.horsepower;
    const dbFamily = dbMotor.family || 'FourStroke';
    
    let score = 0;
    let reason = '';
    
    // Exact model_display match (highest score)
    const textSimilarity = calculateSimilarity(xmlTitle, dbDisplay);
    if (textSimilarity > 0.9) {
      score = 1.0;
      reason = `Exact match: "${xmlTitle}" → "${dbDisplay}"`;
    }
    // HP + Family + Rigging match
    else if (xmlHP === dbHP && xmlFamily === dbFamily) {
      score = 0.8;
      reason = `HP+Family match: ${xmlHP}HP ${xmlFamily}`;
      
      // Bonus for rigging code overlap
      const dbRigging = extractRiggingCodes(dbDisplay);
      const rigOverlap = xmlRigging.filter(code => dbRigging.includes(code)).length;
      if (rigOverlap > 0) {
        score += 0.15;
        reason += ` + rigging (${rigOverlap} codes)`;
      }
    }
    // HP + Family match only
    else if (xmlHP === dbHP && xmlFamily === dbFamily) {
      score = 0.6;
      reason = `HP+Family only: ${xmlHP}HP ${xmlFamily}`;
    }
    // Text similarity fallback
    else if (textSimilarity > 0.7) {
      score = textSimilarity * 0.5;
      reason = `Text similarity: ${Math.round(textSimilarity * 100)}%`;
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = dbMotor;
      bestReason = reason;
    }
  }
  
  // Only return matches with reasonable confidence
  if (bestScore >= 0.6) {
    console.log(`[MATCH] Best: ${bestReason} (score: ${bestScore.toFixed(2)})`);
    return { motor: bestMatch, score: bestScore, reason: bestReason };
  }
  
  console.log(`[MATCH] No good match found (best score: ${bestScore.toFixed(2)})`);
  return null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    console.log('[STOCK-SYNC] Starting stock inventory sync...');
    
    const supabase = await getServiceClient();
    const body = await req.json().catch(() => ({}));
    const { preview = false } = body;
    
    // Step 1: Fetch XML inventory
    console.log('[STOCK-SYNC] Fetching XML inventory...');
    const xmlUrl = 'https://www.harrisboatworks.ca/unitinventory_univ.xml';
    const xmlResponse = await fetch(xmlUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Stock-Sync/1.0)' }
    });
    
    if (!xmlResponse.ok) {
      throw new Error(`XML fetch failed: ${xmlResponse.status} ${xmlResponse.statusText}`);
    }
    
    const xmlText = await xmlResponse.text();
    const parser = new XMLParser();
    const xmlData = parser.parse(xmlText);
    
    // Extract units from XML
    const units = xmlData?.inventory?.unit || [];
    const unitArray = Array.isArray(units) ? units : [units];
    
    console.log(`[STOCK-SYNC] Found ${unitArray.length} total units in XML`);
    
    // Step 2: Filter to Mercury outboards only
    const mercuryMotors = unitArray.filter(unit => {
      const title = cleanText(unit.Title || unit.title || '');
      const category = cleanText(unit.Category || unit.category || '');
      const condition = cleanText(unit.Condition || unit.condition || '');
      
      // Must be Mercury brand
      if (!/mercury/i.test(title)) return false;
      
      // Must be new condition
      if (!/new/i.test(condition)) return false;
      
      // Must be outboard motor (exclude boats, trailers, parts)
      if (!/outboard|motor|engine/i.test(category) && !/outboard|motor|engine/i.test(title)) {
        return false;
      }
      
      // Exclude obvious non-motors
      if (/(boat|trailer|pwc|jet\s*ski|parts|accessory|prop)/i.test(title)) {
        return false;
      }
      
      return true;
    });
    
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
    
    // Step 4: Match XML motors to database motors
    const matches: Array<{
      xmlMotor: any;
      dbMotor: any;
      score: number;
      reason: string;
    }> = [];
    
    for (const xmlMotor of mercuryMotors) {
      const match = findBestMatch(xmlMotor, dbMotors);
      if (match) {
        matches.push({
          xmlMotor,
          dbMotor: match.motor,
          score: match.score,
          reason: match.reason
        });
      }
    }
    
    console.log(`[STOCK-SYNC] Found ${matches.length} matches`);
    
    // Step 5: Prepare stock updates
    const stockUpdates = [];
    const matchedDbMotorIds = new Set();
    
    for (const match of matches) {
      const stockQuantity = parseInt(cleanText(match.xmlMotor.Quantity || '1')) || 1;
      const stockNumber = cleanText(match.xmlMotor.StockNumber || match.xmlMotor.VIN || '');
      
      stockUpdates.push({
        id: match.dbMotor.id,
        in_stock: true,
        stock_quantity: stockQuantity,
        stock_number: stockNumber,
        availability: 'In Stock',
        last_stock_check: new Date().toISOString(),
        match_info: {
          xml_title: match.xmlMotor.title,
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