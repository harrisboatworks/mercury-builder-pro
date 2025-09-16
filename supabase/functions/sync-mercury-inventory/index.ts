import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { XMLParser } from 'https://esm.sh/fast-xml-parser@4.2.5';

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
    
    // Parse XML for Mercury new units only
    const parser = new XMLParser({
      ignoreAttributes: false,
      parseAttributeValue: false,
      parseNodeValue: true,
      parseTrueNumberOnly: false,
      arrayMode: false,
      alwaysCreateTextNode: false,
      isArray: (name, jpath, isLeafNode, isAttribute) => {
        // Always treat 'item' as an array to handle multiple items
        return name === 'item';
      }
    });
    
    const xmlData = parser.parse(xmlText);
    
    // Navigate to items - adjust path based on actual XML structure
    let items = [];
    
    // Try different possible paths to find items
    if (xmlData?.unitinventory?.item) {
      items = Array.isArray(xmlData.unitinventory.item) 
        ? xmlData.unitinventory.item 
        : [xmlData.unitinventory.item];
    } else if (xmlData?.inventory?.item) {
      items = Array.isArray(xmlData.inventory.item) 
        ? xmlData.inventory.item 
        : [xmlData.inventory.item];
    } else if (xmlData?.item) {
      items = Array.isArray(xmlData.item) ? xmlData.item : [xmlData.item];
    } else {
      // Fallback: search for any items in the parsed data
      const findItems = (obj: any): any[] => {
        if (!obj || typeof obj !== 'object') return [];
        
        let found: any[] = [];
        for (const [key, value] of Object.entries(obj)) {
          if (key === 'item') {
            if (Array.isArray(value)) {
              found = found.concat(value);
            } else {
              found.push(value);
            }
          } else if (typeof value === 'object') {
            found = found.concat(findItems(value));
          }
        }
        return found;
      };
      
      items = findItems(xmlData);
    }
    
    console.log(`📦 Found ${items.length} total items in XML`);

    // Filter for Mercury new units only
    const mercuryUnits = items.filter(item => {
      const manufacturer = item?.manufacturer || '';
      const condition = item?.condition || '';
      
      return manufacturer === 'Mercury' && condition === 'New';
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
    
    // Process units to build stock counts
    for (const unit of mercuryUnits) {
      const title = unit?.title || '';
      const stockNumber = unit?.stocknumber || '';
      const priceText = unit?.price || '0';
      const price = parseFloat(String(priceText).replace(/[,$]/g, '')) || 0;
      
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