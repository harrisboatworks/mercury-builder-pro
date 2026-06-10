// Shared origin allowlist for browser-callable edge functions.
// Blocks anonymous HTTP clients (curl, scripts, IP-rotating bots) while
// still allowing the production site, preview environments, and localhost.

const ALLOWED_HOSTS = [
  'mercuryrepower.ca',
  'www.mercuryrepower.ca',
  'mercury-quote-tool.lovable.app',
  'mercuryquote.ca',
  'www.mercuryquote.ca',
  'localhost',
  '127.0.0.1',
];

const ALLOWED_SUFFIXES = [
  '.lovable.app',
  '.lovable.dev',
  '.vercel.app',
];

export function isAllowedOrigin(req: Request): boolean {
  const origin = req.headers.get('origin') || req.headers.get('referer') || '';
  if (!origin) return false;
  let host: string;
  try {
    host = new URL(origin).hostname.toLowerCase();
  } catch {
    return false;
  }
  if (ALLOWED_HOSTS.includes(host)) return true;
  return ALLOWED_SUFFIXES.some((s) => host.endsWith(s));
}

export function forbiddenOriginResponse(corsHeaders: Record<string, string>) {
  return new Response(
    JSON.stringify({ error: 'Forbidden origin' }),
    { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
}
