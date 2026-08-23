#!/usr/bin/env node
/**
 * Disposable local PostgreSQL acceptance for the deposit deal-packet migration.
 * Synthetic fixtures only. Refuses any non-loopback host and the default 5432 port.
 */
import { spawn, spawnSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const migrationRel = "supabase/migrations/20260823120000_deposit_deal_packet.sql";
const migrationPath = path.join(repoRoot, migrationRel);
const bootstrapPath = path.join(repoRoot, "scripts/deposit-deal-packet-pg/bootstrap.sql");
const fixturesPath = path.join(repoRoot, "scripts/deposit-deal-packet-pg/historical-fixtures.sql");
const checksPath = path.join(repoRoot, "scripts/deposit-deal-packet-pg/checks.sql");
const workRoot = path.join(repoRoot, ".tmp/deposit-deal-packet-pg");
const dataDir = path.join(workRoot, "data");
const logFile = path.join(workRoot, "postgres.log");
const host = "127.0.0.1";
const port = Number(process.env.DEPOSIT_ACCEPT_PG_PORT || 55432);
const socketDir = `/tmp/ddp-pg-${port}`;
const database = "deposit_deal_packet_accept";
const concurrentDeal = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const tokenX = "0a0a0a0a-0a0a-4a0a-8a0a-0a0a0a0a0a0a";
const tokenY = "0b0b0b0b-0b0b-4b0b-8b0b-0b0b0b0b0b0b";

let started = false;
let binDir = "";

function fail(message) {
  throw new Error(message);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    cwd: repoRoot,
    ...options,
  });
  if (result.status !== 0 && options.allowFailure !== true) {
    const stderr = (result.stderr || "").trim();
    const stdout = (result.stdout || "").trim();
    fail(`${command} ${args.join(" ")} failed (${result.status}): ${stderr || stdout}`);
  }
  return result;
}

function resolvePostgresBin() {
  const brew = run("brew", ["--prefix", "postgresql@17"], { allowFailure: true });
  const prefix = brew.status === 0 ? brew.stdout.trim() : "";
  const candidates = [
    prefix ? path.join(prefix, "bin") : "",
    "/opt/homebrew/opt/postgresql@17/bin",
    "/usr/local/opt/postgresql@17/bin",
  ].filter(Boolean);
  for (const dir of candidates) {
    if (existsSync(path.join(dir, "pg_ctl")) && existsSync(path.join(dir, "psql"))) {
      return dir;
    }
  }
  fail("postgresql@17 binaries were not found; install with brew install postgresql@17");
}

function bin(name) {
  return path.join(binDir, name);
}

function envForPs() {
  return {
    ...process.env,
    PGHOST: host,
    PGPORT: String(port),
    PGUSER: process.env.USER || homedir().split("/").pop(),
    PGDATABASE: database,
    PGSSLMODE: "disable",
    PGOPTIONS: "-c client_min_messages=warning",
  };
}

function psql(fileOrSql, isFile = false) {
  const args = ["-v", "ON_ERROR_STOP=1", "-X", "-q"];
  if (isFile) args.push("-f", fileOrSql);
  else args.push("-c", fileOrSql);
  return run(bin("psql"), args, { env: envForPs() });
}

function cleanup() {
  if (started && binDir && existsSync(dataDir)) {
    run(bin("pg_ctl"), ["-D", dataDir, "-m", "fast", "stop"], {
      allowFailure: true,
    });
    started = false;
  }
  if (existsSync(workRoot)) {
    rmSync(workRoot, { recursive: true, force: true });
  }
  if (existsSync(socketDir)) {
    rmSync(socketDir, { recursive: true, force: true });
  }
}

function stopOnSignal() {
  cleanup();
  process.exit(1);
}

process.on("SIGINT", stopOnSignal);
process.on("SIGTERM", stopOnSignal);

function claimSql(token) {
  return `
    SET ROLE service_role;
    SELECT set_config('accept.role', 'service_role', false);
    SELECT pg_sleep(0.25);
    SELECT status
    FROM public.claim_deposit_email_delivery(
      '${concurrentDeal}'::uuid,
      'customer',
      '${token}'::uuid,
      120
    );
  `;
}

function spawnClaim(token) {
  return new Promise((resolve) => {
    const child = spawn(bin("psql"), ["-v", "ON_ERROR_STOP=1", "-X", "-t", "-A", "-c", claimSql(token)], {
      env: envForPs(),
      cwd: repoRoot,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("close", (status) => {
      resolve({ status, stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
}

function parseResults(copyOut) {
  return copyOut
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, passed, ...rest] = line.split("\t");
      return { name, passed: passed === "t", detail: rest.join("\t") };
    });
}

try {
  if (!existsSync(migrationPath)) fail(`missing unmodified migration ${migrationRel}`);
  if (host !== "127.0.0.1") fail("refusing non-loopback PostgreSQL host");
  if (port === 5432) fail("refusing default PostgreSQL port 5432");

  binDir = resolvePostgresBin();
  if (existsSync(workRoot)) rmSync(workRoot, { recursive: true, force: true });
  mkdirSync(workRoot, { recursive: true });
  mkdirSync(socketDir, { recursive: true });

  run(bin("initdb"), [
    "-D", dataDir,
    "--auth=trust",
    "--encoding=UTF8",
    "--locale=en_US.UTF-8",
    "--no-instructions",
  ]);
  appendFileSync(path.join(dataDir, "postgresql.conf"), `
listen_addresses = '${host}'
port = ${port}
unix_socket_directories = '${socketDir}'
fsync = off
synchronous_commit = off
full_page_writes = off
logging_collector = off
`);
  writeFileSync(path.join(dataDir, "pg_hba.conf"), [
    "local all all trust",
    `host all all ${host}/32 trust`,
    "",
  ].join("\n"));

  const start = run(bin("pg_ctl"), [
    "-D", dataDir,
    "-l", logFile,
    "-o", `-p ${port} -k ${socketDir} -h ${host}`,
    "-w",
    "start",
  ]);
  if (start.status !== 0) fail("pg_ctl start failed");
  started = true;

  run(bin("createdb"), ["-h", host, "-p", String(port), database]);
  psql(bootstrapPath, true);
  psql(fixturesPath, true);
  psql(migrationPath, true);
  psql(checksPath, true);

  const raced = await Promise.all([spawnClaim(tokenX), spawnClaim(tokenY)]);
  const sending = raced.filter((result) => result.status === 0 && /\bsending\b/.test(result.stdout));
  const failedLaunch = raced.filter((result) => result.status !== 0);
  const concurrentPassed = sending.length === 1 && failedLaunch.length === 0;
  const concurrentDetail = raced.map((result, index) => (
    `session${index + 1} status=${result.status} out=${JSON.stringify(result.stdout)} err=${JSON.stringify(result.stderr)}`
  )).join("; ");
  psql(`SELECT public.accept_record(
    'concurrent_claim_exactly_one_winner',
    ${concurrentPassed ? "true" : "false"},
    ${psqlLiteral(concurrentDetail)}
  );`);

  const copy = psql("COPY (SELECT name, passed, coalesce(detail, '') FROM public.accept_results ORDER BY ordinal) TO STDOUT");
  const results = parseResults(copy.stdout || "");
  const failed = results.filter((row) => !row.passed);

  console.log("PostgreSQL deposit deal-packet runtime acceptance");
  console.log(`host=${host} port=${port} database=${database}`);
  console.log(`migration=${migrationRel} (unmodified)`);
  console.log(`assertions=${results.length} passed=${results.filter((row) => row.passed).length} failed=${failed.length}`);
  for (const row of results) {
    console.log(`${row.passed ? "PASS" : "FAIL"} ${row.name}${row.detail ? ` — ${row.detail}` : ""}`);
  }

  cleanup();
  if (failed.length > 0) process.exit(1);
  process.exit(0);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  cleanup();
  process.exit(1);
}

function psqlLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}
