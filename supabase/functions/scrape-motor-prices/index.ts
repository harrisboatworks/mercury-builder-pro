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

// Improved matching score for database motors vs pricelist entries
function calculateMatchScore(dbMotor: any, priceEntry: any): number {
  // Parse both motor descriptions for comparison
  const dbParsed = parseMotorDescription(dbMotor.model);
  const priceParsed = parseMotorDescription(priceEntry.description);
  
  let score = 0;
  
  // Horsepower match (most critical - 60 points possible)
  if (dbParsed.horsepower && priceParsed.horsepower) {
    const hpDiff = Math.abs(dbParsed.horsepower - priceParsed.horsepower);
    if (hpDiff < 0.1) {
      score += 60; // Perfect HP match
    } else if (hpDiff <= 0.5) {
      score += 50; // Very close
    } else if (hpDiff <= 2) {
      score += 30; // Close enough
    } else if (hpDiff <= 5) {
      score += 15; // Somewhat close
    }
  }
  
  // Motor type match (30 points possible)
  if (dbParsed.motorType !== 'Unknown' && priceParsed.motorType !== 'Unknown') {
    if (dbParsed.motorType === priceParsed.motorType) {
      score += 30; // Perfect type match
    } else {
      // Check for compatible types
      const dbType = dbParsed.motorType.toLowerCase();
      const priceType = priceParsed.motorType.toLowerCase();
      
      // FourStroke and EFI are often compatible
      if ((dbType === 'fourstroke' && priceType === 'efi') || 
          (dbType === 'efi' && priceType === 'fourstroke')) {
        score += 20;
      }
      // Partial matches
      else if (dbType.includes(priceType) || priceType.includes(dbType)) {
        score += 15;
      }
    }
  }
  
  // Special feature matches (10 points possible)
  if (dbParsed.hasCommandThrust === priceParsed.hasCommandThrust) score += 3;
  if (dbParsed.hasJet === priceParsed.hasJet) score += 3;
  if (dbParsed.hasEFI === priceParsed.hasEFI) score += 2;
  if (dbParsed.hasProKicker === priceParsed.hasProKicker) score += 2;
  
  // Shaft configuration bonus - check original model strings for shaft codes
  const dbModel = dbMotor.model.toLowerCase();
  const priceDesc = priceEntry.description.toLowerCase();
  
  const shaftCodes = ['eh', 'elh', 'el', 'mh', 'mlh', 'ept', 'elpt', 'exl', 'xxl', 'xl'];
  for (const code of shaftCodes) {
    if (dbModel.includes(code) && priceDesc.includes(code)) {
      score += 5; // Bonus for matching shaft configuration
      break;
    }
  }
  
  return score;
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

    // Match motors to price entries
    const updates: any[] = [];
    
    for (const motor of motors || []) {
      let bestMatch = null;
      let bestScore = 0;
      
      for (const priceEntry of priceEntries) {
        const score = calculateMatchScore(motor, priceEntry);
        
        if (score > bestScore && score >= 30) { // Lowered threshold for better coverage
          bestScore = score;
          bestMatch = priceEntry;
        }
      }
      
      if (bestMatch) {
        updates.push({
          motor_id: motor.id,
          motor_model: motor.model,
          motor_hp: motor.horsepower,
          matched_description: bestMatch.description,
          matched_code: bestMatch.modelCode,
          new_price: bestMatch.price,
          match_score: bestScore
        });
        
        console.log(`Matched ${motor.model} ${motor.horsepower}HP -> ${bestMatch.description} ($${bestMatch.price}) [Score: ${bestScore}]`);
      } else {
        console.log(`No match found for ${motor.model} (${motor.horsepower}HP, ${motor.motor_type})`);
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

    // Apply fallback pricing for unmatched motors based on horsepower ranges
    const fallbackUpdates: any[] = [];
    for (const motor of unmatchedMotors) {
      let estimatedPrice = null;
      
      // Estimate price based on horsepower and motor type
      if (motor.horsepower) {
        const hp = motor.horsepower;
        const type = motor.motor_type?.toLowerCase() || '';
        
        // Base pricing estimates (conservative, call-for-price alternative)
        if (type.includes('verado')) {
          estimatedPrice = hp * 180 + 5000; // Premium Verado pricing
        } else if (type.includes('pro xs')) {
          estimatedPrice = hp * 150 + 3000; // Pro XS pricing  
        } else if (type.includes('fourstroke')) {
          estimatedPrice = hp * 120 + 2000; // Standard FourStroke
        } else {
          estimatedPrice = hp * 100 + 1500; // Generic fallback
        }
        
        // Round to nearest $100
        estimatedPrice = Math.round(estimatedPrice / 100) * 100;
        
        // Only apply if reasonable (between $1000-$50000)
        if (estimatedPrice >= 1000 && estimatedPrice <= 50000) {
          fallbackUpdates.push({
            motor_id: motor.id,
            motor_model: motor.model,
            estimated_price: estimatedPrice,
            is_estimate: true
          });
          
          console.log(`Fallback estimate for ${motor.model}: $${estimatedPrice} (${hp}HP ${type})`);
        }
      }
    }

    console.log(`Applying ${updates.length} exact matches and ${fallbackUpdates.length} fallback estimates`);

    // Update exact matches
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

    // Apply fallback estimates (only if requested via query param)
    const url = new URL(req.url);
    const applyFallbacks = url.searchParams.get('apply_fallbacks') === 'true';
    
    let fallbackSuccessCount = 0;
    if (applyFallbacks) {
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
    }

    const result = {
      success: true,
      motorsScanned: motors?.length || 0,
      priceEntriesFound: priceEntries.length,
      exactMatches: updates.length,
      fallbackEstimates: fallbackUpdates.length,
      exactMatchesApplied: successCount,
      fallbackEstimatesApplied: fallbackSuccessCount,
      stillUnpriced: (motors?.length || 0) - successCount - fallbackSuccessCount,
      errors: errors.length > 0 ? errors : undefined,
      applyFallbacksNextTime: !applyFallbacks && fallbackUpdates.length > 0,
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