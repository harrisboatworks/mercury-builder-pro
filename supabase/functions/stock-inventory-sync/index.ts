import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.1'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Mercury model number mapping data (from actual database)
const MERCURY_MODEL_MAPPINGS = [
  // 8HP Motors
  { modelNumber: "1A08301LK", description: "8EH FourStroke", hp: 8, family: "FourStroke" },
  { modelNumber: "1A08311LK", description: "8ELH FourStroke", hp: 8, family: "FourStroke" },
  { modelNumber: "1A08201LK", description: "8MH FourStroke", hp: 8, family: "FourStroke" },
  { modelNumber: "1A08211LK", description: "8MLH FourStroke", hp: 8, family: "FourStroke" },
  
  // 9.9HP Motors
  { modelNumber: "1A10351LK", description: "9.9 ELH FourStroke", hp: 9.9, family: "FourStroke" },
  { modelNumber: "1A10451LK", description: "9.9 ELHPT FourStroke", hp: 9.9, family: "FourStroke" },
  { modelNumber: "1A10452LK", description: "9.9 ELPT FourStroke", hp: 9.9, family: "FourStroke" },
  { modelNumber: "1A10462LK", description: "9.9 EXLPT FourStroke", hp: 9.9, family: "FourStroke" },
  { modelNumber: "1A10251LK", description: "9.9 MLH FourStroke", hp: 9.9, family: "FourStroke" },
  { modelNumber: "1A10261LK", description: "9.9 MXLH FourStroke", hp: 9.9, family: "FourStroke" },
  { modelNumber: "1A10301LK", description: "9.9EH FourStroke", hp: 9.9, family: "FourStroke" },
  { modelNumber: "1A10312LK", description: "9.9EL FourStroke", hp: 9.9, family: "FourStroke" },
  { modelNumber: "1A10311LK", description: "9.9ELH FourStroke", hp: 9.9, family: "FourStroke" },
  { modelNumber: "1A10402LK", description: "9.9EPT FourStroke", hp: 9.9, family: "FourStroke" },
  { modelNumber: "1A10361LK", description: "9.9EXLH FourStroke", hp: 9.9, family: "FourStroke" },
  { modelNumber: "1A10461LK", description: "9.9EXLHPT FourStroke", hp: 9.9, family: "FourStroke" },
  { modelNumber: "1A10201LK", description: "9.9MH FourStroke", hp: 9.9, family: "FourStroke" },
  { modelNumber: "1A10211LK", description: "9.9MLH FourStroke", hp: 9.9, family: "FourStroke" },
  { modelNumber: "1A10204LV", description: "9.9MRC FourStroke", hp: 9.9, family: "FourStroke" },
  
  // 15HP Motors
  { modelNumber: "1A15301LK", description: "15 EH FourStroke", hp: 15, family: "FourStroke" },
  { modelNumber: "1A15311LK", description: "15 ELH FourStroke", hp: 15, family: "FourStroke" },
  { modelNumber: "1A15451BK", description: "15 ELHPT FourStroke", hp: 15, family: "FourStroke" },
  { modelNumber: "1A15412LK", description: "15 ELPT FourStroke", hp: 15, family: "FourStroke" },
  { modelNumber: "1A15462BK", description: "15 EXLPT FourStroke", hp: 15, family: "FourStroke" },
  { modelNumber: "1A15201LK", description: "15 MH FourStroke", hp: 15, family: "FourStroke" },
  { modelNumber: "1A15211LK", description: "15 MLH FourStroke", hp: 15, family: "FourStroke" },
  
  // 20HP Motors  
  { modelNumber: "1A20301LK", description: "20 EH FourStroke", hp: 20, family: "FourStroke" },
  { modelNumber: "1A20311LK", description: "20 ELH FourStroke", hp: 20, family: "FourStroke" },
  { modelNumber: "1A20411LK", description: "20 ELHPT FourStroke", hp: 20, family: "FourStroke" },
  { modelNumber: "1A20201LK", description: "20 MH FourStroke", hp: 20, family: "FourStroke" },
  { modelNumber: "1A20211LK", description: "20 MLH FourStroke", hp: 20, family: "FourStroke" },
  
  // 25HP Motors
  { modelNumber: "1A25301BK", description: "25 EH FourStroke", hp: 25, family: "FourStroke" },
  { modelNumber: "1A25311BK", description: "25 ELH FourStroke", hp: 25, family: "FourStroke" },
  { modelNumber: "1A25411BK", description: "25 ELHPT FourStroke", hp: 25, family: "FourStroke" },
  { modelNumber: "1A25413BK", description: "25 ELPT FourStroke", hp: 25, family: "FourStroke" },
  { modelNumber: "1A25462BK", description: "25 EXLPT FourStroke", hp: 25, family: "FourStroke" },
  { modelNumber: "1A25203BK", description: "25 MH FourStroke", hp: 25, family: "FourStroke" },
  { modelNumber: "1A25213BK", description: "25 MLH FourStroke", hp: 25, family: "FourStroke" },
  
  // 30HP Motors
  { modelNumber: "1A30411BK", description: "30 ELHPT FourStroke", hp: 30, family: "FourStroke" },
  { modelNumber: "1A30413BK", description: "30 ELPT FourStroke", hp: 30, family: "FourStroke" },
  { modelNumber: "1A30403BK", description: "30EPT FourStroke", hp: 30, family: "FourStroke" },
];

// Build lookup maps for efficient matching
const descriptionToModelMap = new Map<string, string>();
const modelToDescriptionMap = new Map<string, string>();

MERCURY_MODEL_MAPPINGS.forEach(mapping => {
  descriptionToModelMap.set(mapping.description, mapping.modelNumber);
  modelToDescriptionMap.set(mapping.modelNumber, mapping.description);
  
  // Add common variations
  const normalized = mapping.description.replace(/\s+/g, ' ').trim();
  const withoutSpaces = mapping.description.replace(/\s+/g, '');
  const withHP = mapping.description.replace(/(\d+(?:\.\d+)?)/, '$1HP');
  
  descriptionToModelMap.set(normalized, mapping.modelNumber);
  descriptionToModelMap.set(withoutSpaces, mapping.modelNumber);
  descriptionToModelMap.set(withHP, mapping.modelNumber);
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StockUpdate {
  motor_id: string;
  model_display: string;
  new_stock_status: boolean;
  new_quantity: number;
  new_stock_number: string | null;
  new_dealer_price: number | null;
  new_availability: string;
  match_score: number;
  match_reason: string;
}

interface PreviewData {
  summary: {
    motors_processed: number;
    model_number_matched: number;
    auto_matched: number;
    queued_for_review: number;
    rejected: number;
    newly_in_stock: number;
    newly_out_of_stock: number;
    total_changes: number;
  };
  stock_updates: StockUpdate[];
  changes_summary: {
    newly_in_stock: number;
    newly_out_of_stock: number;
    still_in_stock: number;
    total_changes: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { preview = false } = await req.json();
    
    console.log('[STOCK-SYNC] Starting hybrid XML + HTML stock inventory sync... (v2025-09-21-FIXED)');
    
    const isPreview = preview === true;
    if (isPreview) {
      console.log('[STOCK-SYNC] Running in PREVIEW mode - no database changes will be made');
    }

    // Step 1: Fetch XML inventory from Harris
    console.log('[STOCK-SYNC] Fetching XML inventory from Harris...');
    
    const xmlResponse = await fetch('https://www.harrisboatworks.ca/xml/inventory.xml', {
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Stock-Sync/1.0)' }
    });

    if (!xmlResponse.ok) {
      throw new Error(`XML fetch failed: ${xmlResponse.status}`);
    }

    const xmlText = await xmlResponse.text();
    console.log(`[STOCK-SYNC] Fetched XML feed (${xmlText.length} chars)`);

    // Parse XML for Mercury motors
    console.log('[STOCK-SYNC] Parsing XML for Mercury motors...');
    
    const itemMatches = Array.from(xmlText.matchAll(/<item[^>]*>(.*?)<\/item>/gs));
    console.log(`[STOCK-SYNC] Found ${itemMatches.length} total items in XML`);

    const mercuryMotors = [];
    const processedCount = { total: 0, mercury: 0, new_condition: 0, valid: 0 };

    for (const match of itemMatches) {
      processedCount.total++;
      const itemXml = match[1];
      
      // Extract fields
      const make = (itemXml.match(/<make[^>]*>(.*?)<\/make>/s)?.[1] || '').trim();
      const condition = (itemXml.match(/<condition[^>]*>(.*?)<\/condition>/s)?.[1] || '').trim();
      const categoryName = (itemXml.match(/<category_name[^>]*>(.*?)<\/category_name>/s)?.[1] || '').trim();
      
      // Skip non-Mercury, non-new, non-outboard items
      if (make.toLowerCase() !== 'mercury') continue;
      processedCount.mercury++;
      
      if (condition.toLowerCase() !== 'new') continue;
      if (!categoryName.toLowerCase().includes('outboard')) continue;
      processedCount.new_condition++;
      
      const stockNumber = (itemXml.match(/<stock_number[^>]*>(.*?)<\/stock_number>/s)?.[1] || '').trim();
      const modelName = (itemXml.match(/<model[^>]*>(.*?)<\/model>/s)?.[1] || '').trim();
      const priceText = (itemXml.match(/<price[^>]*>(.*?)<\/price>/s)?.[1] || '0').trim();
      const price = parseFloat(priceText.replace(/[,$]/g, '')) || 0;
      
      if (!stockNumber || !modelName) continue;
      processedCount.valid++;
      
      mercuryMotors.push({
        stockNumber,
        modelName,
        price,
        source: 'xml'
      });
      
      console.log(`[STOCK-SYNC] Found Mercury motor: "${modelName}" (Stock: ${stockNumber})`);
    }
    
    console.log(`[STOCK-SYNC] Processed ${processedCount.total} items → ${processedCount.mercury} Mercury → ${processedCount.new_condition} New & Outboard → ${processedCount.valid} Valid`);
    console.log(`[STOCK-SYNC] Found ${mercuryMotors.length} Mercury motors in XML feed`);

    // Step 2: Scrape HTML page for additional motors (keep existing logic)
    console.log('[STOCK-SYNC] Scraping HTML page for in-stock motors...');
    const htmlMotors = []; // Simplified for now
    
    // Merge motor data
    function mergeMotorData(xmlMotors: any[], htmlMotors: any[]) {
      const motorMap = new Map();
      
      // Add XML motors first
      xmlMotors.forEach(motor => {
        const key = `${motor.modelName}-${motor.stockNumber}`;
        motorMap.set(key, motor);
      });
      
      // Add HTML motors, avoiding duplicates
      htmlMotors.forEach(motor => {
        const key = `${motor.modelName}-${motor.stockNumber || 'html'}`;
        if (!motorMap.has(key)) {
          motorMap.set(key, motor);
        }
      });
      
      return Array.from(motorMap.values());
    }

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
    
    // Step 4: ENHANCED MATCHING: Model Number First, then Fuzzy Fallback
    const matches = [];
    const stockUpdates = [];
    
    // 3-TIER MATCHING SYSTEM: Model Number → Historical → Fuzzy → Manual Review
    const pendingReviews = [];
    let modelNumberMatched = 0;
    let autoMatched = 0;
    let queuedForReview = 0;
    let rejected = 0;

    // Helper function to get Mercury model number from scraped motor name
    function getOfficialModelNumber(modelName: string): string | null {
      // Try direct mapping from display name to model number
      const normalizedName = modelName.trim().replace(/\s+/g, ' ');
      
      // First try exact match
      let exactMatch = descriptionToModelMap.get(normalizedName);
      if (exactMatch) return exactMatch;

      // Try normalized variations
      const variations = [
        normalizedName.toLowerCase(),
        normalizedName.replace(/\s+/g, ''),
        normalizedName.replace(/HP/gi, '').trim(),
        normalizedName.replace(/\s*HP\s*/gi, ' ').trim(),
      ];

      for (const variation of variations) {
        for (const [description, modelNumber] of descriptionToModelMap.entries()) {
          if (description.toLowerCase() === variation.toLowerCase() ||
              description.replace(/\s+/g, '').toLowerCase() === variation.replace(/\s+/g, '').toLowerCase()) {
            return modelNumber;
          }
        }
      }
      
      return null;
    }

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
    
    // Enhanced match scoring for fallback fuzzy matching
    function calculateMatchScore(xmlMotor: any, dbMotor: any): { score: number; isAutoMatch: boolean; details: any } {
      let score = 0;
      const details = { hp: false, family: false, rigging: false };
      let isAutoMatch = true;
      
      // HP matching (40% weight)
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
      
      // Model family matching (30% weight)
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
        if (xmlFamily && dbFamily) score += 15;
      }
      
      // Rigging code matching (30% weight)
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
      let matched = false;

      // TIER 1: Try official Mercury model number matching first
      const officialModelNumber = getOfficialModelNumber(motorData.name);
      if (officialModelNumber) {
        const exactMatch = dbMotors.find(m => m.model_number === officialModelNumber);
        if (exactMatch) {
          modelNumberMatched++;
          matched = true;
          
          const wasInStock = exactMatch.in_stock;
          const nowInStock = true;
          
          if (!wasInStock && nowInStock) {
            stockUpdates.push({
              motor_id: exactMatch.id,
              model_display: exactMatch.model_display,
              new_stock_status: nowInStock,
              new_quantity: 1,
              new_stock_number: motor.stockNumber,
              new_dealer_price: motor.price,
              new_availability: 'In Stock',
              match_score: 1.0,
              match_reason: `Official model number match: "${motorData.name}" → "${exactMatch.model_display}" (${officialModelNumber})`
            });
          }
          
          console.log(`[MODEL NUMBER MATCH] "${motorData.name}" → "${exactMatch.model_display}" (${officialModelNumber})`);
          continue;
        }
      }

      // TIER 2: Check historical mappings
      const historicalMatch = historicalMappings?.find(mapping => 
        mapping.scraped_pattern === motorData.name
      );
      
      if (historicalMatch && !matched) {
        const dbMotor = dbMotors.find(m => m.id === historicalMatch.motor_model_id);
        if (dbMotor) {
          autoMatched++;
          matched = true;
          
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

      // Skip fuzzy matching if we already found a match
      if (matched) continue;
      
      // TIER 3: Calculate match scores for all database motors (fuzzy fallback)
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
    
    console.log(`[STOCK-SYNC] Processing results: ${modelNumberMatched} model number matched, ${autoMatched} fuzzy auto-matched, ${queuedForReview} queued for review, ${rejected} rejected`);

    // Store pending reviews in database (if any and not preview mode)
    if (pendingReviews.length > 0 && !isPreview) {
      for (const review of pendingReviews) {
        await supabase
          .from('pending_motor_matches')
          .insert(review);
      }
      console.log(`[STOCK-SYNC] Stored ${pendingReviews.length} matches for manual review`);
    }
    
    console.log(`[STOCK-SYNC] Matched ${modelNumberMatched + autoMatched} of ${allMotors.length} total motors to database (${modelNumberMatched} model number, ${autoMatched} fuzzy auto, ${queuedForReview} review, ${rejected} rejected)`);
    
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
    
    // Enhanced summary for 3-tier system
    const summary = {
      motors_processed: allMotors.length,
      model_number_matched: modelNumberMatched,
      auto_matched: autoMatched,
      queued_for_review: queuedForReview,
      rejected: rejected,
      newly_in_stock: changesSummary.newly_in_stock,
      newly_out_of_stock: changesSummary.newly_out_of_stock,
      total_changes: changesSummary.total_changes
    };

    // If preview mode, return data without applying changes
    if (isPreview) {
      console.log('[STOCK-SYNC] Preview complete - returning data without applying changes');
      
      const previewData: PreviewData = {
        summary,
        stock_updates: allUpdates.slice(0, 50), // Limit for display
        changes_summary: changesSummary
      };
      
      return new Response(JSON.stringify(previewData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Step 6: Apply updates to database (non-preview mode)
    let updatesApplied = 0;
    
    console.log(`[STOCK-SYNC] Applying ${allUpdates.length} updates to database...`);
    
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
          console.error(`[STOCK-SYNC] Failed to update motor ${update.motor_id}:`, updateError);
        } else {
          updatesApplied++;
        }
      } catch (err) {
        console.error(`[STOCK-SYNC] Error updating motor ${update.motor_id}:`, err);
      }
    }
    
    console.log(`[STOCK-SYNC] Applied ${updatesApplied} of ${allUpdates.length} updates`);

    // Step 7: Log sync results
    const { error: logError } = await supabase
      .from('sync_logs')
      .insert({
        sync_type: 'inventory',
        status: 'completed',
        motors_processed: allMotors.length,
        motors_in_stock: stockUpdates.length,
        details: {
          summary,
          model_number_matched: modelNumberMatched,
          changes_applied: updatesApplied,
          pending_reviews: pendingReviews.length
        },
        completed_at: new Date().toISOString()
      });

    if (logError) {
      console.error('[STOCK-SYNC] Failed to log sync results:', logError);
    }

    return new Response(JSON.stringify({
      success: true,
      message: '3-tier stock sync completed successfully',
      summary,
      changes_applied: updatesApplied,
      pending_reviews: pendingReviews.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[STOCK-SYNC] Error:', error);
    
    // Log the error
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabase
        .from('sync_logs')
        .insert({
          sync_type: 'inventory',
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('[STOCK-SYNC] Failed to log error:', logError);
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
