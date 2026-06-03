#!/usr/bin/env node
// CI guard: fails the build if any sentinel-tagged price in blog content
// drifts from canonical pricing-reference.md. Exact SKU prices only — wide
// installed/all-in ranges are out of scope by design.
//
// Sentinel format documented in scripts/reconcile-blog-pricing.mjs.
// Run via `npm run check:pricing-drift`.

import { readFileSync } from 'node:fs';
import { glob } from 'glob';
import { computeCanonicalValue } from './reconcile-blog-pricing.mjs';

const SENTINEL =
  /<!--canonical:([a-z0-9-]+):([a-z0-9.\-_]+)(?::([a-z0-9.\-_]+))?-->([^<]*)<!--\/canonical-->/gi;

const files = [
  ...(await glob('src/data/blogArticles.ts')),
  ...(await glob('src/data/{mandarin,korean,french,spanish}BlogArticles.ts')),
];

const errors = [];
let scanned = 0;

for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) {
    let m;
    SENTINEL.lastIndex = 0;
    while ((m = SENTINEL.exec(lines[i])) !== null) {
      scanned++;
      const [, kind, key, arg, value] = m;
      const expected = computeCanonicalValue(kind, key, arg);
      if (expected == null) {
        errors.push({
          file,
          line: i + 1,
          kind,
          key,
          arg,
          actual: value,
          expected: '(unknown canonical key)',
        });
      } else if (value.trim() !== expected) {
        errors.push({ file, line: i + 1, kind, key, arg, actual: value, expected });
      }
    }
  }
}

if (errors.length) {
  console.error('\n❌ Blog pricing drift check FAILED\n');
  for (const e of errors) {
    const argPart = e.arg ? `:${e.arg}` : '';
    console.error(
      `  ${e.file}:${e.line}  canonical:${e.kind}:${e.key}${argPart}` +
        `\n      actual:   "${e.actual}"` +
        `\n      expected: "${e.expected}"`,
    );
  }
  console.error(
    `\n${errors.length} drift(s) across ${scanned} sentinel(s) in ${files.length} file(s).`,
  );
  console.error(
    'Fix: run `npm run reconcile:blog-pricing` to auto-update from public/pricing-reference.md.\n',
  );
  process.exit(1);
}
console.log(
  `✓ Blog pricing drift check: 0 drifts across ${scanned} sentinel(s) in ${files.length} file(s)`,
);
