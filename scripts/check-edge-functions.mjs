import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const RUNTIME_CONFIG_PATH = 'supabase/functions/deno.json';
const CHECK_CONFIG_PATH = 'supabase/functions/deno.check.json';
const LOCK_PATH = 'supabase/functions/deno.lock';
const FUNCTIONS_ROOT = 'supabase/functions';

const args = process.argv.slice(2);
const flags = new Set();
const entryPoints = [];

for (const arg of args) {
  if (arg.startsWith('--')) {
    flags.add(arg);
    continue;
  }
  entryPoints.push(arg);
}

const knownFlags = new Set(['--check-lock-only', '--all']);
for (const flag of flags) {
  if (!knownFlags.has(flag)) {
    console.error(`Unknown Edge checker flag: ${flag}`);
    process.exit(2);
  }
}

const lockOnly = flags.has('--check-lock-only');
const checkAll = flags.has('--all');

if (lockOnly && (checkAll || entryPoints.length > 0)) {
  console.error('Use --check-lock-only by itself.');
  process.exit(2);
}

if (checkAll && entryPoints.length > 0) {
  console.error('Pass either --all or explicit Edge entry points, not both.');
  process.exit(2);
}

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    console.error(`Unable to read ${label}: ${path}`);
    process.exit(2);
  }
}

function collectQuotedSpecifiers(directory, prefix) {
  const specifiers = new Set();
  const importPattern = new RegExp(
    String.raw`\b(?:from\s+|import\s*\(\s*|import\s+)(["'])(${prefix}[^"']+)\1`,
    'g',
  );

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      for (const specifier of collectQuotedSpecifiers(path, prefix)) specifiers.add(specifier);
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith('.ts')) continue;

    const source = readFileSync(path, 'utf8');
    for (const match of source.matchAll(importPattern)) specifiers.add(match[2]);
  }

  return specifiers;
}

function collectDirectNpmImports(directory) {
  return collectQuotedSpecifiers(directory, 'npm:');
}

function collectHttpsImports(directory) {
  return collectQuotedSpecifiers(directory, 'https:');
}

function collectImportMapNpmSpecifiers(config) {
  return new Set(
    Object.values(config.imports ?? {}).filter(
      (specifier) => typeof specifier === 'string' && specifier.startsWith('npm:'),
    ),
  );
}

function validateNpmSpecifierLocked(specifier, lock) {
  const lockSpecifier = lock.specifiers?.[specifier]
    ? specifier
    : lock.specifiers?.[`${specifier}@*`]
      ? `${specifier}@*`
      : null;
  const packageAndVersion = lockSpecifier?.slice('npm:'.length) ?? '';
  const versionSeparator = packageAndVersion.lastIndexOf('@');
  const packageName = packageAndVersion.slice(0, versionSeparator);
  const resolvedVersion = lockSpecifier ? lock.specifiers[lockSpecifier] : null;
  const lockEntry =
    versionSeparator > 0 && typeof resolvedVersion === 'string'
      ? `${packageName}@${resolvedVersion}`
      : null;

  if (!lockEntry || !lock.npm?.[lockEntry]) {
    console.error(`Edge lockfile is incomplete for configured or direct import: ${specifier}`);
    process.exit(2);
  }
}

function isOfflineTypecheckTarget(target) {
  return (
    target.startsWith('npm:') ||
    target.startsWith('./') ||
    target.startsWith('../')
  );
}

function validateTypecheckRemaps(checkConfig) {
  const remaps = checkConfig.imports ?? {};
  const httpsImports = [...collectHttpsImports(FUNCTIONS_ROOT)].sort();
  const missing = httpsImports.filter((specifier) => remaps[specifier] == null);
  if (missing.length > 0) {
    console.error(
      'Unmapped remote Edge import(s). Typecheck would fetch the network; add a remap to supabase/functions/deno.check.json:',
    );
    for (const specifier of missing) console.error(`  ${specifier}`);
    process.exit(2);
  }

  for (const specifier of httpsImports) {
    const target = remaps[specifier];
    if (typeof target !== 'string' || !isOfflineTypecheckTarget(target)) {
      console.error(
        `Typecheck remap still points at the network: ${specifier} -> ${target}`,
      );
      process.exit(2);
    }
  }
}

function validateConfiguredNpmLocks() {
  const runtimeConfig = readJson(RUNTIME_CONFIG_PATH, 'Edge Deno config');
  const checkConfig = readJson(CHECK_CONFIG_PATH, 'Edge typecheck Deno config');
  const lock = readJson(LOCK_PATH, 'Edge Deno lockfile');

  validateTypecheckRemaps(checkConfig);

  const npmSpecifiers = collectImportMapNpmSpecifiers(runtimeConfig);
  for (const specifier of collectImportMapNpmSpecifiers(checkConfig)) {
    npmSpecifiers.add(specifier);
  }
  for (const specifier of collectDirectNpmImports(FUNCTIONS_ROOT)) {
    npmSpecifiers.add(specifier);
  }
  for (const specifier of npmSpecifiers) validateNpmSpecifierLocked(specifier, lock);
}

function collectAllEntryPoints() {
  const functionsRoot = resolve(FUNCTIONS_ROOT);
  const entries = [];
  const missingIndex = [];

  for (const entry of readdirSync(functionsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
    const indexPath = join(FUNCTIONS_ROOT, entry.name, 'index.ts');
    if (existsSync(indexPath)) {
      entries.push(indexPath);
      continue;
    }
    missingIndex.push(entry.name);
  }

  if (missingIndex.length > 0) {
    console.error('Edge function directories without index.ts (refusing to skip):');
    for (const name of missingIndex.sort()) console.error(`  ${name}`);
    process.exit(2);
  }

  if (entries.length === 0) {
    console.error('No Edge function entry points found under supabase/functions/*/index.ts');
    process.exit(2);
  }

  return entries.sort();
}

if (!lockOnly && !checkAll && entryPoints.length === 0) {
  console.error(
    'Pass every changed Edge entry point, for example: npm run typecheck:edge -- supabase/functions/send-sms/index.ts',
  );
  process.exit(2);
}

const functionsRoot = resolve(FUNCTIONS_ROOT);
const resolvedEntryPoints = lockOnly ? [] : checkAll ? collectAllEntryPoints() : entryPoints;

for (const entryPoint of resolvedEntryPoints) {
  const absolutePath = resolve(entryPoint);
  const relativePath = relative(functionsRoot, absolutePath);
  const isInsideFunctions =
    relativePath !== '' && relativePath !== '..' && !relativePath.startsWith(`..${sep}`);

  if (!isInsideFunctions || !absolutePath.endsWith('.ts') || !existsSync(absolutePath)) {
    console.error(`Invalid Edge TypeScript path: ${entryPoint}`);
    process.exit(2);
  }
}

validateConfiguredNpmLocks();

if (lockOnly) process.exit(0);

const denoArgs = [
  '--yes',
  'deno@2.9.5',
  'check',
  '--config',
  RUNTIME_CONFIG_PATH,
  '--import-map',
  CHECK_CONFIG_PATH,
  '--node-modules-dir=none',
  `--lock=${LOCK_PATH}`,
  '--frozen',
  '--no-remote',
];
denoArgs.push(...resolvedEntryPoints);

const result = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', denoArgs, {
  stdio: 'inherit',
});

if (result.error) {
  console.error(`Unable to run the pinned Deno checker: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
