import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import {
  claimDepositAfterValidation,
  type BoundDeposit,
  type DepositPreclaimInput,
  validateDepositBeforeClaim,
} from "../../../../supabase/functions/stripe-webhook/deposit-reconciliation";

const SAVED_QUOTE_ID = "11111111-1111-4111-8111-111111111111";
const MOTOR_ID = "22222222-2222-4222-8222-222222222222";
const MOTOR_INFO = { model: "Mercury 115 FourStroke", hp: 115 };

const validBoundDeposit = (): BoundDeposit => ({
  customer_name: "Quote Owner",
  customer_email: "quote-owner@example.com",
  customer_phone: "9055550100",
  deposit_amount: 500,
  quote_data: {
    saved_quote_id: SAVED_QUOTE_ID,
    deposit_amount: "500",
    payment_type: "motor_deposit",
    stripe_session_id: "cs_test_bound",
    payment_status: "pending",
    motor_id: MOTOR_ID,
    motor_info: MOTOR_INFO,
  },
});

const validInput = (overrides: Partial<DepositPreclaimInput> = {}): DepositPreclaimInput => ({
  sessionId: "cs_test_bound",
  sessionMode: "payment",
  sessionStatus: "complete",
  sessionCurrency: "cad",
  sessionAmountTotal: 50000,
  paymentIntentId: "pi_test_paid",
  metadataPaymentType: "motor_deposit",
  metadataDepositAmount: "500",
  metadataSavedQuoteId: SAVED_QUOTE_ID,
  metadataMotorId: MOTOR_ID,
  metadataMotorInfo: JSON.stringify(MOTOR_INFO),
  stripeReceiptEmail: "receipt@example.com",
  boundDeposit: validBoundDeposit(),
  boundSavedQuote: {
    id: SAVED_QUOTE_ID,
    email: "quote-owner@example.com",
    deposit_status: "pending",
    deposit_amount: 500,
  },
  ...overrides,
});

describe("Stripe deposit pre-claim reconciliation", () => {
  it("uses only bound customer and motor authority while retaining receipt context", () => {
    const result = validateDepositBeforeClaim(validInput());

    expect(result).toMatchObject({
      sessionId: "cs_test_bound",
      paymentIntentId: "pi_test_paid",
      depositAmount: 500,
      depositAmountCents: 50000,
      savedQuoteId: SAVED_QUOTE_ID,
      motorId: MOTOR_ID,
      motorInfo: MOTOR_INFO,
      customerName: "Quote Owner",
      customerPhone: "9055550100",
      quoteAuthorizationEmail: "quote-owner@example.com",
      stripeReceiptEmail: "receipt@example.com",
    });
    expect(result).not.toHaveProperty("quotePdfPath");
  });

  it.each([
    ["missing session id", { sessionId: null }],
    ["wrong bound session id", {
      boundDeposit: {
        ...validBoundDeposit(),
        quote_data: {
          ...validBoundDeposit().quote_data,
          stripe_session_id: "cs_test_other",
        },
      },
    }],
    ["wrong session mode", { sessionMode: "subscription" }],
    ["incomplete session", { sessionStatus: "open" }],
    ["missing payment intent", { paymentIntentId: null }],
    ["wrong metadata payment type", { metadataPaymentType: "quote" }],
    ["wrong bound payment type", {
      boundDeposit: {
        ...validBoundDeposit(),
        quote_data: {
          ...validBoundDeposit().quote_data,
          payment_type: "quote",
        },
      },
    }],
    ["wrong currency", { sessionCurrency: "usd" }],
    ["wrong total", { sessionAmountTotal: 49999 }],
    ["missing total", { sessionAmountTotal: null }],
    ["wrong deposit metadata", { metadataDepositAmount: "499" }],
    ["wrong bound deposit metadata", {
      boundDeposit: {
        ...validBoundDeposit(),
        quote_data: {
          ...validBoundDeposit().quote_data,
          deposit_amount: "499",
        },
      },
    }],
    ["wrong saved quote metadata", {
      metadataSavedQuoteId: "33333333-3333-4333-8333-333333333333",
    }],
    ["missing saved quote binding", {
      metadataSavedQuoteId: "",
      boundDeposit: {
        ...validBoundDeposit(),
        quote_data: {
          ...validBoundDeposit().quote_data,
          saved_quote_id: "",
        },
      },
      boundSavedQuote: null,
    }],
    ["wrong motor id", { metadataMotorId: "other-motor" }],
    ["wrong motor details", {
      metadataMotorInfo: JSON.stringify({ model: MOTOR_INFO.model, hp: 90 }),
    }],
    ["fractional-cent bound amount", {
      metadataDepositAmount: "500.001",
      sessionAmountTotal: 50000.1,
      boundDeposit: {
        ...validBoundDeposit(),
        deposit_amount: 500.001,
        quote_data: {
          ...validBoundDeposit().quote_data,
          deposit_amount: "500.001",
        },
      },
    }],
  ])("rejects %s before a deposit can be claimed", (_label, overrides) => {
    expect(() => validateDepositBeforeClaim(validInput(overrides))).toThrow();
  });

  it.each([
    ["missing name", { customer_name: "" }],
    ["missing email", { customer_email: "" }],
    ["missing phone", { customer_phone: "" }],
  ])("rejects bound customer identity with %s", (_label, boundOverride) => {
    expect(() => validateDepositBeforeClaim(validInput({
      boundDeposit: {
        ...validBoundDeposit(),
        ...boundOverride,
      },
    }))).toThrow("Bound deposit customer identity is incomplete");
  });

  it.each([
    ["missing saved quote", null],
    ["wrong id", {
      id: "33333333-3333-4333-8333-333333333333",
      email: "quote-owner@example.com",
      deposit_status: "pending",
      deposit_amount: 500,
    }],
    ["wrong owner", {
      id: SAVED_QUOTE_ID,
      email: "someone-else@example.com",
      deposit_status: "pending",
      deposit_amount: 500,
    }],
    ["wrong amount", {
      id: SAVED_QUOTE_ID,
      email: "quote-owner@example.com",
      deposit_status: "pending",
      deposit_amount: 200,
    }],
    ["invalid status", {
      id: SAVED_QUOTE_ID,
      email: "quote-owner@example.com",
      deposit_status: "refunded",
      deposit_amount: 500,
    }],
  ])("rejects %s saved-quote authority", (_label, boundSavedQuote) => {
    expect(() => validateDepositBeforeClaim(validInput({ boundSavedQuote }))).toThrow(
      "Bound saved quote could not be verified",
    );
  });

  it("rejects a pending binding when its saved quote is already paid", () => {
    expect(() => validateDepositBeforeClaim(validInput({
      boundSavedQuote: {
        id: SAVED_QUOTE_ID,
        email: "quote-owner@example.com",
        deposit_status: "paid",
        deposit_amount: 500,
      },
    }))).toThrow("Bound deposit and saved quote states cannot be reconciled");
  });

  it("accepts exact paid duplicate state", () => {
    const boundDeposit = validBoundDeposit();
    boundDeposit.quote_data = {
      ...boundDeposit.quote_data,
      payment_status: "paid",
      stripe_payment_intent: "pi_test_paid",
      notification_status: "delivered",
    };

    expect(validateDepositBeforeClaim(validInput({
      boundDeposit,
      boundSavedQuote: {
        id: SAVED_QUOTE_ID,
        email: "quote-owner@example.com",
        deposit_status: "paid",
        deposit_amount: 500,
      },
    })).savedQuoteId).toBe(SAVED_QUOTE_ID);
  });

  it("accepts paid-processing recovery while the saved quote remains pending", () => {
    const boundDeposit = validBoundDeposit();
    boundDeposit.quote_data = {
      ...boundDeposit.quote_data,
      payment_status: "paid",
      stripe_payment_intent: "pi_test_paid",
      notification_status: "processing",
      notification_event_id: "evt_test_first",
      notification_lease_expires_at: "2026-08-30T20:00:00.000Z",
    };

    expect(validateDepositBeforeClaim(validInput({ boundDeposit })).depositAmount).toBe(500);
  });

  it("rejects a paid replay whose payment intent differs from the durable claim", () => {
    const boundDeposit = validBoundDeposit();
    boundDeposit.quote_data = {
      ...boundDeposit.quote_data,
      payment_status: "paid",
      stripe_payment_intent: "pi_test_other",
      notification_status: "processing",
      notification_event_id: "evt_test_first",
      notification_lease_expires_at: "2026-08-30T20:00:00.000Z",
    };

    expect(() => validateDepositBeforeClaim(validInput({ boundDeposit }))).toThrow(
      "Bound deposit and saved quote states cannot be reconciled",
    );
  });

  it("rejects a completed notification whose saved quote is still pending", () => {
    const boundDeposit = validBoundDeposit();
    boundDeposit.quote_data = {
      ...boundDeposit.quote_data,
      payment_status: "paid",
      stripe_payment_intent: "pi_test_paid",
      notification_status: "delivered",
    };

    expect(() => validateDepositBeforeClaim(validInput({ boundDeposit }))).toThrow(
      "Bound deposit and saved quote states cannot be reconciled",
    );
  });

  it("leaves a mismatched deposit unclaimed and does not enter notification work", async () => {
    const claim = vi.fn(async () => "claimed");

    await expect(claimDepositAfterValidation(
      validInput({ sessionAmountTotal: 49999 }),
      claim,
    )).rejects.toThrow("Stripe deposit total does not match the bound deposit amount");

    expect(claim).not.toHaveBeenCalled();
  });

  it("keeps every state and notification side effect after pre-claim validation", () => {
    const source = readFileSync("supabase/functions/stripe-webhook/index.ts", "utf8");
    const savedQuoteRead = source.indexOf('.from("saved_quotes")');
    const validation = source.indexOf("validateDepositBeforeClaim(depositPreclaimInput)");
    const duplicateReturn = source.indexOf("Deposit session already processed");
    const gatedClaim = source.indexOf("claimDepositAfterValidation(");
    const claim = source.indexOf('.update({ lead_status: "scheduled"');
    const savedQuoteUpdate = source.indexOf("deposit_status: \"paid\"", claim);
    const notification = source.indexOf('supabase.functions.invoke("send-deposit-confirmation-email"');

    expect(savedQuoteRead).toBeGreaterThan(-1);
    expect(validation).toBeGreaterThan(savedQuoteRead);
    expect(duplicateReturn).toBeGreaterThan(validation);
    expect(gatedClaim).toBeGreaterThan(duplicateReturn);
    expect(claim).toBeGreaterThan(gatedClaim);
    expect(savedQuoteUpdate).toBeGreaterThan(claim);
    expect(notification).toBeGreaterThan(savedQuoteUpdate);
  });

  it("preserves replay-safe claim and notification CAS predicates", () => {
    const source = readFileSync("supabase/functions/stripe-webhook/index.ts", "utf8");
    const duplicateCheck = source.indexOf(
      'boundQuoteData.payment_status === "paid" && notificationsComplete(boundQuoteData)',
    );
    const duplicateResponse = source.indexOf(
      "JSON.stringify({ received: true, processed: true, duplicate: true })",
      duplicateCheck,
    );
    const pendingClaim = source.indexOf(
      '.contains("quote_data", { payment_status: "pending" })',
      duplicateCheck,
    );
    const notificationClaim = source.indexOf(
      'notification_event_id: event.id',
      pendingClaim,
    );

    expect(duplicateCheck).toBeGreaterThan(-1);
    expect(duplicateResponse).toBeGreaterThan(duplicateCheck);
    expect(pendingClaim).toBeGreaterThan(duplicateResponse);
    expect(notificationClaim).toBeGreaterThan(pendingClaim);
    expect(source).toContain(
      "notification_event_id: boundQuoteData.notification_event_id",
    );
  });

  it("uses durable customer and motor values for deposit notifications", () => {
    const source = readFileSync("supabase/functions/stripe-webhook/index.ts", "utf8");
    const depositStart = source.indexOf('payment_type === "motor_deposit"');
    const quoteStart = source.indexOf('payment_type === "quote"', depositStart);
    const depositSource = source.slice(depositStart, quoteStart);

    expect(depositSource).toContain("reconciledDeposit.customerName");
    expect(depositSource).toContain("reconciledDeposit.customerPhone");
    expect(depositSource).toContain("reconciledDeposit.motorInfo");
    expect(depositSource).not.toContain("session.metadata.customer_name");
    expect(depositSource).not.toContain("session.metadata.customer_phone");
    expect(depositSource).not.toContain("JSON.parse(session.metadata.motor_info)");
  });

  it("accepts an exact concurrent saved-quote winner before notifications", () => {
    const source = readFileSync("supabase/functions/stripe-webhook/index.ts", "utf8");
    const savedQuoteClaim = source.indexOf('.eq("deposit_status", "pending")');
    const concurrentRead = source.indexOf("concurrentSavedQuote", savedQuoteClaim);
    const paidCheck = source.indexOf('concurrentSavedQuote.deposit_status !== "paid"', concurrentRead);
    const notification = source.indexOf(
      'supabase.functions.invoke("send-deposit-confirmation-email"',
      paidCheck,
    );

    expect(savedQuoteClaim).toBeGreaterThan(-1);
    expect(concurrentRead).toBeGreaterThan(savedQuoteClaim);
    expect(paidCheck).toBeGreaterThan(concurrentRead);
    expect(notification).toBeGreaterThan(paidCheck);
  });

  it("keeps customer document paths outside Stripe reconciliation authority", () => {
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
