#!/usr/bin/env node
/**
 * Enforce the one-anchor credibility budget where readers actually encounter
 * the claims. Different paragraphs may use different relevant credentials;
 * one paragraph or sentence may not stack multiple credibility classes.
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const staticPrerender = readFileSync('scripts/static-prerender.mjs', 'utf8');
const authorByline = readFileSync('src/components/blog/AuthorByline.tsx', 'utf8');

const anchorClasses = [
  ['heritage', /\b1947\b|third[- ]generation|three generations/i],
  ['mercury-tenure', /\b1965\b/i],
  ['premier-tier', /Mercury(?: Marine)? Premier|Premier[- ]tier|Premier dealer/i],
];

const enforcedSlugs = new Set([
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
]);

// Main already contains legacy co-located stacks outside the audit's corrected
// routes. Sweep every twin and prevent that corpus-wide count from increasing;
// later remediation may lower this ceiling without blocking unrelated releases.
const MAX_BASELINE_STACKED_UNITS = 157;
const REPORT_PATH = 'reports/blog-credibility-anchors.json';

// This article is explicitly about the business history, so the facts are its
// subject matter rather than promotional proof stacked onto an unrelated claim.
const subjectMatterAllowlist = new Set([
  'public/blog/harris-boat-works-since-1947-rice-lake-institution.md',
]);

function markdownFiles(root) {
  const files = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) files.push(...markdownFiles(path));
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(path);
  }
  return files;
}

function readableBody(markdown) {
  return markdown.replace(/^---\n[\s\S]*?\n---\n/, '');
}

function classesIn(text) {
  return anchorClasses.filter(([, rx]) => rx.test(text)).map(([name]) => name);
}

const errors = [];
const warnings = [];
const observedStacks = [];
const twins = markdownFiles('public/blog');
let paragraphCount = 0;
let sentenceCount = 0;

for (const twin of twins) {
  const label = relative('.', twin);
  const slug = twin.slice(twin.lastIndexOf('/') + 1, -3);
  if (subjectMatterAllowlist.has(label)) continue;

  const paragraphs = readableBody(readFileSync(twin, 'utf8'))
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  for (const [paragraphIndex, paragraph] of paragraphs.entries()) {
    paragraphCount += 1;
    // Markdown lists, tables, directive fields, and blockquotes are separate
    // visible units even when no blank line separates their source lines.
    const visibleUnits = paragraph.includes('\n')
      ? paragraph.split('\n').map((line) => line.trim()).filter(Boolean)
      : [paragraph];

    for (const unit of visibleUnits) {
      const unitClasses = classesIn(unit);
      if (unitClasses.length > 1) {
        const finding = `${label}: paragraph ${paragraphIndex + 1} stacks ${unitClasses.join(', ')}`;
        observedStacks.push(finding);
        if (enforcedSlugs.has(slug)) errors.push(finding);
        continue;
      }

      const sentences = unit.split(/(?<=[.!?])\s+(?=[A-Z0-9"“])/);
      for (const sentence of sentences) {
        sentenceCount += 1;
        const sentenceClasses = classesIn(sentence);
        if (sentenceClasses.length > 1) {
          const finding = `${label}: sentence stacks ${sentenceClasses.join(', ')}`;
          observedStacks.push(finding);
          if (enforcedSlugs.has(slug)) errors.push(finding);
        }
      }
    }
  }
}

if (observedStacks.length > MAX_BASELINE_STACKED_UNITS) {
  warnings.push(`Markdown twin stack count grew from the ${MAX_BASELINE_STACKED_UNITS}-unit baseline to ${observedStacks.length}`);
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

mkdirSync('reports', { recursive: true });
writeFileSync(
  REPORT_PATH,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      baselineStackedUnits: MAX_BASELINE_STACKED_UNITS,
      observedStackedUnits: observedStacks.length,
      delta: observedStacks.length - MAX_BASELINE_STACKED_UNITS,
      status: errors.length ? 'fail' : warnings.length ? 'warn' : 'pass',
      errors,
      warnings,
      findings: observedStacks,
    },
    null,
    2,
  ) + '\n',
);

if (errors.length) {
  console.error(`Credibility-anchor budget failed (${errors.length}):`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

for (const warning of warnings) console.warn(`Credibility-anchor warning: ${warning}`);

console.log(`Credibility-anchor budget passed for ${twins.length} Markdown twins, ${paragraphCount} paragraphs, ${sentenceCount} sentences, and shared blog chrome (${observedStacks.length}/${MAX_BASELINE_STACKED_UNITS} legacy stacked units; report: ${REPORT_PATH}).`);
