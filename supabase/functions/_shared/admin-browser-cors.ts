import { resolveAllowedBrowserOrigin } from "./browser-origin.ts";

const ALLOWED_HEADERS = [
  "authorization",
  "x-client-info",
  "apikey",
  "content-type",
  "x-session-id",
  "x-supabase-client-platform",
  "x-supabase-client-platform-version",
  "x-supabase-client-runtime",
  "x-supabase-client-runtime-version",
].join(", ");

export function resolveAdminBrowserCors(
  req: Request,
  methods = "POST, OPTIONS",
): { origin: string | null; headers: Record<string, string> } {
  const origin = resolveAllowedBrowserOrigin(req.headers.get("origin"));
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Allow-Methods": methods,
    "Cache-Control": "no-store",
    "Vary": "Origin",
  };

  if (origin) headers["Access-Control-Allow-Origin"] = origin;
  return { origin, headers };
}

export function forbiddenAdminBrowserOrigin(headers: Record<string, string>): Response {
  return new Response(JSON.stringify({ error: "Forbidden origin" }), {
    status: 403,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}
