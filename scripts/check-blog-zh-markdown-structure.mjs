#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const slugs = [
  'toronto-fishing-rice-lake-vs-lake-simcoe-kawarthas',
  'mercury-outboard-horsepower-guide-toronto-chinese',
  'mercury-outboard-price-dealer-guide-toronto-chinese',
  'ontario-spring-boat-checklist-chinese',
  'used-boat-buying-checklist-toronto-chinese',
  'boat-ownership-cost-ontario-chinese',
  'gta-chinese-rent-to-buy-boat-roadmap',
];

const failures = [];
const mandarinRenderer = fs.readFileSync(
  path.join('src', 'pages', 'blog', 'MandarinBlogArticlePage.tsx'),
  'utf8',
);
const tableRenderer = mandarinRenderer.match(/table:\s*\(\{[\s\S]*?<\/div>\s*\),/m)?.[0] || '';

if (!tableRenderer.includes('overflow-x-auto')) {
  failures.push('Mandarin article tables must scroll within the article on narrow screens');
}

for (const slug of slugs) {
  const file = path.join('public', 'blog', 'zh', `${slug}.md`);
  if (!fs.existsSync(file)) {
    failures.push(`${slug}: missing Markdown twin`);
    continue;
  }

  const markdown = fs.readFileSync(file, 'utf8');
  const h1Count = (markdown.match(/^# /gm) || []).length;
  const h2Count = (markdown.match(/^## /gm) || []).length;
  const tableCount = (markdown.match(/^\|(?:[^\n]*\|){2,}\n\|(?:\s*:?-{3,}:?\s*\|){2,}/gm) || []).length;

  if (h1Count !== 1) failures.push(`${slug}: expected one H1, found ${h1Count}`);
  if (h2Count < 8) failures.push(`${slug}: expected at least eight H2 sections, found ${h2Count}`);
  if (tableCount < 1) failures.push(`${slug}: expected at least one Markdown table`);
  if (markdown.includes('For engine repairs, we only service Mercury and Mercruiser.')) {
    failures.push(`${slug}: untranslated English service-policy sentence remains`);
  }
}

if (failures.length) {
  console.error('Chinese Markdown structure check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Chinese Markdown structure check passed for ${slugs.length} F-008 routes.`);
