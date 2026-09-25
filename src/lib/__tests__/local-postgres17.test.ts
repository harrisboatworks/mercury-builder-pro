// @vitest-environment node
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  inspectPostgresBinDir,
  postgresMajorFromVersionText,
  requirePostgres17Bin,
  resolvePostgres17Bin,
} from '../../../scripts/lib/local-postgres17.mjs';

const fakeDirs: string[] = [];

function writeFakeBinDir(versions: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), 'pg-bin-'));
  fakeDirs.push(dir);
  for (const [name, text] of Object.entries(versions)) {
    const path = join(dir, name);
    writeFileSync(path, `#!/bin/sh\nprintf '%s\\n' '${text}'\n`);
    chmodSync(path, 0o755);
  }
  return dir;
}

afterEach(() => {
  for (const dir of fakeDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('PostgreSQL 17 resolver', () => {
  it('parses official version text', () => {
    expect(postgresMajorFromVersionText('postgres (PostgreSQL) 17.11')).toEqual({
      major: 17,
      version: '17.11',
    });
    expect(postgresMajorFromVersionText('psql (PostgreSQL) 16.4').major).toBe(16);
  });

  it('rejects a bindir whose tools report a non-17 major', () => {
    const dir = writeFakeBinDir({
      initdb: 'initdb (PostgreSQL) 16.4',
      pg_ctl: 'pg_ctl (PostgreSQL) 16.4',
      psql: 'psql (PostgreSQL) 16.4',
    });
    const inspected = inspectPostgresBinDir(dir);
    expect(inspected).toMatchObject({ ok: false, major: 16, mixed: false, reason: 'wrong-major' });
    expect(resolvePostgres17Bin({ POSTGRES_17_BIN: dir, PATH: '/nonexistent' })).not.toBe(dir);
  });

  it('rejects a mixed-toolchain bindir', () => {
    const dir = writeFakeBinDir({
      initdb: 'initdb (PostgreSQL) 17.11',
      pg_ctl: 'pg_ctl (PostgreSQL) 17.11',
      psql: 'psql (PostgreSQL) 16.4',
    });
    expect(inspectPostgresBinDir(dir)).toMatchObject({
      ok: false,
      mixed: true,
      reason: 'mixed-toolchain',
    });
  });

  it('accepts a consistent official 17 bindir', () => {
    const dir = writeFakeBinDir({
      initdb: 'initdb (PostgreSQL) 17.11',
      pg_ctl: 'pg_ctl (PostgreSQL) 17.11',
      psql: 'psql (PostgreSQL) 17.11',
    });
    expect(inspectPostgresBinDir(dir)).toMatchObject({
      ok: true,
      major: 17,
      mixed: false,
      version: '17.11',
    });
    expect(resolvePostgres17Bin({ POSTGRES_17_BIN: dir, PATH: '/nonexistent' })).toBe(dir);
    expect(requirePostgres17Bin({ POSTGRES_17_BIN: dir, PATH: '/nonexistent' })).toBe(dir);
  });
});
