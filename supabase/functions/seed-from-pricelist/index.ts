import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-debug',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
};

function ok(payload: Record<string, unknown>) {
  return new Response(JSON.stringify(payload), { status: 200, headers: corsHeaders });
}

function fail(status: number, step: string, err: unknown, extra: Record<string, unknown> = {}) {
  const msg = (err && (err as any).message) ? (err as any).message : String(err);
  const stack = (err && (err as any).stack) ? (err as any).stack : undefined;
  console.error(`[PriceList] Failed at ${step}:`, err);
  return new Response(JSON.stringify({ 
    ok: false,
    success: false, 
    step, 
    error: msg, 
    stack, 
    details: { ...extra, error_type: err?.constructor?.name }
  }), {
    status,
    headers: corsHeaders
  });
}

function parseBool(v: any, def = false) {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (s === 'true' || s === '1' || s === 'yes' ) return true;
    if (s === 'false'|| s === '0' || s === 'no'  ) return false;
  }
  return def;
}

function parseNumber(v: any, def = 0) {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v))) return Number(v);
  return def;
}

function normalizeInputs(body: any) {
  return {
    dry_run: parseBool(body?.dry_run, false),   // **default false for ingest**
    msrp_markup: parseNumber(body?.msrp_markup, 1), // default 1.0 (no change)
    force: parseBool(body?.force, false),
    create_missing_brochures: parseBool(body?.create_missing_brochures, true),
    price_list_url: String(body?.price_list_url || '').trim(),
  };
}

function chunk<T>(array: T[], size: number): T[][] {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

Deno.serve(async (req) => {
  try {
    // CORS preflight
    if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

    // Lightweight reachability check
    const url = new URL(req.url);
    if (req.method === 'GET' && (url.searchParams.get('ping') === '1' || url.pathname.endsWith('/ping'))) {
      return ok({ success: true, step: 'ping', message: 'seed-from-pricelist alive' });
    }

    // Safely parse JSON body (POST expected)
    let raw: any = {};
    if (req.method === 'POST') {
      try { raw = await req.json(); } catch { raw = {}; }
    }

    // Normalize inputs with robust helpers
    const normalizedInputs = normalizeInputs(raw);
    const { dry_run, msrp_markup, force, create_missing_brochures, price_list_url } = normalizedInputs;
    
    console.log(`[PriceList] Normalized inputs:`, normalizedInputs);

    // Supabase client (use service role for RLS-safe writes)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Quick smoke test (optional)
    if (raw && raw.quick === true) {
      return ok({ success: true, step: 'quick', echo: normalizedInputs });
    }

    console.log(`[PriceList] Starting process: dry_run=${dry_run}, msrp_markup=${msrp_markup}`);
    
    try {
      let currentStep = 'init';
      let debugInfo = {
        rows_found: 0,
        rows_parsed: 0,
        rowErrors: [],
        first_bad_row: null,
        samples: []
      };

      const priceListUrl = price_list_url || raw.url?.trim() || 'https://www.harrisboatworks.ca/mercurypricelist';
      
      console.log(`[PriceList] Starting seed process: dry_run=${dry_run}, msrp_markup=${msrp_markup}, url=${priceListUrl}`);
      
      // Step 1: Fetch from URL
      currentStep = 'fetch';
      console.log(`[PriceList] Fetching from URL: ${priceListUrl}`);
      
      const response = await fetch(priceListUrl);
      if (!response.ok) {
        return fail(response.status, 'fetch', `HTTP ${response.status}: ${response.statusText}`, { url: priceListUrl });
      }
      
      const html = await response.text();
      
      // Create a simple checksum for content
      const contentChecksum = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(html));
      const checksumHex = Array.from(new Uint8Array(contentChecksum))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
        .substring(0, 8);
      
      console.log(`[PriceList] Content checksum: ${checksumHex}...`);
    
    try {
      let currentStep = 'init';
      let debugInfo = {
        rows_found: 0,
        rows_parsed: 0,
        rowErrors: [],
        first_bad_row: null,
        samples: []
      };

      const priceListUrl = raw.url?.trim() || 'https://www.harrisboatworks.ca/mercurypricelist';
      
      console.log(`[PriceList] Starting seed process: dry_run=${dry_run}, msrp_markup=${msrp_markup}, url=${priceListUrl}`);
      
      // Step 1: Fetch from URL
      currentStep = 'fetch';
      console.log(`[PriceList] Fetching from URL: ${priceListUrl}`);
      
      const response = await fetch(priceListUrl);
      const html = await response.text();
      
      // Create a simple checksum for content
      const contentChecksum = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(html));
      const checksumHex = Array.from(new Uint8Array(contentChecksum))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
        .substring(0, 8);
      
      console.log(`[PriceList] Content checksum: ${checksumHex}...`);
      
      // Step 2: Parse HTML tables
      currentStep = 'parse';
      console.log(`[PriceList] Parsing HTML tables...`);
      const tables = parseHTMLTables(html);
      
      if (tables.length === 0) {
        return fail('parse', 'No tables found in HTML', { 
          detail: 'HTML parsing found no table elements',
          debugInfo,
          echo
        });
      }
      
      // Find the best table (highest score)
      const bestTable = tables.reduce((prev, current) => 
        current.score > prev.score ? current : prev
      );
      
      console.log(`[PriceList] Found ${tables.length} tables, top scores: ${tables.map(t => `${t.score} (${t.rows}r×${t.cols}c)`).join(',')}`);
      console.log(`[PriceList] Processing table with score ${bestTable.score}`);
      console.log(`[PriceList] Detected headers: ${JSON.stringify(bestTable.headers)}`);
      
      // Column mapping with safety fallbacks
      const columnMapping = getColumnMapping(bestTable.headers);
      console.log(`[PriceList] Headers detected: ${JSON.stringify(bestTable.headers)}`);
      console.log(`[PriceList] Column mapping applied: ${JSON.stringify(columnMapping)}`);
      
      // Extract and normalize data
      const rawRows = extractTableData(bestTable, columnMapping);
      debugInfo.rows_found = rawRows.length;
      console.log(`[PriceList] Table produced ${rawRows.length} rows`);
      console.log(`[PriceList] example_row=${JSON.stringify(rawRows[0])}`);
      
      if (rawRows.length === 0) {
        return fail('parse', 'No data rows extracted from table', {
          detail: 'Table parsing found no data rows after header detection',
          debugInfo,
          echo
        });
      }
      
      // Step 3: Normalize data
      currentStep = 'normalize';
      console.log(`[PriceList] HTML parsing found ${rawRows.length} rows`);
      console.log(`[PriceList] DEBUG: Starting normalization of ${rawRows.length} raw rows`);
      
      const { normalizedMotors, errors, skipReasons } = normalizeMotorData(rawRows, msrp_markup);
      debugInfo.rows_parsed = normalizedMotors.length;
      debugInfo.rowErrors = errors.slice(0, 10); // Limit to first 10 errors
      if (errors.length > 0) {
        debugInfo.first_bad_row = errors[0];
      }
      
      // Debug the first few rows
      for (let i = 0; i < Math.min(5, normalizedMotors.length); i++) {
        console.log(`[PriceList] DEBUG Row ${i + 1}: ${JSON.stringify(normalizedMotors[i])}`);
      }
      
      // Deduplicate by model_number (primary) then model_key (fallback)
      const uniqueKeys = new Map();
      const deduplicatedMotors = [];
      const deduplicationSkips = new Map();
      
      for (const motor of normalizedMotors) {
        const primaryKey = motor.model_number || motor.model_key;
        
        if (!uniqueKeys.has(primaryKey)) {
          uniqueKeys.set(primaryKey, motor);
          deduplicatedMotors.push(motor);
        } else {
          const reason = motor.model_number ? `duplicate_model_number:${motor.model_number}` : `duplicate_model_key:${motor.model_key}`;
          deduplicationSkips.set(reason, (deduplicationSkips.get(reason) || 0) + 1);
        }
      }
      
      // Merge skip reasons
      const allSkipReasons = new Map([...skipReasons, ...deduplicationSkips]);
      
      console.log(`[PriceList] Deduplicated to ${deduplicatedMotors.length} motors`);
      console.log(`[PriceList] ingest params: dry_run=${dry_run}, msrp_markup=${msrp_markup}`);
      console.log(`[PriceList] source=${priceListUrl.toUpperCase()} rows_found=${rawRows.length} rows_normalized=${normalizedMotors.length} rows_deduplicated=${deduplicatedMotors.length}`);
      
      // Safety check for empty deduplication
      if (deduplicatedMotors.length === 0) {
        console.log(`[PriceList] WARNING: No motors survived deduplication - possible data issue`);
      }
      
      // Save snapshot to storage
      currentStep = 'snapshot';
      console.log(`[PriceList] Saving artifacts to storage...`);
      const artifacts = {
        source_url: priceListUrl,
        content_checksum: checksumHex,
        scraped_at: new Date().toISOString(),
        tables_found: tables.length,
        best_table_score: bestTable.score,
        column_mapping: columnMapping,
        raw_rows: rawRows.length,
        normalized_motors: normalizedMotors.length,
        deduplicated_motors: deduplicatedMotors.length,
        sample_motors: deduplicatedMotors.slice(0, 10),
        skip_reasons: Object.fromEntries(allSkipReasons),
        parse_errors: errors.slice(0, 10)
      };
      
      const artifactPath = `pricelist-artifacts/${new Date().toISOString().split('T')[0]}-${checksumHex}.html`;
      await supabase.storage
        .from('sources')
        .upload(artifactPath, html, {
          contentType: 'text/html',
          upsert: true
        });
      
      const jsonPath = `pricelist-artifacts/${new Date().toISOString().split('T')[0]}-${checksumHex}.json`;
      await supabase.storage
        .from('sources')
        .upload(jsonPath, JSON.stringify(artifacts, null, 2), {
          contentType: 'application/json',
          upsert: true
        });
      
      debugInfo.samples = deduplicatedMotors.slice(0, 10).map(m => ({
        model_number: m.model_number,
        model_display: m.model_display, // Include human-readable display
        rigging_code: m.rigging_code,
        accessories_included: m.accessories_included,
        dealer_price: m.dealer_price,
        msrp: m.msrp
      }));
      
      // Pre-validate rows before processing
      const validMotors = [];
      const rowErrors: Array<{row_index: number, reason: string}> = [];
      
      for (let i = 0; i < deduplicatedMotors.length; i++) {
        const motor = deduplicatedMotors[i];
        
        // Fail fast if required fields missing
        if (!motor.model_number?.trim()) {
          rowErrors.push({row_index: i, reason: 'missing_model_number'});
          continue;
        }
        if (motor.is_brochure !== true) {
          rowErrors.push({row_index: i, reason: 'missing_is_brochure'});
          continue;
        }
        if (typeof motor.dealer_price !== 'number' || motor.dealer_price < 0) {
          rowErrors.push({row_index: i, reason: 'invalid_dealer_price'});
          continue;
        }
        if (typeof motor.msrp !== 'number' || motor.msrp < 0) {
          rowErrors.push({row_index: i, reason: 'invalid_msrp'});
          continue;
        }
        
        validMotors.push(motor);
      }
      
      console.log(`[PriceList] Pre-validation: ${validMotors.length} valid, ${rowErrors.length} rejected`);
      
      // Step 4A: Query existing brochure model_numbers to determine create vs update
      currentStep = 'detect_existing';
      const incomingNumbers = validMotors.map(m => m.model_number).filter(Boolean);
      console.log(`[PriceList] Querying existing brochure model_numbers for ${incomingNumbers.length} incoming records...`);
      
      const { data: existingRecords, error: queryError } = await supabase
        .from('motor_models')
        .select('model_number')
        .eq('is_brochure', true);
        
      if (queryError) {
        console.error(`[PriceList] Error querying existing records: ${queryError.message}`);
        return fail(500, 'read_existing', queryError, { tried_to_query: incomingNumbers.length });
      }
      
      const existingNumbers = new Set((existingRecords || []).map(r => (r.model_number || '').toLowerCase()));
      console.log(`[PriceList] Found ${existingNumbers.size} existing brochure model_numbers in DB`);
      
      // Split into create vs update arrays
      const toInsert: any[] = [];
      const toUpdate: any[] = [];
      
      for (const motor of validMotors) {
        // Build required brochure record with all fields
        const record = {
          is_brochure: true,
          availability: 'Brochure',
          make: 'Mercury',
          model: motor.model || motor.family || 'Outboard',
          year: 2025,
          model_number: motor.model_number,       // e.g. "1F02201KK"
          model_key: motor.model_key,             // existing logic
          mercury_model_no: motor.mercury_model_no, // parsed like "25MH", "90ELPT"
          model_display: motor.model_display,     // human title
          dealer_price: motor.dealer_price,       // numeric
          base_price: motor.dealer_price,
          sale_price: motor.dealer_price,
          msrp: Math.round((motor.dealer_price || 0) * msrp_markup * 100) / 100,
          
          // Copy all other fields from original motor
          family: motor.family,
          horsepower: motor.horsepower,
          fuel_type: motor.fuel_type,
          shaft: motor.shaft,
          control: motor.control,
          rigging_code: motor.rigging_code,
          engine_type: motor.engine_type,
          accessories_included: motor.accessories_included,
          accessory_notes: motor.accessory_notes,
          features: motor.features,
          specifications: motor.specifications,
          price_source: motor.price_source,
          msrp_source: motor.msrp_source,
          msrp_calc_source: motor.msrp_calc_source,
          in_stock: motor.in_stock,
          stock_quantity: motor.stock_quantity,
          stock_number: motor.stock_number,
          image_url: motor.image_url,
          images: motor.images,
          hero_image_url: motor.hero_image_url,
          detail_url: motor.detail_url,
          spec_sheet_file_id: motor.spec_sheet_file_id,
          last_scraped: motor.last_scraped,
          data_sources: motor.data_sources,
          updated_at: new Date().toISOString()
        };

        // Skip if no model_number
        if (!record.model_number) continue;

        if (existingNumbers.has(record.model_number.toLowerCase())) {
          toUpdate.push(record);
        } else {
          toInsert.push(record);
        }
      }
      
      console.log(`[PriceList] Phase split: ${toInsert.length} to create, ${toUpdate.length} to update`);
      
      if (dry_run) {
        console.log(`[PriceList] Dry run complete - no database changes made`);
        return ok({
          success: true,
          step: 'dry_run_complete',
          rows_found_raw: rawRows.length,
          rows_parsed: normalizedMotors.length,
          rows_created: toInsert.length, // Accurate would-create count
          rows_updated: toUpdate.length, // Accurate would-update count
          sample_created: toInsert.slice(0, 3).map(m => ({
            model_number: m.model_number,
            model_display: m.model_display,
            dealer_price: m.dealer_price,
            msrp: m.msrp
          })),
          sample_updated: toUpdate.slice(0, 3).map(m => ({
            model_number: m.model_number,
            model_display: m.model_display,
            dealer_price: m.dealer_price,
            msrp: m.msrp
          })),
          rows_skipped_by_reason: Object.fromEntries(allSkipReasons),
          top_skip_reasons: Array.from(allSkipReasons.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5),
          rowErrors: debugInfo.rowErrors,
          snapshot_url: `View Saved HTML: ${jsonPath}`,
          echo: normalizedInputs
        });
      }
      
      // Step 4B: Execute the two-phase writes
      currentStep = 'upsert';
      console.log(`[PriceList] Executing database writes...`);
      
      let rows_created = 0;
      let rows_updated = 0;
      
      // Phase B1: Insert new records
      if (toInsert.length > 0) {
        console.log(`[PriceList] Inserting ${toInsert.length} new brochure records...`);
        
        const { error: insErr, count: insCount } = await supabase
          .from('motor_models')
          .insert(toInsert, { count: 'exact' });  // service client; RLS off
        
        if (insErr) {
          console.error(`[PriceList] Insert error: ${insErr.message}`);
          return fail(500, 'insert_brochures', insErr, { tried: toInsert.length });
        }
        
        rows_created = insCount ?? toInsert.length; // fall back if count missing
        console.log(`[PriceList] Insert phase complete: ${rows_created} records created`);
      }
      
      // Phase B2: Update existing records by model_number
      if (toUpdate.length > 0) {
        console.log(`[PriceList] Updating ${toUpdate.length} existing brochure records...`);
        
        for (const batch of chunk(toUpdate, 50)) {
          for (const rec of batch) {
            const { error: updErr, data } = await supabase
              .from('motor_models')
              .update({
                availability: rec.availability,
                make: rec.make,
                model: rec.model,
                year: rec.year,
                model_key: rec.model_key,
                mercury_model_no: rec.mercury_model_no,
                model_display: rec.model_display,
                dealer_price: rec.dealer_price,
                base_price: rec.base_price,
                sale_price: rec.sale_price,
                msrp: rec.msrp,
                family: rec.family,
                horsepower: rec.horsepower,
                fuel_type: rec.fuel_type,
                rigging_code: rec.rigging_code,
                accessories_included: rec.accessories_included,
                price_source: rec.price_source,
                msrp_source: rec.msrp_source,
                msrp_calc_source: rec.msrp_calc_source,
                last_scraped: rec.last_scraped,
                data_sources: rec.data_sources,
                updated_at: rec.updated_at
              })
              .eq('is_brochure', true)
              .eq('model_number', rec.model_number)
              .select('id'); // returns rows updated
              
            if (updErr) {
              console.error(`[PriceList] Update error for ${rec.model_number}: ${updErr.message}`);
              return fail(500, 'update_brochures', updErr, { model_number: rec.model_number });
            }
            
            rows_updated += (data?.length ?? 0);
          }
        }
        console.log(`[PriceList] Update phase complete: ${rows_updated} records updated`);
      }
      
      console.log(`[PriceList] Database writes complete: ${rows_created} created, ${rows_updated} updated`);
      
      // Return final results with proper structure
      return ok({
        success: true,
        step: 'ingest_complete',
        rows_found_raw: rawRows.length,
        rows_parsed: normalizedMotors.length,
        rows_created,
        rows_updated,
        sample_created: toInsert.slice(0, 3).map(m => ({
          model_number: m.model_number,
          model_display: m.model_display,
          dealer_price: m.dealer_price,
          msrp: m.msrp
        })),
        sample_updated: toUpdate.slice(0, 3).map(m => ({
          model_number: m.model_number,
          model_display: m.model_display,
          dealer_price: m.dealer_price,
          msrp: m.msrp
        })),
        rows_skipped_by_reason: Object.fromEntries(allSkipReasons),
        top_skip_reasons: Array.from(allSkipReasons.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5),
        snapshot_url: `View Saved HTML: ${jsonPath}`,
        echo: normalizedInputs
      });

    } catch (innerErr) {
      console.error(`[PriceList] Inner error:`, innerErr);
      return fail(500, 'normalize_or_ingest', innerErr, { echo: normalizedInputs });
    }
  
  } catch (bootErr) {
    console.error(`[PriceList] Boot error:`, bootErr);
    return fail(500, 'boot', bootErr);
  }
});

// Parse Mercury model codes and descriptions with error handling
function normalizeMotorData(rawRows: any[], msrp_markup: number) {
  const results = [];
  const errors = [];
  const skipReasons = new Map();
  
  for (let i = 0; i < rawRows.length; i++) {
    try {
      const row = rawRows[i];
      const modelNumber = (row.model_number || '').trim();
      
      // Build model_display from brochure description with proper cleaning
      const rawDesc = (row.model_display_raw || row.description || row.model || row.title || '').toString();
      const cleaned = rawDesc
        .replace(/[†*+]+$/g, '')      // trailing markers
        .replace(/\s{2,}/g, ' ')      // collapse spaces
        .trim();
      const model_display = cleaned.length ? cleaned.slice(0, 160) : null;
      
      // Defensive coercion for prices
      const dealerPrice = Number(String(row.dealer_price).replace(/[^0-9.]/g, '')) || 0;
      const msrp = Math.round(dealerPrice * Number(msrp_markup || 1.1));
      
      // Fail fast validation - required fields
      if (!modelNumber) {
        skipReasons.set('empty_model_number', (skipReasons.get('empty_model_number') || 0) + 1);
        errors.push({ row_index: i, error: 'Empty model number', data: row });
        continue;
      }
      if (!model_display) {
        skipReasons.set('missing_description_for_model_display', (skipReasons.get('missing_description_for_model_display') || 0) + 1);
        errors.push({ row_index: i, error: 'Missing description for model_display', data: row });
        continue;
      }
      if (dealerPrice <= 0) {
        skipReasons.set('invalid_price', (skipReasons.get('invalid_price') || 0) + 1);
        errors.push({ row_index: i, error: `Invalid dealer_price: ${dealerPrice}`, data: row });
        continue;
      }
      if (msrp <= 0) {
        skipReasons.set('invalid_msrp', (skipReasons.get('invalid_msrp') || 0) + 1);
        errors.push({ row_index: i, error: `Invalid msrp: ${msrp}`, data: row });
        continue;
      }
      
      // Parse Mercury model from description (e.g., "25MH FourStroke †‡")
      const descriptionClean = model_display;
      
      // Extract accessories from symbols in original raw description
      const accessories = [];
      if (rawDesc.includes('†')) accessories.push('Propeller Included');
      if (rawDesc.includes('‡')) accessories.push('Fuel Tank Included');
      
      // Parse model components
      const parts = descriptionClean.split(/\s+/);
      let mercuryModelNo = '';
      let family = '';
      let horsepower = null;
      
      // Find family (FourStroke, ProXS, etc.)
      const familyMatch = parts.find(part => 
        ['FourStroke', 'ProXS', 'SeaPro', 'Verado', 'Racing'].includes(part)
      );
      if (familyMatch) {
        family = familyMatch;
      }
      
      // Extract horsepower and model codes from first part that looks like Mercury model
      for (const part of parts) {
        if (/^\d+(?:\.\d+)?[A-Z]+[A-Z0-9]*$/i.test(part)) {
          mercuryModelNo = part.toUpperCase();
          const hpMatch = part.match(/^(\d+(?:\.\d+)?)/);
          if (hpMatch) {
            horsepower = parseFloat(hpMatch[1]);
          }
          break;
        }
      }
      
      // Validate model_number - must be real Mercury part number format
      const isValidMercuryPartNumber = modelNumber && 
        /^[0-9][A-Z0-9]{6,9}[A-Z]{2}$/i.test(modelNumber.trim()) && 
        !modelNumber.includes('-') && 
        !modelNumber.includes('FOURSTROKE') && 
        !modelNumber.includes('PROX') &&
        !modelNumber.includes('SEAPRO') &&
        !modelNumber.includes('VERADO');
      
      if (!isValidMercuryPartNumber) {
        skipReasons.set('invalid_mercury_part_number', (skipReasons.get('invalid_mercury_part_number') || 0) + 1);
        errors.push({ row_index: i, error: `Invalid Mercury part number: ${modelNumber}`, data: row });
        continue;
      }
      
      // Parse rigging codes from Mercury model number
      let riggingDescription = '';
      let riggingCodes = '';
      if (mercuryModelNo) {
        const codes = mercuryModelNo.replace(/^\d+(?:\.\d+)?/, ''); // Remove HP
        riggingCodes = codes;
        const riggingParts = [];
        
        if (codes.includes('E')) riggingParts.push('Electric Start');
        if (codes.includes('M') && !codes.includes('E')) riggingParts.push('Manual Start');
        if (codes.includes('L') && !codes.includes('XL')) riggingParts.push('Long Shaft 20"');
        if (codes.includes('XL') && !codes.includes('XXL')) riggingParts.push('Extra Long Shaft 25"');
        if (codes.includes('XXL')) riggingParts.push('Extra Extra Long Shaft 30"');
        if (codes.includes('H')) riggingParts.push('Tiller Handle');
        if (codes.includes('PT')) riggingParts.push('Power Trim');
        if (codes.includes('CT')) riggingParts.push('Command Thrust');
        
        // Default to Short Shaft if no L/XL/XXL
        if (!codes.includes('L')) riggingParts.push('Short Shaft 15"');
        
        riggingDescription = riggingParts.join(', ');
      }
      
      // Generate clean model display: prefer original brochure text, fallback to canonical display
      const canonicalDisplay = [
        horsepower && `${horsepower}`,
        mercuryModelNo && mercuryModelNo.replace(/^\d+(?:\.\d+)?/, ''), // rigging codes only
        family
      ].filter(Boolean).join(' ').trim();
      
      // Use cleaned model_display as the primary display name
      const finalModelDisplay = model_display || canonicalDisplay || 'Mercury Outboard';
      
        // Generate unique model_key with model_number as primary identifier
        const modelKey = [
          modelNumber.toLowerCase(),
          horsepower || '',
          riggingCodes.toLowerCase() || '',
          family.toLowerCase() || ''
        ].filter(Boolean).join('-').replace(/[^a-z0-9.-]/g, '');
      
        const result = {
          // CRITICAL IDENTITY FIELDS - Always include these for brochure upserts
          model_number: modelNumber.trim(), // Official Mercury model number (1F02201KK, etc.)
          mercury_model_no: mercuryModelNo || '', // Parsed model (25MH, etc.)
          model_key: modelKey, // Generated unique key for fallback conflicts
          
          // CRITICAL DISPLAY FIELDS - Always include model_display for human-readable names
          model_display: finalModelDisplay, // Human-readable brochure text
          display_name: finalModelDisplay,
          
          // CRITICAL BROCHURE CLASSIFICATION - Always include these exact values
          is_brochure: true, // Brochure flag - REQUIRED
          availability: 'Brochure', // Always brochure for these imports - REQUIRED
          make: 'Mercury', // Always Mercury for these imports - REQUIRED
          model: family || 'Outboard', // Required field - fallback to Outboard
          motor_type: family || 'Outboard', // Mercury family or fallback - REQUIRED
          year: 2025, // Current catalog year - REQUIRED
          
          // CRITICAL PRICING FIELDS - Always include numeric values
          dealer_price: dealerPrice, // Numeric dealer price - REQUIRED
          base_price: dealerPrice, // Same as dealer_price for brochure
          sale_price: dealerPrice, // No special sales for brochure
          msrp: msrp, // Calculated MSRP - REQUIRED
          
          // Parsed motor details
          family: family || 'FourStroke', // Default to FourStroke if not detected
          horsepower: horsepower,
          fuel_type: 'EFI',
          shaft: '', 
          control: '',
          rigging_code: riggingDescription,
          engine_type: '',
          
          // Accessories and features
          accessories_included: accessories,
          accessory_notes: [],
          features: [],
          specifications: {},
          
          // Pricing metadata
          price_source: 'harris_pricelist',
          msrp_source: 'calculated',
          msrp_calc_source: `dealer_price * ${msrp_markup}`,
          
          // Stock and availability (consistent with brochure status)
          in_stock: false, // Brochure items not in physical stock
          stock_quantity: 0,
          stock_number: '',
          
          // Images and documentation (empty for brochure imports)
          image_url: '',
          images: [],
          hero_image_url: '',
          detail_url: '',
          spec_sheet_file_id: '',
          
          // Data tracking
          last_scraped: new Date().toISOString(),
          data_sources: {
            harris: { success: true, scraped_at: new Date().toISOString() },
            manual: { user_id: null, added_at: null },
            mercury_official: { success: false, scraped_at: null }
          },
          
          // Timestamps - let DB handle created_at, always update updated_at
          updated_at: new Date().toISOString(),
          
          // Debug info
          raw_cells: [row.model_number, rawDesc, row.dealer_price]
        };
        
        // Debug log for model_display
        console.log(`[PriceList] Row ${i + 1} model_display: "${result.model_display}" (from: "${rawDesc}")`);
        
        results.push(result);
      
    } catch (rowError) {
      skipReasons.set('processing_error', (skipReasons.get('processing_error') || 0) + 1);
      errors.push({
        row_index: i,
        error: rowError.message,
        data: rawRows[i],
        stack: rowError.stack
      });
    }
  }
  
  console.log(`[PriceList] Normalization skip reasons: ${JSON.stringify(Object.fromEntries(skipReasons))}`);
  console.log(`[PriceList] Normalization completed: ${results.length} successful, ${errors.length} errors`);
  console.log(`[PriceList] Model display stats: ${results.filter(r => r.model_display).length} with display, ${results.filter(r => !r.model_display).length} without`);
  
  return { normalizedMotors: results, errors, skipReasons };
}

// Simple HTML table parser focused on Mercury price list format
function parseHTMLTables(html: string) {
  const tables = [];
  
  // Extract table elements using regex (simple approach for Mercury price list)
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  let tableMatch;
  
  while ((tableMatch = tableRegex.exec(html)) !== null) {
    const tableContent = tableMatch[1];
    const rows = [];
    
    // Extract rows
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch;
    
    while ((rowMatch = rowRegex.exec(tableContent)) !== null) {
      const rowContent = rowMatch[1];
      const cells = [];
      
      // Extract cells (th or td)
      const cellRegex = /<(?:th|td)[^>]*>([\s\S]*?)<\/(?:th|td)>/gi;
      let cellMatch;
      
      while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
        const cellText = cellMatch[1]
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .trim();
        cells.push(cellText);
      }
      
      if (cells.length > 0) {
        rows.push(cells);
      }
    }
    
    if (rows.length > 3) { // Only consider tables with meaningful data
      // Score table based on content
      let score = rows.length * 10;
      const allText = rows.flat().join(' ').toLowerCase();
      
      if (allText.includes('mercury') || allText.includes('fourstroke')) score += 50;
      if (allText.includes('price') || allText.includes('our price')) score += 30;
      if (allText.includes('model')) score += 20;
      
      tables.push({
        headers: rows[0] || [],
        rows: rows.length,
        cols: Math.max(...rows.map(r => r.length)),
        score: score,
        data: rows
      });
    }
  }
  
  return tables.sort((a, b) => b.score - a.score);
}

// Column mapping for Mercury price list with safety fallbacks
function getColumnMapping(headers: string[]) {
  const mapping = {
    model_number: 0,  // Default to first column
    model_description: 1, // Default to second column (raw description)
    dealer_price: 2   // Default to third column
  };
  
  headers.forEach((header, index) => {
    const lowerHeader = header.toLowerCase();
    
    if (lowerHeader.includes('model') && lowerHeader.includes('#')) {
      mapping.model_number = index; // Model # column
    } else if (lowerHeader.includes('description') || lowerHeader.includes('model name') || 
               (lowerHeader.includes('model') && !lowerHeader.includes('#'))) {
      mapping.model_description = index; // Description/Model column
    } else if (lowerHeader.includes('price') || lowerHeader.includes('our price')) {
      mapping.dealer_price = index; // Price column
    }
  });
  
  console.log(`[PriceList] Column mapping: model_number=${mapping.model_number}, model_description=${mapping.model_description}, dealer_price=${mapping.dealer_price}`);
  return mapping;
}

// Extract data from table using column mapping with safety
function extractTableData(table: any, columnMapping: any) {
  const results = [];
  const skipReasons = new Map();
  
  // Skip header row
  for (let i = 1; i < table.data.length; i++) {
    const row = table.data[i];
    
    if (row.length < 2) {
      skipReasons.set('insufficient_columns', (skipReasons.get('insufficient_columns') || 0) + 1);
      continue;
    }
    
    const dataRow = {
      model_number: (row[columnMapping.model_number] || '').trim(),
      model_display_raw: (row[columnMapping.model_description] || '').trim(), 
      dealer_price: (row[columnMapping.dealer_price] || '').trim()
    };
    
    // Only include rows with meaningful data
    if (!dataRow.model_number) {
      skipReasons.set('missing_model_number', (skipReasons.get('missing_model_number') || 0) + 1);
    } else if (!dataRow.model_display_raw) {
      skipReasons.set('missing_model_display_raw', (skipReasons.get('missing_model_display_raw') || 0) + 1);
    } else if (!dataRow.dealer_price) {
      skipReasons.set('missing_dealer_price', (skipReasons.get('missing_dealer_price') || 0) + 1);
    } else {
      results.push(dataRow);
    }
  }
  
  console.log(`[PriceList] Extraction skip reasons: ${JSON.stringify(Object.fromEntries(skipReasons))}`);
  return results;
}