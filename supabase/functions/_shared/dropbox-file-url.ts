const DROPBOX_FILE_HOSTS = new Set(["dropbox.com", "www.dropbox.com"]);
const MAX_DROPBOX_REDIRECTS = 3;
export const MAX_DROPBOX_FILE_BYTES = 50 * 1024 * 1024;

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
  const initialUrl = resolveAllowedDropboxFileUrl(rawUrl);
  if (!initialUrl) throw new DropboxFileSecurityError("Dropbox file URL is not allowed");
  let current: URL = initialUrl;

  for (let redirectCount = 0; redirectCount <= MAX_DROPBOX_REDIRECTS; redirectCount += 1) {
    const response: Response = await fetchImpl(current, { redirect: "manual" });
    if (![301, 302, 303, 307, 308].includes(response.status)) return response;
    if (redirectCount === MAX_DROPBOX_REDIRECTS) {
      throw new DropboxFileSecurityError("Too many Dropbox file redirects");
    }
    const location: string | null = response.headers.get("location");
    const next: URL | null = location
      ? resolveAllowedDropboxFileUrl(new URL(location, current).toString())
      : null;
    if (!next) throw new DropboxFileSecurityError("Dropbox redirect target is not allowed");
    current = next;
  }

  throw new DropboxFileSecurityError("Dropbox redirect validation failed");
}

export async function readLimitedDropboxFile(
  response: Response,
  maxBytes = MAX_DROPBOX_FILE_BYTES,
): Promise<Uint8Array> {
  const declaredLength = response.headers.get("content-length");
  if (declaredLength) {
    const parsedLength = Number(declaredLength);
    if (Number.isFinite(parsedLength) && parsedLength > maxBytes) {
      throw new DropboxFileSecurityError("Dropbox file exceeds the import size limit");
    }
  }
  if (!response.body) throw new DropboxFileSecurityError("Dropbox file response is empty");

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        throw new DropboxFileSecurityError("Dropbox file exceeds the import size limit");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  if (totalBytes === 0) throw new DropboxFileSecurityError("Dropbox file response is empty");

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}
