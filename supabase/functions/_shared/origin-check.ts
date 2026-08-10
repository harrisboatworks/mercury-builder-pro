// Shared origin allowlist for browser-callable edge functions.
// Blocks anonymous HTTP clients (curl, scripts, IP-rotating bots) while
// still allowing the production site, preview environments, and localhost.

const ALLOWED_HOSTS = [
  'mercuryrepower.ca',
  'www.mercuryrepower.ca',
  'quote.harrisboatworks.ca',
  'mercuryquote.ca',
  'www.mercuryquote.ca',
  'localhost',
  '127.0.0.1',
];

// Only this project's own team-scoped Vercel previews. Open wildcards
// (.lovable.app / .lovable.dev / bare .vercel.app) removed 2026-08-09.
const ALLOWED_PREVIEW_HOST = /^mercury-builder[a-z0-9-]*-hbw\.vercel\.app$/;

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
  return ALLOWED_PREVIEW_HOST.test(host);
}

export function forbiddenOriginResponse(corsHeaders: Record<string, string>) {
  return new Response(
    JSON.stringify({ error: 'Forbidden origin' }),
    { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
}
