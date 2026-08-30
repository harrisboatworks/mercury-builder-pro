// Shared CORS boundary for browser-callable edge functions. This is not
// authentication: non-browser clients can forge Origin and Referer headers.
import { resolveAllowedBrowserOrigin } from "./browser-origin.ts";
import { corsHeaders as sharedCorsAllowList } from "./cors.ts";

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

export function authenticatedBrowserCors(req: Request): {
  allowedOrigin: string | null;
  headers: Record<string, string>;
  forbiddenOrigin: boolean;
} {
  const rawOrigin = req.headers.get("origin");
  const allowedOrigin = resolveAllowedBrowserOrigin(rawOrigin);
  const forbiddenOrigin = Boolean(rawOrigin) && !allowedOrigin;
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": sharedCorsAllowList["Access-Control-Allow-Headers"],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
    "Content-Type": "application/json",
  };
  if (allowedOrigin) {
    headers["Access-Control-Allow-Origin"] = allowedOrigin;
  }
  return { allowedOrigin, headers, forbiddenOrigin };
}
