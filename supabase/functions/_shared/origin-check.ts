// Shared CORS boundary for browser-callable edge functions. This is not
// authentication: non-browser clients can forge Origin and Referer headers.
import { resolveAllowedBrowserOrigin } from "./browser-origin.ts";

export function isAllowedOrigin(req: Request): boolean {
  const origin = req.headers.get('origin') || req.headers.get('referer') || '';
  return resolveAllowedBrowserOrigin(origin) !== null;
}

export function forbiddenOriginResponse(corsHeaders: Record<string, string>) {
  return new Response(
    JSON.stringify({ error: 'Forbidden origin' }),
    { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
}

// Server-to-server callers (ElevenLabs MCP) send no Origin. A service-role
// bearer is the exception for those paths; it is not a browser check.
export function isServiceRoleBearer(req: Request): boolean {
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceRoleKey) return false;
  const authorization = req.headers.get("authorization") || "";
  return authorization === `Bearer ${serviceRoleKey}`;
}
