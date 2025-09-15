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

// Enhanced model parsing with more specific key generation
function parseModelFromText(modelDisplay: string = '', modelNumber: string = '') {
  const cleanedText = cleanText(modelDisplay + ' ' + modelNumber);
  
  // Extract horsepower with more precision
  const hpMatch = cleanedText.match(/(\d+(?:\.\d+)?)\s*hp/i);
  const horsepower = hpMatch ? Number(hpMatch[1]) : null;
  
  // Extract family with better pattern matching
  let family = '';
  if (/four\s*stroke|fourstroke/i.test(cleanedText)) family = 'FourStroke';
  else if (/pro\s*xs|proxs/i.test(cleanedText)) family = 'ProXS';
  else if (/sea\s*pro|seapro/i.test(cleanedText)) family = 'SeaPro';
  else if (/verado/i.test(cleanedText)) family = 'Verado';
  else if (/racing/i.test(cleanedText)) family = 'Racing';
  
  // Extract rigging/control codes with comprehensive pattern
  const codeTokens: string[] = [];
  const codePattern = /\b(ELHPT|ELPT|ELO|ELH|EH|XL|XXL|EXLPT|L|CL|CT|DTS|TILLER|JPO|DIGITAL|POWER\s*STEERING)\b/gi;
  let match;
  while ((match = codePattern.exec(cleanedText)) !== null) {
    const token = match[1].replace(/\s+/g, '').toUpperCase();
    if (!codeTokens.includes(token)) {
      codeTokens.push(token);
    }
  }
  
  // Check for EFI presence
  const hasEFI = /\befi\b/i.test(cleanedText);
  
  return {
    family: family || 'FourStroke', // Default family
    horsepower: horsepower || 0,
    fuel: hasEFI ? 'EFI' : '',
    rigging_code: codeTokens.join(' '),
    code_tokens: codeTokens
  };
}

// Improved model key builder with more specific logic
function buildEnhancedModelKey(modelDisplay: string, modelNumber: string, attrs: any): string {
  const parts: string[] = [];
  
  // Add family (required)
  if (attrs.family) {
    parts.push(attrs.family.toUpperCase());
  }
  
  // Add horsepower (required if > 0)
  if (attrs.horsepower && attrs.horsepower > 0) {
    parts.push(`${attrs.horsepower}HP`);
  }
  
  // Add fuel type if explicitly mentioned
  if (attrs.fuel) {
    parts.push(attrs.fuel.toUpperCase());
  }
  
  // Add code tokens (if any)
  if (attrs.code_tokens && attrs.code_tokens.length > 0) {
    parts.push(...attrs.code_tokens);
  }
  
  // Add model number suffix for uniqueness if available
  if (modelNumber && modelNumber.length > 0) {
    parts.push(modelNumber.toUpperCase());
  }
  
  const key = parts.join('-');
  
  // Fallback if key generation failed
  if (!key || key === '') {
    const fallback = cleanText(modelDisplay + ' ' + modelNumber)
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return fallback || 'UNKNOWN-MODEL';
  }
  
  return key;
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

// Enhanced HTML parser with better column detection and flexibility
function parseHTML(html: string): Array<{model_display: string, model_number?: string, horsepower?: number, family?: string, dealer_price?: number}> {
  const $ = load(html);
  let results: any[] = [];
  
  console.log(`[PriceList] Parsing HTML tables...`);
  
  // Find all tables and rank them by size and content relevance
  const tables: Array<{element: any, score: number, rows: number, cells: number}> = [];
  
  $('table').each((tableIdx, table) => {
    const $table = $(table);
    const tableText = $table.text().toLowerCase();
    const rows = $table.find('tr').length;
    const cells = $table.find('td, th').length;
    
    let score = 0;
    
    // Score based on content relevance
    if (tableText.includes('mercury')) score += 10;
    if (tableText.includes('price')) score += 10;
    if (tableText.includes('hp')) score += 5;
    if (tableText.includes('fourstroke') || tableText.includes('verado')) score += 5;
    if (tableText.includes('dealer')) score += 3;
    
    // Score based on size (more rows = more likely to be the main table)
    score += Math.min(rows * 0.5, 20);
    score += Math.min(cells * 0.1, 10);
    
    // Penalty for very small tables
    if (rows < 3) score -= 5;
    if (cells < 6) score -= 3;
    
    tables.push({ element: table, score, rows, cells });
  });
  
  // Sort by score (highest first)
  tables.sort((a, b) => b.score - a.score);
  
  console.log(`[PriceList] Found ${tables.length} tables, top scores:`, 
    tables.slice(0, 3).map(t => `${t.score} (${t.rows}r×${t.cells}c)`));
  
  // Process tables in score order until we find good data
  for (const tableInfo of tables) {
    const $table = $(tableInfo.element);
    const tableResults: any[] = [];
    
    console.log(`[PriceList] Processing table with score ${tableInfo.score}`);
    
    // Try to detect column headers first
    const headerRow = $table.find('tr').first();
    const headerCells = headerRow.find('th, td').toArray().map(cell => cleanText($(cell).text()).toLowerCase());
    
    console.log(`[PriceList] Detected headers:`, headerCells);
    
    // Map column indices based on header content or patterns
    const colMap: Record<string, number> = {};
    headerCells.forEach((header, idx) => {
      if (/model|description|name/.test(header)) colMap.model = idx;
      if (/number|code|sku|part/.test(header)) colMap.model_number = idx;
      if (/hp|horsepower|power/.test(header)) colMap.horsepower = idx;
      if (/family|series|type/.test(header)) colMap.family = idx;
      if (/price|cost|dealer|retail/.test(header)) colMap.price = idx;
    });
    
    console.log(`[PriceList] Column mapping:`, colMap);
    
    // Process table rows (skip header if detected)
    const dataRows = $table.find('tr').slice(headerCells.some(h => /model|price|hp/.test(h)) ? 1 : 0);
    
    dataRows.each((rowIdx, row) => {
      const $row = $(row);
      const cells = $row.find('td, th').toArray().map(cell => cleanText($(cell).text()));
      
      if (cells.length < 2) return;
      
      // Skip obvious header rows even in data
      const cellsText = cells.join(' ').toLowerCase();
      if (/model|description|price|hp|family/.test(cellsText) && cells.every(c => !/\d+/.test(c))) return;
      
      let model_display = '';
      let model_number = '';
      let horsepower: number | null = null;
      let family = '';
      let dealer_price: number | null = null;
      
      // Use column mapping if available, otherwise use pattern detection
      if (Object.keys(colMap).length > 0) {
        if (colMap.model !== undefined && cells[colMap.model]) model_display = cells[colMap.model];
        if (colMap.model_number !== undefined && cells[colMap.model_number]) model_number = cells[colMap.model_number];
        if (colMap.horsepower !== undefined && cells[colMap.horsepower]) {
          const hp = parseFloat(cells[colMap.horsepower]);
          if (!isNaN(hp)) horsepower = hp;
        }
        if (colMap.family !== undefined && cells[colMap.family]) family = cells[colMap.family];
        if (colMap.price !== undefined && cells[colMap.price]) dealer_price = parsePrice(cells[colMap.price]);
      } else {
        // Fallback: pattern-based detection for each cell
        for (const cell of cells) {
          // Pattern: HP detection
          if (!horsepower && /^\d+(\.\d+)?\s*hp$/i.test(cell)) {
            const hp = parseFloat(cell.replace(/hp/i, ''));
            if (!isNaN(hp)) horsepower = hp;
            continue;
          }
          
          // Pattern: Price detection
          if (!dealer_price && /^\$?\s*\d[\d,]*(\.\d{2})?$/.test(cell)) {
            dealer_price = parsePrice(cell);
            continue;
          }
          
          // Pattern: Model number detection (Mercury format: alphanumeric, 4-12 chars)
          if (!model_number && /^[A-Z0-9]{4,12}$/i.test(cell.replace(/\s/g, ''))) {
            model_number = cell.replace(/\s/g, '');
            continue;
          }
          
          // Pattern: Family detection
          if (!family && /\b(Four\s*Stroke|FourStroke|Pro\s*XS|ProXS|Sea\s*Pro|SeaPro|Verado|Racing)\b/i.test(cell)) {
            if (/fourstroke|four\s*stroke/i.test(cell)) family = 'FourStroke';
            else if (/prox|pro\s*xs/i.test(cell)) family = 'ProXS';
            else if (/seapro|sea\s*pro/i.test(cell)) family = 'SeaPro';
            else if (/verado/i.test(cell)) family = 'Verado';
            else if (/racing/i.test(cell)) family = 'Racing';
            continue;
          }
          
          // Pattern: Model description (contains HP and/or motor family terms)
          if (!model_display && (/\d+\s*hp/i.test(cell) || /fourstroke|prox|verado|seapro|racing/i.test(cell))) {
            model_display = cell;
            continue;
          }
        }
      }
      
      // Must have at least model description and price to be valid
      if (model_display && dealer_price && dealer_price > 0) {
        tableResults.push({ 
          model_display: model_display.trim(),
          model_number: model_number || undefined,
          horsepower: horsepower || undefined,
          family: family || undefined,
          dealer_price 
        });
      }
    });
    
    // If this table produced good results, use them
    if (tableResults.length > 0) {
      results = results.concat(tableResults);
      console.log(`[PriceList] Table produced ${tableResults.length} rows`);
      
      // If we found a substantial amount of data, we're probably done
      if (results.length >= 10) break;
    }
  }
  
  // Fallback: try to parse as plain text if no tables worked
  if (results.length === 0) {
    console.log(`[PriceList] No table data found, trying text fallback...`);
    results = parseTextFallback(html);
  }
  
  console.log(`[PriceList] HTML parsing found ${results.length} rows`);
  return results;
}

// Fallback parser for plain text content
function parseTextFallback(html: string): Array<{model_display: string, model_number?: string, horsepower?: number, family?: string, dealer_price?: number}> {
  const $ = load(html);
  const results: any[] = [];
  
  // Extract text from <pre>, <code>, or plain text
  let textContent = '';
  if ($('pre').length > 0) {
    textContent = $('pre').first().text();
  } else if ($('code').length > 0) {
    textContent = $('code').first().text();
  } else {
    textContent = $.text();
  }
  
  // Split into lines and look for motor data
  const lines = textContent.split('\n').map(line => cleanText(line)).filter(line => line.length > 10);
  
  for (const line of lines) {
    // Skip obvious headers
    if (/model|name|description|price|hp/i.test(line) && line.length < 50) continue;
    
    // Look for lines that contain both motor info and price
    if (/\d+\s*hp/i.test(line) && /\$?\d+[\d,]*/.test(line)) {
      const hpMatch = line.match(/(\d+(?:\.\d+)?)\s*hp/i);
      const priceMatch = line.match(/\$?(\d+[\d,]*(?:\.\d{2})?)/);
      
      if (hpMatch && priceMatch) {
        const horsepower = parseFloat(hpMatch[1]);
        const dealer_price = parsePrice(priceMatch[1]);
        
        if (dealer_price && dealer_price > 100) {
          let family = '';
          if (/fourstroke/i.test(line)) family = 'FourStroke';
          else if (/prox/i.test(line)) family = 'ProXS';
          else if (/seapro/i.test(line)) family = 'SeaPro';
          else if (/verado/i.test(line)) family = 'Verado';
          else if (/racing/i.test(line)) family = 'Racing';
          
          results.push({
            model_display: line.trim(),
            horsepower,
            family: family || undefined,
            dealer_price
          });
        }
      }
    }
  }
  
  console.log(`[PriceList] Text fallback found ${results.length} rows`);
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
      html_snapshot_url = null,
      dry_run = false, 
      msrp_markup = 1.10, 
      force = false,
      create_missing_brochure = true,
      csv_content = null,
      html_content = null,
      parse_mode = 'auto'
    } = await req.json();
    
    console.log(`[PriceList] Starting price list ingest. dry_run=${dry_run}, create_brochure=${create_missing_brochure}, msrp_markup=${msrp_markup}, parse_mode=${parse_mode}`);
    
    let html = '';
    let checksum = '';
    let contentSource = 'url';
    let htmlSnapshot = '';
    let tableRows = 0;
    let tableCells = 0;
    let sourceKind = 'raw_csv';
    
    // STEP 1: Get content (URL fetch, CSV, HTML, or snapshot)
    currentStep = 'fetch';
    
    if (html_snapshot_url) {
      console.log(`[PriceList] Using HTML snapshot from: ${html_snapshot_url}`);
      const response = await fetch(html_snapshot_url);
      if (!response.ok) {
        throw new Error(`Failed to fetch snapshot: ${response.status}`);
      }
      html = await response.text();
      htmlSnapshot = html;
      contentSource = 'snapshot';
      sourceKind = 'html_table';
      checksum = await generateChecksum(html);
    } else if (csv_content) {
      console.log(`[PriceList] Using provided CSV content (${csv_content.length} chars)`);
      html = csv_content;
      contentSource = 'csv';
      sourceKind = 'raw_csv';
      checksum = await generateChecksum(csv_content);
    } else if (html_content) {
      console.log(`[PriceList] Using provided HTML content (${html_content.length} chars)`);
      html = html_content;
      htmlSnapshot = html_content;
      contentSource = 'html';
      sourceKind = 'html_table';
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
      htmlSnapshot = html;
      contentSource = 'url';
      checksum = await generateChecksum(html);
      
      // For URL fetching with parse_mode:'auto', determine source kind
      if (parse_mode === 'auto') {
        const $ = load(html);
        const tables = $('table');
        if (tables.length > 0) {
          sourceKind = 'html_table';
          // Count table statistics
          tables.each((idx, table) => {
            const $table = $(table);
            tableRows += $table.find('tr').length;
            tableCells += $table.find('td, th').length;
          });
        } else {
          sourceKind = 'html_text';
        }
      } else {
        sourceKind = 'html_table';
      }
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
    const skipReasons: Record<string, number> = {};
    let rows_skipped_blank = 0;
    let rows_missing_required = 0;
    
    console.log(`[PriceList] DEBUG: Starting normalization of ${rawData.length} raw rows`);
    
    // Show first 3 raw rows for debugging
    if (rawData.length > 0) {
      console.log(`[PriceList] DEBUG: First 3 raw rows:`, rawData.slice(0, 3));
    }
    
    for (let i = 0; i < rawData.length; i++) {
      const r = rawData[i];
      
      // Skip completely blank rows
      if (!r.model_display && !r.model_number) {
        rows_skipped_blank++;
        skipReasons['blank_row'] = (skipReasons['blank_row'] || 0) + 1;
        continue;
      }
      
      const cleaned_model_display = cleanText(r.model_display || '');
      const model_number = cleanText(r.model_number || '');
      
      // Parse attributes with enhanced logic
      const attrs = parseModelFromText(cleaned_model_display, model_number);
      
      // Build enhanced model_key for better uniqueness
      const model_key = buildEnhancedModelKey(cleaned_model_display, model_number, attrs);
      
      // Debug logging for first 12 rows
      if (i < 12) {
        const debugRow = {
          raw_cells: [r.model_display, r.model_number, String(r.dealer_price)],
          family: attrs.family,
          horsepower: attrs.horsepower,
          code_tokens: attrs.code_tokens,
          dealer_price_raw: String(r.dealer_price),
          dealer_price_num: parsePrice(String(r.dealer_price || '')),
          msrp: msrpFromDealer(parsePrice(String(r.dealer_price || '')), msrp_markup),
          model_key
        };
        
        // Highlight M-codes in debug output
        const hasMCodes = attrs.code_tokens.some(c => c.match(/^M/));
        if (hasMCodes) {
          const mCodes = attrs.code_tokens.filter(c => c.match(/^M/));
          console.log(`[PriceList] DEBUG Row ${i + 1} *** M-CODE DETECTED: ${mCodes.join(', ')} ***:`, debugRow);
        } else {
          console.log(`[PriceList] DEBUG Row ${i + 1}:`, debugRow);
        }
      }
      
      // Track detailed errors with line numbers - but be more permissive
      if (!model_key || model_key.trim() === '') {
        console.log(`[PriceList] DEBUG: Skipping row ${i + 1} - invalid model_key. Raw: "${r.model_display}", cleaned: "${cleaned_model_display}"`);
        rowErrors.push({ 
          line: i + 1,
          raw_model: r.model_display,
          model_key: '',
          dealer_price_raw: String(r.dealer_price),
          reason: 'invalid_key'
        });
        rows_missing_required++;
        skipReasons['invalid_model_key'] = (skipReasons['invalid_model_key'] || 0) + 1;
        continue;
      }
      
      const dealer_price = parsePrice(String(r.dealer_price || ''));
      if (!dealer_price || dealer_price <= 0) {
        console.log(`[PriceList] DEBUG: Skipping row ${i + 1} - invalid price. Raw: "${r.dealer_price}", parsed: ${dealer_price}`);
        rowErrors.push({ 
          line: i + 1,
          raw_model: r.model_display,
          model_key,
          dealer_price_raw: String(r.dealer_price),
          reason: 'invalid_price'
        });
        rows_missing_required++;
        skipReasons['invalid_price'] = (skipReasons['invalid_price'] || 0) + 1;
        continue;
      }
      
      // Track duplicates within feed but don't skip them yet
      if (seenModelKeys.has(model_key)) {
        duplicatesInFeed.push(model_key);
        skipReasons['duplicate_model_key'] = (skipReasons['duplicate_model_key'] || 0) + 1;
        console.log(`[PriceList] DEBUG: Duplicate model_key found: ${model_key} (will be deduplicated later)`);
      } else {
        seenModelKeys.add(model_key);
      }
      
      const msrp = msrpFromDealer(dealer_price, msrp_markup);
      
      // Build the row object for upsert - comprehensive model data
      const row: any = {
        make: 'Mercury',
        model: cleaned_model_display || `${attrs.family} ${attrs.horsepower}HP ${attrs.fuel} ${attrs.rigging_code}`.trim(),
        model_key,
        mercury_model_no: model_number || null,
        year: 2025,
        motor_type: attrs.family,
        family: attrs.family,
        horsepower: attrs.horsepower,
        fuel_type: attrs.fuel,
        model_code: attrs.rigging_code,
        dealer_price,
        msrp,
        price_source: 'pricelist',
        msrp_calc_source: 'markup',
        msrp_source: `derived:+${Math.round((msrp_markup - 1) * 100)}%`,
        last_scraped: new Date().toISOString(),
        inventory_source: 'pricelist',
        catalog_source_url: url,
        catalog_snapshot_url: html_snapshot_url
      };
      
      // Only create brochure entries if requested (default true)
      if (create_missing_brochure) {
        row.is_brochure = true;
        row.in_stock = false;
        row.availability = 'Brochure';
      }
      
      rows.push(row);
    }
    
    console.log(`[PriceList] DEBUG: Parsed ${rows.length} valid rows from ${rawData.length} raw rows`);
    console.log(`[PriceList] DEBUG: Skip reasons:`, skipReasons);
    
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
    
    console.log(`[PriceList] DEBUG: Found ${keyGroups.size} unique model_keys from ${rows.length} rows`);
    
    // Show some examples of grouped keys
    const keyExamples = Array.from(keyGroups.entries()).slice(0, 5);
    for (const [key, group] of keyExamples) {
      console.log(`[PriceList] DEBUG: Key "${key}" has ${group.length} rows:`, group.map(g => g.model));
    }
    
    // Pick best representative for each key (prefer model_number, then higher HP, then more detailed model name)
    const deduplicatedModels = Array.from(keyGroups.values()).map(group => {
      if (group.length === 1) return group[0];
      
      const sorted = group.sort((a, b) => {
        // Prefer models with model_number
        if (a.model_number && !b.model_number) return -1;
        if (!a.model_number && b.model_number) return 1;
        if (a.horsepower !== b.horsepower) return (b.horsepower || 0) - (a.horsepower || 0);
        return b.model.length - a.model.length;
      });
      
      console.log(`[PriceList] DEBUG: Deduplicating key "${group[0].model_key}": chose "${sorted[0].model}" from ${group.length} options`);
      return sorted[0];
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
      html_url: await saveArtifact(supabase, `pricelist/${timestamp}-${checksumPrefix}.html`, htmlSnapshot || html, 'text/html'),
      json_url: await saveArtifact(supabase, `pricelist/${timestamp}-${checksumPrefix}.json`, jsonContent, 'application/json'),
      csv_url: await saveArtifact(supabase, `pricelist/${timestamp}-${checksumPrefix}.csv`, csvContent, 'text/csv'),
      html_snapshot_url: htmlSnapshot ? await saveArtifact(supabase, `pricelist/${timestamp}-snapshot.html`, htmlSnapshot, 'text/html') : null
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
    
    // Build detailed response with comprehensive debugging info
    const rejectReasons = rowErrors.slice(0, 20).map(err => `Line ${err.line}: ${err.reason} (${err.raw_model})`);
    const topSkipReasons = Object.entries(skipReasons)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([reason, count]) => `${reason}: ${count}`);
    
    // Enhanced sample models with comprehensive debug info  
    const enhancedSamples = deduplicatedModels.slice(0, 10).map(m => ({
      model: m.model,
      model_number: m.mercury_model_no || '',
      model_key: m.model_key,
      family: m.family,
      horsepower: m.horsepower,
      fuel_type: m.fuel_type,
      model_code: m.model_code,
      dealer_price: m.dealer_price,
      msrp: m.msrp,
      is_brochure: m.is_brochure,
      in_stock: m.in_stock
    }));
    
    // Create sample skipped rows for debugging
    const sampleSkipped = rowErrors.slice(0, 10).map(err => ({
      line: err.line,
      reason: err.reason,
      raw_model: err.raw_model,
      model_key: err.model_key,
      dealer_price_raw: err.dealer_price_raw
    }));
    
    return json200({
      success: true,
      content_source: contentSource,
      source_kind: sourceKind,
      table_rows: tableRows,
      table_cells: tableCells,
      html_snapshot_url: artifacts.html_snapshot_url,
      
      // Detailed counts
      rows_found_raw: rows_found,
      rows_parsed: rows.length,
      rows_normalized,
      rows_created,
      rows_updated,
      rows_skipped_total: Object.values(skipReasons).reduce((a, b) => a + b, 0),
      rows_skipped_by_reason: skipReasons,
      top_skip_reasons: topSkipReasons,
      
      // Legacy fields for compatibility
      rows_parsed_total: rows_found,
      rows_with_invalid_key,
      rows_with_invalid_price,
      rows_skipped_blank,
      rows_missing_required,
      rows_rejected: rowErrors.length,
      reject_reasons: rejectReasons,
      duplicates_in_feed: duplicatesInFeed.length,
      rows_matched_existing,
      rows_skipped,
      
      // Debug info
      unique_model_keys: keyGroups.size,
      rowErrors: rowErrors.slice(0, 50),
      rowMatches: rowMatches.slice(0, 50),
      checksum,
      skipped_due_to_same_checksum: false,
      artifacts,
      sample_models: enhancedSamples,
      sample_created: enhancedSamples,
      sample_skipped: sampleSkipped
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
