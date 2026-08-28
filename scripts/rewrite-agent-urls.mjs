#!/usr/bin/env node
/**
 * Rewrites raw Supabase edge-function URLs in public/**\/*.md to the
 * www.mercuryrepower.ca/api/agents/* proxy form, so the blog leak checker
 * stays green without manual edits.
 *
 * Mapping:
 *   https://<project-ref>.supabase.co/functions/v1/<fn>[/...]
 *     -> https://www.mercuryrepower.ca/api/agents/<mapped>[/...]
 *
 * Function -> proxy path mapping (extend as needed):
 *   public-quote-api      -> quote
 *   public-inventory-api  -> inventory
 *   public-pricing-api    -> pricing
 *   public-promotions-api -> promotions
 * Unmapped functions fall back to their function name with the `public-`
 * and `-api` affixes stripped.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const KNOWN = {
  'public-quote-api': 'quote',
  'public-inventory-api': 'inventory',
  'public-pricing-api': 'pricing',
  'public-promotions-api': 'promotions',
};

function mapFn(fn) {
  if (KNOWN[fn]) return KNOWN[fn];
  return fn.replace(/^public-/, '').replace(/-api$/, '');
}

// Match any supabase functions URL (http/https), optional path tail.
const URL_RE = /https?:\/\/[a-z0-9-]+\.supabase\.co\/functions\/v1\/([a-z0-9-]+)((?:\/[^\s`"')\]]*)?)/gi;

// Recursively collect every *.md under public/.
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    let st;
    try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) walk(p, out);
    else if (entry.endsWith('.md')) out.push(p);
  }
  return out;
}
const files = walk('public');

let changedFiles = 0;
let totalReplacements = 0;

for (const file of files) {
  let src;
  try {
    src = readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  let count = 0;
  const out = src.replace(URL_RE, (_m, fn, tail) => {
    count++;
    const mapped = mapFn(fn);
    return `https://www.mercuryrepower.ca/api/agents/${mapped}${tail || ''}`;
  });
  if (count > 0 && out !== src) {
    writeFileSync(file, out);
    changedFiles++;
    totalReplacements += count;
    console.log(`  rewrote ${count} URL(s) in ${file}`);
  }
}

if (totalReplacements === 0) {
  console.log('✓ rewrite-agent-urls: no raw Supabase function URLs found in public/**/*.md');
} else {
  console.log(`✓ rewrite-agent-urls: ${totalReplacements} URL(s) rewritten across ${changedFiles} file(s)`);
}
