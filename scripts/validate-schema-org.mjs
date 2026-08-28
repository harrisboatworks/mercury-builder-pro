#!/usr/bin/env node
// scripts/validate-schema-org.mjs
//
// Posts every JSON-LD block in dist/*.html to validator.schema.org and
// fails the build on error-severity issues. Warnings are logged only.
//
// Skip with SKIP_SCHEMA_ORG_VALIDATOR=1 (offline dev, or to triage a
// validator outage without blocking a release).
//
// Locally validates only files changed vs origin/main when LOCAL_DIFF=1
// is set, to keep dev fast. On CI (CI=1 or VERCEL=1) it scans every file.
//
// Runs after static-prerender.mjs + check-structured-data.mjs in the
// package.json build script.

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

if (process.env.SKIP_SCHEMA_ORG_VALIDATOR === '1') {
  console.log('[validate-schema-org] SKIP_SCHEMA_ORG_VALIDATOR=1 — skipping.');
  process.exit(0);
}

const DIST = 'dist';
const VALIDATOR_URL = 'https://validator.schema.org/validate';
const THROTTLE_MS = 350;
const MAX_FILES = Number(process.env.SCHEMA_VALIDATOR_MAX_FILES || 80);

function walkDir(dir, ext, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walkDir(full, ext, out);
    else if (full.endsWith(ext)) out.push(full);
  }
  return out;
}

function extractJsonLd(html) {
  const blocks = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) blocks.push(m[1].trim());
  return blocks;
}

async function validate(jsonLd) {
  const body = new URLSearchParams({ code: jsonLd }).toString();
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(VALIDATOR_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body,
      });
      const text = await res.text();
      // Validator wraps response with )]}'
      // anti-JSON-hijack prefix.
      const cleaned = text.replace(/^\)\]\}'\n?/, '');
      try {
        return JSON.parse(cleaned);
      } catch {
        return { _parseError: true, raw: text.slice(0, 200) };
      }
    } catch (err) {
      if (attempt === 1) throw err;
      await new Promise((r) => setTimeout(r, 750));
    }
  }
}

function pickFiles() {
  let files = walkDir(DIST, '.html');
  const onCI = process.env.CI === '1' || process.env.CI === 'true' || process.env.VERCEL === '1';
  if (!onCI && process.env.LOCAL_DIFF === '1') {
    try {
      const changed = execSync('git diff --name-only origin/main...HEAD', { encoding: 'utf8' })
        .split('\n')
        .filter(Boolean);
      const relevant = new Set(
        changed.filter((f) => f.endsWith('.html') || f.includes('seo') || f.includes('static-prerender'))
      );
      if (relevant.size) {
        files = files.filter((f) => [...relevant].some((c) => f.endsWith(c)));
      }
    } catch {
      /* not a git repo, fall through */
    }
  }
  // Sampling cap so a full prerender does not nuke the validator.
  if (files.length > MAX_FILES) {
    console.log(`[validate-schema-org] sampling ${MAX_FILES} of ${files.length} HTML files (set SCHEMA_VALIDATOR_MAX_FILES to change).`);
    const step = Math.max(1, Math.floor(files.length / MAX_FILES));
    files = files.filter((_, i) => i % step === 0).slice(0, MAX_FILES);
  }
  return files;
}

const files = pickFiles();
if (!files.length) {
  console.log('[validate-schema-org] No HTML files found in dist/. Skipping.');
  process.exit(0);
}

const errors = [];
const warnings = [];
let blocksChecked = 0;

for (const file of files) {
  const blocks = extractJsonLd(readFileSync(file, 'utf8'));
  for (let i = 0; i < blocks.length; i++) {
    blocksChecked++;
    try {
      const result = await validate(blocks[i]);
      if (result?._parseError) {
        warnings.push(`${file} block[${i}]: validator returned non-JSON response (${result.raw})`);
        await new Promise((r) => setTimeout(r, THROTTLE_MS));
        continue;
      }
      // Response shape: { tripleCount, errors: [...], totalNumNodes, ... }
      const errs = Array.isArray(result?.errors) ? result.errors : [];
      for (const e of errs) {
        const severity = (e.severity || e.errorType || '').toString().toLowerCase();
        const msg = `${file} block[${i}]: ${e.description || e.errorType || JSON.stringify(e)}`;
        if (severity.includes('warning') || severity === 'info') warnings.push(msg);
        else errors.push(msg);
      }
    } catch (err) {
      warnings.push(`${file} block[${i}]: validator network error — ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, THROTTLE_MS));
  }
}

if (warnings.length) {
  console.warn(`\n[validate-schema-org] ${warnings.length} warning(s):`);
  warnings.slice(0, 20).forEach((w) => console.warn('  ⚠ ' + w));
  if (warnings.length > 20) console.warn(`  …and ${warnings.length - 20} more`);
}

if (errors.length) {
  console.error(`\n[validate-schema-org] ❌ ${errors.length} schema.org error(s):\n`);
  errors.forEach((e) => console.error('  ✗ ' + e));
  console.error('\nBuild blocked by schema.org validator. Set SKIP_SCHEMA_ORG_VALIDATOR=1 to bypass.');
  process.exit(1);
}

console.log(`[validate-schema-org] ✅ ${blocksChecked} JSON-LD block(s) across ${files.length} file(s) validated by schema.org.`);
