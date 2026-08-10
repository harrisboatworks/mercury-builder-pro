const PAYMENT_ORIGINS = new Set([
  "https://www.mercuryrepower.ca",
  "https://mercuryrepower.ca",
  "https://quote.harrisboatworks.ca",
  "https://www.mercuryquote.ca",
  "https://mercuryquote.ca",
  "https://mercury-builder-pro.vercel.app",
  "https://mercury-builder-pro-hbw.vercel.app",
  "https://mercury-builder-pro-git-main-hbw.vercel.app",
]);

function configuredPreviewOrigins(rawOrigins?: string): Set<string> {
  const origins = new Set<string>();

  for (const candidate of rawOrigins?.split(",") ?? []) {
    const rawOrigin = candidate.trim();
    if (!rawOrigin) continue;

    try {
      const parsed = new URL(rawOrigin);
      if (parsed.protocol === "https:" && rawOrigin === parsed.origin) {
        origins.add(parsed.origin);
      }
    } catch {
      // Invalid entries stay fail-closed instead of widening the allowlist.
    }
  }

  return origins;
}

export function resolvePaymentOrigin(
  req: Request,
  previewOrigins?: string,
): string | null {
  const rawOrigin = req.headers.get("origin");
  if (!rawOrigin) return null;

  try {
    const parsed = new URL(rawOrigin);
    if (rawOrigin !== parsed.origin) return null;

    if (
      PAYMENT_ORIGINS.has(parsed.origin)
      || configuredPreviewOrigins(previewOrigins).has(parsed.origin)
    ) {
      return parsed.origin;
    }

    if (
      parsed.protocol === "http:"
      && (parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost")
    ) {
      return parsed.origin;
    }
  } catch {
    return null;
  }

  return null;
}
