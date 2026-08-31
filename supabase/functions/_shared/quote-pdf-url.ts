import {
  MAX_QUOTE_DOCUMENT_BYTES,
  readLimitedStream,
  validateQuotePdf,
} from "./quote-document-policy.ts";

const SUPABASE_QUOTE_PDF_HOST = "eutsoqdpjurknjsshxes.supabase.co";
const CANONICAL_SITE_HOST = "www.mercuryrepower.ca";
const PUBLIC_SPEC_SHEETS_PREFIX = "/storage/v1/object/public/spec-sheets/";

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

export class QuotePdfSecurityError extends Error {}

export function resolveAllowedQuotePdfUrl(rawUrl: string): URL | null {
  try {
    const url = new URL(rawUrl);
    const hostname = url.hostname.toLowerCase();
    const pathname = url.pathname.toLowerCase();
    const allowedPath = hostname === SUPABASE_QUOTE_PDF_HOST
      ? pathname.startsWith(PUBLIC_SPEC_SHEETS_PREFIX) && pathname.endsWith(".pdf")
      : hostname === CANONICAL_SITE_HOST && pathname.endsWith(".pdf");
    if (
      url.protocol !== "https:"
      || url.username
      || url.password
      || url.port
      || url.hostname.endsWith(".")
      || !allowedPath
    ) return null;
    return url;
  } catch {
    return null;
  }
}

export async function fetchAllowedQuotePdf(
  rawUrl: string,
  fetchImpl: typeof fetch = fetch,
  maxRedirects = 3,
): Promise<ArrayBuffer> {
  let currentUrl = resolveAllowedQuotePdfUrl(rawUrl);
  if (!currentUrl) throw new QuotePdfSecurityError("PDF URL is not allowed");

  for (let redirects = 0; redirects <= maxRedirects; redirects += 1) {
    const response = await fetchImpl(currentUrl, { redirect: "manual" });
    if (REDIRECT_STATUSES.has(response.status)) {
      if (redirects === maxRedirects) {
        throw new QuotePdfSecurityError("PDF redirect limit exceeded");
      }
      const location = response.headers.get("location");
      if (!location) throw new QuotePdfSecurityError("PDF redirect is missing a location");
      const nextUrl = resolveAllowedQuotePdfUrl(new URL(location, currentUrl).toString());
      if (!nextUrl) throw new QuotePdfSecurityError("PDF redirect target is not allowed");
      currentUrl = nextUrl;
      continue;
    }

    if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.status}`);

    const declaredLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_QUOTE_DOCUMENT_BYTES) {
      throw new QuotePdfSecurityError("PDF response is too large");
    }
    if (!response.body) throw new QuotePdfSecurityError("PDF response is empty");

    try {
      const bytes = await readLimitedStream(response.body, MAX_QUOTE_DOCUMENT_BYTES);
      const contentType = response.headers.get("content-type")?.split(";", 1)[0].trim() || null;
      validateQuotePdf(bytes, contentType);
      return bytes.slice().buffer;
    } catch {
      throw new QuotePdfSecurityError("PDF response is invalid");
    }
  }

  throw new QuotePdfSecurityError("PDF redirect limit exceeded");
}
