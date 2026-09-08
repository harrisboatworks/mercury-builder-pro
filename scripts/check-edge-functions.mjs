import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const entryPoints = process.argv.slice(2);
const lockOnly = entryPoints.length === 1 && entryPoints[0] === '--check-lock-only';

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    console.error(`Unable to read ${label}: ${path}`);
    process.exit(2);
  }
}

function collectDirectNpmImports(directory) {
  const specifiers = new Set();

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      for (const specifier of collectDirectNpmImports(path)) specifiers.add(specifier);
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith('.ts')) continue;

    const source = readFileSync(path, 'utf8');
    const importPattern = /\b(?:from\s+|import\s*\(\s*|import\s+)(["'])(npm:[^"']+)\1/g;
    for (const match of source.matchAll(importPattern)) specifiers.add(match[2]);
  }

  return specifiers;
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

function validateConfiguredNpmLocks() {
  const configPath = 'supabase/functions/deno.json';
  const lockPath = 'supabase/functions/deno.lock';
  const config = readJson(configPath, 'Edge Deno config');
  const lock = readJson(lockPath, 'Edge Deno lockfile');

  const npmSpecifiers = new Set(
    Object.values(config.imports ?? {}).filter(
      (specifier) => typeof specifier === 'string' && specifier.startsWith('npm:'),
    ),
  );
  for (const specifier of collectDirectNpmImports('supabase/functions')) {
    npmSpecifiers.add(specifier);
  }
  for (const specifier of npmSpecifiers) validateNpmSpecifierLocked(specifier, lock);
}

if (!lockOnly && entryPoints.length === 0) {
  console.error(
    'Pass every changed Edge entry point, for example: npm run typecheck:edge -- supabase/functions/send-sms/index.ts',
  );
  process.exit(2);
}

const functionsRoot = resolve('supabase/functions');

for (const entryPoint of lockOnly ? [] : entryPoints) {
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

const result = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  [
    '--yes',
    'deno@2.9.5',
    'check',
    '--config',
    'supabase/functions/deno.json',
    '--node-modules-dir=none',
    '--lock=supabase/functions/deno.lock',
    '--frozen',
    ...entryPoints,
  ],
  { stdio: 'inherit' },
);

if (result.error) {
  console.error(`Unable to run the pinned Deno checker: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
