#!/usr/bin/env node
/**
 * Fail-closed secret scan for the deposit deal-packet acceptance surface.
 * Does not contact any host.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const patterns = [
  { name: "stripe_live_secret", re: /sk_live_[A-Za-z0-9]+/ },
  { name: "stripe_live_restricted", re: /rk_live_[A-Za-z0-9]+/ },
  { name: "stripe_webhook_secret", re: /whsec_[A-Za-z0-9]{16,}/ },
  { name: "resend_api_key", re: /\bre_[A-Za-z0-9]{20,}\b/ },
  { name: "supabase_jwt", re: /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/ },
  { name: "remote_postgres", re: /postgres(?:ql)?:\/\/[^\s'"]+@(?!127\.0\.0\.1\b)(?!localhost\b)[A-Za-z0-9.-]+/i },
];

const files = execFileSync("git", ["ls-files", "-c", "-o", "--exclude-standard", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean)
  .filter((file) => (
    file.startsWith("scripts/deposit-deal-packet-pg/")
    || file.startsWith("scripts/deposit-deal-packet-staging/")
    || file.startsWith("scripts/run-deposit-deal-packet")
    || file.startsWith("scripts/scan-deposit-deal-packet")
    || file.startsWith("src/lib/__tests__/")
    || file === "docs/deposit-deal-packet-acceptance.md"
    || file === "docs/STAGING_ACCEPTANCE.md"
    || file === "supabase/migrations/20260823120000_deposit_deal_packet.sql"
    || file === "supabase/functions/_shared/deposit-staging-guard.ts"
  ));

const findings = [];
for (const file of files) {
  const text = readFileSync(path.join(process.cwd(), file), "utf8");
  for (const { name, re } of patterns) {
    if (re.test(text)) findings.push(`${file}: ${name}`);
  }
}

const officialResendTest = /^(delivered|bounced|complained)(?:\+[a-z0-9]+(?:[._-][a-z0-9]+)*)?@resend\.dev$|^suppressed@resend\.dev$/;
const packetAllowlist = new Set([
  "delivered+deposit-customer@resend.dev",
  "delivered+deposit-hbw@resend.dev",
  "delivered+deposit-grok@resend.dev",
  "bounced+deposit-retry@resend.dev",
]);
const fixtures = JSON.parse(
  readFileSync(path.join(process.cwd(), "scripts/deposit-deal-packet-staging/fixtures.json"), "utf8"),
);
for (const [role, value] of Object.entries(fixtures.recipients || {})) {
  if (!officialResendTest.test(String(value)) || !packetAllowlist.has(String(value))) {
    findings.push(`scripts/deposit-deal-packet-staging/fixtures.json: recipient_${role}_not_resend_test`);
  }
}
if (!packetAllowlist.has(String(fixtures.failureRecipients?.retry || ""))) {
  findings.push("scripts/deposit-deal-packet-staging/fixtures.json: failure_recipient_not_allowlisted");
}
if (!/@example\.invalid$/i.test(String(fixtures.customer?.email || ""))) {
  findings.push("scripts/deposit-deal-packet-staging/fixtures.json: identity_not_example_invalid");
}
const envExample = readFileSync(
  path.join(process.cwd(), "scripts/deposit-deal-packet-staging/env.example"),
  "utf8",
);
for (const name of [
  "DEPOSIT_STAGING_CUSTOMER_EMAIL",
  "DEPOSIT_STAGING_HBW_EMAIL",
  "DEPOSIT_STAGING_GROK_EMAIL",
]) {
  const match = envExample.match(new RegExp(`^${name}=(\\S+)`, "m"));
  if (!match || !packetAllowlist.has(match[1])) {
    findings.push(`scripts/deposit-deal-packet-staging/env.example: ${name}_not_allowlisted`);
  }
}
if (/^DEPOSIT_STAGING_(CUSTOMER|HBW|GROK)_EMAIL=.*@example\.invalid$/m.test(envExample)) {
  findings.push("scripts/deposit-deal-packet-staging/env.example: staging_send_uses_example_invalid");
}

if (findings.length > 0) {
  console.error("Secret scan failed:");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log(`Secret scan passed (${files.length} files, synthetic fixtures only)`);
process.exit(0);
