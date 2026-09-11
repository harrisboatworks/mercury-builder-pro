// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { CRON_AUTH_CALLER_MIGRATION_PATH } from '../../../scripts/lib/cron-auth-release-prerequisites.mjs';
import { requirePostgres17Bin, resolvePostgres17Bin } from '../../../scripts/lib/local-postgres17.mjs';

const source = readFileSync(CRON_AUTH_CALLER_MIGRATION_PATH, 'utf8');
// Execute the actual migration DO block. pg_cron/pg_net are replaced by fake
// tables/functions: no real scheduler, HTTP, secrets, or database is contacted.
const migration = source.slice(source.indexOf('DO $migration$'));
const manifest = JSON.parse(readFileSync('scripts/lib/cron-auth-release-prerequisites.json', 'utf8'));
const slugs = ['check-expiring-promotions', 'sync-lightspeed-inventory'];
const names = ['check-expiring-promotions-daily', 'lightspeed-motor-models-sync-daily'];
const schedules = ['0 13 * * *', '15 2 * * *'];
const fakeBearer = 'fixture.not-a-real-jwt.only-used-in-local-tests';
const quote = (s: string) => `'${s.replace(/'/g, "''")}'`;
const command = (i: number, option = '') => `SELECT net.http_post(
  url := 'https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/${slugs[i]}',
  headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ${fakeBearer}'),
  body := '{}'::jsonb${option}
) AS request_id;`;

const requirePg = process.env.CRON_AUTH_REQUIRE_PG === '1';
const bin = requirePg ? requirePostgres17Bin() : resolvePostgres17Bin() || undefined;

it('keeps both deployment prerequisites unresolved while the migration is only proposed', () => {
  for (const slug of slugs) {
    expect(manifest.slugs[slug]).toMatchObject({ status: 'unresolved', path: null, version: null });
  }
  expect(source).toContain('PROPOSED NEW database');
  expect(source).not.toMatch(/eyJ[A-Za-z0-9_-]{10,}/);
});

// Official PostgreSQL 17 (PGDG apt or Homebrew). CRON_AUTH_REQUIRE_PG=1 fails
// closed instead of skipping. A skipped run is not migration acceptance.
describe.skipIf(!bin)('actual caller migration in disposable PostgreSQL', () => {
  let dir: string;
  let started = false;
  const env = { ...process.env, PGCONNECT_TIMEOUT: '3' };
  const sql = (text: string) => execFileSync(join(bin!, 'psql'), [
    '-X', '-q', '-h', dir, '-p', '55432', '-U', 'fixture', '-d', 'postgres',
    '-v', 'ON_ERROR_STOP=1', '-At',
  ], { input: text, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], env });
  type Job = { jobid: number; command: string; [key: string]: unknown };
  const snapshot = (): Job[] => JSON.parse(sql('SELECT jsonb_agg(to_jsonb(j) ORDER BY jobid) FROM cron.job j;'));
  const rejectWithoutChanges = () => {
    const before = snapshot();
    expect(() => sql(migration)).toThrow();
    expect(snapshot()).toEqual(before);
  };
  const insertedClause = () => {
    const match = source.match(/\$c\$([\s\S]*?)\$c\$/);
    if (!match) throw new Error('migration header clause missing');
    return match[1].replace('%L', "'EDGE_INTERNAL_SECRET'");
  };

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'cron-auth-pg-'));
    execFileSync(join(bin!, 'initdb'), ['-D', join(dir, 'data'), '-A', 'trust', '-U', 'fixture', '--no-sync', '--no-locale', '-E', 'UTF8'], { stdio: 'pipe', env });
    // Unique Unix socket directory; no TCP listener or existing database access.
    execFileSync(join(bin!, 'pg_ctl'), ['-D', join(dir, 'data'), '-l', join(dir, 'server.log'), '-o', `-p 55432 -k ${dir} -c listen_addresses=''`, '-w', 'start'], { stdio: 'pipe', env });
    started = true;
  }, 30_000);
  afterAll(() => {
    if (started) execFileSync(join(bin!, 'pg_ctl'), ['-D', join(dir, 'data'), '-m', 'fast', '-w', 'stop'], { stdio: 'pipe', env });
    if (dir) rmSync(dir, { recursive: true, force: true });
  });
  beforeEach(() => {
    sql(`DROP SCHEMA IF EXISTS cron CASCADE; DROP SCHEMA IF EXISTS vault CASCADE; DROP SCHEMA IF EXISTS net CASCADE;
CREATE SCHEMA cron; CREATE SCHEMA vault; CREATE SCHEMA net;
CREATE TABLE cron.job(jobid bigint PRIMARY KEY, jobname text, schedule text, command text, active boolean, database text DEFAULT 'fixture', username text DEFAULT 'fixture');
CREATE TABLE vault.secrets(name text, decrypted_secret text);
CREATE VIEW vault.decrypted_secrets AS SELECT * FROM vault.secrets;
CREATE FUNCTION cron.alter_job(job_id bigint, command text) RETURNS void LANGUAGE sql AS 'UPDATE cron.job SET command=$2 WHERE jobid=$1';
CREATE TABLE net.calls(headers jsonb);
CREATE FUNCTION net.http_post(url text, headers jsonb, body jsonb, timeout_milliseconds integer DEFAULT 1000) RETURNS bigint LANGUAGE plpgsql AS $$ BEGIN INSERT INTO net.calls VALUES(headers); RETURN 1; END $$;
INSERT INTO vault.secrets VALUES ('EDGE_INTERNAL_SECRET','fixture-internal-secret');
INSERT INTO cron.job(jobid,jobname,schedule,command,active) VALUES
(1,${quote(names[0])},${quote(schedules[0])},${quote(command(0))},true),
(2,${quote(names[1])},${quote(schedules[1])},${quote(command(1))},false),
(3,'unrelated','0 0 * * *','SELECT 99;',false);`);
  });

  it('preserves every other command byte, metadata, inactive state, unrelated job and rerun', () => {
    sql(`UPDATE cron.job SET command=${quote(command(1, ', timeout_milliseconds := 300000'))} WHERE jobid=2;`);
    const before = snapshot();
    sql(migration);
    const after = snapshot();
    expect(after.map((job) => job.jobid < 3 ? { ...job, command: job.command.replace(insertedClause(), '') } : job)).toEqual(before);
    sql(migration);
    expect(snapshot()).toEqual(after);
    sql(after[0].command); // fake net.http_post only
    expect(sql("SELECT headers->>'x-internal-secret' FROM net.calls;").trim()).toBe('fixture-internal-secret');
  });

  it.each([
    ['missing secret', 'DELETE FROM vault.secrets;'],
    ['empty secret', "UPDATE vault.secrets SET decrypted_secret='';"],
    ['null secret', 'UPDATE vault.secrets SET decrypted_secret=NULL;'],
    ['whitespace secret', "UPDATE vault.secrets SET decrypted_secret='   ';"],
    ['duplicate secret', 'INSERT INTO vault.secrets SELECT * FROM vault.secrets;'],
    ['missing second job rolls first back', 'DELETE FROM cron.job WHERE jobid=2;'],
    ['duplicate job', 'INSERT INTO cron.job SELECT 4,jobname,schedule,command,active,database,username FROM cron.job WHERE jobid=1;'],
    ['extra caller', "INSERT INTO cron.job SELECT 4,'unexpected',schedule,command,active,database,username FROM cron.job WHERE jobid=1;"],
    ['second schedule drift rolls first back', "UPDATE cron.job SET schedule='1 1 * * *' WHERE jobid=2;"],
    ['first schedule drift rolls neither job', "UPDATE cron.job SET schedule='1 1 * * *' WHERE jobid=1;"],
  ])('rejects %s atomically', (_name, mutate) => { sql(mutate); rejectWithoutChanges(); });

  it.each([
    ['extra statement', command(0) + ' SELECT 42;'],
    ['comment-only match', '/* ' + command(0) + ' */ SELECT 42;'],
    ['unknown option', command(0, ", params := '{}'::jsonb")],
    ['timeout expression', command(0, ', timeout_milliseconds := 20000 + 5000')],
    ['different body', command(0).replace("'{}'", "'{\"unexpected\":true}'")],
    ['different URL', command(0).replace('eutsoqdpjurknjsshxes.supabase.co', 'example.invalid')],
    ['duplicate Authorization', command(0).replace("'Content-Type'", "'Authorization', 'Bearer fixture.test.fake', 'Content-Type'")],
    ['malformed internal header', command(0).replace("'Content-Type'", "'x-internal-secret', 'bad', 'Content-Type'")],
  ])('rejects unsupported command: %s', (_name, value) => {
    sql(`UPDATE cron.job SET command=${quote(value)} WHERE jobid=1;`); rejectWithoutChanges();
  });

  it('rejects a malformed rerun without modifying either job', () => {
    sql(migration); sql("UPDATE cron.job SET command=command || ' SELECT 42;' WHERE jobid=2;"); rejectWithoutChanges();
  });
  it('rejects an exact internal clause inserted outside the header constructor', () => {
    sql(migration);
    const wrong = command(0).replace("body := '{}'::jsonb", "body := '{}'::jsonb" + insertedClause());
    sql(`UPDATE cron.job SET command=${quote(wrong)} WHERE jobid=1;`);
    rejectWithoutChanges();
  });
  it('uses CRON fallback only when the proposed EDGE row is absent', () => {
    sql("UPDATE vault.secrets SET name='CRON_SECRET';"); sql(migration);
    sql(snapshot()[0].command);
    expect(sql("SELECT headers->>'x-internal-secret' FROM net.calls;").trim()).toBe('fixture-internal-secret');
  });
  it('prefers EDGE_INTERNAL_SECRET when both proposed Vault names exist', () => {
    sql("INSERT INTO vault.secrets VALUES ('CRON_SECRET','fixture-cron-fallback');");
    sql(migration);
    sql(snapshot()[0].command);
    expect(sql("SELECT headers->>'x-internal-secret' FROM net.calls;").trim()).toBe('fixture-internal-secret');
    expect(snapshot()[0].command).toContain("'EDGE_INTERNAL_SECRET'");
    expect(snapshot()[0].command).not.toContain("'CRON_SECRET'");
  });
  it.each([
    ['missing', 'DELETE FROM vault.secrets;'],
    ['empty', "UPDATE vault.secrets SET decrypted_secret='';"],
    ['duplicate', 'INSERT INTO vault.secrets SELECT * FROM vault.secrets;'],
  ])('fails before fake HTTP if the runtime Vault value becomes %s', (_name, mutate) => {
    sql(migration); const generated = snapshot()[0].command; sql(mutate);
    expect(() => sql(generated)).toThrow();
    expect(sql('SELECT count(*) FROM net.calls;').trim()).toBe('0');
  });
});
