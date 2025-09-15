import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Shared model key utility (copied to avoid cross-function imports)
function buildModelKey(input: string): string {
  if (!input) return '';
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

  // pull HP and trailing rigging code
  // ex: "25HP EFI ELHPT", "90 HP ELPT", "150 ProXS XL"
  const hpMatch = s.match(/\b(\d+(\.\d+)?)\s*hp\b/i);
  const hp = hpMatch ? `${hpMatch[1]}HP` : '';
  s = s.replace(/\b(\d+(\.\d+)?)\s*hp\b/ig, '').trim();

  // rigging/code tokens: ELHPT, ELPT, XL, EXLPT, CT, DTS, etc.
  const codeTokens: string[] = [];
  const tokenRx = /\b(ELHPT|ELPT|ELO|ELH|EH|XL|XXL|EXLPT|L|CL|CT|DTS|TILLER|JPO|DIGITAL|POWER STEERING)\b/ig;
  let m;
  while ((m = tokenRx.exec(s)) !== null) codeTokens.push(m[1].toUpperCase());

  // family tokens (one of)
  const fam = (s.match(/\b(FourStroke|ProXS|SeaPro|Verado|Racing)\b/i)?.[1]) || '';

  // rebuild normalized display to then key it
  const parts = [fam, hp, 'EFI'].filter(Boolean).concat(codeTokens);
  const normalized = parts.join('-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized.toUpperCase();
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
        attrs.horsepower ? `${attrs.horsepower}HP` : '',
        attrs.fuel_type || '',
        attrs.ct ? 'CT' : '',
        attrs.shaft || '',
        attrs.control || ''
      ].filter(Boolean).join(' ');
      
      const model_key = buildModelKey(modelDisplay || item.model_number);
      
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
    
    if (dry_run) {
      return new Response(JSON.stringify({
        success: true,
        dry_run: true,
        rows_parsed: priceData.length,
        rows_created: motorModels.length,
        preview: motorModels.slice(0, 5)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Upsert to database
    const supabase = await getServiceClient();
    const { data, error } = await supabase
      .from('motor_models')
      .upsert(motorModels, { onConflict: 'model_key' });
    
    if (error) {
      console.error('Database upsert error:', error);
      throw error;
    }
    
    console.log(`Successfully upserted ${motorModels.length} motor models`);
    
    return new Response(JSON.stringify({
      success: true,
      rows_parsed: priceData.length,
      rows_created: motorModels.length,
      rows_updated: 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in seed-from-pricelist:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});