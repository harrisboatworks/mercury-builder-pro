#!/usr/bin/env node
/**
 * Materialize one isolated staging run fixture. Never contacts a host.
 */
import { spawnSync } from "node:child_process";
import process from "node:process";

const result = spawnSync("npx", [
  "tsx",
  "scripts/deposit-deal-packet-staging/run-fixture.ts",
  ...process.argv.slice(2),
], {
  stdio: "inherit",
  cwd: process.cwd(),
});

process.exit(result.status ?? 1);
