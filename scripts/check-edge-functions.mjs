import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';

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

function validateConfiguredNpmLocks() {
  const configPath = 'supabase/functions/deno.json';
  const lockPath = 'supabase/functions/deno.lock';
  const config = readJson(configPath, 'Edge Deno config');
  const lock = readJson(lockPath, 'Edge Deno lockfile');

  for (const specifier of Object.values(config.imports ?? {})) {
    if (typeof specifier !== 'string' || !specifier.startsWith('npm:')) continue;

    const packageAndVersion = specifier.slice('npm:'.length);
    const versionSeparator = packageAndVersion.lastIndexOf('@');
    const packageName = packageAndVersion.slice(0, versionSeparator);
    const resolvedVersion = lock.specifiers?.[specifier];
    const lockEntry =
      versionSeparator > 0 && typeof resolvedVersion === 'string'
        ? `${packageName}@${resolvedVersion}`
        : null;

    if (!lockEntry || !lock.npm?.[lockEntry]) {
      console.error(`Edge lockfile is incomplete for configured import: ${specifier}`);
      process.exit(2);
    }
  }
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
    '--node-modules-dir=none',
    '--lock=supabase/functions/deno.lock',
    '--frozen',
    '--config',
    'supabase/functions/deno.json',
    ...entryPoints,
  ],
  { stdio: 'inherit' },
);

if (result.error) {
  console.error(`Unable to run the pinned Deno checker: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
