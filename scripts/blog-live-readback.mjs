#!/usr/bin/env node
/**
 * Production Markdown readback.
 *
 * Fetches cache-busted Markdown surfaces from the live site and independently
 * verifies the semantic corrections tracked in the 2026-08-09 punchlist.
 * Writes reports/blog-live-readback.json and exits non-zero on any FAIL.
 *
 * Usage:
 *   node scripts/blog-live-readback.mjs
 *   node scripts/blog-live-readback.mjs --fixtures <dir>   # offline, reads <dir>/<slug>.md
 *   BLOG_READBACK_BASE_URL=https://example.com node scripts/blog-live-readback.mjs
 */

import { mkdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { evaluateReadback, READBACK_ROUTES } from './lib/blog-live-readback.mjs';

const BASE_URL = (process.env.BLOG_READBACK_BASE_URL || 'https://www.mercuryrepower.ca').replace(/\/$/, '');
const USER_AGENT = 'HBW-blog-live-readback/1.0 (+https://www.mercuryrepower.ca)';
const TIMEOUT_MS = Number(process.env.BLOG_READBACK_TIMEOUT_MS || 20_000);
const REPORT_PATH = 'reports/blog-live-readback.json';

const fixturesFlagIndex = process.argv.indexOf('--fixtures');
const fixturesDir = fixturesFlagIndex >= 0 ? process.argv[fixturesFlagIndex + 1] : null;

const fixtureName = (route) => `${route.replace(/^\//, '').replace(/\//g, '__')}`;

async function fetchDoc(route) {
  const url = `${BASE_URL}${route}?cb=${Date.now()}`;
  if (fixturesDir) {
    const file = join(fixturesDir, fixtureName(route));
    if (!existsSync(file)) return { path: route, url, ok: false, status: 404, error: 'fixture missing' };
    return {
      path: route,
      url,
      ok: true,
      status: 200,
      contentType: 'text/markdown; charset=utf-8',
      redirected: false,
      finalUrl: url,
      body: readFileSync(file, 'utf8'),
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': USER_AGENT, accept: 'text/markdown, text/plain;q=0.9, */*;q=0.1', 'cache-control': 'no-cache' },
    });
    const body = await response.text();
    return {
      path: route,
      url,
      ok: response.ok,
      status: response.status,
      contentType: response.headers.get('content-type') || '',
      redirected: response.redirected && new URL(response.url).pathname !== route,
      finalUrl: response.url,
      body,
    };
  } catch (error) {
    return {
      path: route,
      url,
      ok: false,
      status: null,
      error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
    };
  } finally {
    clearTimeout(timer);
  }
}

const entries = await Promise.all(READBACK_ROUTES.map(fetchDoc));
const docs = Object.fromEntries(entries.map((doc) => [doc.path, doc]));
const { ok, checks } = evaluateReadback(docs);

const report = {
  ok,
  evaluatedAt: new Date().toISOString(),
  baseUrl: BASE_URL,
  mode: fixturesDir ? 'fixtures' : 'live',
  userAgent: USER_AGENT,
  timeoutMs: TIMEOUT_MS,
  routes: READBACK_ROUTES,
  failCount: checks.filter((check) => check.status === 'FAIL').length,
  checks,
};

mkdirSync('reports', { recursive: true });
writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

const summaryLines = [
  '## Production Markdown readback',
  '',
  `Base: \`${BASE_URL}\` · mode: ${report.mode} · ${report.failCount} failing check(s)`,
  '',
  '| Status | Check | Route | Detail |',
  '| --- | --- | --- | --- |',
  ...checks.map(
    (check) => `| ${check.status === 'PASS' ? '✅ PASS' : '❌ FAIL'} | ${check.id} | \`${check.route || '-'}\` | ${check.detail} |`,
  ),
];
if (process.env.GITHUB_STEP_SUMMARY) {
  writeFileSync(process.env.GITHUB_STEP_SUMMARY, `${summaryLines.join('\n')}\n`, { flag: 'a' });
}

console.log(`Live readback: ${ok ? 'PASS' : 'FAIL'} (${checks.length} checks, ${report.failCount} failures, report ${REPORT_PATH})`);
for (const check of checks) {
  if (check.status === 'FAIL') console.error(`- FAIL ${check.id} ${check.route || ''}: ${check.detail}`);
}

if (!ok) process.exit(1);
