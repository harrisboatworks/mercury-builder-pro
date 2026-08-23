/** Test-only acceptance world. Not imported by production app code. */
import {
  adminDealPacketPath,
  canRetryDepositDeliveries,
  dealPacketSavedQuoteId,
  dedupeAdminDealPacketRows,
  isAuthoritativeDepositPaid,
  operationalCustomerQuoteId,
  shouldOfferCanonicalDocumentDownload,
} from "@/lib/admin-deal-packet";
import {
  customerQuoteMutationRejected,
  type DepositAuthorityCaller,
} from "@/lib/deposit-authority-plan";
import { planHistoricalDepositBackfill } from "@/lib/deposit-historical-backfill";
import {
  classifyExistingDepositCheckoutSession,
  classifyNotificationOutcomeWrite,
  classifyOptimisticRecoveryWrite,
  depositNotificationOutcomeGuard,
  planVerifiedStripeRecovery,
  resolveDepositWebhookSmsGate,
  shouldSendFirstClaimSms,
  stripeDerivedPaidAt,
} from "../../../../supabase/functions/_shared/deposit-deal-record.ts";
import {
  DEPOSIT_EMAIL_AUDIENCES,
  DEPOSIT_EMAIL_CLAIM_LEASE_SECONDS,
  DEPOSIT_OUTBOX_SCHEMA_VERSION,
  HBW_OPERATIONS_EMAIL,
  claimDeliveryRow,
  completeClaimedDelivery,
  deriveDepositMailAttachmentKey,
  hbwDepositRecipients,
  hasDepositOutboxSchema,
  planDepositWebhookMailer,
  reportableDeliveryStatus,
  resendIdempotencyKey,
  seedDepositEmailDeliveryRows,
  simulateConcurrentClaims,
  type DepositEmailAudience,
  type DepositEmailDeliveryRow,
} from "../../../../supabase/functions/_shared/deposit-email-deliveries.ts";
import { GROK_BOT_AGENTMAIL } from "../../../../supabase/functions/_shared/grok-email-routing.ts";
import {
  assertCanonicalPaidQuoteDocument,
  canonicalQuoteDocumentPath,
  sha256Hex,
} from "../../../../supabase/functions/_shared/quote-document-policy.ts";

export const ACCEPTANCE_QUOTE_ID = "11111111-1111-4111-8111-111111111111";
export const ACCEPTANCE_DEAL_ID = "22222222-2222-4222-8222-222222222222";
export const ACCEPTANCE_CUSTOMER_EMAIL = "ada@example.com";
export const ACCEPTANCE_SESSION_OPEN = "cs_test_acceptopen001";
export const ACCEPTANCE_SESSION_COMPLETE = "cs_test_acceptpaid001";
export const ACCEPTANCE_SESSION_EXPIRED = "cs_test_acceptexp001";
export const ACCEPTANCE_EVENT_ID = "evt_test_accept001";

export type AcceptanceRole = DepositAuthorityCaller;

export type AcceptanceDeliveryRow = DepositEmailDeliveryRow & {
  customer_quote_id: string;
  saved_quote_id: string;
};

export type AcceptanceResendSend = {
  audience: DepositEmailAudience;
  to: string[];
  idempotencyKey: string;
  attachmentPath: string;
  attachmentSha256: string;
};

export type AcceptanceSmsSend = {
  to: "admin" | "customer";
  messageType: string;
};

export type AcceptanceWorld = {
  now: Date;
  customerQuotes: Map<string, Record<string, unknown>>;
  savedQuotes: Map<string, Record<string, unknown>>;
  deliveries: Map<string, AcceptanceDeliveryRow>;
  pdfs: Map<string, { bytes: Uint8Array; sha256: string }>;
  stripeSessions: Map<string, { status: string; url?: string | null; amount_total: number; currency: string; payment_intent: unknown; created: number }>;
  resendSends: AcceptanceResendSend[];
  smsSends: AcceptanceSmsSend[];
};

function deliveryKey(customerQuoteId: string, audience: string): string {
  return `${customerQuoteId}:${audience}`;
}

export function createAcceptanceWorld(now = new Date("2026-08-23T17:00:00.000Z")): AcceptanceWorld {
  return {
    now,
    customerQuotes: new Map(),
    savedQuotes: new Map(),
    deliveries: new Map(),
    pdfs: new Map(),
    stripeSessions: new Map(),
    resendSends: [],
    smsSends: [],
  };
}

export function deliveryTableAllows(role: AcceptanceRole, op: "SELECT" | "INSERT" | "UPDATE" | "DELETE", isAdmin = role === "admin"): boolean {
  if (role === "anon" || op === "DELETE") return false;
  if (role === "service_role") return true;
  if ((role === "authenticated" || role === "admin") && op === "SELECT") return isAdmin;
  return false;
}

export function claimRpcAllows(role: AcceptanceRole): boolean {
  return role === "service_role";
}

export function triggerHelperExecuteAllows(fn: "deposit_authority_caller" | "deposit_quote_data_authority_changed" | "enforce_customer_quotes_deposit_authority" | "enforce_customer_quotes_deposit_delete"): boolean {
  return fn === "deposit_authority_caller" || fn === "deposit_quote_data_authority_changed";
}

export function mutateCustomerQuote(
  role: AcceptanceRole,
  op: "INSERT" | "UPDATE" | "DELETE",
  oldRow?: Record<string, unknown> | null,
  newRow?: Record<string, unknown> | null,
): { ok: boolean } {
  return {
    ok: !customerQuoteMutationRejected({
      op,
      caller: role,
      oldRow: oldRow || undefined,
      newRow: newRow || undefined,
    }),
  };
}

export function claimOutbox(
  world: AcceptanceWorld,
  role: AcceptanceRole,
  customerQuoteId: string,
  audience: DepositEmailAudience,
  claimToken: string,
): AcceptanceDeliveryRow | null {
  if (!claimRpcAllows(role)) return null;
  const row = world.deliveries.get(deliveryKey(customerQuoteId, audience));
  if (!row) return null;
  const claimed = claimDeliveryRow(row, claimToken, world.now, DEPOSIT_EMAIL_CLAIM_LEASE_SECONDS);
  if (!claimed) return null;
  const next = { ...row, ...claimed };
  world.deliveries.set(deliveryKey(customerQuoteId, audience), next);
  return next;
}

export function completeOutbox(
  world: AcceptanceWorld,
  role: AcceptanceRole,
  customerQuoteId: string,
  audience: DepositEmailAudience,
  claimToken: string,
  providerId: string,
): AcceptanceDeliveryRow | null {
  if (!claimRpcAllows(role)) return null;
  const row = world.deliveries.get(deliveryKey(customerQuoteId, audience));
  if (!row || completeClaimedDelivery(row, claimToken) !== "sent") return null;
  const next = {
    ...row,
    status: "sent" as const,
    provider_id: providerId,
    sent_at: world.now.toISOString(),
    claim_token: null,
    claim_expires_at: null,
    last_error: null,
  };
  world.deliveries.set(deliveryKey(customerQuoteId, audience), next);
  return next;
}

export async function bindSyntheticPdf(world: AcceptanceWorld, savedQuoteId: string, label = "accept-bound"): Promise<{ path: string; sha256: string; bytes: Uint8Array }> {
  const bytes = new TextEncoder().encode(`%PDF-1.7\n${label}`);
  const sha256 = await sha256Hex(bytes);
  const path = canonicalQuoteDocumentPath(savedQuoteId);
  world.pdfs.set(path, { bytes, sha256 });
  return { path, sha256, bytes };
}

export function seedOutbox(world: AcceptanceWorld, customerQuoteId: string, savedQuoteId: string): void {
  for (const seed of seedDepositEmailDeliveryRows({ customerQuoteId, savedQuoteId })) {
    world.deliveries.set(deliveryKey(customerQuoteId, seed.audience), {
      ...seed,
      customer_quote_id: customerQuoteId,
      saved_quote_id: savedQuoteId,
    });
  }
}

export function classifyCreatePaymentExistingSession(status: "open" | "complete" | "expired", url?: string | null) {
  return classifyExistingDepositCheckoutSession({ status, url });
}

export function planWebhookAfterPartialFailure(options: {
  alreadyPaid: boolean;
  hasMarker: boolean;
  legacyLeaseActive: boolean;
  rows: Array<{ audience: string; status: string }>;
}) {
  return planDepositWebhookMailer({
    alreadyPaid: options.alreadyPaid,
    hasOutboxSchema: options.hasMarker,
    legacyLeaseActive: options.legacyLeaseActive,
    deliveryRows: options.rows,
  });
}

export async function runFreshPaidDepositPacket(world: AcceptanceWorld = createAcceptanceWorld()) {
  const savedQuoteId = ACCEPTANCE_QUOTE_ID;
  const customerQuoteId = ACCEPTANCE_DEAL_ID;
  const pdf = await bindSyntheticPdf(world, savedQuoteId);
  world.savedQuotes.set(savedQuoteId, {
    id: savedQuoteId,
    deposit_status: "pending",
    deposit_amount: 500,
    quote_pdf_path: pdf.path,
    quote_pdf_sha256: pdf.sha256,
    email: ACCEPTANCE_CUSTOMER_EMAIL,
  });
  world.customerQuotes.set(customerQuoteId, {
    id: customerQuoteId,
    lead_source: "deposit",
    saved_quote_id: savedQuoteId,
    payment_status: "pending",
    stripe_checkout_session_id: ACCEPTANCE_SESSION_OPEN,
    quote_data: { payment_status: "pending", saved_quote_id: savedQuoteId },
  });

  const openDisposition = classifyCreatePaymentExistingSession("open", "https://checkout.stripe.com/c/pay/cs_test_acceptopen001");
  const completeDisposition = classifyCreatePaymentExistingSession("complete", "https://checkout.stripe.com/c/pay/cs_test_acceptpaid001");
  const expiredDisposition = classifyCreatePaymentExistingSession("expired");

  world.customerQuotes.set(customerQuoteId, {
    ...world.customerQuotes.get(customerQuoteId)!,
    payment_status: "paid",
    stripe_checkout_session_id: ACCEPTANCE_SESSION_COMPLETE,
    quote_data: {
      payment_status: "paid",
      saved_quote_id: savedQuoteId,
      deposit_outbox_schema: DEPOSIT_OUTBOX_SCHEMA_VERSION,
      notification_status: "processing",
      notification_event_id: ACCEPTANCE_EVENT_ID,
    },
  });
  const quoteData = world.customerQuotes.get(customerQuoteId)!.quote_data as Record<string, unknown>;
  const mailerPlan = planWebhookAfterPartialFailure({
    alreadyPaid: true,
    hasMarker: hasDepositOutboxSchema(quoteData),
    legacyLeaseActive: true,
    rows: [],
  });
  if (mailerPlan.seed) seedOutbox(world, customerQuoteId, savedQuoteId);

  const attachmentPath = deriveDepositMailAttachmentKey(savedQuoteId);
  await assertCanonicalPaidQuoteDocument({
    row: {
      id: savedQuoteId,
      expires_at: "2099-01-01T00:00:00.000Z",
      is_soft_lead: false,
      deposit_status: "paid",
      quote_pdf_path: pdf.path,
      quote_pdf_sha256: pdf.sha256,
      quote_state: { motor: { id: "motor-1" } },
    },
    savedQuoteId,
    object: { bytes: pdf.bytes, contentType: "application/pdf" },
  });

  const recipients = {
    customer: [ACCEPTANCE_CUSTOMER_EMAIL],
    hbw: hbwDepositRecipients(["jayharris97@gmail.com"]),
    grok_bot: [GROK_BOT_AGENTMAIL],
  } as const;

  for (const audience of DEPOSIT_EMAIL_AUDIENCES) {
    const token = `claim-${audience}`;
    const claimed = claimOutbox(world, "service_role", customerQuoteId, audience, token);
    if (!claimed) continue;
    const send: AcceptanceResendSend = {
      audience,
      to: [...recipients[audience]],
      idempotencyKey: resendIdempotencyKey(customerQuoteId, audience),
      attachmentPath,
      attachmentSha256: pdf.sha256,
    };
    world.resendSends.push(send);
    const completed = completeOutbox(world, "service_role", customerQuoteId, audience, token, `re_${audience}`);
    reportableDeliveryStatus({ completed });
  }

  const lostClaimSms = shouldSendFirstClaimSms(resolveDepositWebhookSmsGate({
    alreadyPaid: false,
    boundQuoteData: { payment_status: "pending" },
    claimWon: false,
    concurrent: {
      payment_status: "paid",
      quote_data: { sms_notification_status: "sent" },
    },
  }));
  if (!lostClaimSms) {
    // first-claim SMS only; concurrent loser must not append
  } else {
    world.smsSends.push({ to: "customer", messageType: "quote_confirmation" });
  }

  const notificationGuard = depositNotificationOutcomeGuard(ACCEPTANCE_EVENT_ID);
  const notificationWrite = classifyNotificationOutcomeWrite({
    written: quoteData.notification_event_id === notificationGuard.notification_event_id
      && quoteData.notification_status === "processing"
      ? { id: customerQuoteId }
      : null,
  });

  const adminRows = dedupeAdminDealPacketRows(
    [{
      id: customerQuoteId,
      saved_quote_id: savedQuoteId,
      lead_source: "deposit",
      payment_status: "paid",
      _source: "customer_quotes" as const,
    }],
    [{ id: savedQuoteId, _source: "saved_quotes" as const }],
  );
  const packet = {
    path: adminDealPacketPath(savedQuoteId),
    operationalId: operationalCustomerQuoteId({
      id: savedQuoteId,
      _source: "saved_quotes",
      _joined_customer_quote_id: customerQuoteId,
      saved_quote_id: savedQuoteId,
    }),
    savedQuoteId: dealPacketSavedQuoteId({
      id: savedQuoteId,
      _source: "saved_quotes",
      saved_quote_id: savedQuoteId,
    }),
    paid: isAuthoritativeDepositPaid({
      customerQuotePaymentStatus: "paid",
      savedQuoteDepositStatus: "paid",
    }),
    canonicalDownload: shouldOfferCanonicalDocumentDownload({
      quotePdfPath: pdf.path,
      quotePdfSha256: pdf.sha256,
      savedQuoteId,
    }),
    canRetry: canRetryDepositDeliveries({
      paymentPaid: true,
      rows: [...world.deliveries.values()],
      now: world.now.getTime(),
    }),
    rowIds: adminRows.map((row) => row.id),
  };

  return {
    world,
    pdf,
    openDisposition,
    completeDisposition,
    expiredDisposition,
    mailerPlan,
    packet,
    lostClaimSms,
    notificationGuard,
    notificationWrite,
    attachmentPath,
  };
}

export function historicalReplayDoesNotAutoSend() {
  return planDepositWebhookMailer({
    alreadyPaid: true,
    hasOutboxSchema: false,
    legacyLeaseActive: false,
    deliveryRows: [],
  });
}

export function historicalBackfillDoesNotSeedOrPromotePaid() {
  const plan = planHistoricalDepositBackfill([
    {
      id: ACCEPTANCE_DEAL_ID,
      lead_source: "deposit",
      saved_quote_id: null,
      stripe_checkout_session_id: null,
      stripe_payment_intent_id: null,
      payment_status: null,
      quote_data: {
        saved_quote_id: ACCEPTANCE_QUOTE_ID,
        stripe_session_id: "cs_test_99mh001",
        stripe_payment_intent: "pi_test_99mh001",
        payment_status: "paid",
      },
    },
  ], [
    { id: ACCEPTANCE_QUOTE_ID, deposit_status: "pending" },
  ]);
  return {
    plan,
    seedsDeliveries: false,
    promotesPaid: plan.savedQuoteUpdates.some((row) => row.patch.deposit_status === "paid")
      || plan.customerQuoteUpdates.some((row) => "payment_status" in row.patch),
  };
}

export function recoveryPlanForBoundSession() {
  const paidAt = stripeDerivedPaidAt({
    created: 1755964800,
    payment_intent: { created: 1755964900, id: "pi_test_accept001" },
  });
  const plan = planVerifiedStripeRecovery({
    savedQuoteId: ACCEPTANCE_QUOTE_ID,
    deposit: {
      lead_source: "deposit",
      saved_quote_id: ACCEPTANCE_QUOTE_ID,
      stripe_checkout_session_id: ACCEPTANCE_SESSION_COMPLETE,
      deposit_amount: 500,
      payment_status: null,
      quote_data: {
        saved_quote_id: ACCEPTANCE_QUOTE_ID,
        stripe_session_id: ACCEPTANCE_SESSION_COMPLETE,
        deposit_amount: "500",
      },
    },
    savedQuote: { id: ACCEPTANCE_QUOTE_ID, deposit_status: "pending" },
    session: {
      id: ACCEPTANCE_SESSION_COMPLETE,
      payment_status: "paid",
      amount_total: 50000,
      payment_intent: { id: "pi_test_accept001", created: 1755964900 },
      metadata: {
        payment_type: "motor_deposit",
        saved_quote_id: ACCEPTANCE_QUOTE_ID,
        deposit_amount: "500",
      },
    },
    paidAt: paidAt || "2026-08-23T16:00:00.000Z",
  });
  const lostWrite = classifyOptimisticRecoveryWrite({
    written: null,
    reread: { payment_status: "paid", stripe_checkout_session_id: ACCEPTANCE_SESSION_COMPLETE },
    expectedSessionId: ACCEPTANCE_SESSION_COMPLETE,
  });
  return { paidAt, plan, lostWrite };
}

export { HBW_OPERATIONS_EMAIL, GROK_BOT_AGENTMAIL, simulateConcurrentClaims };
