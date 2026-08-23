#!/usr/bin/env node
/**
 * One-command local staged acceptance for the deposit deal packet.
 * Synthetic fixtures only. Does not call Stripe, Resend, SMS, or remote Supabase.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import process from "node:process";

const passedRuntimeGates = [
  "Focused Vitest suite (helpers, migration source, admin packet, mailer planner)",
  "Local PostgreSQL runtime: unmodified migration, triggers, RLS, grants, claim RPC race",
  "Deno check of create-payment, stripe-webhook, send-deposit-confirmation-email, and changed shared modules",
  "Identity twin (src/lib/deposit-identity.ts === supabase/functions/_shared/deposit-identity.ts)",
  "Secret scan of the deal-packet acceptance surface",
];

const remainingRuntimeGates = [
  "Signed Stripe webhook delivery against a real endpoint",
  "Live Resend provider delivery and Grok AgentMail inbox",
  "Live SMS",
  "Authenticated admin browser session against a deployed or preview app",
];

const head = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).stdout.trim();

function run(label, command, args) {
  console.log(`\n==> ${label}`);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    cwd: process.cwd(),
  });
  if (result.status !== 0) {
    console.error(`${label} failed`);
    process.exit(result.status ?? 1);
  }
}

console.log("Deposit deal-packet staged acceptance");
console.log(`HEAD: ${head}`);
console.log("Live I/O: none");

if (!existsSync("supabase/migrations/20260823120000_deposit_deal_packet.sql")) {
  process.exit(1);
}

run("identity twin", "cmp", [
  "-s",
  "src/lib/deposit-identity.ts",
  "supabase/functions/_shared/deposit-identity.ts",
]);
run("secret scan", "node", ["scripts/scan-deposit-deal-packet-secrets.mjs"]);
run("focused vitest", "npm", ["run", "test:deposit-acceptance"]);
run("postgresql runtime", "node", ["scripts/run-deposit-deal-packet-pg-acceptance.mjs"]);
run("deno check", "node", ["scripts/run-deposit-deal-packet-deno-acceptance.mjs"]);

console.log("\nPassed runtime gates:");
for (const gate of passedRuntimeGates) console.log(`- ${gate}`);
console.log("\nRemaining live-provider / authenticated-preview gates (not executed):");
for (const gate of remainingRuntimeGates) console.log(`- ${gate}`);
process.exit(0);
