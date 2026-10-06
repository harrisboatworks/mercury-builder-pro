import { handleLightspeedSync } from "../lightspeed-sync/sync_handler.ts";
import { handleLightspeedServiceSync } from "../lightspeed-sync-service/request.ts";
import { handleLightspeedNewFeeds } from "../lightspeed-sync-new-feeds/sync_handler.ts";
import type { ServerCallerEnv } from "./server-caller-auth.ts";

const SERVICE = "synthetic-service-role-key";
const EDGE = "synthetic-edge-internal-secret";
const CRON = "synthetic-cron-secret";
const ANON = "synthetic-anon-jwt";
const SPOOFED = "eyJhbGciOiJub25lIn0.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.synthetic";
const CONFIGURED: ServerCallerEnv = { serviceRoleKey: SERVICE, edgeInternalSecret: EDGE, cronSecret: CRON };

Deno.env.set("LIGHTSPEED_USERNAME", "fixture-user");
Deno.env.set("LIGHTSPEED_PASSWORD", "fixture-pass");

type Hits = { db: number; fetch: number; sql: number };
type Log = { text: string; values: unknown[] };

function equal(actual: unknown, expected: unknown, label: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function makeSql(hits: Hits, logs: Log[]) {
  const sql: any = (strings: { raw?: readonly string[] } | unknown, ...values: unknown[]) => {
    if (strings == null || typeof strings !== "object" || !("raw" in strings)) return strings;
    hits.sql += 1;
    logs.push({ text: (strings as TemplateStringsArray).join("?"), values });
    return Promise.resolve([]);
  };
  sql.end = () => Promise.resolve();
  sql.json = (value: unknown) => value;
  sql.begin = async (fn: (tx: typeof sql) => Promise<unknown>) => fn(sql);
  return sql;
}

function boundary() {
  const hits: Hits = { db: 0, fetch: 0, sql: 0 };
  const logs: Log[] = [];
  const sql = makeSql(hits, logs);
  const createDb = () => {
    hits.db += 1;
    return sql;
  };
  const fetchImpl: typeof fetch = async () => {
    hits.fetch += 1;
    return Response.json([]);
  };
  return { hits, logs, createDb, fetch: fetchImpl };
}

const handlers = [
  {
    name: "lightspeed-sync",
    url: "https://fixture.local/lightspeed-sync?feed=units",
    call: handleLightspeedSync,
  },
  {
    name: "lightspeed-sync-service",
    url: "https://fixture.local/lightspeed-sync-service?top=1",
    call: handleLightspeedServiceSync,
  },
  {
    name: "lightspeed-sync-new-feeds",
    url: "https://fixture.local/lightspeed-sync-new-feeds?feed=deals",
    call: handleLightspeedNewFeeds,
  },
];

function request(url: string, headers: Record<string, string> = {}) {
  return new Request(url, { headers });
}

const rejected: { name: string; headers: Record<string, string>; env: ServerCallerEnv }[] = [
  { name: "missing", headers: {}, env: CONFIGURED },
  { name: "anon", headers: { Authorization: `Bearer ${ANON}` }, env: CONFIGURED },
  { name: "malformed-empty-bearer", headers: { Authorization: "Bearer" }, env: CONFIGURED },
  { name: "malformed-inner-space", headers: { Authorization: `Bearer  ${SERVICE}` }, env: CONFIGURED },
  { name: "malformed-suffix", headers: { Authorization: `Bearer ${SERVICE} extra` }, env: CONFIGURED },
  { name: "malformed-missing-space", headers: { Authorization: `Bearer${SERVICE}` }, env: CONFIGURED },
  { name: "malformed-lowercase-scheme", headers: { Authorization: `bearer ${SERVICE}` }, env: CONFIGURED },
  { name: "malformed-raw-key", headers: { Authorization: SERVICE }, env: CONFIGURED },
  { name: "malformed-basic", headers: { Authorization: `Basic ${SERVICE}` }, env: CONFIGURED },
  { name: "spoofed-role", headers: { Authorization: `Bearer ${SPOOFED}` }, env: CONFIGURED },
  { name: "wrong-secret", headers: { "x-internal-secret": "synthetic-wrong-secret" }, env: CONFIGURED },
  { name: "cron-while-edge-configured", headers: { "x-internal-secret": CRON }, env: CONFIGURED },
  {
    name: "missing-config",
    headers: { Authorization: `Bearer ${SERVICE}`, "x-internal-secret": EDGE },
    env: {},
  },
  {
    name: "empty-config",
    headers: { Authorization: `Bearer ${SERVICE}`, "x-internal-secret": EDGE },
    env: { serviceRoleKey: "", edgeInternalSecret: "", cronSecret: "" },
  },
];

for (const handler of handlers) {
  Deno.test(`${handler.name} rejects unauthorized callers before any side effect`, async () => {
    for (const cse of rejected) {
      const gate = boundary();
      const res = await handler.call(request(handler.url, cse.headers), {
        env: cse.env,
        createDb: gate.createDb,
        fetch: gate.fetch,
      });
      const body = await res.text();
      if (res.status !== 401 || gate.hits.db !== 0 || gate.hits.fetch !== 0 || gate.hits.sql !== 0) {
        throw new Error(`${handler.name} ${cse.name}: status ${res.status} hits ${JSON.stringify(gate.hits)} body ${body}`);
      }
      if (body.includes(SERVICE) || body.includes(EDGE) || body.includes(CRON) || body.includes(ANON) || body.includes(SPOOFED)) {
        throw new Error(`${handler.name} ${cse.name}: response echoed a credential`);
      }
      equal(JSON.parse(body), { error: "Unauthorized" }, `${handler.name} ${cse.name} body`);
    }
  });

  Deno.test(`${handler.name} service-role bearer reaches the synthetic stub`, async () => {
    const gate = boundary();
    const res = await handler.call(request(handler.url, { Authorization: `Bearer ${SERVICE}` }), {
      env: { serviceRoleKey: SERVICE },
      createDb: gate.createDb,
      fetch: gate.fetch,
    });
    if (res.status !== 200 || gate.hits.db !== 1 || gate.hits.fetch < 1 || gate.hits.sql < 1) {
      throw new Error(`${handler.name} service-role: status ${res.status} hits ${JSON.stringify(gate.hits)} ${await res.text()}`);
    }
  });

  Deno.test(`${handler.name} edge internal secret reaches the synthetic stub`, async () => {
    const gate = boundary();
    const res = await handler.call(request(handler.url, { "x-internal-secret": EDGE }), {
      env: CONFIGURED,
      createDb: gate.createDb,
      fetch: gate.fetch,
    });
    if (res.status !== 200 || gate.hits.db !== 1 || gate.hits.fetch < 1) {
      throw new Error(`${handler.name} edge secret: status ${res.status} hits ${JSON.stringify(gate.hits)} ${await res.text()}`);
    }
  });

  Deno.test(`${handler.name} cron secret is accepted only when edge secret is unset`, async () => {
    const gate = boundary();
    const res = await handler.call(request(handler.url, { "x-internal-secret": CRON }), {
      env: { serviceRoleKey: "", edgeInternalSecret: "", cronSecret: CRON },
      createDb: gate.createDb,
      fetch: gate.fetch,
    });
    if (res.status !== 200 || gate.hits.db !== 1 || gate.hits.fetch < 1) {
      throw new Error(`${handler.name} cron secret: status ${res.status} hits ${JSON.stringify(gate.hits)} ${await res.text()}`);
    }
  });
}

function unit(id: number) {
  return { MajorUnitHeaderId: id, StockNumber: `S${id}`, NewUsed: "N", Make: "Fixture", Model: "Boat", VIN: `V${id}` };
}

function unitFetcher(pages: Record<number, unknown[]>) {
  const calls: number[] = [];
  const fetchImpl: typeof fetch = async (input) => {
    const skip = Number(new URL(String(input)).searchParams.get("$skip") || "0");
    calls.push(skip);
    return Response.json(pages[skip] ?? []);
  };
  return { calls, fetch: fetchImpl };
}

async function syncUnits(pages: Record<number, unknown[]>) {
  const gate = boundary();
  const provider = unitFetcher(pages);
  const res = await handleLightspeedSync(request("https://fixture.local/lightspeed-sync?feed=units", {
    Authorization: `Bearer ${SERVICE}`,
  }), {
    env: { serviceRoleKey: SERVICE },
    createDb: gate.createDb,
    fetch: provider.fetch,
  });
  const body = await res.json();
  return { res, body, gate, provider };
}

function unitInsert(logs: Log[]) {
  return logs.find((entry) => entry.text.includes("INSERT INTO lightspeed.units"));
}

function assertNoDelete(logs: Log[], label: string) {
  const deleted = logs.filter((entry) => /\bdelete\b/i.test(entry.text));
  if (deleted.length !== 0) throw new Error(`${label}: DELETE was issued ${JSON.stringify(deleted.map((entry) => entry.text))}`);
}

Deno.test("empty unit snapshot upserts nothing, deletes nothing, and reports purge held", async () => {
  const { res, body, gate, provider } = await syncUnits({ 0: [] });
  equal(res.status, 200, "status");
  equal(gate.hits.db, 1, "db");
  equal(provider.calls, [0], "fetch");
  equal(unitInsert(gate.logs), undefined, "units insert");
  assertNoDelete(gate.logs, "empty");
  equal(body.results[0].total, 0, "total");
  equal(body.results[0].upserted, 0, "upserted");
  equal(body.results[0].purged, 0, "purged");
  equal(body.results[0].purge_status, "held", "purge status");
  equal(body.results[0].complete, undefined, "completeness claim");
});

Deno.test("short page followed by an empty probe upserts only returned rows and does not delete", async () => {
  const { res, body, gate, provider } = await syncUnits({ 0: [unit(11), unit(12)], 500: [] });
  equal(res.status, 200, "status");
  assertNoDelete(gate.logs, "short");
  const rows = (unitInsert(gate.logs)?.values[0] ?? []) as { major_unit_header_id: number }[];
  equal(rows.map((row) => row.major_unit_header_id), [11, 12], "upserted ids");
  equal(body.results[0].upserted, 2, "upserted");
  equal(body.results[0].purged, 0, "purged");
  equal(body.results[0].purge_status, "held", "purge status");
  if (provider.calls.includes(500)) {
    assertNoDelete(gate.logs, "empty probe");
  }
});

Deno.test("apparently full paged unit snapshot still issues no omitted-unit delete", async () => {
  const full = Array.from({ length: 500 }, (_, index) => unit(index + 1));
  const { res, body, gate, provider } = await syncUnits({ 0: full, 500: [unit(501)], 1000: [] });
  equal(res.status, 200, "status");
  assertNoDelete(gate.logs, "full");
  const rows = (unitInsert(gate.logs)?.values[0] ?? []) as { major_unit_header_id: number; stock_number: string }[];
  equal(rows.length, 501, "upsert count");
  equal(rows[0].major_unit_header_id, 1, "first id");
  equal(rows[0].stock_number, "S1", "mapped stock");
  equal(rows[500].major_unit_header_id, 501, "tail id");
  equal(body.results[0].upserted, 501, "reported upserts");
  equal(body.results[0].purged, 0, "purged");
  equal(body.results[0].purge_status, "held", "purge status");
  equal(provider.calls, [0, 500], "pages fetched");
});
