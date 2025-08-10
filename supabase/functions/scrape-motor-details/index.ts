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
  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url, formats: ['html','markdown'] }),
  });
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

async function scrapeDetails(url: string, apiKey: string): Promise<ScrapeResult> {
  let html: string | undefined;
  let markdown: string | undefined;
  try {
    const res = await firecrawlScrape(url, apiKey);
    html = res.html;
    markdown = res.markdown;
  } catch (e) {
    console.warn('Firecrawl error, falling back to direct fetch:', e);
    try {
      const resp = await fetch(url);
      if (resp.ok) html = await resp.text();
    } catch {}
  }
  const description = firstNonEmptyParagraph(markdown) || extractMetaDescription(html) || null;
  const features = extractFeatures(markdown);
  const specifications = extractSpecifications(markdown);
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

    if (!detailUrl && motorId) {
      const { data: motor, error } = await supabase
        .from('motor_models')
        .select('id, detail_url')
        .eq('id', motorId)
        .single();
      if (error) throw error;
      detailUrl = (motor?.detail_url || '').trim();
    }

    if (!detailUrl) {
      return new Response(JSON.stringify({ success: false, error: 'No detail_url provided or found for motor_id' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(JSON.stringify({ event: 'scrape_motor_details_start', motorId, detailUrl }));

    const result = await scrapeDetails(detailUrl, FIRECRAWL_API_KEY);

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
