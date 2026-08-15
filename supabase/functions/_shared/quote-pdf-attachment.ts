/**
 * Quote PDF attachment safety.
 *
 * The previous implementation fetched an arbitrary caller-supplied URL and
 * labelled whatever came back as `Quote-<n>.pdf`. Two separate defects:
 *
 *   1. SSRF - any URL, including internal metadata endpoints, was fetched by
 *      the edge function with no allowlist.
 *   2. Content confusion - `src/components/admin/SendQuoteEmail.tsx` passed a
 *      *web page* (`/quote/saved/<id>`), so customers received an HTML
 *      document with a `.pdf` filename. Mail clients show a broken attachment.
 *
 * This module accepts only a genuine, generated PDF artifact: HTTPS, an
 * allowlisted host, an allowlisted path prefix, a 200 response, an
 * `application/pdf` content type, a real `%PDF-` signature, and a size within
 * bounds. Anything else is rejected and the caller sends the email WITHOUT an
 * attachment rather than attaching something misleading.
 */

/** Supabase Storage origin for this project, plus the canonical site host. */
const ALLOWED_PDF_HOSTS = new Set([
  "eutsoqdpjurknjsshxes.supabase.co",
  "www.mercuryrepower.ca",
]);

/**
 * Path prefixes that can serve a generated PDF artifact.
 * `/quote/saved/...` is deliberately absent: it is an HTML page, not a PDF.
 */
const ALLOWED_PDF_PATH_PREFIXES = [
  "/storage/v1/object/public/spec-sheets/",
  "/storage/v1/object/public/quote-pdfs/",
  "/storage/v1/object/sign/spec-sheets/",
  "/storage/v1/object/sign/quote-pdfs/",
];

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

/**
 * 10 MB ceiling. Lowered from 25 MB: Resend's own attachment limit is well
 * under this, and the previous code read the whole body into memory before
 * checking any size at all. The reader below stops at this bound.
 */
export const MAX_PDF_BYTES = 10 * 1024 * 1024;
/** Whole-fetch budget, so a slow or stalled origin cannot pin the function. */
export const PDF_FETCH_TIMEOUT_MS = 15_000;
/** A valid quote PDF is never this small; catches error pages served as PDF. */
export const MIN_PDF_BYTES = 512;

export class QuotePdfRejected extends Error {
  constructor(public readonly reason: string) {
    super(reason);
    this.name = "QuotePdfRejected";
  }
}

/**
 * Validate the URL shape only. Returns the parsed URL, or null with a reason.
 * Pure and synchronous so it can be unit-tested without network access.
 */
export function resolveQuotePdfUrl(
  rawUrl: string,
): { url: URL } | { url: null; reason: string } {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { url: null, reason: "unparseable-url" };
  }

  if (url.protocol !== "https:") return { url: null, reason: "not-https" };
  if (url.username || url.password) return { url: null, reason: "embedded-credentials" };
  if (url.port) return { url: null, reason: "explicit-port" };

  const host = url.hostname.toLowerCase();
  if (host.endsWith(".")) return { url: null, reason: "trailing-dot-host" };
  if (!ALLOWED_PDF_HOSTS.has(host)) return { url: null, reason: "host-not-allowlisted" };

  let path: string;
  try {
    path = decodeURIComponent(url.pathname);
  } catch {
    return { url: null, reason: "unparseable-path" };
  }
  if (path.includes("..")) return { url: null, reason: "path-traversal" };
  if (!ALLOWED_PDF_PATH_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return { url: null, reason: "path-not-a-pdf-artifact" };
  }

  return { url };
}

/** True when the bytes begin with a PDF signature. */
export function hasPdfSignature(bytes: Uint8Array): boolean {
  const head = bytes.subarray(0, 5);
  if (head.length < 5) return false;
  return head[0] === 0x25 && head[1] === 0x50 && head[2] === 0x44 &&
    head[3] === 0x46 && head[4] === 0x2d;
}

/** Content types Supabase Storage may return for a stored PDF. */
export function isPdfContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  const base = contentType.split(";")[0]!.trim().toLowerCase();
  return base === "application/pdf" || base === "application/x-pdf";
}

export interface QuotePdfAttachment {
  bytes: Uint8Array;
  byteLength: number;
  contentType: string;
}

/**
 * Fetch and fully validate a quote PDF. Throws QuotePdfRejected with a stable
 * machine-readable reason so the caller can log without leaking the URL.
 */
export async function fetchQuotePdfAttachment(
  rawUrl: string,
  fetchImpl: typeof fetch = fetch,
  maxRedirects = 3,
): Promise<QuotePdfAttachment> {
  const resolved = resolveQuotePdfUrl(rawUrl);
  if (!resolved.url) throw new QuotePdfRejected(resolved.reason);

  let currentUrl: URL = resolved.url;

  for (let hop = 0; hop <= maxRedirects; hop += 1) {
    const response = await fetchImpl(currentUrl.toString(), {
      redirect: "manual",
      signal: AbortSignal.timeout(PDF_FETCH_TIMEOUT_MS),
    });

    if (REDIRECT_STATUSES.has(response.status)) {
      if (hop === maxRedirects) throw new QuotePdfRejected("redirect-limit-exceeded");
      const location = response.headers.get("location");
      if (!location) throw new QuotePdfRejected("redirect-missing-location");
      const next = resolveQuotePdfUrl(new URL(location, currentUrl).toString());
      if (!next.url) throw new QuotePdfRejected("redirect-" + next.reason);
      currentUrl = next.url;
      continue;
    }

    if (response.status !== 200) throw new QuotePdfRejected("status-" + response.status);

    const contentType = response.headers.get("content-type");
    if (!isPdfContentType(contentType)) throw new QuotePdfRejected("content-type-not-pdf");

    // content-length is optional and untrusted; treat it only as an early out.
    const declaredLength = Number(response.headers.get("content-length") || "0");
    if (declaredLength > MAX_PDF_BYTES) throw new QuotePdfRejected("declared-size-too-large");

    // Read with a hard bound rather than buffering an unbounded body first.
    const bytes = await readBounded(response, MAX_PDF_BYTES);
    if (bytes.byteLength < MIN_PDF_BYTES) throw new QuotePdfRejected("size-too-small");
    if (!hasPdfSignature(bytes)) throw new QuotePdfRejected("missing-pdf-signature");

    return {
      bytes,
      byteLength: bytes.byteLength,
      contentType: contentType!.split(";")[0]!.trim().toLowerCase(),
    };
  }

  throw new QuotePdfRejected("redirect-limit-exceeded");
}

/**
 * Read a response body, aborting as soon as it exceeds `limit`. Falls back to
 * arrayBuffer() only when the body is not streamable (test doubles), and
 * re-checks the bound afterwards either way.
 */
async function readBounded(response: Response, limit: number): Promise<Uint8Array> {
  const body = response.body;
  if (!body || typeof body.getReader !== "function") {
    const buffered = new Uint8Array(await response.arrayBuffer());
    if (buffered.byteLength > limit) throw new QuotePdfRejected("size-too-large");
    return buffered;
  }

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > limit) {
        await reader.cancel("size-limit-exceeded").catch(() => {});
        throw new QuotePdfRejected("size-too-large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock?.();
  }

  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

/** Chunked base64 so a multi-MB PDF does not blow the call stack. */
export function encodeBase64(bytes: Uint8Array): string {
  const CHUNK = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}
