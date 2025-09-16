import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Create sync log entry
  const { data: syncLog } = await supabase
    .from('sync_logs')
    .insert({
      sync_type: 'mercury_inventory',
      status: 'running',
      started_at: new Date().toISOString()
    })
    .select()
    .single();

  try {
    console.log('🚀 Starting Mercury inventory sync from DealerSpike XML');
    
    // Fetch XML feed from DealerSpike
    const response = await fetch('https://www.harrisboatworks.ca/unitinventory_univ.xml');
    
    if (!response.ok) {
      throw new Error(`XML feed request failed: ${response.status} ${response.statusText}`);
    }

    const xmlText = await response.text();
    console.log(`📄 Fetched XML feed (${xmlText.length} chars)`);
    
    // Parse XML using regex approach (Deno-compatible)
    console.log('🔍 Parsing XML with regex approach...');
    
    // Extract all items using regex
    const itemMatches = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];
    console.log(`📦 Found ${itemMatches.length} total items in XML`);
    
    // Add enhanced debugging for XML structure
    console.log('XML length:', xmlText.length);
    console.log('First 1000 chars:', xmlText.substring(0, 1000));
    console.log('Total items found:', itemMatches.length);
    
    // Check first item to see structure
    if (itemMatches.length > 0) {
      console.log('First item sample:', itemMatches[0].substring(0, 500));
    }
    
    // Log first few items for debugging with full structure
    if (itemMatches.length > 0) {
      console.log('📋 Sample item structures:');
      for (let i = 0; i < Math.min(3, itemMatches.length); i++) {
        console.log(`Item ${i + 1}:`, itemMatches[i].substring(0, 800) + '...');
      }
    }
    
    // Extract Mercury units using flexible field matching
    let debugCounter = 0;
    const mercuryUnits = itemMatches.filter(item => {
      // Try multiple field name variations
      const manufacturerPatterns = [
        /<manufacturer>(.*?)<\/manufacturer>/i,
        /<make>(.*?)<\/make>/i,
        /<brand>(.*?)<\/brand>/i
      ];
      
      const conditionPatterns = [
        /<condition>(.*?)<\/condition>/i,
        /<status>(.*?)<\/status>/i,
        /<state>(.*?)<\/state>/i
      ];
      
      const categoryPatterns = [
        /<category>(.*?)<\/category>/i,
        /<type>(.*?)<\/type>/i,
        /<producttype>(.*?)<\/producttype>/i
      ];
      
      // Extract manufacturer
      let manufacturer = '';
      for (const pattern of manufacturerPatterns) {
        const match = item.match(pattern);
        if (match) {
          manufacturer = match[1]?.trim().toLowerCase() || '';
          break;
        }
      }
      
      // Extract condition
      let condition = '';
      for (const pattern of conditionPatterns) {
        const match = item.match(pattern);
        if (match) {
          condition = match[1]?.trim().toLowerCase() || '';
          break;
        }
      }
      
      // Extract category to filter for motors
      let category = '';
      for (const pattern of categoryPatterns) {
        const match = item.match(pattern);
        if (match) {
          category = match[1]?.trim().toLowerCase() || '';
          break;
        }
      }
      
      // Also check title and description for motor indicators
      const titleMatch = item.match(/<title>(.*?)<\/title>/i);
      const descMatch = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/i);
      const title = titleMatch?.[1]?.trim() || '';
      const description = descMatch?.[1]?.trim() || '';
      
      // Mercury matching (flexible)
      const isMercury = manufacturer.includes('mercury') || 
                       title.toLowerCase().includes('mercury') || 
                       description.toLowerCase().includes('mercury');
      
      // Enhanced HP detection - look for various HP patterns
      const hpPatterns = [
        /(\d+)\s*hp\b/i,           // "25hp", "25 hp"
        /(\d+)\s*HP\b/,            // "25HP", "25 HP"
        /(\d+)hp\b/i,              // "25hp" (no space)
        /\b(\d+)\s*horsepower\b/i  // "25 horsepower"
      ];
      
      let hasHP = false;
      let detectedHP = null;
      for (const pattern of hpPatterns) {
        const match = title.match(pattern);
        if (match) {
          hasHP = true;
          detectedHP = parseInt(match[1]);
          break;
        }
      }
      
      // Enhanced motor detection - look for Mercury-specific indicators
      const mercuryMotorIndicators = [
        'fourstroke', 'fourStroke', 'four stroke',
        'proxs', 'pro xs', 'prxos', 
        'seapro', 'sea pro',
        'verado',
        'outboard',
        'engine',
        'motor'
      ];
      
      const mercuryRiggingCodes = [
        'elpt', 'elhpt', 'exlpt', 'eh', 'mh', 'xl', 'xxl',
        'ct', 'command thrust', 'efi', 'dts', 'tiller'
      ];
      
      // Check for motor indicators in title and description
      const hasMotorIndicator = mercuryMotorIndicators.some(indicator => 
        title.toLowerCase().includes(indicator) || 
        description.toLowerCase().includes(indicator)
      );
      
      const hasRiggingCode = mercuryRiggingCodes.some(code =>
        title.toLowerCase().includes(code) || 
        description.toLowerCase().includes(code)
      );
      
      // Motor detection logic - enhanced for Mercury products
      const isMotor = 
        // Traditional category-based detection
        category.includes('motor') || 
        category.includes('outboard') || 
        category.includes('engine') ||
        // Enhanced title/description detection
        hasHP || 
        hasMotorIndicator ||
        hasRiggingCode ||
        // Fallback patterns
        (title.toLowerCase().includes('mercury') && (
          title.toLowerCase().includes('motor') ||
          title.toLowerCase().includes('outboard')
        ));
      
      // Condition matching (more flexible - include excellent, good, new, etc.)
      const validConditions = ['new', 'excellent', 'good', 'like new', 'used', 'pre-owned'];
      const isValidCondition = validConditions.some(cond => condition.includes(cond)) || condition.length === 0;
      
      // Log detailed debug info for first few Mercury items
      if (isMercury && debugCounter < 10) {
        console.log(`🔍 Mercury unit found (#${debugCounter + 1}):
          Manufacturer: "${manufacturer}"
          Condition: "${condition}" 
          Category: "${category}"
          Title: "${title.substring(0, 100)}"
          Detected HP: ${detectedHP || 'none'}
          Has HP Pattern: ${hasHP}
          Has Motor Indicator: ${hasMotorIndicator}
          Has Rigging Code: ${hasRiggingCode}
          Is Motor: ${isMotor}
          Valid Condition: ${isValidCondition}`);
        debugCounter++;
      }
      
      if (isMercury && !isMotor) {
        console.log(`⚠️ Mercury unit but not motor: category="${category}", title="${title.substring(0, 50)}", hasHP=${hasHP}, hasMotorIndicator=${hasMotorIndicator}, hasRiggingCode=${hasRiggingCode}`);
      }
      
      if (isMercury && isMotor && !isValidCondition) {
        console.log(`⚠️ Mercury motor but invalid condition: condition="${condition}"`);
      }
      
      return isMercury && isMotor && isValidCondition;
    });

    console.log(`🎯 Filtered to ${mercuryUnits.length} Mercury units from ${itemMatches.length} total items`);

    // Show additional filtering stats
    if (mercuryUnits.length > 0) {
      console.log(`📊 Mercury units found - showing first 3 samples:`);
      for (let i = 0; i < Math.min(3, mercuryUnits.length); i++) {
        const unit = mercuryUnits[i];
        const titleMatch = unit.match(/<title>(.*?)<\/title>/i);
        const title = titleMatch?.[1]?.trim() || 'No title';
        console.log(`  ${i + 1}. ${title.substring(0, 80)}`);
      }
    }

    // Reset all motors to out of stock first
    console.log('🔄 Resetting all motors to out of stock...');
    await supabase
      .from('motor_models')
      .update({ 
        in_stock: false, 
        stock_quantity: 0,
        last_stock_check: new Date().toISOString()
      })
      .eq('is_brochure', true);

    // Track stock counts by title for duplicate handling
    const stockMap = new Map<string, number>();
    const priceMap = new Map<string, number>();
    const stockNumberMap = new Map<string, string>();
    
    
    // Process units to build stock counts using flexible regex extraction
    for (const unit of mercuryUnits) {
      // Extract data using multiple field name patterns
      const titlePatterns = [
        /<title>(.*?)<\/title>/i,
        /<name>(.*?)<\/name>/i,
        /<model>(.*?)<\/model>/i
      ];
      
      const stockNumberPatterns = [
        /<stocknumber>(.*?)<\/stocknumber>/i,
        /<stock_number>(.*?)<\/stock_number>/i,
        /<vin>(.*?)<\/vin>/i,
        /<id>(.*?)<\/id>/i
      ];
      
      const pricePatterns = [
        /<price>(.*?)<\/price>/i,
        /<cost>(.*?)<\/cost>/i,
        /<msrp>(.*?)<\/msrp>/i
      ];
      
      // Extract title
      let title = '';
      for (const pattern of titlePatterns) {
        const match = unit.match(pattern);
        if (match) {
          title = match[1]?.trim() || '';
          break;
        }
      }
      
      // Extract stock number
      let stockNumber = '';
      for (const pattern of stockNumberPatterns) {
        const match = unit.match(pattern);
        if (match) {
          stockNumber = match[1]?.trim() || '';
          break;
        }
      }
      
      // Extract price
      let priceText = '0';
      for (const pattern of pricePatterns) {
        const match = unit.match(pattern);
        if (match) {
          priceText = match[1]?.trim() || '0';
          break;
        }
      }
      
      const price = parseFloat(priceText.replace(/[,$]/g, '')) || 0;
      
      // Log sample unit data for debugging (first 5 units only)
      if (stockMap.size < 5) {
        console.log(`📊 Unit data:
          Title: "${title}"
          Stock#: "${stockNumber}" 
          Price: $${price}
          Raw Price Text: "${priceText}"`);
      }
      
      if (title) {
        // Increment stock count
        stockMap.set(title, (stockMap.get(title) || 0) + 1);
        
        // Store price (use highest price if multiple units)
        if (!priceMap.has(title) || price > priceMap.get(title)!) {
          priceMap.set(title, price);
        }
        
        // Store stock number (use first one found)
        if (!stockNumberMap.has(title) && stockNumber) {
          stockNumberMap.set(title, stockNumber);
        }
      }
    }

    console.log(`📊 Built stock map with ${stockMap.size} unique models`);

    // Enhanced title normalization functions
    function normalizeXmlTitle(title: string): { normalized: string, hp: number | null, codes: string[] } {
      // Remove year, brand, common words
      let normalized = title
        .replace(/^\d{4}\s+/i, '') // Remove year at start
        .replace(/mercury\s+/i, '') // Remove Mercury brand
        .replace(/fourstroke\s+/i, 'FS ') // Normalize FourStroke
        .replace(/pro\s+xs®?\s+/i, 'ProXS ') // Normalize Pro XS
        .replace(/\s+/g, ' ') // Clean up spacing
        .trim();

      // Enhanced HP extraction using multiple patterns
      const hpPatterns = [
        /(\d+(?:\.\d+)?)\s*hp\b/i,     // "25hp", "25 hp", "9.9 hp"
        /(\d+(?:\.\d+)?)\s*HP\b/,      // "25HP", "25 HP", "9.9 HP"
        /(\d+(?:\.\d+)?)hp\b/i,        // "25hp", "9.9hp" (no space)
        /\b(\d+(?:\.\d+)?)\s*horsepower\b/i, // "25 horsepower", "9.9 horsepower"
        /(\d+(?:\.\d+)?)\s+[A-Z]/,     // "9.9 EH", "115 ELPT", "25 EH"
        /^(\d+(?:\.\d+)?)\s/           // number at start "9.9 EH", "115 L"
      ];
      
      let hp = null;
      for (const pattern of hpPatterns) {
        const match = normalized.match(pattern);
        if (match) {
          const hpValue = parseFloat(match[1]);
          if (hpValue > 0 && hpValue <= 1000) { // Reasonable HP range
            hp = hpValue;
            break;
          }
        }
      }

      // Extract important codes (shaft, trim, etc.)
      const codes = [];
      const codeMatches = normalized.match(/\b(ELPT|ELHPT|EXLPT|EH|MH|XL|XXL|Command Thrust|CT|EFI|PROXS|ProXS|Pro XS|L)\b/gi);
      if (codeMatches) {
        codes.push(...codeMatches.map(c => c.toUpperCase().replace(/PRO\s*XS/i, 'PROXS')));
      }

      return { normalized, hp, codes };
    }

    function normalizeDbTitle(title: string): { normalized: string, hp: number | null, codes: string[] } {
      // Clean database title
      let normalized = title
        .replace(/\s+/g, ' ')
        .trim();

      // Enhanced HP extraction using multiple patterns (same as XML normalization)
      const hpPatterns = [
        /(\d+(?:\.\d+)?)\s*hp\b/i,     // "25hp", "25 hp", "9.9 hp"
        /(\d+(?:\.\d+)?)\s*HP\b/,      // "25HP", "25 HP", "9.9 HP"
        /(\d+(?:\.\d+)?)hp\b/i,        // "25hp", "9.9hp" (no space)
        /\b(\d+(?:\.\d+)?)\s*horsepower\b/i, // "25 horsepower", "9.9 horsepower"
        /(\d+(?:\.\d+)?)\s+[A-Z]/,     // "9.9 EH", "115 ELPT", "25 EH"
        /^(\d+(?:\.\d+)?)\s/           // "25 ECXLPT" (number at start)
      ];
      let hp = null;
      for (const pattern of hpPatterns) {
        const match = normalized.match(pattern);
        if (match) {
          const hpValue = parseFloat(match[1]);
          if (hpValue > 0 && hpValue <= 1000) { // Reasonable HP range
            hp = hpValue;
            break;
          }
        }
      }

      // Extract codes
      const codes = [];
      const codeMatches = normalized.match(/\b(ELPT|ELHPT|EXLPT|EH|MH|XL|XXL|CT|EFI|Command|Thrust|PROXS|ProXS|Pro XS|L)\b/gi);
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

    // Get all brochure motors for enhanced matching
    const { data: allMotors } = await supabase
      .from('motor_models')
      .select('id, model_display, stock_number, horsepower')
      .eq('is_brochure', true);

    console.log(`🎯 Processing ${stockMap.size} XML units against ${allMotors?.length || 0} database motors`);

    let motorsUpdated = 0;
    const updateResults = [];

    // Enhanced matching logic
    for (const [title, quantity] of stockMap.entries()) {
      const price = priceMap.get(title) || 0;
      const stockNumber = stockNumberMap.get(title) || '';
      
      console.log(`🔍 Processing: "${title}" (qty: ${quantity}, price: $${price})`);
      
      // Normalize XML title
      const xmlData = normalizeXmlTitle(title);
      console.log(`   📝 Normalized XML: "${xmlData.normalized}" (HP: ${xmlData.hp}, Codes: [${xmlData.codes.join(', ')}])`);
      
      // Debug HP extraction if missing
      if (!xmlData.hp) {
        console.log(`   🔍 HP extraction debug for "${title}": trying different patterns...`);
        const debugPatterns = [
          { name: "basic hp", pattern: /(\d+(?:\.\d+)?)\s*hp\b/i },
          { name: "number space code", pattern: /(\d+(?:\.\d+)?)\s+[A-Z]/ },
          { name: "start number", pattern: /^(\d+(?:\.\d+)?)\s/ }
        ];
        debugPatterns.forEach(({ name, pattern }) => {
          const match = title.match(pattern);
          if (match) {
            console.log(`     ✓ ${name}: found ${match[1]}`);
          }
        });
      }

      let bestMatch = null;
      let bestScore = 0;
      const candidateMatches = [];

      // Try exact stock number match first
      if (stockNumber && allMotors) {
        const stockMatch = allMotors.find(m => m.stock_number === stockNumber);
        if (stockMatch) {
          bestMatch = stockMatch;
          bestScore = 100;
          console.log(`   ✅ Exact stock number match: ${stockMatch.model_display}`);
        }
      }

      // If no stock match, try fuzzy matching
      if (!bestMatch && allMotors) {
        for (const motor of allMotors) {
          const dbData = normalizeDbTitle(motor.model_display || '');
          const score = calculateMatchScore(xmlData, dbData);
          
          if (score > 30) { // Minimum threshold
            candidateMatches.push({ motor, score, dbData });
            if (score > bestScore) {
              bestScore = score;
              bestMatch = motor;
            }
          }
        }

        // Log candidate matches for debugging
        if (candidateMatches.length > 0) {
          console.log(`   🎯 Found ${candidateMatches.length} candidate matches:`);
          candidateMatches
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .forEach(({ motor, score, dbData }) => {
              console.log(`      ${score} pts: "${motor.model_display}" (HP: ${dbData.hp}, Codes: [${dbData.codes.join(', ')}])`);
            });
        }
      }

      // Update best match if found (lowered threshold to catch more matches)
      if (bestMatch && bestScore >= 35) {
        try {
          const { error: updateError } = await supabase
            .from('motor_models')
            .update({
              in_stock: true,
              stock_quantity: quantity,
              stock_number: stockNumber || undefined,
              dealer_price_live: price > 0 ? price : undefined,
              last_stock_check: new Date().toISOString()
            })
            .eq('id', bestMatch.id);

          if (updateError) {
            console.error(`❌ Update error for "${title}":`, updateError);
          } else {
            motorsUpdated++;
            updateResults.push({
              xml_title: title,
              matched_motors: 1,
              stock_quantity: quantity,
              price: price,
              strategy: `fuzzy_match_score_${bestScore}`,
              matched_model: bestMatch.model_display
            });
            console.log(`   ✅ Updated: "${bestMatch.model_display}" (Score: ${bestScore})`);
          }
        } catch (err) {
          console.error(`❌ Update error for "${title}":`, err);
        }
      } else {
        console.warn(`   ⚠️ No suitable matches found (best score: ${bestScore})`);
        updateResults.push({
          xml_title: title,
          matched_motors: 0,
          stock_quantity: quantity,
          price: price,
          strategy: `no_match_best_score_${bestScore}`,
          xml_normalized: xmlData.normalized,
          xml_hp: xmlData.hp,
          xml_codes: xmlData.codes
        });
      }
    }

    // Get final summary statistics
    const { data: summary } = await supabase
      .from('motor_models')
      .select('in_stock, stock_quantity')
      .eq('is_brochure', true);

    const inStockMotors = summary?.filter(m => m.in_stock) || [];
    const inStockCount = inStockMotors.length;
    const totalCount = summary?.length || 0;
    const totalStockQuantity = inStockMotors.reduce((sum, m) => sum + (m.stock_quantity || 0), 0);

    const syncResult = {
      success: true,
      xml_units_found: mercuryUnits.length,
      unique_models: stockMap.size,
      motors_updated: motorsUpdated,
      motors_in_stock: inStockCount,
      total_motors: totalCount,
      total_stock_quantity: totalStockQuantity,
      update_details: updateResults,
      timestamp: new Date().toISOString()
    };

    // Update sync log with success
    if (syncLog) {
      await supabase
        .from('sync_logs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          motors_processed: motorsUpdated,
          motors_in_stock: inStockCount,
          details: syncResult
        })
        .eq('id', syncLog.id);
    }

    console.log(`✅ Sync complete: ${inStockCount}/${totalCount} motors in stock (${totalStockQuantity} total units)`);

    return new Response(JSON.stringify(syncResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Sync failed:', error);
    
    const errorResult = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };

    // Update sync log with failure
    if (syncLog) {
      await supabase
        .from('sync_logs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error.message,
          details: errorResult
        })
        .eq('id', syncLog.id);
    }

    return new Response(JSON.stringify(errorResult), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});