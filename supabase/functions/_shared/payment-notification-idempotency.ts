const STRIPE_SESSION_PATTERN = /^cs_(?:test_|live_)?[A-Za-z0-9]+$/;

export const RESEND_RETRY_GUARD_MS = 23 * 60 * 60 * 1000;
export const SMS_ATTEMPT_LEASE_MS = 5 * 60 * 1000;

export type PaymentEmailChannel =
  | "deposit-customer"
  | "deposit-admin"
  | "quote-admin";

export type PaymentNotificationStatus = "delivered" | "manual_follow_up";

export type QuotePaymentNotificationSnapshot = {
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  motorLabel: string;
};

export type DepositPaymentNotificationSnapshot = {
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  depositAmount: string;
  motorInfo: {
    model: string;
    hp: number;
  };
  paymentId: string;
};

function parseTimestamp(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function optionalText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Quote owners can edit their quote row, so a Resend request that reuses a
 * session-derived idempotency key must never be rebuilt from those columns.
 * Stripe Checkout metadata is fixed on the signed session and therefore gives
 * every delivery of the same event the same rendered inputs.
 */
export function quotePaymentNotificationSnapshot(
  serializedQuoteData: unknown,
  stripeCustomerEmail: unknown,
): QuotePaymentNotificationSnapshot {
  let quoteData: Record<string, unknown> = {};
  if (typeof serializedQuoteData === "string") {
    try {
      const parsed = JSON.parse(serializedQuoteData);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        quoteData = parsed as Record<string, unknown>;
      }
    } catch {
      throw new Error("Invalid Stripe quote snapshot");
    }
  } else if (serializedQuoteData != null) {
    throw new Error("Invalid Stripe quote snapshot");
  }

  const customerEmail = optionalText(stripeCustomerEmail);
  return {
    customerEmail,
    customerName: optionalText(quoteData.customerName) || customerEmail || "Customer",
    customerPhone: optionalText(quoteData.customerPhone),
    motorLabel: optionalText(quoteData.motorModel) || "Mercury motor",
  };
}

/**
 * Build deposit notification bytes from metadata fixed on the signed Checkout
 * Session. The customer-owned binding row is authorization state, not a safe
 * source for a provider request that will reuse a session-derived key.
 */
export function depositPaymentNotificationSnapshot(
  sessionMetadata: unknown,
  stripePaymentIntentId: unknown,
): DepositPaymentNotificationSnapshot {
  if (
    sessionMetadata === null ||
    typeof sessionMetadata !== "object" ||
    Array.isArray(sessionMetadata)
  ) {
    throw new Error("Invalid Stripe deposit snapshot");
  }
  const metadata = sessionMetadata as Record<string, unknown>;
  const customerEmail = optionalText(metadata.customer_email).toLowerCase();
  const customerName = optionalText(metadata.customer_name);
  const customerPhone = optionalText(metadata.customer_phone);
  const depositAmount = optionalText(metadata.deposit_amount);
  const paymentId = optionalText(stripePaymentIntentId);

  let motorInfo: Record<string, unknown> | null = null;
  if (typeof metadata.motor_info === "string") {
    try {
      const parsed = JSON.parse(metadata.motor_info);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        motorInfo = parsed as Record<string, unknown>;
      }
    } catch {
      throw new Error("Invalid Stripe deposit snapshot");
    }
  }
  const motorModel = optionalText(motorInfo?.model);
  const motorHp = Number(motorInfo?.hp);
  if (
    !customerEmail ||
    !customerName ||
    !customerPhone ||
    !depositAmount ||
    !Number.isFinite(Number(depositAmount)) ||
    Number(depositAmount) <= 0 ||
    !paymentId ||
    !motorModel ||
    !Number.isFinite(motorHp) ||
    motorHp <= 0
  ) {
    throw new Error("Invalid Stripe deposit snapshot");
  }

  return {
    customerEmail,
    customerName,
    customerPhone,
    depositAmount,
    motorInfo: { model: motorModel, hp: motorHp },
    paymentId,
  };
}

export function requirePaymentNotificationAttemptedAt(
  existing: unknown,
): string {
  const parsed = parseTimestamp(existing);
  if (parsed === null) {
    throw new Error("A valid notification attempt timestamp is required");
  }
  return new Date(parsed).toISOString();
}

export function paymentNotificationAttemptedAtIsValid(
  existing: unknown,
): boolean {
  return parseTimestamp(existing) !== null;
}

/**
 * A pending row may have been owner-mutable before Stripe binding, so its
 * timestamp must never seed the provider retry window. The service-role claim
 * writes a fresh first-attempt time atomically with the paid state. Paid retries
 * must preserve that exact value or fail closed.
 */
export function paymentNotificationFirstAttemptAt(
  paymentStatus: unknown,
  existing: unknown,
  now = new Date(),
): string {
  if (paymentStatus === "pending") return now.toISOString();
  if (paymentStatus === "paid") {
    return requirePaymentNotificationAttemptedAt(existing);
  }
  throw new Error("Payment notification state cannot be claimed");
}

export function paymentEmailRetryWindowExpired(
  attemptedAt: unknown,
  now = new Date(),
): boolean {
  const parsed = parseTimestamp(attemptedAt);
  return parsed !== null && now.getTime() - parsed >= RESEND_RETRY_GUARD_MS;
}

export function paymentSmsAttemptIsActive(
  status: unknown,
  attemptedAt: unknown,
  now = new Date(),
): boolean {
  const parsed = parseTimestamp(attemptedAt);
  const age = parsed === null ? Number.NaN : now.getTime() - parsed;
  return status === "attempting" &&
    Number.isFinite(age) &&
    age >= 0 &&
    age < SMS_ATTEMPT_LEASE_MS;
}

export function paymentSmsAttemptIsAmbiguous(
  status: unknown,
  attemptedAt: unknown,
  now = new Date(),
): boolean {
  return status === "attempting" &&
    !paymentSmsAttemptIsActive(status, attemptedAt, now);
}

export function paymentNotificationStatusAfterSms(
  emailStatus: unknown,
  smsFailed: boolean,
): PaymentNotificationStatus {
  return emailStatus === "delivered" && !smsFailed
    ? "delivered"
    : "manual_follow_up";
}

export function paymentEmailIdempotencyKey(
  channel: PaymentEmailChannel,
  stripeSessionId: unknown,
): string {
  if (
    typeof stripeSessionId !== "string" ||
    !STRIPE_SESSION_PATTERN.test(stripeSessionId)
  ) {
    throw new Error("Invalid Stripe session ID");
  }
  return `payment/${channel}/${stripeSessionId}`;
}
