import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

const browserSourceFiles = (directory: string): string[] =>
  readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return browserSourceFiles(path);
    if (!/\.[jt]sx?$/.test(path) || /\.(?:test|spec)\.[jt]sx?$/.test(path)) {
      return [];
    }
    return [path];
  });

describe("Stripe-bound quote write authority", () => {
  it("makes bound owner rows immutable without blocking admins or trusted servers", () => {
    const migration = read(
      "supabase/migrations/20260831022500_restrict_stripe_bound_quote_writes.sql",
    );
    const createPayment = read("supabase/functions/create-payment/index.ts");
    const webhook = read("supabase/functions/stripe-webhook/index.ts");
    const reconciliation = read(
      "supabase/functions/stripe-webhook/deposit-reconciliation.ts",
    );

    expect(migration.match(/AS RESTRICTIVE/g)).toHaveLength(4);
    expect(migration.match(/FOR UPDATE/g)).toHaveLength(2);
    expect(migration.match(/FOR DELETE/g)).toHaveLength(2);
    expect(migration.match(/TO authenticated/g)).toHaveLength(4);
    expect(
      migration.match(
        /COALESCE\(quote_data ->> 'stripe_session_id', ''\) = ''/g,
      ),
    ).toHaveLength(6);
    expect(migration.match(/public\.has_role\(/g)).toHaveLength(6);
    expect(migration).toContain("ON public.customer_quotes");
    expect(migration).toContain("ON public.quotes");

    expect(createPayment).toContain('Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")');
    expect(createPayment).toContain('supabaseService.from("quotes").insert({');
    expect(createPayment).toMatch(
      /supabaseService[\s\S]*?\.from\("customer_quotes"\)[\s\S]*?\.insert\(depositRow\)/,
    );
    expect(createPayment).toMatch(
      /if \(expiredBinding\)[\s\S]*?supabaseService[\s\S]*?\.from\("customer_quotes"\)[\s\S]*?\.update\(/,
    );
    expect(webhook).toContain(
      'const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")',
    );
    expect(webhook).toContain(
      "const supabase = createClient(supabaseUrl, supabaseServiceKey)",
    );
    expect(reconciliation).toContain(
      "const quoteAuthorizationEmail = normalizeEmail(input.boundDeposit.customer_email)",
    );
    expect(reconciliation).toContain("const paymentIntentId = requiredText(input.paymentIntentId)");
    expect(reconciliation).toMatch(/!paymentIntentId[\s\S]*?throw new Error\(/);
  });

  it("keeps every current browser mutation in an admin-only or unused lane", () => {
    const files = browserSourceFiles("src");
    const directMutators = files
      .filter((path) => {
        const source = read(path);
        return /\.from\(\s*["'](?:customer_quotes|quotes)["']\s*\)[\s\S]{0,800}?\.(?:update|delete)\(/.test(
          source,
        );
      })
      .sort();

    expect(directMutators).toEqual([
      "src/components/admin/AdminQuoteControls.tsx",
      "src/components/admin/FollowUpReminder.tsx",
      "src/lib/leadCapture.ts",
      "src/pages/AdminQuoteDetail.tsx",
    ]);

    const app = read("src/App.tsx");
    const summary = read("src/pages/quote/QuoteSummaryPage.tsx");
    expect(app).toMatch(
      /path="\/admin\/quotes"[\s\S]*?<SecureRoute requireAdmin=\{true\}>/,
    );
    expect(app).toMatch(
      /path="\/admin\/quotes\/:id"[\s\S]*?<SecureRoute requireAdmin=\{true\}>/,
    );
    expect(summary).toContain("{isAdmin && state.isAdminQuote && (");

    const updateLeadStatusReferences = files.reduce((count, path) => {
      return count + (read(path).match(/\bupdateLeadStatus\s*\(/g)?.length ?? 0);
    }, 0);
    expect(updateLeadStatusReferences).toBe(1);
  });
});
