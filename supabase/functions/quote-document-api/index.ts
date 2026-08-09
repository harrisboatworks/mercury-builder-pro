import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, type SupabaseClient, type User } from "npm:@supabase/supabase-js@2.53.1";

import { corsHeaders as sharedCorsHeaders } from "../_shared/cors.ts";
import { isAllowedOrigin } from "../_shared/origin-check.ts";
import { checkRateLimit, getClientIdentifier, rateLimitedResponse } from "../_shared/rate-limit.ts";
import {
  authorizeQuoteDocumentDownload,
  authorizeQuoteDocumentUpload,
  MAX_QUOTE_DOCUMENT_BYTES,
  parseResumeToken,
  parseSavedQuoteId,
  QUOTE_DOCUMENT_SIGNED_URL_SECONDS,
  QuoteDocumentConflictError,
  quoteDocumentBinding,
  QuoteDocumentRequestError,
  type QuoteDocumentUser,
  QuoteDocumentUnavailableError,
  sha256Hex,
  validateQuotePdf,
} from "../_shared/quote-document-policy.ts";

const QUOTES_BUCKET = "quotes";

function responseHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin");
  return {
    ...sharedCorsHeaders,
    "Access-Control-Allow-Headers": `${sharedCorsHeaders["Access-Control-Allow-Headers"]}, x-saved-quote-id, x-resume-token`,
    "Access-Control-Allow-Origin": origin && isAllowedOrigin(req)
      ? origin
      : "https://www.mercuryrepower.ca",
    "Cache-Control": "no-store, max-age=0",
    "Vary": "Origin",
  };
}

function jsonResponse(
  req: Request,
  body: Record<string, unknown>,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...responseHeaders(req), "Content-Type": "application/json" },
  });
}

function bearerToken(req: Request): string | null {
  const authorization = req.headers.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+([^\s]+)$/i);
  return match?.[1] || null;
}

async function authenticatedUser(
  req: Request,
  supabaseUrl: string,
  anonKey: string,
): Promise<User | null> {
  const token = bearerToken(req);
  if (!token) return null;

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await authClient.auth.getUser(token);
  return error ? null : data.user;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseContentLength(req: Request): number | null {
  const value = req.headers.get("content-length");
  if (!value) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

async function uploadRequest(req: Request): Promise<{
  bytes: Uint8Array;
  savedQuoteId: string;
  resumeToken: string | null;
}> {
  if ((req.headers.get("content-type") || "").toLowerCase() !== "application/pdf") {
    throw new QuoteDocumentRequestError("Upload must be a PDF");
  }
  const contentLength = parseContentLength(req);
  if (contentLength !== null && contentLength > MAX_QUOTE_DOCUMENT_BYTES) {
    throw new QuoteDocumentRequestError("Quote document size is invalid");
  }
  if (!req.body) throw new QuoteDocumentRequestError("Quote document is required");

  const savedQuoteId = parseSavedQuoteId(req.headers.get("x-saved-quote-id"));
  const rawResumeToken = req.headers.get("x-resume-token");
  const resumeToken = rawResumeToken?.trim()
    ? parseResumeToken(rawResumeToken)
    : null;

  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_QUOTE_DOCUMENT_BYTES) {
        await reader.cancel();
        throw new QuoteDocumentRequestError("Quote document size is invalid");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  if (totalBytes < 5) throw new QuoteDocumentRequestError("Quote document size is invalid");

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { bytes, savedQuoteId, resumeToken };
}

async function downloadRequest(req: Request): Promise<{ savedQuoteId: string }> {
  if (!(req.headers.get("content-type") || "").toLowerCase().startsWith("application/json")) {
    throw new QuoteDocumentRequestError("Download request must use JSON");
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new QuoteDocumentRequestError();
  }
  if (!isObject(body) || body.action !== "download") throw new QuoteDocumentRequestError();
  return { savedQuoteId: parseSavedQuoteId(body.savedQuoteId) };
}

async function storedQuoteDocumentHash(
  service: SupabaseClient,
  canonicalPath: string,
): Promise<string | null> {
  const { data, error } = await service.storage.from(QUOTES_BUCKET).download(canonicalPath);
  if (error || !data) return null;
  try {
    const bytes = new Uint8Array(await data.arrayBuffer());
    validateQuotePdf(bytes, data.type || null);
    return await sha256Hex(bytes);
  } catch {
    return null;
  }
}

async function bindQuoteDocument(
  service: SupabaseClient,
  savedQuoteId: string,
  canonicalPath: string,
  sha256: string,
): Promise<boolean> {
  const { data, error } = await service
    .from("saved_quotes")
    .update({ quote_pdf_path: canonicalPath, quote_pdf_sha256: sha256 })
    .eq("id", savedQuoteId)
    .is("quote_pdf_path", null)
    .is("quote_pdf_sha256", null)
    .select("id")
    .maybeSingle();
  return !error && Boolean(data);
}

serve(async (req) => {
  const headers = responseHeaders(req);
  if (req.method === "OPTIONS") {
    return isAllowedOrigin(req)
      ? new Response(null, { status: 204, headers })
      : jsonResponse(req, { error: "Forbidden origin" }, 403);
  }
  if (req.method !== "POST") return jsonResponse(req, { error: "Method not allowed" }, 405);
  if (!isAllowedOrigin(req)) return jsonResponse(req, { error: "Forbidden origin" }, 403);

  const ipAllowed = await checkRateLimit(req, {
    action: "quote_document_api_ip",
    maxAttempts: 20,
    windowMinutes: 15,
  });
  if (!ipAllowed) return rateLimitedResponse(headers, 60);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceRoleKey) throw new Error("Quote document service unavailable");

    const service = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const requestUser = await authenticatedUser(req, supabaseUrl, anonKey);
    const contentType = (req.headers.get("content-type") || "").toLowerCase();

    if (contentType === "application/pdf") {
      const { bytes, savedQuoteId, resumeToken } = await uploadRequest(req);
      const quoteAllowed = await checkRateLimit(req, {
        identifier: `${getClientIdentifier(req)}:${savedQuoteId}`,
        action: "quote_document_upload",
        maxAttempts: 5,
        windowMinutes: 15,
      });
      if (!quoteAllowed) return rateLimitedResponse(headers, 60);

      const { data: row, error: rowError } = await service
        .from("saved_quotes")
        .select("id,user_id,email,resume_token,expires_at,is_soft_lead,deposit_status,quote_pdf_path,quote_pdf_sha256,quote_state")
        .eq("id", savedQuoteId)
        .maybeSingle();
      if (rowError || !row) throw new QuoteDocumentUnavailableError();

      const user: QuoteDocumentUser | null = requestUser ? { id: requestUser.id } : null;
      const canonicalPath = authorizeQuoteDocumentUpload({ row, savedQuoteId, resumeToken, user });
      validateQuotePdf(bytes, "application/pdf");
      const sha256 = await sha256Hex(bytes);
      const existing = quoteDocumentBinding({ row, savedQuoteId });
      if (existing.path) {
        const storedHash = await storedQuoteDocumentHash(service, canonicalPath);
        if (existing.sha256 === sha256 && storedHash === sha256) {
          return jsonResponse(req, { success: true });
        }
        throw new QuoteDocumentConflictError();
      }

      const { error: uploadError } = await service.storage.from(QUOTES_BUCKET).upload(
        canonicalPath,
        bytes,
        { contentType: "application/pdf", cacheControl: "60", upsert: false },
      );
      if (uploadError) {
        const storedHash = await storedQuoteDocumentHash(service, canonicalPath);
        if (storedHash !== sha256) throw new QuoteDocumentConflictError();

        if (await bindQuoteDocument(service, savedQuoteId, canonicalPath, sha256)) {
          return jsonResponse(req, { success: true });
        }
        const { data: current } = await service
          .from("saved_quotes")
          .select("id,user_id,email,resume_token,expires_at,is_soft_lead,deposit_status,quote_pdf_path,quote_pdf_sha256,quote_state")
          .eq("id", savedQuoteId)
          .maybeSingle();
        if (current) {
          const binding = quoteDocumentBinding({ row: current, savedQuoteId });
          if (
            binding.path
            && binding.sha256 === sha256
            && await storedQuoteDocumentHash(service, canonicalPath) === sha256
          ) {
            return jsonResponse(req, { success: true });
          }
          if (binding.path) throw new QuoteDocumentConflictError();
        }
        // Keep an unbound private object recoverable. Deleting after a stale
        // read could race a concurrent same-file request that just bound it.
        throw new Error("Unable to recover quote document binding");
      }

      if (!(await bindQuoteDocument(service, savedQuoteId, canonicalPath, sha256))) {
        const { data: current } = await service
          .from("saved_quotes")
          .select("id,user_id,email,resume_token,expires_at,is_soft_lead,deposit_status,quote_pdf_path,quote_pdf_sha256,quote_state")
          .eq("id", savedQuoteId)
          .maybeSingle();
        if (current) {
          const binding = quoteDocumentBinding({ row: current, savedQuoteId });
          if (
            binding.path
            && binding.sha256 === sha256
            && await storedQuoteDocumentHash(service, canonicalPath) === sha256
          ) {
            return jsonResponse(req, { success: true });
          }
          if (binding.path) throw new QuoteDocumentConflictError();
        }
        // A later same-file retry can safely recover the private orphan. Do not
        // delete here because another request may have bound it concurrently.
        throw new Error("Unable to bind quote document");
      }

      return jsonResponse(req, { success: true });
    }

    const { savedQuoteId } = await downloadRequest(req);
    const quoteAllowed = await checkRateLimit(req, {
      identifier: `${getClientIdentifier(req)}:${savedQuoteId}`,
      action: "quote_document_download",
      maxAttempts: 10,
      windowMinutes: 15,
    });
    if (!quoteAllowed) return rateLimitedResponse(headers, 60);
    if (!requestUser) throw new QuoteDocumentUnavailableError();

    const [{ data: row, error: rowError }, { data: adminRole, error: adminError }] = await Promise.all([
      service
        .from("saved_quotes")
        .select("id,user_id,email,resume_token,expires_at,is_soft_lead,deposit_status,quote_pdf_path,quote_pdf_sha256,quote_state")
        .eq("id", savedQuoteId)
        .maybeSingle(),
      service
        .from("user_roles")
        .select("role")
        .eq("user_id", requestUser.id)
        .eq("role", "admin")
        .maybeSingle(),
    ]);
    if (rowError || adminError || !row) throw new QuoteDocumentUnavailableError();

    const user: QuoteDocumentUser = {
      id: requestUser.id,
      email: requestUser.email,
      emailConfirmedAt: requestUser.email_confirmed_at,
      isAdmin: Boolean(adminRole),
    };
    const canonicalPath = authorizeQuoteDocumentDownload({ row, savedQuoteId, user });
    const { data: signed, error: signedError } = await service.storage
      .from(QUOTES_BUCKET)
      .createSignedUrl(canonicalPath, QUOTE_DOCUMENT_SIGNED_URL_SECONDS, {
        download: `Mercury-Quote-${savedQuoteId.slice(0, 8)}.pdf`,
      });
    if (signedError || !signed?.signedUrl) throw new QuoteDocumentUnavailableError();
    return jsonResponse(req, {
      signedUrl: signed.signedUrl,
      expiresIn: QUOTE_DOCUMENT_SIGNED_URL_SECONDS,
    });
  } catch (error) {
    if (error instanceof QuoteDocumentRequestError) {
      return jsonResponse(req, { error: error.message }, 400);
    }
    if (error instanceof QuoteDocumentConflictError) {
      return jsonResponse(req, { error: error.message }, 409);
    }
    if (error instanceof QuoteDocumentUnavailableError) {
      return jsonResponse(req, { error: error.message }, 404);
    }
    console.error("quote-document-api failed", error instanceof Error ? error.name : "unknown");
    return jsonResponse(req, { error: "Quote document service unavailable" }, 500);
  }
});
