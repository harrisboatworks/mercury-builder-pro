#!/usr/bin/env node
// scripts/check-structured-data.mjs
//
// Pre-build / post-prerender guardrail. Walks every .html file in dist/,
// extracts JSON-LD blocks, and fails the build on:
//   1. Malformed JSON
//   2. Missing required schema.org fields per @type
//   3. Product offers without priceCurrency/price/availability
//      (the exact bug class that hit /mercury-outboards-ontario)
//
// Service-typed Offers under LocalBusiness.makesOffer are allowed to omit
// price (legitimate price-on-request); only Product offers are strict.
//
// Also enforces a "dual source of truth" check: the same Product name or @id
// must NOT appear hardcoded in BOTH scripts/static-prerender.mjs AND a React
// SEO component. When duplication is found, the build fails with both file
// paths and a recommendation to extract to a shared module
// (see src/data/mercuryOutboardsOffers.js for the established pattern).
//
// Run order:
//   1. vite build  (emits dist/)
//   2. static-prerender.mjs  (rewrites HTML in dist/)
//   3. THIS SCRIPT  (validates dist/ + source-of-truth check on src/)
//
// Wired into package.json "postbuild" alongside static-prerender.

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = 'dist';
const SRC_PRERENDER = 'scripts/static-prerender.mjs';
const SRC_SEO_GLOB_DIRS = ['src/components/seo', 'src/pages/landing', 'src/pages'];

const REQUIRED_FIELDS = {
  Product: ['name'],
  LocalBusiness: ['name', 'address'],
  AutoRepair: ['name', 'address'],
  BoatDealer: ['name', 'address'],
  Store: ['name', 'address'],
  Organization: ['name'],
  Article: ['headline', 'datePublished'],
  BlogPosting: ['headline', 'datePublished'],
  NewsArticle: ['headline', 'datePublished'],
  BreadcrumbList: ['itemListElement'],
  FAQPage: ['mainEntity'],
};

const OFFER_REQUIRED = ['priceCurrency', 'price', 'availability'];

const errors = [];
const warnings = [];

// ---------- 1. Validate JSON-LD in dist/ ----------

function walkDir(dir, ext, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walkDir(full, ext, out);
    else if (full.endsWith(ext)) out.push(full);
  }
  return out;
}

function extractJsonLd(html) {
  const blocks = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) blocks.push(m[1].trim());
  return blocks;
}

function walkSchema(node, cb, depth = 0, parentType = null) {
  if (!node || typeof node !== 'object' || depth > 12) return;
  if (Array.isArray(node)) { node.forEach(n => walkSchema(n, cb, depth + 1, parentType)); return; }
  const t = Array.isArray(node['@type']) ? node['@type'][0] : node['@type'];
  if (t) cb(node, t, parentType);
  for (const [k, v] of Object.entries(node)) {
    if (k === '@type' || k === '@context' || k === '@id') continue;
    walkSchema(v, cb, depth + 1, t || parentType);
  }
}

function isServiceOffer(offer) {
  const item = offer.itemOffered;
  if (!item) return false;
  const t = Array.isArray(item['@type']) ? item['@type'][0] : item['@type'];
  return t === 'Service';
}

function validateHtmlFile(file) {
  const html = readFileSync(file, 'utf8');
  const blocks = extractJsonLd(html);
  blocks.forEach((raw, i) => {
    let parsed;
    try { parsed = JSON.parse(raw); }
    catch (e) {
      errors.push(`${file} block[${i}]: JSON parse error — ${e.message.slice(0, 100)}`);
      return;
    }
    walkSchema(parsed, (node, type, parentType) => {
      const req = REQUIRED_FIELDS[type];
      if (req) {
        for (const f of req) {
          if (!(f in node) || node[f] === '' || node[f] === null || node[f] === undefined) {
            errors.push(`${file} block[${i}]: ${type} missing required field "${f}"`);
          }
        }
      }
      if (type === 'Offer') {
        // Service offers (price-on-request) are exempt.
        if (isServiceOffer(node)) return;
        for (const f of OFFER_REQUIRED) {
          if (!(f in node) || node[f] === '' || node[f] === null || node[f] === undefined) {
            errors.push(`${file} block[${i}]: Offer missing required field "${f}" (under ${parentType || 'root'})`);
          }
        }
      }
    });
  });
}

const htmlFiles = walkDir(DIST, '.html');
if (htmlFiles.length === 0) {
  console.warn(`[check-structured-data] No .html files in ${DIST}/ — skipping HTML validation (run after build + prerender).`);
} else {
  htmlFiles.forEach(validateHtmlFile);
  console.log(`[check-structured-data] Validated ${htmlFiles.length} HTML files.`);
}

// ---------- 2. Dual-source-of-truth check ----------
// Look for Product names / @ids that appear hardcoded in BOTH the prerender
// script AND any React SEO component. Encourages extracting to a shared module.

function readFileSafe(p) {
  try { return readFileSync(p, 'utf8'); } catch { return ''; }
}

function collectSeoFiles() {
  const out = [];
  for (const dir of SRC_SEO_GLOB_DIRS) {
    if (!existsSync(dir)) continue;
    walkDir(dir, '.tsx', out);
    walkDir(dir, '.ts', out);
  }
  return out;
}

// Extract Product names ("name": "...") and @ids ("@id": "...#product-...")
// from a source file. Conservative regex — only matches obvious Product/Offer
// shape to avoid false positives.
function extractSchemaIdentifiers(text) {
  const names = new Set();
  const ids = new Set();
  // Only collect names/ids that appear within ~200 chars of "@type": "Product"
  const productBlocks = text.match(/"@type"\s*:\s*"Product"[\s\S]{0,400}/g) || [];
  for (const block of productBlocks) {
    const nameMatch = block.match(/"name"\s*:\s*"([^"]{4,120})"/);
    if (nameMatch) names.add(nameMatch[1].trim());
    const idMatch = block.match(/"@id"\s*:\s*"([^"]+)"/);
    if (idMatch) ids.add(idMatch[1].trim());
  }
  return { names, ids };
}

const prerenderSrc = readFileSafe(SRC_PRERENDER);
const prerenderIds = extractSchemaIdentifiers(prerenderSrc);
const seoFiles = collectSeoFiles();

const duplicates = []; // { name|id, file }

for (const seoFile of seoFiles) {
  const seoSrc = readFileSafe(seoFile);
  if (!seoSrc.includes('"@type"')) continue;
  const seoIds = extractSchemaIdentifiers(seoSrc);
  for (const name of seoIds.names) {
    if (prerenderIds.names.has(name)) {
      duplicates.push({ kind: 'name', value: name, file: seoFile });
    }
  }
  for (const id of seoIds.ids) {
    if (prerenderIds.ids.has(id)) {
      duplicates.push({ kind: '@id', value: id, file: seoFile });
    }
  }
}

if (duplicates.length > 0) {
  // De-dup by value to keep output tight.
  const seen = new Set();
  for (const d of duplicates) {
    const key = `${d.kind}:${d.value}:${d.file}`;
    if (seen.has(key)) continue;
    seen.add(key);
    errors.push(
      `DUAL-SOURCE-OF-TRUTH: Product ${d.kind} "${d.value}" appears hardcoded in BOTH:\n` +
      `  - ${SRC_PRERENDER}\n` +
      `  - ${d.file}\n` +
      `  → Extract to a shared module (see src/data/mercuryOutboardsOffers.js pattern) and import from both. ` +
      `Duplicated schema drifts apart and breaks Rich Results — this is exactly how the /mercury-outboards-ontario priceCurrency bug shipped.`
    );
  }
}

// ---------- Report ----------

if (warnings.length) {
  console.warn(`\n[check-structured-data] ${warnings.length} warning(s):`);
  warnings.forEach(w => console.warn('  ⚠ ' + w));
}

if (errors.length) {
  console.error(`\n[check-structured-data] ❌ ${errors.length} error(s):\n`);
  errors.forEach(e => console.error('  ✗ ' + e + '\n'));
  console.error(`\nBuild blocked. Fix the structured data above before deploying.`);
  process.exit(1);
}

console.log(`[check-structured-data] ✅ All structured data valid. ${htmlFiles.length} HTML files, ${seoFiles.length} SEO source files scanned.`);
