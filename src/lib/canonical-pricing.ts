// Shared runtime helper for canonical Mercury pricing.
// Pulls structured data from src/data/canonical-pricing.generated.ts
// (regenerated from public/pricing-reference.md whenever MSRPs change).
//
// Use these helpers anywhere a blog post FAQ, JSON-LD offer, cost-stack
// range, or monthly payment estimate would otherwise hard-code a $XX,XXX
// figure. Eliminates manual price drift across content surfaces.

import {
  CANONICAL_SKUS,
  CANONICAL_RANGES,
  CANONICAL_LAST_UPDATED,
  type CanonicalSku,
  type CanonicalRange,
} from '@/data/canonical-pricing.generated';

export { CANONICAL_LAST_UPDATED };
export type { CanonicalSku, CanonicalRange };

const bySlug = new Map(CANONICAL_SKUS.map((s) => [s.slug, s]));
const byPartNo = new Map(CANONICAL_SKUS.map((s) => [s.partNo, s]));

/** Look up a SKU by slug (e.g. "115-elpt-pro-xs") or Mercury part number (e.g. "1A41312LK"). */
export function getSku(key: string): CanonicalSku | undefined {
  return bySlug.get(key) ?? byPartNo.get(key);
}

/** Dealer (selling) price in CAD for a SKU, or null if unknown. */
export function getDealerPrice(key: string): number | null {
  return getSku(key)?.dealer ?? null;
}

/** MSRP in CAD for a SKU, or null if unknown. */
export function getMsrp(key: string): number | null {
  return getSku(key)?.msrp ?? null;
}

/** Aggregate range for a named bracket (see CANONICAL_RANGES). */
export function getRange(name: keyof typeof CANONICAL_RANGES): CanonicalRange | null {
  return CANONICAL_RANGES[name] ?? null;
}

/** Format a CAD dollar amount like "$24,349". */
export function formatCad(n: number): string {
  return `$${Math.round(n).toLocaleString('en-CA')}`;
}

/** Format a SKU's dealer price (e.g. "$24,349"). Returns "N/A" if missing. */
export function dealerPriceLabel(key: string): string {
  const p = getDealerPrice(key);
  return p == null ? 'N/A' : formatCad(p);
}

/** Format a SKU's MSRP. */
export function msrpLabel(key: string): string {
  const p = getMsrp(key);
  return p == null ? 'N/A' : formatCad(p);
}

/** Format a range as "$X,XXX–$Y,YYY" (dealer prices). */
export function dealerRangeLabel(name: keyof typeof CANONICAL_RANGES): string {
  const r = getRange(name);
  if (!r) return 'N/A';
  return `${formatCad(r.dealerMin)}–${formatCad(r.dealerMax)}`;
}

// --- Financing helpers (mirrors src/lib/finance.ts formula) ---

export function defaultRate(price: number): number {
  return price < 10000 ? 8.99 : 7.99;
}

export function monthlyPayment(
  principal: number,
  aprPct: number = defaultRate(principal),
  termMonths: number = 120,
): number {
  const r = aprPct / 100 / 12;
  if (r === 0) return principal / termMonths;
  return (principal * r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
}

/** Monthly payment label for a SKU (e.g. "$295/mo at 7.99% APR, 120 mo"). */
export function monthlyPaymentLabel(
  key: string,
  termMonths: number = 120,
  aprPct?: number,
): string {
  const price = getDealerPrice(key);
  if (price == null) return 'N/A';
  const rate = aprPct ?? defaultRate(price);
  const pmt = monthlyPayment(price, rate, termMonths);
  return `$${Math.round(pmt).toLocaleString('en-CA')}/mo at ${rate}% APR, ${termMonths} mo`;
}
