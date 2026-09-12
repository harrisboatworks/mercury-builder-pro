import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  deployFunctionSlugs,
  deployWithMigrationGate,
  formatAppliedMigrationsReadLine,
  formatFunctionsDeployMarkdown,
  isSafeFunctionSlug,
  isUnsupportedMigrationListOutputFlag,
  parseAppliedVersionsFromMigrationList,
  projectRefFromConfig,
  readAppliedMigrationsFromCli,
  readAppliedMigrationsWithFallback,
  redactSecrets,
  resolveForcedPair,
  resolveForcedSlug,
  resolveProjectRef,
  requiredMigrationsForDispatch,
  buildDispatchPairTargets,
  runDeploy,
} from '../../scripts/deploy-supabase-functions.mjs';
import { PUBLIC_RELEASE_PAIRS } from '../../scripts/lib/public-function-release-guards.mjs';
import { listAppliedMigrationsFromManagementApi } from '../../scripts/lib/supabase-management-api.mjs';
import { isMigrationApplied, appliedVersionSet, deployTargetsFromDiff, releaseRequirementsForSlug } from '../../scripts/lib/supabase-deploy-required.mjs';
import {
  projectRefFromConfig as sharedProjectRefFromConfig,
  resolveProjectRef as sharedResolveProjectRef,
} from '../../scripts/lib/supabase-project-ref.mjs';
import {
  listEdgeSecretNamesForProject,
  managementApiSecretsUrl,
  pickSecretNames,
} from '../../scripts/lib/supabase-edge-secret-names.mjs';

import {
  CRON_AUTH_CALLER_MIGRATION_PATH,
  CRON_AUTH_CALLER_MIGRATION_VERSION,
  CRON_AUTH_RELEASE_PREREQUISITE_MANIFEST_PATH,
} from '../../scripts/lib/cron-auth-release-prerequisites.mjs';

const files = {
  'supabase/functions/send-sms/index.ts': 'export {}',
  'supabase/functions/ai-chatbot/index.ts': 'export {}',
  'supabase/functions/_shared/cors.ts': 'export const corsHeaders = {};',
};

beforeEach(() => {
  vi.stubEnv('SUPABASE_EDGE_SECRET_NAMES', 'TWILIO_WEBHOOK_URL');
});

describe('function slug safety', () => {
  it('accepts real slugs and rejects _shared, paths, and flags', () => {
    expect(isSafeFunctionSlug('send-sms')).toBe(true);
    expect(isSafeFunctionSlug('ai-chatbot')).toBe(true);
    expect(isSafeFunctionSlug('_shared')).toBe(false);
    expect(isSafeFunctionSlug('send-sms/../x')).toBe(false);
    expect(isSafeFunctionSlug('--project-ref')).toBe(false);
    expect(isSafeFunctionSlug('')).toBe(false);
  });

  it('resolves a dispatch slug only when the function directory exists', () => {
    expect(resolveForcedSlug('send-sms', files)).toEqual({ ok: true, slug: 'send-sms' });
    expect(resolveForcedSlug('_shared', files).ok).toBe(false);
    expect(resolveForcedSlug('not-a-function', files).ok).toBe(false);
    expect(resolveForcedSlug('send-sms; rm -rf /', files).ok).toBe(false);
  });

  it('resolves only allowlisted deploy pairs and rejects unknown ids', () => {
    const pairFiles = {
      ...files,
      'supabase/functions/ai-chatbot-stream/index.ts': 'export {}',
      'supabase/functions/realtime-session/index.ts': 'export {}',
      'supabase/functions/realtime-sdp-exchange/index.ts': 'export {}',
    };
    expect(resolveForcedPair('site-chat', pairFiles).ok).toBe(true);
    expect(resolveForcedPair('openai-realtime', pairFiles).pair.slugs).toEqual([
      'realtime-session',
      'realtime-sdp-exchange',
    ]);
    expect(resolveForcedPair('not-a-pair', pairFiles).ok).toBe(false);
    expect(resolveForcedPair('site-chat,openai-realtime', pairFiles).ok).toBe(false);
    expect(resolveForcedPair('', pairFiles).ok).toBe(false);
  });
});

describe('project ref and secret redaction', () => {
  it('reads project_id from config.toml text', () => {
    expect(projectRefFromConfig('project_id = "eutsoqdpjurknjsshxes"\n')).toBe('eutsoqdpjurknjsshxes');
    expect(projectRefFromConfig('[functions.send-sms]\nverify_jwt = false\n')).toBe('');
  });

  it('re-exports the shared project-ref helpers without a second implementation', () => {
    expect(projectRefFromConfig).toBe(sharedProjectRefFromConfig);
    expect(resolveProjectRef).toBe(sharedResolveProjectRef);
  });

  it('still deploys when SUPABASE_PROJECT_REF is unset because config.toml has project_id', async () => {
    const seen: string[] = [];
    const code = await runDeploy({
      env: {
        DEPLOY_FUNCTION: 'send-sms',
        DEPLOY_FROM: 'HEAD',
        DEPLOY_TO: 'HEAD',
      },
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'ok' };
      },
      listAppliedVersions: () => [],
      listSecretNamesFromApi: async ({ projectRef }: { projectRef: string }) => {
        expect(projectRef).toBe('eutsoqdpjurknjsshxes');
        return ['TWILIO_WEBHOOK_URL'];
      },
    });
    expect(code).toBe(0);
    expect(seen).toEqual(['send-sms']);
  });

  it('redacts token values copied from the environment', () => {
    const env = {
      SUPABASE_ACCESS_TOKEN: 'sbp_secret_value',
      SUPABASE_PROJECT_REF: 'eutsoqdpjurknjsshxes',
    };
    expect(redactSecrets('token=sbp_secret_value ref=eutsoqdpjurknjsshxes', env)).toBe(
      'token=[redacted] ref=[redacted]',
    );
  });
});

describe('deploy batch', () => {
  it('deploys the rest after one failure and names both outcomes', () => {
    const seen: string[] = [];
    const { succeeded, failed } = deployFunctionSlugs(['send-sms', 'ai-chatbot', 'hbw-valuation-proxy'], {
      deployOne: (slug: string) => {
        seen.push(slug);
        if (slug === 'ai-chatbot') return { ok: false, detail: 'CLI exited 1' };
        return { ok: true, detail: 'Deployed' };
      },
    });
    expect(seen).toEqual(['send-sms', 'ai-chatbot', 'hbw-valuation-proxy']);
    expect(succeeded.map((item) => item.slug)).toEqual(['send-sms', 'hbw-valuation-proxy']);
    expect(failed.map((item) => item.slug)).toEqual(['ai-chatbot']);
    expect(failed[0].detail).toContain('CLI exited 1');
  });

  it('refuses _shared without calling the deployer', () => {
    const seen: string[] = [];
    const { failed } = deployFunctionSlugs(['_shared'], {
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true };
      },
    });
    expect(seen).toEqual([]);
    expect(failed[0].slug).toBe('_shared');
  });
});

const QUOTE_EMAIL_MIGRATION =
  'supabase/migrations/20260909193000_serialize_quote_email_delivery_failed_retry_claim.sql';
const QUOTE_EMAIL_AUDIT_MIGRATION =
  'supabase/migrations/20260815160000_quote_email_delivery_audit.sql';

const MCP_LEDGER_ROWS = [
  { version: '20260909194905', name: 'serialize_quote_email_delivery_failed_retry_claim' },
  { version: '20260909164256', name: 'quote_email_delivery_audit' },
] as const;

const CLI_TABLE_WITHOUT_NAMES = [
  '        LOCAL      │     REMOTE     │     TIME (UTC)',
  '  ─────────────────┼────────────────┼──────────────────────',
  '    20260815160000 │                │ 2026-08-15 16:00:00',
  '                   │ 20260909164256 │ 2026-09-09 16:42:56',
  '    20260909193000 │                │ 2026-09-09 19:30:00',
  '                   │ 20260909194905 │ 2026-09-09 19:49:05',
].join('\n');

const CLI_JSON_WITH_NAMES = JSON.stringify({
  message: 'Migrations listed',
  migrations: [
    { version: '20260909194905', name: 'serialize_quote_email_delivery_failed_retry_claim' },
    { remote: '20260909164256', name: 'quote_email_delivery_audit' },
  ],
});

const CLI_JSON_VERSIONS_ONLY = JSON.stringify({
  message: 'Migrations listed',
  migrations: [
    { local: '20260815160000', remote: '', time: '2026-08-15 16:00:00' },
    { local: '', remote: '20260909164256', time: '2026-09-09 16:42:56' },
    { local: '20260909193000', remote: '', time: '2026-09-09 19:30:00' },
    { local: '', remote: '20260909194905', time: '2026-09-09 19:49:05' },
  ],
});

describe('migration apply-order gate', () => {
  it('deploys when the required migration is applied', async () => {
    const seen: string[] = [];
    const { succeeded, failed } = await deployWithMigrationGate({
      functions: [
        {
          slug: 'send-quote-email',
          requiredMigrations: [{ path: QUOTE_EMAIL_MIGRATION, version: '20260909193000' }],
        },
      ],
      listAppliedVersions: () => [{ version: '20260909193000' }],
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'Deployed' };
      },
    });
    expect(seen).toEqual(['send-quote-email']);
    expect(succeeded.map((item) => item.slug)).toEqual(['send-quote-email']);
    expect(failed).toEqual([]);
  });

  it('skips a function whose required migration is not applied and fails the run', async () => {
    const seen: string[] = [];
    const { succeeded, failed } = await deployWithMigrationGate({
      functions: [
        {
          slug: 'send-quote-email',
          requiredMigrations: [{ path: QUOTE_EMAIL_MIGRATION, version: '20260909193000' }],
        },
      ],
      listAppliedVersions: () => [{ version: '20260815160000' }],
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'Deployed' };
      },
    });
    expect(seen).toEqual([]);
    expect(succeeded).toEqual([]);
    expect(failed).toHaveLength(1);
    expect(failed[0].slug).toBe('send-quote-email');
    expect(failed[0].detail).toContain('20260909193000_serialize_quote_email_delivery_failed_retry_claim.sql');
    expect(failed[0].detail).toContain('not applied in production');
    expect(failed[0].detail).toContain('send-quote-email');
  });

  it('deploys a function with no migration dependency regardless of applied versions', async () => {
    const seen: string[] = [];
    const { succeeded, failed } = await deployWithMigrationGate({
      functions: [{ slug: 'send-sms', requiredMigrations: [] }],
      listAppliedVersions: () => [],
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'Deployed' };
      },
    });
    expect(seen).toEqual(['send-sms']);
    expect(succeeded.map((item) => item.slug)).toEqual(['send-sms']);
    expect(failed).toEqual([]);
  });

  it('skips a migration-dependent function when the applied-versions lookup throws', async () => {
    const seen: string[] = [];
    const lines: string[] = [];
    const env = { SUPABASE_ACCESS_TOKEN: 'sbp_secret_value' };
    const { succeeded, failed, appliedLookupFailed } = await deployWithMigrationGate({
      functions: [
        {
          slug: 'send-quote-email',
          requiredMigrations: [{ path: QUOTE_EMAIL_MIGRATION, version: '20260909193000' }],
        },
      ],
      listAppliedVersions: () => {
        throw new Error('network down token=sbp_secret_value');
      },
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'Deployed' };
      },
      env,
      log: (line: string) => {
        lines.push(line);
      },
    });
    expect(appliedLookupFailed).toBe(true);
    expect(seen).toEqual([]);
    expect(succeeded).toEqual([]);
    expect(failed).toHaveLength(1);
    expect(failed[0].slug).toBe('send-quote-email');
    expect(failed[0].detail).toContain('could not read applied migrations');
    expect(failed[0].detail).toContain('unreadable list');
    expect(failed[0].detail).not.toContain('not applied in production');
    expect(failed[0].detail).not.toContain('nothing was deployed');
    expect(failed[0].detail).not.toContain('sbp_secret_value');
    expect(lines.join('')).toContain('could not read applied migrations:');
    expect(lines.join('\n')).not.toContain('sbp_secret_value');
  });

  it('deploys a migration-independent function when the applied-versions lookup throws', async () => {
    const seen: string[] = [];
    const { succeeded, failed, appliedLookupFailed } = await deployWithMigrationGate({
      functions: [{ slug: 'send-sms', requiredMigrations: [] }],
      listAppliedVersions: () => {
        throw new Error('network down');
      },
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'Deployed' };
      },
    });
    expect(appliedLookupFailed).toBe(true);
    expect(seen).toEqual(['send-sms']);
    expect(succeeded.map((item) => item.slug)).toEqual(['send-sms']);
    expect(failed).toEqual([]);
  });

  it('deploys only migration-independent functions when the applied-versions lookup throws', async () => {
    const seen: string[] = [];
    const { succeeded, failed, appliedLookupFailed } = await deployWithMigrationGate({
      functions: [
        { slug: 'send-sms', requiredMigrations: [] },
        {
          slug: 'send-quote-email',
          requiredMigrations: [{ path: QUOTE_EMAIL_MIGRATION, version: '20260909193000' }],
        },
      ],
      listAppliedVersions: () => {
        throw new Error('network down');
      },
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'Deployed' };
      },
    });
    expect(appliedLookupFailed).toBe(true);
    expect(seen).toEqual(['send-sms']);
    expect(succeeded.map((item) => item.slug)).toEqual(['send-sms']);
    expect(failed.map((item) => item.slug)).toEqual(['send-quote-email']);
    expect(failed[0].detail).toContain('could not read applied migrations');
    expect(failed[0].detail).toContain('unreadable list');
    expect(failed[0].detail).not.toContain('not applied in production');
    expect(failed.length).toBeGreaterThan(0);
  });

  it('treats empty CLI output as a lookup failure, not an empty applied set', async () => {
    const seen: string[] = [];
    const { failed, appliedLookupFailed } = await deployWithMigrationGate({
      functions: [
        {
          slug: 'send-quote-email',
          requiredMigrations: [{ path: QUOTE_EMAIL_MIGRATION, version: '20260909193000' }],
        },
      ],
      listAppliedVersions: () => parseAppliedVersionsFromMigrationList(''),
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'Deployed' };
      },
    });
    expect(appliedLookupFailed).toBe(true);
    expect(seen).toEqual([]);
    expect(failed[0].detail).toContain('could not read applied migrations');
    expect(failed[0].detail).toContain('empty output');
    expect(failed[0].detail).not.toContain('not applied in production');
  });

  it('treats a successful empty applied-versions list as a real answer, not a lookup failure', async () => {
    const seen: string[] = [];
    const { succeeded, failed, appliedLookupFailed } = await deployWithMigrationGate({
      functions: [
        {
          slug: 'send-quote-email',
          requiredMigrations: [{ path: QUOTE_EMAIL_MIGRATION, version: '20260909193000' }],
        },
      ],
      listAppliedVersions: () => [],
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'Deployed' };
      },
    });
    expect(appliedLookupFailed).toBe(false);
    expect(seen).toEqual([]);
    expect(succeeded).toEqual([]);
    expect(failed).toHaveLength(1);
    expect(failed[0].slug).toBe('send-quote-email');
    expect(failed[0].detail).toContain('not applied in production');
    expect(failed[0].detail).not.toContain('could not read applied migrations');
  });

  it('logs applied migration count, latest version, and source without secret material', async () => {
    const lines: string[] = [];
    const env = {
      SUPABASE_ACCESS_TOKEN: 'sbp_secret_value',
      SUPABASE_PROJECT_REF: 'eutsoqdpjurknjsshxes',
    };
    await deployWithMigrationGate({
      functions: [{ slug: 'send-sms', requiredMigrations: [] }],
      listFromManagementApi: async () => [
        { version: '20260815160000' },
        { version: '20260909193000' },
      ],
      listFromCli: () => {
        throw new Error('cli should not run');
      },
      deployOne: () => ({ ok: true, detail: 'Deployed' }),
      env,
      log: (line: string) => {
        lines.push(line);
      },
    });
    expect(lines.join('')).toContain(
      'applied migrations read: 2 versions (latest 20260909193000) via Management API',
    );
    expect(
      formatAppliedMigrationsReadLine(
        [{ version: '20260815160000' }, { version: '20260909193000' }],
        'management-api',
      ),
    ).toBe('applied migrations read: 2 versions (latest 20260909193000) via Management API');
    expect(formatAppliedMigrationsReadLine([{ version: '20260909194905' }], 'cli-fallback')).toBe(
      'applied migrations read: 1 versions (latest 20260909194905) via CLI fallback',
    );
    expect(lines.join('\n')).not.toContain('sbp_secret_value');
    expect(lines.join('\n')).not.toContain('eutsoqdpjurknjsshxes');
  });

  it('deploys the unblocked function in a mixed batch and skips the blocked one', async () => {
    const seen: string[] = [];
    const { succeeded, failed } = await deployWithMigrationGate({
      functions: [
        { slug: 'send-sms', requiredMigrations: [] },
        {
          slug: 'send-quote-email',
          requiredMigrations: [{ path: QUOTE_EMAIL_MIGRATION, version: '20260909193000' }],
        },
        { slug: 'submit-quote-lead', requiredMigrations: [] },
      ],
      listAppliedVersions: () => [{ version: '20260815160000' }],
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'Deployed' };
      },
    });
    expect(seen).toEqual(['send-sms', 'submit-quote-lead']);
    expect(succeeded.map((item) => item.slug)).toEqual(['send-sms', 'submit-quote-lead']);
    expect(failed.map((item) => item.slug)).toEqual(['send-quote-email']);
    expect(failed[0].detail).toContain('20260909193000_serialize_quote_email_delivery_failed_retry_claim.sql');
  });

  it('treats a migration applied under a different version but the same name as applied', () => {
    const applied = appliedVersionSet([...MCP_LEDGER_ROWS]);
    expect(isMigrationApplied(QUOTE_EMAIL_MIGRATION, applied)).toBe(true);
    expect(isMigrationApplied(QUOTE_EMAIL_AUDIT_MIGRATION, applied)).toBe(true);
  });

  it('still treats a genuinely absent migration as unapplied', () => {
    const applied = appliedVersionSet([...MCP_LEDGER_ROWS]);
    expect(isMigrationApplied('supabase/migrations/20260909199999_absent_from_ledger.sql', applied)).toBe(
      false,
    );
  });

  it('treats a migration applied under a different Management API version but the same name as applied', async () => {
    const seen: string[] = [];
    const { succeeded, failed, appliedSource } = await deployWithMigrationGate({
      functions: [
        {
          slug: 'send-quote-email',
          requiredMigrations: [
            { path: QUOTE_EMAIL_MIGRATION, version: '20260909193000' },
            { path: QUOTE_EMAIL_AUDIT_MIGRATION, version: '20260815160000' },
          ],
        },
      ],
      listFromManagementApi: async () => [...MCP_LEDGER_ROWS],
      listFromCli: () => {
        throw new Error('cli should not run');
      },
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'Deployed' };
      },
    });
    expect(appliedSource).toBe('management-api');
    expect(seen).toEqual(['send-quote-email']);
    expect(succeeded.map((item) => item.slug)).toEqual(['send-quote-email']);
    expect(failed).toEqual([]);
  });

  it('still treats a genuinely absent Management API ledger row as unapplied', async () => {
    const seen: string[] = [];
    const { succeeded, failed } = await deployWithMigrationGate({
      functions: [
        {
          slug: 'send-quote-email',
          requiredMigrations: [
            { path: 'supabase/migrations/20260909199999_absent_from_ledger.sql', version: '20260909199999' },
          ],
        },
      ],
      listFromManagementApi: async () => [...MCP_LEDGER_ROWS],
      listFromCli: () => {
        throw new Error('cli should not run');
      },
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'Deployed' };
      },
    });
    expect(seen).toEqual([]);
    expect(succeeded).toEqual([]);
    expect(failed).toHaveLength(1);
    expect(failed[0].detail).toContain('20260909199999_absent_from_ledger.sql');
    expect(failed[0].detail).toContain('not applied in production');
    expect(failed[0].detail).not.toContain('fell back to the CLI');
    expect(failed[0].detail).not.toContain('DEPLOY_TREAT_APPLIED');
    expect(failed[0].detail).not.toContain('treat_applied');
  });

  it('does not treat a newer ledger latest version as applied on a versions-only listing', async () => {
    const seen: string[] = [];
    const { succeeded, failed } = await deployWithMigrationGate({
      functions: [
        {
          slug: 'send-quote-email',
          requiredMigrations: [{ path: QUOTE_EMAIL_MIGRATION, version: '20260909193000' }],
        },
      ],
      listAppliedVersions: () => parseAppliedVersionsFromMigrationList(CLI_TABLE_WITHOUT_NAMES),
      appliedSource: 'cli-fallback',
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'Deployed' };
      },
    });
    expect(seen).toEqual([]);
    expect(succeeded).toEqual([]);
    expect(failed).toHaveLength(1);
    expect(failed[0].detail).toContain('not applied in production');
    expect(failed[0].detail).toContain('fell back to the CLI');
    expect(failed[0].detail).toContain('could not match by name');
    expect(failed[0].detail).not.toContain('DEPLOY_TREAT_APPLIED');
    expect(failed[0].detail).not.toContain('treat_applied');
  });

  it('falls back to the CLI when the Management API fails and skips migration-dependent functions', async () => {
    const seen: string[] = [];
    const lines: string[] = [];
    let cliCalled = false;
    const { succeeded, failed, appliedLookupFailed, appliedSource } = await deployWithMigrationGate({
      functions: [
        { slug: 'send-sms', requiredMigrations: [] },
        {
          slug: 'send-quote-email',
          requiredMigrations: [{ path: QUOTE_EMAIL_MIGRATION, version: '20260909193000' }],
        },
      ],
      listFromManagementApi: async () => {
        throw new Error('HTTP 401');
      },
      listFromCli: () => {
        cliCalled = true;
        return parseAppliedVersionsFromMigrationList(CLI_JSON_VERSIONS_ONLY);
      },
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'Deployed' };
      },
      log: (line: string) => {
        lines.push(line);
      },
    });
    expect(cliCalled).toBe(true);
    expect(appliedLookupFailed).toBe(false);
    expect(appliedSource).toBe('cli-fallback');
    expect(seen).toEqual(['send-sms']);
    expect(succeeded.map((item) => item.slug)).toEqual(['send-sms']);
    expect(failed.map((item) => item.slug)).toEqual(['send-quote-email']);
    expect(failed[0].detail).toContain('not applied in production');
    expect(failed[0].detail).toContain('fell back to the CLI');
    expect(failed[0].detail).toContain('could not match by name');
    expect(failed[0].detail).not.toContain('DEPLOY_TREAT_APPLIED');
    expect(failed[0].detail).not.toContain('treat_applied');
    expect(lines.join('')).toContain('via CLI fallback');
  });

  it('degrades like an unreadable list when Management API and CLI both fail', async () => {
    const seen: string[] = [];
    const { succeeded, failed, appliedLookupFailed } = await deployWithMigrationGate({
      functions: [
        { slug: 'send-sms', requiredMigrations: [] },
        {
          slug: 'send-quote-email',
          requiredMigrations: [{ path: QUOTE_EMAIL_MIGRATION, version: '20260909193000' }],
        },
      ],
      listFromManagementApi: async () => {
        throw new Error('HTTP 500');
      },
      listFromCli: () => {
        throw new Error('could not connect to remote database');
      },
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'Deployed' };
      },
    });
    expect(appliedLookupFailed).toBe(true);
    expect(seen).toEqual(['send-sms']);
    expect(succeeded.map((item) => item.slug)).toEqual(['send-sms']);
    expect(failed.map((item) => item.slug)).toEqual(['send-quote-email']);
    expect(failed[0].detail).toContain('could not read applied migrations');
    expect(failed[0].detail).toContain('unreadable list');
    expect(failed[0].detail).not.toContain('not applied in production');
    expect(failed.length).toBeGreaterThan(0);
  });

  it('cannot deadlock after MCP apply: Management API name match deploys on rerun', async () => {
    const target = {
      slug: 'send-quote-email',
      requiredMigrations: [{ path: QUOTE_EMAIL_MIGRATION, version: '20260909193000' }],
    };
    const seen: string[] = [];
    const deployOne = (slug: string) => {
      seen.push(slug);
      return { ok: true, detail: 'Deployed' };
    };

    const firstPush = await deployWithMigrationGate({
      functions: [target],
      listFromManagementApi: async () => [
        { version: '20260909164256', name: 'quote_email_delivery_audit' },
      ],
      listFromCli: () => {
        throw new Error('cli should not run');
      },
      deployOne,
    });
    expect(firstPush.failed.map((item) => item.slug)).toEqual(['send-quote-email']);
    expect(firstPush.failed[0].detail).not.toContain('DEPLOY_TREAT_APPLIED');
    expect(firstPush.failed[0].detail).not.toContain('treat_applied');
    expect(seen).toEqual([]);

    const rerun = await deployWithMigrationGate({
      functions: [target],
      listFromManagementApi: async () => [...MCP_LEDGER_ROWS],
      listFromCli: () => {
        throw new Error('cli should not run');
      },
      deployOne,
    });
    expect(rerun.failed).toEqual([]);
    expect(rerun.succeeded.map((item) => item.slug)).toEqual(['send-quote-email']);
    expect(rerun.appliedSource).toBe('management-api');
    expect(seen).toEqual(['send-quote-email']);
  });
});

describe('Management API applied-migrations read', () => {
  it('feeds Management API {version, name} rows and does not call the CLI', async () => {
    let cliCalled = false;
    const lookup = await readAppliedMigrationsWithFallback({
      listFromManagementApi: async () => [...MCP_LEDGER_ROWS],
      listFromCli: () => {
        cliCalled = true;
        return parseAppliedVersionsFromMigrationList(CLI_JSON_VERSIONS_ONLY);
      },
    });
    expect(cliCalled).toBe(false);
    expect(lookup.source).toBe('management-api');
    expect(lookup.rows).toEqual([...MCP_LEDGER_ROWS]);
  });

  it('reads version and name from the Management API payload used by drift-watch', async () => {
    const rows = await listAppliedMigrationsFromManagementApi({
      token: 'sbp_test',
      projectRef: 'eutsoqdpjurknjsshxes',
      fetchJsonImpl: async (url: string, headers: Record<string, string>) => {
        expect(url).toBe('https://api.supabase.com/v1/projects/eutsoqdpjurknjsshxes/database/migrations');
        expect(headers.Authorization).toBe('Bearer sbp_test');
        return { ok: true, status: 200, data: [...MCP_LEDGER_ROWS] };
      },
    });
    expect(rows).toEqual([
      { version: '20260909194905', name: 'serialize_quote_email_delivery_failed_retry_claim' },
      { version: '20260909164256', name: 'quote_email_delivery_audit' },
    ]);
  });
});

describe('applied migration list parse', () => {
  it('reads remote versions from the CLI table and ignores local-only rows', () => {
    const table = [
      '        LOCAL      │     REMOTE     │     TIME (UTC)',
      '  ─────────────────┼────────────────┼──────────────────────',
      '                   │ 20230103054303 │ 2023-01-03 05:43:03',
      '    20230103054315 │                │ 2023-01-03 05:43:15',
      '    20240414044403 │ 20240414044403 │ 2024-04-14 04:44:03',
    ].join('\n');
    expect(parseAppliedVersionsFromMigrationList(table)).toEqual(['20230103054303', '20240414044403']);
  });

  it('reads remote versions from backtick-wrapped table cells and from JSON', () => {
    const table = [
      'Local | Remote | Time (UTC)',
      '`20220727064247` | ` ` | `2022-07-27 06:42:47`',
      '` ` | `20220727064248` | `2022-07-27 06:42:48`',
    ].join('\n');
    expect(parseAppliedVersionsFromMigrationList(table)).toEqual(['20220727064248']);
    expect(
      parseAppliedVersionsFromMigrationList(
        JSON.stringify({
          migrations: [
            { local: '20240101000000', remote: '20240101000000', time: '2024-01-01 00:00:00' },
            { local: '20240102000000', remote: '', time: '2024-01-02 00:00:00' },
          ],
        }),
      ),
    ).toEqual(['20240101000000']);
  });

  it('reads version and name from JSON-with-names output', () => {
    expect(parseAppliedVersionsFromMigrationList(CLI_JSON_WITH_NAMES)).toEqual([
      { version: '20260909194905', name: 'serialize_quote_email_delivery_failed_retry_claim' },
      { version: '20260909164256', name: 'quote_email_delivery_audit' },
    ]);
  });

  it('reads versions only from the pinned CLI table and from JSON without names', () => {
    expect(parseAppliedVersionsFromMigrationList(CLI_TABLE_WITHOUT_NAMES)).toEqual([
      '20260909164256',
      '20260909194905',
    ]);
    expect(parseAppliedVersionsFromMigrationList(CLI_JSON_VERSIONS_ONLY)).toEqual([
      '20260909164256',
      '20260909194905',
    ]);
  });

  it('reads a name column from a table when one is present', () => {
    const table = [
      'LOCAL | REMOTE | NAME | TIME (UTC)',
      ' | 20260909194905 | serialize_quote_email_delivery_failed_retry_claim | 2026-09-09 19:49:05',
    ].join('\n');
    expect(parseAppliedVersionsFromMigrationList(table)).toEqual([
      { version: '20260909194905', name: 'serialize_quote_email_delivery_failed_retry_claim' },
    ]);
  });

  it('requests JSON output and falls back to the table when the flag is unsupported', () => {
    const seen: string[][] = [];
    const rows = readAppliedMigrationsFromCli((extra) => {
      seen.push(extra);
      if (extra.length) {
        const error = new Error(`unknown flag: ${extra[0]}`);
        throw error;
      }
      return CLI_TABLE_WITHOUT_NAMES;
    });
    expect(seen[0]).toEqual(['--output-format', 'json']);
    expect(seen[1]).toEqual(['--output', 'json']);
    expect(seen[2]).toEqual(['-o', 'json']);
    expect(seen[3]).toEqual([]);
    expect(rows).toEqual(['20260909164256', '20260909194905']);
  });

  it('does not fall back when JSON listing fails for a reason other than an unsupported flag', () => {
    expect(() =>
      readAppliedMigrationsFromCli(() => {
        throw new Error('network down');
      }),
    ).toThrow(/network down/);
  });

  it('recognizes unsupported output flags and ignores unrelated CLI failures', () => {
    expect(isUnsupportedMigrationListOutputFlag(new Error('unknown flag: --output-format'))).toBe(true);
    expect(isUnsupportedMigrationListOutputFlag(new Error('could not connect to remote database'))).toBe(
      false,
    );
  });

  it('fails closed on empty or unrecognized CLI output', () => {
    expect(() => parseAppliedVersionsFromMigrationList('')).toThrow(/empty output/);
    expect(() => parseAppliedVersionsFromMigrationList('Connecting to remote database...')).toThrow(
      /not a recognized table or JSON/,
    );
    expect(() => parseAppliedVersionsFromMigrationList('{"ok":true}')).toThrow(/migrations array/);
  });

  it('returns an empty list for a well-formed listing with no remote rows', () => {
    const table = [
      '        LOCAL      │     REMOTE     │     TIME (UTC)',
      '  ─────────────────┼────────────────┼──────────────────────',
    ].join('\n');
    expect(parseAppliedVersionsFromMigrationList(table)).toEqual([]);
    expect(parseAppliedVersionsFromMigrationList(JSON.stringify({ migrations: [] }))).toEqual([]);
  });
});

describe('deploy summary', () => {
  it('lists succeeded and failed slugs and states that migrations are not applied', () => {
    const markdown = formatFunctionsDeployMarkdown({
      from: 'aaa',
      to: 'bbb',
      targets: [
        { slug: 'send-sms', reasons: ['direct file change (index.ts)'] },
        { slug: 'ai-chatbot', reasons: ['imports changed _shared (cors.ts)'] },
      ],
      migrations: ['supabase/migrations/20260909000000_brand_new.sql'],
      succeeded: [{ slug: 'send-sms', detail: 'ok' }],
      failed: [{ slug: 'ai-chatbot', detail: 'bundle failed' }],
    });
    expect(markdown).toContain('never runs `supabase db push`');
    expect(markdown).toContain('newly required migrations are not applied');
    expect(markdown).toContain('Paired public chat and Realtime functions fail closed');
    expect(markdown).toContain('A local key is not production proof');
    expect(markdown).toContain('Sequential deploys in one job are not atomic');
    expect(markdown).toContain('`send-sms` — direct file change (index.ts)');
    expect(markdown).toContain('Succeeded (1): `send-sms`');
    expect(markdown).toContain('Failed (1):');
    expect(markdown).toContain('`ai-chatbot` — bundle failed');
    expect(markdown).toContain('NOT applied');
    expect(markdown).toContain('20260909000000_brand_new.sql');
  });

  it('skips unresolved cron-auth functions and still deploys unrelated slugs', async () => {
    const seen: string[] = [];
    const { succeeded, failed } = await deployWithMigrationGate({
      functions: [
        {
          slug: 'check-expiring-promotions',
          requiredMigrations: [],
          explicitDeployBlock: 'unresolved release prerequisite for `check-expiring-promotions`: caller migration is not authorable',
        },
        { slug: 'send-sms', requiredMigrations: [] },
      ],
      listAppliedVersions: () => [{ version: '20260815160000' }],
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'Deployed' };
      },
    });
    expect(seen).toEqual(['send-sms']);
    expect(succeeded.map((item) => item.slug)).toEqual(['send-sms']);
    expect(failed.map((item) => item.slug)).toEqual(['check-expiring-promotions']);
    expect(failed[0].detail).toContain('explicit release prerequisite');
    expect(failed[0].detail).not.toContain('not applied in production');
  });

  it('skips unresolved cron-auth functions even when the applied list is unreadable', async () => {
    const seen: string[] = [];
    const { succeeded, failed, appliedLookupFailed } = await deployWithMigrationGate({
      functions: [
        {
          slug: 'sync-lightspeed-inventory',
          requiredMigrations: [],
          explicitDeployBlock: 'unresolved release prerequisite for `sync-lightspeed-inventory`: caller migration is not authorable',
        },
        { slug: 'send-sms', requiredMigrations: [] },
      ],
      listAppliedVersions: () => {
        throw new Error('network down');
      },
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'Deployed' };
      },
    });
    expect(appliedLookupFailed).toBe(true);
    expect(seen).toEqual(['send-sms']);
    expect(succeeded.map((item) => item.slug)).toEqual(['send-sms']);
    expect(failed.map((item) => item.slug)).toEqual(['sync-lightspeed-inventory']);
    expect(failed[0].detail).toContain('explicit release prerequisite');
    expect(failed[0].detail).not.toContain('could not read applied migrations');
  });

  it('deploys a resolved cron-auth function only after the mapped migration is applied', async () => {
    const required = [
      { path: 'supabase/migrations/20990101000001_synthetic_caller_fixture.sql', version: '20990101000001' },
    ];
    const seen: string[] = [];
    const blocked = await deployWithMigrationGate({
      functions: [{ slug: 'check-expiring-promotions', requiredMigrations: required }],
      listAppliedVersions: () => [{ version: '20260815160000' }],
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'Deployed' };
      },
    });
    expect(seen).toEqual([]);
    expect(blocked.failed[0].detail).toContain('20990101000001_synthetic_caller_fixture.sql');
    expect(blocked.failed[0].detail).toContain('not applied in production');

    const allowed = await deployWithMigrationGate({
      functions: [{ slug: 'check-expiring-promotions', requiredMigrations: required }],
      listAppliedVersions: () => [{ version: '20990101000001' }],
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'Deployed' };
      },
    });
    expect(seen).toEqual(['check-expiring-promotions']);
    expect(allowed.succeeded.map((item) => item.slug)).toEqual(['check-expiring-promotions']);
    expect(allowed.failed).toEqual([]);
  });

  it('notes a large _shared fan-out', () => {
    const targets = Array.from({ length: 12 }, (_, index) => ({
      slug: `fn-${index}`,
      reasons: ['imports changed _shared (cors.ts)'],
    }));
    const markdown = formatFunctionsDeployMarkdown({
      targets,
      succeeded: targets.map((item) => ({ slug: item.slug, detail: '' })),
      failed: [],
    });
    expect(markdown).toContain('Large fan-out: **12** functions');
  });

  it('names an allowlisted pair selector and a conflicting selector refusal', () => {
    expect(
      formatFunctionsDeployMarkdown({
        forcedPair: 'openai-realtime',
        targets: [
          { slug: 'realtime-session', reasons: ['workflow_dispatch pair openai-realtime'] },
          { slug: 'realtime-sdp-exchange', reasons: ['workflow_dispatch pair openai-realtime'] },
        ],
        succeeded: [],
        failed: [],
      }),
    ).toContain('Manual deploy of pair `openai-realtime`.');
    expect(
      formatFunctionsDeployMarkdown({
        forced: 'ai-chatbot',
        forcedPair: 'site-chat',
        skipped: true,
        skipReason: 'refused: DEPLOY_FUNCTION and DEPLOY_PAIR cannot both be set. Nothing was deployed.',
      }),
    ).toContain('Refused combined selectors: function `ai-chatbot` and pair `site-chat`.');
  });
});

const ATTESTED_CHAT = {
  'site-chat': {
    status: 'ATTESTED',
    productionKeyProvenance:
      'supabase-production-secrets-read-plus-openai-project-behind-production-OPENAI_API_KEY',
    attestedModels: ['gpt-5.6-luna'],
    attestedKeys: ['OPENAI_API_KEY'],
  },
};

const ATTESTED_REALTIME = {
  'openai-realtime': {
    status: 'ATTESTED',
    productionKeyProvenance:
      'supabase-production-secrets-read-plus-openai-project-behind-production-OPENAI_API_KEY',
    attestedModels: ['gpt-realtime-2.1-mini'],
    attestedKeys: ['OPENAI_API_KEY'],
  },
};

describe('public pair release holds', () => {
  it('invokes zero deploy calls when attestation is unverified for a complete chat pair', async () => {
    const seen: string[] = [];
    const { succeeded, failed } = await deployWithMigrationGate({
      functions: [
        { slug: 'ai-chatbot', requiredMigrations: [] },
        { slug: 'ai-chatbot-stream', requiredMigrations: [] },
      ],
      listAppliedVersions: () => [],
      env: { OPENAI_API_KEY: 'sk-local-not-production-proof' },
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'Deployed' };
      },
    });
    expect(seen).toEqual([]);
    expect(succeeded).toEqual([]);
    expect(failed.map((item) => item.slug)).toEqual(['ai-chatbot', 'ai-chatbot-stream']);
    expect(failed[0].detail).toMatch(/attestation is unverified/);
    expect(failed[0].detail).not.toContain('sk-local-not-production-proof');
  });

  it('invokes zero pair deploy calls for missing or unknown key/model attestation', async () => {
    const cases = [
      { 'site-chat': { status: 'MISSING' } },
      { 'site-chat': { status: 'UNKNOWN' } },
      {
        'site-chat': {
          status: 'ATTESTED',
          productionKeyProvenance:
            'supabase-production-secrets-read-plus-openai-project-behind-production-OPENAI_API_KEY',
          attestedModels: [],
          attestedKeys: ['OPENAI_API_KEY'],
        },
      },
      {
        'site-chat': {
          status: 'ATTESTED',
          productionKeyProvenance: 'local dotenv',
          attestedModels: ['gpt-5.6-luna'],
          attestedKeys: ['OPENAI_API_KEY'],
        },
      },
    ];
    for (const releaseAttestations of cases) {
      const seen: string[] = [];
      const { failed } = await deployWithMigrationGate({
        functions: [
          { slug: 'ai-chatbot', requiredMigrations: [] },
          { slug: 'ai-chatbot-stream', requiredMigrations: [] },
        ],
        listAppliedVersions: () => [],
        releaseAttestations,
        deployOne: (slug: string) => {
          seen.push(slug);
          return { ok: true, detail: 'Deployed' };
        },
      });
      expect(seen).toEqual([]);
      expect(failed).toHaveLength(2);
    }
  });

  it('invokes zero pair deploy calls for a one-sided attested selection', async () => {
    const seen: string[] = [];
    const { succeeded, failed } = await deployWithMigrationGate({
      functions: [
        { slug: 'realtime-session', requiredMigrations: [] },
        { slug: 'send-sms', requiredMigrations: [] },
      ],
      listAppliedVersions: () => [],
      releaseAttestations: ATTESTED_REALTIME,
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'Deployed' };
      },
    });
    expect(seen).toEqual(['send-sms']);
    expect(succeeded.map((item) => item.slug)).toEqual(['send-sms']);
    expect(failed.map((item) => item.slug)).toEqual(['realtime-session']);
    expect(failed[0].detail).toMatch(/pair is incomplete/);
  });

  it('blocks both pair members when one required migration is missing', async () => {
    const seen: string[] = [];
    const { succeeded, failed } = await deployWithMigrationGate({
      functions: [
        { slug: 'ai-chatbot', requiredMigrations: [] },
        {
          slug: 'ai-chatbot-stream',
          requiredMigrations: [{ path: QUOTE_EMAIL_MIGRATION, version: '20260909193000' }],
        },
        { slug: 'send-sms', requiredMigrations: [] },
      ],
      listAppliedVersions: () => [{ version: '20260815160000' }],
      releaseAttestations: ATTESTED_CHAT,
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'Deployed' };
      },
    });
    expect(seen).toEqual(['send-sms']);
    expect(succeeded.map((item) => item.slug)).toEqual(['send-sms']);
    expect(failed.map((item) => item.slug)).toEqual(['ai-chatbot', 'ai-chatbot-stream']);
    expect(failed[0].detail).toMatch(/pair member precondition failed/);
    expect(failed[0].detail).toContain('20260909193000_serialize_quote_email_delivery_failed_retry_claim.sql');
  });

  it('blocks the whole attested pair when migration lookup fails for one member', async () => {
    const seen: string[] = [];
    const { succeeded, failed } = await deployWithMigrationGate({
      functions: [
        { slug: 'ai-chatbot', requiredMigrations: [] },
        {
          slug: 'ai-chatbot-stream',
          requiredMigrations: [{ path: QUOTE_EMAIL_MIGRATION, version: '20260909193000' }],
        },
      ],
      listAppliedVersions: () => {
        throw new Error('network down');
      },
      releaseAttestations: ATTESTED_CHAT,
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'Deployed' };
      },
    });
    expect(seen).toEqual([]);
    expect(succeeded).toEqual([]);
    expect(failed.map((item) => item.slug)).toEqual(['ai-chatbot', 'ai-chatbot-stream']);
    expect(failed[0].detail).toMatch(/pair member precondition failed/);
    expect(failed[0].detail).toContain('could not read applied migrations');
  });

  it('still deploys an unprotected function next to a held pair', async () => {
    const seen: string[] = [];
    const { succeeded, failed } = await deployWithMigrationGate({
      functions: [
        { slug: 'send-sms', requiredMigrations: [] },
        { slug: 'ai-chatbot', requiredMigrations: [] },
        { slug: 'ai-chatbot-stream', requiredMigrations: [] },
      ],
      listAppliedVersions: () => [],
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'Deployed' };
      },
    });
    expect(seen).toEqual(['send-sms']);
    expect(succeeded.map((item) => item.slug)).toEqual(['send-sms']);
    expect(failed.map((item) => item.slug)).toEqual(['ai-chatbot', 'ai-chatbot-stream']);
  });

  it('deploys a complete attested pair and leaves an unverified sibling pair held', async () => {
    const seen: string[] = [];
    const { succeeded, failed } = await deployWithMigrationGate({
      functions: [
        { slug: 'ai-chatbot', requiredMigrations: [] },
        { slug: 'ai-chatbot-stream', requiredMigrations: [] },
        { slug: 'realtime-session', requiredMigrations: [] },
        { slug: 'realtime-sdp-exchange', requiredMigrations: [] },
      ],
      listAppliedVersions: () => [],
      releaseAttestations: ATTESTED_CHAT,
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'Deployed' };
      },
    });
    expect(seen).toEqual(['ai-chatbot', 'ai-chatbot-stream']);
    expect(succeeded.map((item) => item.slug)).toEqual(['ai-chatbot', 'ai-chatbot-stream']);
    expect(failed.map((item) => item.slug)).toEqual(['realtime-session', 'realtime-sdp-exchange']);
  });

  it('blocks a forced one-sided chat slug through runDeploy with zero deploy calls', async () => {
    const seen: string[] = [];
    const code = await runDeploy({
      env: {
        DEPLOY_FUNCTION: 'ai-chatbot',
        DEPLOY_FROM: 'HEAD',
        DEPLOY_TO: 'HEAD',
        OPENAI_API_KEY: 'sk-local-not-production-proof',
      },
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'ok' };
      },
      listAppliedVersions: () => [],
    });
    expect(code).toBe(1);
    expect(seen).toEqual([]);
  });

  it('blocks a forced one-sided Realtime slug through runDeploy with zero deploy calls', async () => {
    const seen: string[] = [];
    const code = await runDeploy({
      env: {
        DEPLOY_FUNCTION: 'realtime-sdp-exchange',
        DEPLOY_FROM: 'HEAD',
        DEPLOY_TO: 'HEAD',
      },
      releaseAttestations: ATTESTED_REALTIME,
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'ok' };
      },
      listAppliedVersions: () => [],
    });
    expect(code).toBe(1);
    expect(seen).toEqual([]);
  });

  it('keeps unprotected forced selection deployable', async () => {
    const seen: string[] = [];
    const code = await runDeploy({
      env: {
        DEPLOY_FUNCTION: 'send-sms',
        DEPLOY_FROM: 'HEAD',
        DEPLOY_TO: 'HEAD',
      },
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'ok' };
      },
      listAppliedVersions: () => [],
      listSecretNamesFromApi: async () => ['TWILIO_WEBHOOK_URL'],
    });
    expect(code).toBe(0);
    expect(seen).toEqual(['send-sms']);
  });

  it('holds a normal one-sided chat diff and still deploys an unprotected sibling', async () => {
    const seen: string[] = [];
    const code = await runDeploy({
      env: {
        DEPLOY_FROM: 'HEAD',
        DEPLOY_TO: 'HEAD',
      },
      diffEntries: [
        { status: 'M', path: 'supabase/functions/ai-chatbot/index.ts' },
        { status: 'M', path: 'supabase/functions/send-sms/index.ts' },
      ],
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'ok' };
      },
      listAppliedVersions: () => [],
      listSecretNamesFromApi: async () => ['TWILIO_WEBHOOK_URL'],
    });
    expect(code).toBe(1);
    expect(seen).toEqual(['send-sms']);
  });

  it('holds a normal complete chat selection until production attestation exists', async () => {
    const seen: string[] = [];
    const code = await runDeploy({
      env: {
        DEPLOY_FROM: 'HEAD',
        DEPLOY_TO: 'HEAD',
      },
      diffEntries: [
        { status: 'M', path: 'supabase/functions/ai-chatbot/index.ts' },
        { status: 'M', path: 'supabase/functions/ai-chatbot-stream/index.ts' },
      ],
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'ok' };
      },
      listAppliedVersions: () => [],
    });
    expect(code).toBe(1);
    expect(seen).toEqual([]);
  });

  it('deploys a normal complete chat selection only after production attestation', async () => {
    const seen: string[] = [];
    const code = await runDeploy({
      env: {
        DEPLOY_FROM: 'HEAD',
        DEPLOY_TO: 'HEAD',
      },
      diffEntries: [
        { status: 'M', path: 'supabase/functions/ai-chatbot/index.ts' },
        { status: 'M', path: 'supabase/functions/ai-chatbot-stream/index.ts' },
      ],
      releaseAttestations: ATTESTED_CHAT,
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'ok' };
      },
      listAppliedVersions: () => [],
    });
    expect(code).toBe(0);
    expect(seen.sort()).toEqual(['ai-chatbot', 'ai-chatbot-stream']);
  });

  it('holds both pairs on a shared fan-out and still deploys unprotected importers', async () => {
    const seen: string[] = [];
    const code = await runDeploy({
      env: {
        DEPLOY_FROM: 'HEAD',
        DEPLOY_TO: 'HEAD',
      },
      diffEntries: [{ status: 'M', path: 'supabase/functions/_shared/rate-limit.ts' }],
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'ok' };
      },
      listAppliedVersions: () => [],
      listSecretNamesFromApi: async () => ['TWILIO_WEBHOOK_URL'],
    });
    expect(seen).not.toContain('ai-chatbot');
    expect(seen).not.toContain('ai-chatbot-stream');
    expect(seen).not.toContain('realtime-session');
    expect(seen).not.toContain('realtime-sdp-exchange');
    expect(seen).toEqual(expect.arrayContaining(['send-sms', 'elevenlabs-conversation-token']));
    expect(code).toBe(1);
  });

  it('holds DEPLOY_PAIR=site-chat under the default UNVERIFIED attestation', async () => {
    const seen: string[] = [];
    const code = await runDeploy({
      env: {
        DEPLOY_PAIR: 'site-chat',
        DEPLOY_FROM: 'HEAD',
        DEPLOY_TO: 'HEAD',
      },
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'ok' };
      },
      listAppliedVersions: () => [],
    });
    expect(code).toBe(1);
    expect(seen).toEqual([]);
  });

  it('holds DEPLOY_PAIR=openai-realtime under the default UNVERIFIED attestation', async () => {
    const seen: string[] = [];
    const code = await runDeploy({
      env: {
        DEPLOY_PAIR: 'openai-realtime',
        DEPLOY_FROM: 'HEAD',
        DEPLOY_TO: 'HEAD',
      },
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'ok' };
      },
      listAppliedVersions: () => [],
    });
    expect(code).toBe(1);
    expect(seen).toEqual([]);
  });

  it('invokes zero deploy calls for an unknown pair id', async () => {
    const seen: string[] = [];
    const code = await runDeploy({
      env: {
        DEPLOY_PAIR: 'not-a-pair',
        DEPLOY_FROM: 'HEAD',
        DEPLOY_TO: 'HEAD',
      },
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'ok' };
      },
      listAppliedVersions: () => [],
    });
    expect(code).toBe(1);
    expect(seen).toEqual([]);
  });

  it('invokes zero deploy calls when DEPLOY_FUNCTION and DEPLOY_PAIR conflict', async () => {
    const seen: string[] = [];
    const code = await runDeploy({
      env: {
        DEPLOY_FUNCTION: 'ai-chatbot',
        DEPLOY_PAIR: 'site-chat',
        DEPLOY_FROM: 'HEAD',
        DEPLOY_TO: 'HEAD',
      },
      releaseAttestations: ATTESTED_CHAT,
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'ok' };
      },
      listAppliedVersions: () => [],
    });
    expect(code).toBe(1);
    expect(seen).toEqual([]);
  });

  it('selects exactly the chat pair when DEPLOY_PAIR=site-chat is injected as attested', async () => {
    const seen: string[] = [];
    const code = await runDeploy({
      env: {
        DEPLOY_PAIR: 'site-chat',
        DEPLOY_FROM: 'HEAD',
        DEPLOY_TO: 'HEAD',
      },
      releaseAttestations: ATTESTED_CHAT,
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'ok' };
      },
      listAppliedVersions: () => [],
    });
    expect(code).toBe(0);
    expect(seen).toEqual(['ai-chatbot', 'ai-chatbot-stream']);
  });

  it('selects exactly the Realtime pair when DEPLOY_PAIR=openai-realtime is injected as attested', async () => {
    const seen: string[] = [];
    const code = await runDeploy({
      env: {
        DEPLOY_PAIR: 'openai-realtime',
        DEPLOY_FROM: 'HEAD',
        DEPLOY_TO: 'HEAD',
      },
      releaseAttestations: ATTESTED_REALTIME,
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'ok' };
      },
      listAppliedVersions: () => [],
    });
    expect(code).toBe(0);
    expect(seen).toEqual(['realtime-session', 'realtime-sdp-exchange']);
  });

  it('does not bypass requiredMigrationsForSlug when building a dispatched pair', () => {
    const pair = PUBLIC_RELEASE_PAIRS.find((item) => item.id === 'site-chat')!;
    const tree = {
      'supabase/functions/ai-chatbot/index.ts': 'await supabase.from("chat_leads").insert({});',
      'supabase/functions/ai-chatbot-stream/index.ts': 'export {}',
      'supabase/migrations/20260101000001_create_leads.sql': `
        CREATE TABLE public.chat_leads (
          id uuid PRIMARY KEY
        );
      `,
    };
    const rangeTargets = {
      functions: [],
      migrations: ['supabase/migrations/20260101000001_create_leads.sql'],
    };
    const dispatched = buildDispatchPairTargets(pair, tree, rangeTargets);
    expect(dispatched.map((item) => item.slug)).toEqual(['ai-chatbot', 'ai-chatbot-stream']);
    expect(requiredMigrationsForDispatch('ai-chatbot', tree, rangeTargets)).toEqual(
      dispatched[0].requiredMigrations,
    );
    expect(dispatched[0].requiredMigrations).toEqual([
      expect.objectContaining({
        path: 'supabase/migrations/20260101000001_create_leads.sql',
        version: '20260101000001',
      }),
    ]);
    expect(dispatched[1].requiredMigrations).toEqual([]);
  });
});

describe('TWILIO_WEBHOOK_URL deploy preflight', () => {
  it('fails closed for send-sms and notification-webhook when the secret name is missing', async () => {
    const seen: string[] = [];
    const { succeeded, failed } = await deployWithMigrationGate({
      functions: [
        { slug: 'send-sms', requiredMigrations: [] },
        { slug: 'notification-webhook', requiredMigrations: [] },
        { slug: 'hbw-valuation-proxy', requiredMigrations: [] },
      ],
      listAppliedVersions: () => [],
      secretNames: ['TWILIO_AUTH_TOKEN'],
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'ok' };
      },
    });
    expect(seen).toEqual(['hbw-valuation-proxy']);
    expect(succeeded.map((item) => item.slug)).toEqual(['hbw-valuation-proxy']);
    expect(failed.map((item) => item.slug).sort()).toEqual(['notification-webhook', 'send-sms']);
    expect(failed.every((item) => String(item.detail).includes('TWILIO_WEBHOOK_URL is missing'))).toBe(true);
  });

  it('fails closed when the secret-name list is unreadable', async () => {
    const seen: string[] = [];
    const { failed } = await deployWithMigrationGate({
      functions: [{ slug: 'notification-webhook', requiredMigrations: [] }],
      listAppliedVersions: () => [],
      listSecretNames: async () => {
        throw new Error('secrets list unavailable');
      },
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'ok' };
      },
    });
    expect(seen).toEqual([]);
    expect(failed).toHaveLength(1);
    expect(String(failed[0].detail)).toMatch(/secret-name list is unreadable/);
  });

  it('runDeploy looks up names for the resolved project and deploys when present', async () => {
    const seen: string[] = [];
    const lookups: string[] = [];
    const code = await runDeploy({
      env: {
        DEPLOY_FUNCTION: 'send-sms',
        SUPABASE_PROJECT_REF: 'eutsoqdpjurknjsshxes',
        DEPLOY_FROM: 'HEAD',
        DEPLOY_TO: 'HEAD',
      },
      listAppliedVersions: () => [],
      listSecretNamesFromApi: async ({ projectRef }: { projectRef: string }) => {
        lookups.push(projectRef);
        return {
          projectRef,
          names: ['TWILIO_AUTH_TOKEN', 'TWILIO_WEBHOOK_URL'],
        };
      },
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'ok' };
      },
    });
    expect(lookups).toEqual(['eutsoqdpjurknjsshxes']);
    expect(code).toBe(0);
    expect(seen).toEqual(['send-sms']);
  });

  it('runDeploy fails closed when TWILIO_WEBHOOK_URL is absent from the looked-up names', async () => {
    const seen: string[] = [];
    const code = await runDeploy({
      env: {
        DEPLOY_FUNCTION: 'notification-webhook',
        SUPABASE_PROJECT_REF: 'eutsoqdpjurknjsshxes',
        DEPLOY_FROM: 'HEAD',
        DEPLOY_TO: 'HEAD',
      },
      listAppliedVersions: () => [],
      listSecretNamesFromApi: async () => ['TWILIO_AUTH_TOKEN'],
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'ok' };
      },
    });
    expect(code).toBe(1);
    expect(seen).toEqual([]);
  });

  it('runDeploy fails closed when the secret-name lookup is unreadable', async () => {
    const seen: string[] = [];
    const code = await runDeploy({
      env: {
        DEPLOY_FUNCTION: 'send-sms',
        SUPABASE_PROJECT_REF: 'eutsoqdpjurknjsshxes',
        DEPLOY_FROM: 'HEAD',
        DEPLOY_TO: 'HEAD',
      },
      listAppliedVersions: () => [],
      listSecretNamesFromApi: async () => {
        throw new Error('secrets list unavailable');
      },
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'ok' };
      },
    });
    expect(code).toBe(1);
    expect(seen).toEqual([]);
  });

  it('runDeploy fails closed when the secrets adapter reports a different project', async () => {
    const seen: string[] = [];
    const code = await runDeploy({
      env: {
        DEPLOY_FUNCTION: 'send-sms',
        SUPABASE_PROJECT_REF: 'eutsoqdpjurknjsshxes',
        DEPLOY_FROM: 'HEAD',
        DEPLOY_TO: 'HEAD',
      },
      listAppliedVersions: () => [],
      listSecretNamesFromApi: async () => ({
        projectRef: 'wrongprojectrefxxxx',
        names: ['TWILIO_WEBHOOK_URL'],
      }),
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'ok' };
      },
    });
    expect(code).toBe(1);
    expect(seen).toEqual([]);
  });

  it('runDeploy uses a fake CLI list bound to the resolved project and never keeps digests', async () => {
    const seen: string[] = [];
    const cliRefs: string[] = [];
    const code = await runDeploy({
      env: {
        DEPLOY_FUNCTION: 'send-sms',
        SUPABASE_PROJECT_REF: 'eutsoqdpjurknjsshxes',
        DEPLOY_FROM: 'HEAD',
        DEPLOY_TO: 'HEAD',
      },
      listAppliedVersions: () => [],
      listSecretNamesFromCli: async ({ projectRef }: { projectRef: string }) => {
        cliRefs.push(projectRef);
        return pickSecretNames([
          { name: 'TWILIO_WEBHOOK_URL', value: 'must-not-leak', digest: 'a'.repeat(64) },
        ]);
      },
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'ok' };
      },
    });
    expect(cliRefs).toEqual(['eutsoqdpjurknjsshxes']);
    expect(managementApiSecretsUrl('eutsoqdpjurknjsshxes')).toBe(
      'https://api.supabase.com/v1/projects/eutsoqdpjurknjsshxes/secrets',
    );
    expect(code).toBe(0);
    expect(seen).toEqual(['send-sms']);
  });

  it('listEdgeSecretNamesForProject refuses a mismatched expected ref before any lookup', async () => {
    await expect(listEdgeSecretNamesForProject({
      projectRef: 'eutsoqdpjurknjsshxes',
      expectedProjectRef: 'otherprojectrefxxxx',
      listFromApi: async () => ['TWILIO_WEBHOOK_URL'],
    })).rejects.toMatchObject({ code: 'WRONG_PROJECT' });
  });

  it('deploys the pair when TWILIO_WEBHOOK_URL is present by name', async () => {
    const seen: string[] = [];
    const { succeeded, failed } = await deployWithMigrationGate({
      functions: [
        { slug: 'send-sms', requiredMigrations: [] },
        { slug: 'notification-webhook', requiredMigrations: [] },
      ],
      listAppliedVersions: () => [],
      secretNames: ['TWILIO_AUTH_TOKEN', 'TWILIO_WEBHOOK_URL'],
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'ok' };
      },
    });
    expect(seen).toEqual(['send-sms', 'notification-webhook']);
    expect(succeeded.map((item) => item.slug)).toEqual(['send-sms', 'notification-webhook']);
    expect(failed).toEqual([]);
  });
});

describe('cron-auth deploy path mapping', () => {
  it('blocks a manual single-function deploy from the unresolved on-disk manifest', async () => {
    const seen: string[] = [];
    const code = await runDeploy({
      env: {
        DEPLOY_FUNCTION: 'check-expiring-promotions',
        DEPLOY_FROM: 'HEAD',
        DEPLOY_TO: 'HEAD',
      },
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'ok' };
      },
      listAppliedVersions: () => [{ version: '20260815160000' }],
    });
    expect(code).toBe(1);
    expect(seen).toEqual([]);
  });

  it('blocks the other protected slug on the same manual path and does not invent a migration', async () => {
    const seen: string[] = [];
    const code = await runDeploy({
      env: {
        DEPLOY_FUNCTION: 'sync-lightspeed-inventory',
        DEPLOY_FROM: 'HEAD',
        DEPLOY_TO: 'HEAD',
      },
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'ok' };
      },
      listAppliedVersions: () => [{ version: '20260815160000' }],
    });
    expect(code).toBe(1);
    expect(seen).toEqual([]);
  });
});


describe('resolved cron prerequisite identity', () => {
  const slugs = ['check-expiring-promotions', 'sync-lightspeed-inventory'];
  const cases = slugs.flatMap((slug) => ['push', 'manual'].flatMap((mode) => [
    { slug, mode, path: 'supabase/migrations/20260815160000_unrelated.sql', version: '20260815160000' },
    { slug, mode, path: `supabase/migrations/${CRON_AUTH_CALLER_MIGRATION_VERSION}_unrelated.sql`, version: CRON_AUTH_CALLER_MIGRATION_VERSION },
  ]));
  it.each(cases)('rejects unrelated applied migration for $slug via $mode: $path', async ({slug, mode, path, version}) => {
    const tree = {
      [`supabase/functions/${slug}/index.ts`]: 'export {};',
      [path]: 'SELECT 1;',
      [CRON_AUTH_CALLER_MIGRATION_PATH]: 'SELECT cron.alter_job(job_id := 1);',
      [CRON_AUTH_RELEASE_PREREQUISITE_MANIFEST_PATH]: JSON.stringify({
        version: 1,
        protectedSlugs: slugs,
        slugs: Object.fromEntries(slugs.map((name) => [name, {status: 'resolved', path, version}])),
      }),
    };
    const targets = mode === 'push'
      ? deployTargetsFromDiff({diffEntries: [{status: 'M', path: `supabase/functions/${slug}/index.ts`}], files: tree}).functions
      : [{slug, ...releaseRequirementsForSlug(slug, tree, [])}];
    const seen: string[] = [];
    const result = await deployWithMigrationGate({
      functions: targets,
      listAppliedVersions: () => [{version}],
      deployOne: (name: string) => { seen.push(name); return {ok: true, detail: 'fake deployment'}; },
    });
    expect(seen).toEqual([]);
    expect(result.succeeded).toEqual([]);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0].detail).toContain('must name the accepted caller migration');
  });
});
