#!/usr/bin/env node
// HEADS UP — DO NOT REMOVE THE ESBUILD + LEAKS GUARD.
//
// This script exists because a bulk inline `sed`/`node -e` body-swap in the
// 2026-05-11 sprint dropped `},` separators between adjacent article entries
// in `src/data/blogArticles.ts`, taking 3 articles offline and requiring a
// PROD FIRE recovery (commit 187).
//
// The fix is structural: every write happens behind a backup-and-verify
// pipeline. If esbuild can't parse the result, or if check-blog-leaks finds
// a leak, the file is rolled back and the script aborts. Future bulk edits
// (Cowork-driven, Lovable-driven, or local) must route through this script
// or replicate this guard exactly.
//
// If you find yourself disabling the guard "just for this one thing", stop.
// Either fix your input or break it into smaller swaps. The guard is load-
// bearing for production safety.

import { readFileSync, writeFileSync, copyFileSync, unlinkSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const val = argv[i + 1];
      args[key] = val;
      i++;
    }
  }
  return args;
}

function fail(msg) {
  console.error(`${RED}[SAFE-BLOG-EDIT] ${msg}${RESET}`);
  process.exit(1);
}

function info(msg) {
  console.log(`[SAFE-BLOG-EDIT] ${msg}`);
}

// Locate the article object with `slug: '<slug>'` and replace its `content:` template-literal value.
// Returns the new file source, or throws on error.
function swapContent(source, slug, newContent) {
  // Find slug occurrences. Match both single and double quoted slug values.
  const slugRegex = new RegExp(`slug:\\s*['"]${slug.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}['"]`, 'g');
  const matches = [...source.matchAll(slugRegex)];
  if (matches.length === 0) {
    throw new Error(`slug not found: ${slug}`);
  }
  if (matches.length > 1) {
    throw new Error(`slug appears ${matches.length} times (expected 1): ${slug}`);
  }

  const slugIdx = matches[0].index;

  // From slugIdx, find the next `content:` field within the same object.
  // We assume `content:` followed by a backtick-delimited template literal.
  const contentKeyRegex = /content\s*:\s*`/g;
  contentKeyRegex.lastIndex = slugIdx;
  const ck = contentKeyRegex.exec(source);
  if (!ck) {
    throw new Error(`content: backtick literal not found after slug ${slug}`);
  }
  const startBacktick = ck.index + ck[0].length - 1; // position of opening `
  const bodyStart = startBacktick + 1;

  // Walk forward to find the matching closing backtick, respecting escapes (\`) and ${} interpolation.
  let i = bodyStart;
  let depth = 0; // ${ ... } depth
  while (i < source.length) {
    const c = source[i];
    if (c === '\\') { i += 2; continue; }
    if (c === '$' && source[i + 1] === '{') { depth++; i += 2; continue; }
    if (c === '}' && depth > 0) { depth--; i++; continue; }
    if (c === '`' && depth === 0) break;
    i++;
  }
  if (i >= source.length) {
    throw new Error(`unterminated template literal for content of slug ${slug}`);
  }
  const bodyEnd = i; // position of closing `

  // Sanity: the next non-whitespace chars after closing ` should be `,` or `\n  faqs:` etc., NOT another article object.
  // We don't enforce here; esbuild check is the load-bearing validator.

  // Escape backticks and ${ in the new content.
  const escaped = newContent
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');

  return source.slice(0, bodyStart) + escaped + source.slice(bodyEnd);
}

function runCheck(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8' });
  return { ok: r.status === 0, stdout: r.stdout || '', stderr: r.stderr || '', status: r.status };
}

function verify(filePath) {
  // 1. esbuild parse check
  const esb = runCheck('npx', ['--yes', 'esbuild', '--loader:.ts=ts', '--log-level=error', filePath]);
  if (!esb.ok) {
    return { ok: false, reason: `esbuild failed: ${esb.stderr.trim() || 'non-zero exit'}` };
  }
  // 2. leaks check
  const leaks = runCheck('node', ['scripts/check-blog-leaks.mjs']);
  if (!leaks.ok) {
    return { ok: false, reason: `check-blog-leaks failed: ${(leaks.stdout + leaks.stderr).trim()}` };
  }
  return { ok: true };
}

async function applySwap(filePath, slug, contentFile) {
  if (!existsSync(contentFile)) {
    return { slug, status: 'FAIL', reason: `content file not found: ${contentFile}` };
  }
  const newContent = readFileSync(contentFile, 'utf8');
  const original = readFileSync(filePath, 'utf8');
  const bakPath = filePath + '.bak';
  copyFileSync(filePath, bakPath);

  let next;
  try {
    next = swapContent(original, slug, newContent);
  } catch (e) {
    unlinkSync(bakPath);
    return { slug, status: 'FAIL', reason: e.message };
  }

  writeFileSync(filePath, next, 'utf8');

  const v = verify(filePath);
  if (!v.ok) {
    copyFileSync(bakPath, filePath);
    unlinkSync(bakPath);
    console.error(`${RED}[SAFE-BLOG-EDIT] esbuild/leaks failed after swap on slug=${slug}. File rolled back. Error: ${v.reason}${RESET}`);
    return { slug, status: 'ROLLED_BACK', reason: v.reason };
  }

  unlinkSync(bakPath);
  info(`swap on slug=${slug} verified clean.`);
  return { slug, status: 'OK' };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.file) fail('--file is required');
  const filePath = resolve(args.file);
  if (!existsSync(filePath)) fail(`target file not found: ${filePath}`);

  let manifest;
  if (args.manifest) {
    if (!existsSync(args.manifest)) fail(`manifest not found: ${args.manifest}`);
    manifest = JSON.parse(readFileSync(args.manifest, 'utf8'));
    if (!Array.isArray(manifest)) fail('manifest must be a JSON array');
  } else if (args.slug && args['content-file']) {
    manifest = [{ slug: args.slug, contentFile: args['content-file'] }];
  } else {
    fail('provide either --manifest <file> OR --slug <slug> --content-file <path>');
  }

  let applied = 0, skipped = 0, rolledBack = 0;
  for (const entry of manifest) {
    const r = await applySwap(filePath, entry.slug, entry.contentFile);
    console.log(`${r.slug}: ${r.status}${r.reason ? ' — ' + r.reason : ''}`);
    if (r.status === 'OK') applied++;
    else if (r.status === 'ROLLED_BACK') { rolledBack++; break; }
    else skipped++;
  }

  const summary = `${applied} applied, ${skipped} skipped, ${rolledBack} rolled back`;
  if (rolledBack > 0) {
    console.error(`${RED}[SAFE-BLOG-EDIT] ${summary}${RESET}`);
    process.exit(1);
  }
  console.log(`${GREEN}[SAFE-BLOG-EDIT] ${summary}${RESET}`);
}

main().catch((e) => fail(e.stack || e.message));
