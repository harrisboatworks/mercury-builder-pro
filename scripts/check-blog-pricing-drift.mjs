#!/usr/bin/env node
// CI guard: fails the build if any @canonical-annotated price in blog content
// drifts from canonical pricing-reference.md. Exact SKU prices only.
//
// Sentinel format documented in scripts/reconcile-blog-pricing.mjs.
// Run via `npm run check:pricing-drift`.

import { readFileSync, readdirSync } from 'node:fs';
import { computeCanonicalValue, SENTINEL_RX } from './reconcile-blog-pricing.mjs';

const BLOG_LANG_RX = /^(mandarin|korean|french|spanish)BlogArticles\.ts$/;
const files = readdirSync('src/data')
  .filter((f) => f === 'blogArticles.ts' || BLOG_LANG_RX.test(f))
  .map((f) => `src/data/${f}`);


const errors = [];
let scanned = 0;

for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) {
    let m;
    const rx = new RegExp(SENTINEL_RX.source, 'g');
    while ((m = rx.exec(lines[i])) !== null) {
      scanned++;
      const [, , value, , kind, key, arg] = m;
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
      } else if (value !== expected) {
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
      `  ${e.file}:${e.line}  @canonical:${e.kind}:${e.key}${argPart}` +
        `\n      actual:   ${e.actual}` +
        `\n      expected: ${e.expected}`,
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
