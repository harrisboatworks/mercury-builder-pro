// supabase/functions/indexnow-ping/index.ts
// Notifies Bing/IndexNow-compatible engines of URL changes for fast freshness.
// Docs: https://www.indexnow.org/documentation

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const HOST = 'www.mercuryrepower.ca';
const KEY = '03999430e4bae3d7d7be108f62646dbf';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';

interface PingBody {
  urls?: string[];
  url?: string;
}

function normalizeUrl(u: string): string | null {
  try {
    const parsed = new URL(u, `https://${HOST}`);
    // Force canonical host
    parsed.host = HOST;
    parsed.protocol = 'https:';
    return parsed.toString();
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check / discovery
  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({ ok: true, host: HOST, keyLocation: KEY_LOCATION }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  try {
    const body: PingBody = await req.json().catch(() => ({}));
    const rawUrls = body.urls && Array.isArray(body.urls) ? body.urls : body.url ? [body.url] : [];

    const urls = Array.from(
      new Set(
        rawUrls
          .map((u) => (typeof u === 'string' ? normalizeUrl(u.trim()) : null))
          .filter((u): u is string => !!u),
      ),
    ).slice(0, 10000); // IndexNow allows up to 10,000 URLs per request

    if (urls.length === 0) {
      return new Response(
        JSON.stringify({ ok: false, error: 'No valid urls provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const payload = {
      host: HOST,
      key: KEY,
      keyLocation: KEY_LOCATION,
      urlList: urls,
    };

    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    });

    const text = await res.text();

    return new Response(
      JSON.stringify({
        ok: res.ok,
        status: res.status,
        submittedCount: urls.length,
        indexNowResponse: text || null,
      }),
      {
        status: res.ok ? 200 : 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
