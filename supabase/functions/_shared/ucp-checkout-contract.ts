import {
  addSafeCents,
  isPublicAvailabilityEligible,
  isVeradoMotor,
  multiplySafeCents,
  PUBLIC_VERADO_POLICY,
  resolvePublicSellingPrice,
  toFinitePositiveCents,
  type PublicMotorRow,
} from "./public-motor-contract.ts";
import { applyMotorPresentationOverrides } from "./motor-slug.ts";

export const UCP_MAX_LINE_ITEMS = 10;
export const UCP_MAX_QUANTITY = 12;
export const UCP_QUOTE_SCOPE_NOTICE =
  "UCP checkout is motor merchandise plus estimated HST and pickup only. Installation, propeller, and trade-in are not included. A full repower quote uses the public build_quote action and requires human confirmation. Payment is not collected through UCP.";

const MOTOR_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class UcpClientError extends Error {
  status: number;
  code: string;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = "UcpClientError";
    this.code = code;
    this.status = status;
  }
}

export type ParsedUcpLineItem = {
  itemId: string;
  quantity: number;
};

export function parseUcpCheckoutLineItems(rawItems: unknown): ParsedUcpLineItem[] {
  if (!Array.isArray(rawItems)) {
    throw new UcpClientError("invalid_request", "checkout.line_items must be an array.");
  }
  if (rawItems.length === 0) {
    throw new UcpClientError("invalid_request", "checkout.line_items must be a nonempty array.");
  }
  if (rawItems.length > UCP_MAX_LINE_ITEMS) {
    throw new UcpClientError(
      "invalid_request",
      `checkout.line_items is limited to ${UCP_MAX_LINE_ITEMS} items.`,
    );
  }

  return rawItems.map((raw, index) => {
    const record = raw !== null && typeof raw === "object" && !Array.isArray(raw)
      ? raw as Record<string, unknown>
      : null;
    if (!record) {
      throw new UcpClientError("invalid_request", `Line item ${index + 1} must be an object.`);
    }
    const nested = record.item !== null && typeof record.item === "object" && !Array.isArray(record.item)
      ? record.item as Record<string, unknown>
      : null;
    const itemId = nested?.id ?? record.id;
    if (typeof itemId !== "string" || !MOTOR_ID_RE.test(itemId)) {
      throw new UcpClientError(
        "invalid_request",
        `Line item ${index + 1} requires a valid motor item id.`,
      );
    }
    const quantity = record.quantity === undefined ? 1 : record.quantity;
    if (
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > UCP_MAX_QUANTITY
    ) {
      throw new UcpClientError(
        "invalid_request",
        `Line item ${index + 1} quantity must be a bounded positive integer.`,
      );
    }
    return { itemId, quantity };
  });
}

function isIpv4Hostname(hostname: string): boolean {
  return /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname);
}

function isIpHostname(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  return isIpv4Hostname(host) || host.includes(":") || host === "localhost";
}

export function parseUcpAllowedOrigins(raw: string | null | undefined): string[] {
  if (!raw || !raw.trim()) return [];
  const origins: string[] = [];
  for (const part of raw.split(",")) {
    const normalized = normalizeHttpsOrigin(part.trim());
    if (normalized) origins.push(normalized);
  }
  return origins;
}

function normalizeHttpsOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    if (isIpHostname(url.hostname)) return null;
    if (url.port && url.port !== "443") return null;
    return url.origin.toLowerCase();
  } catch {
    return null;
  }
}

export function inspectUcpProfileUrl(
  rawUrl: string,
  allowedOrigins: string[],
): { action: "fetch"; href: string } | { action: "skip"; reason: string } {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { action: "skip", reason: "UCP-Agent profile URL is not a valid absolute URL." };
  }
  if (parsed.protocol !== "https:") {
    return { action: "skip", reason: "UCP-Agent profile URL must be HTTPS." };
  }
  if (parsed.username || parsed.password) {
    return { action: "skip", reason: "UCP-Agent profile URL must not include userinfo." };
  }
  if (isIpHostname(parsed.hostname)) {
    return { action: "skip", reason: "UCP-Agent profile URL must not use an IP literal or localhost." };
  }
  if (parsed.port && parsed.port !== "443") {
    return { action: "skip", reason: "UCP-Agent profile URL must use the standard HTTPS port." };
  }
  if (allowedOrigins.length === 0) {
    return {
      action: "skip",
      reason: "UCP profile fetch is disabled until allowed HTTPS origins are configured.",
    };
  }
  if (!allowedOrigins.includes(parsed.origin.toLowerCase())) {
    return { action: "skip", reason: "UCP-Agent profile origin is not on the server allowlist." };
  }
  return { action: "fetch", href: parsed.href };
}

export async function checkUcpPlatformProfile(input: {
  url: string | null;
  strict: boolean;
  allowedOrigins: string[];
  fetchImpl?: typeof fetch;
  cache?: Map<string, { ok: boolean; ts: number }>;
  now?: number;
  ttlMs?: number;
}): Promise<{ warning?: { code: string; severity: string; content: string }; reject?: { code: string; status: number } }> {
  const {
    url,
    strict,
    allowedOrigins,
    fetchImpl,
    cache,
    now = Date.now(),
    ttlMs = 60_000,
  } = input;

  if (!url) {
    return strict
      ? { reject: { code: "invalid_profile_url", status: 400 } }
      : {
        warning: {
          code: "profile_missing",
          severity: "info",
          content: "No UCP-Agent profile presented; proceeding in open quote mode.",
        },
      };
  }

  const decision = inspectUcpProfileUrl(url, allowedOrigins);
  if (decision.action === "skip") {
    return strict
      ? { reject: { code: "invalid_profile_url", status: 400 } }
      : {
        warning: {
          code: "profile_fetch_skipped",
          severity: "info",
          content: `${decision.reason} Proceeding in open quote mode.`,
        },
      };
  }

  const cached = cache?.get(decision.href);
  if (cached && now - cached.ts < ttlMs) {
    if (cached.ok || !strict) return {};
    return { reject: { code: "profile_unreachable", status: 424 } };
  }

  if (!fetchImpl) {
    return strict
      ? { reject: { code: "profile_unreachable", status: 424 } }
      : {
        warning: {
          code: "profile_unreachable",
          severity: "info",
          content: "Platform profile could not be fetched; proceeding in open quote mode.",
        },
      };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    const response = await fetchImpl(decision.href, {
      redirect: "error",
      signal: controller.signal,
    });
    let ok = response.ok;
    if (ok) {
      try {
        await response.json();
      } catch {
        ok = false;
      }
    }
    cache?.set(decision.href, { ok, ts: now });
    if (!ok && strict) return { reject: { code: "profile_unreachable", status: 424 } };
    return ok
      ? {}
      : {
        warning: {
          code: "profile_unreachable",
          severity: "info",
          content: "Platform profile could not be fetched; proceeding in open quote mode.",
        },
      };
  } catch {
    cache?.set(decision.href, { ok: false, ts: now });
    if (strict) return { reject: { code: "profile_unreachable", status: 424 } };
    return {
      warning: {
        code: "profile_unreachable",
        severity: "info",
        content: "Platform profile could not be fetched; proceeding in open quote mode.",
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

export function ucpQuoteScopeMessage() {
  return {
    code: "quote_scope_motor_only",
    severity: "info",
    content: UCP_QUOTE_SCOPE_NOTICE,
  };
}

export function resolveUcpPricedItem(sourceMotor: PublicMotorRow, quantity: number) {
  const motor = applyMotorPresentationOverrides(sourceMotor);
  if (!isPublicAvailabilityEligible(motor)) {
    return { problem: { code: "item_not_found", content: `Item ${motor.id} was not found in current Mercury inventory. Search the catalog and retry.` } };
  }
  if (isVeradoMotor(motor)) {
    return {
      problem: {
        code: "special_order_only",
        content: PUBLIC_VERADO_POLICY.message,
      },
    };
  }
  const priceCad = resolvePublicSellingPrice(motor);
  const cents = toFinitePositiveCents(priceCad);
  const lineTotal = cents === null ? null : multiplySafeCents(cents, quantity);
  if (cents === null || lineTotal === null) {
    return {
      problem: {
        code: "price_unavailable",
        content: `Item ${motor.id} has no published finite public price.`,
      },
    };
  }
  return {
    motor,
    cents,
    quantity,
    lineTotal,
  };
}

export function ucpTaxAndTotal(subtotalCents: number, hstRate: number) {
  if (!Number.isSafeInteger(subtotalCents) || subtotalCents < 0) return null;
  const tax = Math.round(subtotalCents * hstRate);
  const total = addSafeCents(subtotalCents, tax);
  if (!Number.isSafeInteger(tax) || tax < 0 || total === null) return null;
  return { tax, total };
}
