#!/usr/bin/env node
/**
 * One-shot cleanup: remove duplicate in-content "Related guides" blocks
 * from src/data/blogArticles.ts. Cluster-driven <RelatedGuides /> is the
 * single source of truth now.
 *
 * Removes three patterns from each article's `content:` template literal:
 *   a) `## Related guides` H2 section (heading + list, until next H2 or EOF)
 *   b) `**Related guides:**` paragraph (bold label + immediate list, until blank line or next heading)
 *   c) `*Related guides: ... *` single-line italic variant
 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FILE = resolve(__dirname, '..', 'src/data/blogArticles.ts');

const src = await readFile(FILE, 'utf8');

// Walk every content:` ... ` template literal, apply removals, splice back.
// We reuse the balanced-backtick walker used by scripts/inject-related-guides.mjs.
function forEachContentLiteral(source, fn) {
  const out = [];
  let cursor = 0;
  const contentRe = /(\n\s*content\s*:\s*`)/g;
  let m;
  while ((m = contentRe.exec(source))) {
    const bodyStart = m.index + m[0].length;
    let i = bodyStart;
    let depth = 0;
    while (i < source.length) {
      const c = source[i];
      if (c === '\\') { i += 2; continue; }
      if (c === '$' && source[i + 1] === '{') { depth++; i += 2; continue; }
      if (c === '}' && depth > 0) { depth--; i++; continue; }
      if (c === '`' && depth === 0) break;
      i++;
    }
    if (i >= source.length) throw new Error('unterminated content literal');
    const raw = source.slice(bodyStart, i);
    // Unescape template-literal escapes to real markdown, transform, re-escape.
    const md = raw
      .replace(/\\`/g, '`')
      .replace(/\\\$\{/g, '${')
      .replace(/\\\\/g, '\\');
    const { next, counts, hadInternalLinksBefore, hasInternalLinksAfter, slug } = fn(md, source, m.index);
    const escaped = next
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\$\{/g, '\\${');
    out.push({ bodyStart, bodyEnd: i, escaped, counts, hadInternalLinksBefore, hasInternalLinksAfter, slug });
    contentRe.lastIndex = i + 1;
    cursor = i + 1;
  }
  // Splice from end to start
  let result = source;
  for (let k = out.length - 1; k >= 0; k--) {
    const o = out[k];
    result = result.slice(0, o.bodyStart) + o.escaped + result.slice(o.bodyEnd);
  }
  return { result, entries: out };
}

// Regexes
const RE_H2_SECTION = /\n*^##\s+Related guides\s*$[\s\S]*?(?=\n##\s|\s*$)/gim;
const RE_BOLD_BLOCK = /\n*^\*\*Related guides:\*\*\s*\n(?:[ \t]*-[^\n]*\n?)+/gm;
const RE_ITALIC_LINE = /\n*^\*Related guides:[^\n*]*\*\s*$/gim;

const totals = { h2: 0, bold: 0, italic: 0 };
const lostInternalLinks = [];

function findSlugNear(source, contentIdx) {
  // find `slug: '...'` before contentIdx
  const before = source.slice(0, contentIdx);
  const m = /slug:\s*['"]([^'"]+)['"][^`]*$/m.exec(before);
  return m ? m[1] : '(unknown)';
}

const { result, entries } = forEachContentLiteral(src, (md, source, contentIdx) => {
  const slug = findSlugNear(source, contentIdx);
  const hadInternalLinksBefore = /\/blog\/[a-z0-9-]+/i.test(md);

  let next = md;
  let c = { h2: 0, bold: 0, italic: 0 };

  next = next.replace(RE_H2_SECTION, () => { c.h2++; return '\n'; });
  next = next.replace(RE_BOLD_BLOCK, () => { c.bold++; return '\n'; });
  next = next.replace(RE_ITALIC_LINE, () => { c.italic++; return ''; });

  // Collapse excess blank lines produced by removals
  next = next.replace(/\n{3,}/g, '\n\n');

  totals.h2 += c.h2;
  totals.bold += c.bold;
  totals.italic += c.italic;

  const hasInternalLinksAfter = /\/blog\/[a-z0-9-]+/i.test(next);
  if (hadInternalLinksBefore && !hasInternalLinksAfter) {
    lostInternalLinks.push(slug);
  }

  return { next, counts: c, hadInternalLinksBefore, hasInternalLinksAfter, slug };
});

await writeFile(FILE, result);

console.log('--- remove-inline-related-guides summary ---');
console.log(`H2 sections removed:    ${totals.h2}`);
console.log(`Bold-label blocks:      ${totals.bold}`);
console.log(`Italic single-lines:    ${totals.italic}`);
console.log(`Articles processed:     ${entries.length}`);
console.log(`Articles that lost ALL /blog/ links (cluster still covers):`);
if (lostInternalLinks.length === 0) console.log('  (none)');
else for (const s of lostInternalLinks) console.log(`  - ${s}`);
