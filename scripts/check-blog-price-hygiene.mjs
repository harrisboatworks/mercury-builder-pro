#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { loadCanonicalPricing, slugifyModel } from './lib/canonical-pricing.mjs';

const SOURCE = readFileSync('src/data/blogArticles.ts', 'utf8');
const REVIEWED_AT = '2026-08-08';
const REVIEWED_LABEL = 'August 8, 2026';
const MAX_REVIEW_AGE_DAYS = 100;
const LIVE_URL = `https://www.mercuryrepower.ca/pricing-reference.md?cb=${Date.now()}`;
const reportMode = process.argv.includes('--report');
const liveMode = process.argv.includes('--live');

const fmt = (value) => `$${Math.round(value).toLocaleString('en-CA')}`;

function articleBlock(slug) {
  const marker = new RegExp(`slug:\\s*['"]${slug}['"]`);
  const match = marker.exec(SOURCE);
  if (!match) return '';
  const next = SOURCE.slice(match.index + match[0].length).search(/\n\s*\{\n\s*slug:\s*['"]/);
  return next < 0 ? SOURCE.slice(match.index) : SOURCE.slice(match.index, match.index + match[0].length + next);
}

function parsePricing(markdown) {
  const rowRx = /^\|\s*([\d.]+)\s*\|\s*([^|]+?)\s*\|\s*([A-Z0-9]+)\s*\|.*?\|\s*\$([\d,]+)\s*_\(MSRP \$([\d,]+)\)_\s*\|/gm;
  const skus = [];
  for (const match of markdown.matchAll(rowRx)) {
    skus.push({
      hp: Number(match[1]),
      model: match[2].trim(),
      partNo: match[3],
      dealer: Number(match[4].replaceAll(',', '')),
      msrp: Number(match[5].replaceAll(',', '')),
      slug: slugifyModel(match[2]),
    });
  }
  const lastUpdated = markdown.match(/(?:last_updated:\s*|_Last updated\s+)([\d-]+)/i)?.[1] ?? null;
  return { skus, lastUpdated };
}

function pricingFacts(model) {
  const bySlug = new Map(model.skus.map((sku) => [sku.slug, sku]));
  const required = (slug) => {
    const sku = bySlug.get(slug);
    if (!sku) throw new Error(`Missing canonical pricing SKU: ${slug}`);
    return sku;
  };
  const lineup = model.skus.map((sku) => sku.dealer);
  const proXs250 = model.skus.filter((sku) => sku.hp === 250 && /pro\s*xs/i.test(sku.model));
  const v8Main = model.skus.filter(
    (sku) =>
      (sku.hp === 250 || sku.hp === 300) &&
      /fourstroke/i.test(sku.model) &&
      !/pro\s*xs/i.test(sku.model) &&
      !/xxl/i.test(sku.model),
  );
  const kicker15 = model.skus.filter((sku) => sku.hp === 15 && /prokicker/i.test(sku.model) && /elpt/i.test(sku.model));
  return {
    lineupMin: Math.min(...lineup),
    lineupMax: Math.max(...lineup),
    proXs250Min: Math.min(...proXs250.map((sku) => sku.dealer)),
    proXs250Max: Math.max(...proXs250.map((sku) => sku.dealer)),
    salmonPairFloor: Math.min(...v8Main.map((sku) => sku.dealer)) + Math.min(...kicker15.map((sku) => sku.dealer)),
    mercury115Elpt: required('115elpt-fourstroke'),
  };
}

const localPricing = loadCanonicalPricing();
const localFacts = pricingFacts(localPricing);
const contracts = [
  {
    slug: 'best-mercury-for-family-runabouts',
    stale: ['$15,500 to $18,500'],
    required: ['[Live motor price](/pricing-reference)', '[Mercury pricing reference](/pricing-reference)'],
  },
  {
    slug: 'best-mercury-outboard-aluminum-fishing-boats',
    stale: ['$18,000-$21,000'],
    required: ['[live 115HP FourStroke prices](/pricing-reference)', REVIEWED_LABEL],
  },
  {
    slug: 'bass-boat-mercury-motor-buying-guide',
    stale: ['$33,500-$34,500'],
    required: [fmt(localFacts.proXs250Min), fmt(localFacts.proXs250Max), '[live pricing reference](/pricing-reference)', REVIEWED_LABEL],
  },
  {
    slug: 'is-2026-good-year-to-buy-boat-canada',
    stale: ['$19,220 MSRP'],
    required: [fmt(localFacts.mercury115Elpt.dealer), fmt(localFacts.mercury115Elpt.msrp), '[live pricing reference](/pricing-reference)', REVIEWED_LABEL],
  },
  {
    slug: 'best-mercury-outboard-lake-ontario-salmon-trout',
    stale: ['$35,000 to $50,000+'],
    required: [fmt(localFacts.salmonPairFloor), '[live pricing reference](/pricing-reference)', REVIEWED_LABEL],
  },
  {
    slug: 'cheapest-mercury-outboard-canada-2026',
    stale: ['$1,298 - $38,539 CAD'],
    required: [fmt(localFacts.lineupMin), fmt(localFacts.lineupMax), '/pricing-reference', REVIEWED_LABEL],
  },
];

const errors = [];
const results = [];
for (const contract of contracts) {
  const source = articleBlock(contract.slug);
  const twinPath = `public/blog/${contract.slug}.md`;
  const twin = existsSync(twinPath) ? readFileSync(twinPath, 'utf8') : '';
  const surfaces = { source, twin };
  for (const [surface, text] of Object.entries(surfaces)) {
    if (!text) errors.push(`${contract.slug}: missing ${surface} surface`);
    for (const stale of contract.stale) {
      if (text.includes(stale)) errors.push(`${contract.slug}: ${surface} still contains stale price ${stale}`);
    }
    for (const required of contract.required) {
      if (!text.includes(required)) errors.push(`${contract.slug}: ${surface} is missing ${required}`);
    }
  }
  results.push({ slug: contract.slug, required: contract.required, stale: contract.stale });
}

const ageDays = Math.floor((Date.now() - Date.parse(`${REVIEWED_AT}T00:00:00Z`)) / 86_400_000);
if (ageDays > MAX_REVIEW_AGE_DAYS) {
  errors.push(`Price review is ${ageDays} days old; run the live quarterly report and refresh the contracts.`);
}

let live = null;
if (liveMode) {
  const response = await fetch(LIVE_URL, { headers: { 'user-agent': 'HBW-price-hygiene/1.0' } });
  if (!response.ok) throw new Error(`Live pricing reference returned HTTP ${response.status}`);
  const livePricing = parsePricing(await response.text());
  const liveFacts = pricingFacts(livePricing);
  live = { lastUpdated: livePricing.lastUpdated, facts: liveFacts };
  for (const key of ['lineupMin', 'lineupMax', 'proXs250Min', 'proXs250Max', 'salmonPairFloor']) {
    if (liveFacts[key] !== localFacts[key]) errors.push(`Live/local pricing drift for ${key}: ${fmt(liveFacts[key])} live vs ${fmt(localFacts[key])} local`);
  }
  for (const key of ['dealer', 'msrp']) {
    if (liveFacts.mercury115Elpt[key] !== localFacts.mercury115Elpt[key]) {
      errors.push(`Live/local pricing drift for 115ELPT ${key}: ${fmt(liveFacts.mercury115Elpt[key])} live vs ${fmt(localFacts.mercury115Elpt[key])} local`);
    }
  }
}

const report = {
  ok: errors.length === 0,
  reviewedAt: REVIEWED_AT,
  ageDays,
  localPricingUpdatedAt: localPricing.lastUpdated,
  livePricingUpdatedAt: live?.lastUpdated ?? null,
  contracts: results,
  errors,
};

if (reportMode) console.log(JSON.stringify(report, null, 2));
else console.log(`Blog price hygiene: ${report.ok ? 'PASS' : 'FAIL'} (${contracts.length} audited routes, review age ${ageDays} days)`);

if (errors.length) {
  if (!reportMode) errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
