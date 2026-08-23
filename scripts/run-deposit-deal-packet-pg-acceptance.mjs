#!/usr/bin/env node
/**
 * Disposable local PostgreSQL acceptance for the deposit deal-packet migration.
 * Unix-socket only. Synthetic fixtures. Never listens on TCP and never uses a
 * predictable global tmp path.
 */
import { spawn, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const migrationRel = "supabase/migrations/20260823120000_deposit_deal_packet.sql";
const migrationPath = path.join(repoRoot, migrationRel);
const bootstrapPath = path.join(repoRoot, "scripts/deposit-deal-packet-pg/bootstrap.sql");
const fixturesPath = path.join(repoRoot, "scripts/deposit-deal-packet-pg/historical-fixtures.sql");
const checksPath = path.join(repoRoot, "scripts/deposit-deal-packet-pg/checks.sql");
const stagingSeedPath = path.join(repoRoot, "scripts/deposit-deal-packet-staging/sql/seed.sql");
const stagingCleanupPath = path.join(repoRoot, "scripts/deposit-deal-packet-staging/sql/cleanup.sql");
const stagingSeedIds = {
  saved: [
    "31313131-3131-4131-8131-313131313131",
    "34343434-3434-4343-8343-343434343434",
  ],
  customer: [
    "32323232-3232-4232-8222-323232323232",
    "35353535-3535-4353-8353-353535353535",
  ],
};
const ignoredTmpRoot = path.join(repoRoot, ".tmp");
const database = "deposit_deal_packet_accept";
const concurrentDeal = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const tokenX = "0a0a0a0a-0a0a-4a0a-8a0a-0a0a0a0a0a0a";
const tokenY = "0b0b0b0b-0b0b-4b0b-8b0b-0b0b0b0b0b0b";
const unixPathLimit = process.platform === "darwin" ? 103 : 107;
const port = 55000 + (process.pid % 4000);

let started = false;
let binDir = "";
let clusterDir = "";
let socketDir = "";
let dataDir = "";
let logFile = "";

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

function envForSocket() {
  const env = {
    ...process.env,
    PGHOST: socketDir,
    PGPORT: String(port),
    PGUSER: process.env.USER || homedir().split("/").pop(),
    PGDATABASE: database,
    PGSSLMODE: "disable",
    PGOPTIONS: "-c client_min_messages=warning",
  };
  delete env.PGHOSTADDR;
  return env;
}

function psql(fileOrSql, isFile = false, databaseName = database, extraArgs = []) {
  const args = ["-v", "ON_ERROR_STOP=1", "-X", "-q", "-d", databaseName, ...extraArgs];
  if (isFile) args.push("-f", fileOrSql);
  else args.push("-c", fileOrSql);
  return run(bin("psql"), args, { env: envForSocket() });
}

function removeExactDir(dir) {
  if (dir && existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  }
}

function cleanup() {
  if (started && binDir && dataDir && existsSync(dataDir)) {
    run(bin("pg_ctl"), ["-D", dataDir, "-m", "fast", "stop"], {
      allowFailure: true,
    });
    started = false;
  }
  removeExactDir(clusterDir);
  if (socketDir && socketDir !== clusterDir) {
    removeExactDir(socketDir);
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
    const child = spawn(bin("psql"), ["-v", "ON_ERROR_STOP=1", "-X", "-t", "-A", "-d", database, "-c", claimSql(token)], {
      env: envForSocket(),
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

function resolveSocketDir(cluster) {
  const inCluster = path.join(cluster, `.s.PGSQL.${port}`);
  if (inCluster.length <= unixPathLimit) return cluster;
  return mkdtempSync(path.join(tmpdir(), "ddp-"));
}

function assertNoTcpListener() {
  const listen = run(bin("psql"), [
    "-d", "postgres",
    "-X",
    "-t",
    "-A",
    "-P", "footer=off",
    "-c", "SELECT current_setting('listen_addresses')",
  ], {
    env: { ...envForSocket(), PGDATABASE: "postgres" },
  });
  const listenValue = (listen.stdout || "").replace(/\(1 row\)/g, "").trim();
  if (listenValue !== "") {
    fail(`listen_addresses must be empty, got ${JSON.stringify(listenValue)}`);
  }

  const hba = readFileSync(path.join(dataDir, "pg_hba.conf"), "utf8");
  if (/(^|\n)\s*host(?:ssl|nossl)?\s/i.test(hba)) {
    fail("pg_hba.conf must not contain host TCP lines");
  }

  const log = existsSync(logFile) ? readFileSync(logFile, "utf8") : "";
  if (/listening on IPv/i.test(log)) {
    fail("PostgreSQL log reported a TCP listener");
  }
  if (!/listening on Unix/i.test(log)) {
    fail("PostgreSQL log did not report a Unix socket");
  }

  for (const tcpHost of ["127.0.0.1", "localhost", "::1"]) {
    const probe = run(bin("psql"), [
      "-h", tcpHost,
      "-p", String(port),
      "-d", "postgres",
      "-c", "SELECT 1",
    ], {
      allowFailure: true,
      env: { ...process.env, PGSSLMODE: "disable" },
    });
    if (probe.status === 0) {
      fail(`TCP psql to ${tcpHost}:${port} unexpectedly succeeded`);
    }
  }

  const lsof = run("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN"], { allowFailure: true });
  const lsofOut = `${lsof.stdout || ""}${lsof.stderr || ""}`;
  if (lsof.status === 0 && /LISTEN/.test(lsofOut)) {
    fail(`TCP listener is reachable on port ${port}: ${lsofOut.trim()}`);
  }
}

try {
  if (!existsSync(migrationPath)) fail(`missing unmodified migration ${migrationRel}`);
  if (port === 5432) fail("refusing default PostgreSQL port 5432");

  binDir = resolvePostgresBin();
  mkdirSync(ignoredTmpRoot, { recursive: true });
  clusterDir = mkdtempSync(path.join(ignoredTmpRoot, "ddp-"));
  dataDir = path.join(clusterDir, "data");
  logFile = path.join(clusterDir, "postgres.log");
  socketDir = resolveSocketDir(clusterDir);

  run(bin("initdb"), [
    "-D", dataDir,
    "--auth-local=trust",
    "--auth-host=scram-sha-256",
    "--encoding=UTF8",
    "--locale=en_US.UTF-8",
    "--no-instructions",
  ]);
  writeFileSync(path.join(dataDir, "postgresql.conf"), `${readFileSync(path.join(dataDir, "postgresql.conf"), "utf8")}
listen_addresses = ''
port = ${port}
unix_socket_directories = '${socketDir}'
fsync = off
synchronous_commit = off
full_page_writes = off
logging_collector = off
`);
  writeFileSync(path.join(dataDir, "pg_hba.conf"), "local all all trust\n");

  const start = run(bin("pg_ctl"), [
    "-D", dataDir,
    "-l", logFile,
    "-o", `-p ${port} -k ${socketDir} -c listen_addresses=`,
    "-w",
    "start",
  ]);
  if (start.status !== 0) fail("pg_ctl start failed");
  started = true;

  assertNoTcpListener();

  run(bin("createdb"), ["-h", socketDir, "-p", String(port), database], {
    env: { ...envForSocket(), PGDATABASE: "postgres" },
  });
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
  psql(`SELECT public.accept_record(
    'unix_socket_only_no_tcp',
    true,
    ${psqlLiteral(`socket=${socketDir} listen_addresses= empty port=${port}`)}
  );`);

  recordStagingSeedProofs();

  const copy = psql("COPY (SELECT name, passed, coalesce(detail, '') FROM public.accept_results ORDER BY ordinal) TO STDOUT");
  const results = parseResults(copy.stdout || "");
  const failed = results.filter((row) => !row.passed);

  console.log("PostgreSQL deposit deal-packet runtime acceptance");
  console.log(`socket=${socketDir} port=${port} database=${database} tcp=off`);
  console.log(`cluster=${clusterDir}`);
  console.log(`migration=${migrationRel} (unmodified)`);
  console.log(`assertions=${results.length} passed=${results.filter((row) => row.passed).length} failed=${failed.length}`);
  for (const row of results) {
    console.log(`${row.passed ? "PASS" : "FAIL"} ${row.name}${row.detail ? ` — ${row.detail}` : ""}`);
  }

  cleanup();
  if (existsSync(clusterDir) || (socketDir !== clusterDir && existsSync(socketDir))) {
    fail("cleanup left generated directories behind");
  }
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

function countStagingFixtureRows(databaseName) {
  const sql = `
    SELECT
      (SELECT count(*) FROM public.saved_quotes
        WHERE id IN ('${stagingSeedIds.saved.join("','")}'))
      +
      (SELECT count(*) FROM public.customer_quotes
        WHERE id IN ('${stagingSeedIds.customer.join("','")}'))
  `;
  const result = run(bin("psql"), ["-X", "-t", "-A", "-d", databaseName, "-c", sql], {
    env: { ...envForSocket(), PGDATABASE: databaseName },
  });
  return Number((result.stdout || "").trim());
}

function applySqlFile(filePath, databaseName, { allowFailure = false } = {}) {
  return run(bin("psql"), ["-v", "ON_ERROR_STOP=1", "-X", "-q", "-d", databaseName, "-f", filePath], {
    env: { ...envForSocket(), PGDATABASE: databaseName },
    allowFailure,
  });
}

function recordStagingSeedProofs() {
  const populatedSeed = applySqlFile(stagingSeedPath, database, { allowFailure: true });
  const populatedOutput = `${populatedSeed.stderr || ""}${populatedSeed.stdout || ""}`;
  const populatedRejected = populatedSeed.status !== 0
    && /deposit staging seed refuses a populated database/i.test(populatedOutput);
  const populatedZero = countStagingFixtureRows(database) === 0;
  psql(`SELECT public.accept_record(
    'staging_seed_rejects_populated_database',
    ${populatedRejected ? "true" : "false"},
    ${psqlLiteral(`status=${populatedSeed.status} ${populatedOutput.slice(0, 180)}`)}
  );`);
  psql(`SELECT public.accept_record(
    'staging_seed_populated_leaves_zero_fixtures',
    ${populatedZero ? "true" : "false"},
    ${psqlLiteral(`staging_fixture_rows=${countStagingFixtureRows(database)}`)}
  );`);

  const emptyDb = "deposit_deal_packet_staging_seed";
  run(bin("dropdb"), ["-h", socketDir, "-p", String(port), "--if-exists", emptyDb], {
    env: { ...envForSocket(), PGDATABASE: "postgres" },
    allowFailure: true,
  });
  run(bin("createdb"), ["-h", socketDir, "-p", String(port), emptyDb], {
    env: { ...envForSocket(), PGDATABASE: "postgres" },
  });
  applySqlFile(bootstrapPath, emptyDb);
  applySqlFile(migrationPath, emptyDb);
  applySqlFile(path.join(repoRoot, "scripts/deposit-deal-packet-pg/staging-seed-local-columns.sql"), emptyDb);
  const emptySeed = applySqlFile(stagingSeedPath, emptyDb, { allowFailure: true });
  const emptySeedCount = emptySeed.status === 0 ? countStagingFixtureRows(emptyDb) : -1;
  const emptySeedOk = emptySeed.status === 0 && emptySeedCount === 3;
  psql(`SELECT public.accept_record(
    'staging_seed_empty_database_succeeds',
    ${emptySeedOk ? "true" : "false"},
    ${psqlLiteral(`status=${emptySeed.status} staging_fixture_rows=${emptySeedCount} ${(emptySeed.stderr || "").slice(0, 280)}`)}
  );`);

  const emptyCleanup = applySqlFile(stagingCleanupPath, emptyDb, { allowFailure: true });
  const afterCleanup = emptyCleanup.status === 0 && countStagingFixtureRows(emptyDb) === 0;
  psql(`SELECT public.accept_record(
    'staging_cleanup_empty_database_zero_fixtures',
    ${afterCleanup ? "true" : "false"},
    ${psqlLiteral(`status=${emptyCleanup.status} staging_fixture_rows=${countStagingFixtureRows(emptyDb)}`)}
  );`);

  run(bin("psql"), [
    "-v", "ON_ERROR_STOP=1", "-X", "-q", "-d", emptyDb, "-c",
    `INSERT INTO public.saved_quotes (id, email, resume_token, quote_state)
     VALUES (
       '31313131-3131-4131-8131-313131313131',
       'ada@example.com',
       'decoy_313131313131313131313131',
       '{}'::jsonb
     );`,
  ], {
    env: { ...envForSocket(), PGDATABASE: emptyDb },
    allowFailure: true,
  });
  const decoyCleanup = applySqlFile(stagingCleanupPath, emptyDb, { allowFailure: true });
  const decoyCount = countStagingFixtureRows(emptyDb);
  const decoySurvived = decoyCleanup.status === 0 && decoyCount === 1;
  psql(`SELECT public.accept_record(
    'staging_cleanup_requires_identity_match',
    ${decoySurvived ? "true" : "false"},
    ${psqlLiteral(`status=${decoyCleanup.status} remaining_fixture_uuids=${decoyCount}`)}
  );`);

  run(bin("dropdb"), ["-h", socketDir, "-p", String(port), "--if-exists", emptyDb], {
    env: { ...envForSocket(), PGDATABASE: "postgres" },
    allowFailure: true,
  });
}
