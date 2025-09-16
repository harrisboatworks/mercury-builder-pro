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
    
    // Log first few items for debugging with full structure
    if (itemMatches.length > 0) {
      console.log('📋 Sample item structures:');
      for (let i = 0; i < Math.min(3, itemMatches.length); i++) {
        console.log(`Item ${i + 1}:`, itemMatches[i].substring(0, 800) + '...');
      }
    }
    
    // Extract Mercury units using flexible field matching
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
      const title = titleMatch?.[1]?.trim().toLowerCase() || '';
      const description = descMatch?.[1]?.trim().toLowerCase() || '';
      
      // Mercury matching (flexible)
      const isMercury = manufacturer.includes('mercury') || 
                       title.includes('mercury') || 
                       description.includes('mercury');
      
      // Motor/Outboard detection
      const isMotor = category.includes('motor') || 
                     category.includes('outboard') || 
                     category.includes('engine') ||
                     title.includes('motor') || 
                     title.includes('outboard') || 
                     title.includes('hp') ||
                     description.includes('outboard') ||
                     description.includes('motor');
      
      // Condition matching (more flexible - include excellent, good, new, etc.)
      const validConditions = ['new', 'excellent', 'good', 'like new', 'used', 'pre-owned'];
      const isValidCondition = validConditions.some(cond => condition.includes(cond)) || condition.length === 0;
      
      // Log detailed debug info for first few Mercury items
      if (isMercury && mercuryUnits.length < 5) {
        console.log(`🔍 Mercury unit found:
          Manufacturer: "${manufacturer}"
          Condition: "${condition}" 
          Category: "${category}"
          Title: "${title.substring(0, 100)}"
          Is Motor: ${isMotor}
          Valid Condition: ${isValidCondition}`);
      }
      
      if (isMercury && !isMotor) {
        console.log(`⚠️ Mercury unit but not motor: category="${category}", title="${title.substring(0, 50)}"`);
      }
      
      if (isMercury && isMotor && !isValidCondition) {
        console.log(`⚠️ Mercury motor but invalid condition: condition="${condition}"`);
      }
      
      return isMercury && isMotor && isValidCondition;
    });

    console.log(`🎯 Filtered to ${mercuryUnits.length} Mercury new units`);

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

    let motorsUpdated = 0;
    const updateResults = [];

    // Update matching motors using fuzzy matching
    for (const [title, quantity] of stockMap.entries()) {
      const price = priceMap.get(title) || 0;
      const stockNumber = stockNumberMap.get(title) || '';
      
      console.log(`🔍 Processing: "${title}" (qty: ${quantity}, price: $${price})`);
      
      // Try multiple matching strategies
      const matchingStrategies = [
        // Exact stock number match
        stockNumber ? { stock_number: { eq: stockNumber } } : null,
        // Exact model_display match
        { model_display: { eq: title } },
        // Case-insensitive model_display match
        { model_display: { ilike: title } },
        // Partial model_display match (contains)
        { model_display: { ilike: `%${title}%` } },
        // Try without HP spacing
        title.includes(' ') ? { model_display: { ilike: `%${title.replace(' ', '')}%` } } : null,
      ].filter(Boolean);

      let updated = false;
      
      for (const strategy of matchingStrategies) {
        if (updated) break;
        
        try {
          const { data: matchedMotors, error } = await supabase
            .from('motor_models')
            .select('id, model_display, stock_number')
            .eq('is_brochure', true)
            .match(strategy!)
            .limit(5);

          if (error) {
            console.error(`❌ Query error for "${title}":`, error);
            continue;
          }

          if (matchedMotors && matchedMotors.length > 0) {
            console.log(`✅ Found ${matchedMotors.length} matches for "${title}" using strategy:`, strategy);
            
            // Update all matched motors
            const motorIds = matchedMotors.map(m => m.id);
            
            const { error: updateError } = await supabase
              .from('motor_models')
              .update({
                in_stock: true,
                stock_quantity: quantity,
                stock_number: stockNumber || undefined,
                dealer_price_live: price > 0 ? price : undefined,
                last_stock_check: new Date().toISOString()
              })
              .in('id', motorIds);

            if (updateError) {
              console.error(`❌ Update error for "${title}":`, updateError);
            } else {
              motorsUpdated += matchedMotors.length;
              updateResults.push({
                xml_title: title,
                matched_motors: matchedMotors.length,
                stock_quantity: quantity,
                price: price,
                strategy: Object.keys(strategy!)[0]
              });
              updated = true;
            }
          }
        } catch (err) {
          console.error(`❌ Strategy error for "${title}":`, err);
        }
      }
      
      if (!updated) {
        console.warn(`⚠️ No matches found for: "${title}"`);
        updateResults.push({
          xml_title: title,
          matched_motors: 0,
          stock_quantity: quantity,
          price: price,
          strategy: 'no_match'
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