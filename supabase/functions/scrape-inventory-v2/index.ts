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

// Constants
const BASE = 'https://www.harrisboatworks.ca/search/inventory/brand/Mercury';
const PAGE_PARAM = (n: number) => (n === 1 ? BASE : `${BASE}?page=${n}`);

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

// Get total pages by probing page 1
async function getTotalPages(fetchPage: (url: string) => Promise<string>): Promise<number> {
  try {
    const html = await fetchPage(PAGE_PARAM(1));
    // Try multiple patterns
    const m = html.match(/(\d+)\s*-\s*\d+\s*of\s*(\d+)\s*results/i) || 
              html.match(/of\s*(\d+)\s*results/i) ||
              html.match(/showing.*of\s*(\d+)/i);
    const total = m ? parseInt(m[m.length-1], 10) : 145;
    console.log(`📊 Detected ${total} total motors`);
    return Math.max(1, Math.ceil(total / 30));
  } catch (error) {
    console.error('Error detecting total pages:', error);
    return 6; // fallback to 6 pages
  }
}

// Extract detail URLs from listing page HTML
function extractDetailUrls(listHtml: string): string[] {
  const urls = new Set<string>();
  const rx = /href="(\/inventory\/[^"#?]+)"/gi;
  let match;
  while ((match = rx.exec(listHtml))) {
    urls.add(`https://www.harrisboatworks.ca${match[1]}`);
  }
  return [...urls];
}

// Collect all detail URLs from all pages
async function collectAllDetailUrls(fetchPage: (url: string) => Promise<string>) {
  const totalPages = await getTotalPages(fetchPage);
  const all = new Set<string>();
  
  console.log(`📄 Collecting URLs from ${totalPages} pages...`);
  
  for (let p = 1; p <= totalPages; p++) {
    try {
      const url = PAGE_PARAM(p);
      const html = await fetchPage(url);
      const pageUrls = extractDetailUrls(html);
      pageUrls.forEach(u => all.add(u));
      console.log(`Page ${p}/${totalPages}: found ${pageUrls.length} detail URLs (total ${all.size})`);
    } catch (error) {
      console.error(`Error on page ${p}:`, error);
    }
  }
  
  // Safety probe: try a "limit=200" page if we're still under 120
  if (all.size < 120) {
    try {
      console.log('🔍 Running safety probe with limit=200...');
      const html = await fetchPage(`${BASE}?limit=200`);
      extractDetailUrls(html).forEach(u => all.add(u));
      console.log(`After limit=200 probe: ${all.size} detail URLs`);
    } catch (error) {
      console.error('Safety probe failed:', error);
    }
  }
  
  return [...all];
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
      source_url: m.source_url,
      last_scraped: new Date().toISOString(),
      inventory_source: 'detail_pages'
    }));

    const { error: upsertError } = await supabase
      .from('motor_models')
      .upsert(dbRecords, { onConflict: 'stock_number' });

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