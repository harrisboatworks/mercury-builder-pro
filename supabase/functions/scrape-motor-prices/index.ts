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
  
  // Extract horsepower - look for patterns like "2.5MH", "9.9EH", "15EFI", etc.
  const hpMatch = cleaned.match(/^(\d+(?:\.\d+)?)[A-Z]/);
  const horsepower = hpMatch ? parseFloat(hpMatch[1]) : null;
  
  // Determine motor type
  let motorType = 'FourStroke';
  if (cleaned.includes('FourStroke')) {
    motorType = 'FourStroke';
  } else if (cleaned.includes('EFI')) {
    motorType = 'EFI';
  } else if (cleaned.includes('SeaPro')) {
    motorType = 'SeaPro';  
  } else if (cleaned.includes('Verado')) {
    motorType = 'Verado';
  } else if (cleaned.includes('Jet')) {
    motorType = 'Jet';
  }
  
  // Extract engine configuration
  let engineType = null;
  if (cleaned.includes('Command Thrust')) {
    engineType = 'Command Thrust';
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
  
  // Motor type match
  if (dbMotor.motor_type && priceMotor.motorType) {
    const dbType = dbMotor.motor_type.toLowerCase();
    const priceType = priceMotor.motorType.toLowerCase();
    
    if (dbType === priceType) {
      score += 30;
    } else if (dbType.includes(priceType) || priceType.includes(dbType)) {
      score += 15;
    }
  }
  
  // Engine type bonus
  if (dbMotor.engine_type && priceMotor.engineType) {
    if (dbMotor.engine_type.toLowerCase().includes(priceMotor.engineType.toLowerCase())) {
      score += 10;
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
    
    // Parse prices from HTML tables
    const priceEntries: any[] = [];
    
    // Look for table rows with price data
    const tableRowRegex = /\|\s*([A-Z0-9]+)\s*\|\s*([^|]+?)\s*\|\s*\$([0-9,]+)\s*\|/g;
    let match;
    
    while ((match = tableRowRegex.exec(pricelistHtml)) !== null) {
      const [, modelCode, description, priceStr] = match;
      const price = parseFloat(priceStr.replace(/,/g, ''));
      
      if (price > 0) {
        const parsed = parseMotorDescription(description);
        priceEntries.push({
          modelCode,
          description: description.trim(),
          price,
          ...parsed
        });
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
        
        if (score > bestScore && score >= 50) { // Minimum threshold for matching
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