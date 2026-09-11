/**
 * Locate official PostgreSQL 17 server binaries for disposable local fixtures.
 * Prefers PGDG/apt `postgresql-17` and Homebrew `postgresql@17`.
 * Accepts a directory only when initdb, pg_ctl, and psql all report major 17.
 * Never starts a shared cluster and never prints secrets.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export const REQUIRED_POSTGRES17_MAJOR = 17;
const REQUIRED = ['initdb', 'pg_ctl', 'psql'];

function hasServerTools(dir) {
  return Boolean(dir) && REQUIRED.every((name) => existsSync(join(dir, name)));
}

function bindirFromPgConfig() {
  try {
    const dir = execFileSync('pg_config', ['--bindir'], { encoding: 'utf8' }).trim();
    return hasServerTools(dir) ? dir : '';
  } catch {
    return '';
  }
}

export function postgres17Candidates(env = process.env) {
  const extra = String(env.POSTGRES_17_BIN || '').trim();
  return [
    extra,
    bindirFromPgConfig(),
    '/usr/lib/postgresql/17/bin',
    '/usr/pgsql-17/bin',
    '/opt/homebrew/opt/postgresql@17/bin',
    '/usr/local/opt/postgresql@17/bin',
  ].filter(Boolean);
}

export function postgresMajorFromVersionText(text) {
  const match = String(text || '').match(/\(PostgreSQL\)\s+(\d+)(?:\.(\d+))?/);
  if (!match) return { major: 0, version: '' };
  return {
    major: Number(match[1]),
    version: match[2] != null ? `${match[1]}.${match[2]}` : String(match[1]),
  };
}

function versionTextFor(dir, name, readVersion) {
  if (typeof readVersion === 'function') return readVersion(name);
  return execFileSync(join(dir, name), ['--version'], { encoding: 'utf8' });
}

export function inspectPostgresBinDir(dir, options = {}) {
  if (!hasServerTools(dir)) {
    return { dir, ok: false, major: 0, mixed: false, version: '', reason: 'missing-tools' };
  }
  const majors = [];
  let version = '';
  try {
    for (const name of REQUIRED) {
      const parsed = postgresMajorFromVersionText(versionTextFor(dir, name, options.readVersion));
      majors.push(parsed.major);
      if (parsed.version) version = parsed.version;
    }
  } catch {
    return { dir, ok: false, major: 0, mixed: false, version: '', reason: 'version-unreadable' };
  }
  const mixed = majors.some((major) => major !== majors[0]);
  const major = majors[0] || 0;
  const ok = !mixed && major === REQUIRED_POSTGRES17_MAJOR;
  return {
    dir,
    ok,
    major,
    mixed,
    version,
    reason: ok ? 'ok' : (mixed ? 'mixed-toolchain' : 'wrong-major'),
  };
}

export function resolvePostgres17Bin(env = process.env) {
  for (const dir of postgres17Candidates(env)) {
    if (inspectPostgresBinDir(dir).ok) return dir;
  }
  return '';
}

export function describePostgres17Bin(env = process.env) {
  const dir = resolvePostgres17Bin(env);
  return dir
    ? inspectPostgresBinDir(dir)
    : { dir: '', ok: false, major: 0, mixed: false, version: '', reason: 'not-found' };
}

export function requirePostgres17Bin(env = process.env) {
  const inspected = describePostgres17Bin(env);
  if (inspected.ok) return inspected.dir;
  throw new Error(
    'Official PostgreSQL 17 server binaries are required (initdb, pg_ctl, psql; major 17; no mixed toolchain). ' +
      'Install official packages: apt.postgresql.org postgresql-17 / postgresql-client-17, ' +
      'or brew install postgresql@17. Set POSTGRES_17_BIN to override. ' +
      `reason=${inspected.reason}`,
  );
}
