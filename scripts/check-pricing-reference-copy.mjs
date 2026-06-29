#!/usr/bin/env node
/**
 * Pre-build guard: /pricing-reference Ontario copy lock.
 *
 * Fails the build if the page title, H1, or meta description in either
 * src/pages/PricingReference.tsx or scripts/static-prerender.mjs deviate
 * from the canonical Ontario strings, or if any em-dash (— or –) appears
 * in those fields.
 *
 * House style: no em-dashes anywhere. This check is narrow: it only
 * inspects the three SEO-critical fields for the /pricing-reference
 * route in the two files that emit them.
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const EXPECTED = {
  title: 'Mercury Outboard Prices in Ontario (CAD): Live HBW Dealer Pricing | Harris Boat Works',
  h1: 'Mercury Outboard Prices in Ontario (CAD): Live HBW Dealer Pricing',
  description:
    "Live Mercury outboard prices in CAD, listed FourStroke and Pro XS models, 2.5-300 HP. MSRP vs dealer price, Gores Landing pickup only.",
};


const DASH_RE = /[\u2014\u2013]/; // em-dash, en-dash

const errors = [];
const checked = [];

function check(file, label, actual, expected) {
  checked.push(`${file} ${label}`);
  if (actual == null) {
    errors.push(`${file}: could not locate ${label}`);
    return;
  }
  if (DASH_RE.test(actual)) {
    errors.push(`${file} ${label}: contains em-dash or en-dash — "${actual}"`);
  }
  if (actual !== expected) {
    errors.push(
      `${file} ${label} mismatch.\n  expected: ${JSON.stringify(expected)}\n  actual:   ${JSON.stringify(actual)}`
    );
  }
}

// --- 1) src/pages/PricingReference.tsx ---
const pagePath = join(ROOT, 'src/pages/PricingReference.tsx');
if (!existsSync(pagePath)) {
  errors.push(`Missing file: ${pagePath}`);
} else {
  const src = readFileSync(pagePath, 'utf8');
  // <title>...</title>
  const titleMatch = src.match(/<title>([\s\S]*?)<\/title>/);
  // first <meta name="description" content="..." />
  const descMatch = src.match(/<meta\s+name="description"\s+content="([\s\S]*?)"/);
  // <h1 ...>...</h1>
  const h1Match = src.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);

  check('PricingReference.tsx', '<title>', titleMatch?.[1]?.trim(), EXPECTED.title);
  check('PricingReference.tsx', 'meta description', descMatch?.[1]?.trim(), EXPECTED.description);
  check('PricingReference.tsx', '<h1>', h1Match?.[1]?.trim(), EXPECTED.h1);

  // Also lint og:title, twitter:title, og:description, twitter:description
  for (const prop of ['og:title', 'twitter:title']) {
    const m = src.match(new RegExp(`(?:property|name)="${prop}"\\s+content="([\\s\\S]*?)"`));
    check('PricingReference.tsx', `${prop}`, m?.[1]?.trim(), EXPECTED.title);
  }
  for (const prop of ['og:description', 'twitter:description']) {
    const m = src.match(new RegExp(`(?:property|name)="${prop}"\\s+content="([\\s\\S]*?)"`));
    check('PricingReference.tsx', `${prop}`, m?.[1]?.trim(), EXPECTED.description);
  }
}

// --- 2) scripts/static-prerender.mjs route entry ---
const prerenderPath = join(ROOT, 'scripts/static-prerender.mjs');
if (!existsSync(prerenderPath)) {
  errors.push(`Missing file: ${prerenderPath}`);
} else {
  const src = readFileSync(prerenderPath, 'utf8');
  // Find the route object containing path: '/pricing-reference'
  const idx = src.indexOf("path: '/pricing-reference'");
  if (idx === -1) {
    errors.push("static-prerender.mjs: route entry for '/pricing-reference' not found");
  } else {
    // Grab a window large enough to include title/description/h1 fields
    const window = src.slice(idx, idx + 2000);
    const titleMatch = window.match(/title:\s*'([^']*)'/);
    const descMatch = window.match(/description:\s*'([^']*)'/);
    const h1Match = window.match(/h1:\s*'([^']*)'/);
    check('static-prerender.mjs', 'title', titleMatch?.[1], EXPECTED.title);
    check('static-prerender.mjs', 'description', descMatch?.[1], EXPECTED.description);
    check('static-prerender.mjs', 'h1', h1Match?.[1], EXPECTED.h1);
  }
}

if (errors.length) {
  console.error('\n[check-pricing-reference-copy] FAILED:\n');
  for (const e of errors) console.error('  ✗ ' + e);
  console.error(`\nChecked ${checked.length} fields. ${errors.length} problem(s).\n`);
  process.exit(1);
}

console.log(`[check-pricing-reference-copy] OK — ${checked.length} fields match Ontario copy, no em-dashes.`);
