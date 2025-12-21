// Shared HTML parsing helpers for pricing import functionality
// Used for consistent parsing across different import sources

// HTML entity decoder - uses DOMParser which doesn't execute scripts (XSS-safe)
function decodeEntities(str: string): string {
  const doc = new DOMParser().parseFromString(str, 'text/html');
  return doc.body.textContent || '';
}

// Parse HTML tables from the price list - Enhanced to detect multiple sections
export function parseHTMLTables(html: string) {
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
export function getColumnMapping(headers: string[]) {
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
export function extractTableData(table: any, columnMapping: Record<string, number>) {
  return table.rows.map((row: string[]) => ({
    model_number: row[columnMapping.model_number] || '',
    model_description: row[columnMapping.model_description] || '',
    dealer_price: row[columnMapping.dealer_price] || '0'
  }));
}

// Generate model key from mercury model number and model number for uniqueness
export function generateModelKey(mercuryModelNo: string, modelNumber: string, hp?: number, shaft?: string) {
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
export function parseMercuryModelNo(description: string): string {
  if (!description) return '';
  
  // Look for patterns like "25MH", "90ELPT", etc.
  const match = description.match(/(\d+(?:\.\d+)?[A-Z]{1,6})/);
  return match ? match[1] : '';
}

// Parse horsepower from description using improved patterns
export function parseHorsepower(description: string): number | null {
  if (!description) return null;
  
  // Look for HP patterns first (most specific)
  const hpMatch = description.match(/\b(\d+(?:\.\d+)?)\s*HP\b/i);
  if (hpMatch) return parseFloat(hpMatch[1]);
  
  // Look for leading numbers (common in Mercury model descriptions)
  const numMatch = description.match(/^(\d+(?:\.\d+)?)/);
  if (numMatch) return parseFloat(numMatch[1]);
  
  return null;
}

// Parse price with currency symbols
export function parsePrice(priceStr: string): number {
  if (!priceStr) return 0;
  const cleanPrice = priceStr.replace(/[$,\s]/g, '');
  return parseFloat(cleanPrice) || 0;
}

// Parse price list and return structured data - Enhanced for ProXS detection
export function parsePriceListFromHtml(html: string, msrpMarkup = 1.4) {
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
      const dealerPrice = parsePrice(row.dealer_price);
      
      const mercuryModelNo = parseMercuryModelNo(modelDescription);
      const horsepower = parseHorsepower(modelDescription);
      const modelKey = generateModelKey(mercuryModelNo, modelNumber, horsepower);
      
      // Determine family based on section and model description
      let family = null;
      if (table.section === 'proxs') {
        family = 'ProXS';
      } else if (table.section === 'fourstroke') {
        family = 'FourStroke';
      } else {
        // Auto-detect from model description
        const desc = modelDescription.toLowerCase();
        if (desc.includes('pro xs') || desc.includes('proxs')) {
          family = 'ProXS';
        } else if (desc.includes('fourstroke') || desc.includes('four stroke')) {
          family = 'FourStroke';
        } else if (desc.includes('verado')) {
          family = 'Verado';
        } else if (desc.includes('seapro')) {
          family = 'SeaPro';
        } else if (desc.includes('racing')) {
          family = 'Racing';
        }
      }
      
      console.log(`[PriceList] Row ${index + 1} from ${table.section}: "${modelDescription}" -> family: ${family} (dealer: ${dealerPrice}, hp: ${horsepower})`);
      
      return {
        model_number: modelNumber,
        model_display: modelDescription,
        model_key: modelKey,
        mercury_model_no: mercuryModelNo,
        dealer_price: dealerPrice,
        msrp: dealerPrice * msrpMarkup,
        horsepower: horsepower,
        family: family,
        year: 2025,
      };
    });
    
    allParsedRows.push(...parsedRows);
  }
  
  console.log(`[PriceList] Total processed rows from all sections: ${allParsedRows.length}`);
  return allParsedRows;
}