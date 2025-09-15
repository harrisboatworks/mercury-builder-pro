import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Enhanced model key utility with better specificity
function buildModelKey(modelDisplay: string, modelCode?: string, attrs?: any): string {
  if (!modelDisplay && !modelCode) return '';
  
  const input = modelDisplay || modelCode || '';
  let s = input
    // strip HTML & odd chars
    .replace(/<[^>]*>/g, ' ')
    .replace(/[()]/g, ' ')
    // remove year tokens
    .replace(/\b20\d{2}\b/g, ' ')
    // normalize family names
    .replace(/\bfour[\s-]*stroke\b/ig, 'FourStroke')
    .replace(/\bpro[\s-]*xs\b/ig, 'ProXS')
    .replace(/\bsea[\s-]*pro\b/ig, 'SeaPro')
    .replace(/\bverado\b/ig, 'Verado')
    .replace(/\bracing\b/ig, 'Racing')
    // normalize EFI
    .replace(/\befi\b/ig, 'EFI')
    // coalesce whitespace
    .replace(/\s+/g, ' ')
    .trim();

  // Extract components for more specific keys
  const hpMatch = s.match(/\b(\d+(\.\d+)?)\s*hp\b/i);
  const hp = hpMatch ? `${hpMatch[1]}HP` : '';
  
  // Extract family
  const famMatch = s.match(/\b(FourStroke|ProXS|SeaPro|Verado|Racing)\b/i);
  const family = famMatch ? famMatch[1] : (attrs?.family || 'FourStroke');
  
  // Extract shaft length with priority order
  let shaft = '';
  if (/XXXL/i.test(s)) shaft = 'XXXL';
  else if (/XXL/i.test(s)) shaft = 'XXL'; 
  else if (/\bXL\b/i.test(s)) shaft = 'XL';
  else if (/\bL\b/i.test(s)) shaft = 'L';
  else if (/\bS\b/i.test(s)) shaft = 'S';
  else if (attrs?.shaft) shaft = attrs.shaft;
  
  // Extract control type
  let control = '';
  if (/TILLER/i.test(s)) control = 'TILLER';
  else if (/DTS/i.test(s)) control = 'DTS';
  else if (/ELHPT/i.test(s)) control = 'ELHPT';
  else if (/ELPT/i.test(s)) control = 'ELPT';
  else if (/ELH/i.test(s)) control = 'ELH';
  else if (/ELO/i.test(s)) control = 'ELO';
  else if (attrs?.control) control = attrs.control;
  
  // Extract special features
  const ct = /\bCT\b/i.test(s) || attrs?.ct;
  const jet = /JET/i.test(s) || attrs?.jet;
  
  // Build key components in priority order
  const keyParts = [
    family,
    hp,
    shaft,
    control,
    ct ? 'CT' : '',
    jet ? 'JET' : '',
    'EFI'
  ].filter(Boolean);
  
  // If we still don't have enough specificity, append model code suffix
  let key = keyParts.join('-');
  if (modelCode && modelCode !== modelDisplay) {
    // Take last 3-4 chars of model code for additional uniqueness
    const codeSuffix = modelCode.slice(-4).replace(/[^A-Z0-9]/g, '');
    if (codeSuffix) key += `-${codeSuffix}`;
  }
  
  return key.toUpperCase().replace(/-+/g, '-').replace(/^-|-$/g, '');
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

// Lazy initialize Supabase client
async function getServiceClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!url || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  return createClient(url, serviceKey);
}

// Clean text function
function cleanText(s?: string | null): string {
  if (!s) return '';
  return s
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;|&amp;|&lt;|&gt;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Parse model attributes from code/description
function parseModelFromText(code: string, description: string = '') {
  const text = `${code} ${description}`.toUpperCase();
  
  // Extract HP
  const hpMatch = text.match(/(?<!\d)(\d{1,3}(?:\.\d)?)\s*HP?/);
  const horsepower = hpMatch ? Number(hpMatch[1]) : null;
  
  // Determine family
  let family = 'FourStroke';
  if (/PRO\s*XS/i.test(text)) family = 'ProXS';
  else if (/SEAPRO/i.test(text)) family = 'SeaPro';
  else if (/VERADO/i.test(text)) family = 'Verado';
  else if (/RACING/i.test(text)) family = 'Racing';
  
  // Extract model code attributes
  const shaft = /XXXL/.test(text) ? 'XXXL' :
                /XXL/.test(text) ? 'XXL' :
                /XL/.test(text) ? 'XL' :
                /\bL\b/.test(text) ? 'L' :
                /\bS\b/.test(text) ? 'S' : null;
  
  const control = /TILLER/i.test(text) ? 'Tiller' :
                  /DTS/.test(text) ? 'DTS' :
                  /MECH|ELPT|ELH/.test(text) ? 'Mech' : null;
  
  const fuel_type = /EFI/.test(text) ? 'EFI' : '';
  const ct = /\bCT\b/.test(text);
  const jet = /JET/.test(text);
  
  return {
    horsepower,
    family,
    shaft,
    control,
    fuel_type,
    ct,
    jet
  };
}

// Parse different file formats
async function parsePriceListData(url?: string, content?: string): Promise<Array<{model_number: string, description?: string, price: number}>> {
  let text = '';
  
  if (url) {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'HBW-InventoryBot/1.0' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    text = await response.text();
  } else if (content) {
    text = content;
  } else {
    throw new Error('Either url or content must be provided');
  }
  
  // Try CSV/TSV first
  const looksCSV = /[,;\t]\s*\d/.test(text) || /^"?[A-Za-z0-9-]+/.test(text);
  if (looksCSV) {
    const lines = text.split(/\r?\n/).filter(Boolean);
    const rows = lines.map(l => l.split(/,\s*|\t|;\s*/));
    
    const results: any[] = [];
    for (const cols of rows) {
      const joined = cols.join(' ');
      const priceMatch = joined.match(/(\$?\d[\d,]*\.?\d*)/);
      const price = priceMatch ? Number(priceMatch[1].replace(/[^\d.]/g, '')) : 0;
      const code = (cols[0] || '').trim();
      const desc = (cols[1] || '').trim();
      
      if (code && price > 0) {
        results.push({ model_number: code, description: desc, price });
      }
    }
    if (results.length) return results;
  }
  
  // Fallback: parse HTML table
  const table = text.match(/<table[\s\S]*?<\/table>/i)?.[0] || '';
  const trs = [...table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map(m => m[1]);
  const results: any[] = [];
  
  for (const tr of trs) {
    const tds = [...tr.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(m => cleanText(m[1]));
    if (tds.length >= 2) {
      const code = tds[0];
      const desc = tds[1];
      const priceStr = (tds[2] || desc);
      const priceMatch = priceStr.match(/\$?\s*\d[\d,]*\.?\d*/);
      const price = priceMatch ? Number(priceMatch[0].replace(/[^\d.]/g, '')) : 0;
      
      if (code && price > 0) {
        results.push({ model_number: code, description: desc, price });
      }
    }
  }
  
  return results;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { url, content, msrp_markup = 1.10, dry_run = false } = await req.json();
    
    console.log('Parsing price list data...');
    const priceData = await parsePriceListData(url, content);
    console.log(`Parsed ${priceData.length} price entries`);
    
    if (priceData.length === 0) {
      throw new Error('No valid price data found');
    }
    
    // Transform to motor models format
    const motorModels = priceData.map(item => {
      const attrs = parseModelFromText(item.model_number, item.description);
      const dealer_price = item.price;
      const msrp = Math.round((dealer_price * msrp_markup) * 100) / 100;
      
      const modelDisplay = [
        attrs.family !== 'FourStroke' ? attrs.family : '',
        attrs.horsepower ? `${attrs.horsepower}HP` : '',
        attrs.fuel_type || 'EFI',
        attrs.ct ? 'CT' : '',
        attrs.shaft || '',
        attrs.control || ''
      ].filter(Boolean).join(' ');
      
      const model_key = buildModelKey(modelDisplay, item.model_number, attrs);
      
      return {
        make: 'Mercury',
        family: attrs.family,
        model: modelDisplay || (item.description || item.model_number),
        model_code: item.model_number,
        model_key,
        year: 2025,
        horsepower: attrs.horsepower,
        fuel_type: attrs.fuel_type,
        motor_type: attrs.family,
        shaft: attrs.shaft,
        control: attrs.control,
        dealer_price,
        msrp,
        msrp_source: `derived:+${Math.round((msrp_markup - 1) * 100)}%`,
        price_source: 'pricelist',
        is_brochure: true,
        in_stock: false,
        availability: 'Brochure',
        spec_json: { ct: !!attrs.ct, jet: !!attrs.jet },
        last_scraped: new Date().toISOString(),
        inventory_source: 'pricelist'
      };
    });
    
    // Deduplication logic: Group by model_key and pick best row for each key
    const keyGroups = new Map<string, any[]>();
    const duplicateKeys: string[] = [];
    
    for (const model of motorModels) {
      if (!keyGroups.has(model.model_key)) {
        keyGroups.set(model.model_key, []);
      }
      keyGroups.get(model.model_key)!.push(model);
    }
    
    // Log duplicates for debugging
    for (const [key, models] of keyGroups) {
      if (models.length > 1) {
        duplicateKeys.push(key);
        console.log(`Duplicate model_key "${key}" found for:`, models.map(m => ({
          code: m.model_code,
          model: m.model,
          hp: m.horsepower,
          shaft: m.shaft,
          control: m.control
        })));
      }
    }
    
    // Pick best representative for each key (prefer higher HP, then model with more details)
    const deduplicatedModels = Array.from(keyGroups.values()).map(group => {
      if (group.length === 1) return group[0];
      
      // Sort by: higher HP first, then more detailed model name, then model_code
      return group.sort((a, b) => {
        if (a.horsepower !== b.horsepower) return (b.horsepower || 0) - (a.horsepower || 0);
        if (a.model.length !== b.model.length) return b.model.length - a.model.length;
        return (a.model_code || '').localeCompare(b.model_code || '');
      })[0];
    });
    
    console.log(`Processed ${motorModels.length} models, deduplicated to ${deduplicatedModels.length}`);
    if (duplicateKeys.length > 0) {
      console.log(`Resolved ${duplicateKeys.length} duplicate model_keys:`, duplicateKeys.slice(0, 10));
    }
    
    if (dry_run) {
      return new Response(JSON.stringify({
        success: true,
        dry_run: true,
        rows_parsed: priceData.length,
        rows_created: deduplicatedModels.length,
        duplicates_resolved: duplicateKeys.length,
        preview: deduplicatedModels.slice(0, 5).map(m => ({
          model_key: m.model_key,
          model: m.model,
          model_code: m.model_code,
          hp: m.horsepower
        }))
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Validate no duplicate model_keys before upsert
    const finalKeys = new Set();
    const stillDuplicateKeys = [];
    for (const model of deduplicatedModels) {
      if (finalKeys.has(model.model_key)) {
        stillDuplicateKeys.push(model.model_key);
      }
      finalKeys.add(model.model_key);
    }
    
    if (stillDuplicateKeys.length > 0) {
      throw new Error(`Still have duplicate model_keys after deduplication: ${stillDuplicateKeys.join(', ')}`);
    }
    
    // Upsert to database
    const supabase = await getServiceClient();
    const { data, error } = await supabase
      .from('motor_models')
      .upsert(deduplicatedModels, { onConflict: 'model_key' });
    
    if (error) {
      console.error('Database upsert error:', error);
      throw error;
    }
    
    console.log(`Successfully upserted ${deduplicatedModels.length} motor models`);
    
    return new Response(JSON.stringify({
      success: true,
      rows_parsed: priceData.length,
      rows_created: deduplicatedModels.length,
      duplicates_resolved: duplicateKeys.length,
      rows_updated: 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in seed-from-pricelist:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      stage: 'processing',
      message: error.message,
      error: error.message,
      details: error
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});