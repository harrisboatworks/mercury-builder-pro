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
  const ok = new RegExp(`^(?:PAGE_SEO|PRICING_REFERENCE_SEO|SEO_PAGE_METADATA\\.pricingReference|seoPageMetadata\\.pricingReference)\\.${key}$`).test(actual.trim());
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
    const catalogTitleMatch = window.match(/\[\$\{(SEO_PAGE_METADATA\.pricingReference\.title)\}\]/)
      || src.match(/\[\$\{(SEO_PAGE_METADATA\.pricingReference\.title)\}\]/);
    checkRef('static-prerender.mjs', 'catalog title', catalogTitleMatch?.[1], 'title');
  }
}

function unquoteYamlScalar(value) {
  const trimmed = String(value ?? '').trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return JSON.parse(trimmed.startsWith('"') ? trimmed : `"${trimmed.slice(1, -1).replace(/"/g, '\\"')}"`);
  }
  return trimmed;
}

// --- 3) public/pricing-reference.md frontmatter ---
const mdPath = join(ROOT, 'public/pricing-reference.md');
if (!existsSync(mdPath)) {
  errors.push(`Missing file: ${mdPath}`);
} else {
  const src = readFileSync(mdPath, 'utf8');
  const fm = src.match(/^---\n([\s\S]*?)\n---/);
  const titleMatch = fm?.[1]?.match(/^title:\s*(.+)$/m);
  const descMatch = fm?.[1]?.match(/^description:\s*(.+)$/m);
  check('pricing-reference.md', 'frontmatter title', titleMatch ? unquoteYamlScalar(titleMatch[1]) : null, EXPECTED.title);
  check('pricing-reference.md', 'frontmatter description', descMatch ? unquoteYamlScalar(descMatch[1]) : null, EXPECTED.description);
}

// --- 4) public/pricing-reference.schema.json WebPage ---
const schemaPath = join(ROOT, 'public/pricing-reference.schema.json');
if (!existsSync(schemaPath)) {
  errors.push(`Missing file: ${schemaPath}`);
} else {
  const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
  const webpage = (schema['@graph'] || []).find((node) => node['@type'] === 'WebPage');
  check('pricing-reference.schema.json', 'WebPage name', webpage?.name ?? null, EXPECTED.title);
  check('pricing-reference.schema.json', 'WebPage description', webpage?.description ?? null, EXPECTED.description);
}

// --- 5) generate-markdown-twins.mjs must read seoPageMetadata ---
const twinsPath = join(ROOT, 'scripts/generate-markdown-twins.mjs');
if (!existsSync(twinsPath)) {
  errors.push(`Missing file: ${twinsPath}`);
} else {
  const src = readFileSync(twinsPath, 'utf8');
  if (!/const\s+PRICING_REFERENCE_SEO\s*=\s*SEO_PAGE_METADATA\.pricingReference/.test(src)) {
    errors.push('generate-markdown-twins.mjs: PRICING_REFERENCE_SEO must be SEO_PAGE_METADATA.pricingReference');
  }
  const titleExtra = src.match(/title:\s*\$\{JSON\.stringify\((PRICING_REFERENCE_SEO\.title)\)\}/);
  const descExtra = src.match(/description:\s*\$\{JSON\.stringify\((PRICING_REFERENCE_SEO\.description)\)\}/);
  const schemaName = src.match(/name:\s*(PRICING_REFERENCE_SEO\.title)/);
  const schemaDesc = src.match(/description:\s*(PRICING_REFERENCE_SEO\.description)/);
  const catalogTitle = src.match(/\[\$\{(PRICING_REFERENCE_SEO\.title)\}\]/);
  checkRef('generate-markdown-twins.mjs', 'markdown title', titleExtra?.[1], 'title');
  checkRef('generate-markdown-twins.mjs', 'markdown description', descExtra?.[1], 'description');
  checkRef('generate-markdown-twins.mjs', 'schema name', schemaName?.[1], 'title');
  checkRef('generate-markdown-twins.mjs', 'schema description', schemaDesc?.[1], 'description');
  checkRef('generate-markdown-twins.mjs', 'catalog title', catalogTitle?.[1], 'title');
}

// --- 6) agent indexes ---
const catalogPath = join(ROOT, 'public/catalog.md');
if (!existsSync(catalogPath)) {
  errors.push(`Missing file: ${catalogPath}`);
} else {
  const src = readFileSync(catalogPath, 'utf8');
  if (!src.includes(`](${'https://www.mercuryrepower.ca/pricing-reference.md'})`)) {
    errors.push('catalog.md: missing pricing-reference.md link');
  }
  if (!src.includes(`[${EXPECTED.title}](https://www.mercuryrepower.ca/pricing-reference.md)`)) {
    errors.push(`catalog.md: pricing-reference link text must be the document title\n  expected: ${JSON.stringify(EXPECTED.title)}`);
  } else {
    checked.push('catalog.md pricing-reference title');
  }
}

const llmsPath = join(ROOT, 'public/llms.txt');
if (!existsSync(llmsPath)) {
  errors.push(`Missing file: ${llmsPath}`);
} else {
  const src = readFileSync(llmsPath, 'utf8');
  if (!src.includes('https://www.mercuryrepower.ca/pricing-reference.md')) {
    errors.push('llms.txt: missing pricing-reference.md URL');
  }
  if (!/Ontario Mercury dealer/.test(src) || !/Quote or buy from Harris Boat Works on Rice Lake/.test(src)) {
    errors.push('llms.txt: pricing-reference entries must signal Ontario dealer pricing and quote/buy intent');
  } else {
    checked.push('llms.txt Ontario dealer + quote/buy');
  }
}

if (errors.length) {
  console.error('\n[check-pricing-reference-copy] FAILED:\n');
  for (const e of errors) console.error('  ✗ ' + e);
  console.error(`\nChecked ${checked.length} fields. ${errors.length} problem(s).\n`);
  process.exit(1);
}

console.log(`[check-pricing-reference-copy] OK — ${checked.length} fields match seoPageMetadata.pricingReference and the pinned H1; no em/en dashes.`);
