import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("My Quotes confirmed-email ownership claim", () => {
  it("claims through the authenticated RPC while preserving cached-client RLS", () => {
    const page = read("src/pages/account/MyQuotesPage.tsx");
    const successPage = read("src/pages/quote/QuoteSuccessPage.tsx");
    const sharedPage = read("src/pages/quote/SavedQuotePage.tsx");
    const loader = read("src/lib/saved-quote-account.ts");
    const rls = read(
      "supabase/migrations/20260831033000_claim_saved_quotes_for_user.sql",
    );

    expect(page).toContain('from "@/integrations/supabase/client"');
    expect(page).toContain("loadOwnedSavedQuotes()");
    expect(page).not.toContain("service_role");
    expect(page).not.toContain("SERVICE_ROLE");
    expect(page).not.toContain("email_verified");
    expect(page).not.toContain("auth.jwt()");

    expect(loader).toMatch(
      /\.rpc\(\s*["']claim_saved_quotes_for_current_user["']/,
    );
    expect(loader).not.toMatch(/\.eq\(["']user_id["']/);
    expect(loader).toMatch(
      /\.or\(["']is_soft_lead\.is\.null,is_soft_lead\.eq\.false["']\)/,
    );

    expect(successPage).toContain("claimSavedQuotesForCurrentUser()");
    expect(successPage).not.toContain(".from('saved_quotes')");
    expect(successPage).not.toContain(".update({ user_id: user.id })");

    // Shared links keep their separate server-authorized reader and do not
    // depend on the client-side ownership reconciliation path.
    expect(sharedPage).toContain(".functions.invoke('get-shared-quote'");
    expect(sharedPage).not.toContain(".from('saved_quotes')");

    expect(rls).toContain("FROM auth.users AS user_record");
    expect(rls).toContain("user_record.email_confirmed_at IS NOT NULL");
    expect(rls).toContain("This is the expand-compatible phase");
    expect(rls).toContain(
      "Owner-only SELECT/UPDATE tightening belongs in a separately staged migration",
    );
    expect(rls).not.toContain(
      'DROP POLICY IF EXISTS "Users can view own saved quotes"',
    );
    expect(rls).not.toContain(
      'DROP POLICY IF EXISTS "Users can update own saved quotes"',
    );
    expect(rls).not.toContain(
      'CREATE POLICY "Users can view own saved quotes"',
    );
    expect(rls).not.toContain(
      'CREATE POLICY "Users can update own saved quotes"',
    );
  });
});
