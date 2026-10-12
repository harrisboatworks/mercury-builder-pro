import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';

import { stripeCheckoutIdempotencyKey } from '../../../supabase/functions/_shared/deposit-deal-record.ts';
import {
  DEPOSIT_STAGING_SAVED_QUOTE_ID_KEY,
  LOCAL_ID_NOT_ISOLATED_RUN,
  MALFORMED_STAGING_RUN_SAVED_QUOTE_ID,
  MISSING_STAGING_RUN_SAVED_QUOTE_ID,
  RESERVED_STAGING_RUN_SAVED_QUOTE_ID,
  RETIRED_STAGING_RUN_SAVED_QUOTE_ID,
  REUSED_STAGING_RUN_SAVED_QUOTE_ID,
  STAGING_RUN_FIXTURE_SCHEMA,
  assertOperatorStagingRunSavedQuoteId,
  buildStagingRunFixture,
  localAcceptanceSavedQuoteId,
  materializeIsolatedStagingRun,
  reservedIsolatedStagingSavedQuoteIds,
  retiredStagingSavedQuoteId,
  stagingResumeToken,
  stagingRunNonce,
} from '../../../scripts/deposit-deal-packet-staging/run-fixture.ts';

const fixtures = JSON.parse(
  readFileSync('scripts/deposit-deal-packet-staging/fixtures.json', 'utf8'),
);

const isolatedExample = '38383838-3838-4838-8838-383838383838';
const isolatedOther = '39393939-3939-4939-8939-393939393939';

const tempDirs: string[] = [];

function tempDir(): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'ddp-run-id-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

describe('deposit deal-packet staging per-run savedQuoteId', () => {
  it('refuses missing, malformed, retired, reserved, and reused operator IDs', () => {
    expect(() => assertOperatorStagingRunSavedQuoteId(undefined)).toThrow(MISSING_STAGING_RUN_SAVED_QUOTE_ID);
    expect(() => assertOperatorStagingRunSavedQuoteId('')).toThrow(MISSING_STAGING_RUN_SAVED_QUOTE_ID);
    expect(() => assertOperatorStagingRunSavedQuoteId('   ')).toThrow(MISSING_STAGING_RUN_SAVED_QUOTE_ID);
    expect(() => assertOperatorStagingRunSavedQuoteId('not-a-uuid')).toThrow(MALFORMED_STAGING_RUN_SAVED_QUOTE_ID);
    expect(() => assertOperatorStagingRunSavedQuoteId('00000000-0000-0000-0000-000000000000'))
      .toThrow(MALFORMED_STAGING_RUN_SAVED_QUOTE_ID);
    expect(() => assertOperatorStagingRunSavedQuoteId(retiredStagingSavedQuoteId()))
      .toThrow(RETIRED_STAGING_RUN_SAVED_QUOTE_ID);
    expect(() => assertOperatorStagingRunSavedQuoteId(fixtures.ids.retiredStagingSavedQuoteId.toUpperCase()))
      .toThrow(RETIRED_STAGING_RUN_SAVED_QUOTE_ID);
    expect(() => assertOperatorStagingRunSavedQuoteId(localAcceptanceSavedQuoteId()))
      .toThrow(LOCAL_ID_NOT_ISOLATED_RUN);
    expect(() => assertOperatorStagingRunSavedQuoteId(fixtures.ids.historicalSavedQuoteId))
      .toThrow(RESERVED_STAGING_RUN_SAVED_QUOTE_ID);
    expect(() => assertOperatorStagingRunSavedQuoteId(fixtures.ids.historicalCustomerQuoteId))
      .toThrow(RESERVED_STAGING_RUN_SAVED_QUOTE_ID);
    expect(() => assertOperatorStagingRunSavedQuoteId(fixtures.ids.stagingCustomerQuoteId))
      .toThrow(RESERVED_STAGING_RUN_SAVED_QUOTE_ID);
    expect(() => assertOperatorStagingRunSavedQuoteId(fixtures.ids.fixtureMotorId))
      .toThrow(RESERVED_STAGING_RUN_SAVED_QUOTE_ID);
    expect(() => assertOperatorStagingRunSavedQuoteId(isolatedExample, { usedIds: [isolatedExample] }))
      .toThrow(REUSED_STAGING_RUN_SAVED_QUOTE_ID);
    expect(assertOperatorStagingRunSavedQuoteId(` ${isolatedExample.toUpperCase()} `)).toBe(isolatedExample);
    expect(reservedIsolatedStagingSavedQuoteIds()).toContain(retiredStagingSavedQuoteId());
    expect(reservedIsolatedStagingSavedQuoteIds()).toContain(localAcceptanceSavedQuoteId());
  });

  it('materializes one isolated fixture and refuses rematerializing the same run ID', () => {
    const dir = tempDir();
    const fixturePath = path.join(dir, 'run.json');
    const ledgerPath = path.join(dir, 'used.json');
    const fixture = materializeIsolatedStagingRun({
      savedQuoteId: isolatedExample,
      fixturePath,
      ledgerPath,
    });

    expect(fixture.schema).toBe(STAGING_RUN_FIXTURE_SCHEMA);
    expect(fixture.kind).toBe('isolated');
    expect(fixture.savedQuoteId).toBe(isolatedExample);
    expect(fixture.runNonce).toBe(stagingRunNonce(isolatedExample, 'isolated'));
    expect(fixture.resumeToken).toBe(stagingResumeToken(isolatedExample));
    expect(fixture.quotePdfPath).toBe(`saved-quotes/${isolatedExample}/quote.pdf`);
    expect(fixture.adminPath).toBe(`/admin/quotes/${isolatedExample}`);
    expect(fixture.stripeCheckoutIdempotencyKey).toBe(`motor-deposit:${isolatedExample}`);
    expect(fixture.stripeCheckoutIdempotencyKey).toBe(stripeCheckoutIdempotencyKey({
      savedQuoteId: isolatedExample,
    }));
    expect(fixture.createPaymentBody.savedQuoteId).toBe(isolatedExample);
    expect(fixture.createPaymentBody.customerInfo.email).toBe('ada@example.invalid');
    expect(fixture.sessionSets).toEqual([
      `SET deposit_staging.saved_quote_id TO '${isolatedExample}'`,
      `SET deposit_staging.run_nonce TO 'deposit-deal-packet-staging/run/${isolatedExample}'`,
    ]);
    expect(fixture.retiredSavedQuoteId).toBe(retiredStagingSavedQuoteId());
    expect(fixture.historicalSavedQuoteId).toBe(fixtures.ids.historicalSavedQuoteId);

    const written = JSON.parse(readFileSync(fixturePath, 'utf8'));
    expect(written.savedQuoteId).toBe(isolatedExample);
    expect(written.adminPath).toBe(fixture.adminPath);

    expect(() => materializeIsolatedStagingRun({
      savedQuoteId: isolatedExample,
      fixturePath,
      ledgerPath,
    })).toThrow(REUSED_STAGING_RUN_SAVED_QUOTE_ID);

    const second = materializeIsolatedStagingRun({
      savedQuoteId: isolatedOther,
      fixturePath,
      ledgerPath,
    });
    expect(second.savedQuoteId).toBe(isolatedOther);
    expect(second.quotePdfPath).toBe(`saved-quotes/${isolatedOther}/quote.pdf`);
    expect(JSON.parse(readFileSync(fixturePath, 'utf8')).savedQuoteId).toBe(isolatedOther);
    expect(JSON.parse(readFileSync(ledgerPath, 'utf8')).ids).toEqual([isolatedExample, isolatedOther]);
  });

  it('keeps local acceptance deterministic and separate from isolated Stripe runs', () => {
    const localId = localAcceptanceSavedQuoteId();
    const local = buildStagingRunFixture(localId, { kind: 'local' });
    expect(local.savedQuoteId).toBe('37373737-3737-4737-8737-373737373737');
    expect(local.runNonce).toBe(`deposit-deal-packet-staging/local/${localId}`);
    expect(local.resumeToken).toBe(fixtures.staging.resumeToken);
    expect(local.adminPath).toBe(`/admin/quotes/${localId}`);
    expect(() => buildStagingRunFixture(isolatedExample, { kind: 'local' }))
      .toThrow('deposit staging run local fixture requires the local-acceptance savedQuoteId');
    expect(() => buildStagingRunFixture(localId, { kind: 'isolated' }))
      .toThrow(LOCAL_ID_NOT_ISOLATED_RUN);
  });

  it('does not change production create-payment idempotency semantics', () => {
    const record = readFileSync('supabase/functions/_shared/deposit-deal-record.ts', 'utf8');
    const payment = readFileSync('supabase/functions/create-payment/index.ts', 'utf8');
    expect(record).toContain('motor-deposit:${options.savedQuoteId}');
    expect(record).toContain('motor-deposit:${options.savedQuoteId}:renew:${options.existingSessionId}');
    expect(record).not.toContain('motor-deposit:${options.savedQuoteId}:staging');
    expect(payment).toContain('idempotencyKey: stripeCheckoutIdempotencyKey({');
    expect(payment).toContain('savedQuoteId,');
    expect(stripeCheckoutIdempotencyKey({ savedQuoteId: isolatedExample }))
      .toBe(`motor-deposit:${isolatedExample}`);
    expect(stripeCheckoutIdempotencyKey({
      savedQuoteId: isolatedExample,
      existingSessionId: 'cs_test_renew',
    })).toBe(`motor-deposit:${isolatedExample}:renew:cs_test_renew`);
  });

  it('fail-closes the materialize CLI without a run ID and accepts a fresh UUID', () => {
    const dir = tempDir();
    const fixturePath = path.join(dir, 'run.json');
    const ledgerPath = path.join(dir, 'used.json');
    const missing = spawnSync(process.execPath, [
      'scripts/materialize-deposit-deal-packet-staging-run.mjs',
      '--out',
      fixturePath,
      '--ledger',
      ledgerPath,
    ], {
      encoding: 'utf8',
      cwd: process.cwd(),
      env: { ...process.env, [DEPOSIT_STAGING_SAVED_QUOTE_ID_KEY]: '' },
    });
    expect(missing.status).not.toBe(0);
    expect(`${missing.stdout}${missing.stderr}`).toContain(MISSING_STAGING_RUN_SAVED_QUOTE_ID);

    const retired = spawnSync(process.execPath, [
      'scripts/materialize-deposit-deal-packet-staging-run.mjs',
      '--out',
      fixturePath,
      '--ledger',
      ledgerPath,
    ], {
      encoding: 'utf8',
      cwd: process.cwd(),
      env: {
        ...process.env,
        [DEPOSIT_STAGING_SAVED_QUOTE_ID_KEY]: fixtures.ids.retiredStagingSavedQuoteId,
      },
    });
    expect(retired.status).not.toBe(0);
    expect(`${retired.stdout}${retired.stderr}`).toContain(RETIRED_STAGING_RUN_SAVED_QUOTE_ID);

    const ok = spawnSync(process.execPath, [
      'scripts/materialize-deposit-deal-packet-staging-run.mjs',
      '--out',
      fixturePath,
      '--ledger',
      ledgerPath,
    ], {
      encoding: 'utf8',
      cwd: process.cwd(),
      env: {
        ...process.env,
        [DEPOSIT_STAGING_SAVED_QUOTE_ID_KEY]: isolatedExample,
      },
    });
    expect(ok.status).toBe(0);
    expect(ok.stdout).toContain(`savedQuoteId: ${isolatedExample}`);
    expect(ok.stdout).toContain(`motor-deposit:${isolatedExample}`);
    expect(JSON.parse(readFileSync(fixturePath, 'utf8')).adminPath).toBe(`/admin/quotes/${isolatedExample}`);
  });
});
