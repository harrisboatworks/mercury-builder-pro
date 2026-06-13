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

if (errors.length || rawAgentLeaks.length) {
  console.error('\n❌ Pre-publish leak check FAILED\n');
  for (const e of errors) {
    console.error(`  ${e.file}:${e.line}  ${e.name}`);
    console.error(`      > ${e.snippet}`);
  }
  for (const e of rawAgentLeaks) {
    console.error(`  ${e.file}:${e.line}  ${e.name}`);
    console.error(`      > ${e.snippet}`);
  }
  console.error(
    `\n${errors.length} editor leak(s) across ${BLOG_FILES.length} blog data files; ` +
    `${rawAgentLeaks.length} raw agent-URL leak(s) across ${USER_FACING_FILES.length} user-facing files.`
  );
  console.error('Strip or rewrite these before publishing. See scripts/check-blog-leaks.mjs for the rules.\n');
  process.exit(1);
}
console.log(
  `✓ Pre-publish leak check: 0 editor leaks across ${BLOG_FILES.length} blog data files, ` +
  `0 raw agent-URL leaks across ${USER_FACING_FILES.length} user-facing files`
);
