// Admin-triggered SEO health check.
// Validates robots.txt, sitemap.xml, llms.txt and runs Lighthouse via the
// public Google PageSpeed Insights API. No API key required for low volume,
// but uses GOOGLE_PAGESPEED_API_KEY if available for higher quotas.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const SITE = 'https://www.mercuryrepower.ca';
const PSI_ENDPOINT = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

interface FileCheck {
  url: string;
  ok: boolean;
  status: number;
  contentType?: string;
  sizeBytes?: number;
  issues: string[];
  excerpt?: string;
}

async function fetchFile(path: string): Promise<{ res: Response; body: string } | null> {
  try {
    const res = await fetch(`${SITE}${path}`, {
      headers: { 'User-Agent': 'HBW-SEO-HealthCheck/1.0' },
    });
    const body = await res.text();
    return { res, body };
  } catch {
    return null;
  }
}

async function checkRobots(): Promise<FileCheck> {
  const r = await fetchFile('/robots.txt');
  const issues: string[] = [];
  if (!r) return { url: `${SITE}/robots.txt`, ok: false, status: 0, issues: ['Network error fetching robots.txt'] };

  const { res, body } = r;
  const ct = res.headers.get('content-type') || '';
  if (!res.ok) issues.push(`HTTP ${res.status}`);
  if (!/text\/plain/i.test(ct)) issues.push(`Unexpected Content-Type: ${ct}`);
  if (!/sitemap:\s*https?:\/\//i.test(body)) issues.push('Missing Sitemap: directive');
  if (!/user-agent:\s*\*/i.test(body)) issues.push('Missing User-agent: * block');
  if (/disallow:\s*\/\s*$/im.test(body)) issues.push('Site-wide Disallow: / detected — blocks all crawlers');
  // Check sitemap directive points to canonical host
  const sitemapMatch = body.match(/sitemap:\s*(https?:\/\/[^\s]+)/i);
  if (sitemapMatch && !/www\.mercuryrepower\.ca/.test(sitemapMatch[1])) {
    issues.push(`Sitemap URL not on canonical host: ${sitemapMatch[1]}`);
  }

  return {
    url: `${SITE}/robots.txt`,
    ok: res.ok && issues.length === 0,
    status: res.status,
    contentType: ct,
    sizeBytes: body.length,
    issues,
    excerpt: body.slice(0, 400),
  };
}

async function checkSitemap(): Promise<FileCheck & { urlCount?: number }> {
  const r = await fetchFile('/sitemap.xml');
  const issues: string[] = [];
  if (!r) return { url: `${SITE}/sitemap.xml`, ok: false, status: 0, issues: ['Network error fetching sitemap.xml'] };

  const { res, body } = r;
  const ct = res.headers.get('content-type') || '';
  if (!res.ok) issues.push(`HTTP ${res.status}`);
  if (!/xml/i.test(ct)) issues.push(`Unexpected Content-Type: ${ct}`);
  if (!body.includes('<urlset')) issues.push('Missing <urlset> root element');

  const locMatches = body.match(/<loc>[^<]+<\/loc>/g) || [];
  const urlCount = locMatches.length;
  if (urlCount === 0) issues.push('No <loc> entries found');

  // Check for non-canonical hosts
  const nonCanonical = locMatches.filter(
    (l) => !/www\.mercuryrepower\.ca/.test(l) && !/<loc>https?:\/\//.test(l) === false && !/mercuryrepower\.ca/.test(l),
  );
  if (nonCanonical.length > 0) {
    issues.push(`${nonCanonical.length} URL(s) not on canonical host`);
  }

  return {
    url: `${SITE}/sitemap.xml`,
    ok: res.ok && issues.length === 0,
    status: res.status,
    contentType: ct,
    sizeBytes: body.length,
    urlCount,
    issues,
    excerpt: body.slice(0, 400),
  };
}

async function checkLlms(): Promise<FileCheck> {
  const r = await fetchFile('/llms.txt');
  const issues: string[] = [];
  if (!r) return { url: `${SITE}/llms.txt`, ok: false, status: 0, issues: ['Network error fetching llms.txt'] };

  const { res, body } = r;
  const ct = res.headers.get('content-type') || '';
  if (!res.ok) issues.push(`HTTP ${res.status}`);
  if (!/^#\s+/m.test(body)) issues.push('Missing H1 heading');
  if (!/^>\s+/m.test(body)) issues.push('Missing summary blockquote (> ...)');
  if (body.length < 500) issues.push('Content unusually short (<500 chars)');
  if (!/##\s+Pages/i.test(body) && !/##\s+Key Links/i.test(body)) {
    issues.push('Missing ## Pages section');
  }

  return {
    url: `${SITE}/llms.txt`,
    ok: res.ok && issues.length === 0,
    status: res.status,
    contentType: ct,
    sizeBytes: body.length,
    issues,
    excerpt: body.slice(0, 400),
  };
}

interface LighthouseScores {
  ok: boolean;
  url: string;
  strategy: 'mobile' | 'desktop';
  performance?: number;
  accessibility?: number;
  bestPractices?: number;
  seo?: number;
  lcp?: string;
  cls?: string;
  fcp?: string;
  tbt?: string;
  error?: string;
  fetchedAt: string;
}

async function runLighthouse(strategy: 'mobile' | 'desktop'): Promise<LighthouseScores> {
  const apiKey = Deno.env.get('GOOGLE_PAGESPEED_API_KEY');
  const params = new URLSearchParams({
    url: `${SITE}/`,
    strategy,
  });
  for (const c of ['performance', 'accessibility', 'best-practices', 'seo']) {
    params.append('category', c);
  }
  if (apiKey) params.set('key', apiKey);

  const fetchedAt = new Date().toISOString();
  try {
    const res = await fetch(`${PSI_ENDPOINT}?${params}`);
    if (!res.ok) {
      const txt = await res.text();
      return {
        ok: false,
        url: `${SITE}/`,
        strategy,
        error: `PSI HTTP ${res.status}: ${txt.slice(0, 200)}`,
        fetchedAt,
      };
    }
    const data = await res.json();
    const cats = data?.lighthouseResult?.categories || {};
    const audits = data?.lighthouseResult?.audits || {};
    const pct = (v: number | undefined) => (typeof v === 'number' ? Math.round(v * 100) : undefined);
    return {
      ok: true,
      url: `${SITE}/`,
      strategy,
      performance: pct(cats.performance?.score),
      accessibility: pct(cats.accessibility?.score),
      bestPractices: pct(cats['best-practices']?.score),
      seo: pct(cats.seo?.score),
      lcp: audits['largest-contentful-paint']?.displayValue,
      cls: audits['cumulative-layout-shift']?.displayValue,
      fcp: audits['first-contentful-paint']?.displayValue,
      tbt: audits['total-blocking-time']?.displayValue,
      fetchedAt,
    };
  } catch (err) {
    return {
      ok: false,
      url: `${SITE}/`,
      strategy,
      error: (err as Error).message,
      fetchedAt,
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // AuthN + admin role check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: roles } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    const isAdmin = (roles || []).some((r: any) => r.role === 'admin');
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden — admin role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const startedAt = new Date().toISOString();
    const [robots, sitemap, llms, lhMobile, lhDesktop] = await Promise.all([
      checkRobots(),
      checkSitemap(),
      checkLlms(),
      runLighthouse('mobile'),
      runLighthouse('desktop'),
    ]);

    const fileIssues =
      robots.issues.length + sitemap.issues.length + llms.issues.length;
    const overallOk = robots.ok && sitemap.ok && llms.ok && lhMobile.ok && lhDesktop.ok;

    return new Response(
      JSON.stringify({
        ok: overallOk,
        startedAt,
        completedAt: new Date().toISOString(),
        site: SITE,
        files: { robots, sitemap, llms },
        lighthouse: { mobile: lhMobile, desktop: lhDesktop },
        summary: {
          fileIssues,
          mobilePerf: lhMobile.performance,
          desktopPerf: lhDesktop.performance,
          mobileSeo: lhMobile.seo,
          mobileA11y: lhMobile.accessibility,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
