export const PUBLIC_SITE_URL = "https://www.mercuryrepower.ca";

export function toPublicImageUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    const url = new URL(value.trim(), `${PUBLIC_SITE_URL}/`);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}
