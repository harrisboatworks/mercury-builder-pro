import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { load } from 'https://esm.sh/cheerio@1.0.0-rc.12'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ParsedMotor {
  model_display: string;
  model_key: string;
  mercury_model_no?: string;
  family?: string;
  horsepower?: number;
  fuel_type?: string;
  model_code?: string;
  dealer_price?: number;
  accessory_notes: string[];
  raw_text?: string;
}

interface SeededResult {
  success: boolean;
  content_source: 'url' | 'html' | 'csv';
  source_kind: 'html_table' | 'html_text' | 'raw_csv';
  html_snapshot_url?: string;
  rows_found_raw: number;
  rows_parsed: number;
  rows_created: number;
  rows_updated: number;
  rows_skipped_total: number;
  rows_skipped_by_reason: Record<string, number>;
  top_skip_reasons: string[];
  sample_created: any[];
  sample_skipped: any[];
  checksum?: string;
  artifacts?: any;
  rowErrors?: string[];
  rowMatches?: string[];
  unique_model_keys?: string[];
}

// Enhanced Mercury rigging code parsing
const RIGGING_CODE_MAP = {
  'E': 'Electric Start',
  'M': 'Manual Start',
  'H': 'Tiller Handle',
  'L': 'Long Shaft 20"',
  'XL': 'Extra Long Shaft 25"',
  'XXL': 'Extra Extra Long Shaft 30"',
  'PT': 'Power Trim',
  'CT': 'Command Thrust',
  'DTS': 'Digital Throttle & Shift',
  'JPO': 'Jet Pump Option'
};

// Parse Mercury rigging codes from model strings like "9.9ELPT", "25MH", etc.
function parseMercuryRigCodes(modelText: string): {
  tokens: string[];
  shaft_code: 'S' | 'L' | 'XL' | 'XXL';
  shaft_inches: 15 | 20 | 25 | 30;
  start_type: 'Electric' | 'Manual' | 'Unknown';
  control_type: 'Tiller' | 'Remote' | 'Unknown';
  has_power_trim: boolean;
  has_command_thrust: boolean;
  rigging_description: string;
} {
  const upperText = modelText.toUpperCase();
  const foundTokens: string[] = [];
  
  // Parse complex patterns first (order matters)
  const patterns = ['EXLPT', 'ELPT', 'ELH', 'MLH', 'MH', 'EH'];
  let remainingText = upperText;
  
  for (const pattern of patterns) {
    if (remainingText.includes(pattern)) {
      // Break down complex patterns
      if (pattern === 'EXLPT') {
        foundTokens.push('E', 'XL', 'PT');
      } else if (pattern === 'ELPT') {
        foundTokens.push('E', 'L', 'PT');  
      } else if (pattern === 'ELH') {
        foundTokens.push('E', 'L', 'H');
      } else if (pattern === 'MLH') {
        foundTokens.push('M', 'L', 'H');
      } else if (pattern === 'MH') {
        foundTokens.push('M', 'H');
      } else if (pattern === 'EH') {
        foundTokens.push('E', 'H');
      }
      remainingText = remainingText.replace(pattern, '');
      break;
    }
  }
  
  // Parse remaining individual tokens if no complex pattern found
  if (foundTokens.length === 0) {
    const individualTokens = ['XXL', 'XL', 'PT', 'CT', 'DTS', 'JPO', 'E', 'M', 'L', 'H'];
    for (const token of individualTokens) {
      if (remainingText.includes(token)) {
        foundTokens.push(token);
        remainingText = remainingText.replace(token, '');
      }
    }
  }
  
  // Remove duplicates and sort by canonical order
  const uniqueTokens = [...new Set(foundTokens)];
  const sortedTokens = uniqueTokens.sort((a, b) => {
    const order = ['E', 'M', 'H', 'L', 'XL', 'XXL', 'PT', 'CT', 'DTS', 'JPO'];
    return order.indexOf(a) - order.indexOf(b);
  });
  
  // Determine shaft configuration
  let shaft_code: 'S' | 'L' | 'XL' | 'XXL' = 'S';  // Default to Short
  let shaft_inches: 15 | 20 | 25 | 30 = 15;
  
  if (sortedTokens.includes('XXL')) {
    shaft_code = 'XXL';
    shaft_inches = 30;
  } else if (sortedTokens.includes('XL')) {
    shaft_code = 'XL';
    shaft_inches = 25;
  } else if (sortedTokens.includes('L')) {
    shaft_code = 'L';
    shaft_inches = 20;
  }
  
  // Determine other attributes
  const start_type = sortedTokens.includes('E') ? 'Electric' : 
                     sortedTokens.includes('M') ? 'Manual' : 'Unknown';
  const control_type = sortedTokens.includes('H') ? 'Tiller' : 'Remote';
  const has_power_trim = sortedTokens.includes('PT');
  const has_command_thrust = sortedTokens.includes('CT');
  
  // Build description
  const descriptions = sortedTokens.map(token => RIGGING_CODE_MAP[token] || token).filter(Boolean);
  const rigging_description = descriptions.join(', ');
  
  return {
    tokens: sortedTokens,
    shaft_code,
    shaft_inches,
    start_type,
    control_type,
    has_power_trim,
    has_command_thrust,
    rigging_description
  };
}

function detectFamily(text: string): string | undefined {
  const upperText = text.toUpperCase();
  const families = ['FOURSTROKE', 'PROXS', 'SEAPRO', 'VERADO', 'RACING'];
  
  for (const family of families) {
    if (upperText.includes(family) || upperText.includes(family.replace('FOURSTROKE', '4-STROKE'))) {
      return family === 'FOURSTROKE' ? 'FourStroke' : 
             family === 'PROXS' ? 'ProXS' :
             family === 'SEAPRO' ? 'SeaPro' : family;
    }
  }
  
  // Default to FourStroke if none detected
  return 'FourStroke';
}

function parseHorsepower(text: string): number | undefined {
  const hpMatch = text.match(/(\d+(?:\.\d+)?)\s*HP/i);
  if (hpMatch) {
    return parseFloat(hpMatch[1]);
  }
  
  // Try without HP suffix
  const numMatch = text.match(/^(\d+(?:\.\d+)?)/);
  if (numMatch && parseFloat(numMatch[1]) <= 600) {
    return parseFloat(numMatch[1]);
  }
  
  return undefined;
}

// Enhanced accessory detection for Mercury price lists
function detectAccessories(text: string): string[] {
  const accessories: string[] = [];
  
  // Symbol mapping
  if (text.includes('†') || text.includes('&#8224;')) {
    accessories.push('Propeller Included');
  }
  if (text.includes('‡') || text.includes('&#8225;')) {
    accessories.push('Fuel Tank Included');
  }
  
  // Text-based detection (case insensitive)
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('propeller included') || lowerText.includes('prop included')) {
    if (!accessories.includes('Propeller Included')) {
      accessories.push('Propeller Included');
    }
  }
  
  if (lowerText.includes('fuel tank included') || lowerText.includes('tank included')) {
    if (!accessories.includes('Fuel Tank Included')) {
      accessories.push('Fuel Tank Included');
    }
  }
  
  if (lowerText.includes('sail power')) {
    accessories.push('Sail Power Configuration');
  }
  
  return accessories;
}

// Clean model text by removing accessory symbols and formatting
function cleanModelText(text: string): string {
  if (!text) return '';
  
  // Remove HTML tags
  let cleaned = text.replace(/<[^>]*>/g, '');
  
  // Remove accessory symbols but preserve them for later detection
  cleaned = cleaned.replace(/[†‡]/g, '');
  cleaned = cleaned.replace(/&#822[45];/g, '');
  
  // Remove accessory phrases
  cleaned = cleaned.replace(/\s*\(?\s*(propeller|prop)\s+included\s*\)?\s*/gi, '');
  cleaned = cleaned.replace(/\s*\(?\s*(fuel\s+)?tank\s+included\s*\)?\s*/gi, '');
  cleaned = cleaned.replace(/\s*sail\s+power\s*/gi, '');
  
  // Clean whitespace and normalize
  return cleaned.trim().replace(/\s+/g, ' ');
}

// Parse Mercury model from price list data and extract all relevant attributes
function parseMotorDetails(modelDescription: string, mercuryModelNumber?: string): {
  mercury_model_no: string;
  family: string;
  horsepower: number | null;
  fuel_type: string;
  rigging_data: any;
  accessories: string[];
  model_display: string;
  model_key: string;
} {
  const originalDescription = modelDescription || '';
  const cleanedDescription = cleanModelText(originalDescription);
  
  // Use the actual Mercury model number (from first column) as authoritative identifier
  const modelNumber = mercuryModelNumber || '';
  
  // Extract Mercury code from description (like "25MH", "90ELPT" from "25MH FourStroke")
  let mercuryCode = '';
  const codeMatch = cleanedDescription.match(/^([A-Z0-9.]+)\s/);
  if (codeMatch) {
    mercuryCode = codeMatch[1];
  }
  
  // Parse horsepower from Mercury code
  let horsepower: number | null = null;
  const hpMatch = mercuryCode.match(/^(\d+(?:\.\d+)?)/);
  if (hpMatch) {
    const hp = parseFloat(hpMatch[1]);
    if (hp > 0 && hp <= 600) {
      horsepower = hp;
    }
  }
  
  // Extract rigging codes from Mercury code (everything after the horsepower)
  const riggingPart = mercuryCode.replace(/^\d+(?:\.\d+)?/, '');
  
  // Detect family from description
  const upperDescription = cleanedDescription.toUpperCase();
  let family = 'FourStroke'; // Default
  
  if (upperDescription.includes('FOURSTROKE') || upperDescription.includes('4-STROKE')) {
    family = 'FourStroke';
  } else if (upperDescription.includes('PROXS') || upperDescription.includes('PRO XS')) {
    family = 'ProXS';
  } else if (upperDescription.includes('SEAPRO') || upperDescription.includes('SEA PRO')) {
    family = 'SeaPro';
  } else if (upperDescription.includes('VERADO')) {
    family = 'Verado';
  } else if (upperDescription.includes('RACING')) {
    family = 'Racing';
  }
  
  // Parse rigging codes from Mercury code
  const riggingData = parseMercuryRigCodes(mercuryCode);
  
  // Detect fuel type - EFI if explicitly mentioned
  let fuelType = '';
  if (upperDescription.includes('EFI')) {
    fuelType = 'EFI';
  }
  
  // Detect Command Thrust
  const hasCommandThrust = upperDescription.includes('CT') || upperDescription.includes('COMMAND THRUST');
  
  // Detect accessories from original text (before cleaning)
  const accessories = detectAccessories(originalDescription);
  
  // Build model display according to new format: [Horsepower] [Rigging Codes] [EFI if present] [Family]
  const displayParts: string[] = [];
  
  // 1. Horsepower (plain number, no "HP" suffix)
  if (horsepower) {
    displayParts.push(horsepower.toString());
  }
  
  // 2. Rigging codes exactly as they appear in Mercury code
  if (riggingPart) {
    displayParts.push(riggingPart);
  }
  
  // 3. EFI if present
  if (fuelType) {
    displayParts.push(fuelType);
  }
  
  // 4. Family (always last)
  displayParts.push(family);
  
  // 5. CT if present (always at the very end)
  if (hasCommandThrust) {
    displayParts.push('CT');
  }
  
  const modelDisplay = displayParts.join(' ');
  
  // Use Mercury model number as the primary key for uniqueness
  const modelKey = modelNumber || mercuryCode || `UNKNOWN-${Date.now()}`;
  
  return {
    mercury_model_no: mercuryCode,
    family,
    horsepower,
    fuel_type: fuelType,
    rigging_data: riggingData,
    accessories,
    model_display: modelDisplay,
    model_key: modelKey
  };
}

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

function msrpFromDealer(dealerPrice: number, markup: number): number {
  return Math.round(dealerPrice * markup * 100) / 100;
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
    const rows = $table.find('tr').length;
    const cells = $table.find('td, th').length;
    
    if (rows < 3 || cells < 6) return; // Skip tiny tables
    
    // Score based on size and content indicators
    let score = rows * 2 + cells; // Base score
    
    const tableText = $table.text().toLowerCase();
    if (tableText.includes('mercury') || tableText.includes('fourstroke')) score += 20;
    if (tableText.includes('price') || tableText.includes('msrp')) score += 15;
    if (tableText.includes('hp') || tableText.includes('horsepower')) score += 10;
    if (tableText.includes('model')) score += 10;
    
    tables.push({ element: table, score, rows, cells });
  });
  
  // Sort tables by score (best first)
  tables.sort((a, b) => b.score - a.score);
  
  console.log(`[PriceList] Found ${tables.length} tables, top scores: ${tables.slice(0, 3).map(t => `${t.score} (${t.rows}r×${t.cells}c)`)}`);
  
  // Process the best table
  if (tables.length === 0) {
    console.log('[PriceList] No suitable tables found');
    return [];
  }
  
  const bestTable = tables[0];
  console.log(`[PriceList] Processing table with score ${bestTable.score}`);
  
  const $table = $(bestTable.element);
  const $rows = $table.find('tr');
  
  // Try to detect header row
  let headerRowIdx = 0;
  let headers: string[] = [];
  
  // Check first few rows for headers
  for (let i = 0; i < Math.min(3, $rows.length); i++) {
    const $row = $($rows[i]);
    const cells = $row.find('th, td').map((_, cell) => cleanText($(cell).text())).get();
    
    if (cells.some(cell => /model|description|price|hp/i.test(cell))) {
      headers = cells;
      headerRowIdx = i;
      break;
    }
  }
  
  console.log(`[PriceList] Detected headers: ${JSON.stringify(headers)}`);
  
  // Map column indices
  const columnMapping: any = {};
  headers.forEach((header, idx) => {
    const lowerHeader = header.toLowerCase();
    if (/model|description|name/i.test(lowerHeader) && !columnMapping.model) {
      columnMapping.model = idx;
    } else if (/number|code|sku/i.test(lowerHeader) && !columnMapping.number) {
      columnMapping.number = idx;
    } else if (/price|cost|dealer/i.test(lowerHeader) && !columnMapping.price) {
      columnMapping.price = idx;
    } else if (/hp|horsepower|power/i.test(lowerHeader) && !columnMapping.hp) {
      columnMapping.hp = idx;
    } else if (/family|type|series/i.test(lowerHeader) && !columnMapping.family) {
      columnMapping.family = idx;
    }
  });
  
  console.log(`[PriceList] Column mapping: ${JSON.stringify(columnMapping)}`);
  
  // Process data rows - Mercury price list format: [Model Number] [Description] [Price]
  for (let i = headerRowIdx + 1; i < $rows.length; i++) {
    const $row = $($rows[i]);
    const cells = $row.find('td, th').map((_, cell) => cleanText($(cell).text())).get();
    
    if (cells.length < 2) continue;
    
    const row: any = {};
    
    // For Mercury price lists, first column is typically the model number (1F02201KK, etc.)
    if (cells[0]) {
      // If first column looks like a Mercury model number, use it as model_number
      if (cells[0].match(/^[A-Z0-9]+$/)) {
        row.model_number = cells[0];
        // Second column would be the description
        if (cells[1]) {
          row.model_display = cells[1];
        }
        // Third column would be price
        if (cells[2]) {
          row.dealer_price = parsePrice(cells[2]);
        }
      } else {
        // Fallback to column mapping logic
        if (columnMapping.model >= 0 && cells[columnMapping.model]) {
          row.model_display = cells[columnMapping.model];
        }
        if (columnMapping.number >= 0 && cells[columnMapping.number]) {
          row.model_number = cells[columnMapping.number];
        }
        if (columnMapping.price >= 0 && cells[columnMapping.price]) {
          row.dealer_price = parsePrice(cells[columnMapping.price]);
        }
      }
    }
    
    // Additional column mappings if available
    if (columnMapping.hp >= 0 && cells[columnMapping.hp]) {
      row.horsepower = parseFloat(cells[columnMapping.hp]) || null;
    }
    if (columnMapping.family >= 0 && cells[columnMapping.family]) {
      row.family = cells[columnMapping.family];
    }
    
    if (row.model_display || row.model_number) {
      results.push(row);
    }
  }
  
  console.log(`[PriceList] Table produced ${results.length} rows`);
  
  if (results.length > 0) {
    console.log(`[PriceList] example_row=${JSON.stringify({
      model_display: results[0].model_display,
      dealer_price: results[0].dealer_price
    })}`);
  }
  
  return results;
}

// Process motors with enhanced parsing
function normalizeMotorData(rawData: any[], url: string, msrp_markup: number, html_snapshot_url?: string): any[] {
  const processedMotors: any[] = [];
  
  for (let i = 0; i < rawData.length; i++) {
    const rawRow = rawData[i];
    
    // Skip completely blank rows
    if (!rawRow.model_display && !rawRow.model_number) {
      continue;
    }
    
    // Parse motor details using enhanced parser - pass description and Mercury model number
    const motorDetails = parseMotorDetails(rawRow.model_display || '', rawRow.model_number || '');
    
    // Parse dealer price
    const dealer_price = parsePrice(String(rawRow.dealer_price || ''));
    
    // Debug logging for first 12 rows
    if (i < 12) {
      const debugRow = {
        raw_cells: [rawRow.model_number, rawRow.model_display, String(rawRow.dealer_price)],
        model_number_mercury: rawRow.model_number, // Mercury's actual model number
        mercury_model_no: motorDetails.mercury_model_no, // Parsed Mercury code
        family: motorDetails.family,
        horsepower: motorDetails.horsepower,
        fuel_type: motorDetails.fuel_type,
        rigging_description: motorDetails.rigging_data.rigging_description,
        accessories: motorDetails.accessories,
        model_display: motorDetails.model_display,
        model_key: motorDetails.model_key,
        dealer_price_raw: String(rawRow.dealer_price),
        dealer_price_num: dealer_price,
        msrp: msrpFromDealer(dealer_price || 0, msrp_markup)
      };
      
      console.log(`[PriceList] DEBUG Row ${i + 1}:`, debugRow);
    }
    
    // Validate required fields
    if (!motorDetails.model_key || motorDetails.model_key.trim() === '') {
      console.log(`[PriceList] DEBUG: Skipping row ${i + 1} - invalid model_key. Raw: "${rawRow.model_display}"`);
      continue;
    }
    
    if (!dealer_price || dealer_price <= 0) {
      console.log(`[PriceList] DEBUG: Skipping row ${i + 1} - invalid price. Raw: "${rawRow.dealer_price}", parsed: ${dealer_price}`);
      continue;
    }
    
    const msrp = msrpFromDealer(dealer_price, msrp_markup);
    
    // Build the database row with enhanced fields
    const dbRow: any = {
      make: 'Mercury',
      model: motorDetails.model_display,
      model_number: rawRow.model_number || null, // Mercury's actual model number (1F02201KK, etc.)
      model_key: motorDetails.model_key,
      mercury_model_no: motorDetails.mercury_model_no || null, // Parsed Mercury code (25MH, etc.)
      year: 2025,
      motor_type: motorDetails.family,
      family: motorDetails.family,
      horsepower: motorDetails.horsepower,
      fuel_type: motorDetails.fuel_type || null,
      rigging_code: motorDetails.rigging_data.rigging_description || null,
      accessories_included: motorDetails.accessories.length > 0 ? motorDetails.accessories : null,
      dealer_price,
      msrp,
      price_source: 'pricelist',
      msrp_calc_source: 'markup',
      msrp_source: `derived:+${Math.round((msrp_markup - 1) * 100)}%`,
      last_scraped: new Date().toISOString(),
      inventory_source: 'pricelist',
      catalog_source_url: url,
      catalog_snapshot_url: html_snapshot_url,
      // Enhanced Mercury rigging attributes
      shaft_code: motorDetails.rigging_data.shaft_code,
      shaft_inches: motorDetails.rigging_data.shaft_inches,
      start_type: motorDetails.rigging_data.start_type,
      control_type: motorDetails.rigging_data.control_type,
      has_power_trim: motorDetails.rigging_data.has_power_trim,
      has_command_thrust: motorDetails.rigging_data.has_command_thrust,
      // Brochure flags
      is_brochure: true,
      in_stock: false,
      availability: 'Brochure'
    };
    
    processedMotors.push(dbRow);
  }
  
  return processedMotors;
}

// Main normalization function  
function normalizeData(rawData: any[], contentSource: string, url: string, msrp_markup: number, html_snapshot_url?: string, create_missing_brochure = true) {
  console.log(`[PriceList] DEBUG: Starting normalization of ${rawData.length} raw rows`);
  
  // Show first 3 raw rows for debugging
  if (rawData.length > 0) {
    console.log(`[PriceList] DEBUG: First 3 raw rows:`, rawData.slice(0, 3));
  }
  
  // Process motors with enhanced parsing
  const processedMotors = normalizeMotorData(rawData, url, msrp_markup, html_snapshot_url);
  
  // Deduplication logic: Group by model_key and pick best row for each key
  const keyGroups = new Map<string, any[]>();
  
  for (const motor of processedMotors) {
    if (!keyGroups.has(motor.model_key)) {
      keyGroups.set(motor.model_key, []);
    }
    keyGroups.get(motor.model_key)!.push(motor);
  }
  
  console.log(`[PriceList] DEBUG: Found ${keyGroups.size} unique model_keys from ${processedMotors.length} processed motors`);
  
  // Show some examples of grouped keys
  const keyExamples = Array.from(keyGroups.entries()).slice(0, 5);
  for (const [key, group] of keyExamples) {
    console.log(`[PriceList] DEBUG: Key "${key}" has ${group.length} motors:`, group.map(g => g.model));
  }
  
  // Pick best representative for each key (prefer mercury_model_no, then higher HP, then more detailed model name)
  const deduplicatedMotors = Array.from(keyGroups.values()).map(group => {
    if (group.length === 1) return group[0];
    
    const sorted = group.sort((a, b) => {
      // Prefer motors with mercury_model_no
      if (a.mercury_model_no && !b.mercury_model_no) return -1;
      if (!a.mercury_model_no && b.mercury_model_no) return 1;
      if (a.horsepower !== b.horsepower) return (b.horsepower || 0) - (a.horsepower || 0);
      return b.model.length - a.model.length;
    });
    
    console.log(`[PriceList] DEBUG: Deduplicating key "${group[0].model_key}": chose "${sorted[0].model}" from ${group.length} options`);
    return sorted[0];
  });
  
  console.log(`[PriceList] Deduplicated to ${deduplicatedMotors.length} motors`);
  
  const rows_found = rawData.length;
  const rows_normalized = processedMotors.length;
  const rows_deduplicated = deduplicatedMotors.length;
  
  console.log(`[PriceList] source=${contentSource.toUpperCase()} rows_found=${rows_found} rows_normalized=${rows_normalized} rows_deduplicated=${rows_deduplicated}`);
  
  return deduplicatedMotors;
}

async function saveAndProcessData(supabase: any, motors: any[], checksum: string, dryRun: boolean) {
  // STEP 4: Save artifacts (always, even on future failure)
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const checksumPrefix = checksum.substring(0, 8);
  
  // Prepare artifacts with enhanced fields
  const jsonContent = JSON.stringify(motors, null, 2);
  const csvRows = [
    'model_display,model_number,mercury_model_no,model_key,family,horsepower,fuel_type,rigging_code,accessories_included,year,dealer_price,msrp,is_brochure,in_stock,price_source',
    ...motors.map(m => 
      `"${m.model}","${m.model_number || ''}","${m.mercury_model_no || ''}","${m.model_key}","${m.family || ''}",${m.horsepower || ''},"${m.fuel_type || ''}","${m.rigging_code || ''}","${Array.isArray(m.accessories_included) ? m.accessories_included.join('; ') : ''}",${m.year},${m.dealer_price},${m.msrp},${m.is_brochure},${m.in_stock},"${m.price_source || ''}"`
    )
  ];
  const csvContent = csvRows.join('\n');
  
  // Save artifacts to storage
  console.log('[PriceList] Saving artifacts to storage...');
  const artifacts = {
    json_url: await saveArtifact(supabase, `pricelist/${timestamp}-${checksumPrefix}.json`, jsonContent, 'application/json'),
    csv_url: await saveArtifact(supabase, `pricelist/${timestamp}-${checksumPrefix}.csv`, csvContent, 'text/csv')
  };
  
  if (dryRun) {
    console.log('[PriceList] Dry run complete - no database changes made');
    return {
      success: true,
      rows_created: motors.length,
      rows_updated: 0,
      rows_skipped_total: 0,
      sample_created: motors.slice(0, 10),
      artifacts
    };
  }
  
  // STEP 5: Database operations (upsert)
  console.log(`[PriceList] Upserting ${motors.length} motors to database...`);
  
  let rows_created = 0;
  let rows_updated = 0;
  let rows_failed = 0;
  
  const BATCH_SIZE = 50;
  for (let i = 0; i < motors.length; i += BATCH_SIZE) {
    const batch = motors.slice(i, i + BATCH_SIZE);
    
    try {
      const { data, error } = await supabase
        .from('motor_models')
        .upsert(batch, { 
          onConflict: 'model_key',
          ignoreDuplicates: false 
        })
        .select('id, model_key');
      
      if (error) {
        console.error(`[PriceList] Batch ${Math.floor(i/BATCH_SIZE) + 1} error:`, error);
        rows_failed += batch.length;
      } else {
        rows_created += data?.length || batch.length;
        console.log(`[PriceList] Batch ${Math.floor(i/BATCH_SIZE) + 1}: processed ${batch.length} motors`);
      }
    } catch (err) {
      console.error(`[PriceList] Batch ${Math.floor(i/BATCH_SIZE) + 1} exception:`, err);
      rows_failed += batch.length;
    }
  }
  
  console.log(`[PriceList] Database upsert complete: ${rows_created} created, ${rows_updated} updated, ${rows_failed} failed`);
  
  return {
    success: rows_failed === 0,
    rows_created,
    rows_updated,
    rows_skipped_total: rows_failed,
    sample_created: motors.slice(0, 10),
    artifacts
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseClient();
    const { url, html, csv, dry_run = false, msrp_markup = 1.10, parse_mode = 'auto' } = await req.json();

    console.log(`[PriceList] Starting seed process: dry_run=${dry_run}, msrp_markup=${msrp_markup}`);
    
    // STEP 1: Get content
    let content = '';
    let contentSource: 'url' | 'html' | 'csv' = 'url';
    
    if (csv) {
      content = csv;
      contentSource = 'csv';
      console.log('[PriceList] Using provided CSV content');
    } else if (html) {
      content = html;
      contentSource = 'html';
      console.log('[PriceList] Using provided HTML content');
    } else if (url) {
      console.log(`[PriceList] Fetching from URL: ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
      }
      content = await response.text();
      contentSource = 'url';
    } else {
      throw new Error('Must provide url, html, or csv parameter');
    }

    // STEP 2: Generate checksum
    const checksum = await generateChecksum(content.substring(0, 10000)); // First 10k chars
    console.log(`[PriceList] Content checksum: ${checksum.substring(0, 8)}...`);

    // STEP 3: Parse content based on type
    let rowData: any[] = [];
    let source_kind = 'unknown';
    
    if (contentSource === 'csv') {
      rowData = parseCSV(content);
      source_kind = 'raw_csv';
    } else {
      // Try HTML parsing first
      const htmlResults = parseHTML(content);
      if (htmlResults.length > 0) {
        rowData = htmlResults;
        source_kind = 'html_table';
      } else {
        console.log('[PriceList] HTML parsing failed, no suitable data found');
        throw new Error('No parseable data found in content');
      }
    }

    console.log(`[PriceList] HTML parsing found ${rowData.length} rows`);

    // STEP 4: Normalize and process the data with enhanced parsing
    const deduplicatedMotors = normalizeData(rowData, url || 'provided', msrp_markup || 1.10);
    
    // STEP 5: Save artifacts and process data
    const processResult = await saveAndProcessData(supabase, deduplicatedMotors, checksum, dry_run);

    // Final result
    const result: SeededResult = {
      success: processResult.success,
      content_source: contentSource,
      source_kind: source_kind as any,
      rows_found_raw: rowData.length,
      rows_parsed: deduplicatedMotors.length,
      rows_created: processResult.rows_created,
      rows_updated: processResult.rows_updated,
      rows_skipped_total: processResult.rows_skipped_total,
      rows_skipped_by_reason: {},
      top_skip_reasons: [],
      sample_created: processResult.sample_created,
      sample_skipped: [],
      checksum: checksum.substring(0, 16),
      artifacts: processResult.artifacts
    };

    console.log(`[PriceList] Process complete:`, {
      success: result.success,
      found: result.rows_found_raw,
      parsed: result.rows_parsed,
      created: result.rows_created,
      updated: result.rows_updated
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: any) {
    console.error('[PriceList] Fatal error:', error);
    
    const errorResult: SeededResult = {
      success: false,
      content_source: 'url',
      source_kind: 'html_table',
      rows_found_raw: 0,
      rows_parsed: 0,
      rows_created: 0,
      rows_updated: 0,
      rows_skipped_total: 0,
      rows_skipped_by_reason: { 'fatal_error': 1 },
      top_skip_reasons: [error.message],
      sample_created: [],
      sample_skipped: []
    };

    return new Response(JSON.stringify(errorResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});