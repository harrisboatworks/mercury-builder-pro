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
});
