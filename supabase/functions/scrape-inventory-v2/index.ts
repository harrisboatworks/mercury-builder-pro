import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { XMLParser } from "https://esm.sh/fast-xml-parser@4"

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
}

// Lazy initialize Supabase client only when needed for database operations
async function getServiceClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!url || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in Edge Function environment');
  }
  
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  return createClient(url, serviceKey);
}

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

// ---------- Inventory filter helpers ----------
const norm = (v?: any) => (v == null ? "" : String(v).trim());
const lower = (v?: any) => norm(v).toLowerCase();

// True if the XML unit is a Mercury outboard motor (not boat/trailer/etc.)
function isOutboardMotor(u: any): boolean {
  const title = lower(u.Title ?? u.title ?? u.Model ?? u.model ?? u.Name);
  const category = lower(u.Category ?? u.category ?? u.Type ?? u.type ?? u.VehicleType ?? u.vehicle_type ?? u.UnitType);
  const subcat = lower(u.SubCategory ?? u.subcategory ?? u.BodyStyle ?? u.body_style);
  const cls = lower(u.Class ?? u.class ?? u.VehicleClass ?? u.vehicle_class);
  const engineType = lower(u.EngineType ?? u.engine_type ?? u.EngineModel ?? u.engine_model ?? "");
  const dept = lower(u.Department ?? u.department);

  const fields = [title, category, subcat, cls, engineType, dept];

  const motorHints = ["outboard","engine","motor","fourstroke","four-stroke","pro xs","proxs","seapro","verado","racing"];
  const hasMotorHint = fields.some(s => motorHints.some(h => s.includes(h)));
  const explicitOutboard = engineType.includes("outboard");

  const negatives = [
    "boat","pwc","trailer","atv","utv","snow","sled","rv",
    "part","accessor","propeller","prop","controls","rigging","tiller",
    "tester","display","demo boat","pkg","package","combo","kit"
  ];
  const isNegative = fields.some(s => negatives.some(n => s.includes(n)));

  return (explicitOutboard || hasMotorHint) && !isNegative;
}

function isNew(u: any): boolean {
  const cond = lower(u.Condition ?? u.condition ?? u.Status ?? u.status ?? u.InventoryStatus ?? "");
  if (cond.includes("used") || cond.includes("pre-owned") || cond.includes("preowned")) return false;
  if (cond.includes("new")) return true;
  // If missing, assume new unless explicitly "used"
  return cond.length === 0;
}

function isMercury(u: any): boolean {
  const make = lower(u.Make ?? u.make ?? u.Brand ?? u.brand ?? u.Manufacturer ?? u.manufacturer ?? "");
  const title = lower(u.Title ?? u.title ?? u.Model ?? u.model ?? "");
  return make.includes("mercury") || title.includes("mercury");
}

// Enhanced URL extraction with multiple strategies
function extractDetailUrls(listHtml: string): { urls: string[], method: string, diagnostics: any } {
  const urls = new Set<string>();
  const methods: string[] = [];
  const diagnostics = {
    htmlLength: listHtml.length,
    extractionMethods: {} as Record<string, number>
  };

  // 1) Traditional anchor tags: <a href="/inventory/...">
  const hrefRx = /href=["'](\/inventory\/[^"'?#]+)["']/gi;
  let hrefCount = 0;
  for (let m; (m = hrefRx.exec(listHtml)); ) {
    urls.add(`https://www.harrisboatworks.ca${m[1]}`);
    hrefCount++;
  }
  if (hrefCount > 0) {
    methods.push('href');
    diagnostics.extractionMethods.href = hrefCount;
  }

  // 2) JSON-LD structured data: <script type="application/ld+json">
  const jsonLdRx = /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis;
  let jsonLdCount = 0;
  for (let m; (m = jsonLdRx.exec(listHtml)); ) {
    try {
      const data = JSON.parse(m[1]);
      const extractFromJsonLd = (obj: any) => {
        if (typeof obj === 'object' && obj) {
          if (obj.url && typeof obj.url === 'string' && obj.url.includes('/inventory/')) {
            const absUrl = obj.url.startsWith('http') ? obj.url : `https://www.harrisboatworks.ca${obj.url}`;
            urls.add(absUrl);
            jsonLdCount++;
          }
          if (obj['@graph'] || obj.itemListElement) {
            const items = obj['@graph'] || obj.itemListElement || [];
            items.forEach(extractFromJsonLd);
          }
          Object.values(obj).forEach(extractFromJsonLd);
        }
      };
      extractFromJsonLd(data);
    } catch (e) {
      // Invalid JSON-LD, skip
    }
  }
  if (jsonLdCount > 0) {
    methods.push('json-ld');
    diagnostics.extractionMethods['json-ld'] = jsonLdCount;
  }

  // 3) Data attributes: data-url, data-href, data-link, etc.
  const dataAttrRx = /data-(?:url|href|link|item-?url|product-?url)=["']([^"']*\/inventory\/[^"']*)["']/gi;
  let dataAttrCount = 0;
  for (let m; (m = dataAttrRx.exec(listHtml)); ) {
    const u = m[1].startsWith('http') ? m[1] : 
              m[1].startsWith('//') ? `https:${m[1]}` :
              `https://www.harrisboatworks.ca${m[1]}`;
    urls.add(u);
    dataAttrCount++;
  }
  if (dataAttrCount > 0) {
    methods.push('data-attr');
    diagnostics.extractionMethods['data-attr'] = dataAttrCount;
  }

  // 4) JSON API responses: "itemUrl", "url", "link" fields
  const jsonUrlRx = /"(?:itemUrl|url|link|href)"\s*:\s*"((?:https?:)?\/\/[^"]*\/inventory\/[^"']+|\/inventory\/[^"']+)"/gi;
  let jsonUrlCount = 0;
  for (let m; (m = jsonUrlRx.exec(listHtml)); ) {
    const u = m[1].startsWith('//') ? `https:${m[1]}` : 
              m[1].startsWith('/') ? `https://www.harrisboatworks.ca${m[1]}` : m[1];
    urls.add(u);
    jsonUrlCount++;
  }
  if (jsonUrlCount > 0) {
    methods.push('json-api');
    diagnostics.extractionMethods['json-api'] = jsonUrlCount;
  }

  // 5) Generic inventory URL regex (catch-all)
  const genericRx = /(?:https?:)?\/\/[^"'\s]*\/inventory\/[^"'\s?#]*/gi;
  let genericCount = 0;
  for (let m; (m = genericRx.exec(listHtml)); ) {
    const u = m[0].startsWith('//') ? `https:${m[0]}` : 
              m[0].startsWith('/') ? `https://www.harrisboatworks.ca${m[0]}` : m[0];
    if (u.includes('harrisboatworks.ca')) {
      urls.add(u);
      genericCount++;
    }
  }
  if (genericCount > 0) {
    methods.push('generic');
    diagnostics.extractionMethods.generic = genericCount;
  }

  // 6) XHR/API endpoint detection
  const xhrEndpoints: string[] = [];
  const apiRx = /(?:fetch|ajax|xhr)\s*\(\s*["']([^"']*(?:inventory|search|api)[^"']*)["']/gi;
  for (let m; (m = apiRx.exec(listHtml)); ) {
    xhrEndpoints.push(m[1]);
  }
  diagnostics.xhrEndpoints = xhrEndpoints;

  return {
    urls: [...urls],
    method: methods.join('+') || 'none',
    diagnostics
  };
}

// Enhanced discovery with multiple entry routes, sitemap crawling, and diagnostics
async function enhancedDiscover(fetchPage: (u: string) => Promise<string>, opts?: {
  maxPages?: number;
  includeAlts?: boolean;
  doProbe?: boolean;
  mode?: 'discovery' | 'full';
}) {
  const maxPages = Math.max(1, opts?.maxPages ?? 5);
  const includeAlts = opts?.includeAlts !== false; // default on for enhanced
  const doProbe = opts?.doProbe !== false;
  const mode = opts?.mode || 'full';
  const all = new Set<string>();
  const diagnostics: any[] = [];

  console.log(`🔍 Enhanced discovery starting: maxPages=${maxPages}, includeAlts=${includeAlts}, doProbe=${doProbe}`);

  // Enhanced entry routes
  const ENTRY_ROUTES = [
    "https://www.harrisboatworks.ca/search/inventory/brand/Mercury",
    "https://www.harrisboatworks.ca/search/inventory/unit-engine-make/Mercury", 
    "https://www.harrisboatworks.ca/search/inventory/brand/Mercury?view=grid",
    "https://www.harrisboatworks.ca/search/inventory/?q=Mercury",
    "https://www.harrisboatworks.ca/search/inventory/availability/In%20Stock/brand/Mercury",
    "https://www.harrisboatworks.ca/search/inventory/sort/price-low/unit-engine-make/Mercury"
  ];

  // 1) Crawl multiple entry routes
  for (const baseRoute of ENTRY_ROUTES) {
    console.log(`📂 Crawling route: ${baseRoute}`);
    let routeUrls = 0;
    
    // Crawl first N pages of each route  
    for (let p = 1; p <= maxPages; p++) {
      const url = p === 1 ? baseRoute : `${baseRoute}${baseRoute.includes('?') ? '&' : '?'}page=${p}`;
      try {
        const html = await fetchPage(url);
        const extraction = extractDetailUrls(html);
        
        const pageUrls = extraction.urls.length;
        routeUrls += pageUrls;
        extraction.urls.forEach(u => all.add(u));
        
        console.log(`  Page ${p}: ${pageUrls} URLs (${extraction.method}) [HTML: ${extraction.diagnostics.htmlLength} chars]`);
        
        // Log diagnostics for each page
        diagnostics.push({
          url,
          page: p,
          route: baseRoute,
          found: pageUrls,
          method: extraction.method,
          htmlLength: extraction.diagnostics.htmlLength,
          suspectedJsOnly: extraction.diagnostics.htmlLength < 10000,
          samples: extraction.urls.slice(0, 3),
          extractionMethods: extraction.diagnostics.extractionMethods,
          xhrEndpoints: extraction.diagnostics.xhrEndpoints || []
        });
        
        // Early exit if suspected JS-only page
        if (extraction.diagnostics.htmlLength < 10000) {
          console.log(`  ⚠️  Suspected JS-only page (HTML: ${extraction.diagnostics.htmlLength} chars)`);
        }
        
      } catch (error) {
        console.error(`  ❌ Error on page ${p}: ${error}`);
      }
    }

    // High-limit probe for each route
    if (doProbe) {
      try {
        const probeUrl = `${baseRoute}${baseRoute.includes('?') ? '&' : '?'}limit=200`;
        const probeHtml = await fetchPage(probeUrl);
        const probeExtraction = extractDetailUrls(probeHtml);
        const probeUrls = probeExtraction.urls.length;
        
        probeExtraction.urls.forEach(u => all.add(u));
        console.log(`  Probe (limit=200): ${probeUrls} URLs (${probeExtraction.method})`);
        
        diagnostics.push({
          url: probeUrl,
          type: 'probe',
          route: baseRoute,
          found: probeUrls,
          method: probeExtraction.method,
          htmlLength: probeExtraction.diagnostics.htmlLength,
          samples: probeExtraction.urls.slice(0, 3)
        });
        
      } catch (error) {
        console.error(`  ❌ Probe error: ${error}`);
      }
    }
    
    console.log(`✅ Route total: ${routeUrls} URLs from ${baseRoute}`);
  }

  // 2) Sitemap crawling
  try {
    console.log(`📋 Checking sitemap for inventory URLs...`);
    const sitemapHtml = await fetchPage('https://www.harrisboatworks.ca/sitemap.xml');
    
    // Extract child sitemap URLs
    const childSitemaps: string[] = [];
    const sitemapRx = /<loc>(https?:\/\/[^<]*sitemap[^<]*\.xml)<\/loc>/gi;
    for (let m; (m = sitemapRx.exec(sitemapHtml)); ) {
      childSitemaps.push(m[1]);
    }
    
    // Also check main sitemap for direct inventory links
    const inventoryRx = /<loc>(https?:\/\/[^<]*\/inventory\/[^<]*)<\/loc>/gi;
    let sitemapInventoryCount = 0;
    for (let m; (m = inventoryRx.exec(sitemapHtml)); ) {
      all.add(m[1]);
      sitemapInventoryCount++;
    }
    
    console.log(`  Main sitemap: ${sitemapInventoryCount} inventory links, ${childSitemaps.length} child sitemaps`);
    
    // Crawl child sitemaps for inventory URLs  
    for (const childUrl of childSitemaps.slice(0, 10)) { // limit to 10 child sitemaps
      try {
        const childXml = await fetchPage(childUrl);
        let childInventoryCount = 0;
        for (let m; (m = inventoryRx.exec(childXml)); ) {
          all.add(m[1]);
          childInventoryCount++;
        }
        if (childInventoryCount > 0) {
          console.log(`  Child sitemap ${childUrl}: ${childInventoryCount} inventory links`);
        }
      } catch (error) {
        console.error(`  ❌ Child sitemap error (${childUrl}): ${error}`);
      }
    }
    
  } catch (error) {
    console.error(`❌ Sitemap crawling failed: ${error}`);
  }

  // 3) XHR/API endpoint detection and direct calls
  const xhrEndpoints = diagnostics.flatMap(d => d.xhrEndpoints || []);
  const uniqueXhrEndpoints = [...new Set(xhrEndpoints)];
  
  if (uniqueXhrEndpoints.length > 0) {
    console.log(`🔗 Detected ${uniqueXhrEndpoints.length} potential XHR endpoints`);
    
    for (const endpoint of uniqueXhrEndpoints.slice(0, 5)) { // limit to 5 endpoints
      try {
        // Try to call the endpoint directly
        const fullEndpoint = endpoint.startsWith('http') ? endpoint : 
                             endpoint.startsWith('/') ? `https://www.harrisboatworks.ca${endpoint}` : 
                             `https://www.harrisboatworks.ca/${endpoint}`;
        
        console.log(`  🔍 Calling XHR endpoint: ${fullEndpoint}`);
        const apiResponse = await fetch(fullEndpoint);
        const apiData = await apiResponse.text();
        
        // Try to parse as JSON first
        try {
          const json = JSON.parse(apiData);
          let apiUrls = 0;
          
          // Extract URLs from JSON response
          const extractFromJson = (obj: any) => {
            if (typeof obj === 'object' && obj) {
              Object.entries(obj).forEach(([key, value]) => {
                if (typeof value === 'string' && value.includes('/inventory/')) {
                  const absUrl = value.startsWith('http') ? value : `https://www.harrisboatworks.ca${value}`;
                  all.add(absUrl);
                  apiUrls++;
                } else if (typeof value === 'object') {
                  extractFromJson(value);
                }
              });
            } else if (Array.isArray(obj)) {
              obj.forEach(extractFromJson);
            }
          };
          
          extractFromJson(json);
          console.log(`    📦 JSON response: ${apiUrls} inventory URLs extracted`);
          
        } catch {
          // Not JSON, try HTML extraction
          const htmlExtraction = extractDetailUrls(apiData);
          htmlExtraction.urls.forEach(u => all.add(u));
          console.log(`    📄 HTML response: ${htmlExtraction.urls.length} URLs extracted`);
        }
        
      } catch (error) {
        console.log(`    ❌ XHR endpoint failed: ${error}`);
      }
    }
  }

  const finalUrls = [...all];
  
  // Summary diagnostics
  console.log(`
📊 Enhanced Discovery Summary:
   Total URLs found: ${finalUrls.length}
   Routes crawled: ${ENTRY_ROUTES.length}
   Pages processed: ${diagnostics.filter(d => d.type !== 'probe').length}
   Probes executed: ${diagnostics.filter(d => d.type === 'probe').length}
   XHR endpoints detected: ${uniqueXhrEndpoints.length}
   Extraction methods used: ${[...new Set(diagnostics.map(d => d.method))].join(', ')}
  `);

  // Return sample URLs and diagnostics
  return {
    urls: finalUrls,
    diagnostics: {
      totalFound: finalUrls.length,
      routesCrawled: ENTRY_ROUTES.length,
      pagesProcessed: diagnostics.length,
      xhrEndpoints: uniqueXhrEndpoints,
      samples: finalUrls.slice(0, 10),
      pageDetails: diagnostics,
      extractionMethods: [...new Set(diagnostics.map(d => d.method))]
    }
  };
}

// ---------- DealerSpike XML discovery ----------
async function discoverFromXmlFeed(fetchPage: (u: string) => Promise<string>) {
  const FEED_URL = "https://www.harrisboatworks.ca/unitinventory_univ.xml";
  try {
    const xml = await fetchPage(FEED_URL);
    if (!xml || xml.length < 100) {
      console.log("XML feed returned empty/short response.");
      return { urls: [] as string[], items: [] as any[] };
    }
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });
    const data = parser.parse(xml);

    // DealerSpike feeds commonly have <Units><Unit>…</Unit></Units>
    const units: any[] =
      data?.Units?.Unit ??
      data?.units?.unit ??
      [];

    const filtered = units.filter(u => isMercury(u) && isNew(u) && isOutboardMotor(u));

    // Build canonical detail URLs if present; fall back to something stable
    const items = filtered.map(u => {
      const rawUrl =
        u.DetailUrl ?? u.detailUrl ?? u.URL ?? u.Url ?? u.url ?? u.itemUrl ?? "";
      const stock = norm(u.StockNumber ?? u.stockNumber ?? u.Stock ?? u.stock ?? "");
      const id = norm(u.Id ?? u.id ?? "");
      const title = norm(u.Title ?? u.title ?? u.Model ?? u.model ?? "Mercury");

      // Absolutize if needed
      let detail_url = rawUrl;
      if (detail_url && detail_url.startsWith("//")) detail_url = "https:" + detail_url;
      if (detail_url && detail_url.startsWith("/")) detail_url = "https://www.harrisboatworks.ca" + detail_url;

      // Fallback detail_url if feed row lacks URL
      if (!detail_url) {
        const safe = encodeURIComponent(`${title}-${stock || id}`.replace(/\s+/g,"-").toLowerCase());
        detail_url = `https://www.harrisboatworks.ca/inventory/${safe}`;
      }

      return { u, detail_url };
    });

    const urls = [...new Set(items.map(i => i.detail_url))];
    console.log(`XML feed: ${units.length} total, ${filtered.length} after filters, ${urls.length} unique URLs.`);
    return { urls, items };
  } catch (e) {
    console.error("XML discovery failed:", e);
    return { urls: [] as string[], items: [] as any[] };
  }
}

// Legacy function for backward compatibility - now uses enhanced discovery
async function collectAllDetailUrls(fetchPage: (u: string) => Promise<string>) {
  console.log('📄 Using enhanced discovery for URL collection...');
  const result = await enhancedDiscover(fetchPage, {
    maxPages: 5,
    includeAlts: true,
    doProbe: true,
    mode: 'full'
  });
  
  if (result.urls.length === 0) {
    throw new Error("No detail URLs found – check selectors/regex or site structure");
  }
  
  return result.urls;
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

// Upload image to Supabase storage (only used in full mode)
async function uploadToSupabaseImage(url: string, name: string, supabase: any): Promise<string | null> {
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

// Main serve function with guaranteed CORS on all responses
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const body = await req.json().catch(() => ({}));
    const mode = (body.mode ?? "full") as "full" | "discovery";
    const batch = Number(body.batch_size ?? 30);
    const concurrency = Number(body.concurrency ?? 4);
    
    console.log(`🚀 Mercury scraper start: mode=${mode} batch=${batch} conc=${concurrency}`);

    // Enhanced fetch function with retries and improved Firecrawl configuration
    const fetchPage = async (url: string, retries = 0): Promise<string> => {
      const maxRetries = 2;
      const isListingPage = url.includes('/search/') || url.includes('/inventory/?') || url.includes('sitemap');
      
      try {
        const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
        if (!apiKey) {
          console.warn('FIRECRAWL_API_KEY not set, returning empty HTML');
          return '';
        }

        // Enhanced Firecrawl configuration
        const firecrawlConfig = {
          url,
          formats: ['html'],
          // Enhanced timing for listing pages
          waitFor: isListingPage ? 4000 : (mode === 'discovery' ? 1500 : 2500),
          timeout: isListingPage ? 45000 : (mode === 'discovery' ? 15000 : 35000),
          // Additional options for better scraping
          onlyMainContent: false,
          includeHtml: true,
          screenshot: false,
          // Mobile viewport for better mobile-first sites
          mobile: false,
          // Follow redirects
          followRedirects: true
        };

        const r = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(firecrawlConfig)
        });
        
        if (!r.ok) {
          throw new Error(`Firecrawl API error: ${r.status} ${r.statusText}`);
        }
        
        const j = await r.json();
        const html = j?.data?.html || j?.html || j?.content || '';
        
        if (typeof html !== 'string') {
          throw new Error('Invalid response format from Firecrawl');
        }
        
        // Log diagnostics for listing pages
        if (isListingPage) {
          console.log(`📄 Fetched ${url}: ${html.length} chars, waitFor: ${firecrawlConfig.waitFor}ms`);
        }
        
        return html;
        
      } catch (error) {
        console.error(`Failed to fetch ${url} (attempt ${retries + 1}/${maxRetries + 1}):`, error);
        
        // Retry with exponential backoff
        if (retries < maxRetries) {
          const delay = Math.pow(2, retries) * 1000; // 1s, 2s, 4s...
          console.log(`  Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchPage(url, retries + 1);
        }
        
        return '';
      }
    };

    // EARLY RETURN: discovery mode (prefer XML feed, fallback to enhanced)
    if (mode === "discovery") {
      console.log("🚀 Discovery mode: trying XML feed first...");
      const xml = await discoverFromXmlFeed(fetchPage);

      if (xml.urls.length > 0) {
        return new Response(JSON.stringify({
          success: true,
          mode,
          source: "xml",
          urls_discovered: xml.urls.length,
          samples: xml.urls.slice(0, 10)
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      console.log("XML feed empty or blocked. Falling back to enhanced page discovery...");
      const result = await enhancedDiscover(fetchPage, {
        maxPages: Math.min(3, Number(body.max_pages ?? 3) || 3),
        includeAlts: body.include_alts !== false,
        doProbe: body.do_probe !== false,
        mode: "discovery"
      });

      return new Response(JSON.stringify({
        success: true,
        mode,
        source: "pages",
        urls_discovered: result.urls.length,
        samples: result.urls.slice(0, 10),
        diagnostics: {
          routesCrawled: result.diagnostics.routesCrawled,
          pagesProcessed: result.diagnostics.pagesProcessed,
          xhrEndpoints: result.diagnostics.xhrEndpoints.length,
          extractionMethods: result.diagnostics.extractionMethods,
          suspectedJsPages: result.diagnostics.pageDetails.filter((d: any) => d.suspectedJsOnly).length
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // FULL MODE continues below
    // Step 1: Collect all detail URLs (prefer XML, fallback to pages)
    console.log("📄 Step 1: Collecting URLs (prefer XML, fallback to pages)...");
    const xmlResult = await discoverFromXmlFeed(fetchPage);
    let urls: string[] = [];

    if (xmlResult.urls.length > 0) {
      urls = xmlResult.urls;
      console.log(`✅ Using XML feed URLs: ${urls.length}`);
    } else {
      console.log("XML feed empty or blocked. Falling back to enhanced page discovery...");
      const pageResult = await enhancedDiscover(fetchPage, { maxPages: 5, includeAlts: true, doProbe: true, mode: "full" });
      urls = pageResult.urls;
      console.log(`✅ Using page-discovered URLs: ${urls.length}`);
    }

    if (urls.length === 0) {
      throw new Error("No detail URLs found (XML + pages).");
    }

    // Step 2: Process detail pages in batches (full mode only)
    console.log('🔍 Step 2: Processing detail pages...');
    
    // Get service client only when we need to write to database or upload images
    const supabase = await getServiceClient();
    
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
            
            // Upload image if available (only in full mode)
            if (motor.original_image_url) {
              const imageName = motor.stock_number || `${motor.year||''}-${motor.model_code||'motor'}`;
              const stored = await uploadToSupabaseImage(motor.original_image_url, imageName, supabase);
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

    // Final safety filter: only new Mercury outboard motors
    const filtered = cleaned.filter(m => {
      const title = (m.model_raw || m.model || "").toLowerCase();
      const isMerc = title.includes("mercury");
      const motorHints = ["outboard","fourstroke","four-stroke","pro xs","proxs","seapro","verado","racing"];
      const hasMotorHint = motorHints.some(h => title.includes(h));
      const negative = ["boat","pwc","trailer","parts","accessor","kit","package","demo boat"].some(n => title.includes(n));
      return isMerc && hasMotorHint && !negative;
    });

    console.log(`Filter: ${filtered.length}/${cleaned.length} records kept (new Mercury outboards only).`);

    // Step 4: Upsert to database
    console.log('💾 Step 4: Saving to database...');
    const dbRecords = filtered.map(m => ({
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
      mode: 'error'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}, {
  onError(error) {
    console.error("❌ Unhandled error:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: String(error),
      mode: 'unhandled_error' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
});