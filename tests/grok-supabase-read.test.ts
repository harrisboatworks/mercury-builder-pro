import assert from "node:assert/strict";
import test from "node:test";

import {
  clampInteger,
  invokeAggregateTool,
  sanitizeAggregate,
  TOOLS,
  UnsafeAggregateError,
} from "../supabase/functions/grok-supabase-read/core.ts";
import {
  authorize,
  extractBearer,
  SlidingWindowRateLimiter,
} from "../supabase/functions/grok-supabase-read/security.ts";

test("connector exposes exactly four aggregate-only tools", () => {
  assert.deepEqual(
    TOOLS.map((tool) => tool.name),
    ["inventory_summary", "service_backlog_summary", "sales_trends", "parts_demand_trends"],
  );
  for (const tool of TOOLS) {
    assert.doesNotMatch(tool.name, /create|update|delete|write|send|execute|query/i);
    assert.match(tool.description, /No /);
  }
});

test("month parameters are integer-only and clamped to hard bounds", () => {
  assert.equal(clampInteger(undefined, 12, 1, 24), 12);
  assert.equal(clampInteger(99, 12, 1, 24), 24);
  assert.equal(clampInteger(-5, 12, 1, 24), 1);
  assert.throws(() => clampInteger(1.5, 12, 1, 24), TypeError);
});

test("tool routing calls only the fixed RPC allowlist", async () => {
  const calls: Array<[string, Record<string, unknown>]> = [];
  const runner = async (name: string, args: Record<string, unknown>) => {
    calls.push([name, args]);
    return { generated_at: "2026-08-09T12:00:00Z", total_units: 12 };
  };
  await invokeAggregateTool("sales_trends", { months: 99 }, runner);
  assert.deepEqual(calls, [["grok_sales_trends", { p_months: 24 }]]);
  await assert.rejects(
    invokeAggregateTool("sales_trends", { months: 6, customer_id: 1 }, runner),
    /Unexpected argument/,
  );
  await assert.rejects(invokeAggregateTool("execute_sql", {}, runner), /Unknown tool/);
});

test("privacy guard rejects sensitive keys anywhere in an aggregate", () => {
  for (const key of [
    "customer_name",
    "email",
    "unit_vin",
    "serial_number",
    "ro_number",
    "invoice_no",
    "stock_number",
    "part_number",
    "dealer_price",
    "gross_margin",
    "technician_notes",
  ]) {
    assert.throws(() => sanitizeAggregate({ summary: { [key]: "blocked" } }), UnsafeAggregateError);
  }
});

test("safe aggregate is bounded and control characters are removed", async () => {
  const result = await invokeAggregateTool(
    "inventory_summary",
    {},
    async () => ({
      generated_at: "2026-08-09T12:00:00Z",
      by_make: [{ label: "Legend\nBoats", units: 7 }],
    }),
  );
  const structured = result.structuredContent as any;
  assert.equal(structured.data_classification, "internal_aggregate_no_pii");
  assert.equal(structured.result.by_make[0].label, "Legend Boats");
  assert.match(structured.security_note, /untrusted data/i);
});

test("bearer authentication fails closed and compares valid tokens", async () => {
  const expected = "test-token-that-is-at-least-thirty-two-characters-long";
  assert.equal(extractBearer("Basic abc"), null);
  assert.equal(extractBearer(`Bearer ${expected}`), expected);
  assert.equal(await authorize(null, expected), "missing");
  assert.equal(await authorize("Bearer wrong", expected), "invalid");
  assert.equal(await authorize(`Bearer ${expected}`, expected), "ok");
  assert.equal(await authorize(`Bearer ${expected}`, "short"), "missing_config");
});

test("in-memory limiter blocks the configured excess request", () => {
  const limiter = new SlidingWindowRateLimiter(2, 1_000);
  assert.equal(limiter.allow("grok", 10_000), true);
  assert.equal(limiter.allow("grok", 10_100), true);
  assert.equal(limiter.allow("grok", 10_200), false);
  assert.equal(limiter.allow("grok", 11_100), true);
});
