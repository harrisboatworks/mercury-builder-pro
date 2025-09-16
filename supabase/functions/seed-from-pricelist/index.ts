import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ---------- CORS + helpers ----------
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-debug',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

function ok(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: corsHeaders });
}

function fail(status: number, step: string, err: unknown, extra: Record<string, unknown> = {}) {
  const msg = (err as any)?.message ? String((err as any).message) : String(err);
  const stack = (err as any)?.stack;
  console.error(`[Pricelist] Failed @ ${step}:`, msg, stack, extra);
  return new Response(
    JSON.stringify({ ok: false, success: false, step, error: msg, stack, details: extra }),
    { status, headers: corsHeaders }
  );
}

function parseBool(v: any, d = false) {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (['1','true','yes','y','on'].includes(s)) return true;
    if (['0','false','no','n','off',''].includes(s)) return false;
  }
  return d;
}

function parseNumber(v: any, d: number | null = null) {
  if (v == null) return d;
  const s = String(v).replace(/[\$,]/g, '').trim();
  if (s === '') return d;
  const n = Number(s);
  return Number.isFinite(n) ? n : d;
}

function normalizeInputs(input: any) {
  return {
    price_list_url: String(input?.price_list_url ?? '').trim(),
    msrp_markup: parseNumber(input?.msrp_markup, 1.0),
    dry_run: parseBool(input?.dry_run, false),
    force: parseBool(input?.force, false),
    create_missing_brochures: parseBool(input?.create_missing_brochures, true),
  };
}

// HTML entity cleanup for display text (avoid showing &dagger; etc.)
function decodeEntities(s: string) {
  if (!s) return s;
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&dagger;/gi, '†')
    .replace(/&Dagger;/g, '‡');
}

function titleCase(s?: string | null) {
  if (!s) return '';
  return s
    .toLowerCase()
    .replace(/(^|\s+|-|_)([a-z])/g, (_m, p1, p2) => `${p1}${p2.toUpperCase()}`)
    .trim();
}

/**
 * Enhanced family -> model resolver with ProXS detection:
 * - Prefer parsed "family" if present (e.g., "Pro XS" from section detection)
 * - Enhanced detection patterns for ProXS models
 * - Fallback to model_key analysis
 */
function resolveModel(rec: any): string {
  // Prefer explicit family field first (highest priority)
  const family = rec.family || rec.engine_family || rec.series || rec.category;
  if (family && String(family).trim()) return titleCase(String(family));

  // Enhanced mercury model number and description analysis
  const mercuryModelNo = rec.mercury_model_no || rec.model_display || '';
  if (mercuryModelNo) {
    const description = String(mercuryModelNo).toLowerCase();
    
    // ProXS detection patterns (case insensitive)
    if (description.includes('pro xs') || 
        description.includes('proxs') || 
        description.match(/\bpro\s*xs\b/) ||
        description.match(/\bproxs\b/)) {
      return 'Pro XS';
    }
    
    // Verado detection
    if (description.includes('verado')) return 'Verado';
    
    // FourStroke detection  
    if (description.includes('fourstroke') || 
        description.includes('four stroke') ||
        description.includes('4stroke') ||
        description.includes('4 stroke')) {
      return 'FourStroke';
    }
    
    // SeaPro detection
    if (description.includes('seapro') || description.includes('sea pro')) return 'SeaPro';
  }

  // Try from model_key as fallback
  const key: string = rec.model_key || rec.modelNumberKey || '';
  const prefix = key.split('-')[0] || '';
  const normalized = prefix.toLowerCase();
  
  if (['proxs','pro-xs','proxs®','pro-xs®'].includes(normalized)) return 'Pro XS';
  if (['fourstroke', 'four-stroke', '4-stroke', '4stroke'].includes(normalized)) return 'FourStroke';
  if (['verado'].includes(normalized)) return 'Verado';
  if (['seapro','sea-pro'].includes(normalized)) return 'SeaPro';

  // Fallback: title-case whatever we found, or "Outboard"
  const tc = titleCase(prefix);
  return tc || 'Outboard';
}

// Prefer explicit type; else infer from family/model_key; else default.
function resolveMotorType(rec: any): string {
  // 1) explicit fields from parse
  const explicit =
    rec.motor_type ||
    rec.engine_type ||
    rec.power_type ||
    rec.fuel_type; // sometimes "Gas" / "Electric"
  if (explicit && String(explicit).trim()) {
    const v = String(explicit).toLowerCase();
    if (/(electric|ev)/.test(v)) return 'Electric';
    if (/(jet)/.test(v)) return 'Jet';
    if (/(diesel)/.test(v)) return 'Diesel';
    return 'Outboard'; // anything else from Mercury is still an outboard
  }

  // 2) infer from family / key
  const fam = (rec.family || rec.engine_family || rec.series || '').toString().toLowerCase();
  const key = (rec.model_key || rec.model_number || '').toString().toLowerCase();

  if (/(electric|ev)/.test(fam) || /(electric|ev)/.test(key)) return 'Electric';
  if (/jet/.test(fam) || /jet/.test(key)) return 'Jet';

  // 3) safe default to satisfy NOT NULL
  return 'Outboard';
}

/**
 * Add space between HP number and model code (e.g., "250CXL" → "250 CXL")
 */
function formatHPSpacing(displayName: string): string {
  if (!displayName) return displayName;
  
  // Match HP number at start followed by letters (no space)
  // Handles both whole numbers (250) and decimals (9.9)
  return displayName.replace(/^(\d+(?:\.\d+)?)([A-Z])/i, '$1 $2');
}

/**
 * Detect and strip accessory symbols from motor display names
 * † = fuel tank included, †† = fuel tank + propeller included
 */
function detectAndStripAccessorySymbols(displayName: string): { cleanName: string; accessories: string[] } {
  if (!displayName) return { cleanName: '', accessories: [] };
  
  const accessories: string[] = [];
  let cleanName = displayName;
  
  // Detect double dagger (fuel tank + propeller)
  if (cleanName.includes('††')) {
    accessories.push('fuel_tank', 'propeller');
    cleanName = cleanName.replace(/††+/g, '').trim();
  }
  // Detect single dagger (fuel tank only)
  else if (cleanName.includes('†')) {
    accessories.push('fuel_tank');
    cleanName = cleanName.replace(/†+/g, '').trim();
  }
  
  // Apply HP spacing after symbol cleanup
  cleanName = formatHPSpacing(cleanName);
  
  return { cleanName, accessories };
}

/**
 * Ensure all required brochure fields are present with proper field mapping and markup application.
 * NOTE: model and motor_type are NOT NULL in motor_models.
 */
function toDbRow(rec: any, opts: { msrp_markup?: number } = {}) {
  // Parse numeric fields properly
  const dealer = parseNumber(rec.dealer_price ?? rec.dealer ?? rec.price);
  let msrp = parseNumber(rec.msrp ?? rec.msrp_price);
  
  // Apply markup only to MSRP when missing (not double-apply)
  if (msrp == null && dealer != null && opts.msrp_markup) {
    msrp = Math.round(dealer * Number(opts.msrp_markup) * 100) / 100;
  }
  
  // Process model display name to strip accessory symbols
  const rawDisplayName = rec.model_display ?? rec.display ?? '';
  const { cleanName, accessories } = detectAndStripAccessorySymbols(rawDisplayName);
  
  // Extract HP from clean description or existing field
  let hp = parseNumber(rec.hp ?? rec.horsepower);
  if (hp == null && cleanName) {
    const hpMatch = String(cleanName).match(/\b(\d+(?:\.\d+)?)\s*HP\b/i);
    if (hpMatch) {
      hp = parseNumber(hpMatch[1]);
    }
  }

  return {
    // identity / flags
    is_brochure: true,
    availability: 'Brochure',
    make: 'Mercury',

    // identifiers
    model_number: rec.model_number,              // e.g., "1F02201KK"
    model_key: rec.model_key,                    // e.g., "FOURSTROKE-ELPT-EFI"
    mercury_model_no: rec.mercury_model_no ?? rec.mercury_code ?? null,

    // NOT NULLs
    model: resolveModel({ ...rec, model_display: cleanName }),  // use clean name for better family detection
    motor_type: resolveMotorType(rec),           // "Outboard" | "Electric" | "Jet" | "Diesel"

    // display / pricing (properly mapped)
    model_display: cleanName || null,           // cleaned display name without symbols
    dealer_price: dealer,
    msrp: msrp,
    horsepower: hp,

    // accessory information
    accessory_notes: accessories.length > 0 ? accessories : [],

    // misc
    year: rec.year ?? 2025,
    updated_at: new Date().toISOString(),
  };
}

// Mercury part number: tolerate letters+digits, typically 8–12 chars, ends with KK often.
// Relaxed enough to keep "real" parts; filter obvious descriptors.
const PART_RE = /^[A-Z0-9]{6,14}$/i;

// ------- helpers -------
function chunkBy<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Parse HTML tables from the price list - Enhanced to detect multiple sections
function parseHTMLTables(html: string) {
  const tables: Array<{
    headers: string[];
    rows: string[][];
    score: number;
    cols: number;
    section?: string; // Track which section this table comes from
  }> = [];

  console.log(`[ParseTables] Analyzing HTML content (${html.length} chars)`);
  
  // Look for section headers before tables to identify ProXS vs FourStroke
  const sections = html.split(/(?=<h[1-6][^>]*>.*?(?:pro\s*xs|fourstroke|mercury).*?<\/h[1-6]>)/i);
  console.log(`[ParseTables] Found ${sections.length} potential sections`);

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    
    // Identify section type from headers
    let sectionType = 'unknown';
    const headerMatch = section.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/i);
    if (headerMatch) {
      const headerText = headerMatch[1].toLowerCase();
      if (headerText.includes('pro xs') || headerText.includes('proxs')) {
        sectionType = 'proxs';
      } else if (headerText.includes('fourstroke') || headerText.includes('four stroke')) {
        sectionType = 'fourstroke';
      }
      console.log(`[ParseTables] Section ${i}: "${headerText}" -> ${sectionType}`);
    }

    // Find tables in this section
    const tableMatches = section.match(/<table[^>]*>[\s\S]*?<\/table>/gi);
    if (!tableMatches) continue;

    for (const tableHtml of tableMatches) {
      const headerMatch = tableHtml.match(/<tr[^>]*>\s*(<th[^>]*>[\s\S]*?<\/th>\s*)+<\/tr>/i);
      if (!headerMatch) continue;

      const headers = Array.from(headerMatch[0].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi))
        .map(match => match[1].replace(/<[^>]*>/g, '').trim());

      const rowMatches = Array.from(tableHtml.matchAll(/<tr[^>]*>(?:\s*<td[^>]*>[\s\S]*?<\/td>\s*)+<\/tr>/gi));
      const rows = rowMatches.map(rowMatch => 
        Array.from(rowMatch[0].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi))
          .map(cellMatch => cellMatch[1].replace(/<[^>]*>/g, '').trim())
      );

      if (headers.length >= 3 && rows.length > 0) {
        const score = headers.length * rows.length;
        tables.push({
          headers,
          rows,
          score,
          cols: headers.length,
          section: sectionType
        });
        console.log(`[ParseTables] Added table: ${rows.length} rows, section: ${sectionType}`);
      }
    }
  }

  return tables.sort((a, b) => b.score - a.score);
}

// Get column mapping from headers
function getColumnMapping(headers: string[]) {
  const mapping: Record<string, number> = {};
  
  headers.forEach((header, index) => {
    const h = header.toLowerCase();
    if (h.includes('model') && h.includes('#')) {
      mapping.model_number = index;
    } else if (h.includes('description')) {
      mapping.model_description = index;
    } else if (h.includes('price')) {
      mapping.dealer_price = index;
    }
  });

  return mapping;
}

// Extract data from best table
function extractTableData(table: any, columnMapping: Record<string, number>) {
  return table.rows.map((row: string[]) => ({
    model_number: row[columnMapping.model_number] || '',
    model_description: row[columnMapping.model_description] || '',
    dealer_price: row[columnMapping.dealer_price] || '0'
  }));
}

// Generate model key from mercury model number and model number for uniqueness
function generateModelKey(mercuryModelNo: string, modelNumber: string, hp?: number, shaft?: string) {
  // Always include model_number for guaranteed uniqueness
  const modelNumKey = modelNumber.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  const parts = [modelNumKey];
  
  // Add mercury model number if different from model number
  if (mercuryModelNo && mercuryModelNo !== modelNumber) {
    const baseKey = mercuryModelNo.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    if (baseKey && baseKey !== modelNumKey) {
      parts.push(baseKey);
    }
  }
  
  if (hp) parts.push(hp.toString());
  if (shaft) parts.push(shaft.toLowerCase());
  
  return parts.join('-');
}

// Parse Mercury model number from description
function parseMercuryModelNo(description: string): string {
  if (!description) return '';
  
  // Look for patterns like "25MH", "90ELPT", etc.
  const match = description.match(/(\d+(?:\.\d+)?[A-Z]{1,6})/);
  return match ? match[1] : '';
}

// Parse horsepower from description using improved patterns
function parseHorsepower(description: string): number | null {
  if (!description) return null;
  
  // Look for HP patterns first (most specific)
  const hpMatch = description.match(/\b(\d+(?:\.\d+)?)\s*HP\b/i);
  if (hpMatch) return parseFloat(hpMatch[1]);
  
  // Look for leading numbers (common in Mercury model descriptions)
  const numMatch = description.match(/^(\d+(?:\.\d+)?)/);
  if (numMatch) return parseFloat(numMatch[1]);
  
  return null;
}

// Parse price list and return structured data - Enhanced for ProXS detection
async function parsePriceList(url: string, msrpMarkup: number) {
  console.log(`[PriceList] Fetching from URL: ${url}`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const html = await response.text();
  console.log(`[PriceList] HTML parsing found ${html.length} characters`);
  
  const tables = parseHTMLTables(html);
  console.log(`[PriceList] Found ${tables.length} tables, sections: ${tables.map(t => `${t.section || 'unknown'}(${t.rows.length}r×${t.cols}c)`).join(',')}`);
  
  if (tables.length === 0) {
    throw new Error('No tables found in HTML');
  }
  
  const allParsedRows: any[] = [];
  
  // Process all tables, not just the first one
  for (const table of tables) {
    console.log(`[PriceList] Processing table from section: ${table.section}, headers: ${JSON.stringify(table.headers)}`);
    
    const columnMapping = getColumnMapping(table.headers);
    console.log(`[PriceList] Column mapping: model_number=${columnMapping.model_number}, model_description=${columnMapping.model_description}, dealer_price=${columnMapping.dealer_price}`);
    
    const rawRows = extractTableData(table, columnMapping);
    console.log(`[PriceList] Extracted ${rawRows.length} rows from ${table.section} section`);
    
    const parsedRows = rawRows.map((row, index) => {
      const modelNumber = String(row.model_number || '').trim();
      const modelDescription = decodeEntities(String(row.model_description || '').trim());
      const dealerPrice = parseNumber(row.dealer_price);
      
      const mercuryModelNo = parseMercuryModelNo(modelDescription);
      const horsepower = parseHorsepower(modelDescription);
      const modelKey = generateModelKey(mercuryModelNo, modelNumber, horsepower);
      
      // Determine family based on section and model description
      let family = null;
      if (table.section === 'proxs') {
        family = 'Pro XS';
      } else if (table.section === 'fourstroke') {
        family = 'FourStroke';
      } else {
        // Auto-detect from model description
        const desc = modelDescription.toLowerCase();
        if (desc.includes('pro xs') || desc.includes('proxs')) {
          family = 'Pro XS';
        } else if (desc.includes('fourstroke') || desc.includes('four stroke')) {
          family = 'FourStroke';
        }
      }
      
      console.log(`[PriceList] Row ${index + 1} from ${table.section}: "${modelDescription}" -> family: ${family} (dealer: ${dealerPrice}, hp: ${horsepower})`);
      
      return {
        model_number: modelNumber,
        model_display: modelDescription,
        model_key: modelKey,
        mercury_model_no: mercuryModelNo,
        dealer_price: dealerPrice,
        msrp: null,
        hp: horsepower,
        rigging_code: null,
        accessories: null,
        family: family,
        images: [],
        year: 2025,
      };
    });
    
    allParsedRows.push(...parsedRows);
  }
  
  console.log(`[PriceList] Total processed rows from all sections: ${allParsedRows.length}`);
  return allParsedRows;
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    const url = new URL(req.url);
    if (req.method === 'GET' && url.searchParams.get('ping') === '1') {
      return ok({ ok: true, step: 'ping' });
    }

    if (req.method !== 'POST') {
      return fail(405, 'method', new Error('Method not allowed'));
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    let body: any;
    try {
      body = await req.json();
    } catch (e) {
      return fail(400, 'parse_body', e);
    }

    // ---- Normalize inputs and echo ----
    const norm = normalizeInputs(body);
    if (!norm.price_list_url) {
      norm.price_list_url = 'https://www.harrisboatworks.ca/mercurypricelist';
    }

    // ---- Parse the price list ----
    let parsedRows: any[] = [];
    try {
      parsedRows = await parsePriceList(norm.price_list_url, norm.msrp_markup);
    } catch (e) {
      return fail(500, 'parse_pricelist', e, { echo: norm });
    }

    // ---- Clean and validate rows ----
    const cleaned = [];
    const skipReasons: Record<string, number> = {};
    const seenModelKeys = new Set<string>();
    function skip(reason: string) { skipReasons[reason] = (skipReasons[reason] || 0) + 1; }

    for (const r of parsedRows) {
      const model_number = String(r.model_number ?? '').trim();
      const model_display = decodeEntities(String(r.model_display ?? '').trim());
      const model_key = String(r.model_key ?? '').trim();
      const mercury_model_no = String(r.mercury_model_no ?? '').trim();

      if (!model_number) { skip('missing_model_number'); continue; }
      if (!PART_RE.test(model_number)) { skip('not_part_style_model_number'); continue; }
      if (!model_key) { skip('missing_model_key'); continue; }

      // Check for duplicate model_key within the batch
      if (seenModelKeys.has(model_key)) {
        console.log(`[PriceList] DUPLICATE model_key detected in batch: ${model_key} (model_number: ${model_number})`);
        skip('duplicate_model_key_in_batch');
        continue;
      }
      seenModelKeys.add(model_key);

      const dealer_price = parseNumber(r.dealer_price);
      if (dealer_price == null) { skip('invalid_dealer_price'); continue; }

      cleaned.push(toDbRow({
        model_number,
        model_display,
        model_key,
        mercury_model_no,
        dealer_price,
        msrp: r.msrp, // Let toDbRow handle MSRP calculation
        hp: r.hp,
        horsepower: r.hp, // Include both for compatibility
        family: r.family || 'FourStroke',
        year: 2025,
      }, { msrp_markup: norm.msrp_markup }));
    }

    // ---- If dry run: compute would-create/update by looking at DB and return diagnostics ----
    let existingNumbers = new Set<string>();
    try {
      const { data, error } = await supabase
        .from('motor_models')
        .select('model_number')
        .eq('is_brochure', true)
        .not('model_number', 'is', null);
      if (error) throw error;
      
      console.log(`[PriceList] CRITICAL DEBUG: Found ${data?.length || 0} existing brochure records in motor_models table`);
      
      for (const row of data ?? []) {
        const modelNum = (row.model_number || '').toString();
        existingNumbers.add(modelNum);
        console.log(`[PriceList] EXISTING: ${modelNum}`);
      }
      
      console.log(`[PriceList] Total existing model numbers: ${existingNumbers.size}`);
    } catch (e) {
      return fail(500, 'fetch_existing_for_predict', e, { echo: norm });
    }

    const toInsert = cleaned.filter(r => !existingNumbers.has(r.model_number));
    const toUpdate = cleaned.filter(r => existingNumbers.has(r.model_number));

    console.log(`[PriceList] ROUTING DECISION: ${toInsert.length} to INSERT (Phase A), ${toUpdate.length} to UPDATE (Phase B)`);
    console.log(`[PriceList] First 5 for INSERT:`, toInsert.slice(0, 5).map(r => r.model_number));
    console.log(`[PriceList] First 5 for UPDATE:`, toUpdate.slice(0, 5).map(r => r.model_number));

    // insertRows and updateRows are already processed through toDbRow
    const insertRows = toInsert;
    const updateRows = toUpdate;

    const diagnostics = {
      step: norm.dry_run ? 'dry_run_complete' : 'ingest_complete',
      echo: norm,
      raw_found: parsedRows.length,
      parsed: cleaned.length,
      would_create: toInsert.length,
      would_update: toUpdate.length,
      skip_reasons: skipReasons,
      sample_created: cleaned.slice(0, 10).map(r => ({ 
        model_display: r.model_display, 
        model_number: r.model_number, 
        dealer_price: r.dealer_price, 
        msrp: r.msrp 
      })),
    };

    if (norm.dry_run) {
      return ok({ ok: true, success: true, ...diagnostics });
    }

    // ---- INGEST: two-phase write with accurate counts ----
    let rows_created = 0;
    let rows_updated = 0;

    // Phase A: INSERT only new rows
    try {
      if (insertRows.length) {
        console.log(`[PriceList] PHASE A: Inserting ${insertRows.length} new brochure records...`);
        console.log(`[PriceList] Sample insert data:`, JSON.stringify(insertRows.slice(0, 2), null, 2));
        
        // Pre-validate model_key uniqueness against database
        const modelKeysToInsert = insertRows.map(r => r.model_key).filter(Boolean);
        console.log(`[PriceList] Checking for existing model_key conflicts...`);
        
        try {
          const { data: existingKeys } = await supabase
            .from('motor_models')
            .select('model_key')
            .in('model_key', modelKeysToInsert);
          
          if (existingKeys && existingKeys.length > 0) {
            console.error(`[PriceList] PHASE A PRE-CHECK FAILED: Found ${existingKeys.length} existing model_key conflicts:`, existingKeys.map(k => k.model_key));
            return fail(409, 'model_key_conflicts', new Error(`Found ${existingKeys.length} model_key conflicts in database`), { 
              echo: norm, 
              conflicting_keys: existingKeys.map(k => k.model_key),
              to_insert: insertRows.length 
            });
          }
          
          console.log(`[PriceList] Pre-check passed: No existing model_key conflicts found`);
        } catch (e) {
          return fail(500, 'pre_check_model_keys', e, { echo: norm, to_insert: insertRows.length });
        }
        
        const { data, error } = await supabase
          .from('motor_models')
          .insert(insertRows)
          .select('id, model_number, model_key');
        
        if (error) {
          console.error(`[PriceList] PHASE A FAILED: ${JSON.stringify(error)}`);
          console.error(`[PriceList] PHASE A ERROR: ${error.message}`);
          
          // Provide detailed error info for constraint violations
          if (error.code === '23505' && error.message.includes('model_key')) {
            const duplicateKey = error.details?.match(/Key \(model_key\)=\(([^)]+)\)/)?.[1];
            console.error(`[PriceList] DUPLICATE KEY DETECTED: ${duplicateKey}`);
            return fail(409, 'duplicate_model_key', error, { 
              echo: norm, 
              duplicate_key: duplicateKey,
              to_insert: insertRows.length,
              suggestion: 'This should not happen after pre-check - there may be a race condition or logic error'
            });
          }
          
          throw error;
        }
        
        rows_created = data?.length ?? 0;
        console.log(`[PriceList] PHASE A SUCCESS: Created ${rows_created} records`);
        console.log(`[PriceList] First 3 created:`, data?.slice(0, 3));
        
        // CRITICAL: Verify records actually exist in table
        const { data: verifyData, error: verifyError } = await supabase
          .from('motor_models')
          .select('id')
          .eq('is_brochure', true);
        
        if (!verifyError) {
          console.log(`[PriceList] VERIFICATION: motor_models table now has ${verifyData?.length || 0} brochure records`);
        }
      } else {
        console.log(`[PriceList] PHASE A: No records to insert`);
      }
    } catch (e) {
      console.error(`[PriceList] PHASE A ERROR: ${(e as any)?.message}`);
      return fail(500, 'insert_new', e, { echo: norm, to_insert: insertRows.length });
    }

    // Phase B: UPDATE only existing rows, by model_number + is_brochure=true  
    try {
      if (updateRows.length) {
        console.log(`[PriceList] PHASE B: Updating ${updateRows.length} existing brochure records...`);
        console.log(`[PriceList] Sample update data:`, JSON.stringify(updateRows.slice(0, 2), null, 2));
        
        for (const chunk of chunkBy(updateRows, 200)) {
          console.log(`[PriceList] PHASE B: Processing chunk of ${chunk.length} records via RPC...`);
          
          const { data: updCount, error: rpcErr } = await supabase.rpc(
            'update_brochure_models_bulk',
            { p_rows: chunk }
          );
          
          if (rpcErr) {
            console.error(`[PriceList] PHASE B RPC ERROR: ${JSON.stringify(rpcErr)}`);
            throw rpcErr;
          }
          
          const chunkUpdated = (typeof updCount === 'number' ? updCount : 0);
          rows_updated += chunkUpdated;
          console.log(`[PriceList] PHASE B: Chunk completed, updated ${chunkUpdated} records`);
        }
        
        console.log(`[PriceList] PHASE B SUCCESS: Total updated ${rows_updated} records`);
        
        // CRITICAL: Verify total records in table after update
        const { data: finalVerifyData, error: finalVerifyError } = await supabase
          .from('motor_models')
          .select('id')
          .eq('is_brochure', true);
        
        if (!finalVerifyError) {
          console.log(`[PriceList] FINAL VERIFICATION: motor_models table has ${finalVerifyData?.length || 0} brochure records after update`);
        }
      } else {
        console.log(`[PriceList] PHASE B: No records to update`);
      }
    } catch (e) {
      if (String(e).toLowerCase().includes('function') && String(e).toLowerCase().includes('not found')) {
        // Fallback to individual updates if RPC not available
        try {
          for (const r of updateRows) {
            const { error } = await supabase
              .from('motor_models')
              .update({
                model: r.model,
                model_display: r.model_display,
                model_key: r.model_key,
                mercury_model_no: r.mercury_model_no,
                dealer_price: r.dealer_price,
                msrp: r.msrp,
                year: r.year,
                updated_at: new Date().toISOString(),
              })
              .eq('is_brochure', true)
              .eq('model_number', r.model_number);
            if (!error) rows_updated += 1;
          }
        } catch (e2) {
          return fail(500, 'update_existing_fallback', e2, { echo: norm, to_update: updateRows.length });
        }
      } else {
        return fail(500, 'update_existing_rpc', e, { echo: norm, to_update: updateRows.length });
      }
    }

    return ok({
      ok: true,
      success: true,
      step: 'ingest_complete',
      echo: norm,
      raw_found: parsedRows.length,
      parsed: cleaned.length,
      rows_created,
      rows_updated,
      skip_reasons: skipReasons,
      sample_created: toInsert.slice(0, 10).map(r => ({ 
        model_display: r.model_display, 
        model_number: r.model_number, 
        dealer_price: r.dealer_price, 
        msrp: r.msrp 
      })),
    });

  } catch (e) {
    return fail(500, 'top-level', e);
  }
});
