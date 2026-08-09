import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  claimDepositAfterValidation,
  type DepositPreclaimInput,
  validateDepositBeforeClaim,
} from "../../../../supabase/functions/stripe-webhook/deposit-reconciliation";

const validInput = (overrides: Partial<DepositPreclaimInput> = {}): DepositPreclaimInput => ({
  sessionCurrency: "cad",
  sessionAmountTotal: 50000,
  metadataDepositAmount: "500",
  metadataSavedQuoteId: "saved-quote-1",
  stripeReceiptEmail: "receipt@example.com",
  boundDeposit: {
    customer_email: "quote-owner@example.com",
    deposit_amount: 500,
    quote_data: {
      saved_quote_id: "saved-quote-1",
    },
  },
  boundSavedQuote: {
    id: "saved-quote-1",
    email: "quote-owner@example.com",
    deposit_status: "pending",
    deposit_amount: 500,
  },
  ...overrides,
});

describe("Stripe deposit pre-claim reconciliation", () => {
  it("authorizes with the bound quote identity when Stripe has a different receipt email", () => {
    const result = validateDepositBeforeClaim(validInput());

    expect(result.quoteAuthorizationEmail).toBe("quote-owner@example.com");
    expect(result.stripeReceiptEmail).toBe("receipt@example.com");
    expect(result.depositAmountCents).toBe(50000);
    expect(result).not.toHaveProperty("quotePdfPath");
  });

  it.each([
    ["wrong currency", { sessionCurrency: "usd" }],
    ["wrong total", { sessionAmountTotal: 49999 }],
    ["missing total", { sessionAmountTotal: null }],
    ["wrong deposit metadata", { metadataDepositAmount: "499" }],
    ["wrong saved quote metadata", { metadataSavedQuoteId: "saved-quote-2" }],
    ["fractional-cent bound amount", {
      metadataDepositAmount: "500.001",
      boundDeposit: {
        customer_email: "quote-owner@example.com",
        deposit_amount: 500.001,
        quote_data: {
          saved_quote_id: "saved-quote-1",
        },
      },
    }],
  ])("rejects %s before a deposit can be claimed", (_label, overrides) => {
    expect(() => validateDepositBeforeClaim(validInput(overrides))).toThrow();
  });

  it("rejects a saved quote whose identity does not match the authoritative deposit", () => {
    expect(() => validateDepositBeforeClaim(validInput({
      boundSavedQuote: {
        id: "saved-quote-1",
        email: "someone-else@example.com",
        deposit_status: "pending",
        deposit_amount: 500,
      },
    }))).toThrow("Bound saved quote could not be verified");
  });

  it("leaves a mismatched deposit pending and does not enter notification work", async () => {
    let paymentStatus = "pending";
    let notificationCount = 0;

    await expect(claimDepositAfterValidation(
      validInput({ sessionAmountTotal: 49999 }),
      async () => {
        paymentStatus = "paid";
        notificationCount += 1;
      },
    )).rejects.toThrow("Stripe deposit total does not match the bound deposit amount");

    expect(paymentStatus).toBe("pending");
    expect(notificationCount).toBe(0);
  });

  it("keeps all state and notification side effects after pre-claim validation", () => {
    const source = readFileSync("supabase/functions/stripe-webhook/index.ts", "utf8");
    const validation = source.indexOf("validateDepositBeforeClaim(depositPreclaimInput)");
    const duplicateReturn = source.indexOf("Deposit session already processed");
    const gatedClaim = source.indexOf("claimDepositAfterValidation(");
    const claim = source.indexOf('.update({ lead_status: "scheduled"');
    const savedQuoteFrom = source.indexOf('.from("saved_quotes")', claim);
    const savedQuoteUpdate = source.indexOf(".update({", savedQuoteFrom);
    const notification = source.indexOf('supabase.functions.invoke("send-deposit-confirmation-email"');

    expect(validation).toBeGreaterThan(-1);
    expect(duplicateReturn).toBeGreaterThan(validation);
    expect(gatedClaim).toBeGreaterThan(duplicateReturn);
    expect(claim).toBeGreaterThan(gatedClaim);
    expect(savedQuoteFrom).toBeGreaterThan(claim);
    expect(savedQuoteUpdate).toBeGreaterThan(claim);
    expect(notification).toBeGreaterThan(savedQuoteUpdate);
  });

  it("retains an idempotent duplicate return before claim and notifications", () => {
    const source = readFileSync("supabase/functions/stripe-webhook/index.ts", "utf8");
    const duplicateCheck = source.indexOf(
      'boundQuoteData.payment_status === "paid" && notificationsComplete(boundQuoteData)',
    );
    const duplicateResponse = source.indexOf(
      "JSON.stringify({ received: true, processed: true, duplicate: true })",
      duplicateCheck,
    );
    const claim = source.indexOf('.update({ lead_status: "scheduled"', duplicateCheck);
    const notification = source.indexOf(
      'supabase.functions.invoke("send-deposit-confirmation-email"',
      duplicateCheck,
    );

    expect(duplicateCheck).toBeGreaterThan(-1);
    expect(duplicateResponse).toBeGreaterThan(duplicateCheck);
    expect(claim).toBeGreaterThan(duplicateResponse);
    expect(notification).toBeGreaterThan(claim);
  });

  it("keeps document paths outside Stripe reconciliation authority", () => {
    const helper = readFileSync(
      "supabase/functions/stripe-webhook/deposit-reconciliation.ts",
      "utf8",
    );
    const source = readFileSync("supabase/functions/stripe-webhook/index.ts", "utf8");

    expect(helper).not.toContain("quote_pdf_path");
    expect(helper).not.toContain("quotePdfPath");
    expect(helper).not.toContain("metadataQuotePdfPath");
    expect(source).not.toContain("quote_pdf_path");
    expect(source).not.toContain("metadataQuotePdfPath");
  });
});
