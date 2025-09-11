import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Motor description parsing helper - improved for database motor names
function parseMotorDescription(description: string) {
  // Remove year prefix, symbols and extra text
  let cleaned = description.replace(/^202[4-6]\s+/g, '').replace(/[†‡⚠️®]/g, '').trim();
  
  // Extract horsepower - more flexible patterns for database format
  let horsepower = null;
  const hpPatterns = [
    /(\d+(?:\.\d+)?)\s*HP/i, // "9.9HP", "175HP" format (most common in DB)
    /(\d+(?:\.\d+)?)(?:MH|MLH|EH|ELH|E|M|EPT|EHPT|ELPT|RC|L|XL|XXL)/i, // Model codes
    /^(\d+(?:\.\d+)?)/  // Just the number at start
  ];
  
  for (const pattern of hpPatterns) {
    const match = cleaned.match(pattern);
    if (match) {
      horsepower = parseFloat(match[1]);
      break;
    }
  }
  
  // Determine motor type - improved for database naming
  let motorType = 'Unknown';
  const lowerCleaned = cleaned.toLowerCase();
  
  if (lowerCleaned.includes('verado')) {
    motorType = 'Verado';
  } else if (lowerCleaned.includes('pro xs') || lowerCleaned.includes('pro-xs')) {
    motorType = 'Pro XS';
  } else if (lowerCleaned.includes('seapro') || lowerCleaned.includes('sea pro')) {
    motorType = 'SeaPro';
  } else if (lowerCleaned.includes('fourstroke') || lowerCleaned.includes('4-stroke')) {
    motorType = 'FourStroke';
  } else if (lowerCleaned.includes('efi')) {
    motorType = 'EFI';
  }
  
  // Extract special configurations
  const hasCommandThrust = lowerCleaned.includes('command thrust');
  const hasJet = lowerCleaned.includes('jet');
  const hasEFI = lowerCleaned.includes('efi');
  const hasProKicker = lowerCleaned.includes('prokicker');
  
  return {
    horsepower,
    motorType,
    hasCommandThrust,
    hasJet,
    hasEFI,
    hasProKicker,
    original: description,
    cleaned
  };
}

// Enhanced smart matching with base model stripping and feature markup
function calculateEnhancedMatch(dbMotor: any, priceEntry: any): { score: number; basePrice: number; finalPrice: number; markup: number } {
  const dbParsed = parseMotorDescription(dbMotor.model);
  const priceParsed = parseMotorDescription(priceEntry.description);
  
  let score = 0;
  let markup = 1.0; // Start with no markup
  
  // Strip configuration codes to find base motor match
  const stripConfigCodes = (model: string) => {
    return model
      .replace(/\b(EH|ELH|EL|MH|MLH|EPT|ELPT|EHPT|EXL|XXL|XL|RC|L)\b/gi, '')
      .replace(/\b(Command Thrust|Jet|EFI|ProKicker)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  };
  
  const dbStripped = stripConfigCodes(dbMotor.model);
  const priceStripped = stripConfigCodes(priceEntry.description);
  
  // Horsepower match (most critical - 70 points possible)
  if (dbParsed.horsepower && priceParsed.horsepower) {
    const hpDiff = Math.abs(dbParsed.horsepower - priceParsed.horsepower);
    if (hpDiff < 0.1) {
      score += 70; // Perfect HP match
    } else if (hpDiff <= 0.5) {
      score += 60; // Very close
    } else if (hpDiff <= 1) {
      score += 45; // Close enough
    } else if (hpDiff <= 2) {
      score += 25; // Somewhat close
    }
  }
  
  // Motor type match with base model stripping (25 points possible)
  if (dbParsed.motorType !== 'Unknown' && priceParsed.motorType !== 'Unknown') {
    if (dbParsed.motorType === priceParsed.motorType) {
      score += 25;
    } else {
      const dbType = dbParsed.motorType.toLowerCase();
      const priceType = priceParsed.motorType.toLowerCase();
      
      if ((dbType === 'fourstroke' && priceType === 'efi') || 
          (dbType === 'efi' && priceType === 'fourstroke')) {
        score += 20;
      } else if (dbType.includes(priceType) || priceType.includes(dbType)) {
        score += 15;
      }
    }
  }
  
  // Check for base model similarity after stripping (15 points possible)
  const similarityScore = calculateStringSimilarity(dbStripped.toLowerCase(), priceStripped.toLowerCase());
  score += Math.floor(similarityScore * 15);
  
  // Calculate markup for special features
  if (dbParsed.hasCommandThrust && !priceParsed.hasCommandThrust) {
    markup *= 1.15; // 15% markup for Command Thrust
    score += 3; // Bonus for feature detection
  }
  
  if (dbParsed.hasJet && !priceParsed.hasJet) {
    markup *= 1.12; // 12% markup for Jet
    score += 3;
  }
  
  if (dbParsed.hasEFI && !priceParsed.hasEFI) {
    markup *= 1.08; // 8% markup for EFI upgrade
    score += 2;
  }
  
  if (dbParsed.hasProKicker && !priceParsed.hasProKicker) {
    markup *= 1.10; // 10% markup for ProKicker
    score += 2;
  }
  
  // Shaft configuration detection and markup
  const dbModel = dbMotor.model.toLowerCase();
  const priceDesc = priceEntry.description.toLowerCase();
  
  const longShaftCodes = ['elh', 'mlh', 'elpt', 'exl', 'xxl', 'xl'];
  const extraLongCodes = ['exl', 'xxl'];
  
  let hasLongShaft = false;
  let hasExtraLong = false;
  
  for (const code of longShaftCodes) {
    if (dbModel.includes(code) && !priceDesc.includes(code)) {
      hasLongShaft = true;
      if (extraLongCodes.includes(code)) {
        hasExtraLong = true;
      }
      break;
    }
  }
  
  if (hasExtraLong) {
    markup *= 1.06; // 6% for extra long shaft
    score += 3;
  } else if (hasLongShaft) {
    markup *= 1.03; // 3% for long shaft
    score += 2;
  }
  
  const basePrice = priceEntry.price;
  const finalPrice = Math.round(basePrice * markup / 25) * 25; // Round to nearest $25
  
  return { score, basePrice, finalPrice, markup };
}

// String similarity helper for base model matching
function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting motor price scraping...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch current motors with missing prices
    const { data: motors, error: motorsError } = await supabase
      .from('motor_models')
      .select('*')
      .or('base_price.is.null,base_price.eq.0');

    if (motorsError) {
      throw new Error(`Failed to fetch motors: ${motorsError.message}`);
    }

    console.log(`Found ${motors?.length || 0} motors with missing prices`);

    // Scrape the pricelist
    const pricelistResponse = await fetch('https://www.harrisboatworks.ca/mercurypricelist');
    if (!pricelistResponse.ok) {
      throw new Error(`Failed to fetch pricelist: ${pricelistResponse.status}`);
    }

    const pricelistHtml = await pricelistResponse.text();
    
    // Parse prices from markdown table format
    const priceEntries: any[] = [];
    
    // Split into lines and find table rows (markdown format)
    const lines = pricelistHtml.split('\n');
    let inTable = false;
    
    for (const line of lines) {
      // Skip table headers and separators
      if (line.includes('| Model #') || line.includes('| --- |')) {
        inTable = true;
        continue;
      }
      
      // Parse actual table rows with price data
      if (inTable && line.includes('|') && line.includes('$')) {
        const parts = line.split('|').map(part => part.trim());
        if (parts.length >= 4) {
          const modelCode = parts[1];
          const description = parts[2];
          const priceStr = parts[3].replace('$', '').replace(/,/g, '');
          const price = parseFloat(priceStr);
          
          if (price > 0 && modelCode && description) {
            const parsed = parseMotorDescription(description);
            priceEntries.push({
              modelCode,
              description: description.trim(),
              price,
              ...parsed
            });
          }
        }
      }
      
      // Stop parsing if we hit a new section
      if (line.trim() === '' && inTable) {
        break;
      }
    }

    console.log(`Parsed ${priceEntries.length} price entries from pricelist`);

    // Enhanced matching with base model stripping and feature markups
    const updates: any[] = [];
    
    for (const motor of motors || []) {
      let bestMatch = null;
      let bestScore = 0;
      let bestPricing = null;
      
      for (const priceEntry of priceEntries) {
        const matchResult = calculateEnhancedMatch(motor, priceEntry);
        
        if (matchResult.score > bestScore && matchResult.score >= 25) { // Lower threshold for enhanced matching
          bestScore = matchResult.score;
          bestMatch = priceEntry;
          bestPricing = matchResult;
        }
      }
      
      if (bestMatch && bestPricing) {
        updates.push({
          motor_id: motor.id,
          motor_model: motor.model,
          motor_hp: motor.horsepower,
          matched_description: bestMatch.description,
          matched_code: bestMatch.modelCode,
          base_price: bestPricing.basePrice,
          new_price: bestPricing.finalPrice,
          markup_applied: bestPricing.markup,
          match_score: bestScore
        });
        
        const markupText = bestPricing.markup > 1.0 ? ` (${Math.round((bestPricing.markup - 1) * 100)}% markup)` : '';
        console.log(`Enhanced match: ${motor.model} ${motor.horsepower}HP -> ${bestMatch.description} $${bestPricing.basePrice} -> $${bestPricing.finalPrice}${markupText} [Score: ${bestScore}]`);
      } else {
        console.log(`No enhanced match found for ${motor.model} (${motor.horsepower}HP, ${motor.motor_type})`);
      }
    }

    // Update motor prices in database
    let successCount = 0;
    const errors: string[] = [];
    const unmatchedMotors: any[] = [];

    // Track unmatched motors for fallback pricing
    const matchedMotorIds = new Set(updates.map(u => u.motor_id));
    for (const motor of motors || []) {
      if (!matchedMotorIds.has(motor.id)) {
        unmatchedMotors.push(motor);
      }
    }

    // Enhanced fallback pricing with special feature detection
    const fallbackUpdates: any[] = [];
    for (const motor of unmatchedMotors) {
      let estimatedPrice = null;
      
      if (motor.horsepower) {
        const hp = motor.horsepower;
        const type = motor.motor_type?.toLowerCase() || '';
        const model = motor.model?.toLowerCase() || '';
        
        // Parse special features for markup
        const parsed = parseMotorDescription(motor.model);
        let markup = 1.0;
        
        if (parsed.hasCommandThrust) markup *= 1.15;
        if (parsed.hasJet) markup *= 1.12;
        if (parsed.hasEFI) markup *= 1.08;
        if (parsed.hasProKicker) markup *= 1.10;
        
        // Check for shaft configurations
        if (model.includes('elh') || model.includes('mlh') || model.includes('xl')) {
          markup *= 1.04;
        }
        
        // Enhanced base pricing with better motor type detection
        if (type.includes('verado') || model.includes('verado')) {
          estimatedPrice = (hp * 185 + 5500) * markup;
        } else if (type.includes('pro xs') || model.includes('pro xs') || model.includes('proxs')) {
          estimatedPrice = (hp * 155 + 3200) * markup;
        } else if (type.includes('seapro') || model.includes('seapro')) {
          estimatedPrice = (hp * 140 + 2800) * markup;
        } else if (type.includes('fourstroke') || model.includes('fourstroke') || type.includes('efi') || model.includes('efi')) {
          estimatedPrice = (hp * 125 + 2200) * markup;
        } else {
          // Generic fallback with conservative pricing
          estimatedPrice = (hp * 110 + 1800) * markup;
        }
        
        // Round to nearest $25 for realistic pricing
        estimatedPrice = Math.round(estimatedPrice / 25) * 25;
        
        // Reasonable price bounds
        if (estimatedPrice >= 1000 && estimatedPrice <= 55000) {
          fallbackUpdates.push({
            motor_id: motor.id,
            motor_model: motor.model,
            estimated_price: estimatedPrice,
            markup_applied: markup,
            is_estimate: true
          });
          
          const markupText = markup > 1.0 ? ` (${Math.round((markup - 1) * 100)}% markup)` : '';
          console.log(`Enhanced fallback: ${motor.model} -> $${estimatedPrice}${markupText} (${hp}HP ${type})`);
        }
      }
    }

    console.log(`Applying ${updates.length} exact matches and ${fallbackUpdates.length} fallback estimates`);

    // Update enhanced matches
    for (const update of updates) {
      const { error } = await supabase
        .from('motor_models')
        .update({ 
          base_price: update.new_price,
          updated_at: new Date().toISOString()
        })
        .eq('id', update.motor_id);

      if (error) {
        errors.push(`Failed to update ${update.motor_model}: ${error.message}`);
        console.error(`Update error:`, error);
      } else {
        successCount++;
      }
    }

    // Apply enhanced fallback estimates (enabled by default now)
    const url = new URL(req.url);
    const skipFallbacks = url.searchParams.get('skip_fallbacks') === 'true';
    
    let fallbackSuccessCount = 0;
    if (!skipFallbacks) { // Apply fallbacks by default
      console.log('Applying enhanced fallback pricing...');
      for (const fallback of fallbackUpdates) {
        const { error } = await supabase
          .from('motor_models')
          .update({ 
            base_price: fallback.estimated_price,
            updated_at: new Date().toISOString()
          })
          .eq('id', fallback.motor_id);

        if (error) {
          errors.push(`Failed to update fallback ${fallback.motor_model}: ${error.message}`);
        } else {
          fallbackSuccessCount++;
        }
      }
    } else {
      console.log('Fallback pricing skipped per request');
    }

    const result = {
      success: true,
      motorsScanned: motors?.length || 0,
      priceEntriesFound: priceEntries.length,
      enhancedMatches: updates.length,
      enhancedFallbacks: fallbackUpdates.length,
      enhancedMatchesApplied: successCount,
      enhancedFallbacksApplied: fallbackSuccessCount,
      totalMotorsNowPriced: successCount + fallbackSuccessCount,
      stillUnpriced: (motors?.length || 0) - successCount - fallbackSuccessCount,
      errors: errors.length > 0 ? errors : undefined,
      fallbacksEnabledByDefault: !skipFallbacks,
      timestamp: new Date().toISOString()
    };

    console.log('Price scraping completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in scrape-motor-prices:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});