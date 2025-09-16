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

function fail(step: string, err: unknown, extra: Record<string, unknown> = {}) {
  const msg = (err && (err as any).message) ? (err as any).message : String(err);
  const stack = (err && (err as any).stack) ? (err as any).stack : undefined;
  return new Response(JSON.stringify({ success: false, step, error: msg, stack, ...extra }), {
    status: 200,
    headers: corsHeaders
  });
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

    // Normalize inputs (NEVER crash here)
    const dry_run =
      typeof raw.dry_run === 'string'
        ? !['false', '0', 'no'].includes(raw.dry_run.trim().toLowerCase())
        : (raw.dry_run === undefined ? true : !!raw.dry_run);

    const msrp_markup =
      Number.isFinite(Number(raw.msrp_markup)) && Number(raw.msrp_markup) > 0
        ? Number(raw.msrp_markup)
        : 1.1;

    // Echo what we'll use (helps catch UI/body mismatches)
    const echo = { dry_run, msrp_markup };

    // Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Quick smoke test (optional)
    if (raw && raw.quick === true) {
      return ok({ success: true, step: 'quick', echo });
    }

    console.log(`[PriceList] Resolved flags: dry_run=${dry_run}, msrp_markup=${msrp_markup}`);
    
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
      
      if (dry_run) {
        console.log(`[PriceList] Dry run complete - no database changes made`);
        return ok({
          success: true,
          step: 'dry_run_complete',
          dry_run: true,
          rows_found_raw: rawRows.length,
          rows_parsed: normalizedMotors.length,
          rows_created: deduplicatedMotors.length, // This is "would create" in dry run
          rows_updated: 0,
          sample_created: debugInfo.samples,
          rows_skipped_by_reason: Object.fromEntries(allSkipReasons),
          top_skip_reasons: Array.from(allSkipReasons.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5),
          rowErrors: debugInfo.rowErrors,
          snapshot_url: `View Saved HTML: ${jsonPath}`,
          echo
        });
      }
      
      // Step 4: Upsert to database with batch processing
      currentStep = 'upsert';
      console.log(`[PriceList] Upserting ${deduplicatedMotors.length} motors to database...`);
      
      // Process in batches and track results
      let totalCreated = 0, totalUpdated = 0;
      const batchErrors: Array<{batchNum: number, error: string}> = [];
      const rowErrors: Array<{row_index: number, reason: string}> = [];
      
      // Pre-validate rows before upsert
      const validMotors = [];
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
      
      // Process in batches of 50 for better performance
      for (let i = 0; i < validMotors.length; i += 50) {
        const batch = validMotors.slice(i, i + 50);
        const batchNum = Math.floor(i/50) + 1;
        
        console.log(`[Upsert] B${batchNum}: processing ${batch.length} records...`);
        
        try {
          // Use upsert with model_number as conflict target for brochure rows
          const { data, error } = await supabase
            .from('motor_models')
            .upsert(batch, {
              onConflict: 'model_number',
              ignoreDuplicates: false
            })
            .select('id, created_at, updated_at');
          
          if (error) {
            console.log(`[Upsert] B${batchNum}: ERROR - ${error.message}`);
            batchErrors.push({batchNum, error: error.message});
            continue;
          }
          
          // Count created vs updated based on timestamps
          const createdNow = data?.filter(r => r.created_at === r.updated_at).length || 0;
          const updatedNow = (data?.length || 0) - createdNow;
          
          totalCreated += createdNow;
          totalUpdated += updatedNow;
          
          console.log(`[Upsert] B${batchNum}: sending ${batch.length}, got rows=${data?.length || 0}, created=${createdNow}, updated=${updatedNow}`);
          
        } catch (err: any) {
          console.log(`[Upsert] B${batchNum}: EXCEPTION - ${err.message}`);
          batchErrors.push({batchNum, error: err.message});
        }
      }
      
      console.log(`[PriceList] Upsert complete: ${totalCreated} created, ${totalUpdated} updated, ${batchErrors.length} batch errors`);
      
      // Log sample payload for debugging
      if (validMotors.length >= 2) {
        console.log(`[PriceList] Sample batch payload (first 2 rows):`, JSON.stringify(validMotors.slice(0, 2), null, 2));
      }
      
      // Return clear final payload
      return ok({
        success: batchErrors.length === 0,
        step: 'complete',
        rows_found_raw: rawRows.length,
        rows_parsed: normalizedMotors.length,
        rows_created: totalCreated,
        rows_updated: totalUpdated,
        rowErrors: rowErrors.slice(0, 10), // First few row errors
        batchErrors: batchErrors.slice(0, 5), // First few batch errors
        echo
      });
      
    } catch (innerErr) {
      return fail('normalize_or_ingest', innerErr, { echo });
    }

  } catch (bootErr) {
    return fail('boot', bootErr);
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
          // Mercury identifiers - ALWAYS from first column for brochure rows
          model_number: modelNumber.trim(), // Official Mercury model number (1F02201KK, etc.)
          mercury_model_no: mercuryModelNo || '', // Parsed model (25MH, etc.)
          
          // Display and description - CRITICAL: include model_display for human-readable names
          model_display: finalModelDisplay, // Human-readable brochure text
          display_name: finalModelDisplay,
          model: family || 'Outboard', // Required field - fallback to Outboard
          model_key: modelKey,
          
          // Technical specs
          family: family || 'FourStroke', // Default to FourStroke if not detected
          horsepower: horsepower,
          rigging_code: riggingDescription,
          accessories_included: accessories,
          
          // Pricing - ensure numeric values
          dealer_price: dealerPrice,
          base_price: dealerPrice,
          sale_price: dealerPrice,
          msrp: msrp,
          
          // Source tracking
          price_source: 'harris_pricelist',
          msrp_source: 'calculated',
          msrp_calc_source: `dealer_price * ${msrp_markup}`,
          
          // Database required fields - ALWAYS SET FOR BROCHURE ROWS
          make: 'Mercury',
          motor_type: family || 'FourStroke', // Required field
          year: 2025,
          is_brochure: true, // CRITICAL: Must be true for all brochure rows
          in_stock: false,
          availability: 'Brochure', // CRITICAL: Must be 'Brochure' 
          fuel_type: 'EFI',
          
          // Required jsonb fields with defaults
          accessory_notes: [],
          features: [],
          specifications: {},
          
          // Timestamps - let database handle created_at, only update updated_at on conflict
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