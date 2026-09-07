// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  calls: [] as string[],
  orFilters: [] as string[],
  rpc: vi.fn(),
  order: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: mocks.rpc,
    from: vi.fn(() => {
      const query = {
        or: vi.fn((filter: string) => {
          mocks.orFilters.push(filter);
          return query;
        }),
        order: mocks.order,
      };
      return { select: vi.fn(() => query) };
    }),
  },
}));

import { loadOwnedSavedQuotes } from "./saved-quote-account";

const migrationPath =
  "supabase/migrations/20260831033000_claim_saved_quotes_for_user.sql";
const read = (path: string) =>
  readFileSync(resolve(process.cwd(), path), "utf8");

describe("saved quote account claim contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.calls.length = 0;
    mocks.orFilters.length = 0;
    mocks.rpc.mockImplementation(async () => {
      mocks.calls.push("claim");
      return { data: 0, error: null };
    });
    mocks.order.mockImplementation(async () => {
      mocks.calls.push("list");
      return { data: [{ id: "owned-quote" }], error: null };
    });
  });

  it("claims guest saves before My Quotes relies on RLS and filters soft leads", async () => {
    await expect(loadOwnedSavedQuotes()).resolves.toEqual({
      data: [{ id: "owned-quote" }],
      error: null,
    });
    expect(mocks.calls).toEqual(["claim", "list"]);
    expect(mocks.orFilters).toEqual([
      "is_soft_lead.is.null,is_soft_lead.eq.false",
    ]);
  });

  it("still lists already-owned quotes when claim reconciliation fails", async () => {
    mocks.rpc.mockImplementation(async () => {
      mocks.calls.push("claim");
      return { data: 0, error: new Error("claim unavailable") };
    });

    await expect(loadOwnedSavedQuotes()).resolves.toEqual({
      data: [{ id: "owned-quote" }],
      error: null,
    });
    expect(mocks.calls).toEqual(["claim", "list"]);
    expect(mocks.orFilters).toEqual([
      "is_soft_lead.is.null,is_soft_lead.eq.false",
    ]);
  });

  it("still lists already-owned quotes when the claim request rejects", async () => {
    mocks.rpc.mockImplementation(async () => {
      mocks.calls.push("claim");
      throw new Error("network unavailable");
    });

    await expect(loadOwnedSavedQuotes()).resolves.toEqual({
      data: [{ id: "owned-quote" }],
      error: null,
    });
    expect(mocks.calls).toEqual(["claim", "list"]);
    expect(mocks.orFilters).toEqual([
      "is_soft_lead.is.null,is_soft_lead.eq.false",
    ]);
  });

  it("uses one idempotent confirmed-email update without tightening cached-client RLS", () => {
    const migration = read(migrationPath);
    const migrationCorpus = readdirSync(
      resolve(process.cwd(), "supabase/migrations"),
    )
      .filter((name) => name.endsWith(".sql"))
      .map((name) => read(`supabase/migrations/${name}`))
      .join("\n");
    const generatedTypes = read("src/integrations/supabase/types.ts");

    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("SET search_path = ''");
    expect(migration).toContain("requester_id uuid := auth.uid()");
    expect(migration).toContain("FROM auth.users AS user_record");
    expect(migration).toContain("user_record.id = requester_id");
    expect(migration).toContain("user_record.email_confirmed_at IS NOT NULL");
    expect(migration).toMatch(
      /UPDATE public\.saved_quotes[\s\S]*WHERE user_id IS NULL/,
    );
    expect(migration).toContain("COALESCE(is_soft_lead, false) IS FALSE");
    expect(migration).toContain("pg_catalog.lower(email) = requester_email");
    expect(migration).toContain(
      "CREATE INDEX IF NOT EXISTS idx_saved_quotes_claimable_email",
    );
    expect(migration).toContain(
      "ON public.saved_quotes (pg_catalog.lower(email))",
    );
    expect(migration).toContain(
      "WHERE user_id IS NULL\n  AND COALESCE(is_soft_lead, false) IS FALSE",
    );
    expect(migration).toContain("GET DIAGNOSTICS claimed_count = ROW_COUNT");
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION public.claim_saved_quotes_for_current_user()\nFROM PUBLIC, anon, authenticated",
    );
    expect(migration).toContain(
      "GRANT EXECUTE ON FUNCTION public.claim_saved_quotes_for_current_user() TO authenticated",
    );
    expect(migration).toContain(
      'CREATE POLICY "Saved quote inserts cannot assign another user"',
    );
    expect(migration).toContain("AS RESTRICTIVE");
    expect(migration).toContain(
      "WITH CHECK (user_id IS NULL OR user_id = (SELECT auth.uid()))",
    );
    expect(migration.match(/AS RESTRICTIVE/g)).toHaveLength(1);
    expect(migration).toContain("This is the expand-compatible phase");
    expect(migration).toContain(
      "Owner-only SELECT/UPDATE tightening belongs in a separately staged migration",
    );
    expect(migration).not.toContain(
      'DROP POLICY IF EXISTS "Users can view own saved quotes"',
    );
    expect(migration).not.toContain(
      'DROP POLICY IF EXISTS "Users can update own saved quotes"',
    );
    expect(migration).not.toContain(
      'CREATE POLICY "Users can view own saved quotes"',
    );
    expect(migration).not.toContain(
      'CREATE POLICY "Users can update own saved quotes"',
    );
    expect(migration).not.toContain(
      'CREATE POLICY "Saved quote reads require ownership or admin"',
    );
    expect(migration).not.toContain(
      'CREATE POLICY "Saved quote updates require ownership or admin"',
    );
    expect(migration).not.toMatch(/DELETE\s+FROM\s+public\.saved_quotes/i);
    expect(migrationCorpus).not.toMatch(
      /ALTER\s+TABLE\s+(?:public\.)?saved_quotes\s+FORCE\s+ROW\s+LEVEL\s+SECURITY/i,
    );
    expect(generatedTypes).toContain(
      "claim_saved_quotes_for_current_user: { Args: never; Returns: number }",
    );
  });
});
