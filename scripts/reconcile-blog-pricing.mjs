#!/usr/bin/env node
// Recomputes every sentinel-tagged price/derived-figure in blog content from
// canonical pricing-reference.md. Sentinel format:
//
//   <!--canonical:KIND:KEY[:ARG]-->VALUE<!--/canonical-->
//
// Supported KIND:
//   dealer   — KEY = SKU slug or part#, VALUE = "$24,349"
//   msrp     — KEY = SKU slug or part#, VALUE = "$27,125"
//   monthly  — KEY = SKU slug, ARG = "termMonths" (default 120), VALUE = "$295"
//   dealer-range — KEY = range name (see CANONICAL_RANGES), VALUE = "$12,040–$17,892"
//   ownership-10yr — KEY = SKU slug, VALUE = "$XX,XXX"
//
// Run via `npm run reconcile:blog-pricing`.

import { readFileSync, writeFileSync } from 'node:fs';
import { glob } from 'glob';
import {
  loadCanonicalPricing,
  monthlyPayment,
  defaultRate,
  tenYearOwnership,
} from './lib/canonical-pricing.mjs';

const { bySlug, byPartNo, ranges } = loadCanonicalPricing();

function fmt(n) {
  return `$${Math.round(n).toLocaleString('en-CA')}`;
}
function rangeFmt(r) {
  return `${fmt(r.dealerMin)}–${fmt(r.dealerMax)}`;
}
function lookupSku(key) {
  return bySlug.get(key) ?? byPartNo.get(key);
}

const SENTINEL =
  /<!--canonical:([a-z0-9-]+):([a-z0-9.\-_]+)(?::([a-z0-9.\-_]+))?-->([^<]*)<!--\/canonical-->/gi;

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
      const pmt = monthlyPayment(s.dealer, defaultRate(s.dealer), term);
      return fmt(pmt);
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
  const files = [
    ...(await glob('src/data/blogArticles.ts')),
    ...(await glob('src/data/{mandarin,korean,french,spanish}BlogArticles.ts')),
  ];
  let totalRewrites = 0;
  let totalUnknown = 0;

  for (const file of files) {
    const src = readFileSync(file, 'utf8');
    let fileRewrites = 0;
    const next = src.replace(SENTINEL, (match, kind, key, arg, oldValue) => {
      const expected = computeCanonicalValue(kind, key, arg);
      if (expected == null) {
        totalUnknown++;
        console.warn(`  ! unknown canonical key ${kind}:${key}${arg ? ':' + arg : ''} in ${file}`);
        return match;
      }
      if (oldValue.trim() === expected) return match;
      fileRewrites++;
      const argPart = arg ? `:${arg}` : '';
      return `<!--canonical:${kind}:${key}${argPart}-->${expected}<!--/canonical-->`;
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
