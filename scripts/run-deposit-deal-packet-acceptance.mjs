#!/usr/bin/env node
/**
 * Local staged acceptance runner for the deposit deal packet.
 * Synthetic fixtures only. Does not call Stripe, Resend, SMS, or remote Supabase.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const remainingRuntimeGates = [
  "Live Postgres trigger/RLS execution (no local Docker, psql, or supabase CLI)",
  "Deno Edge Function typecheck (no Deno binary)",
  "Signed Stripe webhook delivery against a real endpoint",
  "Live Resend provider delivery and Grok AgentMail inbox",
  "Live SMS",
  "Authenticated admin browser session against a deployed app",
];

const head = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).stdout.trim();

console.log("Deposit deal-packet staged acceptance");
console.log(`HEAD: ${head}`);
console.log("Live I/O: none");
console.log("");

const result = spawnSync("npm", ["run", "test:deposit-acceptance"], {
  stdio: "inherit",
  cwd: process.cwd(),
});

console.log("");
console.log("Remaining runtime gates (not executed):");
for (const gate of remainingRuntimeGates) {
  console.log(`- ${gate}`);
}

if (!existsSync("supabase/migrations/20260823120000_deposit_deal_packet.sql")) {
  process.exit(1);
}

process.exit(result.status ?? 1);
