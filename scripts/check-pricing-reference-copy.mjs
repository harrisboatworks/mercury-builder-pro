#!/usr/bin/env node
/**
 * Pre-build guard: /pricing-reference Ontario copy lock.
 *
 * Fails the build if the page title, H1, or meta description in either
 * src/pages/PricingReference.tsx or scripts/static-prerender.mjs deviate
 * from the canonical strings, or if an em-dash / en-dash appears in the
 * title, H1 or meta description.
 *
 * Title and description are read from src/data/seoPageMetadata.json
 * (`pricingReference`), the single source both files consume, so the pinned
 * value cannot drift from the metadata again. Both files must reference that
 * key rather than hard-code a string.
 *
 * House style: no em-dashes or en-dashes anywhere.
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const SEO_PAGE_METADATA = JSON.parse(
  readFileSync(join(ROOT, 'src/data/seoPageMetadata.json'), 'utf8'),
);
const PAGE_SEO = SEO_PAGE_METADATA.pricingReference ?? {};

const EXPECTED = {
  title: PAGE_SEO.title,
  h1: 'Mercury Outboard Prices in Ontario (CAD): Live HBW Dealer Pricing',
  description: PAGE_SEO.description,
};


const DASH_RE = /[\u2014\u2013]/; // em-dash, en-dash

const errors = [];
const checked = [];

if (typeof EXPECTED.title !== 'string' || !EXPECTED.title.trim()) {
  errors.push('seoPageMetadata.json: pricingReference.title is missing');
} else if (DASH_RE.test(EXPECTED.title)) {
  errors.push(`seoPageMetadata.json pricingReference.title: contains em-dash or en-dash: "${EXPECTED.title}"`);
}
if (typeof EXPECTED.description !== 'string' || !EXPECTED.description.trim()) {
  errors.push('seoPageMetadata.json: pricingReference.description is missing');
} else if (DASH_RE.test(EXPECTED.description)) {
  errors.push(`seoPageMetadata.json pricingReference.description: contains em-dash or en-dash: "${EXPECTED.description}"`);
}

// Fields sourced from seoPageMetadata.pricingReference: the file must read the
// key (e.g. `PAGE_SEO.title` / `SEO_PAGE_METADATA.pricingReference.title`),
// never re-type the string.
function checkRef(file, label, actual, key) {
  checked.push(`${file} ${label}`);
  if (actual == null) {
    errors.push(`${file}: could not locate ${label}`);
    return;
  }
  const ok = new RegExp(`^(?:PAGE_SEO|SEO_PAGE_METADATA\\.pricingReference|seoPageMetadata\\.pricingReference)\\.${key}$`).test(actual.trim());
  if (!ok) {
    errors.push(
      `${file} ${label} must read seoPageMetadata.pricingReference.${key}.\n  actual:   ${JSON.stringify(actual)}`
    );
  }
}

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
  const titleMatch = src.match(/<title>\{([\s\S]*?)\}<\/title>/);
  // first <meta name="description" content={...} />
  const descMatch = src.match(/<meta\s+name="description"\s+content=\{([\s\S]*?)\}/);
  const pageSeoMatch = src.match(/const\s+PAGE_SEO\s*=\s*([\w.]+);/);
  if (pageSeoMatch?.[1] !== 'seoPageMetadata.pricingReference') {
    errors.push('PricingReference.tsx: PAGE_SEO must be seoPageMetadata.pricingReference');
  }
  // <h1 ...>...</h1>
  const h1Match = src.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);

  checkRef('PricingReference.tsx', '<title>', titleMatch?.[1], 'title');
  checkRef('PricingReference.tsx', 'meta description', descMatch?.[1], 'description');
  check('PricingReference.tsx', '<h1>', h1Match?.[1]?.trim(), EXPECTED.h1);

  // Also lint og:title, twitter:title, og:description, twitter:description
  for (const prop of ['og:title', 'twitter:title']) {
    const m = src.match(new RegExp(`(?:property|name)="${prop}"\\s+content=\\{([\\s\\S]*?)\\}`));
    checkRef('PricingReference.tsx', `${prop}`, m?.[1], 'title');
  }
  for (const prop of ['og:description', 'twitter:description']) {
    const m = src.match(new RegExp(`(?:property|name)="${prop}"\\s+content=\\{([\\s\\S]*?)\\}`));
    checkRef('PricingReference.tsx', `${prop}`, m?.[1], 'description');
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
    const titleMatch = window.match(/title:\s*([\w.]+),/);
    const descMatch = window.match(/description:\s*([\w.]+),/);
    const h1Match = window.match(/h1:\s*'([^']*)'/);
    checkRef('static-prerender.mjs', 'title', titleMatch?.[1], 'title');
    checkRef('static-prerender.mjs', 'description', descMatch?.[1], 'description');
    check('static-prerender.mjs', 'h1', h1Match?.[1], EXPECTED.h1);
  }
}

if (errors.length) {
  console.error('\n[check-pricing-reference-copy] FAILED:\n');
  for (const e of errors) console.error('  ✗ ' + e);
  console.error(`\nChecked ${checked.length} fields. ${errors.length} problem(s).\n`);
  process.exit(1);
}

console.log(`[check-pricing-reference-copy] OK — ${checked.length} fields match seoPageMetadata.pricingReference and the pinned H1; no em/en dashes.`);
