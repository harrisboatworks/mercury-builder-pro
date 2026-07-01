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
// Whitelist patterns: any one matching means the year is intentional.
// 1) Preceded by a historical/connector word in EN, ES, FR.
const HISTORICAL_WORD_RX = /\b(?:since|in|during|from|by|of|before|after|early|late|mid|through|throughout|until|acquired|founded|established|spring|summer|fall|winter|season|desde|depuis|del|en|le|du|de)\s*$/i;
// 2) Preceded by a month-day phrase (e.g. "December 31, ", "31 de diciembre de ").
const MONTH_NAMES = '(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|janvier|fevrier|f\u00e9vrier|mars|avril|mai|juin|juillet|aout|ao\u00fbt|septembre|octobre|novembre|decembre|d\u00e9cembre)';
const MONTH_DAY_PREFIX_RX = new RegExp(`(?:${MONTH_NAMES})\\.?\\s+(?:\\d{1,2}(?:st|nd|rd|th)?,?\\s*)?$|\\d{1,2}\\s+de\\s+\\w+\\s+de\\s*$`, 'i');
const MODEL_CONTEXT_RX = /^[\s,.'"-]*(?:Mercury|FourStroke|Pro\s*XS|Verado|SeaPro|Avator|lineup|model|models|season|release|launch|recall|shift-?shaft|rebrand|spring|summer|fall|winter|or\s+(?:newer|later|earlier|older))\b/i;
// 4) CJK year suffix immediately after the year (Korean 년 / Chinese-Japanese 年)
//    — "2025년 가을" / "2024 年规则" are explicit dated references, not stale claims.
const CJK_YEAR_SUFFIX_RX = /^\s*(?:년|年)/;
// 5) Standalone parenthetical year "(2024)" — citation/annotation style.
const PAREN_YEAR = (before, after) => /\(\s*$/.test(before) && /^\s*\)/.test(after);
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
      if (HISTORICAL_WORD_RX.test(before)) continue;
      if (MONTH_DAY_PREFIX_RX.test(before)) continue;
      if (MODEL_CONTEXT_RX.test(after)) continue;
      if (CJK_YEAR_SUFFIX_RX.test(after)) continue;
      if (PAREN_YEAR(before, after)) continue;
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

// Stale-year leaks are reported but DO NOT fail the build unless the
// environment opts in with STRICT_STALE_YEARS=1. This lets the strict scan
// land without breaking on pre-existing content; clean up over time, then
// flip the env var (or pass it in CI) to enforce.
const STRICT_STALE = process.env.STRICT_STALE_YEARS === '1';
const hardFail = errors.length || rawAgentLeaks.length || (STRICT_STALE && staleYearLeaks.length);

if (hardFail) {
  console.error('\n❌ Pre-publish leak check FAILED\n');
  for (const e of errors) {
    console.error(`  ${e.file}:${e.line}  ${e.name}`);
    console.error(`      > ${e.snippet}`);
  }
  for (const e of rawAgentLeaks) {
    console.error(`  ${e.file}:${e.line}  ${e.name}`);
    console.error(`      > ${e.snippet}`);
  }
  if (STRICT_STALE) {
    for (const e of staleYearLeaks) {
      console.error(`  ${e.file}:${e.line}  ${e.name}`);
      console.error(`      > ${e.snippet}`);
    }
  }
  console.error(
    `\n${errors.length} editor leak(s), ${rawAgentLeaks.length} raw agent-URL leak(s)` +
    (STRICT_STALE ? `, ${staleYearLeaks.length} stale-year leak(s)` : '') +
    ` across ${BLOG_FILES.length} blog data files / ${USER_FACING_FILES.length} user-facing files.`
  );
  console.error('Strip or rewrite these before publishing. See scripts/check-blog-leaks.mjs for the rules.\n');
  process.exit(1);
}

if (staleYearLeaks.length) {
  console.warn(`\n⚠  ${staleYearLeaks.length} stale-year (2024/2025) reference(s) in blog prose (warning only):`);
  for (const e of staleYearLeaks.slice(0, 10)) {
    console.warn(`    ${e.file}:${e.line}  ${e.name}`);
    console.warn(`      > ${e.snippet}`);
  }
  if (staleYearLeaks.length > 10) console.warn(`    ... and ${staleYearLeaks.length - 10} more.`);
  console.warn('  (Run with STRICT_STALE_YEARS=1 to fail the build on these.)\n');
}

console.log(
  `✓ Pre-publish leak check: 0 editor leaks across ${BLOG_FILES.length} blog data files, ` +
  `0 raw agent-URL leaks across ${USER_FACING_FILES.length} user-facing files, ` +
  `${staleYearLeaks.length} stale-year warning(s)`
);


