import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Motor data type
type Motor = {
  model_raw: string;
  model: string;        // cleaned: "2025 FourStroke 25HP EFI ELHPT"
  year?: number | null;
  motor_type?: string;  // FourStroke / ProXS / SeaPro / Verado / Racing
  horsepower?: number | null;
  fuel_type?: string;   // "EFI" or ""
  model_code?: string;  // EH / ELHPT / XL / EXLPT / ...
  sale_price?: number | null;
  msrp?: number | null;
  price_status?: 'listed'|'call_for_price'|'unknown';
  stock_number?: string | null;
  availability?: string | null;
  image_url?: string | null;        // final (Supabase) after upload
  original_image_url?: string | null;
  source_url: string;
}

// Clean text function
function cleanText(s?: string | null): string {
  if (!s) return '';
  return s
    .replace(/<[^>]*>/g, '')       // strip tags
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // strip markdown links
    .replace(/&nbsp;|&amp;|&lt;|&gt;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract detail URLs from listing page HTML
function extractDetailUrls(listHtml: string): string[] {
  const urls = new Set<string>();

  // 1) Anchor tags like: <a href="/inventory/...">
  const hrefRx = /href=["'](\/inventory\/[^"'?#]+)["']/gi;
  for (let m; (m = hrefRx.exec(listHtml)); ) {
    urls.add(`https://www.harrisboatworks.ca${m[1]}`);
  }

  // 2) JSON blobs like: "itemUrl":"//www.harrisboatworks.ca/inventory/..."
  const jsonUrlRx = /"itemUrl"\s*:\s*"((?:https?:)?\/\/www\.harrisboatworks\.ca\/inventory\/[^"']+)"/gi;
  for (let m; (m = jsonUrlRx.exec(listHtml)); ) {
    const u = m[1].startsWith('//') ? `https:${m[1]}` : m[1];
    urls.add(u);
  }

  // 3) Protocol-relative fallbacks: "//www.harrisboatworks.ca/inventory/..."
  const protoRelRx = /["'](\/\/www\.harrisboatworks\.ca\/inventory\/[^"']+)["']/gi;
  for (let m; (m = protoRelRx.exec(listHtml)); ) {
    urls.add(`https:${m[1]}`);
  }

  return [...urls];
}

// Collect all detail URLs from all pages
async function collectAllDetailUrls(fetchPage: (u: string) => Promise<string>) {
  const BASE = "https://www.harrisboatworks.ca/search/inventory/brand/Mercury";
  const all = new Set<string>();

  // crawl first 5 pages
  for (let p = 1; p <= 5; p++) {
    const url = p === 1 ? BASE : `${BASE}?page=${p}`;
    const html = await fetchPage(url);
    const pageUrls = extractDetailUrls(html);
    console.log(`Page ${p}/5: found ${pageUrls.length} detail URLs (total ${all.size + pageUrls.length})`);
    pageUrls.forEach((u, i) => { if (i < 3) console.log(`  • ${u}`); }); // sample first 3
    pageUrls.forEach(u => all.add(u));
  }

  // high-limit probe (to grab everything in one shot if supported)
  const probeHtml = await fetchPage(`${BASE}?limit=200`);
  const probeUrls = extractDetailUrls(probeHtml);
  probeUrls.forEach(u => all.add(u));
  console.log(`Limit=200 probe: found ${probeUrls.length} additional URLs, final total ${all.size}`);

  // Try alternate endpoints that may surface different inventory subsets
  const ALT_BASES = [
    "https://www.harrisboatworks.ca/search/inventory/availability/In%20Stock/brand/Mercury",
    "https://www.harrisboatworks.ca/search/inventory/sort/price-low/unit-engine-make/Mercury"
  ];

  for (const ALT of ALT_BASES) {
    for (let p = 1; p <= Math.min(5, 7); p++) {
      const url = p === 1 ? ALT : `${ALT}?page=${p}`;
      const html = await fetchPage(url);
      const pageUrls = extractDetailUrls(html);
      console.log(`[ALT] ${url} → ${pageUrls.length} URLs`);
      pageUrls.forEach(u => all.add(u));
    }
    const probeHtml = await fetchPage(ALT + (ALT.includes('?') ? '&' : '?') + 'limit=200');
    const altProbeUrls = extractDetailUrls(probeHtml);
    altProbeUrls.forEach(u => all.add(u));
    console.log(`[ALT] ${ALT} limit=200 probe → ${altProbeUrls.length} URLs`);
  }

  const urls = [...all];
  if (urls.length === 0) {
    throw new Error("No detail URLs found – check selectors/regex");
  }
  return urls;
}

// Parse price information from HTML
function parsePriceBlock(html: string) {
  const txt = cleanText(html);
  const call = /call\s*for\s*price/i.test(txt);
  
  const parseNum = (s: string) => {
    const m = s.replace(/[^0-9.]/g,'');
    return m ? parseFloat(m) : null;
  };
  
  const saleMatch = txt.match(/(On Sale|Sale|Now|Price)\s*\$?\s*([\d,]+\.?\d*|\d[\d,]*)/i);
  const msrpMatch = txt.match(/(MSRP|Was|Original|List)\s*\$?\s*([\d,]+\.?\d*|\d[\d,]*)/i);
  
  return {
    sale_price: call ? null : (saleMatch ? parseNum(saleMatch[2]) : null),
    msrp: msrpMatch ? parseNum(msrpMatch[2]) : null,
    price_status: call ? 'call_for_price' : (saleMatch ? 'listed' : 'unknown') as Motor['price_status']
  };
}

// Parse model fields from title
function parseModelFields(titleRaw: string) {
  const title = cleanText(titleRaw).replace(' - Mercury','');
  const parts = title.split(/\s+/);

  const year = parts.find(p => /^\d{4}$/.test(p));
  const type = parts.find(p => /^(FourStroke|ProXS|SeaPro|Verado|Racing)$/i.test(p));
  
  // Find horsepower token
  let hpIdx = -1, hpNum: number | null = null;
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (/^\d+(\.\d+)?HP$/i.test(p)) { 
      hpIdx = i; 
      hpNum = parseFloat(p); 
      break; 
    }
    if (/^\d+(\.\d+)?$/i.test(p) && parts[i+1]?.toUpperCase() === 'HP') { 
      hpIdx = i+1; 
      hpNum = parseFloat(p);
      break; 
    }
    const m = p.match(/^(\d+(\.\d+)?)HP([A-Z].*)$/i); // e.g. "25HPELHPT"
    if (m) { 
      hpIdx = i; 
      hpNum = parseFloat(m[1]); 
      break; 
    }
  }

  const fuel = parts.includes('EFI') ? 'EFI' : '';
  let code = '';
  
  if (hpIdx !== -1) {
    const after = parts.slice(hpIdx + 1).filter(p => p !== 'EFI' && p !== '-');
    // If horsepower token carried the code (25HPELHPT), peel it
    if (!after.length) {
      const carried = parts[hpIdx].match(/^(\d+(?:\.\d+)?)HP([A-Z].*)$/i);
      if (carried) code = carried[2];
    } else {
      code = after.join(' ');
    }
  }

  const display = [
    year || '',
    type || (parts[1] && /^[A-Za-z]/.test(parts[1]) ? parts[1] : ''),
    hpNum ? `${hpNum}HP` : '',
    fuel,
    code
  ].filter(Boolean).join(' ').replace(/\s+/g,' ').trim();

  return {
    model_raw: title,
    model: display || title,
    year: year ? parseInt(year,10) : null,
    motor_type: type || null,
    horsepower: hpNum ?? null,
    fuel_type: fuel,
    model_code: code || ''
  };
}

// Pick best image from detail page
function pickImage(detailHtml: string): {original?: string} {
  function absolutize(u: string) {
    if (!u) return u;
    if (/^https?:\/\//i.test(u)) return u;
    if (u.startsWith('//')) return 'https:' + u;
    if (u.startsWith('/')) return 'https://www.harrisboatworks.ca' + u;
    return 'https://www.harrisboatworks.ca' + (u.startsWith('.')? u.slice(1): ('/'+u));
  }
  
  // Try data-* then srcset then src; prefer biggest
  const dataFull = detailHtml.match(/data-(?:full|zoom|large)[-_\w]*="([^"]+)"/i)?.[1];
  const srcset = detailHtml.match(/srcset="([^"]+)"/i)?.[1];
  
  if (dataFull) return { original: absolutize(dataFull) };
  
  if (srcset) {
    const last = srcset.split(',').pop()?.trim().split(' ')[0];
    if (last) return { original: absolutize(last) };
  }
  
  const src = detailHtml.match(/<img[^>]+src="([^"]+)"/i)?.[1];
  return { original: src ? absolutize(src) : undefined };
}

// Extract field from HTML using label regex
function extractField(html: string, labelRx: RegExp): string | undefined {
  const m = html.match(labelRx);
  if (!m) return undefined;
  
  // Pull the next text chunk
  const slice = html.slice(m.index!);
  const val = cleanText(slice.split('</')[0].replace(/.*?:/,''));
  return val || undefined;
}

// Parse detail page for motor data
function parseDetailPage(detailHtml: string, url: string): Motor {
  // Title – from <h1> or breadcrumb; fallback meta
  const title = cleanText(
    detailHtml.match(/<h1[^>]*>(.*?)<\/h1>/is)?.[1] ||
    detailHtml.match(/<title[^>]*>(.*?)<\/title>/is)?.[1] ||
    ''
  );

  const { model_raw, model, year, motor_type, horsepower, fuel_type, model_code } = parseModelFields(title);

  const stock =
    extractField(detailHtml, /Stock\s*(#|Number)/i) ||
    detailHtml.match(/Stock\s*#\s*<\/[^>]*>\s*([^<]+)/i)?.[1]?.trim() ||
    undefined;

  const avail = extractField(detailHtml, /Availability/i) || undefined;

  const prices = parsePriceBlock(
    detailHtml.match(/(MSRP|On Sale|Price|You Save)[\s\S]{0,500}<\/(div|span|p)>/i)?.[0] || ''
  );

  const { original } = pickImage(detailHtml);

  return {
    model_raw,
    model,
    year,
    motor_type,
    horsepower,
    fuel_type,
    model_code,
    sale_price: prices.sale_price,
    msrp: prices.msrp,
    price_status: prices.price_status,
    stock_number: stock || null,
    availability: avail || null,
    image_url: null, // to be set after upload
    original_image_url: original || null,
    source_url: url
  };
}

// Upload image to Supabase storage
async function uploadToSupabaseImage(url: string, name: string): Promise<string | null> {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    
    const buf = await resp.arrayBuffer();
    const ext = (url.split('.').pop() || 'jpg').split('?')[0];
    const path = `mercury/${name}.${ext}`.replace(/\s+/g,'-').toLowerCase();
    
    const { error } = await supabase.storage
      .from('motor-images')
      .upload(path, new Uint8Array(buf), { 
        upsert: true, 
        contentType: 'image/jpeg', 
        cacheControl: '86400' 
      });
    
    if (error) {
      console.error('Upload error:', error);
      return null;
    }
    
    const { data } = supabase.storage.from('motor-images').getPublicUrl(path);
    return data.publicUrl || null;
  } catch (error) {
    console.error('Image upload failed:', error);
    return null;
  }
}

// Generate motor key for deduplication
function motorKey(m: Motor) {
  return (m.stock_number?.toUpperCase()) || `${m.model}|${m.year || ''}`.toUpperCase();
}

// Deduplicate motors
function dedupe(motors: Motor[]): Motor[] {
  const map = new Map<string, Motor>();
  for (const m of motors) {
    const k = motorKey(m);
    if (!map.has(k)) map.set(k, m);
  }
  return [...map.values()];
}

// Validation summary
function validateSummary(motors: Motor[]) {
  const total = motors.length;
  const withCodes = motors.filter(m => m.model_code).length;
  const withImgs = motors.filter(m => !!m.image_url).length;
  const listed = motors.filter(m => m.price_status === 'listed').length;
  const call = motors.filter(m => m.price_status === 'call_for_price').length;

  console.log(`
==== MERCURY SCRAPE REPORT ====
Total unique: ${total}
Model codes:  ${withCodes}/${total}
Images:       ${withImgs}/${total}
Listed price: ${listed}/${total}
Call price:   ${call}/${total}
`);
}

// Main serve function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const batch = Number(body.batch_size ?? 30);
    const concurrency = Number(body.concurrency ?? 4);
    
    console.log(`🚀 Starting Mercury scraper - batch:${batch}, concurrency:${concurrency}`);

    // Fetch page function using Firecrawl
    const fetchPage = async (url: string) => {
      try {
        const r = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('FIRECRAWL_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            url, 
            formats: ['html'], 
            waitFor: 1500, 
            timeout: 30000 
          })
        });
        
        const j = await r.json();
        const html = j?.data?.html || j?.html || j?.content || '';
        return typeof html === 'string' ? html : '';
      } catch (error) {
        console.error(`Failed to fetch ${url}:`, error);
        return '';
      }
    };

    // Step 1: Collect all detail URLs
    console.log('📄 Step 1: Collecting detail URLs...');
    const urls = await collectAllDetailUrls(fetchPage);
    console.log(`✅ Found ${urls.length} detail URLs`);

    if (urls.length === 0) {
      throw new Error('No detail URLs found - check pagination detection');
    }

    // Step 2: Process detail pages in batches
    console.log('🔍 Step 2: Processing detail pages...');
    const results: Motor[] = [];
    let processed = 0;
    
    while (processed < urls.length) {
      const slice = urls.slice(processed, processed + batch);
      processed += batch;
      
      // Process batch with concurrency control
      const chunkResults: Motor[] = [];
      for (let c = 0; c < slice.length; c += concurrency) {
        const group = slice.slice(c, c + concurrency);
        const groupRes = await Promise.all(group.map(async (u) => {
          try {
            const html = await fetchPage(u);
            if (!html) return null;
            
            const motor = parseDetailPage(html, u);
            
            // Upload image if available
            if (motor.original_image_url) {
              const imageName = motor.stock_number || `${motor.year||''}-${motor.model_code||'motor'}`;
              const stored = await uploadToSupabaseImage(motor.original_image_url, imageName);
              motor.image_url = stored || motor.original_image_url;
            }
            
            return motor;
          } catch (error) {
            console.error(`Error processing ${u}:`, error);
            return null;
          }
        }));
        
        chunkResults.push(...groupRes.filter(Boolean) as Motor[]);
      }
      
      results.push(...chunkResults);
      console.log(`Processed ${results.length}/${urls.length} motors`);
    }

    // Step 3: Clean and deduplicate
    console.log('🧹 Step 3: Cleaning and deduplicating...');
    const cleaned = dedupe(
      results
        .filter(m => m.model)   // Must have a model string
        .map(m => ({ ...m, model: cleanText(m.model) }))
    );

    // Step 4: Upsert to database
    console.log('💾 Step 4: Saving to database...');
    const dbRecords = cleaned.map(m => ({
      make: 'Mercury',
      model: m.model,
      year: m.year || 2025,
      motor_type: m.motor_type || 'FourStroke',
      horsepower: m.horsepower || 0,
      fuel_type: m.fuel_type || '',
      model_code: m.model_code || '',
      sale_price: m.sale_price,
      base_price: m.msrp || m.sale_price,
      stock_number: m.stock_number,
      availability: m.availability || 'Available',
      image_url: m.image_url,
      images: m.image_url ? [m.image_url] : [],
      detail_url: m.source_url,
      last_scraped: new Date().toISOString(),
      inventory_source: 'detail_pages'
    }));

    const { error: upsertError } = await supabase
      .from('motor_models')
      .upsert(dbRecords, { onConflict: 'detail_url' });

    if (upsertError) {
      console.error('Database upsert error:', upsertError);
    } else {
      console.log(`✅ Saved ${dbRecords.length} motors to database`);
    }

    // Step 5: Generate report
    validateSummary(cleaned);

    return new Response(JSON.stringify({
      success: true,
      urls_discovered: urls.length,
      motors_scraped: results.length,
      motors_unique: cleaned.length,
      motors_saved: dbRecords.length,
      note: 'Scraped from detail pages. Deduped by stock_number or (model|year). "Call for Price" handled.',
      sample_motors: cleaned.slice(0, 3).map(m => ({
        model: m.model,
        hp: m.horsepower,
        code: m.model_code,
        price_status: m.price_status,
        has_image: !!m.image_url
      }))
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('❌ Scraper error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: String(error),
      stack: error.stack 
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json', 
        ...corsHeaders 
      }
    });
  }
});