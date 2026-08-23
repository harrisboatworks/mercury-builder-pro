import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

import {
  PRODUCTION_DEPOSIT_RECIPIENTS,
  PRODUCTION_SUPABASE_HOSTS,
  PRODUCTION_WEB_HOSTS,
  STAGING_PACKET_FAILURE_RECIPIENTS,
  STAGING_PACKET_SUCCESS_RECIPIENTS,
  assessInheritedNameCollision,
  assessRuntimeStagingIsolation,
  assessStagingSafety,
  assertRuntimeStagingIsolation,
  depositStagingModeEnabled,
  shouldSuppressDepositStagingSms,
  isAllowedStagingRecipient,
  isOfficialResendTestAddress,
  isReservedInvalidEmail,
  parseOfficialResendTestAddress,
  resolveDepositAudienceRecipients,
  stripeSecretKind,
} from '../../../supabase/functions/_shared/deposit-staging-guard.ts';
import { runDepositStagingAcceptance } from '../../../scripts/deposit-deal-packet-staging/run.ts';

const fixtures = JSON.parse(
  readFileSync('scripts/deposit-deal-packet-staging/fixtures.json', 'utf8'),
);

const isolatedSupabaseUrl = 'https://staging-deposit-packet.supabase.co';

const safeEnv = {
  STAGING_SUPABASE_URL: isolatedSupabaseUrl,
  SUPABASE_URL: isolatedSupabaseUrl,
  STAGING_STRIPE_SECRET_KEY: ['sk', 'test', 'synthetic'].join('_'),
  DEPOSIT_STAGING_MODE: '1',
  DEPOSIT_STAGING_CUSTOMER_EMAIL: STAGING_PACKET_SUCCESS_RECIPIENTS.customer,
  DEPOSIT_STAGING_HBW_EMAIL: STAGING_PACKET_SUCCESS_RECIPIENTS.hbw,
  DEPOSIT_STAGING_GROK_EMAIL: STAGING_PACKET_SUCCESS_RECIPIENTS.grok,
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

  it('allows only official Resend test-address forms on the packet allowlist', () => {
    expect(parseOfficialResendTestAddress('delivered+deposit-customer@resend.dev')).toEqual({
      mailbox: 'delivered',
      label: 'deposit-customer',
    });
    expect(isOfficialResendTestAddress('delivered@resend.dev')).toBe(true);
    expect(isOfficialResendTestAddress('bounced@resend.dev')).toBe(true);
    expect(isOfficialResendTestAddress('complained@resend.dev')).toBe(true);
    expect(isOfficialResendTestAddress('suppressed@resend.dev')).toBe(true);
    expect(isOfficialResendTestAddress('suppressed+label@resend.dev')).toBe(false);
    expect(isOfficialResendTestAddress('tester@resend.dev')).toBe(false);
    expect(isOfficialResendTestAddress('ada@example.invalid')).toBe(false);
    expect(isAllowedStagingRecipient(STAGING_PACKET_SUCCESS_RECIPIENTS.customer)).toBe(true);
    expect(isAllowedStagingRecipient(STAGING_PACKET_FAILURE_RECIPIENTS[0])).toBe(true);
    expect(isAllowedStagingRecipient('delivered@resend.dev')).toBe(false);
    expect(isAllowedStagingRecipient('delivered+unlisted@resend.dev')).toBe(false);
    expect(isAllowedStagingRecipient('tester@resend.dev')).toBe(false);
    expect(isAllowedStagingRecipient('ada@example.invalid')).toBe(false);
    expect(isAllowedStagingRecipient(PRODUCTION_DEPOSIT_RECIPIENTS[0])).toBe(false);

    expect(assessStagingSafety({
      ...safeEnv,
      DEPOSIT_STAGING_CUSTOMER_EMAIL: 'tester@resend.dev',
    }).ok).toBe(false);
    expect(assessStagingSafety({
      ...safeEnv,
      DEPOSIT_STAGING_CUSTOMER_EMAIL: 'ada@example.invalid',
    }).ok).toBe(false);
    expect(assessStagingSafety({
      ...safeEnv,
      DEPOSIT_STAGING_CUSTOMER_EMAIL: STAGING_PACKET_FAILURE_RECIPIENTS[0],
    }).ok).toBe(true);
    expect(assessStagingSafety({
      ...safeEnv,
      DEPOSIT_STAGING_CUSTOMER_EMAIL: STAGING_PACKET_FAILURE_RECIPIENTS[0],
      DEPOSIT_STAGING_HBW_EMAIL: STAGING_PACKET_FAILURE_RECIPIENTS[0],
    }).ok).toBe(false);
  });

  it('keeps production recipients when staging mode is unset and rewrites only in staging mode', () => {
    expect(depositStagingModeEnabled({})).toBe(false);
    const production = resolveDepositAudienceRecipients({
      customerEmail: 'buyer@example.com',
      adminEmails: ['jayharris97@gmail.com'],
      grokEmail: 'hbwbot@agentmail.to',
    });
    expect(production.staging).toBe(false);
    expect(production.customer).toEqual(['buyer@example.com']);
    expect(production.hbw).toEqual([
      'jayharris97@gmail.com',
      'info@harrisboatworks.ca',
    ]);
    expect(production.grok_bot).toEqual(['hbwbot@agentmail.to']);
    expect(production.replyTo).toBe('info@harrisboatworks.ca');

    const inertOnProductionUrl = resolveDepositAudienceRecipients({
      customerEmail: 'buyer@example.com',
      adminEmails: ['jayharris97@gmail.com'],
      grokEmail: 'hbwbot@agentmail.to',
      env: { SUPABASE_URL: `https://${PRODUCTION_SUPABASE_HOSTS[0]}` },
    });
    expect(inertOnProductionUrl.staging).toBe(false);
    expect(inertOnProductionUrl.customer).toEqual(['buyer@example.com']);
    expect(inertOnProductionUrl.hbw).toEqual(production.hbw);

    expect(() => resolveDepositAudienceRecipients({
      customerEmail: 'buyer@example.com',
      adminEmails: ['jayharris97@gmail.com'],
      grokEmail: 'hbwbot@agentmail.to',
      env: { DEPOSIT_STAGING_MODE: '1' },
    })).toThrow('Unsafe deposit staging runtime');

    expect(() => resolveDepositAudienceRecipients({
      customerEmail: 'buyer@example.com',
      adminEmails: ['jayharris97@gmail.com'],
      grokEmail: 'hbwbot@agentmail.to',
      env: { DEPOSIT_STAGING_MODE: '1', SUPABASE_URL: isolatedSupabaseUrl },
    })).toThrow('Incomplete deposit staging recipient override');

    expect(() => resolveDepositAudienceRecipients({
      customerEmail: 'buyer@example.com',
      adminEmails: ['jayharris97@gmail.com'],
      grokEmail: 'hbwbot@agentmail.to',
      env: {
        ...safeEnv,
        SUPABASE_URL: `https://${PRODUCTION_SUPABASE_HOSTS[0]}`,
      },
    })).toThrow('runtime_supabase_url_not_production');

    const staging = resolveDepositAudienceRecipients({
      customerEmail: 'buyer@example.com',
      adminEmails: ['jayharris97@gmail.com'],
      grokEmail: 'hbwbot@agentmail.to',
      env: safeEnv,
    });
    expect(staging.staging).toBe(true);
    expect(staging.customer).toEqual([STAGING_PACKET_SUCCESS_RECIPIENTS.customer]);
    expect(staging.hbw).toEqual([STAGING_PACKET_SUCCESS_RECIPIENTS.hbw]);
    expect(staging.grok_bot).toEqual([STAGING_PACKET_SUCCESS_RECIPIENTS.grok]);
    expect(staging.replyTo).toBe(STAGING_PACKET_SUCCESS_RECIPIENTS.hbw);
  });

  it('commits example.invalid identities and Resend test send recipients', async () => {
    const { sha256Hex } = await import('../../../supabase/functions/_shared/quote-document-policy.ts');
    expect(isReservedInvalidEmail(fixtures.customer.email)).toBe(true);
    expect(isReservedInvalidEmail(fixtures.historical.email)).toBe(true);
    expect(Object.values(fixtures.recipients).every((value) => isAllowedStagingRecipient(String(value)))).toBe(true);
    expect(isAllowedStagingRecipient(fixtures.failureRecipients.retry)).toBe(true);
    expect(fixtures.customer.email).not.toContain('harrisboatworks');
    expect(fixtures.customer.email).not.toContain('agentmail.to');
    expect(fixtures.recipients.customer).not.toContain('example.invalid');
    expect(await sha256Hex(new TextEncoder().encode(fixtures.canonicalPdfUtf8)))
      .toBe(fixtures.staging.quotePdfSha256);
    expect(await sha256Hex(new TextEncoder().encode(fixtures.historicalPdfUtf8)))
      .toBe(fixtures.historical.quotePdfSha256);
    expect(readFileSync('supabase/config.toml', 'utf8')).toContain('project_id = "eutsoqdpjurknjsshxes"');
  });

  it('fails closed when staging mode is set on the production Supabase URL', () => {
    const productionUrl = `https://${PRODUCTION_SUPABASE_HOSTS[0]}`;
    expect(assessRuntimeStagingIsolation({}).every((check) => check.result === 'PASS')).toBe(true);
    expect(assessRuntimeStagingIsolation({ SUPABASE_URL: productionUrl }).every((check) => check.result === 'PASS')).toBe(true);
    expect(() => assertRuntimeStagingIsolation({ DEPOSIT_STAGING_MODE: '1' }))
      .toThrow('runtime_supabase_url_present');
    expect(() => assertRuntimeStagingIsolation({
      DEPOSIT_STAGING_MODE: '1',
      SUPABASE_URL: 'http://staging-deposit-packet.supabase.co',
    })).toThrow('runtime_supabase_url_https');
    expect(() => assertRuntimeStagingIsolation({
      DEPOSIT_STAGING_MODE: '1',
      SUPABASE_URL: productionUrl,
    })).toThrow('runtime_supabase_url_not_production');
    expect(() => assertRuntimeStagingIsolation(safeEnv)).not.toThrow();
    expect(shouldSuppressDepositStagingSms({})).toBe(false);
    expect(shouldSuppressDepositStagingSms({ SUPABASE_URL: productionUrl })).toBe(false);
    expect(shouldSuppressDepositStagingSms(safeEnv)).toBe(true);
    expect(() => shouldSuppressDepositStagingSms({
      DEPOSIT_STAGING_MODE: '1',
      SUPABASE_URL: productionUrl,
    })).toThrow('Unsafe deposit staging runtime');
  });

  it('dry-run tripwires report guard-only capability instead of a network count', () => {
    const evidence = runDepositStagingAcceptance({
      live: false,
      processEnv: {},
    });
    expect(evidence.schema).toBe('deposit-deal-packet-staging-evidence/v2');
    expect(evidence.runnerCapability).toBe('guard_only_no_clients');
    expect(evidence).not.toHaveProperty('networkCalls');
    expect(evidence.verdict).toBe('PASS');
    expect(evidence.checks.find((check) => check.id === 'tripwire_production_supabase')?.result).toBe('PASS');
    expect(evidence.checks.find((check) => check.id === 'tripwire_live_stripe')?.result).toBe('PASS');
    expect(evidence.checks.find((check) => check.id === 'tripwire_production_recipient')?.result).toBe('PASS');
    expect(evidence.checks.find((check) => check.id === 'tripwire_example_invalid_recipient')?.result).toBe('PASS');
    expect(evidence.checks.find((check) => check.id === 'tripwire_arbitrary_resend_dev')?.result).toBe('PASS');
    expect(evidence.checks.find((check) => check.id === 'tripwire_production_preview')?.result).toBe('PASS');
    expect(evidence.checks.find((check) => check.id === 'tripwire_production_database')?.result).toBe('PASS');
    expect(evidence.checks.find((check) => check.id === 'tripwire_runtime_production_supabase')?.result).toBe('PASS');
    expect(evidence.checks.find((check) => check.id === 'tripwire_runtime_isolation_inert_when_unset')?.result).toBe('PASS');
    expect(evidence.checks.find((check) => check.id === 'runner_is_guard_only')?.result).toBe('PASS');
    expect(evidence.checks.find((check) => check.id === 'staging_mode_overrides_to_resend_test_addresses')?.result).toBe('PASS');
    expect(evidence.checks.find((check) => check.id === 'staging_mode_disables_sms')?.result).toBe('PASS');
  });

  it('proves the runner source cannot construct a network client', () => {
    const runner = readFileSync('scripts/deposit-deal-packet-staging/run.ts', 'utf8');
    const wrapper = readFileSync('scripts/run-deposit-deal-packet-staging.mjs', 'utf8');
    const stripped = `${runner}\n${wrapper}`
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
      .replace(/(['"`])(?:\\.|(?!\1)[\s\S])*\1/g, '""');
    expect(stripped).not.toMatch(/\bfetch\s*\(/);
    expect(stripped).not.toMatch(/\bcreateClient\s*\(/);
    expect(stripped).not.toMatch(/\bnew\s+Stripe\b/);
    expect(stripped).not.toMatch(/from\s+["']node:(?:http|https|net)["']/);
    expect(stripped).not.toMatch(/from\s+["'](?:http|https|net|undici|node-fetch)["']/);
    expect(stripped).not.toMatch(/require\(\s*["'](?:http|https|net|undici|node-fetch)["']/);
    expect(stripped).not.toMatch(/\bhttps?\.request\s*\(/);
    expect(stripped).not.toMatch(/\bnet\.connect\s*\(/);
    expect(stripped).not.toMatch(/@supabase\/supabase-js/);
    expect(stripped).not.toMatch(/\bWebSocket\b/);
    expect(runner).toContain('guard_only_no_clients');
    expect(runner).toContain('deposit-deal-packet-staging-evidence/v2');
    expect(runner).not.toContain('networkCalls');
  });

  it('wires mailer and webhook isolation before rewrite or SMS suppression', () => {
    const mailer = readFileSync('supabase/functions/send-deposit-confirmation-email/index.ts', 'utf8');
    const webhook = readFileSync('supabase/functions/stripe-webhook/index.ts', 'utf8');
    const seedSql = readFileSync('scripts/deposit-deal-packet-staging/sql/seed.sql', 'utf8');
    const cleanupSql = readFileSync('scripts/deposit-deal-packet-staging/sql/cleanup.sql', 'utf8');
    expect(mailer).toContain('resolveDepositAudienceRecipients');
    expect(mailer).toContain('SUPABASE_URL: Deno.env.get("SUPABASE_URL")');
    expect(webhook).toContain('shouldSuppressDepositStagingSms');
    expect(webhook).toContain('stagingRuntimeEnv');
    expect(webhook).toContain('Quote-payment SMS skipped; deposit staging mode is enabled');
    expect(webhook).not.toMatch(/depositStagingModeEnabled\(/);
    expect(seedSql).toContain('SET LOCAL ROLE service_role');
    expect(cleanupSql).toContain('SET LOCAL ROLE service_role');
    expect(seedSql).toContain('deposit staging seed refuses a populated database; saved_quotes and customer_quotes must both be empty');
    expect(cleanupSql).toContain("id = '31313131-3131-4131-8131-313131313131'");
    expect(cleanupSql).toContain("email = 'ada@example.invalid'");
    expect(cleanupSql).toContain("customer_email = 'historical@example.invalid'");

    const runbook = readFileSync('docs/STAGING_ACCEPTANCE.md', 'utf8');
    expect(runbook).toContain('deposit-deal-packet-staging-evidence/v2');
    expect(runbook).toContain('guard_only_no_clients');
    expect(runbook).toContain('assertRuntimeStagingIsolation');
    expect(runbook).toContain('eutsoqdpjurknjsshxes.supabase.co');
    expect(runbook).toContain('delivered+deposit-customer@resend.dev');
    expect(runbook).toContain('simulated-delivery');
    expect(runbook).toContain('example.invalid');
    expect(runbook).not.toContain('networkCalls');
    expect(runbook).toContain('Forbidden origin');
    expect(runbook).toContain('/admin/quotes/31313131-3131-4131-8131-313131313131');

    const live = runDepositStagingAcceptance({
      live: true,
      processEnv: {},
    });
    expect(live.schema).toBe('deposit-deal-packet-staging-evidence/v2');
    expect(live.runnerCapability).toBe('guard_only_no_clients');
    expect(live).not.toHaveProperty('networkCalls');
    expect(live.checks.find((check) => check.id === 'live_operator_env_safe')?.result).toBe('FAIL');
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
    expect(spawned.stdout).toContain('runnerCapability: guard_only_no_clients');
    expect(spawned.stdout).not.toContain('networkCalls');
  });
});
