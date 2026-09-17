#!/usr/bin/env node
/**
 * Staging deposit-packet entrypoint. Dry-run is the default and never
 * contacts a host. Forwards to the TypeScript runner via tsx.
 */
import { spawnSync } from "node:child_process";
import process from "node:process";

const result = spawnSync("npx", [
  "tsx",
  "scripts/deposit-deal-packet-staging/run.ts",
  ...process.argv.slice(2),
], {
  stdio: "inherit",
  cwd: process.cwd(),
});

process.exit(result.status ?? 1);
