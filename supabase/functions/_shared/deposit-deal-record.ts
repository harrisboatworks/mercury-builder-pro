import {
  customerQuoteIdentityColumns,
  type DepositIdentity,
} from "./deposit-identity.ts";
import {
  DEPOSIT_OUTBOX_SCHEMA_KEY,
  DEPOSIT_OUTBOX_SCHEMA_VERSION,
} from "./deposit-email-deliveries.ts";
import {
  DEPOSIT_POLICY_QUOTE_DATA_KEY,
  depositPolicySnapshotsMatch,
  readPersistedDepositPolicy,
  type DepositPolicySnapshot,
} from "./deposit-policy.ts";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const STRIPE_DEPOSIT_METADATA_KEYS = [
  "deposit_amount",
  "payment_type",
  "saved_quote_id",
] as const;

export const BANNED_STRIPE_METADATA_KEYS = [
  "customer_name",
  "customer_email",
  "customer_phone",
  "customer_address",
  "address_line1",
  "postal_code",
  "quote_pdf_path",
  "quotePdfPath",
  "deposit_pdf_path",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asFiniteNumber(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function buildStripeDepositMetadata(options: {
  depositAmount: string;
  savedQuoteId: string;
}): Record<(typeof STRIPE_DEPOSIT_METADATA_KEYS)[number], string> {
  return {
    deposit_amount: options.depositAmount,
    payment_type: "motor_deposit",
    saved_quote_id: options.savedQuoteId,
  };
}

export function stripeDepositMetadataIsSafe(metadata: Record<string, unknown>): boolean {
  const keys = Object.keys(metadata);
  if (keys.some((key) => (BANNED_STRIPE_METADATA_KEYS as readonly string[]).includes(key))) {
    return false;
  }
  return keys.every((key) => (STRIPE_DEPOSIT_METADATA_KEYS as readonly string[]).includes(key));
}

export function stripeCheckoutIdempotencyKey(options: {
  savedQuoteId: string;
  existingSessionId?: string | null;
}): string {
  return options.existingSessionId
    ? `motor-deposit:${options.savedQuoteId}:renew:${options.existingSessionId}`
    : `motor-deposit:${options.savedQuoteId}`;
}

export type DepositPricingFields = {
  motor_model_id: string | null;
  base_price: number;
  final_price: number;
  total_cost: number;
  tradein_value_pre_penalty: number | null;
  tradein_value_final: number | null;
  monthly_payment: number;
  term_months: number;
  loan_amount: number;
};

export function depositPricingFromBoundSnapshot(
  quoteState: unknown,
  quoteSnapshot?: unknown,
): DepositPricingFields {
  const state = isRecord(quoteState) ? quoteState : {};
  const snapshot = isRecord(quoteSnapshot) ? quoteSnapshot : {};
  const motor = isRecord(state.motor) ? state.motor : isRecord(snapshot.motor) ? snapshot.motor : {};
  const frozen = isRecord(state.frozenPricing)
    ? state.frozenPricing
    : isRecord(state.pdfSnapshot) && isRecord(state.pdfSnapshot.pricing)
      ? state.pdfSnapshot.pricing
      : {};
  const snapshotPricing = isRecord(snapshot.frozenPricing)
    ? snapshot.frozenPricing
    : isRecord(state.pdfSnapshot) && isRecord((state.pdfSnapshot as Record<string, unknown>).pricing)
      ? (state.pdfSnapshot as { pricing: Record<string, unknown> }).pricing
      : {};

  const motorId = typeof motor.id === "string" && UUID_PATTERN.test(motor.id) ? motor.id : null;
  const basePrice = asFiniteNumber(frozen.msrp)
    ?? asFiniteNumber(snapshotPricing.msrp)
    ?? asFiniteNumber(motor.price)
    ?? asFiniteNumber(motor.msrp)
    ?? asFiniteNumber(state.basePrice)
    ?? 0;
  const finalPrice = asFiniteNumber(frozen.total)
    ?? asFiniteNumber(frozen.totalCashPrice)
    ?? asFiniteNumber(snapshotPricing.totalCashPrice)
    ?? asFiniteNumber(state.finalPrice)
    ?? basePrice;
  const tradeIn = isRecord(state.tradeInInfo)
    ? state.tradeInInfo
    : isRecord(snapshot.tradeIn)
      ? snapshot.tradeIn
      : {};
  const financing = isRecord(state.financing) ? state.financing : isRecord(snapshot.financing) ? snapshot.financing : {};

  return {
    motor_model_id: motorId,
    base_price: Math.max(0, basePrice),
    final_price: Math.max(0, finalPrice),
    total_cost: Math.max(0, finalPrice),
    tradein_value_pre_penalty: asFiniteNumber(tradeIn.prePenaltyValue ?? tradeIn.estimatedValue),
    tradein_value_final: asFiniteNumber(tradeIn.finalValue ?? tradeIn.estimatedValue),
    monthly_payment: asFiniteNumber(financing.monthlyPayment) ?? 0,
    term_months: asFiniteNumber(financing.termMonths ?? financing.term) ?? 0,
    loan_amount: asFiniteNumber(financing.amountFinanced ?? financing.loanAmount) ?? 0,
  };
}

export type StripeBillingAddress = {
  source: "stripe_checkout_billing";
  line1: string | null;
  line2: string | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
  country: string | null;
};

export function stripeBillingAddressFromCheckout(details: unknown): StripeBillingAddress | null {
  if (!isRecord(details)) return null;
  const address = isRecord(details.address) ? details.address : null;
  if (!address) return null;
  const labelled: StripeBillingAddress = {
    source: "stripe_checkout_billing",
    line1: typeof address.line1 === "string" ? address.line1 : null,
    line2: typeof address.line2 === "string" ? address.line2 : null,
    city: typeof address.city === "string" ? address.city : null,
    region: typeof address.state === "string" ? address.state : null,
    postal_code: typeof address.postal_code === "string" ? address.postal_code : null,
    country: typeof address.country === "string" ? address.country : null,
  };
  if (!labelled.line1 && !labelled.city && !labelled.postal_code && !labelled.country) {
    return null;
  }
  return labelled;
}

export function buildDepositCustomerQuoteRow(options: {
  identity: DepositIdentity;
  savedQuoteId: string;
  userId?: string | null;
  sessionId: string;
  depositAmount: number;
  paymentStatus?: "pending" | "paid";
  paymentIntentId?: string | null;
  motorInfo?: unknown;
  quoteSnapshot?: unknown;
  quoteState?: unknown;
  pricing: DepositPricingFields;
  depositPolicy?: DepositPolicySnapshot | null;
}): Record<string, unknown> {
  return {
    ...customerQuoteIdentityColumns(options.identity),
    ...options.pricing,
    user_id: options.userId || null,
    anonymous_session_id: options.userId ? null : options.sessionId,
    saved_quote_id: options.savedQuoteId,
    stripe_checkout_session_id: options.sessionId,
    stripe_payment_intent_id: options.paymentIntentId || null,
    payment_status: options.paymentStatus || "pending",
    deposit_amount: options.depositAmount,
    lead_status: options.paymentStatus === "paid" ? "scheduled" : "downloaded",
    lead_source: "deposit",
    quote_data: {
      deposit_amount: String(options.depositAmount),
      payment_type: "motor_deposit",
      stripe_session_id: options.sessionId,
      stripe_payment_intent: options.paymentIntentId || null,
      payment_status: options.paymentStatus || "pending",
      saved_quote_id: options.savedQuoteId,
      motor_info: options.motorInfo || null,
      ...(options.quoteSnapshot ? { quote_snapshot: options.quoteSnapshot } : {}),
      ...(options.depositPolicy ? { [DEPOSIT_POLICY_QUOTE_DATA_KEY]: options.depositPolicy } : {}),
    },
  };
}

export function lookupDepositBySession<T extends {
  stripe_checkout_session_id?: string | null;
  quote_data?: unknown;
}>(rows: T[], sessionId: string): T | null {
  const promoted = rows.find((row) => row.stripe_checkout_session_id === sessionId);
  if (promoted) return promoted;
  return rows.find((row) => {
    const quoteData = isRecord(row.quote_data) ? row.quote_data : null;
    return quoteData?.stripe_session_id === sessionId;
  }) || null;
}

export function boundSavedQuoteIdFromDeposit(row: {
  saved_quote_id?: string | null;
  quote_data?: unknown;
}): string {
  if (typeof row.saved_quote_id === "string" && UUID_PATTERN.test(row.saved_quote_id)) {
    return row.saved_quote_id.toLowerCase();
  }
  const quoteData = isRecord(row.quote_data) ? row.quote_data : null;
  return typeof quoteData?.saved_quote_id === "string" && UUID_PATTERN.test(quoteData.saved_quote_id)
    ? quoteData.saved_quote_id.toLowerCase()
    : "";
}

export function shouldSendFirstClaimSms(options: {
  previousPaymentStatus?: string | null;
  smsStatus?: string | null;
}): boolean {
  if (options.previousPaymentStatus === "paid") return false;
  if (options.smsStatus === "sent" || options.smsStatus === "delivered") return false;
  return true;
}

export function classifyExistingDepositCheckoutSession(session: {
  status?: string | null;
  url?: string | null;
}): "reuse_open" | "already_complete" | "renew_expired" | "unusable" {
  if (session.status === "open" && session.url) return "reuse_open";
  if (session.status === "complete") return "already_complete";
  if (session.status === "expired") return "renew_expired";
  return "unusable";
}

export function resolveDepositWebhookSmsGate(options: {
  alreadyPaid: boolean;
  boundQuoteData?: Record<string, unknown> | null;
  claimWon: boolean;
  concurrent?: {
    payment_status?: string | null;
    quote_data?: Record<string, unknown> | null;
  } | null;
}): { previousPaymentStatus: string | null; smsStatus: string | null } {
  const bound = options.boundQuoteData || {};
  if (options.alreadyPaid) {
    return {
      previousPaymentStatus: "paid",
      smsStatus: typeof bound.sms_notification_status === "string" ? bound.sms_notification_status : null,
    };
  }
  const concurrentData = options.concurrent?.quote_data || {};
  const concurrentSettled = options.concurrent?.payment_status === "paid"
    || concurrentData.notification_status === "delivered"
    || concurrentData.notification_status === "manual_follow_up";
  if (!options.claimWon && concurrentSettled) {
    return {
      previousPaymentStatus: "paid",
      smsStatus: typeof concurrentData.sms_notification_status === "string"
        ? concurrentData.sms_notification_status
        : null,
    };
  }
  return {
    previousPaymentStatus: typeof bound.payment_status === "string" ? bound.payment_status : null,
    smsStatus: typeof bound.sms_notification_status === "string" ? bound.sms_notification_status : null,
  };
}

export function depositNotificationOutcomeGuard(eventId: string): {
  notification_status: "processing";
  notification_event_id: string;
} {
  return {
    notification_status: "processing",
    notification_event_id: eventId,
  };
}

export function shouldClaimDepositReplayOwnership(options: {
  alreadyPaid: boolean;
  hasOutboxSchema: boolean;
}): boolean {
  return options.alreadyPaid && options.hasOutboxSchema;
}

export function depositReplayOwnershipClaimFilter(): Record<string, number> {
  return {
    [DEPOSIT_OUTBOX_SCHEMA_KEY]: DEPOSIT_OUTBOX_SCHEMA_VERSION,
  };
}

export function depositReplayOwnershipMatches(
  quoteData: Record<string, unknown> | null | undefined,
  eventId: string,
): boolean {
  const guard = depositNotificationOutcomeGuard(eventId);
  return quoteData?.notification_status === guard.notification_status
    && quoteData?.notification_event_id === guard.notification_event_id;
}

export function classifyNotificationOutcomeWrite(options: {
  written: { id?: string | null } | null;
  writeError?: unknown;
}): "written" | "lost_ownership" | "write_failed" {
  if (options.writeError) return "write_failed";
  if (options.written?.id) return "written";
  return "lost_ownership";
}

export const STRIPE_CHECKOUT_SESSION_PATTERN = /^cs_(?:test_|live_)?[A-Za-z0-9]+$/;

export const RECOVER_STRIPE_BILLING_BANNED_KEYS = [
  "quotePdfPath",
  "quote_pdf_path",
  "deposit_pdf_path",
  "attachmentPath",
  "attachment_path",
  "pdfUrl",
  "signedUrl",
  "publicUrl",
  "stripeBillingAddress",
  "stripe_billing_address",
  "customer_address",
  "address",
  "sessionId",
  "stripeSessionId",
  "paymentIntentId",
  "customer_name",
  "customer_email",
  "customer_phone",
] as const;

export function boundCheckoutSessionIdFromDeposit(row: {
  stripe_checkout_session_id?: string | null;
  quote_data?: unknown;
}): string | null {
  if (
    typeof row.stripe_checkout_session_id === "string"
    && STRIPE_CHECKOUT_SESSION_PATTERN.test(row.stripe_checkout_session_id)
  ) {
    return row.stripe_checkout_session_id;
  }
  const quoteData = isRecord(row.quote_data) ? row.quote_data : null;
  const fromJson = typeof quoteData?.stripe_session_id === "string" ? quoteData.stripe_session_id : "";
  return STRIPE_CHECKOUT_SESSION_PATTERN.test(fromJson) ? fromJson : null;
}

export function assertRecoverStripeBillingRequest(body: Record<string, unknown>): { savedQuoteId: string } {
  for (const key of RECOVER_STRIPE_BILLING_BANNED_KEYS) {
    if (key in body) {
      throw new Error("Caller payment or identity payloads are not accepted");
    }
  }
  if (body.action !== "recover_stripe_billing") {
    throw new Error("Invalid recovery action");
  }
  const savedQuoteId = typeof body.savedQuoteId === "string" ? body.savedQuoteId.trim() : "";
  if (!UUID_PATTERN.test(savedQuoteId)) {
    throw new Error("Invalid saved quote");
  }
  return { savedQuoteId };
}

export function normalizeDepositAmount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function assertStripeDepositChargeMatches(options: {
  amountTotal: number | null | undefined;
  currency?: string | null;
  depositAmount: unknown;
}): number {
  const expected = normalizeDepositAmount(options.depositAmount);
  if (expected == null) {
    throw new Error("Deposit amount is missing");
  }
  if (String(options.currency || "").toLowerCase() !== "cad") {
    throw new Error("Stripe deposit currency is not CAD");
  }
  if (options.amountTotal !== expected * 100) {
    throw new Error("Stripe deposit amount does not match");
  }
  return expected;
}

export function stripeDerivedPaidAt(session: {
  created?: number | null;
  payment_intent?: unknown;
}): string | null {
  if (isRecord(session.payment_intent) && typeof session.payment_intent.created === "number") {
    return new Date(session.payment_intent.created * 1000).toISOString();
  }
  if (typeof session.created === "number") {
    return new Date(session.created * 1000).toISOString();
  }
  return null;
}

export function pendingDepositRebindAllowed(row: {
  payment_status?: string | null;
  stripe_checkout_session_id?: string | null;
}, expectedSessionId: string | null): boolean {
  const pending = row.payment_status == null || row.payment_status === "pending";
  return pending && (row.stripe_checkout_session_id ?? null) === (expectedSessionId ?? null);
}

export function storedDepositPolicyMatches(
  quoteData: unknown,
  expected: DepositPolicySnapshot,
): boolean {
  const persisted = readPersistedDepositPolicy(quoteData);
  return Boolean(persisted && depositPolicySnapshotsMatch(expected, persisted));
}

export function classifyOpenCheckoutPolicyUpgrade(options: {
  expectedSessionId: string;
  expectedPolicy: DepositPolicySnapshot;
  existing: {
    payment_status?: string | null;
    stripe_checkout_session_id?: string | null;
  };
  wrote?: {
    id?: string | null;
    payment_status?: string | null;
    stripe_checkout_session_id?: string | null;
    quote_data?: unknown;
  } | null;
  writeError?: unknown;
  reread?: {
    payment_status?: string | null;
    stripe_checkout_session_id?: string | null;
    quote_data?: unknown;
  } | null;
}): "upgraded" | "already_paid" | "upgrade_failed" {
  if (
    options.existing.payment_status === "paid"
    || options.wrote?.payment_status === "paid"
    || options.reread?.payment_status === "paid"
  ) {
    return "already_paid";
  }
  if (!pendingDepositRebindAllowed(options.existing, options.expectedSessionId)) {
    return "upgrade_failed";
  }
  if (!options.reread) {
    return "upgrade_failed";
  }
  if (!pendingDepositRebindAllowed(options.reread, options.expectedSessionId)) {
    return "upgrade_failed";
  }
  if (!storedDepositPolicyMatches(options.reread.quote_data, options.expectedPolicy)) {
    return "upgrade_failed";
  }
  return "upgraded";
}

export function classifyDepositPersistOutcome(options: {
  mode: "insert" | "update";
  wrote: { id?: string | null; payment_status?: string | null; stripe_checkout_session_id?: string | null } | null;
  writeError?: unknown;
  createdSessionId: string;
  reread?: { payment_status?: string | null; stripe_checkout_session_id?: string | null } | null;
}): "saved" | "reused_same_session" | "already_paid" | "persist_failed" {
  if (!options.writeError && options.wrote?.id) {
    return options.wrote.payment_status === "paid" ? "already_paid" : "saved";
  }
  if (options.reread?.payment_status === "paid") {
    return "already_paid";
  }
  if (
    options.reread?.stripe_checkout_session_id === options.createdSessionId
    && options.reread.payment_status !== "paid"
  ) {
    return "reused_same_session";
  }
  return "persist_failed";
}

export function classifyOptimisticRecoveryWrite(options: {
  written: { id?: string | null } | null;
  writeError?: unknown;
  reread?: {
    payment_status?: string | null;
    stripe_checkout_session_id?: string | null;
  } | null;
  expectedSessionId: string;
}): "written" | "already_completed" | "conflict" | "write_failed" {
  if (options.writeError) return "write_failed";
  if (options.written?.id) return "written";
  if (
    options.reread?.payment_status === "paid"
    && options.reread.stripe_checkout_session_id === options.expectedSessionId
  ) {
    return "already_completed";
  }
  return "conflict";
}

export function assertDepositAmountsAgree(amounts: Array<number | null | undefined>): number {
  const present = amounts.filter((value): value is number => value != null && Number.isFinite(value));
  if (present.length === 0) {
    throw new Error("Deposit amount is missing");
  }
  const first = present[0];
  if (present.some((value) => value !== first)) {
    throw new Error("Deposit amounts do not match");
  }
  return first;
}

export function paymentIntentIdFromSession(session: {
  payment_intent?: unknown;
}): string | null {
  if (typeof session.payment_intent === "string" && /^pi_(?:test_|live_)?[A-Za-z0-9]+$/.test(session.payment_intent)) {
    return session.payment_intent;
  }
  if (isRecord(session.payment_intent) && typeof session.payment_intent.id === "string") {
    return /^pi_(?:test_|live_)?[A-Za-z0-9]+$/.test(session.payment_intent.id)
      ? session.payment_intent.id
      : null;
  }
  return null;
}

export function quoteDataDepositAmount(quoteData: unknown): number | null {
  return isRecord(quoteData) ? normalizeDepositAmount(quoteData.deposit_amount) : null;
}

export function assertBoundCheckoutMatchesRecovery(options: {
  savedQuoteId: string;
  deposit: {
    saved_quote_id?: string | null;
    stripe_checkout_session_id?: string | null;
    quote_data?: unknown;
    lead_source?: string | null;
    deposit_amount?: number | string | null;
  };
  savedQuote?: {
    id?: string | null;
    deposit_amount?: number | string | null;
  } | null;
  session: {
    id: string;
    payment_status?: string | null;
    amount_total?: number | null;
    currency?: string | null;
    payment_intent?: unknown;
    metadata?: Record<string, string> | null;
  };
}): { sessionId: string; depositAmount: number; paymentIntentId: string | null } {
  if (options.deposit.lead_source !== "deposit") {
    throw new Error("Bound row is not a deposit");
  }
  const boundSessionId = boundCheckoutSessionIdFromDeposit(options.deposit);
  if (!boundSessionId) {
    throw new Error("No bound checkout session");
  }
  if (options.session.id !== boundSessionId) {
    throw new Error("Checkout session is not the bound session");
  }
  if (options.session.payment_status !== "paid") {
    throw new Error("Checkout session is not paid");
  }
  if (String(options.session.currency || "").toLowerCase() !== "cad") {
    throw new Error("Stripe deposit currency is not CAD");
  }
  const boundQuoteId = boundSavedQuoteIdFromDeposit(options.deposit);
  if (!boundQuoteId || boundQuoteId !== options.savedQuoteId.toLowerCase()) {
    throw new Error("Deposit is not bound to this saved quote");
  }
  if (options.savedQuote?.id && options.savedQuote.id.toLowerCase() !== options.savedQuoteId.toLowerCase()) {
    throw new Error("Saved quote does not match recovery target");
  }
  const metadataQuoteId = options.session.metadata?.saved_quote_id;
  if (!metadataQuoteId || metadataQuoteId !== options.savedQuoteId) {
    throw new Error("Session metadata does not match saved quote");
  }
  if (options.session.metadata?.payment_type !== "motor_deposit") {
    throw new Error("Session is not a motor deposit");
  }
  const depositAmount = assertDepositAmountsAgree([
    normalizeDepositAmount(options.deposit.deposit_amount),
    quoteDataDepositAmount(options.deposit.quote_data),
    normalizeDepositAmount(options.savedQuote?.deposit_amount),
    normalizeDepositAmount(options.session.metadata?.deposit_amount),
    options.session.amount_total == null ? null : options.session.amount_total / 100,
  ]);
  return {
    sessionId: boundSessionId,
    depositAmount,
    paymentIntentId: paymentIntentIdFromSession(options.session),
  };
}

export type VerifiedStripeRecoveryPlan = {
  customerQuotePatch: Record<string, unknown>;
  savedQuotePatch: Record<string, unknown> | null;
  promotedCustomerQuoteFields: string[];
  promotedSavedQuoteFields: string[];
  savedQuoteDepositStatus: "paid" | "already_paid";
  stripeBillingAddress: StripeBillingAddress | null;
};

export function planVerifiedStripeRecovery(options: {
  savedQuoteId: string;
  deposit: {
    id?: string;
    saved_quote_id?: string | null;
    stripe_checkout_session_id?: string | null;
    stripe_payment_intent_id?: string | null;
    stripe_billing_address?: unknown;
    payment_status?: string | null;
    payment_paid_at?: string | null;
    lead_status?: string | null;
    quote_data?: unknown;
    lead_source?: string | null;
    deposit_amount?: number | string | null;
  };
  savedQuote: {
    id: string;
    deposit_status?: string | null;
    deposit_amount?: number | string | null;
    deposit_paid_at?: string | null;
  };
  session: {
    id: string;
    payment_status?: string | null;
    amount_total?: number | null;
    currency?: string | null;
    payment_intent?: unknown;
    customer_details?: unknown;
    metadata?: Record<string, string> | null;
  };
  paidAt: string;
}): VerifiedStripeRecoveryPlan {
  const verified = assertBoundCheckoutMatchesRecovery(options);
  const billing = stripeBillingAddressFromCheckout(options.session.customer_details);
  const existingQuoteData = isRecord(options.deposit.quote_data) ? options.deposit.quote_data : {};
  const nextQuoteData = {
    ...existingQuoteData,
    deposit_amount: String(verified.depositAmount),
    payment_type: "motor_deposit",
    stripe_session_id: verified.sessionId,
    stripe_payment_intent: verified.paymentIntentId || existingQuoteData.stripe_payment_intent || null,
    payment_status: "paid",
    saved_quote_id: options.savedQuoteId,
    ...(billing ? { payment_billing_address: billing } : {}),
  };

  const customerQuotePatch: Record<string, unknown> = {
    saved_quote_id: options.savedQuoteId,
    stripe_checkout_session_id: verified.sessionId,
    payment_status: "paid",
    quote_data: nextQuoteData,
  };
  const promotedCustomerQuoteFields = ["quote_data"];
  if (options.deposit.saved_quote_id !== options.savedQuoteId) {
    promotedCustomerQuoteFields.push("saved_quote_id");
  }
  if (options.deposit.stripe_checkout_session_id !== verified.sessionId) {
    promotedCustomerQuoteFields.push("stripe_checkout_session_id");
  }
  if (verified.paymentIntentId && options.deposit.stripe_payment_intent_id !== verified.paymentIntentId) {
    customerQuotePatch.stripe_payment_intent_id = verified.paymentIntentId;
    promotedCustomerQuoteFields.push("stripe_payment_intent_id");
  }
  if (options.deposit.payment_status !== "paid") {
    promotedCustomerQuoteFields.push("payment_status");
  }
  if (!options.deposit.payment_paid_at) {
    customerQuotePatch.payment_paid_at = options.paidAt;
    promotedCustomerQuoteFields.push("payment_paid_at");
  }
  if (options.deposit.lead_status !== "scheduled") {
    customerQuotePatch.lead_status = "scheduled";
    promotedCustomerQuoteFields.push("lead_status");
  }
  if (billing && JSON.stringify(options.deposit.stripe_billing_address) !== JSON.stringify(billing)) {
    customerQuotePatch.stripe_billing_address = billing;
    promotedCustomerQuoteFields.push("stripe_billing_address");
  }

  const savedQuoteAlreadyPaid = options.savedQuote.deposit_status === "paid";
  let savedQuotePatch: Record<string, unknown> | null = null;
  const promotedSavedQuoteFields: string[] = [];
  if (!savedQuoteAlreadyPaid) {
    if (options.savedQuote.deposit_status && options.savedQuote.deposit_status !== "pending") {
      throw new Error("Saved quote deposit has an invalid state");
    }
    savedQuotePatch = { deposit_status: "paid" };
    promotedSavedQuoteFields.push("deposit_status");
    if (options.savedQuote.deposit_amount == null) {
      savedQuotePatch.deposit_amount = verified.depositAmount;
      promotedSavedQuoteFields.push("deposit_amount");
    }
    if (!options.savedQuote.deposit_paid_at) {
      savedQuotePatch.deposit_paid_at = options.paidAt;
      promotedSavedQuoteFields.push("deposit_paid_at");
    }
  }

  return {
    customerQuotePatch,
    savedQuotePatch,
    promotedCustomerQuoteFields,
    promotedSavedQuoteFields,
    savedQuoteDepositStatus: savedQuoteAlreadyPaid ? "already_paid" : "paid",
    stripeBillingAddress: billing,
  };
}
