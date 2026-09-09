#!/usr/bin/env node
/**
 * Scheduled comparison of main vs deployed Supabase functions/migrations.
 *
 * Uses SUPABASE_ACCESS_TOKEN when that secret is set. Project ref is
 * SUPABASE_PROJECT_REF when set, otherwise supabase/config.toml project_id
 * (same resolution as deploy-supabase-functions.mjs).
 * If the access token is missing, prints a notice and exits 0. Never fails
 * the build.
 *
 * Drift is written to $GITHUB_STEP_SUMMARY. When GITHUB_TOKEN can write
 * issues, a single issue titled "Supabase deploy drift" is opened or updated
 * (not a new issue per run).
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import {
  buildDriftReport,
  filesByFunctionSlug,
  formatDriftMarkdown,
  formatSecretsMissingNotice,
  parseUpdatedAt,
  secretsConfigured,
  sourceFilesForFunction,
  toPosix,
} from './lib/supabase-deploy-required.mjs';
import { resolveProjectRef } from './lib/supabase-project-ref.mjs';

const ROOT = process.cwd();
const MANAGEMENT_API = 'https://api.supabase.com/v1';
const ISSUE_TITLE = 'Supabase deploy drift';
const ISSUE_MARKER = '<!-- supabase-drift-watch -->';
const TIMEOUT_MS = Number(process.env.SUPABASE_DRIFT_TIMEOUT_MS || 20_000);

function git(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 20 * 1024 * 1024,
  }).trim();
}

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue;
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

function loadTextTree(relDir) {
  const files = {};
  const abs = join(ROOT, relDir);
  for (const full of walk(abs)) {
    const rel = toPosix(relative(ROOT, full));
    try {
      files[rel] = readFileSync(full, 'utf8');
    } catch {
      // skip non-utf8
    }
  }
  return files;
}

function writeSummary(markdown) {
  const text = markdown.endsWith('\n') ? markdown : `${markdown}\n`;
  process.stdout.write(text);
  if (process.env.GITHUB_STEP_SUMMARY) {
    writeFileSync(process.env.GITHUB_STEP_SUMMARY, text, { flag: 'a' });
  }
}

async function fetchJson(url, headers) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { headers, signal: controller.signal });
    const text = await response.text();
    if (!response.ok) {
      return { ok: false, status: response.status, data: null };
    }
    let data = null;
    try {
      data = JSON.parse(text);
    } catch {
      return { ok: false, status: response.status, data: null };
    }
    return { ok: true, status: response.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  } finally {
    clearTimeout(timer);
  }
}

function pickFunctionRows(data) {
  const rows = Array.isArray(data) ? data : Array.isArray(data?.functions) ? data.functions : null;
  if (!rows) return null;
  const out = [];
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const slug = typeof row.slug === 'string' && row.slug ? row.slug : typeof row.name === 'string' ? row.name : null;
    if (!slug) continue;
    out.push({
      slug,
      version: row.version ?? null,
      updated_at: row.updated_at ?? row.updatedAt ?? null,
    });
  }
  return out;
}

function pickMigrationRows(data) {
  const rows = Array.isArray(data) ? data : Array.isArray(data?.migrations) ? data.migrations : null;
  if (!rows) return null;
  const out = [];
  for (const row of rows) {
    if (typeof row === 'string' && row) {
      out.push(row);
      continue;
    }
    if (row && typeof row === 'object' && typeof row.version === 'string' && row.version) {
      out.push({ version: row.version, name: typeof row.name === 'string' ? row.name : undefined });
    }
  }
  return out;
}

function latestCommitAt(paths) {
  const existing = paths.filter((filePath) => existsSync(join(ROOT, filePath)));
  if (!existing.length) return null;
  try {
    const iso = git(['log', '-1', '--format=%cI', '--', ...existing]);
    return iso || null;
  } catch {
    return null;
  }
}

function commitsBehindSince(updatedAt, paths) {
  const deployedMs = parseUpdatedAt(updatedAt);
  if (!Number.isFinite(deployedMs)) return null;
  const existing = paths.filter((filePath) => existsSync(join(ROOT, filePath)));
  if (!existing.length) return null;
  try {
    const iso = new Date(deployedMs).toISOString();
    const raw = git(['rev-list', '--count', `--since=${iso}`, 'HEAD', '--', ...existing]);
    const count = Number.parseInt(raw, 10);
    return Number.isFinite(count) ? count : null;
  } catch {
    return null;
  }
}

function redactSecrets(message) {
  let text = String(message);
  for (const key of ['SUPABASE_ACCESS_TOKEN', 'SUPABASE_PROJECT_REF', 'GITHUB_TOKEN']) {
    const value = process.env[key];
    if (typeof value === 'string' && value.length > 0) text = text.split(value).join('[redacted]');
  }
  return text;
}

function issueMatch(item) {
  return item && item.title === ISSUE_TITLE && item.pull_request == null && typeof item.number === 'number';
}

async function findDriftIssue(api, headers, repo) {
  const searchUrl = `${api}/search/issues?q=${encodeURIComponent(`repo:${repo} is:issue in:title "${ISSUE_TITLE}"`)}&per_page=5&sort=updated`;
  const found = await fetchJson(searchUrl, headers);
  if (found.ok && found.data && Array.isArray(found.data.items)) {
    const match = found.data.items.find(issueMatch);
    if (match) return { number: match.number, state: match.state };
  }
  const listed = await fetchJson(`${api}/repos/${repo}/issues?state=all&per_page=100`, headers);
  if (listed.ok && Array.isArray(listed.data)) {
    const match = listed.data.find(issueMatch);
    if (match) return { number: match.number, state: match.state };
  }
  return { number: null, state: null };
}

async function patchIssue(api, headers, repo, number, payload) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${api}/repos/${repo}/issues/${number}`, {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify(payload),
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function upsertIssue(markdown, hasDrift) {
  const repo = process.env.GITHUB_REPOSITORY;
  const token = process.env.GITHUB_TOKEN;
  if (!repo || !token) return 'summary-only (GITHUB_TOKEN or GITHUB_REPOSITORY missing)';

  const headers = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'supabase-drift-watch',
  };
  const api = (process.env.GITHUB_API_URL || 'https://api.github.com').replace(/\/$/, '');
  const found = await findDriftIssue(api, headers, repo);
  const issueNumber = found.number;
  const issueState = found.state;

  const body = `${ISSUE_MARKER}\n${markdown}\n`;

  if (!hasDrift) {
    if (issueNumber && issueState === 'open') {
      const closed = await patchIssue(api, headers, repo, issueNumber, {
        state: 'closed',
        body: `${ISSUE_MARKER}\nNo drift against main as of ${new Date().toISOString()}. Closing.\n`,
      });
      return closed ? `closed issue #${issueNumber}` : 'summary-only (could not close issue)';
    }
    return issueNumber ? `issue #${issueNumber} already closed` : 'summary-only (no open drift issue)';
  }

  if (issueNumber) {
    const updated = await patchIssue(api, headers, repo, issueNumber, { title: ISSUE_TITLE, state: 'open', body });
    return updated ? `updated issue #${issueNumber}` : 'summary-only (could not update issue)';
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${api}/repos/${repo}/issues`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({ title: ISSUE_TITLE, body }),
    });
    if (!response.ok) return 'summary-only (could not open issue)';
    let number = null;
    try {
      const created = JSON.parse(await response.text());
      number = typeof created.number === 'number' ? created.number : null;
    } catch {
      number = null;
    }
    return number ? `opened issue #${number}` : 'opened issue';
  } catch {
    return 'summary-only (issue API failed)';
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  if (!secretsConfigured(process.env)) {
    writeSummary(`${formatSecretsMissingNotice()}\nIssue handling: skipped (secrets not configured).\n`);
    return;
  }

  const token = String(process.env.SUPABASE_ACCESS_TOKEN).trim();
  const ref = resolveProjectRef(process.env, { root: ROOT });
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'User-Agent': 'supabase-drift-watch',
  };

  const functionsRes = await fetchJson(`${MANAGEMENT_API}/projects/${encodeURIComponent(ref)}/functions`, headers);
  const migrationsRes = await fetchJson(
    `${MANAGEMENT_API}/projects/${encodeURIComponent(ref)}/database/migrations`,
    headers,
  );

  if (!functionsRes.ok || !migrationsRes.ok) {
    const functionStatus = functionsRes.status || 'network-error';
    const migrationStatus = migrationsRes.status || 'network-error';
    writeSummary(
      [
        '## Supabase drift watch',
        '',
        'Management API request failed. No function slugs, versions, or migration versions were compared.',
        '',
        `- functions endpoint HTTP ${functionStatus}`,
        `- migrations endpoint HTTP ${migrationStatus}`,
        '',
        'This job does not fail the build. Check that `SUPABASE_ACCESS_TOKEN` can read the project.',
        '',
      ].join('\n'),
    );
    return;
  }

  const deployedFunctions = pickFunctionRows(functionsRes.data);
  const appliedVersions = pickMigrationRows(migrationsRes.data);
  if (!deployedFunctions || !appliedVersions) {
    writeSummary(
      [
        '## Supabase drift watch',
        '',
        'Management API returned an unexpected shape. Response bodies were not printed.',
        '',
        'This job does not fail the build.',
        '',
      ].join('\n'),
    );
    return;
  }

  const functionFiles = loadTextTree('supabase/functions');
  const bySlug = filesByFunctionSlug(functionFiles);
  const localFunctions = [...bySlug.keys()].sort().map((slug) => ({
    slug,
    latestCommitAt: latestCommitAt(sourceFilesForFunction(slug, functionFiles)),
  }));

  const localMigrations = walk(join(ROOT, 'supabase/migrations'))
    .map((full) => toPosix(relative(ROOT, full)))
    .filter((filePath) => filePath.endsWith('.sql'))
    .sort();

  const report = buildDriftReport({
    localFunctions,
    deployedFunctions,
    localMigrations,
    appliedVersions,
  });
  for (const fn of report.staleFunctions) {
    if (fn.status !== 'stale' || fn.deployedUpdatedAt == null) continue;
    fn.commitsBehind = commitsBehindSince(fn.deployedUpdatedAt, sourceFilesForFunction(fn.slug, functionFiles));
  }
  const markdown = formatDriftMarkdown(report);
  let issueAction = 'summary-only';
  try {
    issueAction = await upsertIssue(markdown, !report.empty);
  } catch {
    issueAction = 'summary-only (issue upsert failed)';
  }

  writeSummary(`${markdown}\nIssue handling: ${issueAction}. One issue is reused; this job does not open a new issue per run.\n`);
}

try {
  await main();
} catch (error) {
  const detail = error instanceof Error ? error.message : String(error);
  writeSummary(
    [
      '## Supabase drift watch',
      '',
      `Report crashed: ${redactSecrets(detail)}`,
      '',
      'This job only reports and will not fail the build.',
      '',
    ].join('\n'),
  );
}

process.exit(0);
