import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Motor description parsing helper
function parseMotorDescription(description: string) {
  // Remove symbols and extra text
  const cleaned = description.replace(/[†‡⚠️]/g, '').trim();
  
  // Extract horsepower - more flexible patterns
  let horsepower = null;
  const hpPatterns = [
    /(\d+(?:\.\d+)?)(?:MH|MLH|EH|ELH|E|M|EPT|EHPT|ELPT|RC)/i, // 9.9EH, 25MLH, etc.
    /(\d+(?:\.\d+)?)HP/i, // 25HP format
    /^(\d+(?:\.\d+)?)/  // Just the number at start
  ];
  
  for (const pattern of hpPatterns) {
    const match = cleaned.match(pattern);
    if (match) {
      horsepower = parseFloat(match[1]);
      break;
    }
  }
  
  // Determine motor type - more flexible matching
  let motorType = 'FourStroke';
  if (cleaned.toLowerCase().includes('fourstroke')) {
    motorType = 'FourStroke';
  } else if (cleaned.toLowerCase().includes('efi')) {
    motorType = 'EFI';
  } else if (cleaned.toLowerCase().includes('seapro')) {
    motorType = 'SeaPro';  
  } else if (cleaned.toLowerCase().includes('verado')) {
    motorType = 'Verado';
  } else if (cleaned.toLowerCase().includes('jet')) {
    motorType = 'Jet';
  }
  
  // Extract engine configuration
  let engineType = null;
  if (cleaned.toLowerCase().includes('command thrust')) {
    engineType = 'Command Thrust';
  }
  if (cleaned.toLowerCase().includes('prokicker')) {
    engineType = engineType ? `${engineType} ProKicker` : 'ProKicker';
  }
  
  return {
    horsepower,
    motorType,
    engineType,
    description: cleaned
  };
}

// Fuzzy matching score for motor compatibility
function calculateMatchScore(dbMotor: any, priceMotor: any) {
  let score = 0;
  
  // Horsepower match (most important)
  if (dbMotor.horsepower && priceMotor.horsepower) {
    if (Math.abs(dbMotor.horsepower - priceMotor.horsepower) < 0.1) {
      score += 50; // Exact HP match
    } else if (Math.abs(dbMotor.horsepower - priceMotor.horsepower) < 1) {
      score += 25; // Close HP match
    }
  }
  
  // Motor type match - more flexible
  if (dbMotor.motor_type && priceMotor.motorType) {
    const dbType = dbMotor.motor_type.toLowerCase();
    const priceType = priceMotor.motorType.toLowerCase();
    
    if (dbType === priceType) {
      score += 30;
    } else if (dbType.includes(priceType) || priceType.includes(dbType)) {
      score += 15;
    }
    // Special case: FourStroke motors often match
    if ((dbType === 'fourstroke' && priceType === 'fourstroke') || 
        (dbType.includes('fourstroke') && priceType.includes('fourstroke'))) {
      score += 20;
    }
  }
  
  // Engine type bonus - more flexible matching
  if (dbMotor.engine_type && priceMotor.engineType) {
    const dbEngine = dbMotor.engine_type.toLowerCase();
    const priceEngine = priceMotor.engineType.toLowerCase();
    
    if (dbEngine.includes(priceEngine) || priceEngine.includes(dbEngine)) {
      score += 10;
    }
    // Command Thrust matching
    if (dbEngine.includes('command thrust') && priceEngine.includes('command thrust')) {
      score += 15;
    }
  }
  
  // Model text similarity (new - check if key terms match)
  if (dbMotor.model && priceMotor.description) {
    const dbModel = dbMotor.model.toLowerCase();
    const priceDesc = priceMotor.description.toLowerCase();
    
    // Check for common shaft configurations
    const shaftTerms = ['eh', 'elh', 'el', 'mh', 'mlh', 'ept', 'elpt'];
    for (const term of shaftTerms) {
      if (dbModel.includes(term) && priceDesc.includes(term)) {
        score += 5;
      }
    }
  }
  
  // Year bonus (prefer current year motors)
  if (dbMotor.year === 2025) {
    score += 5;
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
        
        if (score > bestScore && score >= 40) { // Lowered threshold since we improved matching
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
        
        console.log(`Matched ${motor.model} ${motor.horsepower}HP -> ${bestMatch.description} ($${bestMatch.price})`);
      }
    }

    // Update motor prices in database
    let successCount = 0;
    const errors: string[] = [];

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

    const result = {
      success: true,
      motorsScanned: motors?.length || 0,
      priceEntriesFound: priceEntries.length,
      matchesFound: updates.length,
      successfulUpdates: successCount,
      errors: errors.length > 0 ? errors : undefined,
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