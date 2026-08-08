#!/usr/bin/env node
/**
 * Enforce the one-anchor credibility budget on the articles identified by the
 * 2026-08-06 audit. Repeated references to the same fact are allowed when the
 * article's subject requires them; mixing two or more anchor classes is not.
 */
import { readFileSync } from 'node:fs';

const source = readFileSync('src/data/blogArticles.ts', 'utf8');
const staticPrerender = readFileSync('scripts/static-prerender.mjs', 'utf8');
const authorByline = readFileSync('src/components/blog/AuthorByline.tsx', 'utf8');

const auditedSlugs = [
  '2026-boating-market-ontario-boat-buyers',
  '2026-rice-lake-fishing-season-outlook',
  'mercury-75-hp-fourstroke-review-ontario',
  'mercury-dealer-ajax-ontario-hbw',
  'mercury-dealer-bowmanville-ontario-hbw',
  'mercury-dealer-markham-ontario-hbw',
  'mercury-dealer-mississauga-ontario-hbw',
  'mercury-dealer-northumberland-county-hbw',
  'mercury-dealer-oakville-ontario-hbw',
  'mercury-dealer-oshawa-ontario-hbw',
  'mercury-dealer-peterborough-ontario-hbw',
  'mercury-dealer-pickering-ontario-hbw',
  'mercury-dealer-port-hope-ontario-hbw',
  'mercury-outboard-dealer-toronto-why-drive-to-hbw',
  'mercury-outboard-financing-ontario-2026',
  'mercury-outboard-lineup-ontario',
  'mercury-outboard-monthly-payment-ontario-2026',
  'mercury-propeller-selection-guide',
  'mercury-vs-honda-outboards-honest-ontario-dealer-comparison-2026',
  'outboard-vs-sterndrive-2026-ontario-repower',
  'renting-vs-owning-boat-ontario-math',
];

const slugMatches = [...source.matchAll(/slug:\s*['"]([^'"]+)['"]/g)];
const blocks = new Map(slugMatches.map((match, index) => [
  match[1],
  source.slice(match.index, slugMatches[index + 1]?.index ?? source.length),
]));

const anchorClasses = [
  ['heritage', /\b1947\b|third[- ]generation|three generations/i],
  ['mercury-tenure', /\b1965\b/i],
  ['premier-tier', /Mercury(?: Marine)? Premier|Premier[- ]tier|Premier dealer/i],
];

const errors = [];
for (const slug of auditedSlugs) {
  const block = blocks.get(slug);
  if (!block) {
    errors.push(`${slug}: article not found`);
    continue;
  }
  const classes = anchorClasses.filter(([, rx]) => rx.test(block)).map(([name]) => name);
  if (classes.length > 1) errors.push(`${slug}: stacks ${classes.join(', ')}`);
}

const injectedStripLines = staticPrerender
  .split('\n')
  .filter((line) => /dealerStripHtml\s*=/.test(line));
for (const line of injectedStripLines) {
  if (/1947|1965|generation/i.test(line)) {
    errors.push('static-prerender: injected dealer strip stacks a heritage or tenure anchor');
  }
}

const defaultByline = authorByline.match(/const JAY_CREDENTIALS\s*=\s*([^;]+);/)?.[1] ?? '';
if (/1947|1965|generation|Premier/i.test(defaultByline)) {
  errors.push('AuthorByline: default credentials stack a promotional anchor');
}

if (errors.length) {
  console.error(`Credibility-anchor budget failed (${errors.length}):`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(`Credibility-anchor budget passed for ${auditedSlugs.length} audited articles and shared blog chrome.`);
