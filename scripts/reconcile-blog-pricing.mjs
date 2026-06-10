#!/usr/bin/env node
// Recomputes every annotated price/derived figure in blog content from
// canonical pricing-reference.md.
//
// Sentinel format (placed in TS source, never leaks into rendered HTML):
//
//   '$24,349' /* @canonical:dealer:150elpt-pro-xs */
//   '$295' /* @canonical:monthly:150elpt-pro-xs:120 */
//   '$12,040–$17,892' /* @canonical:dealer-range:midrange_60_to_115 */
//
// Supported KIND:
//   dealer          — KEY = SKU slug or part#
//   msrp            — KEY = SKU slug or part#
//   monthly         — KEY = SKU slug, ARG = termMonths (default 120)
//   dealer-range    — KEY = range name (see CANONICAL_RANGES)
//   ownership-10yr  — KEY = SKU slug
//
// Run via `npm run reconcile:blog-pricing`.

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import {
  loadCanonicalPricing,
  monthlyPayment,
  defaultRate,
  tenYearOwnership,
} from './lib/canonical-pricing.mjs';

const { bySlug, byPartNo, ranges } = loadCanonicalPricing();

const fmt = (n) => `$${Math.round(n).toLocaleString('en-CA')}`;
const rangeFmt = (r) => `${fmt(r.dealerMin)}–${fmt(r.dealerMax)}`;
const lookupSku = (key) => bySlug.get(key) ?? byPartNo.get(key);

// Matches a quoted dollar literal followed immediately by an @canonical annotation.
// Captures: 1=quote char, 2=value (inside quotes), 3=kind, 4=key, 5=arg (optional)
export const SENTINEL_RX =
  /(['"`])(\$[^'"`]+?)\1(\s*\/\*\s*@canonical:([a-z0-9-]+):([a-z0-9.\-_]+)(?::([a-z0-9.\-_]+))?\s*\*\/)/g;

export function computeCanonicalValue(kind, key, arg) {
  switch (kind) {
    case 'dealer': {
      const s = lookupSku(key);
      return s ? fmt(s.dealer) : null;
    }
    case 'msrp': {
      const s = lookupSku(key);
      return s ? fmt(s.msrp) : null;
    }
    case 'monthly': {
      const s = lookupSku(key);
      if (!s) return null;
      const term = Number(arg ?? 120);
      return fmt(monthlyPayment(s.dealer, defaultRate(s.dealer), term));
    }
    case 'dealer-range': {
      const r = ranges[key];
      return r ? rangeFmt(r) : null;
    }
    case 'ownership-10yr': {
      const s = lookupSku(key);
      return s ? fmt(tenYearOwnership(s.dealer)) : null;
    }
    default:
      return null;
  }
}

async function main() {
  const BLOG_LANG_RX = /^(mandarin|korean|french|spanish)BlogArticles\.ts$/;
  const files = readdirSync('src/data')
    .filter((f) => f === 'blogArticles.ts' || BLOG_LANG_RX.test(f))
    .map((f) => `src/data/${f}`);
  let totalRewrites = 0;
  let totalUnknown = 0;

  for (const file of files) {
    const src = readFileSync(file, 'utf8');
    let fileRewrites = 0;
    const next = src.replace(SENTINEL_RX, (match, q, value, tail, kind, key, arg) => {
      const expected = computeCanonicalValue(kind, key, arg);
      if (expected == null) {
        totalUnknown++;
        console.warn(`  ! unknown canonical key ${kind}:${key}${arg ? ':' + arg : ''} in ${file}`);
        return match;
      }
      if (value === expected) return match;
      fileRewrites++;
      return `${q}${expected}${q}${tail}`;
    });
    if (fileRewrites > 0) {
      writeFileSync(file, next);
      console.log(`✓ ${file}: ${fileRewrites} value(s) reconciled`);
      totalRewrites += fileRewrites;
    }
  }
  console.log(
    `\nReconcile complete — ${totalRewrites} value(s) updated, ${totalUnknown} unknown key(s).`,
  );
  if (totalUnknown > 0) process.exit(2);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
