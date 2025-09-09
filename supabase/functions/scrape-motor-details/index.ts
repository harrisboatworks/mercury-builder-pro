import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.1'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapeRequest {
  motor_id?: string;
  detail_url?: string;
}

interface ScrapeResult {
  description: string | null;
  features: string[];
  specifications: Record<string, unknown>;
}

async function firecrawlScrape(url: string, apiKey: string): Promise<{ html?: string; markdown?: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url, formats: ['html','markdown'], onlyMainContent: true }),
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  if (!res.ok) {
    throw new Error(`Firecrawl scrape failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  // Support multiple possible shapes
  const html = data?.data?.html || data?.html || null;
  const markdown = data?.data?.markdown || data?.markdown || null;
  return { html: html || undefined, markdown: markdown || undefined };
}

function firstNonEmptyParagraph(md?: string | null): string | null {
  if (!md) return null;
  const lines = md.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('#') || line.startsWith('- ') || line.startsWith('* ') || line.startsWith('|')) continue;
    if (line.length < 40) continue; // prefer substantive text
    return line;
  }
  return null;
}

function extractMetaDescription(html?: string | null): string | null {
  if (!html) return null;
  const m = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i);
  return m ? m[1].trim() : null;
}

function extractFeatures(md?: string | null): string[] {
  if (!md) return [];
  const out: string[] = [];
  const lines = md.split(/\r?\n/);
  let inFeatures = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const isHeader = /^#{1,6}\s+/.test(line);
    if (isHeader && /feature/i.test(line)) { inFeatures = true; continue; }
    if (isHeader && inFeatures) break; // next section
    if (inFeatures && (/^-\s+/.test(line) || /^\*\s+/.test(line))) {
      out.push(line.replace(/^[-*]\s+/, '').trim());
      if (out.length >= 12) break;
    }
  }
  // Fallback: collect any top-level bullets if none found under a Features header
  if (out.length === 0) {
    for (const raw of lines) {
      const line = raw.trim();
      if (/^[-*]\s+/.test(line)) out.push(line.replace(/^[-*]\s+/, '').trim());
      if (out.length >= 8) break;
    }
  }
  return out;
}

function extractSpecifications(md?: string | null): Record<string, unknown> {
  const specs: Record<string, unknown> = {};
  if (!md) return specs;
  const lines = md.split(/\r?\n/);
  let inSpecs = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const isHeader = /^#{1,6}\s+/.test(line);
    if (isHeader && /(spec|specification)/i.test(line)) { inSpecs = true; continue; }
    if (isHeader && inSpecs) break; // next section ends specs
    if (!inSpecs) continue;
    // Parse table-style key | value
    if (/^\|/.test(line) && line.split('|').length >= 3) {
      const parts = line.split('|').map(s => s.trim()).filter(Boolean);
      if (parts.length >= 2 && !/^[-:]+$/.test(parts[0]) && !/^[-:]+$/.test(parts[1])) {
        const key = parts[0].replace(/\*\*/g, '').trim();
        const val = parts[1].replace(/\*\*/g, '').trim();
        if (key && val) specs[key] = val;
      }
      continue;
    }
    // Parse bullet "Key: Value"
    const m = line.match(/^[*-]\s*([^:]+):\s*(.+)$/);
    if (m) {
      const key = m[1].trim();
      const val = m[2].trim();
      if (key && val) specs[key] = val;
    }
  }
  return specs;
}

function normalizeDetailUrl(input: string): string {
  const base = 'https://www.harrisboatworks.ca';
  if (!input) return '';
  try {
    let s = input.trim();
    // Fix duplicated domain pattern
    s = s.replace(/https?:\/\/(?:www\.)?harrisboatworks\.ca\/?https?:\/\/(?:www\.)?harrisboatworks\.ca/i, 'https://www.harrisboatworks.ca');
    const u = new URL(s.startsWith('http') ? s : s.startsWith('/') ? `${base}${s}` : `${base}/${s}`);
    // Remove duplicated host fragment in pathname (e.g., //www.harrisboatworks.ca/...) and collapse slashes
    const dupHost = `//${u.host}`;
    let path = u.pathname.startsWith(dupHost) ? u.pathname.slice(dupHost.length) : u.pathname;
    path = path.replace(/\/+/, '/');
    const normalized = `${u.protocol}//${u.host}${path}${u.search}${u.hash}`;
    return normalized;
  } catch {
    return input.startsWith('/') ? `${base}${input}` : `${base}/${input}`;
  }
}

async function scrapeDetails(url: string, apiKey: string, modelName?: string): Promise<ScrapeResult> {
  let html: string | undefined;
  let markdown: string | undefined;
  try {
    console.log('Attempting to scrape:', url);
    const res = await firecrawlScrape(url, apiKey);
    html = res.html;
    markdown = res.markdown;
    console.log('Scrape successful for:', url);
  } catch (e) {
    console.error('Scrape failed for:', url, e);
    console.warn('Firecrawl error, falling back to direct fetch:', e);
    try {
      const resp = await fetch(url);
      if (resp.ok) html = await resp.text();
    } catch (err) {
      console.error('Direct fetch failed for:', url, err);
    }
  }

  // Baseline extraction from markdown/meta
  let description: string | null = firstNonEmptyParagraph(markdown) || extractMetaDescription(html) || null;
  let features: string[] = extractFeatures(markdown);
  let specifications: Record<string, unknown> = extractSpecifications(markdown);

  // Targeted extraction from HTML to avoid picking up navigation links
  try {
    const textMd = markdown || '';
    const textHtml = html || '';

    // Common spec patterns found on product pages
    const specPatterns: Record<string, RegExp> = {
      weight: /Weight[:\s]+([0-9,.]+ ?(?:lbs?|kg))/i,
      shaft_length: /Shaft(?: Length)?[:\s]+([\d\s"',]+)/i,
      displacement: /Displacement[:\s]+([0-9,.]+ ?cc)/i,
      cylinders: /Cylinders?[:\s]+(\d+)/i,
      starting: /Start(?:ing)?[:\s]+(Electric|Manual|Both)/i,
      controls: /Control[:\s]+(Tiller|Remote|Both)/i,
      fuel_system: /Fuel(?: System)?[:\s]+(EFI|Carb|Carburetor|Electronic Fuel Injection)/i,
    };

    for (const [key, pattern] of Object.entries(specPatterns)) {
      const m = textMd.match(pattern) || textHtml.match(pattern);
      if (m && m[1]) {
        (specifications as Record<string, string>)[key] = m[1].trim();
      }
    }

    // Additionally, parse spec tables (tr/td) commonly used on dealer pages
    try {
      const tableRegex = /<table[\s\S]*?<\/table>/gi;
      const rowRegex = /<tr[\s\S]*?<\/tr>/gi;
      const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
      const tables = textHtml.match(tableRegex) || [];
      for (const tbl of tables) {
        const rows = tbl.match(rowRegex) || [];
        for (const row of rows) {
          const cells = row.match(cellRegex) || [];
          if (cells.length >= 2) {
            const label = cells[0].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
            const value = cells[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
            if (!label || !value) continue;
            const map = (lab: string) => {
              if (/weight/i.test(lab)) return 'weight';
              if (/shaft/i.test(lab)) return 'shaft_length';
              if (/displacement/i.test(lab)) return 'displacement';
              if (/cylinder/i.test(lab)) return 'cylinders';
              if (/start/i.test(lab)) return 'starting';
              if (/control/i.test(lab)) return 'controls';
              if (/gear.*ratio/i.test(lab)) return 'gearRatio';
              if (/fuel/i.test(lab)) return 'fuel_system';
              if (/cooling/i.test(lab)) return 'cooling';
              if (/bore/i.test(lab)) return 'bore';
              if (/stroke/i.test(lab)) return 'stroke';
              if (/alternator/i.test(lab)) return 'alternator';
              if (/prop/i.test(lab)) return 'propeller';
              return '';
            };
            const key = map(label);
            if (key && !(key in specifications)) (specifications as Record<string, string>)[key] = value;
          }
        }
      }
    } catch {}

    // Parse definition lists (dl/dt/dd)
    try {
      const dlRegex = /<dl[\s\S]*?<\/dl>/gi;
      const itemRegex = /<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi;
      const dls = textHtml.match(dlRegex) || [];
      for (const dl of dls) {
        let mItem: RegExpExecArray | null;
        while ((mItem = itemRegex.exec(dl))) {
          const label = (mItem[1] || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
          const value = (mItem[2] || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
          if (!label || !value) continue;
          const map = (lab: string) => {
            if (/weight/i.test(lab)) return 'weight';
            if (/shaft/i.test(lab)) return 'shaft_length';
            if (/displacement/i.test(lab)) return 'displacement';
            if (/cylinder/i.test(lab)) return 'cylinders';
            if (/start/i.test(lab)) return 'starting';
            if (/control/i.test(lab)) return 'controls';
            if (/gear.*ratio/i.test(lab)) return 'gearRatio';
            if (/fuel/i.test(lab)) return 'fuel_system';
            if (/cooling/i.test(lab)) return 'cooling';
            if (/bore/i.test(lab)) return 'bore';
            if (/stroke/i.test(lab)) return 'stroke';
            if (/alternator/i.test(lab)) return 'alternator';
            if (/prop/i.test(lab)) return 'propeller';
            return '';
          };
          const key = map(label);
          if (key && !(key in specifications)) (specifications as Record<string, string>)[key] = value;
        }
      }
    } catch {}

    // If weight still missing, try more text patterns
    if (!(specifications as any).weight) {
      const weightPatterns = [
        /Weight[:\s]+([0-9,.]+ ?(lbs?|kg))/i,
        /Dry Weight[:\s]+([0-9,.]+ ?(lbs?|kg))/i,
        /(\d+\.?\d*)\s*(lbs?|kg)\s*\(?dry weight\)?/i,
        /weighs?\s+(\d+\.?\d*)\s*(lbs?|kg)/i,
      ];
      for (const pat of weightPatterns) {
        const m = textMd.match(pat) || textHtml.match(pat);
        if (m) { (specifications as any).weight = `${m[1]} ${m[2] || 'lbs'}`.trim(); break; }
      }
    }

    // Extract features from lists that look like product features/specs (not nav)
    const ulRegex = /<ul[^>]*class="[^"]*(?:feature|spec)[^"]*"[^>]*>([\s\S]*?)<\/ul>/gi;
    const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    const candidateItems: string[] = [];
    let mUl: RegExpExecArray | null;
    while ((mUl = ulRegex.exec(textHtml))) {
      const inner = mUl[1];
      const items = inner.match(liRegex) || [];
      for (const li of items) {
        const t = li.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
        if (t) candidateItems.push(t);
      }
    }
    const filtered = candidateItems.filter((t) => {
      const lower = t.toLowerCase();
      return (
        !/[\[\]]/.test(t) &&
        !lower.includes('home') &&
        !lower.includes('inventory') &&
        !lower.includes('search') &&
        !lower.includes('login') &&
        !lower.includes('account') &&
        !lower.includes('privacy') &&
        !lower.includes('terms') &&
        !t.includes('http') &&
        t.length > 5 &&
        t.length < 140
      );
    });
    if (filtered.length) {
      features = filtered.slice(0, 12);
    }

    // Description from known content blocks
    const descRegex = /<div[^>]*class="[^"]*(?:description|overview|product-info)[^"]*"[^>]*>([\s\S]*?)<\/div>/i;
    const d = textHtml.match(descRegex);
    if (d && d[1]) {
      const plain = d[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (plain) description = plain;
    }
  } catch (err) {
    console.warn('Targeted HTML extraction failed:', (err as Error).message);
  }

  // Intelligent fallbacks based on model name if data is still weak
  const hasSpecs = Object.keys(specifications || {}).length > 0;
  if (!hasSpecs && modelName) {
    const s: Record<string, string> = {};
    const f: string[] = [];
    const hpMatch = modelName.match(/(\d+\.?\d*)\s*HP/i);
    if (hpMatch) {
      const hp = parseFloat(hpMatch[1]);
      if (hp <= 6) s.weight = '57-60 lbs';
      else if (hp <= 15) s.weight = '80-100 lbs';
      else if (hp <= 30) s.weight = '110-130 lbs';
      else if (hp <= 60) s.weight = '200-250 lbs';
      else s.weight = '350+ lbs';

      if (hp <= 6) s.shaft_length = '15" or 20"';
      else if (hp <= 30) s.shaft_length = '15", 20" or 25"';
      else s.shaft_length = '20", 25" or 30"';
    }
    if (/ELPT/i.test(modelName)) {
      s.starting = 'Electric';
      f.push('Power Tilt');
    } else if (/EH/i.test(modelName)) {
      s.starting = 'Electric';
      s.controls = 'Tiller Handle';
    } else if (/MH/i.test(modelName)) {
      s.starting = 'Manual';
      s.controls = 'Tiller Handle';
    }
    if (/EFI/i.test(modelName)) {
      s.fuel_system = 'Electronic Fuel Injection';
    }

    specifications = { ...specifications, ...s };
    if (!features.length && f.length) features = f;
  }

  // Secondary fallback: standard Mercury specs by HP if few specs extracted
  try {
    if (modelName && Object.keys(specifications || {}).length < 3) {
      const hpMatch2 = modelName.match(/(\d+\.?\d*)\s*HP/i);
      if (hpMatch2) {
        const hpKey = `${parseFloat(hpMatch2[1])}HP`;
        const mercuryStandardSpecs: Record<string, Record<string, string>> = {
          '2.5HP': { weight: '57 lbs', displacement: '85.5 cc', cylinders: '1', bore: '2.13" (55mm)', stroke: '1.73" (44mm)', gearRatio: '2.15:1', cooling: 'Water cooled', shaft_length: '15" or 20"' },
          '3.5HP': { weight: '59 lbs', displacement: '85.5 cc', cylinders: '1', bore: '2.13" (55mm)', stroke: '1.73" (44mm)', gearRatio: '2.15:1', cooling: 'Water cooled', shaft_length: '15" or 20"' },
          '5HP':   { weight: '60 lbs', displacement: '123 cc', cylinders: '1', bore: '2.36" (60mm)', stroke: '2.17" (55mm)', gearRatio: '2.15:1', cooling: 'Water cooled', shaft_length: '15" or 20"' },
          '9.9HP': { weight: '84 lbs', displacement: '209 cc', cylinders: '2', bore: '2.56" (65mm)', stroke: '1.97" (50mm)', gearRatio: '2.08:1', cooling: 'Water cooled', shaft_length: '15", 20", or 25"' },
          '15HP':  { weight: '99-104 lbs', displacement: '333 cc', cylinders: '2', bore: '2.36" (60mm)', stroke: '2.95" (75mm)', gearRatio: '2.15:1', cooling: 'Water cooled', shaft_length: '15" or 20"' },
          '20HP':  { weight: '99-104 lbs', displacement: '333 cc', cylinders: '2', bore: '2.36" (60mm)', stroke: '2.95" (75mm)', gearRatio: '2.08:1', cooling: 'Water cooled', shaft_length: '15" or 20"' },
          '115HP': { weight: '363 lbs', displacement: '2064 cc', cylinders: '4', bore: '3.23" (82mm)', stroke: '3.06" (77.8mm)', gearRatio: '2.07:1', cooling: 'Water cooled', shaft_length: '20" or 25"' },
          '115HP EXLPT': { weight: '363 lbs' },
        };
        const std = mercuryStandardSpecs[hpKey];
        if (std) {
          for (const [k, v] of Object.entries(std)) {
            if (!(k in (specifications as any))) (specifications as any)[k] = v;
          }
        }
      }
    }
  } catch {}

  return { description, features, specifications };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');

    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ success: false, error: 'Missing Supabase credentials' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!FIRECRAWL_API_KEY) {
      return new Response(JSON.stringify({ success: false, error: 'Missing FIRECRAWL_API_KEY' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = (await req.json()) as ScrapeRequest;
    const motorId = body.motor_id?.trim();
    let detailUrl = body.detail_url?.trim() || '';
    let modelName: string | undefined;

    if (!detailUrl && motorId) {
      const { data: motor, error } = await supabase
        .from('motor_models')
        .select('id, detail_url, model')
        .eq('id', motorId)
        .single();
      if (error) throw error;
      detailUrl = (motor?.detail_url || '').trim();
      modelName = motor?.model ? String(motor.model).trim() : undefined;
    }

    // Normalize any malformed URLs (e.g., duplicated domain, missing host)
    detailUrl = normalizeDetailUrl(detailUrl);

    if (!detailUrl) {
      return new Response(JSON.stringify({ success: false, error: 'No detail_url provided or found for motor_id' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(JSON.stringify({ event: 'scrape_motor_details_start', motorId, detailUrl }));

    const result = await scrapeDetails(detailUrl, FIRECRAWL_API_KEY, modelName);

    // Update DB if motor id provided or if we can match by detail_url
    if (motorId) {
      const { error: upErr } = await supabase
        .from('motor_models')
        .update({
          description: result.description,
          features: result.features,
          specifications: result.specifications,
          updated_at: new Date().toISOString(),
        })
        .eq('id', motorId);
      if (upErr) throw upErr;
    } else {
      const { error: upErr } = await supabase
        .from('motor_models')
        .update({
          description: result.description,
          features: result.features,
          specifications: result.specifications,
          updated_at: new Date().toISOString(),
        })
        .eq('detail_url', detailUrl);
      if (upErr) console.warn('Update by detail_url warning:', upErr?.message);
    }

    console.log(JSON.stringify({ event: 'scrape_motor_details_done', motorId, featuresCount: result.features.length, specsKeys: Object.keys(result.specifications).length }));

    return new Response(JSON.stringify({ success: true, motor_id: motorId || null, detail_url: detailUrl, ...result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (e) {
    console.error('scrape-motor-details error', e);
    return new Response(JSON.stringify({ success: false, error: (e as Error).message || 'Unknown error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
