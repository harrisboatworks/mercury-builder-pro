#!/usr/bin/env node
// Fails the build if package-lock.json is out of sync with package.json.
// Node-only — compares declared deps/devDeps/optionalDeps/peerDeps against
// the root entry in package-lock.json and requires immutable override specs.
// Catches the common CI failure where `npm ci` rejects a stale lockfile.
// Also rejects bun.lock / bun.lockb so npm remains the sole package manager.

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const EXACT_VERSION =
  /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

export function collectOverrideErrors(overrides, lock, path = []) {
  const errors = [];

  for (const [name, spec] of Object.entries(overrides ?? {})) {
    const overridePath = [...path, name];
    if (spec && typeof spec === 'object') {
      errors.push(...collectOverrideErrors(spec, lock, overridePath));
      continue;
    }
    if (
      typeof spec === 'string' &&
      !spec.startsWith('$') &&
      !EXACT_VERSION.test(spec)
    ) {
      errors.push(
        `  ! overrides.${overridePath.join('.')}: ${spec} must be an exact version`,
      );
    } else if (
      typeof spec === 'string' &&
      EXACT_VERSION.test(spec) &&
      path.length === 0
    ) {
      const lockedVersion = lock.packages?.[`node_modules/${name}`]?.version;
      if (lockedVersion && lockedVersion !== spec) {
        errors.push(
          `  ~ overrides.${name}: package.json=${spec} lockfile=${lockedVersion}`,
        );
      }
    }
  }

  return errors;
}

export function collectDeclaredDependencyErrors(pkg, lock) {
  const errors = [];
  const root = lock.packages?.[''] ?? {};
  const groups = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];

  for (const group of groups) {
    const declared = pkg[group] ?? {};
    const locked = root[group] ?? {};
    for (const [name, range] of Object.entries(declared)) {
      if (!(name in locked)) {
        errors.push(`  + ${group}.${name}@${range} declared in package.json but missing from lockfile`);
      } else if (locked[name] !== range) {
        errors.push(
          `  ~ ${group}.${name}: package.json=${range} lockfile=${locked[name]}`,
        );
      }
    }
    for (const name of Object.keys(locked)) {
      if (!(name in declared)) {
        errors.push(`  - ${group}.${name} present in lockfile but removed from package.json`);
      }
    }
  }

  return errors;
}

export function runLockfileSyncCheck({
  cwd = process.cwd(),
  pkgPath = 'package.json',
  lockPath = 'package-lock.json',
  forbiddenLockfiles = ['bun.lock', 'bun.lockb'],
} = {}) {
  const presentForbidden = forbiddenLockfiles.filter((file) => existsSync(resolve(cwd, file)));
  if (presentForbidden.length) {
    return {
      ok: false,
      errors: [
        `❌ npm-only policy: found ${presentForbidden.join(', ')}.\n` +
          'This repository uses npm as the sole Node package manager.\n' +
          'Delete bun.lock and bun.lockb; keep package-lock.json as the only lockfile.',
      ],
    };
  }

  const resolvedLockPath = resolve(cwd, lockPath);
  if (!existsSync(resolvedLockPath)) {
    return {
      ok: false,
      errors: [`❌ ${lockPath} is missing. Run \`npm install\` and commit it.`],
    };
  }

  const pkg = JSON.parse(readFileSync(resolve(cwd, pkgPath), 'utf8'));
  const lock = JSON.parse(readFileSync(resolvedLockPath, 'utf8'));

  if (lock.lockfileVersion < 2) {
    return {
      ok: false,
      errors: [`❌ package-lock.json must be lockfileVersion >= 2 (got ${lock.lockfileVersion}).`],
    };
  }

  if (lock.name && pkg.name && lock.name !== pkg.name) {
    return {
      ok: false,
      errors: [`❌ name mismatch: package.json=${pkg.name} lockfile=${lock.name}`],
    };
  }

  const errors = [
    ...collectDeclaredDependencyErrors(pkg, lock),
    ...collectOverrideErrors(pkg.overrides, lock),
  ];

  if (errors.length) {
    return { ok: false, errors };
  }

  return { ok: true, errors: [] };
}

function main() {
  const result = runLockfileSyncCheck();
  if (!result.ok) {
    if (result.errors.some((error) => error.startsWith('❌'))) {
      for (const error of result.errors) console.error(error);
    } else {
      console.error('\n❌ package-lock.json is out of sync with package.json\n');
      for (const error of result.errors) console.error(error);
      console.error(
        '\nFix: pin overrides to exact versions, run `npm install`, and commit package-lock.json.\n' +
          'This guard prevents registry releases from making `npm ci` reject the lockfile.\n',
      );
    }
    process.exit(1);
  }

  console.log('✓ Lockfile sync check: package.json, overrides, and package-lock.json match');
}

const invokedDirectly =
  Boolean(process.argv[1]) &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (invokedDirectly) {
  main();
}
