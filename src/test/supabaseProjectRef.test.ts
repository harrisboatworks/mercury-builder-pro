import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { projectRefFromConfig, resolveProjectRef } from '../../scripts/lib/supabase-project-ref.mjs';

const CONFIG_REF = 'eutsoqdpjurknjsshxes';

function withConfigToml(toml: string, run: (root: string) => void) {
  const root = mkdtempSync(join(tmpdir(), 'sb-project-ref-'));
  try {
    mkdirSync(join(root, 'supabase'));
    writeFileSync(join(root, 'supabase/config.toml'), toml);
    run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function runDriftWatch(env: Record<string, string>) {
  return spawnSync(process.execPath, ['scripts/supabase-drift-watch.mjs'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: {
      PATH: process.env.PATH || '',
      HOME: process.env.HOME || '',
      SUPABASE_DRIFT_TIMEOUT_MS: '200',
      ...env,
    },
  });
}

describe('project ref resolution', () => {
  it('resolves from SUPABASE_PROJECT_REF when set', () => {
    withConfigToml('project_id = "from-toml"\n', (root) => {
      expect(resolveProjectRef({ SUPABASE_PROJECT_REF: 'from-env' }, { root })).toBe('from-env');
    });
  });

  it('falls back to supabase/config.toml when env is unset or blank', () => {
    withConfigToml('project_id = "from-toml"\n', (root) => {
      expect(resolveProjectRef({}, { root })).toBe('from-toml');
      expect(resolveProjectRef({ SUPABASE_PROJECT_REF: '' }, { root })).toBe('from-toml');
      expect(resolveProjectRef({ SUPABASE_PROJECT_REF: '   ' }, { root })).toBe('from-toml');
    });
    expect(projectRefFromConfig('project_id = "from-toml"\n')).toBe('from-toml');
  });

  it('prefers env over config.toml when both are present', () => {
    withConfigToml(`project_id = "${CONFIG_REF}"\n`, (root) => {
      expect(resolveProjectRef({ SUPABASE_PROJECT_REF: 'from-env' }, { root })).toBe('from-env');
    });
  });

  it('reads the committed config.toml when env is blank and root is the repo', () => {
    expect(resolveProjectRef({ SUPABASE_PROJECT_REF: '' })).toBe(CONFIG_REF);
    expect(resolveProjectRef({ SUPABASE_PROJECT_REF: '   ' })).toBe(CONFIG_REF);
    expect(resolveProjectRef({})).toBe(CONFIG_REF);
  });
});

describe('drift-watch skip vs proceed', () => {
  it('skips cleanly when the access token is missing', () => {
    const result = runDriftWatch({ SUPABASE_PROJECT_REF: CONFIG_REF });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Skipped: repository secret `SUPABASE_ACCESS_TOKEN` is not configured.');
    expect(result.stdout).toContain('Issue handling: skipped (secrets not configured).');
    expect(result.stdout).not.toContain('Management API request failed');
  });

  it('proceeds when the token is set and the ref comes only from config.toml', () => {
    const result = runDriftWatch({ SUPABASE_ACCESS_TOKEN: 'sbp_test_not_a_real_token' });
    expect(result.status).toBe(0);
    expect(result.stdout).not.toContain('Skipped: repository secret `SUPABASE_ACCESS_TOKEN`');
    expect(result.stdout).not.toContain('not both configured');
    expect(result.stdout).toContain('## Supabase drift watch');
  });
});
