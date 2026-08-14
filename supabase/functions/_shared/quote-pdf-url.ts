const ALLOWED_QUOTE_PDF_HOSTS = new Set([
  "eutsoqdpjurknjsshxes.supabase.co",
  "www.mercuryrepower.ca",
]);

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

export class QuotePdfSecurityError extends Error {}

export function resolveAllowedQuotePdfUrl(rawUrl: string): URL | null {
  try {
    const url = new URL(rawUrl);
    if (
      url.protocol !== "https:"
      || url.username
      || url.password
      || url.port
      || url.hostname.endsWith(".")
      || !ALLOWED_QUOTE_PDF_HOSTS.has(url.hostname.toLowerCase())
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
    return response.arrayBuffer();
  }

  throw new QuotePdfSecurityError("PDF redirect limit exceeded");
}
