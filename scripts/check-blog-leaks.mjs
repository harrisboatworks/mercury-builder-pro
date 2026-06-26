#!/usr/bin/env node
// Pre-publish leak check — fails build if any blog .ts file contains
// editor production notes that should never be public, AND fails build if any
// user-facing surface (public/, src/pages/) still references the raw Supabase
// Edge Function URL for the four public agent endpoints. Those endpoints must
// be advertised via the branded https://www.mercuryrepower.ca/api/agents/...
// proxy. Internal server code (supabase/functions/, internal hooks/libs that
// invoke other functions, docs/runbooks, README, etc.) is intentionally
// exempt — raw Supabase URLs remain valid and continue to respond.
//
// Run via `npm run check:blog-leaks` or automatically via prebuild hook.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

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

const BLOG_LANG_RX = /^(mandarin|korean|french|spanish)BlogArticles\.ts$/;
const BLOG_FILES = readdirSync('src/data')
  .filter((f) => f === 'blogArticles.ts' || BLOG_LANG_RX.test(f))
  .map((f) => `src/data/${f}`);

// Raw Supabase URLs for the four public agent endpoints that MUST go through
// the branded /api/agents/* proxy on every user-facing surface.
const RAW_AGENT_URL_RX =
  /https?:\/\/eutsoqdpjurknjsshxes\.supabase\.co\/functions\/v1\/(public-motors-api|public-quote-api|ucp-checkout|agent-mcp-server)\b/;

// Walk a directory recursively, returning file paths matching the extension set.
function walk(dir, exts) {
  const out = [];
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const name of entries) {
    const p = join(dir, name);
    let st;
    try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) {
      out.push(...walk(p, exts));
    } else if (exts.some((e) => name.endsWith(e))) {
      out.push(p);
    }
  }
  return out;
}

const USER_FACING_FILES = [
  ...walk('public', ['.md', '.txt', '.json', '.html', '.xml']),
  ...walk('src/pages', ['.ts', '.tsx']),
];

const errors = [];

// 1. Legacy blog leak scan
for (const file of BLOG_FILES) {
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

// 2. Raw agent endpoint URL scan on user-facing surfaces
const rawAgentLeaks = [];
for (const file of USER_FACING_FILES) {
  const src = readFileSync(file, 'utf8');
  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (RAW_AGENT_URL_RX.test(lines[i])) {
      rawAgentLeaks.push({
        file,
        line: i + 1,
        name: 'Raw Supabase agent endpoint URL (must use https://www.mercuryrepower.ca/api/agents/* proxy)',
        snippet: lines[i].trim().slice(0, 160),
      });
    }
  }
}

// 3. Stale year scan inside blog article prose (content + description only).
// Strict: any bare 2024 or 2025 is a leak unless it is clearly a historical
// reference ("since 1947", "in 2015 we...") or part of a Mercury model-year
// phrase ("the 2025 Mercury lineup"). datePublished / dateModified fields are
// not scanned because we operate on extracted prose, never the surrounding
// metadata.
const STALE_YEAR_RX = /\b(2024|2025)\b/g;
const HISTORICAL_PREFIX_RX = /(?:\b(?:since|in|during|from|by|of|before|after|early|late|mid|spring|summer|fall|winter|season|model\s+year|MY|desde|depuis|del|en|le|du|de\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|janvier|f[ée]vrier|mars|avril|mai|juin|juillet|ao[uû]t|septembre|octobre|novembre|d[ée]cembre|January|February|March|April|May|June|July|August|September|October|November|December))\s*$|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|January|February|March|April|June|July|August|September|October|November|December|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\.?\s+\d{1,2}(?:st|nd|rd|th)?,?\s*$|\bde\s+\d{1,2}\s+de\s+\w+\s+de\s*$|\b\d{1,2}\s+de\s+\w+\s+de\s*$/i;
const MODEL_CONTEXT_RX = /^[\s,.'"-]*(?:Mercury|FourStroke|Pro\s*XS|Verado|SeaPro|Avator|lineup|model|models|season|release|launch)\b/i;
const staleYearLeaks = [];

function extractProseChunks(src) {
  // Pull each article's content (template literal) and description (quoted).
  const chunks = [];
  const slugRx = /slug:\s*['"]([^'"]+)['"]/g;
  const positions = [];
  let sm;
  while ((sm = slugRx.exec(src)) !== null) positions.push({ slug: sm[1], start: sm.index });
  positions.push({ slug: null, start: src.length });
  for (let i = 0; i < positions.length - 1; i++) {
    const block = src.slice(positions[i].start, positions[i + 1].start);
    const blockOffset = positions[i].start;
    // content template literal
    const cm = block.match(/content:\s*`/);
    if (cm) {
      const start = cm.index + cm[0].length;
      let j = start;
      while (j < block.length) {
        if (block[j] === '\\') { j += 2; continue; }
        if (block[j] === '`') break;
        j++;
      }
      chunks.push({ slug: positions[i].slug, field: 'content', text: block.slice(start, j), absStart: blockOffset + start });
    }
    // description quoted string
    const dm = block.match(/description:\s*(['"])((?:\\.|(?!\1).)*)\1/s);
    if (dm) {
      const start = dm.index + dm[0].indexOf(dm[1]) + 1;
      chunks.push({ slug: positions[i].slug, field: 'description', text: dm[2], absStart: blockOffset + start });
    }
  }
  return chunks;
}

function lineNumberFor(src, absIndex) {
  let line = 1;
  for (let k = 0; k < absIndex && k < src.length; k++) if (src[k] === '\n') line++;
  return line;
}

for (const file of BLOG_FILES) {
  const src = readFileSync(file, 'utf8');
  const chunks = extractProseChunks(src);
  for (const ch of chunks) {
    let m;
    STALE_YEAR_RX.lastIndex = 0;
    while ((m = STALE_YEAR_RX.exec(ch.text)) !== null) {
      const before = ch.text.slice(Math.max(0, m.index - 20), m.index);
      const after = ch.text.slice(m.index + 4, m.index + 40);
      if (HISTORICAL_PREFIX_RX.test(before)) continue;
      if (MODEL_CONTEXT_RX.test(after)) continue;
      // Skip if part of an ISO-like date (YYYY-MM-DD) - that's data, not prose claim
      if (/^[-/]\d/.test(after) || /\d[-/]$/.test(before)) continue;
      const line = lineNumberFor(src, ch.absStart + m.index);
      const snippetStart = Math.max(0, m.index - 40);
      const snippet = ch.text.slice(snippetStart, m.index + 60).replace(/\s+/g, ' ').trim();
      staleYearLeaks.push({
        file,
        line,
        name: `Stale year "${m[1]}" in ${ch.field} of "${ch.slug}" (current year is 2026)`,
        snippet: snippet.slice(0, 160),
      });
    }
  }
}

if (errors.length || rawAgentLeaks.length || staleYearLeaks.length) {
  console.error('\n❌ Pre-publish leak check FAILED\n');
  for (const e of errors) {
    console.error(`  ${e.file}:${e.line}  ${e.name}`);
    console.error(`      > ${e.snippet}`);
  }
  for (const e of rawAgentLeaks) {
    console.error(`  ${e.file}:${e.line}  ${e.name}`);
    console.error(`      > ${e.snippet}`);
  }
  for (const e of staleYearLeaks) {
    console.error(`  ${e.file}:${e.line}  ${e.name}`);
    console.error(`      > ${e.snippet}`);
  }
  console.error(
    `\n${errors.length} editor leak(s), ${rawAgentLeaks.length} raw agent-URL leak(s), ` +
    `${staleYearLeaks.length} stale-year leak(s) across ${BLOG_FILES.length} blog data files / ${USER_FACING_FILES.length} user-facing files.`
  );
  console.error('Strip or rewrite these before publishing. See scripts/check-blog-leaks.mjs for the rules.\n');
  process.exit(1);
}
console.log(
  `✓ Pre-publish leak check: 0 editor leaks across ${BLOG_FILES.length} blog data files, ` +
  `0 raw agent-URL leaks across ${USER_FACING_FILES.length} user-facing files, 0 stale-year leaks`
);

