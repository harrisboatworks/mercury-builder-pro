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
      create_missing_brochure = true
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
    const duplicatesInFeed: string[] = [];
    const seenModelKeys = new Set<string>();
    
    for (let i = 0; i < rawData.length; i++) {
      const r = rawData[i];
      const cleaned_model_display = cleanText(r.model_display);
      const attrs = parseModelFromText(cleaned_model_display);
      const model_key = buildModelKey(cleaned_model_display);
      
      // Track detailed errors with line numbers
      if (!model_key || model_key.trim() === '') {
        rowErrors.push({ 
          line: i + 1,
          raw_model: r.model_display,
          model_key: '',
          dealer_price_raw: String(r.dealer_price),
          reason: 'invalid_key'
        });
        continue;
      }
      
      const dealer_price = parsePrice(String(r.dealer_price));
      if (!dealer_price || dealer_price <= 0) {
        rowErrors.push({ 
          line: i + 1,
          raw_model: r.model_display,
          model_key,
          dealer_price_raw: String(r.dealer_price),
          reason: 'invalid_price'
        });
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
        model: cleaned_model_display,
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
    
    console.log(`Processed ${rawData.length} raw entries into ${rows_normalized} valid rows, ${rowErrors.length} errors`);
    
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
    let rows_matched_existing = 0;
    let rows_skipped = 0;
    const rowMatches: any[] = [];
    
    // STEP 5: Database upsert (unless dry_run)
    if (!dry_run) {
      currentStep = 'upsert';
      console.log(`Upserting ${deduplicatedModels.length} models to database...`);
      
      // Fetch existing records to preserve inventory data
      const modelKeys = deduplicatedModels.map(m => m.model_key);
      const { data: existingRecords, error: fetchError } = await supabase
        .from('motor_models')
        .select('model_key, in_stock, image_url, stock_quantity, availability, last_stock_check, dealer_price, msrp')
        .in('model_key', modelKeys);
        
      if (fetchError) {
        throw new Error(`fetch_existing_failed: ${fetchError.message}`);
      }
      
      // Create lookup map for existing records
      const existingMap = new Map();
      existingRecords?.forEach(record => {
        existingMap.set(record.model_key, record);
      });
      
      rows_matched_existing = existingRecords?.length || 0;
      
      // Prepare models for upsert with preserved inventory data
      const modelsForUpsert = deduplicatedModels.map(newModel => {
        const existing = existingMap.get(newModel.model_key);
        const changedFields: string[] = [];
        
        if (existing) {
          // Track what changed
          if (existing.dealer_price !== newModel.dealer_price) changedFields.push('dealer_price');
          if (existing.msrp !== newModel.msrp) changedFields.push('msrp');
          
          const updatedModel = {
            ...newModel,
            in_stock: existing.in_stock, // Never flip this
            image_url: existing.image_url || newModel.image_url,
            stock_quantity: existing.stock_quantity,
            availability: existing.availability || newModel.availability,
            last_stock_check: existing.last_stock_check,
          };
          
          rowMatches.push({
            model_key: newModel.model_key,
            action: changedFields.length > 0 ? 'updated' : 'unchanged',
            changed_fields: changedFields
          });
          
          return updatedModel;
        } else {
          rowMatches.push({
            model_key: newModel.model_key,
            action: 'created',
            changed_fields: ['*']
          });
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
      rows_updated = rowMatches.filter(m => m.action === 'updated').length;
      rows_skipped = rowMatches.filter(m => m.action === 'unchanged').length;
      
      console.log(`Successfully processed ${rows_created} creates, ${rows_updated} updates`);
    } else {
      // For dry run, simulate the matching logic
      const modelKeys = deduplicatedModels.map(m => m.model_key);
      const { data: existingRecords } = await supabase
        .from('motor_models')
        .select('model_key')
        .in('model_key', modelKeys);
        
      const existingKeys = new Set(existingRecords?.map(r => r.model_key) || []);
      rows_matched_existing = existingKeys.size;
      rows_created = deduplicatedModels.length - rows_matched_existing;
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
      rows_normalized,
      rows_with_invalid_key,
      rows_with_invalid_price,
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
