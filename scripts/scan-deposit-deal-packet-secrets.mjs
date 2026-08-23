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
    || file.startsWith("scripts/run-deposit-deal-packet")
    || file.startsWith("scripts/scan-deposit-deal-packet")
    || file.startsWith("src/lib/__tests__/")
    || file === "docs/deposit-deal-packet-acceptance.md"
    || file === "supabase/migrations/20260823120000_deposit_deal_packet.sql"
  ));

const findings = [];
for (const file of files) {
  const text = readFileSync(path.join(process.cwd(), file), "utf8");
  for (const { name, re } of patterns) {
    if (re.test(text)) findings.push(`${file}: ${name}`);
  }
}

if (findings.length > 0) {
  console.error("Secret scan failed:");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log(`Secret scan passed (${files.length} files, synthetic fixtures only)`);
process.exit(0);
