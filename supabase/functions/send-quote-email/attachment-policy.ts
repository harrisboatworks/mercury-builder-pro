export const MAX_QUOTE_PDF_BYTES = 5 * 1024 * 1024;
export const QUOTE_PDF_FETCH_TIMEOUT_MS = 10_000;

const SPEC_SHEETS_PUBLIC_PATH = "/storage/v1/object/public/spec-sheets/";
const QUOTE_PAGE_HOSTS = new Set([
  "mercuryrepower.ca",
  "www.mercuryrepower.ca",
]);
const SAVED_QUOTE_PATH = /^\/quote\/saved\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

function parseHttpsUrl(rawUrl: string, label: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error(`${label} must be a valid URL`);
  }

  if (url.protocol !== "https:") throw new Error(`${label} must use HTTPS`);
  if (url.username || url.password) throw new Error(`${label} cannot contain credentials`);
  return url;
}

export function validateQuotePdfUrl(rawUrl: string, supabaseUrl: string): URL {
  const url = parseHttpsUrl(rawUrl, "PDF URL");
  const storageOrigin = parseHttpsUrl(supabaseUrl, "Supabase URL");

  if (url.hostname !== storageOrigin.hostname || url.port !== storageOrigin.port) {
    throw new Error("PDF URL must use this project's Supabase Storage host");
  }
  if (!url.pathname.startsWith(SPEC_SHEETS_PUBLIC_PATH) || url.pathname === SPEC_SHEETS_PUBLIC_PATH) {
    throw new Error("PDF URL must point to the public spec-sheets bucket");
  }
  const objectKey = url.pathname.slice(SPEC_SHEETS_PUBLIC_PATH.length);
  if (/%(?:2e|2f|5c|25)/i.test(objectKey)) {
    throw new Error("PDF URL object key contains unsafe path encoding");
  }
  if (url.search || url.hash) throw new Error("PDF URL cannot contain a query or fragment");

  return url;
}

export function validateQuotePageUrl(rawUrl: string): URL {
  const url = parseHttpsUrl(rawUrl, "Quote page URL");
  if (url.port || !QUOTE_PAGE_HOSTS.has(url.hostname)) {
    throw new Error("Quote page URL must use mercuryrepower.ca");
  }
  if (!SAVED_QUOTE_PATH.test(url.pathname) || url.search || url.hash) {
    throw new Error("Quote page URL must be a canonical saved quote URL");
  }
  return url;
}

function parseContentLength(value: string | null): number | null {
  if (value === null) return null;
  if (!/^\d+$/.test(value)) throw new Error("PDF response has an invalid Content-Length");
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) throw new Error("PDF response Content-Length is unsafe");
  return parsed;
}

async function cancelBody(body: ReadableStream<Uint8Array> | null): Promise<void> {
  try {
    await body?.cancel();
  } catch {
    // Rejection cleanup is best effort. The original validation error is more useful.
  }
}

async function readBodyWithLimit(response: Response, maxBytes: number): Promise<Uint8Array> {
  if (!response.body) throw new Error("PDF response has no body");

  let advertisedLength: number | null;
  try {
    advertisedLength = parseContentLength(response.headers.get("content-length"));
  } catch (error) {
    await cancelBody(response.body);
    throw error;
  }
  if (advertisedLength !== null && advertisedLength > maxBytes) {
    await cancelBody(response.body);
    throw new Error("PDF response exceeds the attachment size limit");
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel("PDF response exceeds the attachment size limit");
        throw new Error("PDF response exceeds the attachment size limit");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

function hasPdfSignature(bytes: Uint8Array): boolean {
  return bytes.byteLength >= 5
    && bytes[0] === 0x25
    && bytes[1] === 0x50
    && bytes[2] === 0x44
    && bytes[3] === 0x46
    && bytes[4] === 0x2d;
}

export async function fetchValidatedQuotePdf(options: {
  rawUrl: string;
  supabaseUrl: string;
  fetchImpl?: FetchLike;
  maxBytes?: number;
  timeoutMs?: number;
}): Promise<Uint8Array> {
  const {
    rawUrl,
    supabaseUrl,
    fetchImpl = fetch,
    maxBytes = MAX_QUOTE_PDF_BYTES,
    timeoutMs = QUOTE_PDF_FETCH_TIMEOUT_MS,
  } = options;
  const url = validateQuotePdfUrl(rawUrl, supabaseUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(url, {
      redirect: "error",
      signal: controller.signal,
    });
    if (!response.ok) {
      await cancelBody(response.body);
      throw new Error(`PDF fetch failed with status ${response.status}`);
    }

    const contentType = response.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
    if (contentType !== "application/pdf") {
      await cancelBody(response.body);
      throw new Error("PDF response has an invalid Content-Type");
    }

    const bytes = await readBodyWithLimit(response, maxBytes);
    if (!hasPdfSignature(bytes)) throw new Error("PDF response has an invalid file signature");
    return bytes;
  } finally {
    clearTimeout(timeout);
  }
}
