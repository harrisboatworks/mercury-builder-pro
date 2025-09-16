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

function parseNumber(v: any, d = 0) {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const n = Number(String(v ?? '').trim());
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

// Mercury part number: tolerate letters+digits, typically 8–12 chars, ends with KK often.
// Relaxed enough to keep "real" parts; filter obvious descriptors.
const PART_RE = /^[A-Z0-9]{6,14}$/i;

// ------- helpers -------
function chunkBy<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Parse HTML tables from the price list
function parseHTMLTables(html: string) {
  const tables: Array<{
    headers: string[];
    rows: string[][];
    score: number;
    cols: number;
  }> = [];

  // Simple regex-based HTML table parsing
  const tableMatches = html.match(/<table[^>]*>[\s\S]*?<\/table>/gi);
  if (!tableMatches) return tables;

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
        cols: headers.length
      });
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

// Generate model key from mercury model number
function generateModelKey(mercuryModelNo: string, hp?: number, shaft?: string) {
  if (!mercuryModelNo) return '';
  
  const baseKey = mercuryModelNo.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  const parts = [baseKey];
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

// Parse horsepower from description
function parseHorsepower(description: string): number {
  if (!description) return 0;
  
  const match = description.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
}

// Parse price list and return structured data
async function parsePriceList(url: string, msrpMarkup: number) {
  console.log(`[PriceList] Fetching from URL: ${url}`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const html = await response.text();
  console.log(`[PriceList] HTML parsing found ${html.length} characters`);
  
  const tables = parseHTMLTables(html);
  console.log(`[PriceList] Found ${tables.length} tables, top scores: ${tables.map(t => `${t.score} (${t.rows.length}r×${t.cols}c)`).join(',')}`);
  
  if (tables.length === 0) {
    throw new Error('No tables found in HTML');
  }
  
  const bestTable = tables[0];
  console.log(`[PriceList] Detected headers: ${JSON.stringify(bestTable.headers)}`);
  
  const columnMapping = getColumnMapping(bestTable.headers);
  console.log(`[PriceList] Column mapping: model_number=${columnMapping.model_number}, model_description=${columnMapping.model_description}, dealer_price=${columnMapping.dealer_price}`);
  
  const rawRows = extractTableData(bestTable, columnMapping);
  console.log(`[PriceList] Column mapping applied: ${JSON.stringify(columnMapping)}`);
  console.log(`[PriceList] Processing table with score ${bestTable.score}`);
  console.log(`[PriceList] Extraction skip reasons: {}`);
  console.log(`[PriceList] DEBUG: Starting normalization of ${rawRows.length} raw rows`);
  
  const parsedRows = rawRows.map((row, index) => {
    const modelNumber = String(row.model_number || '').trim();
    const modelDescription = decodeEntities(String(row.model_description || '').trim());
    const dealerPrice = parseNumber(row.dealer_price, 0);
    
    const mercuryModelNo = parseMercuryModelNo(modelDescription);
    const horsepower = parseHorsepower(modelDescription);
    const modelKey = generateModelKey(modelNumber.toLowerCase(), horsepower);
    
    console.log(`[PriceList] Row ${index + 1} model_display: "${modelDescription}" (from: "${modelDescription}")`);
    
    return {
      model_number: modelNumber,
      model_display: modelDescription,
      model_key: modelKey,
      mercury_model_no: mercuryModelNo,
      dealer_price: dealerPrice,
      msrp: Math.round(dealerPrice * msrpMarkup * 100) / 100,
      hp: horsepower,
      rigging_code: null,
      accessories: null,
      family: 'FourStroke',
      images: [],
      year: 2025,
    };
  });
  
  return parsedRows;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return ok({ ok: true }, 204);

  const url = new URL(req.url);
  const path = url.pathname;
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // Health check
  if (path.endsWith('/ping')) {
    return ok({ ok: true, service: 'seed-from-pricelist', time: new Date().toISOString() });
  }

  if (req.method !== 'POST') return fail(405, 'route', new Error('Method not allowed'));

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
  function skip(reason: string) { skipReasons[reason] = (skipReasons[reason] || 0) + 1; }

  for (const r of parsedRows) {
    const model_number = String(r.model_number ?? '').trim();
    const model_display = decodeEntities(String(r.model_display ?? '').trim());
    const model_key = String(r.model_key ?? '').trim();
    const mercury_model_no = String(r.mercury_model_no ?? '').trim();

    if (!model_number) { skip('missing_model_number'); continue; }
    if (!PART_RE.test(model_number)) { skip('not_part_style_model_number'); continue; }
    if (!model_key) { skip('missing_model_key'); continue; }

    const dealer_price = parseNumber(r.dealer_price, NaN);
    const msrp = parseNumber(r.msrp, NaN);
    if (!Number.isFinite(dealer_price)) { skip('invalid_dealer_price'); continue; }
    if (!Number.isFinite(msrp)) { skip('invalid_msrp'); continue; }

    cleaned.push({
      is_brochure: true,
      availability: 'Brochure',
      make: 'Mercury',
      motor_type: r.family || 'FourStroke', // Ensure motor_type is not null
      year: 2025,
      model_number,
      model_display,
      model_key,
      mercury_model_no,
      dealer_price,
      msrp,
      // keep pass-throughs
      horsepower: r.hp ?? null,
      rigging_code: r.rigging_code ?? null,
      accessories_included: r.accessories ?? [],
      family: r.family ?? 'FourStroke',
      engine_type: 'EFI',
      fuel_type: 'Gas',
      shaft: 'Short Shaft 15"',
      control: 'Tiller Handle',
      start_type: 'Manual Start',
      price_source: 'harris_pricelist',
      msrp_source: 'dealer_price * 1.1',
      msrp_calc_source: 'calculated',
      in_stock: false,
      stock_quantity: 0,
      images: [],
      data_sources: {
        manual: { user_id: null, added_at: null },
        mercury_official: { success: true, scraped_at: new Date().toISOString() },
        harris: { success: true, scraped_at: new Date().toISOString() },
        reviews: { success: false, scraped_at: null }
      },
      last_scraped: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
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
    for (const row of data ?? []) existingNumbers.add((row.model_number || '').toString());
  } catch (e) {
    return fail(500, 'fetch_existing_for_predict', e, { echo: norm });
  }

  const toInsert = cleaned.filter(r => !existingNumbers.has(r.model_number));
  const toUpdate = cleaned.filter(r => existingNumbers.has(r.model_number));

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
    if (toInsert.length) {
      console.log(`[PriceList] Inserting ${toInsert.length} new brochure records...`);
      const { data, error } = await supabase
        .from('motor_models')
        .insert(toInsert)
        .select('id');
      if (error) {
        console.error(`[PriceList] Failed at insert_brochures: ${JSON.stringify(error)}`);
        throw error;
      }
      rows_created = data?.length ?? 0;
    }
  } catch (e) {
    console.error(`[PriceList] Insert error: ${(e as any)?.message}`);
    return fail(500, 'insert_new', e, { echo: norm, to_insert: toInsert.length });
  }

  // Phase B: UPDATE only existing rows, by model_number + is_brochure=true
  try {
    for (const chunk of chunkBy(toUpdate, 50)) {
      const nums = chunk.map(r => r.model_number);
      const fields = chunk.map(r => ({
        model_number: r.model_number,
        model_display: r.model_display,
        model_key: r.model_key,
        mercury_model_no: r.mercury_model_no,
        dealer_price: r.dealer_price,
        msrp: r.msrp,
        year: r.year,
      }));
      
      const { data, error } = await supabase.rpc('update_brochure_models_bulk', {
        p_model_numbers: nums,
        p_fields: fields,
      });
      
      if (error) throw error;
      rows_updated += (data as number) || 0;
    }
  } catch (e) {
    return fail(500, 'update_existing', e, { echo: norm, to_update: toUpdate.length });
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
});
