#!/usr/bin/env node
/**
 * Blog Timeline / Factual Validator
 * ---------------------------------
 * Hard-enforces known timeline facts about Harris Boat Works inside every
 * blog article's prose (content + description). Fails the build if any
 * article disagrees with the source-of-truth values below.
 *
 *   Owner takeover year ........ 2016  (Jay Harris took over)
 *   Founder year ............... 1947  (grandfather George founded)
 *   Current calendar year ...... 2026  (present-tense references)
 *   Dealership age ............. CURRENT_YEAR - 1947
 *
 * Run: `npm run check:blog-timeline-facts` (also wired into prebuild).
 */
import { readFileSync, readdirSync } from 'node:fs';

const OWNER_TAKEOVER_YEAR = 2016;
const FOUNDER_YEAR = 1947;
const CURRENT_YEAR = 2026;
const EXPECTED_AGE = CURRENT_YEAR - FOUNDER_YEAR; // 79

const BLOG_LANG_RX = /^(mandarin|korean|french|spanish|hindi|punjabi|tagalog|urdu|traditionalChinese)BlogArticles\.ts$/;
const BLOG_FILES = readdirSync('src/data')
  .filter((f) => f === 'blogArticles.ts' || BLOG_LANG_RX.test(f))
  .map((f) => `src/data/${f}`);

// Extract every { slug: '...', ..., content: `...`, ..., description: '...' }
// chunk. We keep this regex-based (no TS parse) because the file is a flat
// array literal and the fields use predictable quoting.
function extractArticles(src) {
  const articles = [];
  const slugRx = /slug:\s*['"]([^'"]+)['"]/g;
  let m;
  const positions = [];
  while ((m = slugRx.exec(src)) !== null) positions.push({ slug: m[1], start: m.index });
  positions.push({ slug: null, start: src.length });
  for (let i = 0; i < positions.length - 1; i++) {
    const block = src.slice(positions[i].start, positions[i + 1].start);
    const content = readTemplate(block, 'content');
    const description = readQuoted(block, 'description');
    articles.push({ slug: positions[i].slug, content, description, blockStart: positions[i].start });
  }
  return articles;
}

function readTemplate(block, field) {
  const rx = new RegExp(`${field}:\\s*\``);
  const m = block.match(rx);
  if (!m) return '';
  const start = m.index + m[0].length;
  let i = start;
  while (i < block.length) {
    if (block[i] === '\\') { i += 2; continue; }
    if (block[i] === '`') return block.slice(start, i);
    i++;
  }
  return block.slice(start);
}

function readQuoted(block, field) {
  const rx = new RegExp(`${field}:\\s*(['"])((?:\\\\.|(?!\\1).)*)\\1`, 's');
  const m = block.match(rx);
  return m ? m[2] : '';
}

const errors = [];
const push = (file, slug, rule, snippet) =>
  errors.push({ file, slug, rule, snippet: snippet.trim().slice(0, 160) });

// Sentence-ish window helper for context-sensitive rules.
function* sentences(text) {
  const parts = text.split(/(?<=[.!?])\s+|\n+/);
  for (const p of parts) if (p && p.trim()) yield p;
}

// ----- Rules -----------------------------------------------------------------

// R1: owner takeover year
const TOOK_OVER_RX = /\btook\s+over\b[^.\n]{0,80}?\b(19|20)\d{2}\b/gi;
const TOOK_OVER_YEAR_RX = /\btook\s+over\b[^.\n]{0,80}?\b((?:19|20)\d{2})\b/i;
function checkTakeover(text, push) {
  const matches = text.match(TOOK_OVER_RX) || [];
  for (const m of matches) {
    const y = Number(m.match(TOOK_OVER_YEAR_RX)?.[1]);
    if (y && y !== OWNER_TAKEOVER_YEAR) push('takeover-year', `${m} (expected ${OWNER_TAKEOVER_YEAR})`);
  }
}

// R2: founder year (in same sentence as a founder cue word)
const FOUNDER_CUE_RX = /\b(George|grandfather|founded|founding)\b/i;
const FOUNDED_YEAR_RX = /\b(founded|started|opened|established)\b[^.\n]{0,80}?\b((?:19|20)\d{2})\b/i;
function checkFounder(text, push) {
  for (const s of sentences(text)) {
    if (!FOUNDER_CUE_RX.test(s)) continue;
    const fm = s.match(FOUNDED_YEAR_RX);
    if (fm) {
      const y = Number(fm[2]);
      if (y !== FOUNDER_YEAR) push('founder-year', `${s} (expected ${FOUNDER_YEAR})`);
    }
  }
}

// R3: dealership age
const AGE_RX = /\b(\d{1,3})\s*(?:\+)?\s*[-\u2013]?\s*years?\s+(?:in\s+business|of\s+business|operating|serving|in\s+operation|of\s+service|family[\s-](?:owned|run))/gi;
function checkAge(text, push) {
  const matches = text.match(AGE_RX) || [];
  for (const m of matches) {
    const n = Number(m.match(/\d{1,3}/)[0]);
    // Allow +/- 1 because "almost 80" / "80 years" rounding is fine.
    if (Math.abs(n - EXPECTED_AGE) > 1) push('dealership-age', `${m} (expected ~${EXPECTED_AGE} years since ${FOUNDER_YEAR})`);
  }
  // "since YYYY" only when the surrounding clause ties the year to the
  // FOUNDING / family ownership of the business. "Mercury dealer since 1965"
  // is a separate, legitimate milestone (year HBW became a Mercury dealer)
  // and must not trip this rule.
  const SINCE_RX = /\b(?:family[\s-](?:owned|run|operated)|in\s+business|in\s+operation|business\s+founded|operating|serving\s+Ontario)[^.\n]{0,40}?\bsince\s+((?:19|20)\d{2})\b/gi;
  let sm;
  while ((sm = SINCE_RX.exec(text)) !== null) {
    const y = Number(sm[1]);
    if (y !== FOUNDER_YEAR) {
      push('since-year', `${sm[0]} (family-ownership claim must be since ${FOUNDER_YEAR})`);
    }
  }

}

// R4: present-tense "this year/season" claims must agree with CURRENT_YEAR.
const PRESENT_RX = /\b(?:this\s+(?:year|season|spring|summer|fall|winter)|currently|right\s+now|as\s+of)\b[^.\n]{0,40}?\b((?:19|20)\d{2})\b/gi;
function checkPresent(text, push) {
  let m;
  while ((m = PRESENT_RX.exec(text)) !== null) {
    const y = Number(m[1]);
    if (y !== CURRENT_YEAR) push('present-year', `${m[0]} (expected ${CURRENT_YEAR})`);
  }
}

// ----- Drive ----------------------------------------------------------------

for (const file of BLOG_FILES) {
  const src = readFileSync(file, 'utf8');
  const articles = extractArticles(src);
  for (const a of articles) {
    const text = `${a.description}\n${a.content}`;
    const localPush = (rule, snippet) => push(file, a.slug, rule, snippet);
    checkTakeover(text, localPush);
    checkFounder(text, localPush);
    checkAge(text, localPush);
    checkPresent(text, localPush);
  }
}

if (errors.length) {
  console.error(`\nBlog timeline-fact validation FAILED - ${errors.length} issue(s):\n`);
  const byFile = new Map();
  for (const e of errors) {
    const key = `${e.file} :: ${e.slug}`;
    if (!byFile.has(key)) byFile.set(key, []);
    byFile.get(key).push(e);
  }
  for (const [k, list] of byFile) {
    console.error(`  [${k}]`);
    for (const e of list) console.error(`    - ${e.rule}: ${e.snippet}`);
  }
  console.error(`\nSource of truth: owner took over ${OWNER_TAKEOVER_YEAR}, founded ${FOUNDER_YEAR}, current year ${CURRENT_YEAR}.\n`);
  process.exit(1);
} else {
  console.log(`Blog timeline-fact validation PASSED - ${BLOG_FILES.length} file(s) checked.`);
}
