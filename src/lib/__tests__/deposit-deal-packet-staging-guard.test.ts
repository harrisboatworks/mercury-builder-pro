import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

import {
  PRODUCTION_DEPOSIT_RECIPIENTS,
  PRODUCTION_SUPABASE_HOSTS,
  PRODUCTION_WEB_HOSTS,
  assessInheritedNameCollision,
  assessStagingSafety,
  depositStagingModeEnabled,
  isReservedInvalidEmail,
  resolveDepositAudienceRecipients,
  stripeSecretKind,
} from '../../../supabase/functions/_shared/deposit-staging-guard.ts';
import { runDepositStagingAcceptance } from '../../../scripts/deposit-deal-packet-staging/run.ts';

const fixtures = JSON.parse(
  readFileSync('scripts/deposit-deal-packet-staging/fixtures.json', 'utf8'),
);

const safeEnv = {
  STAGING_SUPABASE_URL: 'https://staging-deposit-packet.supabase.co',
  STAGING_STRIPE_SECRET_KEY: ['sk', 'test', 'synthetic'].join('_'),
  DEPOSIT_STAGING_MODE: '1',
  DEPOSIT_STAGING_CUSTOMER_EMAIL: 'ada@example.invalid',
  DEPOSIT_STAGING_HBW_EMAIL: 'hbw@example.invalid',
  DEPOSIT_STAGING_GROK_EMAIL: 'grok@example.invalid',
};

describe('deposit deal-packet staging guard', () => {
  it('rejects production hosts, live Stripe prefixes, and real inboxes before any send', () => {
    expect(PRODUCTION_SUPABASE_HOSTS).toContain('eutsoqdpjurknjsshxes.supabase.co');
    expect(PRODUCTION_WEB_HOSTS).toContain('mercury-builder-pro.vercel.app');
    expect(PRODUCTION_WEB_HOSTS).toContain('mercury-builder-pro-git-main-hbw.vercel.app');
    expect(assessStagingSafety({
      ...safeEnv,
      STAGING_SUPABASE_URL: `https://${PRODUCTION_SUPABASE_HOSTS[0]}`,
    }).ok).toBe(false);
    expect(assessStagingSafety({
      ...safeEnv,
      VERCEL_PREVIEW_URL: 'https://mercury-builder-pro.vercel.app',
    }).ok).toBe(false);
    expect(assessStagingSafety({
      ...safeEnv,
      STAGING_DATABASE_URL: `https://${PRODUCTION_SUPABASE_HOSTS[0]}`,
    }).ok).toBe(false);
    expect(stripeSecretKind(['sk', 'live', 'x'].join('_'))).toBe('live');
    expect(assessStagingSafety({
      ...safeEnv,
      STAGING_STRIPE_SECRET_KEY: ['sk', 'live', 'x'].join('_'),
    }).ok).toBe(false);
    expect(assessStagingSafety({
      ...safeEnv,
      DEPOSIT_STAGING_CUSTOMER_EMAIL: PRODUCTION_DEPOSIT_RECIPIENTS[0],
    }).ok).toBe(false);
    expect(assessInheritedNameCollision({
      SUPABASE_URL: `https://${PRODUCTION_SUPABASE_HOSTS[0]}`,
    }).result).toBe('FAIL');
    expect(assessStagingSafety(safeEnv, {}).ok).toBe(true);
  });

  it('keeps production recipients when staging mode is unset and rewrites only in staging mode', () => {
    expect(depositStagingModeEnabled({})).toBe(false);
    const production = resolveDepositAudienceRecipients({
      customerEmail: 'buyer@example.com',
      adminEmails: ['jayharris97@gmail.com'],
      grokEmail: 'hbwbot@agentmail.to',
    });
    expect(production.staging).toBe(false);
    expect(production.hbw).toEqual([
      'jayharris97@gmail.com',
      'info@harrisboatworks.ca',
    ]);
    expect(production.grok_bot).toEqual(['hbwbot@agentmail.to']);

    expect(() => resolveDepositAudienceRecipients({
      customerEmail: 'buyer@example.com',
      adminEmails: ['jayharris97@gmail.com'],
      grokEmail: 'hbwbot@agentmail.to',
      env: { DEPOSIT_STAGING_MODE: '1' },
    })).toThrow('Incomplete deposit staging recipient override');

    const staging = resolveDepositAudienceRecipients({
      customerEmail: 'buyer@example.com',
      adminEmails: ['jayharris97@gmail.com'],
      grokEmail: 'hbwbot@agentmail.to',
      env: safeEnv,
    });
    expect(staging.staging).toBe(true);
    expect(staging.customer).toEqual(['ada@example.invalid']);
    expect(staging.hbw).toEqual(['hbw@example.invalid']);
    expect(staging.grok_bot).toEqual(['grok@example.invalid']);
  });

  it('commits only example.invalid fixture identities', async () => {
    const { sha256Hex } = await import('../../../supabase/functions/_shared/quote-document-policy.ts');
    expect(isReservedInvalidEmail(fixtures.customer.email)).toBe(true);
    expect(isReservedInvalidEmail(fixtures.historical.email)).toBe(true);
    expect(Object.values(fixtures.recipients).every((value) => isReservedInvalidEmail(String(value)))).toBe(true);
    expect(fixtures.customer.email).not.toContain('harrisboatworks');
    expect(fixtures.customer.email).not.toContain('agentmail.to');
    expect(await sha256Hex(new TextEncoder().encode(fixtures.canonicalPdfUtf8)))
      .toBe(fixtures.staging.quotePdfSha256);
    expect(await sha256Hex(new TextEncoder().encode(fixtures.historicalPdfUtf8)))
      .toBe(fixtures.historical.quotePdfSha256);
    expect(readFileSync('supabase/config.toml', 'utf8')).toContain('project_id = "eutsoqdpjurknjsshxes"');
  });

  it('dry-run tripwires pass with zero network calls', () => {
    const evidence = runDepositStagingAcceptance({
      live: false,
      processEnv: {},
    });
    expect(evidence.networkCalls).toBe(0);
    expect(evidence.verdict).toBe('PASS');
    expect(evidence.checks.every((check) => check.beforeNetwork)).toBe(true);
    expect(evidence.checks.find((check) => check.id === 'tripwire_production_supabase')?.result).toBe('PASS');
    expect(evidence.checks.find((check) => check.id === 'tripwire_live_stripe')?.result).toBe('PASS');
    expect(evidence.checks.find((check) => check.id === 'tripwire_production_recipient')?.result).toBe('PASS');
    expect(evidence.checks.find((check) => check.id === 'tripwire_production_preview')?.result).toBe('PASS');
    expect(evidence.checks.find((check) => check.id === 'tripwire_production_database')?.result).toBe('PASS');
  });

  it('wires mailer and webhook to the staging guard and refuses --live without an isolated project', () => {
    const mailer = readFileSync('supabase/functions/send-deposit-confirmation-email/index.ts', 'utf8');
    const webhook = readFileSync('supabase/functions/stripe-webhook/index.ts', 'utf8');
    expect(mailer).toContain('resolveDepositAudienceRecipients');
    expect(webhook).toContain('depositStagingModeEnabled');
    expect(webhook).toContain('Quote-payment SMS skipped; deposit staging mode is enabled');

    const runbook = readFileSync('docs/STAGING_ACCEPTANCE.md', 'utf8');
    expect(runbook).toContain('deposit-deal-packet-staging-evidence/v1');
    expect(runbook).toContain('eutsoqdpjurknjsshxes.supabase.co');
    expect(runbook).toContain('example.invalid');
    expect(runbook).toContain('networkCalls');
    expect(runbook).toContain('Forbidden origin');
    expect(runbook).toContain('/admin/quotes/31313131-3131-4131-8131-313131313131');

    const live = runDepositStagingAcceptance({
      live: true,
      processEnv: {},
    });
    expect(live.networkCalls).toBe(0);
    expect(live.checks.find((check) => check.id === 'live_env_safe_before_network')?.result).toBe('FAIL');
    expect(live.verdict).toBe('FAIL');

    const spawned = spawnSync(process.execPath, [
      'scripts/run-deposit-deal-packet-staging.mjs',
      '--dry-run',
      '--out',
      '.tmp/deposit-staging-guard-test.json',
    ], {
      encoding: 'utf8',
      cwd: process.cwd(),
    });
    expect(spawned.status).toBe(0);
    expect(spawned.stdout).toContain('verdict: PASS');
    expect(spawned.stdout).toContain('networkCalls: 0');
  });
});
