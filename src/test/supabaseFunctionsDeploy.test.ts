import { describe, expect, it } from 'vitest';
import {
  deployFunctionSlugs,
  formatFunctionsDeployMarkdown,
  isSafeFunctionSlug,
  projectRefFromConfig,
  redactSecrets,
  resolveForcedSlug,
} from '../../scripts/deploy-supabase-functions.mjs';

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
