import { describe, expect, it } from "vitest";

import {
  depositPaymentNotificationSnapshot,
  paymentEmailIdempotencyKey,
  paymentEmailRetryWindowExpired,
  paymentNotificationAttemptedAtIsValid,
  paymentNotificationFirstAttemptAt,
  paymentNotificationStatusAfterSms,
  paymentSmsAttemptIsActive,
  paymentSmsAttemptIsAmbiguous,
  quotePaymentNotificationSnapshot,
  requirePaymentNotificationAttemptedAt,
  RESEND_RETRY_GUARD_MS,
  SMS_ATTEMPT_LEASE_MS,
} from "../../supabase/functions/_shared/payment-notification-idempotency";

describe("payment notification idempotency policy", () => {
  it("derives a stable provider key from the payment session and channel", () => {
    expect(paymentEmailIdempotencyKey("deposit-customer", "cs_test_abc123"))
      .toBe("payment/deposit-customer/cs_test_abc123");
    expect(paymentEmailIdempotencyKey("deposit-admin", "cs_test_abc123"))
      .toBe("payment/deposit-admin/cs_test_abc123");
    expect(paymentEmailIdempotencyKey("quote-admin", "cs_live_xyz789"))
      .toBe("payment/quote-admin/cs_live_xyz789");
    expect(() => paymentEmailIdempotencyKey("deposit-admin", "../other-event"))
      .toThrow("Invalid Stripe session ID");
  });

  it("starts the provider window at the trusted claim", () => {
    const later = new Date("2026-08-09T12:05:00.000Z");
    const ownerSeededFuture = "2099-01-01T00:00:00.000Z";

    expect(paymentNotificationFirstAttemptAt(
      "pending",
      ownerSeededFuture,
      later,
    )).toBe(later.toISOString());
  });

  it("preserves the claimed attempt time and fails closed on invalid retries", () => {
    const firstAttempt = "2026-08-09T12:00:00.000Z";
    const later = new Date("2026-08-09T12:05:00.000Z");

    expect(paymentNotificationFirstAttemptAt("paid", firstAttempt, later)).toBe(
      firstAttempt,
    );
    expect(requirePaymentNotificationAttemptedAt(firstAttempt)).toBe(
      firstAttempt,
    );
    expect(paymentNotificationAttemptedAtIsValid(firstAttempt)).toBe(true);
    expect(paymentNotificationAttemptedAtIsValid(undefined)).toBe(false);
    expect(paymentNotificationAttemptedAtIsValid("invalid")).toBe(false);
    expect(() => paymentNotificationFirstAttemptAt("paid", "invalid", later))
      .toThrow("A valid notification attempt timestamp is required");
    expect(() =>
      paymentNotificationFirstAttemptAt("delivered", firstAttempt, later)
    ).toThrow("Payment notification state cannot be claimed");
    expect(() => requirePaymentNotificationAttemptedAt(undefined))
      .toThrow("A valid notification attempt timestamp is required");
  });

  it("derives quote notification inputs only from the immutable Stripe snapshot", () => {
    const serialized = JSON.stringify({
      customerName: "  Ada Lovelace  ",
      customerPhone: " 905-555-0100 ",
      motorModel: " 150 Pro XS ",
    });

    expect(quotePaymentNotificationSnapshot(serialized, " ada@example.com "))
      .toEqual({
        customerEmail: "ada@example.com",
        customerName: "Ada Lovelace",
        customerPhone: "905-555-0100",
        motorLabel: "150 Pro XS",
      });
    expect(quotePaymentNotificationSnapshot("{}", "buyer@example.com"))
      .toEqual({
        customerEmail: "buyer@example.com",
        customerName: "buyer@example.com",
        customerPhone: "",
        motorLabel: "Mercury motor",
      });
    expect(() => quotePaymentNotificationSnapshot("{", "buyer@example.com"))
      .toThrow("Invalid Stripe quote snapshot");
  });

  it("derives deposit notification inputs from the immutable Stripe session", () => {
    const snapshot = depositPaymentNotificationSnapshot({
      customer_email: " Buyer@Example.com ",
      customer_name: " Ada Lovelace ",
      customer_phone: " 905-555-0100 ",
      deposit_amount: "250",
      motor_info: JSON.stringify({ model: "150 Pro XS", hp: 150 }),
    }, "pi_test_paid");

    expect(snapshot).toEqual({
      customerEmail: "buyer@example.com",
      customerName: "Ada Lovelace",
      customerPhone: "905-555-0100",
      depositAmount: "250",
      motorInfo: { model: "150 Pro XS", hp: 150 },
      paymentId: "pi_test_paid",
    });
    expect(() => depositPaymentNotificationSnapshot({
      customer_email: "buyer@example.com",
      motor_info: "{",
    }, "pi_test_paid")).toThrow(
      "Invalid Stripe deposit snapshot",
    );
  });

  it("stops automatic retries before the provider key can expire", () => {
    const firstAttempt = "2026-08-09T00:00:00.000Z";
    const justInside = new Date(
      Date.parse(firstAttempt) + RESEND_RETRY_GUARD_MS - 1,
    );
    const atBoundary = new Date(
      Date.parse(firstAttempt) + RESEND_RETRY_GUARD_MS,
    );

    expect(paymentEmailRetryWindowExpired(firstAttempt, justInside)).toBe(
      false,
    );
    expect(paymentEmailRetryWindowExpired(firstAttempt, atBoundary)).toBe(true);
    expect(paymentEmailRetryWindowExpired(undefined, atBoundary)).toBe(false);
  });

  it("distinguishes an in-flight SMS from an abandoned attempt", () => {
    const attemptedAt = "2026-08-09T12:00:00.000Z";
    const inFlight = new Date(
      Date.parse(attemptedAt) + SMS_ATTEMPT_LEASE_MS - 1,
    );
    const abandoned = new Date(Date.parse(attemptedAt) + SMS_ATTEMPT_LEASE_MS);

    expect(paymentSmsAttemptIsActive("attempting", attemptedAt, inFlight)).toBe(
      true,
    );
    expect(paymentSmsAttemptIsActive("attempting", attemptedAt, abandoned))
      .toBe(false);
    expect(paymentSmsAttemptIsActive("delivered", attemptedAt, inFlight)).toBe(
      false,
    );
    expect(paymentSmsAttemptIsActive("attempting", undefined, inFlight)).toBe(
      false,
    );
    expect(paymentSmsAttemptIsAmbiguous("attempting", attemptedAt, inFlight))
      .toBe(false);
    expect(paymentSmsAttemptIsAmbiguous("attempting", attemptedAt, abandoned))
      .toBe(true);
    expect(paymentSmsAttemptIsAmbiguous("attempting", undefined, inFlight))
      .toBe(true);
    expect(paymentSmsAttemptIsAmbiguous("delivered", attemptedAt, abandoned))
      .toBe(false);
  });

  it("requires manual follow-up when either delivery channel fails", () => {
    expect(paymentNotificationStatusAfterSms("delivered", false)).toBe(
      "delivered",
    );
    expect(paymentNotificationStatusAfterSms("delivered", true)).toBe(
      "manual_follow_up",
    );
    expect(paymentNotificationStatusAfterSms("manual_follow_up", false))
      .toBe("manual_follow_up");
    expect(paymentNotificationStatusAfterSms(undefined, false)).toBe(
      "manual_follow_up",
    );
  });
});
