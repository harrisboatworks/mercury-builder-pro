import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  collectOverrideErrors,
  runLockfileSyncCheck,
} from '../../../scripts/check-lockfile-sync.mjs';

describe('lockfile override guard', () => {
  it('accepts exact overrides that match the lockfile and $ alias specs', () => {
    expect(collectOverrideErrors(
      {
        undici: '7.29.0',
        sharp: '$sharp',
        nested: { minimatch: '9.0.9' },
      },
      {
        packages: {
          'node_modules/undici': { version: '7.29.0' },
        },
      },
    )).toEqual([]);
  });

  it('rejects a floating override', () => {
    expect(collectOverrideErrors(
      { 'path-to-regexp': '^8.2.0' },
      { packages: { 'node_modules/path-to-regexp': { version: '8.4.2' } } },
    )).toEqual([
      '  ! overrides.path-to-regexp: ^8.2.0 must be an exact version',
    ]);
  });

  it('rejects an exact override that disagrees with the lockfile', () => {
    expect(collectOverrideErrors(
      { minimatch: '9.0.8' },
      { packages: { 'node_modules/minimatch': { version: '9.0.9' } } },
    )).toEqual([
      '  ~ overrides.minimatch: package.json=9.0.8 lockfile=9.0.9',
    ]);
  });

  it('passes the current repository package and lock files', () => {
    expect(runLockfileSyncCheck()).toEqual({ ok: true, errors: [] });
  });

  it('runs when invoked through an absolute symlink path', () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), 'lockfile-sync-'));
    const symlinkPath = join(temporaryDirectory, 'check-lockfile-sync.mjs');
    const scriptPath = fileURLToPath(
      new URL('../../../scripts/check-lockfile-sync.mjs', import.meta.url),
    );

    try {
      symlinkSync(scriptPath, symlinkPath);
      const result = spawnSync(process.execPath, [symlinkPath], {
        cwd: fileURLToPath(new URL('../../../', import.meta.url)),
        encoding: 'utf8',
      });

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('✓ Lockfile sync check');
    } finally {
      rmSync(temporaryDirectory, { recursive: true, force: true });
    }
  });
});
