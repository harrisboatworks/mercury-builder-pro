import { describe, expect, it } from 'vitest';
import {
  deployFunctionSlugs,
  deployWithMigrationGate,
  formatAppliedMigrationsReadLine,
  formatFunctionsDeployMarkdown,
  isSafeFunctionSlug,
  parseAppliedVersionsFromMigrationList,
  projectRefFromConfig,
  redactSecrets,
  resolveForcedSlug,
  resolveProjectRef,
  runDeploy,
} from '../../scripts/deploy-supabase-functions.mjs';
import {
  projectRefFromConfig as sharedProjectRefFromConfig,
  resolveProjectRef as sharedResolveProjectRef,
} from '../../scripts/lib/supabase-project-ref.mjs';

const files = {
  'supabase/functions/send-sms/index.ts': 'export {}',
  'supabase/functions/ai-chatbot/index.ts': 'export {}',
  'supabase/functions/_shared/cors.ts': 'export const corsHeaders = {};',
};

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

  it('still deploys when SUPABASE_PROJECT_REF is unset because config.toml has project_id', () => {
    const seen: string[] = [];
    const code = runDeploy({
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

describe('migration apply-order gate', () => {
  it('deploys when the required migration is applied', () => {
    const seen: string[] = [];
    const { succeeded, failed } = deployWithMigrationGate({
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

  it('skips a function whose required migration is not applied and fails the run', () => {
    const seen: string[] = [];
    const { succeeded, failed } = deployWithMigrationGate({
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

  it('deploys a function with no migration dependency regardless of applied versions', () => {
    const seen: string[] = [];
    const { succeeded, failed } = deployWithMigrationGate({
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

  it('skips a migration-dependent function when the applied-versions lookup throws', () => {
    const seen: string[] = [];
    const lines: string[] = [];
    const env = { SUPABASE_ACCESS_TOKEN: 'sbp_secret_value' };
    const { succeeded, failed, appliedLookupFailed } = deployWithMigrationGate({
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

  it('deploys a migration-independent function when the applied-versions lookup throws', () => {
    const seen: string[] = [];
    const { succeeded, failed, appliedLookupFailed } = deployWithMigrationGate({
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

  it('deploys only migration-independent functions when the applied-versions lookup throws', () => {
    const seen: string[] = [];
    const { succeeded, failed, appliedLookupFailed } = deployWithMigrationGate({
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

  it('treats empty CLI output as a lookup failure, not an empty applied set', () => {
    const seen: string[] = [];
    const { failed, appliedLookupFailed } = deployWithMigrationGate({
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

  it('treats a successful empty applied-versions list as a real answer, not a lookup failure', () => {
    const seen: string[] = [];
    const { succeeded, failed, appliedLookupFailed } = deployWithMigrationGate({
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

  it('logs applied migration count and latest version without secret material', () => {
    const lines: string[] = [];
    const env = {
      SUPABASE_ACCESS_TOKEN: 'sbp_secret_value',
      SUPABASE_PROJECT_REF: 'eutsoqdpjurknjsshxes',
    };
    deployWithMigrationGate({
      functions: [{ slug: 'send-sms', requiredMigrations: [] }],
      listAppliedVersions: () => [
        { version: '20260815160000' },
        { version: '20260909193000' },
      ],
      deployOne: () => ({ ok: true, detail: 'Deployed' }),
      env,
      log: (line: string) => {
        lines.push(line);
      },
    });
    expect(lines.join('')).toContain('applied migrations read: 2 versions (latest 20260909193000)');
    expect(formatAppliedMigrationsReadLine([{ version: '20260815160000' }, { version: '20260909193000' }])).toBe(
      'applied migrations read: 2 versions (latest 20260909193000)',
    );
    expect(lines.join('\n')).not.toContain('sbp_secret_value');
    expect(lines.join('\n')).not.toContain('eutsoqdpjurknjsshxes');
  });

  it('deploys the unblocked function in a mixed batch and skips the blocked one', () => {
    const seen: string[] = [];
    const { succeeded, failed } = deployWithMigrationGate({
      functions: [
        { slug: 'send-sms', requiredMigrations: [] },
        {
          slug: 'send-quote-email',
          requiredMigrations: [{ path: QUOTE_EMAIL_MIGRATION, version: '20260909193000' }],
        },
        { slug: 'ai-chatbot', requiredMigrations: [] },
      ],
      listAppliedVersions: () => [{ version: '20260815160000' }],
      deployOne: (slug: string) => {
        seen.push(slug);
        return { ok: true, detail: 'Deployed' };
      },
    });
    expect(seen).toEqual(['send-sms', 'ai-chatbot']);
    expect(succeeded.map((item) => item.slug)).toEqual(['send-sms', 'ai-chatbot']);
    expect(failed.map((item) => item.slug)).toEqual(['send-quote-email']);
    expect(failed[0].detail).toContain('20260909193000_serialize_quote_email_delivery_failed_retry_claim.sql');
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
    expect(markdown).toContain('`send-sms` — direct file change (index.ts)');
    expect(markdown).toContain('Succeeded (1): `send-sms`');
    expect(markdown).toContain('Failed (1):');
    expect(markdown).toContain('`ai-chatbot` — bundle failed');
    expect(markdown).toContain('NOT applied');
    expect(markdown).toContain('20260909000000_brand_new.sql');
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
});
