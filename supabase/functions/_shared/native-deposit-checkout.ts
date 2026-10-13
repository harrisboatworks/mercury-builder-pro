// Native reservation-deposit child checkout.
// Default-off. The trusted buyer review endpoint owns approval. Nothing in this
// module records approval, and completion without a durable approval fails
// closed before any Stripe call. This is not AP2 and not a Checkout session.

import {
  assertDepositPolicyReadyForCheckout,
  DEPOSIT_POLICY_SCHEMA,
  DepositPolicyUnresolvedError,
} from "./deposit-policy.ts";
import { parseSavedQuoteIdentity } from "./deposit-identity.ts";
import {
  prepareMotorReservationIntent,
  type ServerLoadedReservationMotor,
} from "./motor-reservation-intent.ts";
import { PUBLIC_SITE_URL } from "./public-motor-contract.ts";
import {
  canonicalQuoteDocumentPath,
  constantTimeEqual,
  parseResumeToken,
  parseSavedQuoteId,
  sha256Hex,
} from "./quote-document-policy.ts";
import { NativeStripeRequestError, type NativeStripePreview } from "./native-stripe-preview.ts";

export const NATIVE_DEPOSIT_CHANNEL = "native_spt";
export const NATIVE_DEPOSIT_HANDLER_ID = "ca.mercuryrepower.deposit.shared_payment_token";
export const NATIVE_DEPOSIT_TERMS_VERSION = "hbw-reservation-terms/2026-04-08";
export const NATIVE_DEPOSIT_POLICY_VERSION = DEPOSIT_POLICY_SCHEMA;
export const NATIVE_DEPOSIT_KIND = "native_deposit";
export const NATIVE_DEPOSIT_SCOPE =
  "Reservation deposit only, subject to Harris Boat Works confirmation and the existing refund terms. This is not the final motor sale, installation, fitment approval, or pickup. Stock is not reserved.";
export const NATIVE_DEPOSIT_UI_NOTE =
  "Buyer review of the exact quote and terms is required. A payment token or caller flag is not approval.";

const CHILD_ID = /^ndc_[0-9a-f]{32}$/;
const PARENT_ID = /^chk_[A-Za-z0-9._-]{1,120}$/;
const SPT_ID = /^spt_[A-Za-z0-9]+$/;
const PI_ID = /^pi_(?:test_|live_)?[A-Za-z0-9]+$/;
const CREATE_KEYS = new Set(["operation", "saved_quote_id", "meta"]);
const COMPLETE_KEYS = new Set(["payment", "meta"]);
const PAYMENT_KEYS = new Set(["instruments"]);

export function nativeDepositCheckoutEnabled(flag: string | null | undefined): boolean {
  return flag === "true";
}

export function isNativeDepositChildId(value: string): boolean {
  return CHILD_ID.test(value);
}

export function nativeDepositIdempotencyKey(intentId: string): string {
  return `native-deposit-pi:${intentId}`;
}

export function nativeDepositContinuationUrl(childId: string): string {
  return `${PUBLIC_SITE_URL}/quote/agent-deposit/${encodeURIComponent(childId)}`;
}

export type NativeActor = {
  userId: string | null;
  resumeCapability: string | null;
};

export type NativeSavedQuoteRecord = {
  id: string;
  user_id?: string | null;
  email?: string | null;
  resume_token?: string | null;
  expires_at?: string | null;
  is_soft_lead?: boolean | null;
  deposit_status?: string | null;
  deposit_amount?: number | string | null;
  quote_pdf_path?: string | null;
  quote_pdf_sha256?: string | null;
  quote_state?: unknown;
  customer_full_name?: string | null;
  customer_phone?: string | null;
  customer_address_line1?: string | null;
  customer_address_line2?: string | null;
  customer_city?: string | null;
  customer_region?: string | null;
  customer_postal_code?: string | null;
  customer_country?: string | null;
};

export type NativeIntentRecord = {
  id: string;
  child_id: string;
  parent_session_id: string;
  saved_quote_id: string;
  owner_user_id: string | null;
  motor_id: string;
  amount_cents: number;
  currency: "CAD";
  merchandise_cents: number;
  document_sha256: string;
  document_path: string;
  policy_version: string;
  policy_code: string;
  terms_version: string;
  catalog_model_number: string;
  horsepower: number;
  express_verified: boolean;
  status: string;
  receipt_reconciliation_required?: boolean;
  expires_at: string;
};

export type NativeApprovalRecord = {
  intent_id: string;
  child_id: string;
  saved_quote_id: string;
  motor_id: string;
  amount_cents: number;
  currency: string;
  document_sha256: string;
  policy_version: string;
  policy_code: string;
  terms_version: string;
  expires_at: string;
};

export type NativeAttemptRecord = {
  id: string;
  intent_id: string;
  idempotency_key: string;
  token_fingerprint: string;
  processor_params_hash: string;
  amount_cents: number;
  currency: string;
  stripe_payment_intent_id: string | null;
  observed_payment_intent_id?: string | null;
  status: string;
  seller_account_id: string;
  livemode: boolean;
  submitted_at: string | null;
};

export type NativeDepositCheckout = {
  kind: typeof NATIVE_DEPOSIT_KIND;
  id: string;
  parent_id: string;
  status: "requires_escalation" | "ready_for_complete" | "complete_in_progress" | "completed" | "canceled";
  currency: "CAD";
  payment_status: "not_started" | "requires_action" | "processing" | "failed" | "unknown" | "expired" | "revoked" | "paid";
  line_items: Array<{
    id: "li_reservation";
    item: { id: "reservation-deposit"; title: "Motor reservation deposit"; price: number };
    quantity: 1;
    totals: Array<{ type: "total"; amount: number }>;
  }>;
  totals: Array<{ type: "total"; amount: number; display_text: string }>;
  payment_handler: { id: typeof NATIVE_DEPOSIT_HANDLER_ID; version: "2026-04-08"; status: "staged" };
  messages: Array<{ type: string; code: string; severity?: string; content: string }>;
  ucp: Record<string, unknown>;
  links: Array<{ type: string; url: string }>;
  scope: string;
  terms_url: string;
  expires_at: string;
  continue_url?: string;
  trusted_buyer_ui: "required";
  order?: { id: string; permalink_url: string };
  receipt_email_status?: "provider_accepted" | "pending";
};

export type NativeDepositFailure = { ok: false; status: number; code: string; message: string };
export type NativeDepositSuccess = { ok: true; status: number; checkout: NativeDepositCheckout };
export type NativeDepositResult = NativeDepositSuccess | NativeDepositFailure;

type AttemptClaimResult = {
  result: "claimed" | "retry" | "reconcile" | "conflict" | "refused";
  reason?: string;
  attempt_id?: string;
  idempotency_key?: string;
  status?: string;
  stripe_payment_intent_id?: string | null;
  submitted_at?: string | null;
};

function failure(status: number, code: string, message: string): NativeDepositFailure {
  return { ok: false, status, code, message };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function metaIsTransportOnly(meta: unknown): boolean {
  if (!isPlainObject(meta)) return false;
  const keys = Object.keys(meta);
  if (keys.length !== 1 || keys[0] !== "ucp-agent") return false;
  const agent = meta["ucp-agent"];
  if (!isPlainObject(agent)) return false;
  const agentKeys = Object.keys(agent);
  if (agentKeys.length === 0) return true;
  if (agentKeys.length !== 1 || agentKeys[0] !== "profile") return false;
  return typeof agent.profile === "string" && agent.profile.length > 0 && agent.profile.length <= 2000;
}

function quoteMotorId(quoteState: unknown): string {
  if (!isPlainObject(quoteState) || !isPlainObject(quoteState.motor)) return "";
  return typeof quoteState.motor.id === "string" ? quoteState.motor.id.toLowerCase() : "";
}

function merchandiseCents(session: unknown): number | null {
  if (!isPlainObject(session) || !Array.isArray(session.line_items) || !isPlainObject(session.line_items[0])) {
    return null;
  }
  const item = isPlainObject(session.line_items[0].item) ? session.line_items[0].item : null;
  const price = item?.price;
  return typeof price === "number" && Number.isSafeInteger(price) && price > 0 ? price : null;
}

export function nativeDepositActorAuthorized(options: {
  savedQuoteUserId: string | null | undefined;
  savedQuoteResumeToken: string | null | undefined;
  actor: NativeActor;
}): boolean {
  if (options.actor.resumeCapability === "invalid") return false;
  const owner = Boolean(
    options.actor.userId
    && options.savedQuoteUserId
    && options.actor.userId === options.savedQuoteUserId,
  );
  let capability = false;
  try {
    const supplied = options.actor.resumeCapability ? parseResumeToken(options.actor.resumeCapability) : null;
    const stored = options.savedQuoteResumeToken ? parseResumeToken(options.savedQuoteResumeToken) : null;
    capability = Boolean(supplied && stored && constantTimeEqual(stored, supplied));
  } catch {
    capability = false;
  }
  if (options.savedQuoteUserId && options.actor.resumeCapability && options.actor.userId) return owner && capability;
  return owner || capability;
}

export function inspectNativeDepositCreateCaller(
  caller: unknown,
): { ok: true; savedQuoteId: string } | NativeDepositFailure {
  if (!isPlainObject(caller) || Object.keys(caller).some((key) => !CREATE_KEYS.has(key))) {
    return failure(400, "invalid_request", "Native deposit create accepts only the saved quote and operation.");
  }
  if ("meta" in caller && !metaIsTransportOnly(caller.meta)) {
    return failure(400, "invalid_request", "Native deposit create accepts only the saved quote and operation.");
  }
  if (caller.operation !== "motor_reservation") {
    return failure(400, "invalid_operation", "Native deposit create requires operation motor_reservation.");
  }
  try {
    return { ok: true, savedQuoteId: parseSavedQuoteId(caller.saved_quote_id) };
  } catch {
    return failure(400, "invalid_request", "Saved quote reference is invalid.");
  }
}

export function inspectNativeDepositCompleteCaller(
  caller: unknown,
): { ok: true; tokenId: string | null } | NativeDepositFailure {
  if (!isPlainObject(caller) || Object.keys(caller).some((key) => !COMPLETE_KEYS.has(key))) {
    return failure(400, "invalid_request", "Native deposit completion does not accept that field.");
  }
  if ("meta" in caller && !metaIsTransportOnly(caller.meta)) {
    return failure(400, "invalid_request", "Native deposit completion does not accept that field.");
  }
  if (!("payment" in caller)) return { ok: true, tokenId: null };
  const payment = caller.payment;
  if (!isPlainObject(payment) || Object.keys(payment).some((key) => !PAYMENT_KEYS.has(key))) {
    return failure(400, "invalid_request", "Native deposit completion accepts only a shared payment token.");
  }
  if (!Array.isArray(payment.instruments) || payment.instruments.length !== 1)
    return failure(400, "invalid_request", "Select one payment instrument.");
  const instrument = payment.instruments[0];
  if (!isPlainObject(instrument) || Object.keys(instrument).some(k => !["id", "handler_id", "type", "selected", "credential"].includes(k))
    || typeof instrument.id !== "string" || !/^[A-Za-z0-9_-]{1,120}$/.test(instrument.id)
    || instrument.handler_id !== NATIVE_DEPOSIT_HANDLER_ID || instrument.type !== "card" || instrument.selected !== true
    || !isPlainObject(instrument.credential) || Object.keys(instrument.credential).some(k => !["type", "token"].includes(k))
    || instrument.credential.type !== "shared_payment_token")
    return failure(400, "invalid_request", "Payment instrument does not match the deposit handler.");
  const tokenId = instrument.credential.token;
  if (typeof tokenId !== "string" || !SPT_ID.test(tokenId) || tokenId.length > 255)
    return failure(400, "invalid_request", "Shared payment token is invalid.");
  return { ok: true, tokenId };
}

export async function fingerprintSharedPaymentToken(tokenId: string): Promise<string> {
  return await sha256Hex(new TextEncoder().encode(`spt:${tokenId}`));
}

export function nativePaymentIntentForm(input: {
  amountCents: number;
  tokenId: string;
  intentId: string;
  savedQuoteId: string;
  motorId: string;
  childId: string;
}): Record<string, string> {
  return {
    amount: String(input.amountCents),
    currency: "cad",
    confirm: "true",
    "payment_method_types[0]": "card",
    "payment_method_data[shared_payment_granted_token]": input.tokenId,
    "metadata[payment_channel]": NATIVE_DEPOSIT_CHANNEL,
    "metadata[payment_type]": "motor_deposit",
    "metadata[native_intent_id]": input.intentId,
    "metadata[native_child_id]": input.childId,
    "metadata[saved_quote_id]": input.savedQuoteId,
    "metadata[motor_id]": input.motorId,
    "metadata[deposit_amount]": String(input.amountCents / 100),
  };
}

export async function hashNativeProcessorParams(
  params: Record<string, string>,
  fingerprint: string,
): Promise<string> {
  const redacted: Record<string, string> = { ...params, "payment_method_data[shared_payment_granted_token]": `fp:${fingerprint}` };
  const material = Object.keys(redacted).sort().map((key) => `${key}=${redacted[key]}`).join("\n");
  return await sha256Hex(new TextEncoder().encode(material));
}

// The granted-token schema is the pinned 2026-09-30.preview schema. Seller
// scope comes from the independently checked account owning the API credential,
// not agent_details (which identifies the agent, not the merchant).
export function assessSharedPaymentToken(token: unknown, expected: {
  amountCents: number; livemode: boolean;
  now: Date; approvalExpiresAt: Date;
}): { ok: true } | { ok: false; code: string } {
  if (!isPlainObject(token) || token.object !== "shared_payment.granted_token"
    || !isPlainObject(token.usage_limits)) return { ok: false, code: "token_rejected" };
  if (token.deactivated_at != null || token.deactivated_reason != null)
    return { ok: false, code: token.deactivated_reason === 'revoked' ? 'token_revoked' : token.deactivated_reason === 'expired' ? 'token_expired' : 'token_inactive' };
  if (token.livemode !== expected.livemode) return { ok: false, code: "token_mode" };
  const limits = token.usage_limits;
  if (limits.currency !== "cad") return { ok: false, code: "token_currency" };
  if (limits.max_amount !== expected.amountCents) return { ok: false, code: "token_amount" };
  if (Number.isSafeInteger(limits.expires_at) && Number(limits.expires_at) * 1000 <= expected.now.getTime()) return { ok: false, code: "token_expired" };
  if (!Number.isSafeInteger(limits.expires_at)
    || Number(limits.expires_at) * 1000 > expected.approvalExpiresAt.getTime())
    return { ok: false, code: "token_expiry" };
  if (!isPlainObject(token.usage_details) || !("amount_captured" in token.usage_details)
    || (token.usage_details.amount_captured !== null && token.usage_details.amount_captured !== 0))
    return { ok: false, code: "token_inactive" };
  return { ok: true };
}

export function assessNativePaymentIntent(value: unknown, expected: {
  amountCents: number;
  intentId: string;
  savedQuoteId: string;
  motorId: string;
  childId: string;
  livemode: boolean;
}): { ok: true; id: string; status: string } | { ok: false; code: string } {
  if (!isPlainObject(value) || typeof value.id !== "string" || !PI_ID.test(value.id)) {
    return { ok: false, code: "payment_intent_rejected" };
  }
  if (value.id.startsWith("cs_")) return { ok: false, code: "payment_intent_rejected" };
  if (String(value.currency || "").toLowerCase() !== "cad") return { ok: false, code: "payment_intent_currency" };
  if (value.amount !== expected.amountCents) return { ok: false, code: "payment_intent_amount" };
  if (value.status === "succeeded" && value.amount_received !== expected.amountCents) return { ok: false, code: "payment_intent_amount" };
  if (value.livemode !== expected.livemode) return { ok: false, code: "payment_intent_mode" };
  const metadata = isPlainObject(value.metadata) ? value.metadata : {};
  if (
    metadata.payment_channel !== NATIVE_DEPOSIT_CHANNEL
    || metadata.payment_type !== "motor_deposit"
    || metadata.native_intent_id !== expected.intentId
    || metadata.native_child_id !== expected.childId
    || metadata.saved_quote_id !== expected.savedQuoteId
    || metadata.motor_id !== expected.motorId
    || metadata.deposit_amount !== String(expected.amountCents / 100)
  ) {
    return { ok: false, code: "payment_intent_binding" };
  }
  const status = typeof value.status === "string" ? value.status : "";
  if (!["succeeded", "processing", "requires_action", "requires_payment_method", "requires_confirmation", "requires_capture", "canceled"].includes(status)) return { ok: false, code: "payment_intent_rejected" };
  return { ok: true, id: value.id, status };
}

export function stripeErrorIsUncertain(error: unknown): boolean {
  if (!(error instanceof NativeStripeRequestError)) return true;
  if (error.status == null) return true;
  return error.status === 408 || error.status === 409 || error.status >= 500;
}

function scopeMessage(code: string, severity: string, content: string) {
  return severity === "requires_buyer_review" ? { type: "error", code, severity, content } : { type: "info", code, content };
}

export function projectNativeDepositCheckout(input: {
  intent: NativeIntentRecord;
  phase: NativeDepositCheckout["status"];
  paymentStatus: NativeDepositCheckout["payment_status"];
  includeContinuation?: boolean;
}): NativeDepositCheckout {
  const amount = input.intent.amount_cents;
  const checkout: NativeDepositCheckout = {
    ucp: { version: "2026-04-08", capabilities: { "dev.ucp.shopping.checkout": [{ version: "2026-04-08" }] },
      payment_handlers: { [NATIVE_DEPOSIT_HANDLER_ID]: [{ id: NATIVE_DEPOSIT_HANDLER_ID, version: "2026-04-08",
        available_instruments: [{ type: "card" }], config: { scope: "reservation_deposit", currency: "CAD", trusted_buyer_review: true } }] } },
    links: [{ type: "terms_of_service", url: `${PUBLIC_SITE_URL}/terms` }, { type: "privacy_policy", url: `${PUBLIC_SITE_URL}/privacy` }],
    kind: NATIVE_DEPOSIT_KIND,
    id: input.intent.child_id,
    parent_id: input.intent.parent_session_id,
    status: input.phase,
    currency: "CAD",
    payment_status: input.paymentStatus,
    line_items: [{
      id: "li_reservation",
      item: { id: "reservation-deposit", title: "Motor reservation deposit", price: amount },
      quantity: 1,
      totals: [{ type: "total", amount }],
    }],
    totals: [{
      type: "total",
      amount,
      display_text: "Reservation deposit. Subject to Harris Boat Works confirmation and refund terms.",
    }],
    payment_handler: { id: NATIVE_DEPOSIT_HANDLER_ID, version: "2026-04-08", status: "staged" },
    messages: [
      scopeMessage("deposit_scope", "info", NATIVE_DEPOSIT_SCOPE),
      scopeMessage("trusted_buyer_review", "info", "The buyer must review the exact quote, deposit and terms on our site before payment."),
    ],
    scope: NATIVE_DEPOSIT_SCOPE,
    terms_url: `${PUBLIC_SITE_URL}/terms`,
    expires_at: input.intent.expires_at,
    trusted_buyer_ui: "required",
  };
  if (input.paymentStatus === "paid") {
    checkout.order = { id: input.intent.child_id, permalink_url: nativeDepositContinuationUrl(input.intent.child_id) };
    checkout.messages.push(scopeMessage(
      "deposit_paid",
      "info",
      "The reservation deposit payment was claimed. Harris Boat Works still confirms the motor, refund terms, and pickup.",
    ));
  } else if (input.phase === "requires_escalation") {
    checkout.messages.push(scopeMessage(
      input.paymentStatus === 'not_started' ? 'buyer_review_required' : 'payment_reconciliation_required',
      'requires_buyer_review',
      input.paymentStatus === 'not_started'
        ? 'Buyer review is required before this deposit can be paid.'
        : input.paymentStatus === 'requires_action'
          ? 'The buyer must finish secure wallet or bank verification on the site.'
          : 'This payment is pending reconciliation or did not complete. Contact HBW before starting another payment.',
    ));
  }
  if (input.includeContinuation || input.phase === "requires_escalation") checkout.continue_url = nativeDepositContinuationUrl(input.intent.child_id);
  return checkout;
}

function paidProjection(intent: NativeIntentRecord, httpStatus = 200, emailsAccepted?: boolean): NativeDepositSuccess {
  const checkout = projectNativeDepositCheckout({ intent, phase: 'completed', paymentStatus: 'paid' });
  if (emailsAccepted !== undefined) checkout.receipt_email_status = emailsAccepted ? 'provider_accepted' : 'pending';
  return { ok: true, status: httpStatus, checkout };
}

async function redrivePaidConfirmations(intent: NativeIntentRecord, piId: string | null, io: NativeCompleteIo): Promise<NativeDepositSuccess> {
  let accepted = false;
  if (piId) try { accepted = await io.sendConfirmations(intent.saved_quote_id, piId); } catch { /* retain durable paid; outbox remains retryable */ }
  return paidProjection(intent, 200, accepted);
}

function bindingsMatchApproval(intent: NativeIntentRecord, approval: NativeApprovalRecord, now: Date, requireUnexpired = true): boolean {
  return approval.intent_id === intent.id
    && approval.child_id === intent.child_id
    && approval.saved_quote_id === intent.saved_quote_id
    && approval.motor_id === intent.motor_id
    && approval.amount_cents === intent.amount_cents
    && approval.currency === "CAD"
    && approval.document_sha256 === intent.document_sha256
    && approval.policy_version === intent.policy_version
    && approval.policy_code === intent.policy_code
    && approval.terms_version === intent.terms_version
    && approval.terms_version === NATIVE_DEPOSIT_TERMS_VERSION
    && Number.isFinite(Date.parse(approval.expires_at))
    && Date.parse(approval.expires_at) <= Date.parse(intent.expires_at)
    && (!requireUnexpired || Date.parse(approval.expires_at) > now.getTime());
}

function savedQuoteStillMatches(intent: NativeIntentRecord, quote: NativeSavedQuoteRecord, documentHash: string): boolean {
  try { parseSavedQuoteIdentity(quote); } catch { return false; }
  if ((quote.user_id || null) !== intent.owner_user_id) return false;
  const amount = Number(quote.deposit_amount);
  return quoteMotorId(quote.quote_state) === intent.motor_id
    && documentHash === intent.document_sha256
    && quote.quote_pdf_path === intent.document_path
    && amount * 100 === intent.amount_cents
    && quote.is_soft_lead !== true
    && quote.deposit_status === "pending";
}

export function assertNativeDepositMailerBinding(options: {
  nativePaymentIntentId: string;
  savedQuoteId: string;
  deposit: {
    saved_quote_id?: string | null;
    stripe_checkout_session_id?: string | null;
    stripe_payment_intent_id?: string | null;
    payment_status?: string | null;
    quote_data?: unknown;
    lead_source?: string | null;
  };
}): void {
  if (!PI_ID.test(options.nativePaymentIntentId)) throw new Error("Invalid native payment intent");
  const quoteData = isPlainObject(options.deposit.quote_data) ? options.deposit.quote_data : null;
  const jsonSaved = typeof quoteData?.saved_quote_id === "string" ? quoteData.saved_quote_id : "";
  const session = typeof quoteData?.stripe_session_id === "string" ? quoteData.stripe_session_id : "";
  if (
    options.deposit.lead_source !== "deposit"
    || options.deposit.stripe_checkout_session_id
    || options.deposit.payment_status !== "paid"
    || options.deposit.stripe_payment_intent_id !== options.nativePaymentIntentId
    || options.deposit.saved_quote_id !== options.savedQuoteId
    || !quoteData
    || quoteData.payment_channel !== NATIVE_DEPOSIT_CHANNEL
    || quoteData.payment_type !== "motor_deposit"
    || quoteData.payment_status !== "paid"
    || quoteData.stripe_payment_intent !== options.nativePaymentIntentId
    || session
    || jsonSaved !== options.savedQuoteId
  ) {
    throw new Error("Paid deposit record not found");
  }
}

export type NativeCreateIo = {
  loadParent: (id: string) => Promise<unknown | null>;
  loadMotor: (id: string) => Promise<ServerLoadedReservationMotor | null>;
  loadSavedQuote: (id: string) => Promise<NativeSavedQuoteRecord | null>;
  loadDocumentHash: (quote: NativeSavedQuoteRecord) => Promise<string | null>;
  loadIntentBySavedQuote: (savedQuoteId: string) => Promise<NativeIntentRecord | null>;
  hostedRailActive: (savedQuoteId: string) => Promise<boolean>;
  insertIntent: (row: NativeIntentRecord) => Promise<NativeIntentRecord | null>;
};

export async function runNativeDepositCreate(input: {
  caller: unknown;
  routeParentId: string;
  actor: NativeActor;
  now: Date;
  childId: string;
  intentId: string;
  io: NativeCreateIo;
}): Promise<NativeDepositResult> {
  const caller = inspectNativeDepositCreateCaller(input.caller);
  if (caller.ok === false) return caller;
  if (!PARENT_ID.test(input.routeParentId) || !CHILD_ID.test(input.childId)) {
    return failure(400, "invalid_request", "Checkout reference is invalid.");
  }
  const parent = await input.io.loadParent(input.routeParentId);
  if (!parent) return failure(404, "not_found", "No checkout session.");
  const sessionMotorId = isPlainObject(parent)
    && Array.isArray(parent.line_items)
    && isPlainObject(parent.line_items[0])
    && isPlainObject(parent.line_items[0].item)
    && typeof parent.line_items[0].item.id === "string"
    ? parent.line_items[0].item.id
    : "";
  const motor = sessionMotorId ? await input.io.loadMotor(sessionMotorId) : null;
  const priced = prepareMotorReservationIntent({
    persistedSession: parent,
    serverLoadedMotor: motor,
    caller: { id: input.routeParentId, operation: "motor_reservation" },
    now: input.now,
  });
  if (priced.ok === false) return failure(priced.status, priced.code, priced.message);
  const quote = await input.io.loadSavedQuote(caller.savedQuoteId);
  if (!quote || quote.id !== caller.savedQuoteId) return failure(404, "not_found", "Saved quote is not available.");
  if (!nativeDepositActorAuthorized({
    savedQuoteUserId: quote.user_id,
    savedQuoteResumeToken: quote.resume_token,
    actor: input.actor,
  })) {
    return failure(401, "unauthorized", "Saved quote authorization is required.");
  }
  if (quote.is_soft_lead === true || quote.deposit_status !== "pending") return failure(409, "quote_unavailable", "A pending saved quote is required.");
  try {
    parseSavedQuoteIdentity(quote);
  } catch {
    return failure(409, "identity_incomplete", "Saved quote identity is incomplete.");
  }
  if (Date.parse(quote.expires_at || "") <= input.now.getTime() || !Number.isFinite(Date.parse(quote.expires_at || "")))
    return failure(409, "quote_expired", "Saved quote expired. Review a fresh quote.");
  if (quoteMotorId(quote.quote_state) !== priced.preparation.motor_id) {
    return failure(409, "stale_motor", "Saved quote motor does not match the checkout.");
  }
  if (Number(quote.deposit_amount) * 100 !== priced.preparation.amount_cents) {
    return failure(409, "stale_price", "Saved quote deposit does not match the catalog deposit.");
  }
  let policy;
  try {
    policy = assertDepositPolicyReadyForCheckout({
      savedMotorId: priced.preparation.motor_id,
      motorRow: motor,
      quoteState: quote.quote_state,
    });
  } catch (error) {
    if (error instanceof DepositPolicyUnresolvedError) {
      return failure(409, "stale_policy", "Deposit policy does not match the saved quote.");
    }
    throw error;
  }
  const documentHash = await input.io.loadDocumentHash(quote);
  const documentPath = canonicalQuoteDocumentPath(quote.id);
  if (!documentHash || quote.quote_pdf_path !== documentPath || quote.quote_pdf_sha256 !== documentHash) {
    return failure(409, "stale_document", "Canonical quote document does not match.");
  }
  if (await input.io.hostedRailActive(quote.id)) {
    return failure(409, "hosted_rail", "This saved quote already uses hosted Checkout.");
  }
  const merchandise = merchandiseCents(parent);
  if (merchandise == null) {
    return failure(409, "stale_price", "Checkout merchandise total is stale.");
  }
  if (!(priced.preparation.amount_cents < merchandise)) {
    return failure(400, "deposit_exceeds_merchandise", "Reservation deposit must be less than the motor merchandise total.");
  }
  const intent: NativeIntentRecord = {
    id: input.intentId,
    child_id: input.childId,
    parent_session_id: input.routeParentId,
    saved_quote_id: quote.id,
    owner_user_id: quote.user_id || null,
    motor_id: priced.preparation.motor_id,
    amount_cents: priced.preparation.amount_cents,
    currency: "CAD",
    merchandise_cents: merchandise,
    document_sha256: documentHash,
    document_path: documentPath,
    policy_version: NATIVE_DEPOSIT_POLICY_VERSION,
    policy_code: policy.policyCode,
    terms_version: NATIVE_DEPOSIT_TERMS_VERSION,
    catalog_model_number: (motor?.mercury_model_no || motor?.model_number || "").toString(),
    horsepower: Number(motor?.horsepower),
    express_verified: priced.preparation.amount_cents === 10000,
    status: "requires_escalation",
    expires_at: isPlainObject(parent) && typeof parent.expires_at === "string" ? parent.expires_at : "",
  };
  if (!intent.catalog_model_number || !Number.isFinite(intent.horsepower) || !intent.expires_at) {
    return failure(409, "stale_motor", "Catalog motor identity is incomplete.");
  }
  const existing = await input.io.loadIntentBySavedQuote(quote.id);
  if (existing) {
    const same = existing.parent_session_id === intent.parent_session_id
      && existing.motor_id === intent.motor_id
      && existing.amount_cents === intent.amount_cents
      && existing.document_sha256 === intent.document_sha256
      && existing.terms_version === intent.terms_version
      && existing.policy_code === intent.policy_code
      && existing.merchandise_cents === intent.merchandise_cents;
    if (!same) return failure(409, "stale_binding", "The saved native deposit no longer matches this quote.");
    if (existing.status === "paid") return paidProjection(existing);
    return {
      ok: true,
      status: 200,
      checkout: projectNativeDepositCheckout({
        intent: existing,
        phase: existing.status === "approved" ? "ready_for_complete" : "requires_escalation",
        paymentStatus: "not_started",
      }),
    };
  }
  const inserted = await input.io.insertIntent(intent);
  if (!inserted) return failure(503, "unavailable", "Native deposit could not be saved.");
  return {
    ok: true,
    status: 201,
    checkout: projectNativeDepositCheckout({ intent: inserted, phase: "requires_escalation", paymentStatus: "not_started" }),
  };
}

export type NativeCompleteIo = {
  loadIntentByChild: (childId: string) => Promise<NativeIntentRecord | null>;
  loadSavedQuote: (id: string) => Promise<NativeSavedQuoteRecord | null>;
  validateFreshIntent: (intent: NativeIntentRecord, quote: NativeSavedQuoteRecord) => Promise<boolean>;
  loadApproval: (intentId: string) => Promise<NativeApprovalRecord | null>;
  loadAttempt: (intentId: string) => Promise<NativeAttemptRecord | null>;
  hostedRailActive: (savedQuoteId: string) => Promise<boolean>;
  loadDocumentHash: (quote: NativeSavedQuoteRecord) => Promise<string | null>;
  claimAttempt: (args: {
    intentId: string;
    tokenFingerprint: string;
    processorParamsHash: string;
    amountCents: number;
    sellerAccountId: string;
    livemode: boolean;
  }) => Promise<AttemptClaimResult>;
  markReceiptReconciliation: (intentId: string, attemptId: string) => Promise<void>;
  observePaymentIntent: (attemptId: string, paymentIntentId: string) => Promise<boolean>;
  bindAttempt: (attemptId: string, paymentIntentId: string | null, status: string) => Promise<boolean>;
  sendConfirmations: (savedQuoteId: string, paymentIntentId: string) => Promise<boolean>;
  claimPaid: (args: {
    intent: NativeIntentRecord;
    attemptId: string;
    paymentIntentId: string;
    notificationEventId: string;
    paidAt: string;
  }) => Promise<boolean>;
};

function outcomeFromStatus(status: string): { phase: NativeDepositCheckout["status"]; paymentStatus: NativeDepositCheckout["payment_status"]; continuation: boolean } {
  if (status === "requires_action") return { phase: "requires_escalation", paymentStatus: "requires_action", continuation: true };
  if (status === "processing") return { phase: "requires_escalation", paymentStatus: "processing", continuation: false };
  if (status === "canceled" || status === "requires_payment_method") {
    return { phase: "requires_escalation", paymentStatus: "failed", continuation: false };
  }
  return { phase: "requires_escalation", paymentStatus: "unknown", continuation: false };
}

export async function runNativeDepositComplete(input: {
  caller: unknown;
  childId: string;
  actor: NativeActor;
  now: Date;
  sellerAccountId: string | null;
  livemode: boolean | null;
  openStripe: () => NativeStripePreview | null;
  io: NativeCompleteIo;
}): Promise<NativeDepositResult> {
  const caller = inspectNativeDepositCompleteCaller(input.caller);
  if (caller.ok === false) return caller;
  if (!isNativeDepositChildId(input.childId)) return failure(404, "not_found", "No checkout session.");
  const intent = await input.io.loadIntentByChild(input.childId);
  if (!intent) return failure(404, "not_found", "No checkout session.");
  const quote = await input.io.loadSavedQuote(intent.saved_quote_id);
  if (!quote || !nativeDepositActorAuthorized({
    savedQuoteUserId: quote.user_id,
    savedQuoteResumeToken: quote.resume_token,
    actor: input.actor,
  })) {
    return failure(401, "unauthorized", "Saved quote authorization is required.");
  }
  if (intent.status === "paid" || quote.deposit_status === "paid") {
    if (intent.status !== "paid") return failure(409, "hosted_rail", "This saved quote is already paid.");
    const paidAttempt = await input.io.loadAttempt(intent.id);
    return await redrivePaidConfirmations(intent, paidAttempt?.stripe_payment_intent_id || null, input.io);
  }
  const existingAttempt = await input.io.loadAttempt(intent.id);
  const approval = await input.io.loadApproval(intent.id);
  if (!approval || !bindingsMatchApproval(intent, approval, input.now, !existingAttempt?.submitted_at)) {
    return failure(409, "buyer_review_required", "Buyer review is required before payment.");
  }
  const documentHash = await input.io.loadDocumentHash(quote);
  if (!documentHash || !savedQuoteStillMatches(intent, quote, documentHash)) {
    return failure(409, "stale_binding", "The approved deposit no longer matches the saved quote.");
  }
  if (await input.io.hostedRailActive(quote.id)) {
    return failure(409, "hosted_rail", "This saved quote already uses hosted Checkout.");
  }
  if (!existingAttempt?.submitted_at && !await input.io.validateFreshIntent(intent, quote))
    return failure(409, "stale_binding", "The reviewed motor, price or terms changed. Review a fresh quote.");
  if (!caller.tokenId && !existingAttempt) {
    return failure(400, "token_required", "A shared payment token is required.");
  }
  if (!caller.tokenId && existingAttempt && !existingAttempt.stripe_payment_intent_id) {
    return {
      ok: true,
      status: 200,
      checkout: projectNativeDepositCheckout({ intent, phase: "requires_escalation", paymentStatus: "unknown" }),
    };
  }

  const stripe = input.openStripe();
  if (!stripe || input.sellerAccountId !== stripe.sellerAccountId || input.livemode !== stripe.livemode)
    return failure(503, 'native_configuration_mismatch', 'Native payment configuration requires reconciliation.');
  if (existingAttempt && (existingAttempt.seller_account_id !== stripe.sellerAccountId || existingAttempt.livemode !== stripe.livemode))
    return failure(503, 'native_configuration_mismatch', 'Native payment configuration requires reconciliation.');

  let attempt = existingAttempt;
  let tokenId = caller.tokenId;
  if (tokenId) {
    if (input.sellerAccountId == null || input.livemode == null) {
      return failure(503, "unavailable", "Native payment is not configured.");
    }
    const fingerprint = await fingerprintSharedPaymentToken(tokenId);
    const params = nativePaymentIntentForm({
      amountCents: intent.amount_cents,
      tokenId,
      intentId: intent.id,
      savedQuoteId: intent.saved_quote_id,
      motorId: intent.motor_id,
      childId: intent.child_id,
    });
    const processorParamsHash = await hashNativeProcessorParams(params, fingerprint);
    const claimed = await input.io.claimAttempt({
      intentId: intent.id,
      tokenFingerprint: fingerprint,
      processorParamsHash,
      amountCents: intent.amount_cents,
      sellerAccountId: input.sellerAccountId,
      livemode: input.livemode,
    });
    if (claimed.result === "conflict" || claimed.result === "refused" || !claimed.attempt_id) {
      return failure(409, claimed.reason || "attempt_conflict", "This deposit already has a payment attempt.");
    }
    const stored = await input.io.loadAttempt(intent.id);
    if (!stored || stored.id !== claimed.attempt_id || stored.token_fingerprint !== fingerprint
      || stored.processor_params_hash !== processorParamsHash || stored.idempotency_key !== nativeDepositIdempotencyKey(intent.id)
      || stored.amount_cents !== intent.amount_cents || stored.currency !== 'CAD'
      || stored.seller_account_id !== stripe.sellerAccountId || stored.livemode !== stripe.livemode)
      return failure(409, 'attempt_conflict', 'The deposit attempt does not match this payment.');
    attempt = stored;
  }
  if (!attempt) return failure(409, "attempt_conflict", "This deposit already has a payment attempt.");

  const finishFromIntent = async (pi: unknown, allowCreate: boolean): Promise<NativeDepositResult> => {
    const assessed = assessNativePaymentIntent(pi, {
      amountCents: intent.amount_cents,
      intentId: intent.id,
      savedQuoteId: intent.saved_quote_id,
      motorId: intent.motor_id,
      childId: intent.child_id,
      livemode: stripe.livemode,
    });
    if (assessed.ok === false) {
      if (isPlainObject(pi) && typeof pi.id === 'string' && PI_ID.test(pi.id))
        await input.io.observePaymentIntent(attempt.id, pi.id);
      await input.io.bindAttempt(attempt.id, null, "unknown");
      return {
        ok: true,
        status: 200,
        checkout: projectNativeDepositCheckout({ intent, phase: "requires_escalation", paymentStatus: "unknown" }),
      };
    }
    const bound = await input.io.bindAttempt(attempt.id, assessed.id,
      assessed.status === "succeeded" ? "succeeded" : outcomeFromStatus(assessed.status).paymentStatus === "failed" ? "failed" : outcomeFromStatus(assessed.status).paymentStatus);
    if (!bound) return failure(503, "reconciliation_required", "Payment reconciliation is pending.");
    if (assessed.status === "succeeded") {
      let paid = false;
      try { paid = await input.io.claimPaid({
        intent,
        attemptId: attempt.id,
        paymentIntentId: assessed.id,
        notificationEventId: `native_complete:${attempt.id}`,
        paidAt: input.now.toISOString(),
      }); } catch { /* hold verified processor funds until paired receipt is reconciled */ }
      if (!paid) {
        await input.io.markReceiptReconciliation(intent.id, attempt.id);
        await input.io.bindAttempt(attempt.id, assessed.id, "unknown");
        return {
          ok: true,
          status: 200,
          checkout: projectNativeDepositCheckout({ intent, phase: "requires_escalation", paymentStatus: "unknown" }),
        };
      }
      return await redrivePaidConfirmations({ ...intent, status: "paid" }, assessed.id, input.io);
    }
    const mapped = outcomeFromStatus(assessed.status);
    await input.io.bindAttempt(attempt.id, assessed.id, mapped.paymentStatus === "requires_action"
      ? "requires_action"
      : mapped.paymentStatus === "processing"
        ? "processing"
        : mapped.paymentStatus === "failed"
          ? "failed"
          : "unknown");
    if (!allowCreate || assessed.status !== "requires_confirmation") {
      return {
        ok: true,
        status: 200,
        checkout: projectNativeDepositCheckout({
          intent,
          phase: mapped.phase,
          paymentStatus: mapped.paymentStatus,
          includeContinuation: mapped.continuation,
        }),
      };
    }
    return {
      ok: true,
      status: 200,
      checkout: projectNativeDepositCheckout({ intent, phase: "requires_escalation", paymentStatus: "unknown" }),
    };
  };

  if (attempt.stripe_payment_intent_id) {
    try {
      const pi = await stripe.retrievePaymentIntent(attempt.stripe_payment_intent_id);
      return await finishFromIntent(pi, false);
    } catch (error) {
      if (!stripeErrorIsUncertain(error)) {
        await input.io.bindAttempt(attempt.id, attempt.stripe_payment_intent_id, "failed");
        return {
          ok: true,
          status: 200,
          checkout: projectNativeDepositCheckout({ intent, phase: "requires_escalation", paymentStatus: "failed" }),
        };
      }
      await input.io.bindAttempt(attempt.id, attempt.stripe_payment_intent_id, "unknown");
      return {
        ok: true,
        status: 200,
        checkout: projectNativeDepositCheckout({ intent, phase: "requires_escalation", paymentStatus: "unknown" }),
      };
    }
  }

  if (!tokenId) {
    return {
      ok: true,
      status: 200,
      checkout: projectNativeDepositCheckout({ intent, phase: "requires_escalation", paymentStatus: "unknown" }),
    };
  }
  try {
    if (attempt.submitted_at && input.now.getTime() - Date.parse(attempt.submitted_at) >= 23 * 3600_000)
      return failure(409, "reconciliation_required", "Payment reconciliation is required before another request.");
    if (!attempt.submitted_at) {
    const token = await stripe.retrieveSharedPaymentToken(tokenId);
    const tokenDecision = assessSharedPaymentToken(token, {
      amountCents: intent.amount_cents,
      livemode: stripe.livemode,
      now: input.now,
      approvalExpiresAt: new Date(approval.expires_at),
    });
    if (tokenDecision.ok === false) {
      const revoked = tokenDecision.code === "token_revoked" || tokenDecision.code === "token_expired";
      await input.io.bindAttempt(attempt.id, null, "failed");
      return {
        ok: true,
        status: 200,
        checkout: projectNativeDepositCheckout({
          intent,
          phase: "requires_escalation",
          paymentStatus: revoked ? (tokenDecision.code === "token_revoked" ? "revoked" : "expired") : "failed",
        }),
      };
    }
    }
    const params = nativePaymentIntentForm({
      amountCents: intent.amount_cents,
      tokenId,
      intentId: intent.id,
      savedQuoteId: intent.saved_quote_id,
      motorId: intent.motor_id,
      childId: intent.child_id,
    });
    // Durable marker before external submission. Retries keep the same params,
    // token fingerprint and key, even if Stripe consumed the token already.
    if (!await input.io.bindAttempt(attempt.id, null, "submitted"))
      return failure(503, "reconciliation_required", "Payment reconciliation is pending.");
    const created = await stripe.createConfirmedPaymentIntent(params, attempt.idempotency_key);
    return await finishFromIntent(created, false);
  } catch (error) {
    if (error instanceof NativeStripeRequestError && error.paymentIntent)
      return await finishFromIntent(error.paymentIntent, false);
    await input.io.bindAttempt(attempt.id, null, stripeErrorIsUncertain(error) ? "unknown" : "failed");
    return {
      ok: true,
      status: 200,
      checkout: projectNativeDepositCheckout({
        intent,
        phase: "requires_escalation",
        paymentStatus: stripeErrorIsUncertain(error) ? "unknown" : "failed",
      }),
    };
  }
}

export async function runNativeDepositRead(input: {
  childId: string;
  actor: NativeActor;
  io: { loadIntentByChild: NativeCompleteIo["loadIntentByChild"]; loadSavedQuote: NativeCompleteIo["loadSavedQuote"]; loadApproval: NativeCompleteIo["loadApproval"] };
}): Promise<NativeDepositResult> {
  if (!isNativeDepositChildId(input.childId)) return failure(404, "not_found", "No checkout session.");
  const intent = await input.io.loadIntentByChild(input.childId);
  if (!intent) return failure(404, "not_found", "No checkout session.");
  const quote = await input.io.loadSavedQuote(intent.saved_quote_id);
  if (!quote || !nativeDepositActorAuthorized({
    savedQuoteUserId: quote.user_id,
    savedQuoteResumeToken: quote.resume_token,
    actor: input.actor,
  })) {
    return failure(401, "unauthorized", "Saved quote authorization is required.");
  }
  if (intent.status === "paid") return paidProjection(intent);
  const approval = await input.io.loadApproval(intent.id);
  const approved = intent.status === "approved" && Boolean(approval && bindingsMatchApproval(intent, approval, new Date()));
  const paymentStatus = intent.status === "requires_action"
    ? "requires_action"
    : intent.status === "processing"
      ? "processing"
      : intent.status === "failed"
        ? "failed"
        : intent.status === "unknown"
          ? "unknown"
          : intent.status === "expired"
            ? "expired"
            : intent.status === "revoked"
              ? "revoked"
              : "not_started";
  return {
    ok: true,
    status: 200,
    checkout: projectNativeDepositCheckout({
      intent,
      phase: intent.status === "requires_action"
        ? "requires_escalation"
        : approved
          ? "ready_for_complete"
          : "requires_escalation",
      paymentStatus,
      includeContinuation: intent.status === "requires_action",
    }),
  };
}

