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
  INVALID_STAGING_DEPOSIT_PRICE_500,
  resolveDepositStripePriceId,
  STRIPE_DEPOSIT_PRICE_500_KEY,
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

  it('keeps the hosted bootstrap off the historical migration chain and fail-closed', () => {
    const bootstrap = readFileSync('scripts/deposit-deal-packet-staging/sql/hosted-bootstrap.sql', 'utf8');
    const verify = readFileSync('scripts/deposit-deal-packet-staging/sql/hosted-bootstrap-verify.sql', 'utf8');
    const firstHistorical = readFileSync(
      'supabase/migrations/20250807132831_3c625049-13f9-4186-b88f-43cefc41c4db.sql',
      'utf8',
    );
    expect(bootstrap).toContain('deposit-deal-packet-staging/hosted-bootstrap/v1');
    expect(bootstrap).toContain('deposit-deal-packet-hosted-bootstrap/v1');
    expect(bootstrap).toContain('hosted staging bootstrap refuses production project eutsoqdpjurknjsshxes');
    expect(bootstrap).toContain("hosted staging bootstrap requires SET deposit_staging.allow_nonce TO ''deposit-deal-packet-staging/ccozickwrpautlxknsjk'' as operator intent acknowledgement");
    expect(bootstrap).toContain('This SQL cannot independently identify the hosted branch');
    expect(bootstrap).toContain("name NOT LIKE 'deposit_staging.%'");
    expect(bootstrap).toContain('REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated, service_role');
    expect(bootstrap).toContain('GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role');
    expect(bootstrap).not.toContain('GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon');
    expect(bootstrap).toContain('WHEN insufficient_privilege THEN');
    expect(bootstrap).toContain('ALTER TABLE public.deposit_staging_marker ENABLE ROW LEVEL SECURITY');
    expect(bootstrap).toContain('REVOKE ALL ON TABLE public.user_roles FROM PUBLIC, anon, authenticated, service_role');
    expect(bootstrap).toContain('REVOKE ALL ON TABLE public.saved_quotes FROM PUBLIC, anon, authenticated, service_role');
    expect(bootstrap).toContain('REVOKE ALL ON TABLE public.customer_quotes FROM PUBLIC, anon, authenticated, service_role');
    expect(bootstrap).toContain('REVOKE ALL ON TABLE public.deposit_staging_marker FROM PUBLIC, anon, authenticated, service_role');
    expect(bootstrap).toContain('GRANT SELECT ON TABLE public.deposit_staging_marker TO service_role');
    expect(bootstrap).toContain("to_regclass('auth.users')");
    expect(bootstrap).toContain("to_regclass('storage.buckets')");
    expect(bootstrap).toContain("to_regclass('storage.objects')");
    expect(bootstrap).toContain("to_regnamespace('auth')");
    expect(bootstrap).toContain("to_regnamespace('storage')");
    expect(bootstrap).toContain('cannot CREATE in schema auth');
    expect(bootstrap).toContain('skipped owner DDL on storage.objects');
    expect(bootstrap).not.toMatch(/CREATE TABLE IF NOT EXISTS\s+auth\./);
    expect(bootstrap).not.toMatch(/CREATE TABLE IF NOT EXISTS\s+storage\./);
    expect(bootstrap).not.toMatch(/CREATE SCHEMA IF NOT EXISTS\s+(auth|storage)\b/);
    expect(bootstrap).not.toMatch(/^GRANT USAGE ON SCHEMA (auth|storage)/m);
    expect(bootstrap).not.toMatch(/CREATE TABLE IF NOT EXISTS public\.user_roles\s*\([^;]*REFERENCES auth\.users/);
    const doBodies = [...bootstrap.matchAll(/DO\s+\$\$[\s\S]*?\$\$;/g)];
    expect(doBodies).toHaveLength(7);
    for (const block of doBodies) {
      expect(block[0]).toMatch(/END;\s*\$\$;$/);
    }
    expect(bootstrap).not.toMatch(/END\s+\$\$;/);
    const hostedShape = readFileSync('scripts/deposit-deal-packet-staging/sql/hosted-shape-local.sql', 'utf8');
    expect(hostedShape).toContain('deposit_hosted_runner');
    expect(hostedShape).toContain('supabase_auth_admin');
    expect(hostedShape).toContain('supabase_storage_admin');
    expect(hostedShape).toContain('REVOKE CREATE ON SCHEMA auth FROM deposit_hosted_runner');
    expect(hostedShape).toContain('REVOKE CREATE ON SCHEMA storage FROM deposit_hosted_runner');
    expect(hostedShape).toContain('GRANT SELECT, INSERT, UPDATE, REFERENCES ON TABLE auth.users TO deposit_hosted_runner');
    expect(hostedShape).toContain('GRANT SELECT, INSERT, UPDATE, REFERENCES ON TABLE storage.buckets TO deposit_hosted_runner');
    expect(hostedShape).toContain('GRANT SELECT, INSERT, UPDATE, REFERENCES ON TABLE storage.objects TO deposit_hosted_runner');
    expect(hostedShape).toContain('ALTER DEFAULT PRIVILEGES FOR ROLE deposit_hosted_runner IN SCHEMA public');
    expect(hostedShape).toContain('GRANT ALL ON TABLES TO anon, authenticated, service_role');
    expect(hostedShape).toContain('GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role');
    expect(hostedShape).toContain('Not applied to any remote Supabase project');
    expect(verify).toContain('public_table_acls_exact');
    expect(verify).toContain('public_function_acls_exact');
    const olderAcl = readFileSync('scripts/deposit-deal-packet-staging/sql/hosted-acl-older-form.sql', 'utf8');
    expect(olderAcl).toContain('GRANT ALL ON TABLE public.deposit_email_deliveries TO anon, authenticated, service_role');
    expect(olderAcl).toContain('REVOKE ALL ON TABLE public.deposit_email_deliveries FROM PUBLIC, anon');
    expect(bootstrap).toContain('ccozickwrpautlxknsjk');
    expect(bootstrap).not.toContain('CREATE TABLE public.profiles');
    expect(bootstrap).not.toContain('mercury_parts');
    expect(bootstrap).not.toContain('CREATE TABLE public.quotes');
    expect(firstHistorical).toContain('ALTER TABLE public.customer_quotes');
    expect(verify).toContain('saved_quotes_edge_columns');
    expect(verify).toContain('customer_quotes_edge_columns');
    expect(verify).toContain('marker_privileges_locked');
    expect(verify).toContain('has_role_execute_not_anon');
    expect(verify).toContain("id = 'quotes'");
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
    expect(runbook).toContain('hosted-bootstrap.sql');
    expect(runbook).toContain('deposit-deal-packet-hosted-bootstrap/v1');
    expect(runbook).toContain('deposit-deal-packet-staging/ccozickwrpautlxknsjk');
    expect(runbook).toContain('This SQL cannot independently identify branch ccozickwrpautlxknsjk');
    expect(runbook).toContain('operator intent acknowledgement only');
    expect(runbook).toContain('nonce cannot self-identify');
    expect(runbook).toContain('schema-surface marker, not proof of the connected project');
    expect(runbook).toContain('`CREATE TABLE IF NOT EXISTS` still requires schema `CREATE`');
    expect(runbook).toContain('quotes bucket upsert is DML only');
    expect(runbook).toContain('ALTER DEFAULT PRIVILEGES');
    expect(runbook).toContain('REVOKE ALL` from `PUBLIC`, `anon`, `authenticated`, and `service_role`');
    expect(runbook).toContain('rolsuper=false');
    expect(runbook).toContain('rolbypassrls=true');
    expect(runbook).not.toContain('nonce may be omitted');
    expect(runbook).not.toContain('If the session can determine project ref');
    expect(runbook).toContain('Follow-up reminder');
    expect(runbook).toContain('ccozickwrpautlxknsjk');
    expect(runbook).toContain('STRIPE_DEPOSIT_PRICE_500');
    expect(runbook).toContain('price_1SocofHhVKClVQCpsdCfdG7e');
    expect(runbook).not.toContain('price_1U7jab');
    expect(runbook).toContain('rehydrate the same `provider_id`');
    expect(runbook).toContain('never accepted');
    expect(runbook).not.toContain('receives a new simulated `provider_id`');

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

  it('overrides only the staging $500 deposit price after runtime isolation', () => {
    const productionCatalog = {
      '100': null,
      '200': 'price_1Sspb6HhVKClVQCpaUhCXRnm',
      '500': 'price_1SocofHhVKClVQCpsdCfdG7e',
      '1000': 'price_1SocogHhVKClVQCpEDslYPR3',
      '2500': 'price_1SocoiHhVKClVQCptRAWryya',
    };
    const syntheticOverride = 'price_1SyntheticStaging500aa';
    const productionUrl = `https://${PRODUCTION_SUPABASE_HOSTS[0]}`;
    const ignoredOverrideEnv = {
      [STRIPE_DEPOSIT_PRICE_500_KEY]: syntheticOverride,
      SUPABASE_URL: productionUrl,
    };

    expect(resolveDepositStripePriceId('500', {}, productionCatalog)).toBe(productionCatalog['500']);
    expect(resolveDepositStripePriceId('500', ignoredOverrideEnv, productionCatalog)).toBe(productionCatalog['500']);
    expect(resolveDepositStripePriceId('500', {
      DEPOSIT_STAGING_MODE: 'true',
      [STRIPE_DEPOSIT_PRICE_500_KEY]: syntheticOverride,
      SUPABASE_URL: isolatedSupabaseUrl,
    }, productionCatalog)).toBe(productionCatalog['500']);
    expect(resolveDepositStripePriceId('200', {
      DEPOSIT_STAGING_MODE: '1',
      [STRIPE_DEPOSIT_PRICE_500_KEY]: syntheticOverride,
      SUPABASE_URL: isolatedSupabaseUrl,
    }, productionCatalog)).toBe(productionCatalog['200']);
    expect(resolveDepositStripePriceId('100', {
      DEPOSIT_STAGING_MODE: '1',
      [STRIPE_DEPOSIT_PRICE_500_KEY]: syntheticOverride,
      SUPABASE_URL: isolatedSupabaseUrl,
    }, productionCatalog)).toBeNull();

    expect(resolveDepositStripePriceId('500', {
      DEPOSIT_STAGING_MODE: '1',
      SUPABASE_URL: isolatedSupabaseUrl,
      [STRIPE_DEPOSIT_PRICE_500_KEY]: syntheticOverride,
    }, productionCatalog)).toBe(syntheticOverride);

    expect(() => resolveDepositStripePriceId('500', {
      DEPOSIT_STAGING_MODE: '1',
      SUPABASE_URL: productionUrl,
      [STRIPE_DEPOSIT_PRICE_500_KEY]: syntheticOverride,
    }, productionCatalog)).toThrow('Unsafe deposit staging runtime');
    expect(() => resolveDepositStripePriceId('500', {
      DEPOSIT_STAGING_MODE: '1',
      SUPABASE_URL: isolatedSupabaseUrl,
    }, productionCatalog)).toThrow(INVALID_STAGING_DEPOSIT_PRICE_500);
    expect(() => resolveDepositStripePriceId('500', {
      DEPOSIT_STAGING_MODE: '1',
      SUPABASE_URL: isolatedSupabaseUrl,
      [STRIPE_DEPOSIT_PRICE_500_KEY]: 'not-a-price',
    }, productionCatalog)).toThrow(INVALID_STAGING_DEPOSIT_PRICE_500);
    expect(() => resolveDepositStripePriceId('500', {
      DEPOSIT_STAGING_MODE: '1',
      SUPABASE_URL: isolatedSupabaseUrl,
      [STRIPE_DEPOSIT_PRICE_500_KEY]: 'price_short',
    }, productionCatalog)).toThrow(INVALID_STAGING_DEPOSIT_PRICE_500);

    const payment = readFileSync('supabase/functions/create-payment/index.ts', 'utf8');
    const envExample = readFileSync('scripts/deposit-deal-packet-staging/env.example', 'utf8');
    const resolveIdx = payment.indexOf('resolveDepositStripePriceId(depositAmount,');
    const depositStripeIdx = payment.indexOf('const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });', payment.indexOf('assertCanonicalQuoteDocumentReady({'));
    expect(payment).toContain('"500": "price_1SocofHhVKClVQCpsdCfdG7e"');
    expect(resolveIdx).toBeGreaterThan(-1);
    expect(depositStripeIdx).toBeGreaterThan(resolveIdx);
    expect(payment.slice(resolveIdx, depositStripeIdx)).toContain('STRIPE_DEPOSIT_PRICE_500');
    expect(payment.slice(resolveIdx, depositStripeIdx)).not.toContain('stripe.checkout.sessions.create');
    expect(payment).not.toContain('price_1U7jab');
    expect(envExample).toContain('# STRIPE_DEPOSIT_PRICE_500=');
    expect(envExample).not.toContain('price_1U7jab');
  });
});
