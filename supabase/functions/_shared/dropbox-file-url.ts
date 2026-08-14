const DROPBOX_FILE_HOSTS = new Set(["dropbox.com", "www.dropbox.com"]);
const MAX_DROPBOX_REDIRECTS = 3;

export class DropboxFileSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DropboxFileSecurityError";
  }
}

export function resolveAllowedDropboxFileUrl(rawUrl: string): URL | null {
  try {
    const url = new URL(rawUrl);
    const hostname = url.hostname.toLowerCase();
    const allowedHost = DROPBOX_FILE_HOSTS.has(hostname)
      || hostname.endsWith(".dropboxusercontent.com");
    if (
      url.protocol !== "https:"
      || !allowedHost
      || url.username
      || url.password
      || url.port
      || hostname.endsWith(".")
    ) return null;
    return url;
  } catch {
    return null;
  }
}

export async function fetchAllowedDropboxFile(
  rawUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  let current = resolveAllowedDropboxFileUrl(rawUrl);
  if (!current) throw new DropboxFileSecurityError("Dropbox file URL is not allowed");

  for (let redirectCount = 0; redirectCount <= MAX_DROPBOX_REDIRECTS; redirectCount += 1) {
    const response = await fetchImpl(current, { redirect: "manual" });
    if (![301, 302, 303, 307, 308].includes(response.status)) return response;
    if (redirectCount === MAX_DROPBOX_REDIRECTS) {
      throw new DropboxFileSecurityError("Too many Dropbox file redirects");
    }
    const location = response.headers.get("location");
    const next = location ? resolveAllowedDropboxFileUrl(new URL(location, current).toString()) : null;
    if (!next) throw new DropboxFileSecurityError("Dropbox redirect target is not allowed");
    current = next;
  }

  throw new DropboxFileSecurityError("Dropbox redirect validation failed");
}
