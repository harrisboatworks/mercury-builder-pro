export type JsonObject = Record<string, unknown>;

export type BoundDepositQuoteData = {
  saved_quote_id?: unknown;
  deposit_amount?: unknown;
  payment_type?: unknown;
  stripe_session_id?: unknown;
  payment_status?: unknown;
  motor_id?: unknown;
  motor_info?: unknown;
  stripe_payment_intent?: unknown;
  notification_status?: unknown;
  notification_event_id?: unknown;
  notification_lease_expires_at?: unknown;
};

export type BoundDeposit = {
  customer_name?: unknown;
  customer_email?: unknown;
  customer_phone?: unknown;
  deposit_amount?: unknown;
  quote_data?: BoundDepositQuoteData | JsonObject | null;
};

export type BoundSavedQuote = {
  id: string;
  email?: unknown;
  deposit_status?: unknown;
  deposit_amount?: unknown;
};

export type DepositPreclaimInput = {
  sessionId?: string | null;
  sessionMode?: string | null;
  sessionStatus?: string | null;
  sessionCurrency?: string | null;
  sessionAmountTotal?: number | null;
  paymentIntentId?: string | null;
  metadataPaymentType?: string | null;
  metadataDepositAmount?: string | null;
  metadataSavedQuoteId?: string | null;
  metadataMotorId?: string | null;
  metadataMotorInfo?: string | null;
  stripeReceiptEmail?: string | null;
  boundDeposit: BoundDeposit;
  boundSavedQuote?: BoundSavedQuote | null;
};

export type ReconciledDeposit = {
  sessionId: string;
  paymentIntentId: string;
  depositAmount: number;
  depositAmountCents: number;
  savedQuoteId: string;
  motorId: string;
  motorInfo: JsonObject;
  customerName: string;
  customerPhone: string;
  quoteAuthorizationEmail: string;
  stripeReceiptEmail: string;
};

function asObject(value: unknown): JsonObject | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as JsonObject
    : null;
}

function requiredText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value: unknown): string {
  return requiredText(value).toLowerCase();
}

function parseMotorMetadata(value: unknown): JsonObject | null {
  if (typeof value !== "string" || !value) return null;
  try {
    return asObject(JSON.parse(value));
  } catch {
    return null;
  }
}

function motorInfoMatches(left: JsonObject, right: JsonObject): boolean {
  return requiredText(left.model) === requiredText(right.model)
    && Number(left.hp) === Number(right.hp);
}

/**
 * Validates the signed Stripe session against the exact server-side records
 * created before checkout. Call this before any pending -> paid claim or
 * notification side effect.
 */
export function validateDepositBeforeClaim(input: DepositPreclaimInput): ReconciledDeposit {
  const boundQuoteData = asObject(input.boundDeposit.quote_data);
  if (!boundQuoteData) {
    throw new Error("Bound deposit authority is incomplete");
  }

  const sessionId = requiredText(input.sessionId);
  const boundSessionId = requiredText(boundQuoteData.stripe_session_id);
  const paymentIntentId = requiredText(input.paymentIntentId);
  if (
    !sessionId
    || boundSessionId !== sessionId
    || input.sessionMode !== "payment"
    || input.sessionStatus !== "complete"
    || !paymentIntentId
  ) {
    throw new Error("Stripe payment session does not match the bound deposit");
  }

  if (
    input.metadataPaymentType !== "motor_deposit"
    || boundQuoteData.payment_type !== "motor_deposit"
  ) {
    throw new Error("Stripe payment type does not match the bound deposit");
  }

  const boundDepositAmount = Number(input.boundDeposit.deposit_amount);
  const boundQuoteDataAmount = Number(boundQuoteData.deposit_amount);
  const metadataDepositAmount = Number(input.metadataDepositAmount);
  const boundDepositAmountCents = boundDepositAmount * 100;
  if (
    !Number.isFinite(boundDepositAmount)
    || boundDepositAmount <= 0
    || !Number.isSafeInteger(boundDepositAmountCents)
    || boundQuoteDataAmount !== boundDepositAmount
    || metadataDepositAmount !== boundDepositAmount
  ) {
    throw new Error("Stripe deposit amount metadata does not match the bound record");
  }

  if (input.sessionCurrency !== "cad") {
    throw new Error("Stripe deposit currency does not match the bound CAD deposit");
  }

  if (
    !Number.isSafeInteger(input.sessionAmountTotal)
    || input.sessionAmountTotal !== boundDepositAmountCents
  ) {
    throw new Error("Stripe deposit total does not match the bound deposit amount");
  }

  const boundSavedQuoteId = requiredText(boundQuoteData.saved_quote_id);
  const metadataSavedQuoteId = requiredText(input.metadataSavedQuoteId);
  if (!boundSavedQuoteId || boundSavedQuoteId !== metadataSavedQuoteId) {
    throw new Error("Stripe saved quote metadata does not match the bound deposit");
  }

  const quoteAuthorizationEmail = normalizeEmail(input.boundDeposit.customer_email);
  const customerName = requiredText(input.boundDeposit.customer_name);
  const customerPhone = requiredText(input.boundDeposit.customer_phone);
  if (!quoteAuthorizationEmail || !customerName || !customerPhone) {
    throw new Error("Bound deposit customer identity is incomplete");
  }

  const savedQuote = input.boundSavedQuote;
  const savedQuoteStatus = requiredText(savedQuote?.deposit_status);
  if (
    !savedQuote
    || savedQuote.id !== boundSavedQuoteId
    || normalizeEmail(savedQuote.email) !== quoteAuthorizationEmail
    || Number(savedQuote.deposit_amount) !== boundDepositAmount
    || !["pending", "paid"].includes(savedQuoteStatus)
  ) {
    throw new Error("Bound saved quote could not be verified");
  }

  const boundPaymentStatus = requiredText(boundQuoteData.payment_status);
  const notificationStatus = requiredText(boundQuoteData.notification_status);
  const boundPaymentIntentId = requiredText(boundQuoteData.stripe_payment_intent);
  const notificationEventId = requiredText(boundQuoteData.notification_event_id);
  const notificationLeaseExpiresAt = requiredText(
    boundQuoteData.notification_lease_expires_at,
  );
  if (
    !["pending", "paid"].includes(boundPaymentStatus)
    || (boundPaymentStatus === "pending" && (
      savedQuoteStatus !== "pending"
      || notificationStatus !== ""
      || boundPaymentIntentId !== ""
    ))
    || (boundPaymentStatus === "paid" && (
      boundPaymentIntentId !== paymentIntentId
      || !["processing", "delivered", "manual_follow_up"].includes(notificationStatus)
      || (["delivered", "manual_follow_up"].includes(notificationStatus)
        && savedQuoteStatus !== "paid")
      || (notificationStatus === "processing" && (
        !notificationEventId
        || !Number.isFinite(Date.parse(notificationLeaseExpiresAt))
      ))
    ))
  ) {
    throw new Error("Bound deposit and saved quote states cannot be reconciled");
  }

  const boundMotorId = requiredText(boundQuoteData.motor_id);
  const metadataMotorId = requiredText(input.metadataMotorId);
  const boundMotorInfo = asObject(boundQuoteData.motor_info);
  const metadataMotorInfo = parseMotorMetadata(input.metadataMotorInfo);
  if (
    !boundMotorId
    || metadataMotorId !== boundMotorId
    || !boundMotorInfo
    || !metadataMotorInfo
    || !requiredText(boundMotorInfo.model)
    || !Number.isFinite(Number(boundMotorInfo.hp))
    || Number(boundMotorInfo.hp) <= 0
    || !motorInfoMatches(boundMotorInfo, metadataMotorInfo)
  ) {
    throw new Error("Stripe motor metadata does not match the bound deposit");
  }

  return {
    sessionId,
    paymentIntentId,
    depositAmount: boundDepositAmount,
    depositAmountCents: boundDepositAmountCents,
    savedQuoteId: boundSavedQuoteId,
    motorId: boundMotorId,
    motorInfo: boundMotorInfo,
    customerName,
    customerPhone,
    quoteAuthorizationEmail,
    stripeReceiptEmail: normalizeEmail(input.stripeReceiptEmail),
  };
}

/**
 * Keeps the paid claim behind the same reconciliation contract used by the
 * handler's early duplicate check. The callback is never entered on mismatch.
 */
export async function claimDepositAfterValidation<T>(
  input: DepositPreclaimInput,
  claim: (deposit: ReconciledDeposit) => Promise<T>,
): Promise<T> {
  return await claim(validateDepositBeforeClaim(input));
}
