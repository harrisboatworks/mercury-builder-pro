#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const failures = [];
const fail = (file, message) => failures.push(`${file}: ${message}`);

function walk(dir, predicate) {
  if (!existsSync(dir)) return [];
  const files = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) files.push(...walk(path, predicate));
    else if (predicate(path)) files.push(path);
  }
  return files;
}

const staticRenderer = readFileSync('scripts/static-prerender.mjs', 'utf8');
const runtimeRenderer = readFileSync('src/components/blog/MarkdownSectionCards.tsx', 'utf8');
const twinGenerator = readFileSync('scripts/generate-markdown-twins.mjs', 'utf8');

if (!/::bilingual-trust\(\?:-card\)\?/.test(staticRenderer)) {
  fail('scripts/static-prerender.mjs', 'must render the bilingual-trust-card alias');
}
if (!/::cta\\s\*\\n/.test(staticRenderer) || !/renderCtaHtml/.test(staticRenderer)) {
  fail('scripts/static-prerender.mjs', 'must expand CTA directives for no-JS readers');
}
if (!/hasFaqs:\s*Boolean\(article\.faqs\?\.length\)/.test(staticRenderer)) {
  fail('scripts/static-prerender.mjs', 'must suppress inline FAQ copy when structured FAQs are appended');
}
if (!/::bilingual-trust\(\?:-card\)\?/.test(runtimeRenderer)) {
  fail('src/components/blog/MarkdownSectionCards.tsx', 'must render the bilingual-trust-card alias');
}
if (!/directiveToMarkdown/.test(twinGenerator)) {
  fail('scripts/generate-markdown-twins.mjs', 'must convert visual directives into readable Markdown');
}

const htmlLeakPatterns = [
  [/::(?:cta|bilingual-trust(?:-card)?|decision-card|diagnostic-flow|cost-stack)\b/i, 'raw visual directive'],
  [/\{\{LIVE_[A-Z_]+\}\}/, 'unresolved live token'],
  [/<h2[^>]*>\s*(?:CTA|Internal Links|Full Article)\s*<\/h2>/i, 'authoring-only H2'],
  [/(?:^|>)\s*Language:\s*English\s*(?:<|$)/im, 'Language scaffold'],
  [/(?:^|>)\s*Canonical URL:\s*https?:\/\//im, 'Canonical URL scaffold'],
  [/<\/a>\s+—\s+/g, 'em-dash related-guide separator'],
];

const htmlFiles = walk('dist/blog', (path) => path.endsWith('/index.html'));
for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  for (const [pattern, label] of htmlLeakPatterns) {
    pattern.lastIndex = 0;
    if (pattern.test(html)) fail(file, label);
  }
  const faqHeadings = html.match(/<h2[^>]*>\s*(?:Frequently Asked Questions|FAQs?)\s*<\/h2>/gi) || [];
  if (faqHeadings.length > 1) fail(file, `${faqHeadings.length} FAQ section headings`);
  if (/\/blog\/(?:fr|ko|zh|es|pa|ur|tl|hi)\//.test(file.replace(/\\/g, '/')) && /class="author-byline"[^>]*>[\s\S]{0,120}<span>By\s/.test(html)) {
    fail(file, 'English static byline on a translated article');
  }
}

const twinFiles = walk('public/blog', (path) => path.endsWith('.md'));
const twinLeakPatterns = [
  [/^::(?:[a-z][a-z-]*)(?:\s|$)/m, 'raw visual directive'],
  [/\{\{LIVE_[A-Z_]+\}\}/, 'unresolved live token'],
  [/^##\s+(?:CTA|Internal Links|Full Article)\s*$/im, 'authoring-only heading'],
  [/^\s*Language:\s*English\s*$/im, 'Language scaffold'],
  [/^[*_\s]*Canonical URL\s*:[*_\s]*https?:\/\//im, 'Canonical URL scaffold'],
];
for (const file of twinFiles) {
  const markdown = readFileSync(file, 'utf8');
  for (const [pattern, label] of twinLeakPatterns) {
    if (pattern.test(markdown)) fail(file, label);
  }
}

if (failures.length) {
  console.error(`\nBlog renderer parity check failed (${failures.length} issue${failures.length === 1 ? '' : 's'}):`);
  for (const failure of failures.slice(0, 80)) console.error(`  - ${failure}`);
  if (failures.length > 80) console.error(`  - ...and ${failures.length - 80} more`);
  process.exit(1);
}

console.log(`✓ Blog renderer parity: source guards passed; checked ${htmlFiles.length} prerendered article pages and ${twinFiles.length} Markdown twins`);
