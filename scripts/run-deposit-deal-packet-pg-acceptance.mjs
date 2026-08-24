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
const stagingFixtures = JSON.parse(
  readFileSync(path.join(repoRoot, "scripts/deposit-deal-packet-staging/fixtures.json"), "utf8"),
);
const stagingSeedPath = path.join(repoRoot, "scripts/deposit-deal-packet-staging/sql/seed.sql");
const stagingCleanupPath = path.join(repoRoot, "scripts/deposit-deal-packet-staging/sql/cleanup.sql");
const stagingReadbackPath = path.join(repoRoot, "scripts/deposit-deal-packet-staging/sql/readback.sql");
const localStagingSavedQuoteId = stagingFixtures.ids.localAcceptanceSavedQuoteId;
const retiredStagingSavedQuoteId = stagingFixtures.ids.retiredStagingSavedQuoteId;
const historicalSavedQuoteId = stagingFixtures.ids.historicalSavedQuoteId;
const isolatedExampleSavedQuoteId = "38383838-3838-4838-8838-383838383838";
const hostedBootstrapPath = path.join(repoRoot, "scripts/deposit-deal-packet-staging/sql/hosted-bootstrap.sql");
const hostedVerifyPath = path.join(repoRoot, "scripts/deposit-deal-packet-staging/sql/hosted-bootstrap-verify.sql");
const hostedShapePath = path.join(repoRoot, "scripts/deposit-deal-packet-staging/sql/hosted-shape-local.sql");
const hostedOlderAclPath = path.join(repoRoot, "scripts/deposit-deal-packet-staging/sql/hosted-acl-older-form.sql");
const hostedProjectRef = "abcdabcdabcdabcdabcd";
const hostedNonce = `deposit-deal-packet-staging/${hostedProjectRef}`;
const fixtureMotorId = "36363636-3636-4636-8636-363636363636";
const hostedRunnerRole = "deposit_hosted_runner";
const stagingSeedIds = {
  saved: [
    localStagingSavedQuoteId,
    historicalSavedQuoteId,
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
  recordHostedBootstrapProofs();
  recordHostedShapeBootstrapProofs();

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
  const quoteSql = `
    SELECT
      (SELECT count(*) FROM public.saved_quotes
        WHERE id IN ('${stagingSeedIds.saved.join("','")}'))
      +
      (SELECT count(*) FROM public.customer_quotes
        WHERE id IN ('${stagingSeedIds.customer.join("','")}'))
  `;
  const quotes = Number(psqlValue(databaseName, quoteSql));
  const motorTable = psqlValue(databaseName, "SELECT to_regclass('public.motor_models') IS NOT NULL");
  if (motorTable !== "t") return quotes;
  const motors = Number(psqlValue(
    databaseName,
    `SELECT count(*) FROM public.motor_models WHERE id = '${fixtureMotorId}'`,
  ));
  return quotes + motors;
}

function applySqlFile(filePath, databaseName, { allowFailure = false } = {}) {
  return applySqlFileWithSets(filePath, databaseName, [], { allowFailure });
}

function stagingRunSets(savedQuoteId, kind) {
  return [
    `SET deposit_staging.saved_quote_id TO '${savedQuoteId}'`,
    `SET deposit_staging.run_nonce TO 'deposit-deal-packet-staging/${kind}/${savedQuoteId}'`,
  ];
}

function localStagingRunSets() {
  return stagingRunSets(localStagingSavedQuoteId, "local");
}

function applyStagingSql(filePath, databaseName, extraSets = [], { allowFailure = false } = {}) {
  return applySqlFileWithSets(filePath, databaseName, [...extraSets, ...localStagingRunSets()], {
    allowFailure,
  });
}

function applySqlFileWithSets(filePath, databaseName, sessionSets = [], { allowFailure = false } = {}) {
  const args = ["-v", "ON_ERROR_STOP=1", "-X", "-q", "-d", databaseName];
  for (const sql of sessionSets) args.push("-c", sql);
  args.push("-f", filePath);
  return run(bin("psql"), args, {
    env: { ...envForSocket(), PGDATABASE: databaseName },
    allowFailure,
  });
}

function countPublicPacketTables(databaseName) {
  const sql = `
    SELECT count(*)
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('saved_quotes', 'customer_quotes', 'user_roles', 'motor_models', 'deposit_staging_marker')
  `;
  const result = run(bin("psql"), ["-X", "-t", "-A", "-d", databaseName, "-c", sql], {
    env: { ...envForSocket(), PGDATABASE: databaseName },
  });
  return Number((result.stdout || "").trim());
}

function psqlValue(databaseName, sql) {
  const result = run(bin("psql"), ["-X", "-t", "-A", "-d", databaseName, "-c", sql], {
    env: { ...envForSocket(), PGDATABASE: databaseName },
  });
  return (result.stdout || "").trim();
}

function hostedVerifyPassed(databaseName, sessionSets = []) {
  const args = ["-X", "-t", "-A", "-F", "\t", "-d", databaseName];
  for (const sql of sessionSets) args.push("-c", sql);
  args.push("-f", hostedVerifyPath);
  const result = run(bin("psql"), args, {
    env: { ...envForSocket(), PGDATABASE: databaseName },
    allowFailure: true,
  });
  const rows = (result.stdout || "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !/^SET\b/.test(line))
    .map((line) => {
      const [id, passed] = line.split("\t");
      return { id, passed: passed === "t" };
    });
  const required = [
    "marker_is_hosted_staging_v1",
    "quotes_bucket_is_private_pdf",
    "saved_quotes_edge_columns",
    "customer_quotes_edge_columns",
    "deposit_email_deliveries_exists",
    "motor_models_deposit_columns",
    "motor_models_rls_enabled",
    "has_role_exists",
    "has_role_execute_not_anon",
    "marker_rls_enabled",
    "marker_privileges_locked",
    "marker_applying_role_can_select",
    "public_table_acls_exact",
    "public_function_acls_exact",
  ];
  const byId = new Map(rows.map((row) => [row.id, row.passed]));
  return {
    ok: result.status === 0 && required.every((id) => byId.get(id) === true),
    detail: rows.map((row) => `${row.id}=${row.passed ? "t" : "f"}`).join(",") || (result.stderr || "").slice(0, 180),
  };
}

function recordStagingRunIdRejection(emptyDb, name, sessionSets, expectedMessage) {
  const before = countStagingFixtureRows(emptyDb);
  const applied = applySqlFileWithSets(stagingSeedPath, emptyDb, sessionSets, { allowFailure: true });
  const output = `${applied.stderr || ""}${applied.stdout || ""}`;
  const rejected = applied.status !== 0
    && expectedMessage.test(output)
    && countStagingFixtureRows(emptyDb) === before;
  psql(`SELECT public.accept_record(
    '${name}',
    ${rejected ? "true" : "false"},
    ${psqlLiteral(`status=${applied.status} rows=${countStagingFixtureRows(emptyDb)} ${output.slice(0, 180)}`)}
  );`);
}

function recordStagingSeedProofs() {
  const populatedSeed = applyStagingSql(stagingSeedPath, database, [], { allowFailure: true });
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

  recordStagingRunIdRejection(
    emptyDb,
    "staging_seed_missing_run_id_fails_before_insert",
    [],
    /deposit staging run requires SET deposit_staging.saved_quote_id TO a UUID before seed, cleanup, or readback/i,
  );
  recordStagingRunIdRejection(
    emptyDb,
    "staging_seed_malformed_run_id_fails_before_insert",
    stagingRunSets("not-a-uuid", "run"),
    /deposit staging run saved_quote_id is malformed/i,
  );
  recordStagingRunIdRejection(
    emptyDb,
    "staging_seed_retired_run_id_fails_before_insert",
    stagingRunSets(retiredStagingSavedQuoteId, "run"),
    /deposit staging run refuses retired savedQuoteId 31313131-3131-4131-8131-313131313131/i,
  );
  recordStagingRunIdRejection(
    emptyDb,
    "staging_seed_reserved_historical_run_id_fails_before_insert",
    stagingRunSets(historicalSavedQuoteId, "run"),
    /deposit staging run refuses reserved fixture UUID/i,
  );
  recordStagingRunIdRejection(
    emptyDb,
    "staging_seed_isolated_nonce_rejects_local_id",
    stagingRunSets(localStagingSavedQuoteId, "run"),
    /deposit staging run isolated nonce refuses the local-acceptance savedQuoteId/i,
  );
  recordStagingRunIdRejection(
    emptyDb,
    "staging_seed_local_nonce_rejects_fresh_id",
    stagingRunSets(isolatedExampleSavedQuoteId, "local"),
    /deposit staging run local nonce requires the local-acceptance savedQuoteId/i,
  );

  const emptySeed = applyStagingSql(stagingSeedPath, emptyDb, [], { allowFailure: true });
  const emptySeedCount = emptySeed.status === 0 ? countStagingFixtureRows(emptyDb) : -1;
  const seededPdfPath = emptySeed.status === 0
    ? psqlValue(emptyDb, `
        SELECT quote_pdf_path
        FROM public.saved_quotes
        WHERE id = '${localStagingSavedQuoteId}'
      `)
    : "";
  const emptySeedOk = emptySeed.status === 0
    && emptySeedCount === 4
    && seededPdfPath === `saved-quotes/${localStagingSavedQuoteId}/quote.pdf`;
  psql(`SELECT public.accept_record(
    'staging_seed_empty_database_succeeds',
    ${emptySeedOk ? "true" : "false"},
    ${psqlLiteral(`status=${emptySeed.status} staging_fixture_rows=${emptySeedCount} pdf=${seededPdfPath} ${(emptySeed.stderr || "").slice(0, 280)}`)}
  );`);

  const missingCleanup = applySqlFile(stagingCleanupPath, emptyDb, { allowFailure: true });
  const missingCleanupOutput = `${missingCleanup.stderr || ""}${missingCleanup.stdout || ""}`;
  const missingCleanupRejected = missingCleanup.status !== 0
    && /deposit staging run requires SET deposit_staging.saved_quote_id TO a UUID before seed, cleanup, or readback/i.test(missingCleanupOutput)
    && countStagingFixtureRows(emptyDb) === 4;
  psql(`SELECT public.accept_record(
    'staging_cleanup_missing_run_id_fails',
    ${missingCleanupRejected ? "true" : "false"},
    ${psqlLiteral(`status=${missingCleanup.status} staging_fixture_rows=${countStagingFixtureRows(emptyDb)}`)}
  );`);

  const missingReadback = applySqlFile(stagingReadbackPath, emptyDb, { allowFailure: true });
  const missingReadbackOutput = `${missingReadback.stderr || ""}${missingReadback.stdout || ""}`;
  const missingReadbackRejected = missingReadback.status !== 0
    && /deposit staging run requires SET deposit_staging.saved_quote_id TO a UUID before seed, cleanup, or readback/i.test(missingReadbackOutput);
  psql(`SELECT public.accept_record(
    'staging_readback_missing_run_id_fails',
    ${missingReadbackRejected ? "true" : "false"},
    ${psqlLiteral(`status=${missingReadback.status} ${missingReadbackOutput.slice(0, 160)}`)}
  );`);

  const exactReadback = applyStagingSql(stagingReadbackPath, emptyDb, [], { allowFailure: true });
  const exactReadbackOk = exactReadback.status === 0
    && new RegExp(localStagingSavedQuoteId, "i").test(`${exactReadback.stdout || ""}`);
  psql(`SELECT public.accept_record(
    'staging_readback_uses_current_run_id',
    ${exactReadbackOk ? "true" : "false"},
    ${psqlLiteral(`status=${exactReadback.status}`)}
  );`);

  const emptyCleanup = applyStagingSql(stagingCleanupPath, emptyDb, [], { allowFailure: true });
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
       '${localStagingSavedQuoteId}',
       'ada@example.com',
       'decoy_373737373737373737373737',
       '{}'::jsonb
     );`,
  ], {
    env: { ...envForSocket(), PGDATABASE: emptyDb },
    allowFailure: true,
  });
  const decoyCleanup = applyStagingSql(stagingCleanupPath, emptyDb, [], { allowFailure: true });
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

function recordHostedBootstrapProofs() {
  const hostedDb = "deposit_deal_packet_hosted_bootstrap";
  run(bin("dropdb"), ["-h", socketDir, "-p", String(port), "--if-exists", hostedDb], {
    env: { ...envForSocket(), PGDATABASE: "postgres" },
    allowFailure: true,
  });
  run(bin("createdb"), ["-h", socketDir, "-p", String(port), hostedDb], {
    env: { ...envForSocket(), PGDATABASE: "postgres" },
  });

  const missingProjectRef = applySqlFileWithSets(hostedBootstrapPath, hostedDb, [
    `SET deposit_staging.allow_nonce TO '${hostedNonce}'`,
  ], { allowFailure: true });
  const missingProjectOutput = `${missingProjectRef.stderr || ""}${missingProjectRef.stdout || ""}`;
  const missingProjectRejected = missingProjectRef.status !== 0
    && /requires SET deposit_staging.project_ref TO a non-production 20-character lowercase project ref before DDL/i.test(missingProjectOutput)
    && countPublicPacketTables(hostedDb) === 0;
  psql(`SELECT public.accept_record(
    'hosted_bootstrap_missing_project_ref_fails_before_ddl',
    ${missingProjectRejected ? "true" : "false"},
    ${psqlLiteral(`status=${missingProjectRef.status} tables=${countPublicPacketTables(hostedDb)} ${missingProjectOutput.slice(0, 180)}`)}
  );`);

  const malformedRef = applySqlFileWithSets(hostedBootstrapPath, hostedDb, [
    "SET deposit_staging.project_ref TO 'NotAValidProjectRef1'",
    "SET deposit_staging.allow_nonce TO 'deposit-deal-packet-staging/NotAValidProjectRef1'",
  ], { allowFailure: true });
  const malformedOutput = `${malformedRef.stderr || ""}${malformedRef.stdout || ""}`;
  const malformedRejected = malformedRef.status !== 0
    && /requires SET deposit_staging.project_ref TO a non-production 20-character lowercase project ref before DDL/i.test(malformedOutput)
    && countPublicPacketTables(hostedDb) === 0;
  psql(`SELECT public.accept_record(
    'hosted_bootstrap_malformed_project_ref_fails_before_ddl',
    ${malformedRejected ? "true" : "false"},
    ${psqlLiteral(`status=${malformedRef.status} tables=${countPublicPacketTables(hostedDb)} ${malformedOutput.slice(0, 180)}`)}
  );`);

  const leakedNonce = applySqlFileWithSets(hostedBootstrapPath, hostedDb, [
    `SET deposit_staging.project_ref TO '${hostedProjectRef}'`,
    `SET deposit_staging.allow_nonce TO '${hostedProjectRef}'`,
  ], { allowFailure: true });
  const leakedOutput = `${leakedNonce.stderr || ""}${leakedNonce.stdout || ""}`;
  const leakedRejected = leakedNonce.status !== 0
    && /operator intent acknowledgement/i.test(leakedOutput)
    && countPublicPacketTables(hostedDb) === 0;
  psql(`SELECT public.accept_record(
    'hosted_bootstrap_nonce_cannot_self_identify',
    ${leakedRejected ? "true" : "false"},
    ${psqlLiteral(`status=${leakedNonce.status} tables=${countPublicPacketTables(hostedDb)} ${leakedOutput.slice(0, 180)}`)}
  );`);

  const stagingRefOnly = applySqlFileWithSets(hostedBootstrapPath, hostedDb, [
    `SET deposit_staging.project_ref TO '${hostedProjectRef}'`,
  ], { allowFailure: true });
  const stagingRefOutput = `${stagingRefOnly.stderr || ""}${stagingRefOnly.stdout || ""}`;
  const stagingRefRejected = stagingRefOnly.status !== 0
    && /operator intent acknowledgement/i.test(stagingRefOutput)
    && countPublicPacketTables(hostedDb) === 0;
  psql(`SELECT public.accept_record(
    'hosted_bootstrap_staging_ref_still_requires_nonce',
    ${stagingRefRejected ? "true" : "false"},
    ${psqlLiteral(`status=${stagingRefOnly.status} tables=${countPublicPacketTables(hostedDb)} ${stagingRefOutput.slice(0, 180)}`)}
  );`);

  const productionApply = applySqlFileWithSets(hostedBootstrapPath, hostedDb, [
    "SET deposit_staging.project_ref TO 'eutsoqdpjurknjsshxes'",
    "SET deposit_staging.allow_nonce TO 'deposit-deal-packet-staging/eutsoqdpjurknjsshxes'",
  ], { allowFailure: true });
  const productionOutput = `${productionApply.stderr || ""}${productionApply.stdout || ""}`;
  const productionRejected = productionApply.status !== 0
    && /hosted staging bootstrap refuses production project eutsoqdpjurknjsshxes/i.test(productionOutput)
    && countPublicPacketTables(hostedDb) === 0;
  psql(`SELECT public.accept_record(
    'hosted_bootstrap_production_ref_fails_before_ddl',
    ${productionRejected ? "true" : "false"},
    ${psqlLiteral(`status=${productionApply.status} tables=${countPublicPacketTables(hostedDb)} ${productionOutput.slice(0, 180)}`)}
  );`);

  const boot = applySqlFileWithSets(hostedBootstrapPath, hostedDb, [
    `SET deposit_staging.project_ref TO '${hostedProjectRef}'`,
    `SET deposit_staging.allow_nonce TO '${hostedNonce}'`,
  ], { allowFailure: true });
  const bootAgain = applySqlFileWithSets(hostedBootstrapPath, hostedDb, [
    `SET deposit_staging.project_ref TO '${hostedProjectRef}'`,
    `SET deposit_staging.allow_nonce TO '${hostedNonce}'`,
  ], { allowFailure: true });
  const bootOk = boot.status === 0 && bootAgain.status === 0 && countPublicPacketTables(hostedDb) === 5;
  psql(`SELECT public.accept_record(
    'hosted_bootstrap_succeeds_with_nonce',
    ${bootOk ? "true" : "false"},
    ${psqlLiteral(`status=${boot.status}/${bootAgain.status} tables=${countPublicPacketTables(hostedDb)} ${(boot.stderr || "").slice(0, 160)}`)}
  );`);
  const storedRef = psqlValue(hostedDb, `
    SELECT target_project_ref
    FROM public.deposit_staging_marker
    WHERE id = 'deposit-deal-packet-staging/hosted-bootstrap/v1'
      AND schema_surface = 'deposit-deal-packet-hosted-bootstrap/v1'
  `);
  psql(`SELECT public.accept_record(
    'hosted_bootstrap_marker_stores_operator_project_ref',
    ${storedRef === hostedProjectRef ? "true" : "false"},
    ${psqlLiteral(`target_project_ref=${storedRef}`)}
  );`);

  const feature = applySqlFile(migrationPath, hostedDb, { allowFailure: true });
  const verify = hostedVerifyPassed(hostedDb);
  const featureOk = feature.status === 0 && verify.ok;
  psql(`SELECT public.accept_record(
    'hosted_bootstrap_feature_migration_and_edge_columns',
    ${featureOk ? "true" : "false"},
    ${psqlLiteral(`migration=${feature.status} ${verify.detail} ${(feature.stderr || "").slice(0, 120)}`)}
  );`);
  const markerLocked = /marker_rls_enabled=t/.test(verify.detail)
    && /marker_privileges_locked=t/.test(verify.detail)
    && /marker_applying_role_can_select=t/.test(verify.detail)
    && /has_role_execute_not_anon=t/.test(verify.detail);
  psql(`SELECT public.accept_record(
    'hosted_bootstrap_marker_privileges_and_rls',
    ${markerLocked ? "true" : "false"},
    ${psqlLiteral(verify.detail)}
  );`);

  const firstSeed = applyStagingSql(stagingSeedPath, hostedDb, [], { allowFailure: true });
  const firstCount = firstSeed.status === 0 ? countStagingFixtureRows(hostedDb) : -1;
  const secondSeed = applyStagingSql(stagingSeedPath, hostedDb, [], { allowFailure: true });
  const secondOutput = `${secondSeed.stderr || ""}${secondSeed.stdout || ""}`;
  const seedOk = firstSeed.status === 0
    && firstCount === 4
    && secondSeed.status !== 0
    && /deposit staging seed refuses a populated database/i.test(secondOutput)
    && countStagingFixtureRows(hostedDb) === 4;
  psql(`SELECT public.accept_record(
    'hosted_bootstrap_seed_empty_only',
    ${seedOk ? "true" : "false"},
    ${psqlLiteral(`first=${firstSeed.status}:${firstCount} second=${secondSeed.status}:${countStagingFixtureRows(hostedDb)}`)}
  );`);
  const motorReady = psqlValue(hostedDb, `
    SELECT EXISTS (
      SELECT 1
      FROM public.motor_models
      WHERE id = '${fixtureMotorId}'
        AND model = 'Staging Lovelace 90'
        AND model_display = 'Staging Lovelace 90'
        AND horsepower = 90
        AND mercury_model_no = 'STG90LOVELACE'
        AND model_number = 'STG90LOVELACE'
        AND stock_quantity = 1
        AND in_stock IS TRUE
        AND availability = 'In Stock'
    )
  `);
  const stagingPolicy = psqlValue(hostedDb, `
    SELECT
      quote_state->>'purchasePath' = 'motor_only'
      AND quote_state->'depositPolicySnapshot'->>'schema' = 'deposit-policy/v1'
      AND quote_state->'depositPolicySnapshot'->>'motorId' = '${fixtureMotorId}'
      AND quote_state->'depositPolicySnapshot'->>'stockClassification' = 'in_stock'
      AND quote_state->'depositPolicySnapshot'->>'policyCode' = 'in_stock_refundable'
      AND quote_state->'depositPolicySnapshot'->>'purchasePath' = 'motor_only'
    FROM public.saved_quotes
    WHERE id = '${localStagingSavedQuoteId}'
  `);
  const historicalIntact = psqlValue(hostedDb, `
    SELECT
      quote_state->>'purchasePath' IS NULL
      AND quote_state->'depositPolicySnapshot' IS NULL
      AND quote_state->'motor'->>'id' = '${fixtureMotorId}'
      AND quote_state->'motor'->>'model' = 'Staging Historical 90'
    FROM public.saved_quotes
    WHERE id = '34343434-3434-4343-8343-343434343434'
  `);
  psql(`SELECT public.accept_record(
    'hosted_bootstrap_seed_motor_and_policy_ready',
    ${motorReady === "t" && stagingPolicy === "t" ? "true" : "false"},
    ${psqlLiteral(`motor=${motorReady} staging_policy=${stagingPolicy}`)}
  );`);
  psql(`SELECT public.accept_record(
    'hosted_bootstrap_historical_quote_state_intact',
    ${historicalIntact === "t" ? "true" : "false"},
    ${psqlLiteral(`historical_intact=${historicalIntact}`)}
  );`);

  run(bin("dropdb"), ["-h", socketDir, "-p", String(port), "--if-exists", hostedDb], {
    env: { ...envForSocket(), PGDATABASE: "postgres" },
    allowFailure: true,
  });
}

function recordHostedShapeBootstrapProofs() {
  const shapeDb = "deposit_deal_packet_hosted_shape";
  run(bin("dropdb"), ["-h", socketDir, "-p", String(port), "--if-exists", shapeDb], {
    env: { ...envForSocket(), PGDATABASE: "postgres" },
    allowFailure: true,
  });
  run(bin("createdb"), ["-h", socketDir, "-p", String(port), shapeDb], {
    env: { ...envForSocket(), PGDATABASE: "postgres" },
  });
  applySqlFile(hostedShapePath, shapeDb);

  const denied = run(bin("psql"), [
    "-v", "ON_ERROR_STOP=1", "-X", "-q", "-d", shapeDb,
    "-c", `SET ROLE ${hostedRunnerRole}`,
    "-c", "CREATE TABLE IF NOT EXISTS auth.users (id uuid PRIMARY KEY)",
  ], {
    env: { ...envForSocket(), PGDATABASE: shapeDb },
    allowFailure: true,
  });
  const deniedOutput = `${denied.stderr || ""}${denied.stdout || ""}`;
  const denied42501 = denied.status !== 0
    && /permission denied for schema auth/i.test(deniedOutput)
    && countPublicPacketTables(shapeDb) === 0;
  psql(`SELECT public.accept_record(
    'hosted_bootstrap_if_not_exists_auth_users_is_42501',
    ${denied42501 ? "true" : "false"},
    ${psqlLiteral(`status=${denied.status} tables=${countPublicPacketTables(shapeDb)} ${deniedOutput.slice(0, 180)}`)}
  );`);

  const boot = applySqlFileWithSets(hostedBootstrapPath, shapeDb, [
    `SET ROLE ${hostedRunnerRole}`,
    `SET deposit_staging.project_ref TO '${hostedProjectRef}'`,
    `SET deposit_staging.allow_nonce TO '${hostedNonce}'`,
  ], { allowFailure: true });
  const bootAgain = applySqlFileWithSets(hostedBootstrapPath, shapeDb, [
    `SET ROLE ${hostedRunnerRole}`,
    `SET deposit_staging.project_ref TO '${hostedProjectRef}'`,
    `SET deposit_staging.allow_nonce TO '${hostedNonce}'`,
  ], { allowFailure: true });
  const bootOutput = `${boot.stderr || ""}${boot.stdout || ""}`;
  const bootOk = boot.status === 0
    && bootAgain.status === 0
    && countPublicPacketTables(shapeDb) === 5
    && !/permission denied for schema (auth|storage)/i.test(bootOutput);
  psql(`SELECT public.accept_record(
    'hosted_bootstrap_hosted_shape_succeeds',
    ${bootOk ? "true" : "false"},
    ${psqlLiteral(`status=${boot.status}/${bootAgain.status} tables=${countPublicPacketTables(shapeDb)} ${bootOutput.slice(0, 180)}`)}
  );`);

  const runnerReferences = psqlValue(shapeDb, `SELECT has_table_privilege('${hostedRunnerRole}', 'auth.users', 'REFERENCES')`);
  const userRolesFk = psqlValue(shapeDb, `
    SELECT EXISTS (
      SELECT 1
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE n.nspname = 'public'
        AND t.relname = 'user_roles'
        AND c.conname = 'user_roles_user_id_fkey'
        AND c.contype = 'f'
    )
  `);
  const userRolesFkOk = runnerReferences === "t" && userRolesFk === "t";
  psql(`SELECT public.accept_record(
    'hosted_bootstrap_hosted_shape_user_roles_fk',
    ${userRolesFkOk ? "true" : "false"},
    ${psqlLiteral(`runner_references=${runnerReferences} user_roles_user_id_fkey=${userRolesFk}`)}
  );`);

  const authUsersOwner = psqlValue(shapeDb, `
    SELECT r.rolname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_roles r ON r.oid = c.relowner
    WHERE n.nspname = 'auth' AND c.relname = 'users'
  `);
  const bucketsOwner = psqlValue(shapeDb, `
    SELECT r.rolname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_roles r ON r.oid = c.relowner
    WHERE n.nspname = 'storage' AND c.relname = 'buckets'
  `);
  const objectsOwner = psqlValue(shapeDb, `
    SELECT r.rolname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_roles r ON r.oid = c.relowner
    WHERE n.nspname = 'storage' AND c.relname = 'objects'
  `);
  const runnerCreateAuth = psqlValue(shapeDb, `SELECT has_schema_privilege('${hostedRunnerRole}', 'auth', 'CREATE')`);
  const runnerCreateStorage = psqlValue(shapeDb, `SELECT has_schema_privilege('${hostedRunnerRole}', 'storage', 'CREATE')`);
  const runnerMemberAdmin = psqlValue(shapeDb, `SELECT pg_has_role('${hostedRunnerRole}', 'supabase_admin', 'MEMBER')`);
  const storagePolicy = psqlValue(shapeDb, `
    SELECT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'storage'
        AND tablename = 'objects'
        AND policyname = 'Service role manages private quote documents'
    )
  `);
  const ownersLocked = authUsersOwner === "supabase_auth_admin"
    && bucketsOwner === "supabase_storage_admin"
    && objectsOwner === "supabase_storage_admin"
    && runnerCreateAuth === "f"
    && runnerCreateStorage === "f"
    && runnerMemberAdmin === "f"
    && storagePolicy === "f";
  psql(`SELECT public.accept_record(
    'hosted_bootstrap_hosted_shape_skips_system_schema_owner_ddl',
    ${ownersLocked ? "true" : "false"},
    ${psqlLiteral(`auth.users=${authUsersOwner} buckets=${bucketsOwner} objects=${objectsOwner} create_auth=${runnerCreateAuth} create_storage=${runnerCreateStorage} member_admin=${runnerMemberAdmin} storage_policy=${storagePolicy}`)}
  );`);

  const feature = applySqlFileWithSets(migrationPath, shapeDb, [
    `SET ROLE ${hostedRunnerRole}`,
  ], { allowFailure: true });
  const verify = hostedVerifyPassed(shapeDb, [`SET ROLE ${hostedRunnerRole}`]);
  const featureOk = feature.status === 0 && verify.ok;
  psql(`SELECT public.accept_record(
    'hosted_bootstrap_hosted_shape_feature_migration_and_edge_columns',
    ${featureOk ? "true" : "false"},
    ${psqlLiteral(`migration=${feature.status} ${verify.detail} ${(feature.stderr || "").slice(0, 120)}`)}
  );`);
  const exactAcls = /public_table_acls_exact=t/.test(verify.detail)
    && /public_function_acls_exact=t/.test(verify.detail);
  psql(`SELECT public.accept_record(
    'hosted_bootstrap_hosted_shape_exact_acls',
    ${exactAcls ? "true" : "false"},
    ${psqlLiteral(verify.detail)}
  );`);

  applySqlFile(hostedOlderAclPath, shapeDb);
  const olderLeaks = psqlValue(shapeDb, `
    SELECT
      has_table_privilege('anon', 'public.saved_quotes', 'SELECT')
      AND has_table_privilege('authenticated', 'public.deposit_email_deliveries', 'INSERT')
      AND has_table_privilege('service_role', 'public.deposit_email_deliveries', 'DELETE')
      AND has_table_privilege('service_role', 'public.deposit_staging_marker', 'INSERT')
  `);
  psql(`SELECT public.accept_record(
    'hosted_bootstrap_hosted_shape_older_form_leaks',
    ${olderLeaks === "t" ? "true" : "false"},
    ${psqlLiteral(`older_form_leaks=${olderLeaks}`)}
  );`);

  const recoverBoot = applySqlFileWithSets(hostedBootstrapPath, shapeDb, [
    `SET ROLE ${hostedRunnerRole}`,
    `SET deposit_staging.project_ref TO '${hostedProjectRef}'`,
    `SET deposit_staging.allow_nonce TO '${hostedNonce}'`,
  ], { allowFailure: true });
  const recoverFeature = applySqlFileWithSets(migrationPath, shapeDb, [
    `SET ROLE ${hostedRunnerRole}`,
  ], { allowFailure: true });
  const recoverVerify = hostedVerifyPassed(shapeDb, [`SET ROLE ${hostedRunnerRole}`]);
  const narrowed = recoverBoot.status === 0 && recoverFeature.status === 0 && recoverVerify.ok;
  psql(`SELECT public.accept_record(
    'hosted_bootstrap_hosted_shape_narrows_older_form_acls',
    ${narrowed ? "true" : "false"},
    ${psqlLiteral(`boot=${recoverBoot.status} migration=${recoverFeature.status} ${recoverVerify.detail}`)}
  );`);

  const againBoot = applySqlFileWithSets(hostedBootstrapPath, shapeDb, [
    `SET ROLE ${hostedRunnerRole}`,
    `SET deposit_staging.project_ref TO '${hostedProjectRef}'`,
    `SET deposit_staging.allow_nonce TO '${hostedNonce}'`,
  ], { allowFailure: true });
  const againFeature = applySqlFileWithSets(migrationPath, shapeDb, [
    `SET ROLE ${hostedRunnerRole}`,
  ], { allowFailure: true });
  const againVerify = hostedVerifyPassed(shapeDb, [`SET ROLE ${hostedRunnerRole}`]);
  const idempotent = againBoot.status === 0 && againFeature.status === 0 && againVerify.ok;
  psql(`SELECT public.accept_record(
    'hosted_bootstrap_hosted_shape_acl_reapply_idempotent',
    ${idempotent ? "true" : "false"},
    ${psqlLiteral(`boot=${againBoot.status} migration=${againFeature.status} ${againVerify.detail}`)}
  );`);

  const firstSeed = applyStagingSql(stagingSeedPath, shapeDb, [
    `SET ROLE ${hostedRunnerRole}`,
  ], { allowFailure: true });
  const firstCount = firstSeed.status === 0 ? countStagingFixtureRows(shapeDb) : -1;
  const secondSeed = applyStagingSql(stagingSeedPath, shapeDb, [
    `SET ROLE ${hostedRunnerRole}`,
  ], { allowFailure: true });
  const secondOutput = `${secondSeed.stderr || ""}${secondSeed.stdout || ""}`;
  const seedOk = firstSeed.status === 0
    && firstCount === 4
    && secondSeed.status !== 0
    && /deposit staging seed refuses a populated database/i.test(secondOutput)
    && countStagingFixtureRows(shapeDb) === 4;
  psql(`SELECT public.accept_record(
    'hosted_bootstrap_hosted_shape_seed_empty_only',
    ${seedOk ? "true" : "false"},
    ${psqlLiteral(`first=${firstSeed.status}:${firstCount} second=${secondSeed.status}:${countStagingFixtureRows(shapeDb)}`)}
  );`);

  run(bin("dropdb"), ["-h", socketDir, "-p", String(port), "--if-exists", shapeDb], {
    env: { ...envForSocket(), PGDATABASE: "postgres" },
    allowFailure: true,
  });
}
