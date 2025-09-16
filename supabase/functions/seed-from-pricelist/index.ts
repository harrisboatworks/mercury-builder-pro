import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  let currentStep = 'init';
  let debugInfo = {
    rows_found: 0,
    rows_parsed: 0,
    rowErrors: [],
    first_bad_row: null,
    samples: []
  };

  try {
    // Quick connectivity sanity route (temporary)
    const requestBody = await req.json().catch(() => ({}));
    
    if (requestBody && requestBody.ping === true) {
      console.log('[PriceList] Ping request received');
      return new Response(JSON.stringify({ 
        success: true, 
        step: 'ping', 
        message: 'pong' 
      }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { dry_run: dryRunIn = true, msrp_markup: msrpMarkupIn, url: urlIn } = requestBody;
    const dry_run = Boolean(dryRunIn);
    const effectiveMarkup = Number(msrpMarkupIn ?? 1.1);
    const priceListUrl = urlIn?.trim() || 'https://www.harrisboatworks.ca/mercurypricelist';
    
    console.log(`[PriceList] Starting seed process: dry_run=${dry_run}, msrpMarkup=${effectiveMarkup}, url=${priceListUrl}`);
    
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
      return new Response(JSON.stringify({
        success: false,
        step: currentStep,
        error: 'No tables found in HTML',
        detail: 'HTML parsing found no table elements',
        debugInfo
      }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
      return new Response(JSON.stringify({
        success: false,
        step: currentStep,
        error: 'No data rows extracted from table',
        detail: 'Table parsing found no data rows after header detection',
        debugInfo
      }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Step 3: Normalize data
    currentStep = 'normalize';
    console.log(`[PriceList] HTML parsing found ${rawRows.length} rows`);
    console.log(`[PriceList] DEBUG: Starting normalization of ${rawRows.length} raw rows`);
    
    const { normalizedMotors, errors, skipReasons } = normalizeMotorData(rawRows, effectiveMarkup);
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
    console.log(`[PriceList] source=${priceListUrl.toUpperCase()} rows_found=${rawRows.length} rows_normalized=${normalizedMotors.length} rows_deduplicated=${deduplicatedMotors.length}`);
    
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
      model_display: m.model_display,
      rigging_code: m.rigging_code,
      accessories_included: m.accessories_included,
      dealer_price: m.dealer_price,
      msrp: m.msrp
    }));
    
    if (dry_run) {
      console.log(`[PriceList] Dry run complete - no database changes made`);
      return new Response(JSON.stringify({
        success: true,
        step: 'dry_run_complete',
        rows_found_raw: rawRows.length,
        rows_parsed: normalizedMotors.length,
        rows_created: deduplicatedMotors.length,
        rows_updated: 0,
        sample_created: debugInfo.samples,
        rows_skipped_by_reason: Object.fromEntries(allSkipReasons),
        top_skip_reasons: Array.from(allSkipReasons.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5),
        rowErrors: debugInfo.rowErrors,
        snapshot_url: `View Saved HTML: ${jsonPath}`
      }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Step 4: Upsert to database
    currentStep = 'upsert';
    console.log(`[PriceList] Upserting ${deduplicatedMotors.length} motors to database...`);
    
    const batchSize = 25; // Smaller batches for better error isolation
    let created = 0;
    let updated = 0;
    let failed = 0;
    const batchErrors = [];
    
    for (let i = 0; i < deduplicatedMotors.length; i += batchSize) {
      const batch = deduplicatedMotors.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      
      try {
        // Clean batch data - remove any undefined values
        const cleanBatch = batch.map(motor => {
          const cleaned = { ...motor };
          // Remove undefined values and ensure numeric fields are proper types
          Object.keys(cleaned).forEach(key => {
            if (cleaned[key] === undefined) {
              delete cleaned[key];
            }
            // Ensure numeric fields are numbers
            if (['horsepower', 'dealer_price', 'base_price', 'sale_price', 'msrp', 'year'].includes(key)) {
              if (cleaned[key] !== null && cleaned[key] !== undefined) {
                cleaned[key] = Number(cleaned[key]) || null;
              }
            }
          });
          return cleaned;
        });
        
        console.log(`[PriceList] Batch ${batchNum} sample record: ${JSON.stringify(cleanBatch[0], null, 2)}`);
        
        const { data, error } = await supabase
          .from('motor_models')
          .upsert(cleanBatch, {
            onConflict: 'model_number',
            ignoreDuplicates: false
          })
          .select('id, model_number');
        
        if (error) {
          console.error(`[PriceList] Batch ${batchNum} error:`, error);
          batchErrors.push({
            batch: batchNum,
            error: error.message,
            code: error.code,
            details: error.details,
            sample_record: cleanBatch[0]
          });
          failed += batch.length;
        } else {
          console.log(`[PriceList] Batch ${batchNum} success: ${data?.length || 0} records upserted`);
          created += data?.length || 0;
        }
      } catch (batchError) {
        console.error(`[PriceList] Batch ${batchNum} exception:`, batchError);
        batchErrors.push({
          batch: batchNum,
          error: batchError.message,
          sample_record: batch[0]
        });
        failed += batch.length;
      }
    }
    
    console.log(`[PriceList] Database upsert complete: ${created} created, ${updated} updated, ${failed} failed`);
    console.log(`[PriceList] Process complete: { success: ${failed === 0}, found: ${rawRows.length}, parsed: ${normalizedMotors.length}, created: ${created}, updated: ${updated} }`);
    
    if (batchErrors.length > 0) {
      console.error(`[PriceList] Batch errors encountered:`, batchErrors);
    }
    
    return new Response(JSON.stringify({
      success: failed === 0,
      step: failed === 0 ? 'complete' : 'upsert_failed',
      rows_found_raw: rawRows.length,
      rows_parsed: normalizedMotors.length,
      rows_created: created,
      rows_updated: updated,
      rows_failed: failed,
      sample_created: debugInfo.samples,
      rows_skipped_by_reason: Object.fromEntries(allSkipReasons),
      top_skip_reasons: Array.from(allSkipReasons.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5),
      rowErrors: debugInfo.rowErrors,
      batchErrors: batchErrors.slice(0, 5), // First 5 batch errors for debugging
      snapshot_url: `View Saved HTML: ${jsonPath}`
    }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error(`[PriceList] Error at step ${currentStep}:`, error);
    return new Response(JSON.stringify({
      success: false,
      step: currentStep,
      error: error.message,
      detail: `Exception during ${currentStep}`,
      stack: error.stack,
      debugInfo
    }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Parse Mercury model codes and descriptions with error handling
function normalizeMotorData(rawRows: any[], msrpMarkup: number) {
  const markup = Number(msrpMarkup) > 0 ? Number(msrpMarkup) : 1.1;
  const results = [];
  const errors = [];
  const skipReasons = new Map();
  
  for (let i = 0; i < rawRows.length; i++) {
    try {
      const row = rawRows[i];
      const modelNumber = (row.model_number || '').trim();
      const description = (row.model_display || '').trim();
      
      // Parse dealer price - remove $, commas, and convert to number
      const priceStr = (row.dealer_price || '').toString().replace(/[$,]/g, '').trim();
      const dealerPrice = parseFloat(priceStr) || 0;
      
      // Enhanced validation with skip tracking
      if (!modelNumber) {
        skipReasons.set('empty_model_number', (skipReasons.get('empty_model_number') || 0) + 1);
        errors.push({ row_index: i, error: 'Empty model number', data: row });
        continue;
      }
      if (!description) {
        skipReasons.set('empty_description', (skipReasons.get('empty_description') || 0) + 1);
        errors.push({ row_index: i, error: 'Empty description', data: row });
        continue;
      }
      if (dealerPrice <= 0) {
        skipReasons.set('invalid_price', (skipReasons.get('invalid_price') || 0) + 1);
        errors.push({ row_index: i, error: `Invalid price: ${priceStr} -> ${dealerPrice}`, data: row });
        continue;
      }
      
      // Parse Mercury model from description (e.g., "25MH FourStroke †‡")
      const descriptionClean = description.replace(/[†‡]/g, '').trim();
      
      // Extract accessories from symbols
      const accessories = [];
      if (description.includes('†')) accessories.push('Propeller Included');
      if (description.includes('‡')) accessories.push('Fuel Tank Included');
      
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
        if (part.match(/^\d+(\.\d+)?\w*$/)) {
          mercuryModelNo = part;
          const hpMatch = part.match(/^(\d+(?:\.\d+)?)/);
          if (hpMatch) {
            horsepower = parseFloat(hpMatch[1]);
          }
          break;
        }
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
      
      // Generate clean model display: [Horsepower] [Rigging Codes] [Family]
      let modelDisplay = '';
      if (horsepower) {
        modelDisplay += `${horsepower} `;
      }
      if (riggingCodes) {
        modelDisplay += riggingCodes + ' ';
      }
      if (family) {
        modelDisplay += family;
      }
      modelDisplay = modelDisplay.trim();
      
      // Generate unique model_key with model_number as primary identifier
      const modelKey = [
        modelNumber,
        horsepower || '',
        riggingCodes || '',
        family || ''
      ].filter(Boolean).join('-').toLowerCase().replace(/[^a-z0-9.-]/g, '');
      
      const result = {
        // Mercury identifiers
        model_number: modelNumber, // Official Mercury model number (1F02201KK, etc.)
        mercury_model_no: mercuryModelNo, // Parsed model (25MH, etc.)
        
        // Display and description
        display_name: modelDisplay,
        model: family || 'Outboard', 
        model_key: modelKey,
        
        // Technical specs
        family: family,
        horsepower: horsepower,
        rigging_code: riggingDescription,
        accessories_included: accessories,
        
        // Pricing
        dealer_price: dealerPrice,
        base_price: dealerPrice,
        sale_price: dealerPrice,
        msrp: Math.round(dealerPrice * markup),
        
        // Source tracking
        price_source: 'harris_pricelist',
        msrp_source: 'calculated',
        msrp_calc_source: `dealer_price * ${markup}`,
        
        // Database required fields
        make: 'Mercury',
        motor_type: family || 'Outboard',
        year: 2025,
        is_brochure: true,
        in_stock: false,
        availability: 'Brochure',
        fuel_type: '',
        
        // Debug info
        raw_cells: [row.model_number, row.model_display, row.dealer_price]
      };
      
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
    model_display: 1, // Default to second column  
    dealer_price: 2   // Default to third column
  };
  
  headers.forEach((header, index) => {
    const lowerHeader = header.toLowerCase();
    
    if (lowerHeader.includes('model') && lowerHeader.includes('#')) {
      mapping.model_number = index; // Model # column
    } else if (lowerHeader.includes('description') || lowerHeader.includes('model')) {
      mapping.model_display = index; // Description/Model column
    } else if (lowerHeader.includes('price') || lowerHeader.includes('our price')) {
      mapping.dealer_price = index; // Price column
    }
  });
  
  console.log(`[PriceList] Column mapping: model_number=${mapping.model_number}, model_display=${mapping.model_display}, dealer_price=${mapping.dealer_price}`);
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
      model_display: (row[columnMapping.model_display] || '').trim(), 
      dealer_price: (row[columnMapping.dealer_price] || '').trim()
    };
    
    // Only include rows with meaningful data
    if (!dataRow.model_number) {
      skipReasons.set('missing_model_number', (skipReasons.get('missing_model_number') || 0) + 1);
    } else if (!dataRow.model_display) {
      skipReasons.set('missing_model_display', (skipReasons.get('missing_model_display') || 0) + 1);
    } else if (!dataRow.dealer_price) {
      skipReasons.set('missing_dealer_price', (skipReasons.get('missing_dealer_price') || 0) + 1);
    } else {
      results.push(dataRow);
    }
  }
  
  console.log(`[PriceList] Extraction skip reasons: ${JSON.stringify(Object.fromEntries(skipReasons))}`);
  return results;
}