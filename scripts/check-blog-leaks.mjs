#!/usr/bin/env node
// Pre-publish leak check — fails build if any blog .ts file contains
// editor production notes that should never be public.
// Run via `npm run check:blog-leaks` or automatically via prebuild hook.

import { readFileSync } from 'node:fs';
import { glob } from 'glob';

const LEAK_PATTERNS = [
  { pattern: /\*\*(?:EDITOR\s+NOTE|English\s+Editor\s+Note|English\s+editor\s+note|Editor\s+Note|Nota\s+del\s+editor)/i, name: 'Editor note bold marker' },
  { pattern: /#\s+DOCUMENT\s+NOTES/i, name: 'DOCUMENT NOTES block' },
  { pattern: /\*\((?:English\s+editor\s+note|Nota\s+del\s+editor\s+EN):/i, name: 'Inline italic editor note' },
  { pattern: /\bverify\s+(?:current\s+values\s+)?before\s+publishing\b/i, name: '"verify before publishing" leak' },
  { pattern: /\bNo\s+prices\s+fabricated\b/i, name: '"No prices fabricated" leak' },
  { pattern: /\bSource\s+post\s+published\b/i, name: '"Source post published" leak' },
  { pattern: /\bdo\s+not\s+publish\s+(?:this|yet|before)/i, name: '"do not publish" leak' },
  { pattern: /\[CUSTOMER STORY OPPORTUNITY\]/i, name: 'Customer story placeholder' },
  { pattern: /\[INSERT\s+[A-Z]/i, name: '[INSERT ...] placeholder' },
  { pattern: /\bTODO:/i, name: 'TODO leak' },
];

const FILES = await glob('src/data/{blog,mandarin,korean,french,spanish}BlogArticles.ts');

const errors = [];
for (const file of FILES) {
  const src = readFileSync(file, 'utf8');
  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) {
    for (const { pattern, name } of LEAK_PATTERNS) {
      if (pattern.test(lines[i])) {
        errors.push({ file, line: i + 1, name, snippet: lines[i].trim().slice(0, 140) });
      }
    }
  }
}

if (errors.length) {
  console.error('\n❌ Pre-publish leak check FAILED\n');
  for (const e of errors) {
    console.error(`  ${e.file}:${e.line}  ${e.name}`);
    console.error(`      > ${e.snippet}`);
  }
  console.error(`\n${errors.length} leak(s) found across ${FILES.length} blog data files.`);
  console.error('Strip these before publishing. See scripts/check-blog-leaks.mjs for the pattern list.\n');
  process.exit(1);
}
console.log(`✓ Pre-publish leak check: 0 leaks across ${FILES.length} blog data files`);
