import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { load } from 'https://esm.sh/cheerio@1.0.0-rc.12';

// Import shared motor helpers for consistent model key generation
import { buildModelKey, extractHpAndCode } from '../_shared/motor-helpers.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

// Enhanced text cleaning for messy HTML formatting
function cleanText(text: string): string {
  if (!text) return '';
  
  return text
    // Clean NBSP characters
    .replace(/\u00a0/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    // Clean weird quotes and dashes  
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    // Clean HTML entities
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

// Enhanced price parsing for various formats
function parsePrice(priceText: string): number | null {
  if (!priceText) return null;
  
  const cleaned = cleanText(priceText)
    .replace(/[$,\s]/g, '')  // Remove $ , and spaces
    .replace(/[^\d.]/g, ''); // Keep only digits and dots
    
  if (!cleaned) return null;
  
  const price = Number(cleaned);
  
  // Reasonable price range validation
  if (isNaN(price) || price <= 0 || price > 1000000) {
    return null;
  }
  
  return price;
}

// Parse model attributes from display string using shared helper
function parseModelFromText(modelDisplay: string = '') {
  const cleanedText = cleanText(modelDisplay);
  const parsed = extractHpAndCode(cleanedText);
  
  return {
    family: parsed.family || 'FourStroke',
    horsepower: parsed.hp,
    fuel: parsed.fuel || 'EFI',
    rigging_code: parsed.code
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

// Enhanced CSV parser
function parseCSV(csvContent: string): Array<{model_display: string, model_number?: string, horsepower?: number, family?: string, dealer_price?: number}> {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  const header = lines[0].toLowerCase();
  const results: any[] = [];
  
  // Try to identify column indices
  const cols = header.split(',').map(h => cleanText(h.replace(/['"]/g, '')));
  const modelCol = cols.findIndex(col => /model|name|description/i.test(col));
  const numberCol = cols.findIndex(col => /number|code|sku/i.test(col));
  const hpCol = cols.findIndex(col => /hp|horsepower|power/i.test(col));
  const familyCol = cols.findIndex(col => /family|type|series/i.test(col));
  const priceCol = cols.findIndex(col => /price|cost|dealer/i.test(col));
  
  console.log(`[PriceList] CSV columns detected: model=${modelCol}, number=${numberCol}, hp=${hpCol}, family=${familyCol}, price=${priceCol}`);
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => cleanText(v.replace(/['"]/g, '')));
    if (values.length < 2) continue;
    
    const row: any = {};
    if (modelCol >= 0 && values[modelCol]) row.model_display = values[modelCol];
    if (numberCol >= 0 && values[numberCol]) row.model_number = values[numberCol];
    if (hpCol >= 0 && values[hpCol]) row.horsepower = parseFloat(values[hpCol]) || null;
    if (familyCol >= 0 && values[familyCol]) row.family = values[familyCol];
    if (priceCol >= 0 && values[priceCol]) row.dealer_price = parsePrice(values[priceCol]);
    
    if (row.model_display || row.model_number) {
      results.push(row);
    }
  }
  
  return results;
}

// Enhanced HTML parser for Mercury models
function parseHTML(html: string): Array<{model_display: string, model_number?: string, horsepower?: number, family?: string, dealer_price?: number}> {
  const $ = load(html);
  const results: any[] = [];
  
  console.log(`[PriceList] Parsing HTML tables...`);
  
  // Find all tables and process them
  $('table').each((tableIdx, table) => {
    const $table = $(table);
    
    // Skip if doesn't look like a price table
    const tableText = $table.text().toLowerCase();
    if (!tableText.includes('mercury') && !tableText.includes('price') && !tableText.includes('hp')) {
      return;
    }
    
    console.log(`[PriceList] Processing table ${tableIdx + 1}`);
    
    // Process table rows
    $table.find('tr').each((rowIdx, row) => {
      const $row = $(row);
      const cells = $row.find('td, th').toArray().map(cell => cleanText($(cell).text()));
      
      if (cells.length < 2) return;
      
      // Skip header rows
      const cellsText = cells.join(' ').toLowerCase();
      if (/model|name|description|price|hp/i.test(cellsText) && rowIdx < 3) return;
      
      // Look for model and price in any combination of columns
      let model_display = '';
      let model_number = '';
      let horsepower: number | null = null;
      let family = '';
      let dealer_price: number | null = null;
      
      for (const cell of cells) {
        // Check if this looks like a model name (contains HP or motor family)
        if (!model_display && (/\d+\s*hp/i.test(cell) || /fourstroke|prox|verado|seapro|racing/i.test(cell))) {
          model_display = cell;
          
          // Try to extract horsepower
          const hpMatch = cell.match(/(\d+(?:\.\d+)?)\s*hp/i);
          if (hpMatch) horsepower = parseFloat(hpMatch[1]);
          
          // Try to extract family
          if (/fourstroke/i.test(cell)) family = 'FourStroke';
          else if (/prox/i.test(cell)) family = 'ProXS';
          else if (/seapro/i.test(cell)) family = 'SeaPro';
          else if (/verado/i.test(cell)) family = 'Verado';
          else if (/racing/i.test(cell)) family = 'Racing';
        }
        
        // Check if this looks like a model number (Mercury format)
        if (!model_number && /^[A-Z0-9]{4,12}$/.test(cell.replace(/\s/g, ''))) {
          model_number = cell.replace(/\s/g, '');
        }
        
        // Check if this looks like a price
        if (!dealer_price) {
          const price = parsePrice(cell);
          if (price && price > 100 && price < 1000000) { // Reasonable price range
            dealer_price = price;
          }
        }
      }
      
      if (model_display && dealer_price) {
        results.push({ 
          model_display: model_display.trim(),
          model_number: model_number || undefined,
          horsepower: horsepower || undefined,
          family: family || undefined,
          dealer_price 
        });
      }
    });
  });
  
  console.log(`[PriceList] HTML parsing found ${results.length} rows`);
  return results;
}

// Unified parser that handles both CSV and HTML
function parseContent(content: string, contentType: 'csv' | 'html'): Array<{model_display: string, model_number?: string, horsepower?: number, family?: string, dealer_price?: number}> {
  if (contentType === 'csv') {
    return parseCSV(content);
  } else {
    return parseHTML(content);
  }
}

// Helper function for consistent JSON responses
function json200(body: any) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
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
      force = false,
      create_missing_brochure = true,
      csv_content = null,
      html_content = null
    } = await req.json();
    
    console.log(`[PriceList] Starting price list ingest. dry_run=${dry_run}, create_brochure=${create_missing_brochure}, msrp_markup=${msrp_markup}`);
    
    let html = '';
    let checksum = '';
    let contentSource = 'url';
    
    // STEP 1: Get content (URL fetch, CSV, or HTML)
    currentStep = 'fetch';
    
    if (csv_content) {
      console.log(`[PriceList] Using provided CSV content (${csv_content.length} chars)`);
      html = csv_content;
      contentSource = 'csv';
      checksum = await generateChecksum(csv_content);
    } else if (html_content) {
      console.log(`[PriceList] Using provided HTML content (${html_content.length} chars)`);
      html = html_content;
      contentSource = 'html';
      checksum = await generateChecksum(html_content);
    } else {
      console.log(`[PriceList] Fetching HTML from URL: ${url}`);
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
      
      html = await response.text();
      contentSource = 'url';
      checksum = await generateChecksum(html);
    }
    
    console.log(`[PriceList] Got content: ${html.length} chars, checksum: ${checksum.substring(0, 8)}`);
    
    // Check if content unchanged (unless force=true)
    if (!force && contentSource === 'url') {
      const { data: recentSnapshots } = await supabase.storage
        .from('sources')
        .list('pricelist', { limit: 10, sortBy: { column: 'created_at', order: 'desc' } });
        
      if (recentSnapshots) {
        for (const file of recentSnapshots) {
          if (file.name.includes(checksum.substring(0, 8))) {
            console.log(`[PriceList] Skipping - content unchanged (checksum match)`);
            return json200({
              success: true,
              skipped_due_to_same_checksum: true,
              checksum,
              rows_parsed: 0,
              rows_normalized: 0,
              rows_created: 0,
              rows_updated: 0
            });
          }
        }
      }
    }
    
    // STEP 2: Parse content
    currentStep = 'parse';
    console.log(`[PriceList] Parsing content as ${contentSource}...`);
    
    const rawData = parseContent(html, contentSource === 'csv' ? 'csv' : 'html');
    const rows_found = rawData.length;
    
    console.log(`[PriceList] source=${contentSource.toUpperCase()} rows_found=${rows_found}`);
    if (rows_found > 0) {
      console.log(`[PriceList] example_row=${JSON.stringify(rawData[0])}`);
    }
    
    if (rows_found === 0) {
      throw new Error('No valid price data found in content');
    }
    
    // STEP 3: Normalize data and build model objects
    currentStep = 'normalize';
    const rows: any[] = [];
    const duplicatesInFeed: string[] = [];
    const seenModelKeys = new Set<string>();
    let rows_skipped_blank = 0;
    let rows_missing_required = 0;
    
    for (let i = 0; i < rawData.length; i++) {
      const r = rawData[i];
      
      // Skip completely blank rows
      if (!r.model_display && !r.model_number) {
        rows_skipped_blank++;
        continue;
      }
      
      const cleaned_model_display = cleanText(r.model_display || '');
      const model_number = cleanText(r.model_number || '');
      
      // Parse attributes from model display or use provided data
      const attrs = r.family ? {
        family: r.family,
        horsepower: r.horsepower || null,
        fuel: 'EFI',
        rigging_code: ''
      } : parseModelFromText(cleaned_model_display);
      
      // Build model_key using shared helper
      const model_key = buildModelKey(cleaned_model_display || model_number);
      
      // Track detailed errors with line numbers
      if (!model_key || model_key.trim() === '') {
        rowErrors.push({ 
          line: i + 1,
          raw_model: r.model_display,
          model_key: '',
          dealer_price_raw: String(r.dealer_price),
          reason: 'invalid_key'
        });
        rows_missing_required++;
        continue;
      }
      
      const dealer_price = parsePrice(String(r.dealer_price || ''));
      if (!dealer_price || dealer_price <= 0) {
        rowErrors.push({ 
          line: i + 1,
          raw_model: r.model_display,
          model_key,
          dealer_price_raw: String(r.dealer_price),
          reason: 'invalid_price'
        });
        rows_missing_required++;
        continue;
      }
      
      // Track duplicates within feed
      if (seenModelKeys.has(model_key)) {
        duplicatesInFeed.push(model_key);
      } else {
        seenModelKeys.add(model_key);
      }
      
      const msrp = msrpFromDealer(dealer_price, msrp_markup);
      
      // Build the row object for upsert
      const row: any = {
        make: 'Mercury',
        model: cleaned_model_display || model_number,
        model_key,
        year: 2025,
        motor_type: attrs.family,
        dealer_price,
        msrp,
        msrp_source: `derived:+${Math.round((msrp_markup - 1) * 100)}%`,
        price_source: 'pricelist',
        last_scraped: new Date().toISOString(),
        inventory_source: 'pricelist'
      };
      
      // Add model_number if we have it
      if (model_number) {
        row.model_number = model_number;
      }
      
      // Only create brochure entries if requested (default true)
      if (create_missing_brochure) {
        row.is_brochure = true;
        row.in_stock = false;
        row.availability = 'Brochure';
      }
      
      // Include optional fields only if present
      if (attrs.family) row.family = attrs.family;
      if (attrs.horsepower) row.horsepower = attrs.horsepower;
      if (attrs.fuel) row.fuel_type = attrs.fuel;
      if (attrs.rigging_code) row.rigging_code = attrs.rigging_code;
      
      rows.push(row);
    }
    
    const rows_normalized = rows.length;
    const rows_with_invalid_key = rowErrors.filter(e => e.reason === 'invalid_key').length;
    const rows_with_invalid_price = rowErrors.filter(e => e.reason === 'invalid_price').length;
    
    console.log(`[PriceList] source=${contentSource.toUpperCase()} rows_found=${rows_found} rows_valid=${rows_normalized} created=TBD updated=TBD skipped_blank=${rows_skipped_blank} missing_required=${rows_missing_required}`);
    
    // Deduplication logic: Group by model_key and pick best row for each key
    const keyGroups = new Map<string, any[]>();
    
    for (const model of rows) {
      if (!keyGroups.has(model.model_key)) {
        keyGroups.set(model.model_key, []);
      }
      keyGroups.get(model.model_key)!.push(model);
    }
    
    // Pick best representative for each key (prefer model_number, then higher HP, then more detailed model name)
    const deduplicatedModels = Array.from(keyGroups.values()).map(group => {
      if (group.length === 1) return group[0];
      
      return group.sort((a, b) => {
        // Prefer models with model_number
        if (a.model_number && !b.model_number) return -1;
        if (!a.model_number && b.model_number) return 1;
        if (a.horsepower !== b.horsepower) return (b.horsepower || 0) - (a.horsepower || 0);
        return b.model.length - a.model.length;
      })[0];
    });
    
    console.log(`[PriceList] Deduplicated to ${deduplicatedModels.length} models`);
    
    // STEP 4: Save artifacts (always, even on future failure)
    currentStep = 'snapshot';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const checksumPrefix = checksum.substring(0, 8);
    
    // Prepare artifacts
    const jsonContent = JSON.stringify(deduplicatedModels, null, 2);
    const csvRows = [
      'model_display,model_number,model_key,family,horsepower,fuel,rigging_code,year,dealer_price,msrp,is_brochure,in_stock,price_source',
      ...deduplicatedModels.map(m => 
        `"${m.model}","${m.model_number || ''}","${m.model_key}","${m.family || ''}",${m.horsepower || ''},"${m.fuel_type || ''}","${m.rigging_code || ''}",${m.year},${m.dealer_price},${m.msrp},${m.is_brochure},${m.in_stock},"${m.price_source || ''}"`
      )
    ];
    const csvContent = csvRows.join('\n');
    
    // Save artifacts to storage
    console.log('[PriceList] Saving artifacts to storage...');
    const artifacts = {
      html_url: await saveArtifact(supabase, `pricelist/${timestamp}-${checksumPrefix}.html`, html, 'text/html'),
      json_url: await saveArtifact(supabase, `pricelist/${timestamp}-${checksumPrefix}.json`, jsonContent, 'application/json'),
      csv_url: await saveArtifact(supabase, `pricelist/${timestamp}-${checksumPrefix}.csv`, csvContent, 'text/csv')
    };
    
    // Update admin_sources with the latest URLs
    if (contentSource === 'csv' && artifacts.csv_url) {
      await supabase.from('admin_sources').upsert({ key: 'pricelist_last_csv', value: artifacts.csv_url });
    }
    if (artifacts.html_url) {
      await supabase.from('admin_sources').upsert({ key: 'pricelist_last_html', value: artifacts.html_url });
    }
    
    let rows_created = 0;
    let rows_updated = 0;
    let rows_matched_existing = 0;
    let rows_skipped = 0;
    const rowMatches: any[] = [];
    
    // STEP 5: Database upsert (unless dry_run)
    if (!dry_run) {
      currentStep = 'upsert';
      console.log(`[PriceList] Upserting ${deduplicatedModels.length} models to database...`);
      
      // Fetch existing records to preserve inventory data - use both model_number and model_key lookups
      const modelNumbers = deduplicatedModels.map(m => m.model_number).filter(Boolean);
      const modelKeys = deduplicatedModels.map(m => m.model_key);
      
      let existingRecords: any[] = [];
      
      // Fetch by model_number first (preferred)
      if (modelNumbers.length > 0) {
        const { data: byNumber } = await supabase
          .from('motor_models')
          .select('model_number, model_key, in_stock, image_url, hero_image_url, stock_quantity, availability, last_stock_check, dealer_price, msrp')
          .in('model_number', modelNumbers);
        if (byNumber) existingRecords = existingRecords.concat(byNumber);
      }
      
      // Fetch by model_key for any remaining
      const { data: byKey } = await supabase
        .from('motor_models')
        .select('model_number, model_key, in_stock, image_url, hero_image_url, stock_quantity, availability, last_stock_check, dealer_price, msrp')
        .in('model_key', modelKeys);
      if (byKey) {
        // Only add records not already found by model_number
        const existingNumbers = new Set(existingRecords.map(r => r.model_number).filter(Boolean));
        const existingKeys = new Set(existingRecords.map(r => r.model_key));
        const newByKey = byKey.filter(r => 
          (!r.model_number || !existingNumbers.has(r.model_number)) && 
          !existingKeys.has(r.model_key)
        );
        existingRecords = existingRecords.concat(newByKey);
      }
      
      // Create lookup maps
      const existingByNumber = new Map();
      const existingByKey = new Map();
      existingRecords.forEach(record => {
        if (record.model_number) existingByNumber.set(record.model_number, record);
        existingByKey.set(record.model_key, record);
      });
      
      rows_matched_existing = existingRecords.length;
      
      // Prepare models for upsert with preserved inventory data
      const modelsForUpsert = deduplicatedModels.map(newModel => {
        // Prefer lookup by model_number, fallback to model_key
        const existing = newModel.model_number 
          ? existingByNumber.get(newModel.model_number) || existingByKey.get(newModel.model_key)
          : existingByKey.get(newModel.model_key);
          
        const changedFields: string[] = [];
        
        if (existing) {
          // Track what changed
          if (existing.dealer_price !== newModel.dealer_price) changedFields.push('dealer_price');
          if (existing.msrp !== newModel.msrp) changedFields.push('msrp');
          
          const updatedModel = {
            ...newModel,
            in_stock: existing.in_stock, // Never flip this from XML inventory
            image_url: existing.image_url || newModel.image_url,
            hero_image_url: existing.hero_image_url || newModel.hero_image_url,
            stock_quantity: existing.stock_quantity,
            availability: existing.availability || newModel.availability,
            last_stock_check: existing.last_stock_check,
          };
          
          rowMatches.push({
            model_key: newModel.model_key,
            model_number: newModel.model_number || '',
            action: changedFields.length > 0 ? 'updated' : 'unchanged',
            changed_fields: changedFields
          });
          
          return updatedModel;
        } else {
          rowMatches.push({
            model_key: newModel.model_key,
            model_number: newModel.model_number || '',
            action: 'created',
            changed_fields: ['*']
          });
        }
        
        return newModel; // New record, use as-is
      });
      
      // Use conflict resolution on model_number if available, else model_key
      const { error: upsertError } = await supabase
        .from('motor_models')
        .upsert(modelsForUpsert, { onConflict: 'model_key' }); // We'll handle model_number conflicts in app logic
      
      if (upsertError) {
        throw new Error(`upsert_failed: ${upsertError.message}`);
      }
      
      // Count creates vs updates
      rows_created = rowMatches.filter(m => m.action === 'created').length;
      rows_updated = rowMatches.filter(m => m.action === 'updated').length;
      rows_skipped = rowMatches.filter(m => m.action === 'unchanged').length;
      
      console.log(`[PriceList] source=${contentSource.toUpperCase()} rows_found=${rows_found} rows_valid=${rows_normalized} created=${rows_created} updated=${rows_updated} skipped_blank=${rows_skipped_blank} missing_required=${rows_missing_required}`);
    } else {
      // For dry run, simulate the matching logic
      const modelNumbers = deduplicatedModels.map(m => m.model_number).filter(Boolean);
      const modelKeys = deduplicatedModels.map(m => m.model_key);
      
      let existingCount = 0;
      if (modelNumbers.length > 0) {
        const { data: byNumber } = await supabase
          .from('motor_models')
          .select('model_number, model_key', { count: 'exact' })
          .in('model_number', modelNumbers);
        existingCount += byNumber?.length || 0;
      }
      
      const { data: byKey } = await supabase
        .from('motor_models')
        .select('model_key', { count: 'exact' })
        .in('model_key', modelKeys);
      existingCount += byKey?.length || 0;
      
      rows_matched_existing = existingCount;
      rows_created = Math.max(0, deduplicatedModels.length - existingCount);
    }
    
    // Prepare sample data (first 10 items)
    const sampleModels = deduplicatedModels.slice(0, 10).map(m => ({
      model_display: m.model,
      model_number: m.model_number || '',
      model_key: m.model_key,
      family: m.family,
      horsepower: m.horsepower,
      fuel: m.fuel_type,
      rigging_code: m.rigging_code,
      dealer_price: m.dealer_price,
      msrp: m.msrp
    }));
    
    return json200({
      success: true,
      content_source: contentSource,
      rows_parsed_total: rows_found,
      rows_normalized,
      rows_with_invalid_key,
      rows_with_invalid_price,
      rows_skipped_blank,
      rows_missing_required,
      duplicates_in_feed: duplicatesInFeed.length,
      rows_matched_existing,
      rows_created,
      rows_updated,
      rows_skipped,
      rowErrors: rowErrors.slice(0, 50),
      rowMatches: rowMatches.slice(0, 50),
      checksum,
      skipped_due_to_same_checksum: false,
      artifacts,
      sample_models: sampleModels
    });
    
  } catch (error: any) {
    console.error('[PriceList] seed-from-pricelist failed:', error);
    
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
      console.error('[PriceList] Failed to save debug artifacts:', artifactError);
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
      rowErrors: rowErrors.slice(0, 5)
    });
  }
});
