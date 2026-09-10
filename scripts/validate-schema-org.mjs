#!/usr/bin/env node
// Remote schema.org errors block; unavailable/unknown remote results are UNVERIFIED.
// The earlier local check-structured-data gate remains independent and unchanged.
// SKIP_SCHEMA_ORG_VALIDATOR=1 is an explicit bypass, never a verification result.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const VALIDATOR_URL = 'https://validator.schema.org/validate';
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

function walkDir(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walkDir(full) : full.endsWith('.html') ? [full] : [];
  }).sort();
}

export function selectFiles(files, changed) {
  const relevant = changed.filter((file) => /\.html$|seo|schema|structured-data|static-prerender/i.test(file));
  if (!relevant.length) return files;
  // Source/template changes cannot reliably be mapped to a single output route.
  const matches = relevant.map((file) => files.filter((output) =>
    output === file || (file.endsWith('.html') && output === `dist/${file}`)));
  if (matches.some((group) => !group.length)) return files;
  return [...new Set(matches.flat())];
}

export function classifyResponse(result) {
  // Retain the existing errors[] envelope only. Do not guess a new upstream API
  // contract or treat missing fields as an empty error list.
  if (!result || typeof result !== 'object' || Array.isArray(result) || !Array.isArray(result.errors)) {
    return { errors: [], warnings: [], unverified: ['unrecognized validator response contract'] };
  }
  const report = { errors: [], warnings: [], unverified: [] };
  for (const issue of result.errors) {
    if (!issue || typeof issue !== 'object' || Array.isArray(issue)) {
      report.unverified.push('unrecognized validator issue');
      continue;
    }
    const severity = String(issue.severity || issue.errorType || '').toLowerCase();
    const message = String(issue.description || issue.errorType || 'validator issue');
    if (severity === 'error') report.errors.push(message);
    else if (severity === 'warning' || severity === 'info') report.warnings.push(message);
    else report.unverified.push('unrecognized validator issue severity');
  }
  return report;
}

export async function validateBlock(jsonLd, { fetchImpl = fetch, timeoutMs = 10000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(VALIDATOR_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({ code: jsonLd }).toString(),
      signal: controller.signal,
    });
    if (!response.ok) return { errors: [], warnings: [], unverified: [`validator HTTP ${response.status}`] };
    const text = await response.text();
    try {
      return classifyResponse(JSON.parse(text.replace(/^\)\]\}'\r?\n?/, '')));
    } catch {
      return { errors: [], warnings: [], unverified: ['validator returned non-JSON response'] };
    }
  } catch {
    return { errors: [], warnings: [], unverified: [controller.signal.aborted ? 'validator timeout' : 'validator network failure'] };
  } finally {
    clearTimeout(timer);
  }
}

export async function runValidator({
  env = process.env,
  dist = 'dist',
  fetchImpl = fetch,
  timeoutMs = 10000,
  throttleMs = 350,
  logger = console,
  readChanged = () => execFileSync('git', ['diff', '--name-only', 'origin/main...HEAD'], { encoding: 'utf8' }).split('\n').filter(Boolean),
} = {}) {
  if (env.SKIP_SCHEMA_ORG_VALIDATOR === '1') {
    logger.warn('[validate-schema-org] SKIPPED: SKIP_SCHEMA_ORG_VALIDATOR=1; remote validation not performed.');
    return { exitCode: 0, status: 'SKIPPED' };
  }
  const maxFiles = Number(env.SCHEMA_VALIDATOR_MAX_FILES || 80);
  let files = walkDir(dist);
  if (!files.length || !Number.isInteger(maxFiles) || maxFiles < 1) {
    logger.error('[validate-schema-org] LOCAL_COVERAGE_FAILURE: missing HTML output or invalid sampling cap.');
    return { exitCode: 1, status: 'LOCAL_COVERAGE_FAILURE' };
  }
  const onCI = env.CI === '1' || env.CI === 'true' || env.VERCEL === '1';
  if (!onCI && env.LOCAL_DIFF === '1') {
    try { files = selectFiles(files, readChanged()); } catch { /* Full output scan if Git is unavailable. */ }
  }
  const availableFiles = files.length;
  if (files.length > maxFiles) {
    logger.warn(`[validate-schema-org] sampling ${maxFiles} of ${files.length} HTML files.`);
    const step = Math.max(1, Math.floor(files.length / maxFiles));
    files = files.filter((_, index) => index % step === 0).slice(0, maxFiles);
  }
  const errors = [], warnings = [], unverified = [];
  let blocksChecked = 0;
  for (const file of files) {
    const blocks = [...readFileSync(file, 'utf8').matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    for (const [index, block] of blocks.entries()) {
      blocksChecked++;
      const result = await validateBlock(block[1].trim(), { fetchImpl, timeoutMs });
      for (const [target, values] of [[errors, result.errors], [warnings, result.warnings], [unverified, result.unverified]]) {
        values.forEach((value) => target.push(`${file} block[${index}]: ${value}`));
      }
      if (throttleMs) await sleep(throttleMs);
    }
  }
  if (!blocksChecked) unverified.push('no JSON-LD blocks found in selected HTML; remote validation not performed');
  warnings.forEach((message) => logger.warn(`[validate-schema-org] WARNING: ${message}`));
  unverified.forEach((message) => logger.warn(`[validate-schema-org] UNVERIFIED: ${message}`));
  errors.forEach((message) => logger.error(`[validate-schema-org] ERROR: ${message}`));
  const status = errors.length ? 'ERROR' : unverified.length ? 'UNVERIFIED' : 'NO_REPORTED_ERRORS';
  logger.log(`[validate-schema-org] ${status}: ${blocksChecked} block(s), ${files.length}/${availableFiles} selected HTML file(s); ${errors.length} error(s), ${warnings.length} warning(s), ${unverified.length} unverified result(s).`);
  if (errors.length) logger.error('[validate-schema-org] Build blocked by reported schema.org errors.');
  return { exitCode: errors.length ? 1 : 0, status, blocksChecked, errors, warnings, unverified };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.exitCode = (await runValidator()).exitCode;
}
