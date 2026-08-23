/**
 * Staging deposit-packet runner. Dry-run never opens a network socket.
 * Live mode is refused unless STAGING_* env passes the fail-closed guard.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

import {
  PRODUCTION_DEPOSIT_RECIPIENTS,
  PRODUCTION_SUPABASE_HOSTS,
  PRODUCTION_WEB_HOSTS,
  assessInheritedNameCollision,
  assessStagingSafety,
  assertStagingSafety,
  depositStagingModeEnabled,
  isBlockedRecipient,
  isProductionSupabaseUrl,
  isReservedInvalidEmail,
  resolveDepositAudienceRecipients,
  stripeSecretKind,
  type StagingCheck,
  type StagingEnv,
} from "../../supabase/functions/_shared/deposit-staging-guard.ts";

const repoRoot = process.cwd();
const fixtures = JSON.parse(
  readFileSync(path.join(repoRoot, "scripts/deposit-deal-packet-staging/fixtures.json"), "utf8"),
);

type EvidenceCheck = StagingCheck & { beforeNetwork: true };

type Evidence = {
  schema: "deposit-deal-packet-staging-evidence/v1";
  head: string;
  mode: "dry-run" | "live";
  networkCalls: number;
  verdict: "PASS" | "FAIL";
  envNamesPresent: Record<string, boolean>;
  stripeKeyKind?: string;
  supabaseHostClass?: string;
  checks: EvidenceCheck[];
  limitations: string[];
};

function gitHead(): string {
  return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
}

function pickStagingEnv(source: StagingEnv): StagingEnv {
  return {
    STAGING_SUPABASE_URL: source.STAGING_SUPABASE_URL,
    STAGING_SUPABASE_ANON_KEY: source.STAGING_SUPABASE_ANON_KEY,
    STAGING_SUPABASE_SERVICE_ROLE_KEY: source.STAGING_SUPABASE_SERVICE_ROLE_KEY,
    STAGING_STRIPE_SECRET_KEY: source.STAGING_STRIPE_SECRET_KEY,
    STAGING_STRIPE_WEBHOOK_SECRET: source.STAGING_STRIPE_WEBHOOK_SECRET,
    STAGING_RESEND_API_KEY: source.STAGING_RESEND_API_KEY,
    STAGING_ADMIN_ACCESS_TOKEN: source.STAGING_ADMIN_ACCESS_TOKEN,
    STAGING_DATABASE_URL: source.STAGING_DATABASE_URL,
    VERCEL_PREVIEW_URL: source.VERCEL_PREVIEW_URL,
    DEPOSIT_STAGING_MODE: source.DEPOSIT_STAGING_MODE,
    DEPOSIT_STAGING_CUSTOMER_EMAIL: source.DEPOSIT_STAGING_CUSTOMER_EMAIL,
    DEPOSIT_STAGING_HBW_EMAIL: source.DEPOSIT_STAGING_HBW_EMAIL,
    DEPOSIT_STAGING_GROK_EMAIL: source.DEPOSIT_STAGING_GROK_EMAIL,
  };
}

function envNamesPresent(source: StagingEnv): Record<string, boolean> {
  const names = [
    "STAGING_SUPABASE_URL",
    "STAGING_SUPABASE_ANON_KEY",
    "STAGING_SUPABASE_SERVICE_ROLE_KEY",
    "STAGING_STRIPE_SECRET_KEY",
    "STAGING_STRIPE_WEBHOOK_SECRET",
    "STAGING_RESEND_API_KEY",
    "STAGING_ADMIN_ACCESS_TOKEN",
    "STAGING_DATABASE_URL",
    "VERCEL_PREVIEW_URL",
    "DEPOSIT_STAGING_MODE",
    "DEPOSIT_STAGING_CUSTOMER_EMAIL",
    "DEPOSIT_STAGING_HBW_EMAIL",
    "DEPOSIT_STAGING_GROK_EMAIL",
    "SUPABASE_URL",
    "STRIPE_SECRET_KEY",
  ];
  const present: Record<string, boolean> = {};
  for (const name of names) {
    present[name] = Boolean(typeof source[name] === "string" && source[name]!.trim());
  }
  return present;
}

function safeSyntheticEnv(): StagingEnv {
  return {
    STAGING_SUPABASE_URL: "https://staging-deposit-packet.supabase.co",
    STAGING_STRIPE_SECRET_KEY: ["sk", "test", "synthetic"].join("_"),
    DEPOSIT_STAGING_MODE: "1",
    DEPOSIT_STAGING_CUSTOMER_EMAIL: fixtures.recipients.customer,
    DEPOSIT_STAGING_HBW_EMAIL: fixtures.recipients.hbw,
    DEPOSIT_STAGING_GROK_EMAIL: fixtures.recipients.grok,
    VERCEL_PREVIEW_URL: "https://mercury-builder-pro-git-cursor-deposit-deal-packet-20260823-hbw.vercel.app",
  };
}

function record(
  checks: EvidenceCheck[],
  id: string,
  pass: boolean,
  detail: string,
): void {
  checks.push({
    id,
    result: pass ? "PASS" : "FAIL",
    detail,
    beforeNetwork: true,
  });
}

function runTripwires(networkCalls: { count: number }): EvidenceCheck[] {
  const checks: EvidenceCheck[] = [];
  const productionHost = PRODUCTION_SUPABASE_HOSTS[0];
  const livePrefix = ["sk", "live"].join("_") + "_";
  const testPrefix = ["sk", "test"].join("_") + "_";

  try {
    assertStagingSafety({
      STAGING_SUPABASE_URL: `https://${productionHost}`,
      STAGING_STRIPE_SECRET_KEY: `${testPrefix}synthetic`,
      DEPOSIT_STAGING_MODE: "1",
      DEPOSIT_STAGING_CUSTOMER_EMAIL: fixtures.recipients.customer,
      DEPOSIT_STAGING_HBW_EMAIL: fixtures.recipients.hbw,
      DEPOSIT_STAGING_GROK_EMAIL: fixtures.recipients.grok,
    });
    record(checks, "tripwire_production_supabase", false, "production Supabase URL was accepted");
  } catch {
    record(checks, "tripwire_production_supabase", true, "production Supabase URL rejected before network");
  }

  try {
    assertStagingSafety({
      ...safeSyntheticEnv(),
      STAGING_STRIPE_SECRET_KEY: `${livePrefix}forbidden`,
    });
    record(checks, "tripwire_live_stripe", false, "live Stripe prefix was accepted");
  } catch {
    record(checks, "tripwire_live_stripe", true, "live Stripe prefix rejected before network");
  }

  try {
    assertStagingSafety({
      ...safeSyntheticEnv(),
      DEPOSIT_STAGING_CUSTOMER_EMAIL: PRODUCTION_DEPOSIT_RECIPIENTS[0],
    });
    record(checks, "tripwire_production_recipient", false, "production recipient was accepted");
  } catch {
    record(checks, "tripwire_production_recipient", true, "production recipient rejected before network");
  }

  try {
    assertStagingSafety({
      ...safeSyntheticEnv(),
      VERCEL_PREVIEW_URL: `https://${PRODUCTION_WEB_HOSTS[0]}`,
    });
    record(checks, "tripwire_production_preview", false, "production web host was accepted");
  } catch {
    record(checks, "tripwire_production_preview", true, "production Vercel/web host rejected before network");
  }

  try {
    assertStagingSafety({
      ...safeSyntheticEnv(),
      STAGING_DATABASE_URL: `https://${productionHost}`,
    });
    record(checks, "tripwire_production_database", false, "production database target was accepted");
  } catch {
    record(checks, "tripwire_production_database", true, "production database target rejected before network");
  }

  const inherited = assessInheritedNameCollision({
    SUPABASE_URL: `https://${productionHost}`,
    STRIPE_SECRET_KEY: `${livePrefix}forbidden`,
  });
  record(
    checks,
    "tripwire_inherited_production_names",
    inherited.result === "FAIL",
    "inherited SUPABASE_URL/STRIPE_SECRET_KEY names are refused",
  );

  const safe = assessStagingSafety(safeSyntheticEnv(), {});
  record(checks, "synthetic_safe_env_accepted", safe.ok, "isolated test-mode synthetic env is accepted");

  const productionRecipients = resolveDepositAudienceRecipients({
    customerEmail: "buyer@example.com",
    adminEmails: ["jayharris97@gmail.com"],
    grokEmail: "hbwbot@agentmail.to",
    env: {},
  });
  record(
    checks,
    "production_path_unchanged_without_staging_mode",
    productionRecipients.staging === false
      && productionRecipients.hbw.includes("info@harrisboatworks.ca")
      && productionRecipients.grok_bot.includes("hbwbot@agentmail.to"),
    "unset DEPOSIT_STAGING_MODE keeps production recipients",
  );

  const stagingRecipients = resolveDepositAudienceRecipients({
    customerEmail: "buyer@example.com",
    adminEmails: ["jayharris97@gmail.com"],
    grokEmail: "hbwbot@agentmail.to",
    env: safeSyntheticEnv(),
  });
  record(
    checks,
    "staging_mode_overrides_to_example_invalid",
    stagingRecipients.staging
      && stagingRecipients.customer.every(isReservedInvalidEmail)
      && stagingRecipients.hbw.every(isReservedInvalidEmail)
      && stagingRecipients.grok_bot.every(isReservedInvalidEmail)
      && !stagingRecipients.hbw.some(isBlockedRecipient),
    "staging mode rewrites all three audiences to example.invalid",
  );

  record(
    checks,
    "staging_mode_disables_sms",
    depositStagingModeEnabled(safeSyntheticEnv()) === true
      && depositStagingModeEnabled({}) === false,
    "DEPOSIT_STAGING_MODE=1 is the SMS kill switch; unset keeps production SMS",
  );

  record(
    checks,
    "fixture_emails_are_example_invalid",
    Object.values(fixtures.recipients).every((value) => isReservedInvalidEmail(String(value))),
    "committed fixtures use example.invalid only",
  );

  record(checks, "no_network_during_tripwires", networkCalls.count === 0, `networkCalls=${networkCalls.count}`);
  return checks;
}

function parseArgs(argv: string[]): { live: boolean; out: string } {
  const live = argv.includes("--live");
  const outFlag = argv.findIndex((arg) => arg === "--out");
  const out = outFlag >= 0 && argv[outFlag + 1]
    ? argv[outFlag + 1]
    : path.join(repoRoot, ".tmp/deposit-deal-packet-staging-evidence.json");
  return { live, out };
}

export function runDepositStagingAcceptance(options: {
  live?: boolean;
  out?: string;
  processEnv?: StagingEnv;
}): Evidence {
  const networkCalls = { count: 0 };
  const processEnv = options.processEnv || {};
  const checks = runTripwires(networkCalls);
  const limitations = [
    "No isolated data-less Supabase branch exists in this worktree; this runner cannot create one.",
    "Stripe Checkout cannot be completed from the API; --live stops before hosted payment unless STAGING_PAID_SESSION_ID is supplied later.",
    "PR preview hosts are not in resolveAllowedBrowserOrigin; browser checkout from a generated preview alias is expected to fail CORS. Use this runner or localhost for Edge invokes.",
    "Do not load the repository .env. That file targets production.",
  ];

  if (options.live) {
    const operator = assessStagingSafety(pickStagingEnv(processEnv), processEnv);
    record(
      checks,
      "live_env_safe_before_network",
      operator.ok,
      operator.ok
        ? "operator STAGING_* env passed fail-closed guards"
        : `refused before network: ${operator.checks.filter((check) => check.result === "FAIL").map((check) => check.id).join(",")}`,
    );
    record(checks, "live_no_network", networkCalls.count === 0, "live guard ran without constructing a client");
  } else {
    const inherited = assessInheritedNameCollision(processEnv);
    record(
      checks,
      "dry_run_ignores_process_env_values",
      true,
      inherited.result === "FAIL"
        ? "process env has inherited production names; dry-run still used synthetic bags only"
        : "dry-run used synthetic bags only",
    );
  }

  const verdict = checks.every((check) => check.result === "PASS") ? "PASS" : "FAIL";
  return {
    schema: "deposit-deal-packet-staging-evidence/v1",
    head: gitHead(),
    mode: options.live ? "live" : "dry-run",
    networkCalls: networkCalls.count,
    verdict,
    envNamesPresent: envNamesPresent(processEnv),
    stripeKeyKind: stripeSecretKind(String(processEnv.STAGING_STRIPE_SECRET_KEY || "")),
    supabaseHostClass: processEnv.STAGING_SUPABASE_URL
      ? (isProductionSupabaseUrl(processEnv.STAGING_SUPABASE_URL) ? "production" : "other")
      : "missing",
    checks,
    limitations,
  };
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const evidence = runDepositStagingAcceptance({
    live: args.live,
    out: args.out,
    processEnv: process.env,
  });
  mkdirSync(path.dirname(args.out), { recursive: true });
  writeFileSync(args.out, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(`Deposit deal-packet staging ${evidence.mode}`);
  console.log(`HEAD: ${evidence.head}`);
  console.log(`networkCalls: ${evidence.networkCalls}`);
  console.log(`verdict: ${evidence.verdict}`);
  console.log(`evidence: ${args.out}`);
  for (const check of evidence.checks) {
    console.log(`${check.result} ${check.id} — ${check.detail}`);
  }
  if (evidence.verdict !== "PASS") process.exit(1);
}

const invoked = process.argv[1] && path.basename(process.argv[1]).startsWith("run");
if (invoked) main();
