#!/usr/bin/env node
/**
 * Deploy changed Supabase edge functions.
 *
 * Maps a git name-status diff to function slugs via deployTargetsFromDiff
 * (buildDeployRequiredReport: direct changes + _shared import fan-out).
 * Deploys each slug with the Supabase CLI, continues after individual
 * failures, then exits 1 if any failed.
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
import {
  SHARED_SLUG,
  deployTargetsFromDiff,
  filesByFunctionSlug,
  isZeroSha,
  parseNameStatusZ,
  toPosix,
} from './lib/supabase-deploy-required.mjs';

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

export function projectRefFromConfig(toml) {
  const match = String(toml).match(/^\s*project_id\s*=\s*"([^"]+)"/m);
  return match ? match[1].trim() : '';
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

export function deployFunctionSlugs(slugs, { deployOne }) {
  const succeeded = [];
  const failed = [];
  for (const slug of slugs) {
    if (!isSafeFunctionSlug(slug)) {
      failed.push({ slug, detail: 'refused: slug is not a deployable function name' });
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

function resolveProjectRef(env = process.env) {
  const fromEnv = typeof env.SUPABASE_PROJECT_REF === 'string' ? env.SUPABASE_PROJECT_REF.trim() : '';
  if (fromEnv) return fromEnv;
  const configPath = join(ROOT, 'supabase/config.toml');
  if (!existsSync(configPath)) return '';
  try {
    return projectRefFromConfig(readFileSync(configPath, 'utf8'));
  } catch {
    return '';
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

export function runDeploy({ env = process.env, deployOne } = {}) {
  const files = {
    ...loadTextTree('supabase/functions'),
    ...loadTextTree('supabase/migrations'),
  };
  const forcedRaw = env.DEPLOY_FUNCTION || '';
  const projectRef = resolveProjectRef(env);

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
    targets = {
      from: '',
      to: '',
      functions: [{ slug: resolved.slug, reasons: ['workflow_dispatch'] }],
      removed: [],
      migrations: [],
      notes: [],
    };
  } else {
    const range = resolveGitRange(env.DEPLOY_FROM || '', env.DEPLOY_TO || 'HEAD');
    if (!range.ok) {
      writeSummary(
        formatFunctionsDeployMarkdown({
          from: range.from,
          to: range.to,
          skipped: true,
          skipReason: `Git range \`${range.from}\` → \`${range.to}\` is not in this clone. Nothing was deployed.`,
        }),
        env,
      );
      return 0;
    }

    let raw = '';
    try {
      raw = git([
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
    } catch (error) {
      const detail = error instanceof Error ? error.message.split('\n')[0] : 'git diff failed';
      writeSummary(
        formatFunctionsDeployMarkdown({
          from: range.from,
          to: range.to,
          skipped: true,
          skipReason: `git diff failed (${redactSecrets(detail, env)}). Nothing was deployed.`,
        }),
        env,
      );
      return 0;
    }

    targets = deployTargetsFromDiff({
      diffEntries: parseNameStatusZ(raw),
      files,
      from: range.from,
      to: range.to,
    });
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

  const { succeeded, failed } = deployFunctionSlugs(slugs, { deployOne: runOne });
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
