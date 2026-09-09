#!/usr/bin/env node
/**
 * Deploy changed Supabase edge functions.
 *
 * Maps a git name-status diff to function slugs via deployTargetsFromDiff
 * (buildDeployRequiredReport: direct changes + _shared import fan-out).
 * Deploys each slug with the Supabase CLI, continues after individual
 * failures, then exits 1 if any failed.
 *
 * Before deploy, reads applied migrations from the Management API
 * (`GET /v1/projects/{ref}/database/migrations`) — the same endpoint
 * drift-watch uses. That listing includes names. A function is skipped
 * when a newly required migration matches neither an applied version
 * nor an applied name. MCP apply stamps its own ledger version, so name
 * is the durable match. If the Management API call fails, the pinned
 * CLI list is the fallback (JSON, then table). That listing has versions
 * only, so a name match is impossible and migration-dependent functions
 * are skipped. If neither source answers, only functions that require
 * migrations are skipped; functions with an empty requiredMigrations
 * list still deploy. The job fails if anything was skipped.
 *
 * Never applies migrations. Never prints secret values.
 *
 * Usage:
 *   node scripts/deploy-supabase-functions.mjs [function-slug]
 *
 * Env:
 *   DEPLOY_FROM / DEPLOY_TO   git range (defaults: previous SHA → HEAD)
 *   DEPLOY_FUNCTION           optional single slug (workflow_dispatch)
 *   SUPABASE_ACCESS_TOKEN     required by the CLI (workflow gates this)
 *   SUPABASE_PROJECT_REF      optional; otherwise supabase/config.toml project_id
 *   SUPABASE_CLI              optional binary name (default: supabase)
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listAppliedMigrationsFromManagementApi } from './lib/supabase-management-api.mjs';
import {
  SHARED_SLUG,
  appliedRowsHaveNames,
  appliedVersionSet,
  blockedDeployReason,
  deployTargetsFromDiff,
  filesByFunctionSlug,
  isZeroSha,
  parseNameStatusZ,
  requiredMigrationsForSlug,
  toPosix,
} from './lib/supabase-deploy-required.mjs';
import { projectRefFromConfig, resolveProjectRef } from './lib/supabase-project-ref.mjs';

export { projectRefFromConfig, resolveProjectRef };

const ROOT = process.cwd();
const SLUG_RE = /^[A-Za-z][A-Za-z0-9_-]*$/;

export function redactSecrets(message, env = process.env) {
  let text = String(message);
  for (const key of ['SUPABASE_ACCESS_TOKEN', 'SUPABASE_PROJECT_REF', 'GITHUB_TOKEN']) {
    const value = env[key];
    if (typeof value === 'string' && value.length > 0) text = text.split(value).join('[redacted]');
  }
  return text;
}

export function isSafeFunctionSlug(slug) {
  return typeof slug === 'string' && slug.length > 0 && slug !== SHARED_SLUG && SLUG_RE.test(slug);
}

export function resolveForcedSlug(raw, files) {
  const slug = String(raw || '').trim();
  if (!slug) return { ok: false, error: 'function name is empty' };
  if (!isSafeFunctionSlug(slug)) {
    return { ok: false, error: `\`${slug}\` is not a deployable function name` };
  }
  const bySlug = filesByFunctionSlug(files);
  if (!bySlug.has(slug)) {
    return { ok: false, error: `\`${slug}\` is not a function directory under supabase/functions/` };
  }
  return { ok: true, slug };
}

export function parseAppliedVersionsFromMigrationList(raw) {
  const text = String(raw ?? '').trim();
  if (!text) {
    throw new Error('supabase migration list returned empty output');
  }

  const json = tryParseJsonDocument(text);
  if (json.ok) {
    const rows = migrationRowsFromListJson(json.value);
    if (!rows) {
      throw new Error('supabase migration list JSON did not include a migrations array');
    }
    return versionsFromMigrationListRows(rows);
  }

  return versionsFromMigrationListTable(text);
}

function tryParseJsonDocument(text) {
  const start = text.search(/[\[{]/);
  if (start < 0) return { ok: false };
  try {
    return { ok: true, value: JSON.parse(text.slice(start)) };
  } catch {
    return { ok: false };
  }
}

function migrationRowsFromListJson(json) {
  if (Array.isArray(json)) return json;
  if (!json || typeof json !== 'object') return null;
  if (Array.isArray(json.migrations)) return json.migrations;
  if (json.result && Array.isArray(json.result.migrations)) return json.result.migrations;
  if (json.data && typeof json.data === 'object' && Array.isArray(json.data.migrations)) {
    return json.data.migrations;
  }
  if (Array.isArray(json.data)) return json.data;
  return null;
}

function versionsFromMigrationListRows(rows) {
  const applied = [];
  for (const row of rows) {
    if (typeof row === 'string') {
      const trimmed = row.trim();
      if (trimmed) applied.push(trimmed);
      continue;
    }
    if (!row || typeof row !== 'object') continue;
    if (Object.prototype.hasOwnProperty.call(row, 'remote')) {
      const remote = String(row.remote || '')
        .replaceAll('`', '')
        .trim();
      if (!remote) continue;
      const name = typeof row.name === 'string' ? row.name.trim() : '';
      applied.push(name ? { version: remote, name } : remote);
      continue;
    }
    const version = typeof row.version === 'string' ? row.version.trim() : '';
    if (!version) continue;
    const name = typeof row.name === 'string' ? row.name.trim() : '';
    applied.push(name ? { version, name } : version);
  }
  return applied;
}

function splitMigrationListRow(line) {
  return String(line)
    .split(/[│|]/)
    .map((part) => part.trim());
}

function stripMigrationListCell(cell) {
  return String(cell).replaceAll('`', '').trim();
}

function versionsFromMigrationListTable(text) {
  const lines = text.split(/\r?\n/);
  let remoteCol = -1;
  let nameCol = -1;
  let headerIndex = -1;
  for (let i = 0; i < lines.length; i += 1) {
    const cols = splitMigrationListRow(lines[i]);
    const index = cols.findIndex((col) => /^remote$/i.test(stripMigrationListCell(col)));
    if (index >= 0) {
      remoteCol = index;
      nameCol = cols.findIndex((col) => /^name$/i.test(stripMigrationListCell(col)));
      headerIndex = i;
      break;
    }
  }
  if (headerIndex < 0) {
    throw new Error('supabase migration list output was not a recognized table or JSON listing');
  }

  const applied = [];
  for (const line of lines.slice(headerIndex + 1)) {
    if (!line.trim() || /^[\s─\-━┄╌┼┤├┌┐└┘+|]+$/.test(line)) continue;
    const cols = splitMigrationListRow(line);
    if (cols.length <= remoteCol) continue;
    const remote = stripMigrationListCell(cols[remoteCol]);
    if (!/^\d+$/.test(remote)) continue;
    const name = nameCol >= 0 && cols.length > nameCol ? stripMigrationListCell(cols[nameCol]) : '';
    applied.push(name ? { version: remote, name } : remote);
  }
  return applied;
}

export function migrationListOutputFlagAttempts() {
  return [
    ['--output-format', 'json'],
    ['--output', 'json'],
    ['-o', 'json'],
    [],
  ];
}

export function collectExecErrorText(error) {
  const message = error instanceof Error ? error.message : String(error);
  const stderr = error && error.stderr != null ? String(error.stderr) : '';
  const stdout = error && error.stdout != null ? String(error.stdout) : '';
  return [message, stdout, stderr].filter(Boolean).join('\n');
}

export function isUnsupportedMigrationListOutputFlag(error) {
  return /unknown flag|flag provided but not defined|unknown command-line flag|unknown shorthand flag/i.test(
    collectExecErrorText(error),
  );
}

export function readAppliedMigrationsFromCli(runList) {
  if (typeof runList !== 'function') {
    throw new Error('supabase migration list runner is missing');
  }
  let lastUnsupported;
  for (const extra of migrationListOutputFlagAttempts()) {
    try {
      return parseAppliedVersionsFromMigrationList(runList(extra));
    } catch (error) {
      if (extra.length && isUnsupportedMigrationListOutputFlag(error)) {
        lastUnsupported = error;
        continue;
      }
      throw error;
    }
  }
  throw lastUnsupported || new Error('supabase migration list failed');
}

export function deployFunctionSlugs(slugs, { deployOne, skipReason } = {}) {
  const succeeded = [];
  const failed = [];
  for (const slug of slugs) {
    if (!isSafeFunctionSlug(slug)) {
      failed.push({ slug, detail: 'refused: slug is not a deployable function name' });
      continue;
    }
    const blocked = typeof skipReason === 'function' ? skipReason(slug) : null;
    if (blocked) {
      failed.push({ slug, detail: redactSecrets(blocked) });
      continue;
    }
    let result;
    try {
      result = deployOne(slug);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      result = { ok: false, detail };
    }
    const detail = redactSecrets(result?.detail || (result?.ok ? '' : 'deploy failed'));
    if (result?.ok) succeeded.push({ slug, detail });
    else failed.push({ slug, detail });
  }
  return { succeeded, failed };
}

function writeDeployLog(message, log) {
  const line = String(message).endsWith('\n') ? String(message) : `${message}\n`;
  if (typeof log === 'function') {
    log(line);
    return;
  }
  process.stdout.write(line);
}

function appliedRowVersion(row) {
  if (typeof row === 'string') return row.trim();
  if (row && typeof row === 'object') return String(row.version || '').trim();
  return '';
}

export function formatAppliedMigrationsReadLine(appliedRows, source) {
  const versions = (Array.isArray(appliedRows) ? appliedRows : [])
    .map(appliedRowVersion)
    .filter(Boolean);
  const latest = versions.length ? versions.reduce((a, b) => (a > b ? a : b)) : 'none';
  const base = `applied migrations read: ${versions.length} versions (latest ${latest})`;
  if (source === 'management-api') return `${base} via Management API`;
  if (source === 'cli-fallback') return `${base} via CLI fallback`;
  return base;
}

export async function readAppliedMigrationsWithFallback({
  listFromManagementApi,
  listFromCli,
} = {}) {
  if (typeof listFromManagementApi !== 'function') {
    throw new Error('Management API applied-migrations reader is missing');
  }
  try {
    const rows = await listFromManagementApi();
    if (!Array.isArray(rows)) {
      throw new Error('Management API listing was not an array');
    }
    return { rows, source: 'management-api' };
  } catch (managementError) {
    if (typeof listFromCli !== 'function') {
      throw managementError;
    }
    try {
      const rows = await listFromCli();
      if (!Array.isArray(rows)) {
        throw new Error('CLI listing was not an array');
      }
      return { rows, source: 'cli-fallback' };
    } catch (cliError) {
      const managementDetail = managementError instanceof Error ? managementError.message : String(managementError);
      const cliDetail = cliError instanceof Error ? cliError.message : String(cliError);
      throw new Error(
        `could not read applied migrations from Management API (${managementDetail}) or CLI (${cliDetail})`,
      );
    }
  }
}

function appliedSetFromLookup(appliedRows) {
  if (!Array.isArray(appliedRows)) {
    throw new Error('applied versions listing was not an array');
  }
  return appliedVersionSet(appliedRows);
}

function lookupFailureSkipReason(slug, detail, env) {
  return redactSecrets(
    `skipped: could not read applied migrations (${detail}). Required migrations for \`${slug}\` cannot be verified from an unreadable list, so it was not deployed.`,
    env,
  );
}

export async function deployWithMigrationGate({
  functions = [],
  listAppliedVersions,
  listFromManagementApi,
  listFromCli,
  appliedSource,
  deployOne,
  env = process.env,
  log,
} = {}) {
  const targets = functions.map((item) =>
    typeof item === 'string' ? { slug: item, requiredMigrations: [] } : item,
  );

  const deployTargets = (skipReason) =>
    deployFunctionSlugs(
      targets.map((item) => item.slug),
      { deployOne, skipReason },
    );

  const degradeOnUnreadableList = (error) => {
    const detail = error instanceof Error ? error.message : String(error);
    writeDeployLog(redactSecrets(`could not read applied migrations: ${detail}`, env), log);
    return {
      ...deployTargets((slug) => {
        const target = targets.find((item) => item.slug === slug);
        if (!target?.requiredMigrations?.length) return null;
        return lookupFailureSkipReason(slug, detail, env);
      }),
      appliedLookupFailed: true,
      appliedSource: null,
    };
  };

  let appliedRows;
  let source = appliedSource || null;
  try {
    if (typeof listFromManagementApi === 'function') {
      const lookup = await readAppliedMigrationsWithFallback({
        listFromManagementApi,
        listFromCli,
      });
      appliedRows = lookup.rows;
      source = lookup.source;
    } else {
      appliedRows = await listAppliedVersions();
    }
  } catch (error) {
    return degradeOnUnreadableList(error);
  }

  let appliedSet;
  try {
    appliedSet = appliedSetFromLookup(appliedRows);
  } catch (error) {
    return degradeOnUnreadableList(error);
  }

  if (!source) {
    source = appliedRowsHaveNames(appliedRows) ? 'management-api' : null;
  }

  writeDeployLog(redactSecrets(formatAppliedMigrationsReadLine(appliedRows, source), env), log);

  return {
    ...deployTargets((slug) => {
      const target = targets.find((item) => item.slug === slug);
      if (source === 'cli-fallback' && target?.requiredMigrations?.length) {
        return blockedDeployReason(slug, target.requiredMigrations, new Set(), { source });
      }
      return blockedDeployReason(slug, target?.requiredMigrations, appliedSet, { source });
    }),
    appliedLookupFailed: false,
    appliedSource: source,
  };
}

export function formatFunctionsDeployMarkdown({
  from = '',
  to = '',
  forced = '',
  targets = [],
  removed = [],
  migrations = [],
  notes = [],
  succeeded = [],
  failed = [],
  skipped = false,
  skipReason = '',
}) {
  const lines = [
    '## Supabase edge function deploy',
    '',
    forced
      ? `Manual deploy of \`${forced}\`.`
      : `Push range: \`${from || '?'}\` → \`${to || '?'}\``,
    '',
    'This job deploys changed edge functions only. It never runs `supabase db push` or applies migrations.',
    'A function whose newly required migrations are not applied in production is skipped and fails this job.',
    '',
  ];

  if (skipped) {
    lines.push(skipReason || 'Deploy skipped.', '');
    return `${lines.join('\n')}\n`;
  }

  if (targets.length >= 10) {
    lines.push(
      `Large fan-out: **${targets.length}** functions. A widely imported \`_shared/\` file usually causes this. Each function is deployed sequentially.`,
      '',
    );
  }

  lines.push('### Targets', '');
  if (!targets.length) {
    lines.push('None. No edge function in this range needs a deploy.');
  } else {
    for (const target of targets) {
      const why = target.reasons?.length ? target.reasons.join('; ') : 'requested';
      lines.push(`- \`${target.slug}\` — ${why}`);
    }
  }

  if (removed.length) {
    lines.push('', '### Removed on main (not deployed)', '', ...removed.map((slug) => `- \`${slug}\``));
  }

  if (migrations.length) {
    lines.push(
      '',
      '### Migrations in this range (NOT applied)',
      '',
      'Apply these manually after review. This workflow will not do it.',
      '',
      ...migrations.map((filePath) => `- \`${filePath}\``),
    );
  }

  if (notes.length) {
    lines.push('', '### Notes', '', ...notes.map((note) => `- ${note}`));
  }

  lines.push('', '### Result', '');
  if (!targets.length) {
    lines.push('Nothing deployed.');
  } else {
    if (succeeded.length) {
      lines.push(`Succeeded (${succeeded.length}): ${succeeded.map((item) => `\`${item.slug}\``).join(', ')}`);
    } else {
      lines.push('Succeeded (0): none');
    }
    if (failed.length) {
      lines.push(`Failed (${failed.length}):`);
      for (const item of failed) {
        const detail = item.detail ? ` — ${item.detail.split('\n')[0]}` : '';
        lines.push(`- \`${item.slug}\`${detail}`);
      }
    } else {
      lines.push('Failed (0): none');
    }
  }

  lines.push('');
  return `${lines.join('\n')}\n`;
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

function git(args, options = {}) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 20 * 1024 * 1024,
    ...options,
  });
}

function writeSummary(markdown, env = process.env) {
  const text = markdown.endsWith('\n') ? markdown : `${markdown}\n`;
  process.stdout.write(text);
  if (env.GITHUB_STEP_SUMMARY) {
    writeFileSync(env.GITHUB_STEP_SUMMARY, text, { flag: 'a' });
  }
}

function defaultDeployOne(slug, { cli, projectRef, env }) {
  const cliEnv = { ...env };
  if (!String(cliEnv.SUPABASE_PROJECT_REF || '').trim()) {
    delete cliEnv.SUPABASE_PROJECT_REF;
  }
  const output = execFileSync(cli, ['functions', 'deploy', slug, '--project-ref', projectRef, '--yes'], {
    encoding: 'utf8',
    env: cliEnv,
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 10 * 1024 * 1024,
  });
  return { ok: true, detail: output };
}

function resolveGitRange(from, to) {
  const end = to || 'HEAD';
  let start = from;
  if (!start || isZeroSha(start)) {
    start = `${end}^`;
  }
  try {
    git(['cat-file', '-e', `${start}^{commit}`], { stdio: 'ignore' });
    git(['cat-file', '-e', `${end}^{commit}`], { stdio: 'ignore' });
    return { ok: true, from: start, to: end };
  } catch {
    return { ok: false, from: start, to: end };
  }
}

function defaultListAppliedVersions({ cli, projectRef, env }) {
  const cliEnv = { ...env };
  if (!String(cliEnv.SUPABASE_PROJECT_REF || '').trim()) {
    delete cliEnv.SUPABASE_PROJECT_REF;
  }
  return readAppliedMigrationsFromCli((extraArgs) => {
    try {
      return execFileSync(
        cli,
        ['migration', 'list', '--linked', '--project-ref', projectRef, ...extraArgs],
        {
          encoding: 'utf8',
          env: cliEnv,
          stdio: ['ignore', 'pipe', 'pipe'],
          maxBuffer: 10 * 1024 * 1024,
        },
      );
    } catch (error) {
      throw new Error(collectExecErrorText(error));
    }
  });
}

function readRangeTargets(files, from, to) {
  const range = resolveGitRange(from, to);
  if (!range.ok) {
    return { ok: false, range, reason: 'range' };
  }
  try {
    const raw = git([
      'diff',
      '--name-status',
      '--find-renames',
      '-z',
      range.from,
      range.to,
      '--',
      'supabase/functions',
      'supabase/migrations',
    ]);
    return {
      ok: true,
      range,
      targets: deployTargetsFromDiff({
        diffEntries: parseNameStatusZ(raw),
        files,
        from: range.from,
        to: range.to,
      }),
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message.split('\n')[0] : 'git diff failed';
    return { ok: false, range, reason: 'diff', detail };
  }
}

export async function runDeploy({ env = process.env, deployOne, listAppliedVersions } = {}) {
  const files = {
    ...loadTextTree('supabase/functions'),
    ...loadTextTree('supabase/migrations'),
  };
  const forcedRaw = env.DEPLOY_FUNCTION || '';
  const projectRef = resolveProjectRef(env, { root: ROOT });

  if (!projectRef) {
    writeSummary(
      formatFunctionsDeployMarkdown({
        skipped: true,
        skipReason:
          'No project ref: set `SUPABASE_PROJECT_REF` or keep `project_id` in `supabase/config.toml`. Nothing was deployed.',
      }),
      env,
    );
    return 1;
  }

  let targets = { from: '', to: '', functions: [], removed: [], migrations: [], notes: [] };
  const forced = String(forcedRaw || '').trim();

  if (forced) {
    const resolved = resolveForcedSlug(forced, files);
    if (!resolved.ok) {
      writeSummary(
        formatFunctionsDeployMarkdown({
          forced,
          skipped: true,
          skipReason: resolved.error,
        }),
        env,
      );
      return 1;
    }
    const ranged = readRangeTargets(files, env.DEPLOY_FROM || '', env.DEPLOY_TO || 'HEAD');
    const rangeTargets = ranged.ok
      ? ranged.targets
      : { from: '', to: '', functions: [], removed: [], migrations: [], notes: [] };
    const hit = rangeTargets.functions.find((item) => item.slug === resolved.slug);
    const requiredMigrations = hit?.requiredMigrations?.length
      ? hit.requiredMigrations
      : requiredMigrationsForSlug(resolved.slug, files, rangeTargets.migrations || []);
    targets = {
      from: rangeTargets.from || '',
      to: rangeTargets.to || '',
      functions: [{ slug: resolved.slug, reasons: ['workflow_dispatch'], requiredMigrations }],
      removed: [],
      migrations: rangeTargets.migrations || [],
      notes: rangeTargets.notes || [],
    };
  } else {
    const ranged = readRangeTargets(files, env.DEPLOY_FROM || '', env.DEPLOY_TO || 'HEAD');
    if (!ranged.ok) {
      const skipReason =
        ranged.reason === 'diff'
          ? `git diff failed (${redactSecrets(ranged.detail || 'git diff failed', env)}). Nothing was deployed.`
          : `Git range \`${ranged.range.from}\` → \`${ranged.range.to}\` is not in this clone. Nothing was deployed.`;
      writeSummary(
        formatFunctionsDeployMarkdown({
          from: ranged.range.from,
          to: ranged.range.to,
          skipped: true,
          skipReason,
        }),
        env,
      );
      return 0;
    }
    targets = ranged.targets;
  }

  if (!targets.functions.length) {
    writeSummary(
      formatFunctionsDeployMarkdown({
        from: targets.from,
        to: targets.to,
        forced,
        targets: [],
        removed: targets.removed,
        migrations: targets.migrations,
        notes: targets.notes,
      }),
      env,
    );
    return 0;
  }

  const slugs = targets.functions.map((item) => item.slug);
  process.stdout.write(`Deploying ${slugs.length} function${slugs.length === 1 ? '' : 's'}: ${slugs.join(', ')}\n`);

  const cli = env.SUPABASE_CLI || 'supabase';
  const runOne =
    deployOne ||
    ((slug) => {
      process.stdout.write(`Deploying ${slug}…\n`);
      try {
        return defaultDeployOne(slug, { cli, projectRef, env });
      } catch (error) {
        const stderr = error && error.stderr != null ? String(error.stderr) : '';
        const stdout = error && error.stdout != null ? String(error.stdout) : '';
        const message = error instanceof Error ? error.message : String(error);
        return { ok: false, detail: [message, stdout, stderr].filter(Boolean).join('\n') };
      }
    });

  const { succeeded, failed } = await deployWithMigrationGate({
    functions: targets.functions,
    ...(listAppliedVersions
      ? { listAppliedVersions }
      : {
          listFromManagementApi: () =>
            listAppliedMigrationsFromManagementApi({
              token: env.SUPABASE_ACCESS_TOKEN,
              projectRef,
            }),
          listFromCli: () => defaultListAppliedVersions({ cli, projectRef, env }),
        }),
    deployOne: runOne,
    env,
  });
  writeSummary(
    formatFunctionsDeployMarkdown({
      from: targets.from,
      to: targets.to,
      forced,
      targets: targets.functions,
      removed: targets.removed,
      migrations: targets.migrations,
      notes: targets.notes,
      succeeded,
      failed,
    }),
    env,
  );
  return failed.length ? 1 : 0;
}

const invokedDirectly =
  Boolean(process.argv[1]) &&
  realpathSync(fileURLToPath(import.meta.url)) === realpathSync(resolve(process.argv[1]));

if (invokedDirectly) {
  const argvSlug = process.argv[2] || '';
  if (argvSlug && !process.env.DEPLOY_FUNCTION) {
    process.env.DEPLOY_FUNCTION = argvSlug;
  }
  Promise.resolve()
    .then(() => runDeploy())
    .then((code) => {
      process.exit(code);
    })
    .catch((error) => {
      const detail = error instanceof Error ? error.message : String(error);
      writeSummary(
        formatFunctionsDeployMarkdown({
          skipped: true,
          skipReason: `Deploy script crashed: ${redactSecrets(detail)}`,
        }),
      );
      process.exit(1);
    });
}
