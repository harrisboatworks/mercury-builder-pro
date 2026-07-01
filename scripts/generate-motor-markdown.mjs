#!/usr/bin/env node
/**
 * generate-motor-markdown.mjs
 *
 * Regenerates every `public/motors/*.md` file from a SINGLE template so that
 * shared boilerplate (Public Quote API section, contact block, footer)
 * never has to be bulk-edited across ~44 files by hand.
 *
 * How it works:
 *   1. Walks the current `public/motors/*.md` files to seed per-motor variable
 *      data (title, model_number, hp, family, price, MSRP, motor_id, availability,
 *      best-fit, not-ideal, filename). This preserves BOTH filename schemes
 *      currently in use (verbose `fourstroke-20hp-20-eh-fourstroke.md` AND
 *      short `fs-20-eh.md`) so no external links break.
 *   2. Rewrites every file from `renderMotorMd()` — a single template. Bulk
 *      changes to the Public Quote API URL, pickup policy wording, or the
 *      dealer footer are now one edit here, not 44 edits across .md files.
 *
 * Wired into `package.json` `prebuild` (after generate:canonical-pricing,
 * before rewrite:agent-urls).
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const MOTORS_DIR = join(ROOT, 'public/motors');
const SITE_URL = 'https://www.mercuryrepower.ca';
const PUBLIC_QUOTE_API = 'https://www.mercuryrepower.ca/api/agents/quote';

// ---------- YAML front-matter parsing (minimal, no external deps) ----------

function parseFrontMatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { data: {}, body: src };
  const fm = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([a-zA-Z_][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if (/^\d+$/.test(v)) v = Number(v);
    else if (/^\d+\.\d+$/.test(v)) v = Number(v);
    else if (v === 'true') v = true;
    else if (v === 'false') v = false;
    fm[kv[1]] = v;
  }
  return { data: fm, body: src.slice(m[0].length) };
}

function extractSection(body, heading) {
  const rx = new RegExp(`^##\\s+${heading}\\s*\\n+([\\s\\S]*?)(?=\\n##\\s|$)`, 'm');
  const m = body.match(rx);
  return m ? m[1].trim() : '';
}

function extractH1(body) {
  const m = body.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : '';
}

function extractMsrp(body) {
  const m = body.match(/\*\*MSRP:\*\*\s*\$([\d,]+)/);
  return m ? Number(m[1].replace(/,/g, '')) : null;
}

// ---------- Template ----------

const fmtMoney = (n) =>
  new Intl.NumberFormat('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

function renderMotorMd(m) {
  const price = fmtMoney(m.price_cad);
  const msrp = m.msrp != null ? fmtMoney(m.msrp) : null;
  const inStock = String(m.availability).toLowerCase() === 'in_stock';
  const availLabel = inStock
    ? 'In stock at Gores Landing'
    : 'Special order — brought in for this build';
  const bestFit = m.best_fit || 'Confirm boat rating and rigging with the dealer.';
  const notIdeal = m.not_ideal || 'Match HP to transom rating, never exceed it.';

  return `---
canonical: ${SITE_URL}/motors/${m.slug}
last_updated: ${m.last_updated}
currency: CAD
pickup_only: true
delivery_offered: false
location: Gores Landing, ON, Canada
final_quote_requires_dealer_confirmation: true
verado_status: special-order only, not in default inventory
motor_id: ${m.motor_id}
slug: ${m.slug}
family: ${m.family}
horsepower: ${m.horsepower}
model_number: ${m.model_number}
availability: ${m.availability}
price_cad: ${m.price_cad}
---

# ${m.title}

Mercury ${m.family} ${m.horsepower} HP outboard motor (model ${m.model_number}).
Sold by Harris Boat Works on Rice Lake, Ontario: Mercury Marine Premier Dealer · Mercury dealer since 1965.

## Quick facts

- **Model:** ${m.title}
- **Family:** Mercury ${m.family}
- **Horsepower:** ${m.horsepower} HP
- **Model number:** ${m.model_number}

## Pricing (CAD)

- **Selling price:** $${price}
${msrp ? `- **MSRP:** $${msrp}\n` : ''}- **Currency:** Canadian Dollars (CAD) only, we do not quote in USD.
- **Final price** is confirmed by Harris Boat Works staff before purchase.

## Availability

- **Status:** ${availLabel}
- **Pickup:** Required at Gores Landing, ON, by the buyer in person with valid government photo ID. We do not ship, we do not deliver, and we do not release motors to couriers or third parties.

## Best fit for

${bestFit}

## Not ideal for

${notIdeal}

## Build a quote

- HTML page (canonical for humans): ${SITE_URL}/motors/${m.slug}
- Quote builder deep link: ${SITE_URL}/quote/motor-selection?motor=${m.motor_id}

## Public Quote API

Programmatic quotes: \`POST ${PUBLIC_QUOTE_API}\`

\`\`\`json
{
  "action": "build_quote",
  "motor_id": "${m.motor_id}",
  "trade_in": null,
  "contact": null
}
\`\`\`

## Source provenance

- Motor specifications are based on Mercury Marine official sources: mercurymarine.com and the official Mercury Marine brochure.
- Harris Boat Works pricing, availability, pickup policy, and quote terms are dealer-provided and should be treated as the local commercial source of truth.

## Notes

- Financing available on totals over $5,000 CAD (tiered: 8.99% under $10K, 7.99% over $10K).
- Standard 3-year Mercury factory warranty; up to 7 years available on select promotions.
- We are pickup-only at Gores Landing, ON. Final price confirmed by dealer.
`;
}

// ---------- Main: seed from current files, regenerate all ----------

function isMotorMd(f) {
  return f.endsWith('.md');
}

function main() {
  const files = readdirSync(MOTORS_DIR).filter(isMotorMd);
  if (files.length === 0) {
    console.log('generate-motor-markdown: no *.md files found in public/motors, skipping.');
    return;
  }

  let regen = 0;
  for (const filename of files) {
    const full = join(MOTORS_DIR, filename);
    const src = readFileSync(full, 'utf8');
    const { data, body } = parseFrontMatter(src);
    if (!data.motor_id || !data.slug) {
      console.warn(`  skip ${filename}: missing motor_id/slug in front-matter`);
      continue;
    }
    const motor = {
      slug: data.slug,
      motor_id: data.motor_id,
      family: data.family || 'FourStroke',
      horsepower: data.horsepower,
      model_number: data.model_number,
      availability: data.availability || 'in_stock',
      price_cad: data.price_cad,
      last_updated: data.last_updated || new Date().toISOString().slice(0, 10),
      title: extractH1(body),
      msrp: extractMsrp(body),
      best_fit: extractSection(body, 'Best fit for'),
      not_ideal: extractSection(body, 'Not ideal for'),
    };
    const out = renderMotorMd(motor);
    if (out !== src) {
      writeFileSync(full, out);
      regen++;
    }
  }
  console.log(`✓ generate-motor-markdown: regenerated ${regen} / ${files.length} motor .md files from template`);
}

main();
