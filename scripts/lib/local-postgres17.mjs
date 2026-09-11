/**
 * Locate official PostgreSQL 17 server binaries for disposable local fixtures.
 * Prefers PGDG/apt `postgresql-17` (`pg_config --bindir`) and Homebrew
 * `postgresql@17`. Never starts a shared cluster and never prints secrets.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

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

export function resolvePostgres17Bin(env = process.env) {
  for (const dir of postgres17Candidates(env)) {
    if (hasServerTools(dir)) return dir;
  }
  return '';
}

export function requirePostgres17Bin(env = process.env) {
  const dir = resolvePostgres17Bin(env);
  if (dir) return dir;
  throw new Error(
    'PostgreSQL 17 server binaries are required (initdb, pg_ctl, psql). ' +
      'Install official packages: apt.postgresql.org postgresql-17 / postgresql-client-17, ' +
      'or brew install postgresql@17. Set POSTGRES_17_BIN to override.',
  );
}
