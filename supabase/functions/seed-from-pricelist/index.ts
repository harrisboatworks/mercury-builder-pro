import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { load } from 'https://esm.sh/cheerio@1.0.0-rc.12';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

// Enhanced model key utility with better specificity
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
      upsert: true,
      cacheControl: 'public, max-age=86400'
    });
    
  if (uploadError) {
    console.error('Storage upload error:', uploadError);
    throw new Error(`Failed to save ${filename}: ${uploadError.message}`);
  }
  
  const { data: signedUrl } = await supabase.storage
    .from('sources')
    .createSignedUrl(filename, 60 * 60 * 24 * 7, { download: true }); // 7 days, download by default
    
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

// Helper function for consistent JSON responses
function json200(body: any) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

// Helper to safely convert strings to numbers
function toNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  const cleaned = String(value).replace(/[^0-9.-]/g, '');
  const num = Number(cleaned);
  return isNaN(num) ? null : num;
}

// Helper to calculate MSRP from dealer price
function msrpFromDealer(dealerPrice: number | null, markup: number): number | null {
  if (!dealerPrice || !markup) return null;
  return Math.round(dealerPrice * markup * 100) / 100;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  let currentStep = 'init';
  const rowErrors: any[] = [];
  const supabase = getSupabaseClient();
  
  try {
    const { 
      url = 'https://www.harrisboatworks.ca/mercurypricelist',
      dry_run = false, 
      msrp_markup = 1.10, 
      force = false 
    } = await req.json();
    
    console.log(`Starting price list ingest from: ${url}`);
    
    // STEP 1: Fetch HTML
    currentStep = 'fetch';
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
    
    // Check if content unchanged (unless force=true)
    if (!force) {
      const { data: recentSnapshots } = await supabase.storage
        .from('sources')
        .list('pricelist', { limit: 10, sortBy: { column: 'created_at', order: 'desc' } });
        
      if (recentSnapshots) {
        for (const file of recentSnapshots) {
          if (file.name.includes(checksum.substring(0, 8))) {
            console.log(`Skipping - content unchanged (checksum match)`);
            return json200({
              success: true,
              skipped_due_to_same_checksum: true,
              checksum,
              rows_parsed: 0,
              rows_created: 0,
              rows_updated: 0,
              errors: 0
            });
          }
        }
      }
    }
    
    // STEP 2: Parse HTML tables
    currentStep = 'parse';
    console.log('Parsing HTML tables...');
    const rawData = parseHtml(html);
    console.log(`Parsed ${rawData.length} raw entries`);
    
    if (rawData.length === 0) {
      throw new Error('No valid price data found in HTML tables');
    }
    
    // STEP 3: Normalize data and build model objects
    currentStep = 'normalize';
    const rows: any[] = [];
    
    for (const r of rawData) {
      const attrs = parseModelFromText(r.model_display);
      const model_key = buildModelKey(r.model_display);
      
      // Skip rows with invalid model_key
      if (!model_key || model_key.trim() === '') {
        rowErrors.push({ 
          reason: 'missing_model_key', 
          raw: { model_display: r.model_display, dealer_price: r.dealer_price }
        });
        continue;
      }
      
      const dealer_price = toNumber(r.dealer_price);
      if (!dealer_price || dealer_price <= 0) {
        rowErrors.push({ 
          reason: 'invalid_price', 
          raw: { model_display: r.model_display, dealer_price: r.dealer_price }
        });
        continue;
      }
      
      const msrp = msrpFromDealer(dealer_price, msrp_markup);
      
      // Build the row object for upsert defensively
      const row: any = {
        make: 'Mercury',
        model: r.model_display,
        model_key,
        year: 2025,
        motor_type: attrs.family,
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
      
      // Include optional fields only if present
      if (attrs.family) row.family = attrs.family;
      if (attrs.horsepower) row.horsepower = attrs.horsepower;
      if (attrs.fuel) row.fuel_type = attrs.fuel;
      if (attrs.rigging_code) row.rigging_code = attrs.rigging_code;
      
      rows.push(row);
    }
    
    console.log(`Processed ${rawData.length} raw entries into ${rows.length} valid rows, ${rowErrors.length} errors`);
    
    // Deduplication logic: Group by model_key and pick best row for each key
    const keyGroups = new Map<string, any[]>();
    
    for (const model of rows) {
      if (!keyGroups.has(model.model_key)) {
        keyGroups.set(model.model_key, []);
      }
      keyGroups.get(model.model_key)!.push(model);
    }
    
    // Pick best representative for each key (prefer higher HP, then more detailed model name)
    const deduplicatedModels = Array.from(keyGroups.values()).map(group => {
      if (group.length === 1) return group[0];
      
      return group.sort((a, b) => {
        if (a.horsepower !== b.horsepower) return (b.horsepower || 0) - (a.horsepower || 0);
        return b.model.length - a.model.length;
      })[0];
    });
    
    console.log(`Deduplicated to ${deduplicatedModels.length} models`);
    
    // STEP 4: Save artifacts (always, even on future failure)
    currentStep = 'snapshot';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const checksumPrefix = checksum.substring(0, 8);
    
    // Prepare artifacts
    const jsonContent = JSON.stringify(deduplicatedModels, null, 2);
    const csvRows = [
      'model_display,model_key,family,horsepower,fuel,rigging_code,year,dealer_price,msrp,is_brochure,in_stock,price_source',
      ...deduplicatedModels.map(m => 
        `"${m.model}","${m.model_key}","${m.family || ''}",${m.horsepower || ''},"${m.fuel_type || ''}","${m.rigging_code || ''}",${m.year},${m.dealer_price},${m.msrp},${m.is_brochure},${m.in_stock},"${m.price_source || ''}"`
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
    
    // Prune old snapshots
    try {
      console.log('Pruning old pricelist snapshots...');
      const { data: allFiles, error: listError } = await supabase.storage
        .from('sources')
        .list('pricelist', { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } });
        
      if (listError) {
        console.error('Error listing files for pruning:', listError);
      } else if (allFiles && allFiles.length > 30) {
        const filesToDelete = allFiles.slice(30);
        const deletePromises = filesToDelete.map(file => 
          supabase.storage.from('sources').remove([`pricelist/${file.name}`])
        );
        
        await Promise.allSettled(deletePromises);
        console.log(`Pruned ${filesToDelete.length} old pricelist files`);
      }
    } catch (pruneError) {
      console.error('Error during snapshot pruning:', pruneError);
    }
    
    let rows_created = 0;
    let rows_updated = 0;
    
    // STEP 5: Database upsert (unless dry_run)
    if (!dry_run) {
      currentStep = 'upsert';
      console.log(`Upserting ${deduplicatedModels.length} models to database...`);
      
      // Fetch existing records to preserve inventory data
      const modelKeys = deduplicatedModels.map(m => m.model_key);
      const { data: existingRecords, error: fetchError } = await supabase
        .from('motor_models')
        .select('model_key, in_stock, image_url, stock_quantity, availability, last_stock_check')
        .in('model_key', modelKeys);
        
      if (fetchError) {
        throw new Error(`fetch_existing_failed: ${fetchError.message}`);
      }
      
      // Create lookup map for existing records
      const existingMap = new Map();
      existingRecords?.forEach(record => {
        existingMap.set(record.model_key, record);
      });
      
      // Prepare models for upsert with preserved inventory data
      const modelsForUpsert = deduplicatedModels.map(newModel => {
        const existing = existingMap.get(newModel.model_key);
        if (existing) {
          // Preserve inventory fields for existing records
          return {
            ...newModel,
            in_stock: existing.in_stock, // Never flip this
            image_url: existing.image_url || newModel.image_url,
            stock_quantity: existing.stock_quantity,
            availability: existing.availability,
            last_stock_check: existing.last_stock_check,
          };
        }
        return newModel; // New record, use as-is
      });
      
      const { error: upsertError } = await supabase
        .from('motor_models')
        .upsert(modelsForUpsert, { onConflict: 'model_key' });
      
      if (upsertError) {
        throw new Error(`upsert_failed: ${upsertError.message}`);
      }
      
      // Count creates vs updates
      rows_created = modelsForUpsert.filter(m => !existingMap.has(m.model_key)).length;
      rows_updated = modelsForUpsert.filter(m => existingMap.has(m.model_key)).length;
      
      console.log(`Successfully processed ${rows_created} creates, ${rows_updated} updates`);
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
    
    return json200({
      success: true,
      rows_parsed: rawData.length,
      rows_created,
      rows_updated,
      errors: rowErrors.length,
      row_errors: rowErrors.slice(0, 5), // Show first 5 errors
      checksum,
      skipped_due_to_same_checksum: false,
      artifacts,
      sample
    });
    
  } catch (error: any) {
    console.error('seed-from-pricelist failed:', error);
    
    // Try to save artifacts even on failure for debugging
    let debugArtifacts = null;
    try {
      if (currentStep !== 'init') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const errorLog = {
          step: currentStep,
          error: {
            message: error?.message || String(error),
            stack: error?.stack,
            name: error?.name
          },
          rowErrors: rowErrors.slice(0, 10)
        };
        
        const errorLogUrl = await saveArtifact(
          supabase, 
          `pricelist/${timestamp}-ERROR.json`, 
          JSON.stringify(errorLog, null, 2), 
          'application/json'
        );
        
        debugArtifacts = { error_log_url: errorLogUrl };
      }
    } catch (artifactError) {
      console.error('Failed to save debug artifacts:', artifactError);
    }
    
    return json200({
      success: false,
      step: currentStep,
      error: {
        message: error?.message || String(error),
        stack: error?.stack,
        name: error?.name,
        cause: error?.cause,
      },
      artifacts: debugArtifacts,
      row_errors: rowErrors.slice(0, 5)
    });
  }
});
