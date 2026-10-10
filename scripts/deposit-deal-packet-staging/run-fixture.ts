/**
 * Staging-only per-run savedQuoteId materializer.
 * Isolated Stripe acceptance must use a fresh operator UUID so production
 * create-payment idempotency (`motor-deposit:<savedQuoteId>`) can be rerun
 * after price/parameter changes. Local PostgreSQL acceptance stays on a
 * committed deterministic ID. This module never opens a network socket.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

import { adminDealPacketPath } from "../../supabase/functions/_shared/deposit-email-deliveries.ts";
import { stripeCheckoutIdempotencyKey } from "../../supabase/functions/_shared/deposit-deal-record.ts";
import { canonicalQuoteDocumentPath } from "../../supabase/functions/_shared/quote-document-policy.ts";

export const DEPOSIT_STAGING_SAVED_QUOTE_ID_KEY = "DEPOSIT_STAGING_SAVED_QUOTE_ID";
export const STAGING_RUN_FIXTURE_SCHEMA = "deposit-deal-packet-staging-run/v1" as const;
export const STAGING_USED_IDS_SCHEMA = "deposit-deal-packet-staging-used-ids/v1" as const;
export const STAGING_LOCAL_NONCE_PREFIX = "deposit-deal-packet-staging/local/";
export const STAGING_ISOLATED_NONCE_PREFIX = "deposit-deal-packet-staging/run/";

export const MISSING_STAGING_RUN_SAVED_QUOTE_ID =
  "deposit staging run requires DEPOSIT_STAGING_SAVED_QUOTE_ID";
export const MALFORMED_STAGING_RUN_SAVED_QUOTE_ID =
  "deposit staging run savedQuoteId is malformed";
export const RETIRED_STAGING_RUN_SAVED_QUOTE_ID =
  "deposit staging run refuses retired savedQuoteId 31313131-3131-4131-8131-313131313131";
export const RESERVED_STAGING_RUN_SAVED_QUOTE_ID =
  "deposit staging run refuses reserved fixture UUID";
export const REUSED_STAGING_RUN_SAVED_QUOTE_ID =
  "deposit staging run refuses reused savedQuoteId";
export const LOCAL_ID_NOT_ISOLATED_RUN =
  "deposit staging run isolated nonce refuses the local-acceptance savedQuoteId";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type StagingRunKind = "local" | "isolated";

export type StagingPacketFixtures = {
  ids: {
    retiredStagingSavedQuoteId: string;
    localAcceptanceSavedQuoteId: string;
    stagingCustomerQuoteId: string;
    historicalSavedQuoteId: string;
    historicalCustomerQuoteId: string;
    fixtureMotorId: string;
  };
  customer: {
    name: string;
    email: string;
    phone: string;
    addressLine1: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
  };
  staging: { depositAmount: string };
};

export type StagingRunFixture = {
  schema: typeof STAGING_RUN_FIXTURE_SCHEMA;
  kind: StagingRunKind;
  savedQuoteId: string;
  runNonce: string;
  resumeToken: string;
  quotePdfPath: string;
  adminPath: string;
  stripeCheckoutIdempotencyKey: string;
  createPaymentBody: {
    paymentType: "deposit";
    depositAmount: string;
    savedQuoteId: string;
    customerInfo: {
      name: string;
      email: string;
      phone: string;
      addressLine1: string;
      city: string;
      region: string;
      postalCode: string;
      country: string;
    };
  };
  sessionSets: string[];
  retiredSavedQuoteId: string;
  historicalSavedQuoteId: string;
};

export type StagingUsedIdsLedger = {
  schema: typeof STAGING_USED_IDS_SCHEMA;
  ids: string[];
};

const repoRoot = process.cwd();

export function defaultFixturesPath(): string {
  return path.join(repoRoot, "scripts/deposit-deal-packet-staging/fixtures.json");
}

export function defaultRunFixturePath(): string {
  return path.join(repoRoot, ".tmp/deposit-deal-packet-staging-run.json");
}

export function defaultUsedIdsPath(): string {
  return path.join(repoRoot, ".tmp/deposit-deal-packet-staging-used-saved-quote-ids.json");
}

export function loadStagingPacketFixtures(fixturesPath = defaultFixturesPath()): StagingPacketFixtures {
  return JSON.parse(readFileSync(fixturesPath, "utf8")) as StagingPacketFixtures;
}

export function parseStagingRunSavedQuoteId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return UUID_PATTERN.test(normalized) ? normalized : null;
}

export function stagingRunNonce(savedQuoteId: string, kind: StagingRunKind): string {
  const prefix = kind === "local" ? STAGING_LOCAL_NONCE_PREFIX : STAGING_ISOLATED_NONCE_PREFIX;
  return `${prefix}${savedQuoteId}`;
}

export function stagingResumeToken(savedQuoteId: string): string {
  return `dep_${savedQuoteId.replace(/-/g, "").slice(0, 24)}`;
}

export function stagingRunSessionSets(savedQuoteId: string, kind: StagingRunKind): string[] {
  return [
    `SET deposit_staging.saved_quote_id TO '${savedQuoteId}'`,
    `SET deposit_staging.run_nonce TO '${stagingRunNonce(savedQuoteId, kind)}'`,
  ];
}

export function reservedIsolatedStagingSavedQuoteIds(
  fixtures: StagingPacketFixtures = loadStagingPacketFixtures(),
): string[] {
  return [
    fixtures.ids.retiredStagingSavedQuoteId,
    fixtures.ids.localAcceptanceSavedQuoteId,
    fixtures.ids.stagingCustomerQuoteId,
    fixtures.ids.historicalSavedQuoteId,
    fixtures.ids.historicalCustomerQuoteId,
    fixtures.ids.fixtureMotorId,
  ].map((value) => value.toLowerCase());
}

export function localAcceptanceSavedQuoteId(
  fixtures: StagingPacketFixtures = loadStagingPacketFixtures(),
): string {
  return fixtures.ids.localAcceptanceSavedQuoteId.toLowerCase();
}

export function retiredStagingSavedQuoteId(
  fixtures: StagingPacketFixtures = loadStagingPacketFixtures(),
): string {
  return fixtures.ids.retiredStagingSavedQuoteId.toLowerCase();
}

export function assertOperatorStagingRunSavedQuoteId(
  value: unknown,
  options: {
    fixtures?: StagingPacketFixtures;
    usedIds?: readonly string[];
  } = {},
): string {
  const fixtures = options.fixtures || loadStagingPacketFixtures();
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed) {
    throw new Error(MISSING_STAGING_RUN_SAVED_QUOTE_ID);
  }
  const savedQuoteId = parseStagingRunSavedQuoteId(trimmed);
  if (!savedQuoteId) {
    throw new Error(MALFORMED_STAGING_RUN_SAVED_QUOTE_ID);
  }
  if (savedQuoteId === retiredStagingSavedQuoteId(fixtures)) {
    throw new Error(RETIRED_STAGING_RUN_SAVED_QUOTE_ID);
  }
  if (savedQuoteId === localAcceptanceSavedQuoteId(fixtures)) {
    throw new Error(LOCAL_ID_NOT_ISOLATED_RUN);
  }
  if (reservedIsolatedStagingSavedQuoteIds(fixtures).includes(savedQuoteId)) {
    throw new Error(RESERVED_STAGING_RUN_SAVED_QUOTE_ID);
  }
  const used = new Set((options.usedIds || []).map((id) => id.toLowerCase()));
  if (used.has(savedQuoteId)) {
    throw new Error(REUSED_STAGING_RUN_SAVED_QUOTE_ID);
  }
  return savedQuoteId;
}

export function buildStagingRunFixture(
  savedQuoteId: string,
  options: {
    kind?: StagingRunKind;
    fixtures?: StagingPacketFixtures;
  } = {},
): StagingRunFixture {
  const fixtures = options.fixtures || loadStagingPacketFixtures();
  const kind = options.kind || "isolated";
  const id = kind === "local"
    ? localAcceptanceSavedQuoteId(fixtures)
    : assertOperatorStagingRunSavedQuoteId(savedQuoteId, { fixtures });
  if (kind === "local" && parseStagingRunSavedQuoteId(savedQuoteId) !== id) {
    throw new Error("deposit staging run local fixture requires the local-acceptance savedQuoteId");
  }
  return {
    schema: STAGING_RUN_FIXTURE_SCHEMA,
    kind,
    savedQuoteId: id,
    runNonce: stagingRunNonce(id, kind),
    resumeToken: stagingResumeToken(id),
    quotePdfPath: canonicalQuoteDocumentPath(id),
    adminPath: adminDealPacketPath(id),
    stripeCheckoutIdempotencyKey: stripeCheckoutIdempotencyKey({ savedQuoteId: id }),
    createPaymentBody: {
      paymentType: "deposit",
      depositAmount: fixtures.staging.depositAmount,
      savedQuoteId: id,
      customerInfo: {
        name: fixtures.customer.name,
        email: fixtures.customer.email,
        phone: fixtures.customer.phone,
        addressLine1: fixtures.customer.addressLine1,
        city: fixtures.customer.city,
        region: fixtures.customer.region,
        postalCode: fixtures.customer.postalCode,
        country: fixtures.customer.country,
      },
    },
    sessionSets: stagingRunSessionSets(id, kind),
    retiredSavedQuoteId: retiredStagingSavedQuoteId(fixtures),
    historicalSavedQuoteId: fixtures.ids.historicalSavedQuoteId.toLowerCase(),
  };
}

export function readUsedStagingRunIds(ledgerPath: string): string[] {
  try {
    const parsed = JSON.parse(readFileSync(ledgerPath, "utf8")) as StagingUsedIdsLedger;
    if (parsed.schema !== STAGING_USED_IDS_SCHEMA || !Array.isArray(parsed.ids)) {
      return [];
    }
    return parsed.ids
      .map((value) => parseStagingRunSavedQuoteId(value))
      .filter((value): value is string => Boolean(value));
  } catch {
    return [];
  }
}

export function readExistingStagingRunFixture(fixturePath: string): StagingRunFixture | null {
  try {
    const parsed = JSON.parse(readFileSync(fixturePath, "utf8")) as StagingRunFixture;
    if (parsed.schema !== STAGING_RUN_FIXTURE_SCHEMA) return null;
    const savedQuoteId = parseStagingRunSavedQuoteId(parsed.savedQuoteId);
    return savedQuoteId ? { ...parsed, savedQuoteId } : null;
  } catch {
    return null;
  }
}

export function materializeIsolatedStagingRun(options: {
  savedQuoteId?: unknown;
  fixtures?: StagingPacketFixtures;
  fixturePath?: string;
  ledgerPath?: string;
}): StagingRunFixture {
  const fixtures = options.fixtures || loadStagingPacketFixtures();
  const fixturePath = options.fixturePath || defaultRunFixturePath();
  const ledgerPath = options.ledgerPath || defaultUsedIdsPath();
  const existing = readExistingStagingRunFixture(fixturePath);
  const usedIds = readUsedStagingRunIds(ledgerPath);
  if (existing?.savedQuoteId) usedIds.push(existing.savedQuoteId);
  const savedQuoteId = assertOperatorStagingRunSavedQuoteId(options.savedQuoteId, {
    fixtures,
    usedIds,
  });
  const fixture = buildStagingRunFixture(savedQuoteId, { kind: "isolated", fixtures });
  mkdirSync(path.dirname(fixturePath), { recursive: true });
  mkdirSync(path.dirname(ledgerPath), { recursive: true });
  const nextUsed = [...new Set([...readUsedStagingRunIds(ledgerPath), savedQuoteId])];
  writeFileSync(
    ledgerPath,
    `${JSON.stringify({ schema: STAGING_USED_IDS_SCHEMA, ids: nextUsed }, null, 2)}\n`,
  );
  writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`);
  return fixture;
}

function parseArgs(argv: string[]): { out: string; ledger: string } {
  const outFlag = argv.findIndex((arg) => arg === "--out");
  const ledgerFlag = argv.findIndex((arg) => arg === "--ledger");
  return {
    out: outFlag >= 0 && argv[outFlag + 1] ? argv[outFlag + 1] : defaultRunFixturePath(),
    ledger: ledgerFlag >= 0 && argv[ledgerFlag + 1] ? argv[ledgerFlag + 1] : defaultUsedIdsPath(),
  };
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const fixture = materializeIsolatedStagingRun({
    savedQuoteId: process.env[DEPOSIT_STAGING_SAVED_QUOTE_ID_KEY],
    fixturePath: args.out,
    ledgerPath: args.ledger,
  });
  console.log(`schema: ${fixture.schema}`);
  console.log(`savedQuoteId: ${fixture.savedQuoteId}`);
  console.log(`quotePdfPath: ${fixture.quotePdfPath}`);
  console.log(`adminPath: ${fixture.adminPath}`);
  console.log(`stripeCheckoutIdempotencyKey: ${fixture.stripeCheckoutIdempotencyKey}`);
  console.log(`fixture: ${args.out}`);
  for (const sql of fixture.sessionSets) {
    console.log(sql);
  }
}

const invokedName = process.argv[1] ? path.basename(process.argv[1]) : "";
const invoked = invokedName === "run-fixture.ts" || invokedName.startsWith("materialize");
if (invoked) main();
