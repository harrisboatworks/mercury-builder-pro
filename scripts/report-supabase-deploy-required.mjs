#!/usr/bin/env node
/**
 * Push-range report of undeployed Supabase edge functions and added migrations.
 *
 * Git-derived only. No credentials, no Management API, never exits non-zero.
 *
 * Usage:
 *   node scripts/report-supabase-deploy-required.mjs [from] [to]
 *
 * Env:
 *   DEPLOY_REQUIRED_FROM  previous SHA (github.event.before)
 *   DEPLOY_REQUIRED_TO    current SHA (github.sha)
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import {
  buildDeployRequiredReport,
  formatDeployRequiredMarkdown,
  isZeroSha,
  parseNameStatusZ,
  toPosix,
} from './lib/supabase-deploy-required.mjs';

const ROOT = process.cwd();

function git(args, options = {}) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 20 * 1024 * 1024,
    ...options,
  });
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
  process.stdout.write(markdown.endsWith('\n') ? markdown : `${markdown}\n`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    writeFileSync(process.env.GITHUB_STEP_SUMMARY, markdown.endsWith('\n') ? markdown : `${markdown}\n`, {
      flag: 'a',
    });
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

function failOpen(message) {
  const markdown = [
    '## Supabase deploy-required report',
    '',
    redactSecrets(message),
    '',
    'This job only reports and will not fail the build.',
    '',
  ].join('\n');
  writeSummary(markdown);
}

function main() {
  const from = process.argv[2] || process.env.DEPLOY_REQUIRED_FROM || '';
  const to = process.argv[3] || process.env.DEPLOY_REQUIRED_TO || 'HEAD';

  if (isZeroSha(from)) {
    failOpen('Previous SHA is missing or all zeros (initial push / shallow history). Push-range report skipped.');
    return;
  }

  try {
    git(['cat-file', '-e', `${from}^{commit}`], { stdio: 'ignore' });
  } catch {
    failOpen(`Previous SHA \`${from}\` is not in this clone. Push-range report skipped.`);
    return;
  }

  let raw = '';
  try {
    raw = git([
      'diff',
      '--name-status',
      '--find-renames',
      '-z',
      from,
      to,
      '--',
      'supabase/functions',
      'supabase/migrations',
    ]);
  } catch (error) {
    const detail = error instanceof Error ? error.message.split('\n')[0] : 'git diff failed';
    failOpen(`git diff failed (${detail}). Push-range report skipped.`);
    return;
  }

  const diffEntries = parseNameStatusZ(raw);
  const files = {
    ...loadTextTree('supabase/functions'),
    ...loadTextTree('supabase/migrations'),
  };

  const report = buildDeployRequiredReport({ diffEntries, files, from, to });
  writeSummary(formatDeployRequiredMarkdown(report));
}

try {
  main();
} catch (error) {
  const detail = error instanceof Error ? error.message : String(error);
  failOpen(`Report crashed: ${redactSecrets(detail)}`);
}

process.exit(0);
