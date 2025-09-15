import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { load } from 'https://esm.sh/cheerio@1.0.0-rc.12';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

// Import shared helper functions (using Deno's dynamic import approach)
const SHARED_HELPERS_BASE_URL = 'https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/_shared/';

// Enhanced model key utility with better specificity - Shared version
function buildModelKey(modelDisplay: string, modelCode?: string, attrs?: any): string {
  if (!modelDisplay && !modelCode) return '';
  
  const input = modelDisplay || modelCode || '';
  let s = input
    // strip HTML & odd chars
    .replace(/<[^>]*>/g, ' ')
    .replace(/[()]/g, ' ')
    // remove year tokens
    .replace(/\b20\d{2}\b/g, ' ')
    // normalize family names
    .replace(/\bfour[\s-]*stroke\b/ig, 'FourStroke')
    .replace(/\bpro[\s-]*xs\b/ig, 'ProXS')
    .replace(/\bsea[\s-]*pro\b/ig, 'SeaPro')
    .replace(/\bverado\b/ig, 'Verado')
    .replace(/\bracing\b/ig, 'Racing')
    // normalize EFI
    .replace(/\befi\b/ig, 'EFI')
    // coalesce whitespace
    .replace(/\s+/g, ' ')
    .trim();

  // Extract components for more specific keys
  const hpMatch = s.match(/\b(\d+(\.\d+)?)\s*hp\b/i);
  const hp = hpMatch ? `${hpMatch[1]}HP` : '';
  
  // Extract family
  const famMatch = s.match(/\b(FourStroke|ProXS|SeaPro|Verado|Racing)\b/i);
  const family = famMatch ? famMatch[1] : (attrs?.family || 'FourStroke');
  
  // Extract shaft length with priority order
  let shaft = '';
  if (/XXXL/i.test(s)) shaft = 'XXXL';
  else if (/XXL/i.test(s)) shaft = 'XXL'; 
  else if (/\bXL\b/i.test(s)) shaft = 'XL';
  else if (/\bL\b/i.test(s)) shaft = 'L';
  else if (/\bS\b/i.test(s)) shaft = 'S';
  else if (attrs?.shaft) shaft = attrs.shaft;
  
  // Extract control type
  let control = '';
  if (/TILLER/i.test(s)) control = 'TILLER';
  else if (/DTS/i.test(s)) control = 'DTS';
  else if (/ELHPT/i.test(s)) control = 'ELHPT';
  else if (/ELPT/i.test(s)) control = 'ELPT';
  else if (/ELH/i.test(s)) control = 'ELH';
  else if (/ELO/i.test(s)) control = 'ELO';
  else if (attrs?.control) control = attrs.control;
  
  // Extract special features
  const ct = /\bCT\b/i.test(s) || attrs?.ct;
  const jet = /JET/i.test(s) || attrs?.jet;
  
  // Build key components in priority order
  const keyParts = [
    family,
    hp,
    shaft,
    control,
    ct ? 'CT' : '',
    jet ? 'JET' : '',
    'EFI'
  ].filter(Boolean);
  
  // If we still don't have enough specificity, append model code suffix
  let key = keyParts.join('-');
  if (modelCode && modelCode !== modelDisplay) {
    // Take last 3-4 chars of model code for additional uniqueness
    const codeSuffix = modelCode.slice(-4).replace(/[^A-Z0-9]/g, '');
    if (codeSuffix) key += `-${codeSuffix}`;
  }
  
  return key.toUpperCase().replace(/-+/g, '-').replace(/^-|-$/g, '');
}

// Parse model attributes from display string
function parseModelFromText(modelDisplay: string = '') {
  const text = modelDisplay.toUpperCase();
  
  // Extract HP
  const hpMatch = text.match(/(?<!\d)(\d{1,3}(?:\.\d)?)\s*HP?/);
  const horsepower = hpMatch ? Number(hpMatch[1]) : null;
  
  // Determine family
  let family = 'FourStroke';
  if (/PRO\s*XS/i.test(text)) family = 'ProXS';
  else if (/SEAPRO/i.test(text)) family = 'SeaPro';
  else if (/VERADO/i.test(text)) family = 'Verado';
  else if (/RACING/i.test(text)) family = 'Racing';
  
  // Extract fuel type
  const fuel = /EFI/.test(text) ? 'EFI' : '';
  
  // Extract rigging code
  let rigging_code = '';
  if (/TILLER/i.test(text)) rigging_code = 'TILLER';
  else if (/DTS/.test(text)) rigging_code = 'DTS';
  else if (/ELHPT/.test(text)) rigging_code = 'ELHPT';
  else if (/ELPT/.test(text)) rigging_code = 'ELPT';
  else if (/ELH/.test(text)) rigging_code = 'ELH';
  else if (/ELO/.test(text)) rigging_code = 'ELO';
  
  return {
    family,
    horsepower,
    fuel,
    rigging_code
  };
}

// Generate SHA-256 checksum
async function generateChecksum(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Get Supabase client
function getSupabaseClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!url || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  
  return createClient(url, serviceKey);
}

// Save artifact to storage and get signed URL
async function saveArtifact(supabase: any, filename: string, content: string, contentType: string): Promise<string> {
  const { error: uploadError } = await supabase.storage
    .from('sources')
    .upload(filename, content, {
      contentType,
      upsert: true
    });
    
  if (uploadError) {
    console.error('Storage upload error:', uploadError);
    throw new Error(`Failed to save ${filename}: ${uploadError.message}`);
  }
  
  const { data: signedUrl } = await supabase.storage
    .from('sources')
    .createSignedUrl(filename, 60 * 60 * 24); // 24 hours
    
  return signedUrl?.signedUrl || '';
}

// Parse HTML table(s) for Mercury models
function parseHtml(html: string): Array<{model_display: string, dealer_price: number}> {
  const $ = load(html);
  const results: Array<{model_display: string, dealer_price: number}> = [];
  
  // Find all tables and process them
  $('table').each((_, table) => {
    const $table = $(table);
    
    // Skip if doesn't look like a price table
    const tableText = $table.text().toLowerCase();
    if (!tableText.includes('mercury') && !tableText.includes('price') && !tableText.includes('hp')) {
      return;
    }
    
    // Process table rows
    $table.find('tr').each((_, row) => {
      const $row = $(row);
      const cells = $row.find('td, th').toArray().map(cell => $(cell).text().trim());
      
      if (cells.length < 2) return;
      
      // Look for model and price in any combination of columns
      let model_display = '';
      let dealer_price = 0;
      
      for (const cell of cells) {
        // Check if this looks like a model name (contains HP or motor family)
        if (!model_display && (/\d+\s*hp/i.test(cell) || /fourstroke|prox|verado|seapro/i.test(cell))) {
          model_display = cell;
        }
        
        // Check if this looks like a price
        if (!dealer_price) {
          const priceMatch = cell.match(/\$?\s*(\d{1,6}(?:,\d{3})*(?:\.\d{2})?)/);
          if (priceMatch) {
            const price = Number(priceMatch[1].replace(/,/g, ''));
            if (price > 100 && price < 1000000) { // Reasonable price range
              dealer_price = price;
            }
          }
        }
      }
      
      if (model_display && dealer_price > 0) {
        results.push({ model_display: model_display.trim(), dealer_price });
      }
    });
  });
  
  return results;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { 
      url = 'https://www.harrisboatworks.ca/mercurypricelist',
      dry_run = false, 
      msrp_markup = 1.10, 
      force = false 
    } = await req.json();
    
    console.log(`Starting price list ingest from: ${url}`);
    
    // Fetch HTML
    console.log('Fetching HTML...');
    const response = await fetch(url, {
      headers: { 
        'User-Agent': 'HBW-InventoryBot/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      redirect: 'follow'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    console.log(`Fetched ${html.length} chars of HTML`);
    
    // Generate checksum
    const checksum = await generateChecksum(html);
    console.log(`HTML checksum: ${checksum}`);
    
    const supabase = getSupabaseClient();
    
    // Check if content unchanged (unless force=true)
    if (!force) {
      // Look for most recent snapshot with same checksum
      const { data: recentSnapshots } = await supabase.storage
        .from('sources')
        .list('pricelist', { limit: 10, sortBy: { column: 'created_at', order: 'desc' } });
        
      if (recentSnapshots) {
        for (const file of recentSnapshots) {
          if (file.name.includes(checksum.substring(0, 8))) {
            console.log(`Skipping - content unchanged (checksum match)`);
            return new Response(JSON.stringify({
              success: true,
              skipped_due_to_same_checksum: true,
              checksum,
              rows_parsed: 0,
              rows_created: 0,
              rows_updated: 0,
              errors: 0
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
        }
      }
    }
    
    // Parse HTML tables
    console.log('Parsing HTML tables...');
    const rawData = parseHtml(html);
    console.log(`Parsed ${rawData.length} raw entries`);
    
    if (rawData.length === 0) {
      throw new Error('No valid price data found in HTML tables');
    }
    
    // Transform to motor models format
    const motorModels = rawData.map(item => {
      const attrs = parseModelFromText(item.model_display);
      const dealer_price = item.dealer_price;
      const msrp = Math.round((dealer_price * msrp_markup) * 100) / 100;
      
      const model_key = buildModelKey(item.model_display, undefined, attrs);
      
      return {
        make: 'Mercury',
        family: attrs.family,
        model: item.model_display,
        model_key,
        year: 2025,
        horsepower: attrs.horsepower,
        fuel_type: attrs.fuel,
        motor_type: attrs.family,
        rigging_code: attrs.rigging_code,
        dealer_price,
        msrp,
        msrp_source: `derived:+${Math.round((msrp_markup - 1) * 100)}%`,
        price_source: 'pricelist',
        is_brochure: true,
        in_stock: false,
        availability: 'Brochure',
        last_scraped: new Date().toISOString(),
        inventory_source: 'pricelist'
      };
    });
    
    // Deduplication logic: Group by model_key and pick best row for each key
    const keyGroups = new Map<string, any[]>();
    const duplicateKeys: string[] = [];
    
    for (const model of motorModels) {
      if (!keyGroups.has(model.model_key)) {
        keyGroups.set(model.model_key, []);
      }
      keyGroups.get(model.model_key)!.push(model);
    }
    
    // Log duplicates for debugging
    for (const [key, models] of keyGroups) {
      if (models.length > 1) {
        duplicateKeys.push(key);
        console.log(`Duplicate model_key "${key}" found for:`, models.map(m => ({
          model: m.model,
          hp: m.horsepower,
          rigging: m.rigging_code
        })));
      }
    }
    
    // Pick best representative for each key (prefer higher HP, then more detailed model name)
    const deduplicatedModels = Array.from(keyGroups.values()).map(group => {
      if (group.length === 1) return group[0];
      
      // Sort by: higher HP first, then more detailed model name
      return group.sort((a, b) => {
        if (a.horsepower !== b.horsepower) return (b.horsepower || 0) - (a.horsepower || 0);
        return b.model.length - a.model.length;
      })[0];
    });
    
    console.log(`Processed ${motorModels.length} models, deduplicated to ${deduplicatedModels.length}`);
    if (duplicateKeys.length > 0) {
      console.log(`Resolved ${duplicateKeys.length} duplicate model_keys`);
    }
    
    // Create timestamp for artifacts
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const checksumPrefix = checksum.substring(0, 8);
    
    // Prepare artifacts
    const jsonContent = JSON.stringify(deduplicatedModels, null, 2);
    const csvRows = [
      'model_display,model_key,family,horsepower,dealer_price,msrp,rigging_code',
      ...deduplicatedModels.map(m => 
        `"${m.model}","${m.model_key}","${m.family}",${m.horsepower || ''},${m.dealer_price},${m.msrp},"${m.rigging_code || ''}"`
      )
    ];
    const csvContent = csvRows.join('\n');
    
    // Save artifacts to storage
    console.log('Saving artifacts to storage...');
    const artifacts = {
      html_url: await saveArtifact(supabase, `pricelist/${timestamp}-${checksumPrefix}.html`, html, 'text/html'),
      json_url: await saveArtifact(supabase, `pricelist/${timestamp}-${checksumPrefix}.json`, jsonContent, 'application/json'),
      csv_url: await saveArtifact(supabase, `pricelist/${timestamp}-${checksumPrefix}.csv`, csvContent, 'text/csv')
    };
    
    let rows_created = 0;
    let rows_updated = 0;
    let errors = 0;
    
    // Upsert to database (unless dry_run)
    if (!dry_run) {
      console.log(`Upserting ${deduplicatedModels.length} models to database...`);
      
      try {
        const { data, error } = await supabase
          .from('motor_models')
          .upsert(deduplicatedModels, { onConflict: 'model_key' });
        
        if (error) {
          console.error('Database upsert error:', error);
          throw error;
        }
        
        rows_created = deduplicatedModels.length;
        console.log(`Successfully upserted ${rows_created} motor models`);
        
      } catch (error) {
        console.error('Upsert failed:', error);
        errors = 1;
        throw error;
      }
    }
    
    // Prepare sample data (first 3 items)
    const sample = deduplicatedModels.slice(0, 3).map(m => ({
      model_display: m.model,
      model_key: m.model_key,
      dealer_price: m.dealer_price,
      msrp: m.msrp,
      family: m.family,
      horsepower: m.horsepower,
      fuel: m.fuel_type,
      rigging_code: m.rigging_code
    }));
    
    return new Response(JSON.stringify({
      success: true,
      rows_parsed: rawData.length,
      rows_created,
      rows_updated,
      errors,
      checksum,
      skipped_due_to_same_checksum: false,
      artifacts,
      sample
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in seed-from-pricelist:', error);
    
    const errorResponse = {
      success: false,
      error: error.message,
      context: {
        step: 'unknown',
        detail: String(error)
      }
    };
    
    // Determine which step failed
    if (error.message.includes('HTTP')) {
      errorResponse.context.step = 'fetch';
    } else if (error.message.includes('parse') || error.message.includes('HTML')) {
      errorResponse.context.step = 'parse';
    } else if (error.message.includes('upsert') || error.message.includes('database')) {
      errorResponse.context.step = 'upsert';
    } else if (error.message.includes('storage') || error.message.includes('artifact')) {
      errorResponse.context.step = 'storage';
    }
    
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
