import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.1";

const ALLOWED_REDIRECT_HOSTS = new Set(["grok.com", "api.x.ai", "console.x.ai"]);
const ALLOWED_SCOPE = "aggregates.read";
const CODE_TTL_MS = 5 * 60 * 1000;

const jsonHeaders = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
  "Pragma": "no-cache",
  "Referrer-Policy": "no-referrer",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function oauthError(error: string, description: string, status = 400) {
  return json({ error, error_description: description }, status);
}

function base64url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function sha256Bytes(value: string) {
  return new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
  );
}

async function sha256Hex(value: string) {
  const bytes = await sha256Bytes(value);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function allowedRedirect(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      ALLOWED_REDIRECT_HOSTS.has(url.hostname) &&
      !url.username &&
      !url.password;
  } catch {
    return false;
  }
}

function requestIdentifier(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    "oauth-client";
}

class RateLimiter {
  private hits = new Map<string, number[]>();

  allow(key: string, max: number, now = Date.now()) {
    const cutoff = now - 10 * 60 * 1000;
    const recent = (this.hits.get(key) ?? []).filter((stamp) => stamp > cutoff);
    if (recent.length >= max) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(key, recent);
    return true;
  }
}

const limiter = new RateLimiter();

function databaseClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Database client unavailable");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function authorize(req: Request, url: URL) {
  if (req.method !== "GET") return oauthError("invalid_request", "GET required", 405);
  if (!limiter.allow(`authorize:${requestIdentifier(req)}`, 120)) {
    return oauthError("temporarily_unavailable", "Rate limit exceeded", 429);
  }

  const expectedClientId = Deno.env.get("GROK_OAUTH_CLIENT_ID");
  const clientId = url.searchParams.get("client_id") ?? "";
  const redirectUri = url.searchParams.get("redirect_uri") ?? "";
  const responseType = url.searchParams.get("response_type");
  const state = url.searchParams.get("state");
  const codeChallenge = url.searchParams.get("code_challenge") ?? "";
  const challengeMethod = url.searchParams.get("code_challenge_method");
  const scope = (url.searchParams.get("scope") ?? ALLOWED_SCOPE).trim();

  if (!expectedClientId || clientId !== expectedClientId) {
    return oauthError("unauthorized_client", "Unknown client");
  }
  if (!allowedRedirect(redirectUri)) {
    console.error("[grok-supabase-oauth] rejected redirect host");
    return oauthError("invalid_request", "Redirect URI is not allowed");
  }
  if (responseType !== "code") {
    return oauthError("unsupported_response_type", "Only authorization code is supported");
  }
  if (challengeMethod !== "S256" || !/^[A-Za-z0-9_-]{43,128}$/.test(codeChallenge)) {
    return oauthError("invalid_request", "S256 PKCE is required");
  }
  if (scope.split(/\s+/).some((item) => item !== ALLOWED_SCOPE)) {
    return oauthError("invalid_scope", "Only aggregates.read is allowed");
  }
  if (state && state.length > 2048) {
    return oauthError("invalid_request", "State is too long");
  }

  const rawCode = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const codeHash = await sha256Hex(rawCode);
  const expiresAt = new Date(Date.now() + CODE_TTL_MS).toISOString();
  const { error } = await databaseClient().rpc("grok_oauth_store_code", {
    p_code_hash: codeHash,
    p_code_challenge: codeChallenge,
    p_redirect_uri: redirectUri,
    p_expires_at: expiresAt,
  });
  if (error) {
    console.error(`[grok-supabase-oauth] store failed with ${error.code || "unknown"}`);
    return oauthError("server_error", "Authorization unavailable", 500);
  }

  const redirect = new URL(redirectUri);
  redirect.searchParams.set("code", rawCode);
  if (state) redirect.searchParams.set("state", state);
  return new Response(null, {
    status: 302,
    headers: {
      "Cache-Control": "no-store",
      "Location": redirect.toString(),
      "Pragma": "no-cache",
      "Referrer-Policy": "no-referrer",
    },
  });
}

async function token(req: Request) {
  if (req.method !== "POST") return oauthError("invalid_request", "POST required", 405);
  if (!limiter.allow(`token:${requestIdentifier(req)}`, 60)) {
    return oauthError("temporarily_unavailable", "Rate limit exceeded", 429);
  }

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/x-www-form-urlencoded")) {
    return oauthError("invalid_request", "Form encoding required");
  }
  const bodyText = await req.text();
  if (new TextEncoder().encode(bodyText).byteLength > 16 * 1024) {
    return oauthError("invalid_request", "Request too large", 413);
  }
  const body = new URLSearchParams(bodyText);
  const expectedClientId = Deno.env.get("GROK_OAUTH_CLIENT_ID");
  const accessToken = Deno.env.get("GROK_SUPABASE_READ_TOKEN");
  const grantType = body.get("grant_type");
  const clientId = body.get("client_id") ?? "";
  const code = body.get("code") ?? "";
  const redirectUri = body.get("redirect_uri") ?? "";
  const verifier = body.get("code_verifier") ?? "";

  if (!expectedClientId || !accessToken || accessToken.length < 32) {
    return oauthError("server_error", "Authorization unavailable", 503);
  }
  if (clientId !== expectedClientId) {
    return oauthError("invalid_client", "Unknown client", 401);
  }
  if (grantType !== "authorization_code") {
    return oauthError("unsupported_grant_type", "Only authorization_code is supported");
  }
  if (!allowedRedirect(redirectUri) || !/^[A-Za-z0-9._~-]{43,128}$/.test(verifier) ||
      !/^[A-Za-z0-9_-]{43,128}$/.test(code)) {
    return oauthError("invalid_grant", "Invalid authorization grant");
  }

  const codeHash = await sha256Hex(code);
  const challenge = base64url(await sha256Bytes(verifier));
  const { data, error } = await databaseClient().rpc("grok_oauth_consume_code", {
    p_code_hash: codeHash,
    p_code_challenge: challenge,
    p_redirect_uri: redirectUri,
  });
  if (error) {
    console.error(`[grok-supabase-oauth] consume failed with ${error.code || "unknown"}`);
    return oauthError("server_error", "Authorization unavailable", 500);
  }
  if (data !== true) return oauthError("invalid_grant", "Authorization code is invalid or expired");

  return json({
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 31_536_000,
    scope: ALLOWED_SCOPE,
  });
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  try {
    if (url.pathname.endsWith("/authorize")) return await authorize(req, url);
    if (url.pathname.endsWith("/token")) return await token(req);
    if (req.method === "GET") {
      return json({
        issuer: url.origin + "/functions/v1/grok-supabase-oauth",
        authorization_endpoint: url.origin + "/functions/v1/grok-supabase-oauth/authorize",
        token_endpoint: url.origin + "/functions/v1/grok-supabase-oauth/token",
        response_types_supported: ["code"],
        grant_types_supported: ["authorization_code"],
        code_challenge_methods_supported: ["S256"],
        scopes_supported: [ALLOWED_SCOPE],
        token_endpoint_auth_methods_supported: ["none"],
      });
    }
    return oauthError("invalid_request", "Unknown endpoint", 404);
  } catch {
    console.error("[grok-supabase-oauth] internal error");
    return oauthError("server_error", "Authorization unavailable", 500);
  }
});
