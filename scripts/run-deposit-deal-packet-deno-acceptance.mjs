#!/usr/bin/env node
/**
 * Real Deno typecheck for the three deposit deal-packet Edge Functions
 * and the shared modules they changed. No provider calls.
 */
import { spawnSync } from "node:child_process";
import process from "node:process";

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

const result = spawnSync("npx", [
  "-y",
  "deno",
  "check",
  "--config",
  "supabase/functions/deno.json",
  ...files,
], {
  stdio: "inherit",
  cwd: process.cwd(),
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log("Deno check passed for:");
for (const file of files) console.log(`- ${file}`);
process.exit(0);
