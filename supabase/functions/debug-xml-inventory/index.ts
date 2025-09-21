import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[XML-DEBUG] Starting comprehensive XML analysis...');

    // Phase 1: Download complete XML feed
    const xmlUrl = 'https://www.harrisboatworks.ca/unitinventory_univ.xml';
    const response = await fetch(xmlUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch XML: ${response.status} ${response.statusText}`);
    }

    const xmlText = await response.text();
    console.log(`[XML-DEBUG] Downloaded XML, size: ${xmlText.length} characters`);

    // Phase 2: Basic structure analysis
    const analysis = {
      xmlSize: xmlText.length,
      totalItems: 0,
      itemPatterns: {} as Record<string, number>,
      vinSearchResults: {} as Record<string, any>,
      mercuryAnalysis: {
        totalMentions: 0,
        itemsWithMercury: [],
        fieldVariations: {} as Record<string, number>
      },
      fieldDiscovery: {
        manufacturerFields: [] as string[],
        conditionFields: [] as string[],
        modelFields: [] as string[],
        stockFields: [] as string[]
      },
      sampleItems: [] as any[]
    };

    // Test different item patterns
    const itemPatterns = ['<item>', '<unit>', '<vehicle>', '<inventory>', '<motor>'];
    for (const pattern of itemPatterns) {
      const count = (xmlText.match(new RegExp(pattern, 'gi')) || []).length;
      analysis.itemPatterns[pattern] = count;
      if (count > analysis.totalItems) {
        analysis.totalItems = count;
      }
    }

    console.log(`[XML-DEBUG] Item patterns found:`, analysis.itemPatterns);

    // Phase 3: Search for specific VINs we know exist
    const testVINs = ['1R225251', '1R197489', '3B428386', '3B426668'];
    
    for (const vin of testVINs) {
      const vinIndex = xmlText.indexOf(vin);
      if (vinIndex >= 0) {
        console.log(`[XML-DEBUG] FOUND VIN ${vin} at position ${vinIndex}`);
        
        // Extract the item containing this VIN
        const itemStart = Math.max(0, vinIndex - 1000);
        const itemEndSearch = xmlText.indexOf('</item>', vinIndex);
        const itemEnd = itemEndSearch > 0 ? itemEndSearch + 7 : Math.min(xmlText.length, vinIndex + 1000);
        const itemXml = xmlText.substring(itemStart, itemEnd);
        
        analysis.vinSearchResults[vin] = {
          found: true,
          position: vinIndex,
          xmlSnippet: itemXml.substring(0, 2000) // First 2000 chars of item
        };
      } else {
        console.log(`[XML-DEBUG] MISSING VIN ${vin} - NOT in XML!`);
        analysis.vinSearchResults[vin] = { found: false };
      }
    }

    // Phase 4: Mercury analysis - find all mentions
    const mercuryRegex = /mercury/gi;
    const mercuryMatches = xmlText.match(mercuryRegex) || [];
    analysis.mercuryAnalysis.totalMentions = mercuryMatches.length;

    console.log(`[XML-DEBUG] Found ${analysis.mercuryAnalysis.totalMentions} Mercury mentions`);

    // Phase 5: Extract sample items for analysis
    const itemRegex = /<item[^>]*>(.*?)<\/item>/gs;
    let match;
    let itemCount = 0;
    
    while ((match = itemRegex.exec(xmlText)) !== null && itemCount < 10) {
      const itemXml = match[1];
      const isMercury = /mercury/i.test(itemXml);
      
      // Parse key fields from this item
      const item = {
        isMercury,
        rawXml: itemXml.substring(0, 1000), // First 1000 chars
        fields: {} as Record<string, string>
      };

      // Extract common field patterns
      const fieldPatterns = [
        'make', 'manufacturer', 'brand',
        'model', 'model_name', 'title', 'description',
        'condition', 'usage', 'status', 'new',
        'stocknumber', 'stock_number', 'vin', 'serial',
        'price', 'msrp', 'year'
      ];

      for (const field of fieldPatterns) {
        const fieldRegex = new RegExp(`<${field}[^>]*>([^<]*)<\/${field}>`, 'i');
        const fieldMatch = itemXml.match(fieldRegex);
        if (fieldMatch) {
          item.fields[field] = fieldMatch[1].trim();
        }
      }

      analysis.sampleItems.push(item);
      
      if (isMercury) {
        analysis.mercuryAnalysis.itemsWithMercury.push(item);
        
        // Track field variations for Mercury items
        for (const [field, value] of Object.entries(item.fields)) {
          if (value) {
            const key = `${field}:${value}`;
            analysis.mercuryAnalysis.fieldVariations[key] = (analysis.mercuryAnalysis.fieldVariations[key] || 0) + 1;
          }
        }
      }

      itemCount++;
    }

    // Phase 6: Field discovery - find all unique field names
    const fieldNameRegex = /<([a-zA-Z_][a-zA-Z0-9_-]*)[^>]*>/g;
    const allFields = new Set<string>();
    
    let fieldMatch;
    while ((fieldMatch = fieldNameRegex.exec(xmlText)) !== null) {
      allFields.add(fieldMatch[1].toLowerCase());
    }

    // Categorize fields
    for (const field of allFields) {
      if (/make|manufacturer|brand|company/.test(field)) {
        analysis.fieldDiscovery.manufacturerFields.push(field);
      }
      if (/condition|usage|status|new|used/.test(field)) {
        analysis.fieldDiscovery.conditionFields.push(field);
      }
      if (/model|name|title|description/.test(field)) {
        analysis.fieldDiscovery.modelFields.push(field);
      }
      if (/stock|vin|serial|id|number/.test(field)) {
        analysis.fieldDiscovery.stockFields.push(field);
      }
    }

    console.log('[XML-DEBUG] Analysis complete:', {
      totalItems: analysis.totalItems,
      mercuryMentions: analysis.mercuryAnalysis.totalMentions,
      mercuryItems: analysis.mercuryAnalysis.itemsWithMercury.length,
      vinsFound: Object.keys(analysis.vinSearchResults).filter(vin => analysis.vinSearchResults[vin].found).length
    });

    // Phase 7: Generate recommendations
    const recommendations = [];
    
    if (analysis.mercuryAnalysis.totalMentions > analysis.mercuryAnalysis.itemsWithMercury.length) {
      recommendations.push("Mercury mentions found but not properly parsed - check item boundaries");
    }
    
    if (Object.values(analysis.vinSearchResults).some(v => v.found)) {
      recommendations.push("Some VINs found in XML - parsing logic may be filtering them out");
    } else {
      recommendations.push("No test VINs found - XML feed may be incomplete or different endpoint needed");
    }
    
    if (analysis.mercuryAnalysis.itemsWithMercury.length > 0) {
      recommendations.push("Mercury items exist - check condition/status filtering logic");
    }

    return new Response(JSON.stringify({
      success: true,
      analysis,
      recommendations,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[XML-DEBUG] Analysis failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});