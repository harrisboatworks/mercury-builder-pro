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

// Title and description are owned by src/data/seoPageMetadata.json so the
// page, the prerenderer, and this guard cannot drift apart. The H1 is still
// pinned here because it is not part of that metadata file.
const seoMetadata = JSON.parse(
  readFileSync(join(ROOT, 'src/data/seoPageMetadata.json'), 'utf8')
);
const pricingReferenceSeo = seoMetadata.pricingReference;
if (!pricingReferenceSeo?.title || !pricingReferenceSeo?.description) {
  console.error(
    '\n[check-pricing-reference-copy] FAILED: seoPageMetadata.json is missing pricingReference.title or .description\n'
  );
  process.exit(1);
}

const EXPECTED = {
  title: pricingReferenceSeo.title,
  h1: pricingReferenceSeo.h1 ?? 'Mercury Outboard Prices in Ontario (CAD): Live HBW Dealer Pricing',
  description: pricingReferenceSeo.description,
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

  // The page binds its SEO fields to src/data/seoPageMetadata.json. A literal
  // string here would be drift, so assert the binding instead of the text.
  if (!/seoPageMetadata\.pricingReference/.test(src)) {
    errors.push('PricingReference.tsx: does not read SEO copy from seoPageMetadata.pricingReference');
  }
  const bindings = [
    ['<title>', /<title>\{PAGE_SEO\.title\}<\/title>/],
    ['meta description', /<meta\s+name="description"\s+content=\{PAGE_SEO\.description\}/],
    ['og:title', /property="og:title"\s+content=\{PAGE_SEO\.title\}/],
    ['og:description', /property="og:description"\s+content=\{PAGE_SEO\.description\}/],
    ['twitter:title', /name="twitter:title"\s+content=\{PAGE_SEO\.title\}/],
    ['twitter:description', /name="twitter:description"\s+content=\{PAGE_SEO\.description\}/],
  ];
  for (const [label, re] of bindings) {
    checked.push(`PricingReference.tsx ${label}`);
    if (!re.test(src)) {
      errors.push(`PricingReference.tsx ${label}: not bound to PAGE_SEO from seoPageMetadata.json`);
    }
  }

  // The H1 is still literal in the page.
  const h1Match = src.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  check('PricingReference.tsx', '<h1>', h1Match?.[1]?.trim(), EXPECTED.h1);

  // The JSON values themselves must stay free of em/en dashes.
  check('seoPageMetadata.json', 'pricingReference.title', EXPECTED.title, EXPECTED.title);
  check('seoPageMetadata.json', 'pricingReference.description', EXPECTED.description, EXPECTED.description);
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
    const titleMatch = window.match(/title:\s*(?:'([^']*)'|"([^"]*)")/);
    const descMatch = window.match(/description:\s*(?:'([^']*)'|"([^"]*)")/);
    const h1Match = window.match(/h1:\s*(?:'([^']*)'|"([^"]*)")/);
    const pick = (m) => m?.[1] ?? m?.[2];
    check('static-prerender.mjs', 'title', pick(titleMatch), EXPECTED.title);
    check('static-prerender.mjs', 'description', pick(descMatch), EXPECTED.description);
    check('static-prerender.mjs', 'h1', pick(h1Match), EXPECTED.h1);
  }
}

if (errors.length) {
  console.error('\n[check-pricing-reference-copy] FAILED:\n');
  for (const e of errors) console.error('  ✗ ' + e);
  console.error(`\nChecked ${checked.length} fields. ${errors.length} problem(s).\n`);
  process.exit(1);
}

console.log(`[check-pricing-reference-copy] OK — ${checked.length} fields match Ontario copy, no em-dashes.`);
