#!/usr/bin/env node
// Fails the build if package-lock.json is out of sync with package.json.
// Node-only — compares declared deps/devDeps/optionalDeps/peerDeps against
// the root entry in package-lock.json. Catches the common CI failure where
// `npm ci` rejects a stale lockfile.

import { readFileSync, existsSync } from 'node:fs';

const pkgPath = 'package.json';
const lockPath = 'package-lock.json';

if (!existsSync(lockPath)) {
  console.error(`❌ ${lockPath} is missing. Run \`npm install\` and commit it.`);
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const lock = JSON.parse(readFileSync(lockPath, 'utf8'));

if (lock.lockfileVersion < 2) {
  console.error(`❌ package-lock.json must be lockfileVersion >= 2 (got ${lock.lockfileVersion}).`);
  process.exit(1);
}

if (lock.name && pkg.name && lock.name !== pkg.name) {
  console.error(`❌ name mismatch: package.json=${pkg.name} lockfile=${lock.name}`);
  process.exit(1);
}

const root = lock.packages?.[''] ?? {};
const groups = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];

const errors = [];
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

if (errors.length) {
  console.error('\n❌ package-lock.json is out of sync with package.json\n');
  for (const e of errors) console.error(e);
  console.error(
    '\nFix: run `npm install` locally and commit the updated package-lock.json.\n' +
      'This guard prevents CI failures where `npm ci` rejects a stale lockfile.\n',
  );
  process.exit(1);
}

console.log('✓ Lockfile sync check: package-lock.json matches package.json');
