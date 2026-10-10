#!/usr/bin/env node
/**
 * Real Deno typecheck for the three deposit deal-packet Edge Functions
 * and the shared modules they changed. No provider calls.
 *
 * Pins the same Deno contract as scripts/check-edge-functions.mjs:
 * deno@2.9.5, --config, optional --import-map, --node-modules-dir=none,
 * --lock, --frozen, --no-remote.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import process from "node:process";

const RUNTIME_CONFIG_PATH = "supabase/functions/deno.json";
const CHECK_CONFIG_PATH = "supabase/functions/deno.check.json";
const LOCK_PATH = "supabase/functions/deno.lock";

const files = [
  "supabase/functions/create-payment/index.ts",
  "supabase/functions/stripe-webhook/index.ts",
  "supabase/functions/send-deposit-confirmation-email/index.ts",
  "supabase/functions/_shared/create-payment-request.ts",
  "supabase/functions/_shared/deposit-deal-record.ts",
  "supabase/functions/_shared/deposit-email-deliveries.ts",
  "supabase/functions/_shared/deposit-identity.ts",
  "supabase/functions/_shared/deposit-payment-guard.ts",
  "supabase/functions/_shared/deposit-staging-guard.ts",
  "supabase/functions/_shared/deposit-policy.ts",
  "supabase/functions/_shared/deposit-email-templates.ts",
];

const denoArgs = [
  "--yes",
  "deno@2.9.5",
  "check",
  "--config",
  RUNTIME_CONFIG_PATH,
];

if (existsSync(CHECK_CONFIG_PATH)) {
  denoArgs.push("--import-map", CHECK_CONFIG_PATH);
}

denoArgs.push(
  "--node-modules-dir=none",
  `--lock=${LOCK_PATH}`,
  "--frozen",
  "--no-remote",
  ...files,
);

const result = spawnSync(process.platform === "win32" ? "npx.cmd" : "npx", denoArgs, {
  stdio: "inherit",
  cwd: process.cwd(),
});

if (result.error) {
  console.error(`Unable to run the pinned Deno checker: ${result.error.message}`);
  process.exit(1);
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log("Deno check passed for:");
for (const file of files) console.log(`- ${file}`);
process.exit(0);
