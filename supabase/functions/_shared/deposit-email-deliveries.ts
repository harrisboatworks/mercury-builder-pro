import { canonicalQuoteDocumentPath } from "./quote-document-policy.ts";

export const DEPOSIT_EMAIL_AUDIENCES = ["customer", "hbw", "grok_bot"] as const;
export type DepositEmailAudience = (typeof DEPOSIT_EMAIL_AUDIENCES)[number];
export const DEPOSIT_EMAIL_STATUSES = ["pending", "sending", "sent", "failed"] as const;
export type DepositEmailStatus = (typeof DEPOSIT_EMAIL_STATUSES)[number];
export const HBW_OPERATIONS_EMAIL = "info@harrisboatworks.ca";
export const DEPOSIT_EMAIL_CLAIM_LEASE_SECONDS = 120;
export const RESEND_EMAILS_URL = "https://api.resend.com/emails";
export const CALLER_DOCUMENT_PATH_KEYS = [
  "quotePdfPath",
  "quote_pdf_path",
  "deposit_pdf_path",
  "attachmentPath",
  "attachment_path",
  "pdfUrl",
  "signedUrl",
  "publicUrl",
] as const;

export class DepositEmailOutboxError extends Error {
  constructor(message = "delivery_outbox_unavailable") {
    super(message);
    this.name = "DepositEmailOutboxError";
  }
}

export type DepositEmailDeliveryRow = {
  audience: DepositEmailAudience;
  status: DepositEmailStatus;
  provider_id?: string | null;
  attempt_count?: number | null;
  last_error?: string | null;
  last_attempted_at?: string | null;
  sent_at?: string | null;
  claim_token?: string | null;
  claim_expires_at?: string | null;
};

export function assertNoCallerDocumentPath(body: Record<string, unknown>): void {
  for (const key of CALLER_DOCUMENT_PATH_KEYS) {
    if (key in body) {
      throw new Error("Caller document paths are not accepted");
    }
  }
  const asString = JSON.stringify(body);
  if (asString.includes("getPublicUrl") || asString.includes("/storage/v1/object/public/")) {
    throw new Error("Public document URLs are not accepted");
  }
}

export function deriveDepositMailAttachmentKey(savedQuoteId: string): string {
  return canonicalQuoteDocumentPath(savedQuoteId);
}

export function seedDepositEmailDeliveryRows(options: {
  customerQuoteId: string;
  savedQuoteId: string;
}): Array<{
  customer_quote_id: string;
  saved_quote_id: string;
  audience: DepositEmailAudience;
  status: "pending";
  attempt_count: number;
}> {
  return DEPOSIT_EMAIL_AUDIENCES.map((audience) => ({
    customer_quote_id: options.customerQuoteId,
    saved_quote_id: options.savedQuoteId,
    audience,
    status: "pending" as const,
    attempt_count: 0,
  }));
}

export function isDeliveryRowClaimable(
  row: Pick<DepositEmailDeliveryRow, "status" | "claim_expires_at">,
  now: Date = new Date(),
): boolean {
  if (row.status === "sent") return false;
  if (row.status === "pending" || row.status === "failed") return true;
  if (row.status === "sending") {
    if (!row.claim_expires_at) return true;
    return Date.parse(row.claim_expires_at) <= now.getTime();
  }
  return false;
}

export function audiencesNeedingDelivery(
  rows: Array<Pick<DepositEmailDeliveryRow, "audience" | "status" | "claim_expires_at">>,
  now: Date = new Date(),
): DepositEmailAudience[] {
  return DEPOSIT_EMAIL_AUDIENCES.filter((audience) => {
    const row = rows.find((candidate) => candidate.audience === audience);
    if (!row) return true;
    return isDeliveryRowClaimable(row, now);
  });
}

export function assertDeliveryOutboxReady(
  rows: Array<Pick<DepositEmailDeliveryRow, "audience">> | null | undefined,
): asserts rows is Array<Pick<DepositEmailDeliveryRow, "audience">> {
  if (!rows || rows.length < DEPOSIT_EMAIL_AUDIENCES.length) {
    throw new DepositEmailOutboxError();
  }
  const present = new Set(rows.map((row) => row.audience));
  if (DEPOSIT_EMAIL_AUDIENCES.some((audience) => !present.has(audience))) {
    throw new DepositEmailOutboxError();
  }
}

export function claimDeliveryRow<T extends DepositEmailDeliveryRow>(
  row: T,
  claimToken: string,
  now: Date = new Date(),
  leaseSeconds = DEPOSIT_EMAIL_CLAIM_LEASE_SECONDS,
): T | null {
  if (!isDeliveryRowClaimable(row, now)) return null;
  return {
    ...row,
    status: "sending",
    claim_token: claimToken,
    claim_expires_at: new Date(now.getTime() + leaseSeconds * 1000).toISOString(),
    last_attempted_at: now.toISOString(),
    attempt_count: Number(row.attempt_count || 0) + 1,
  };
}

export function simulateConcurrentClaims(
  row: DepositEmailDeliveryRow,
  tokens: [string, string],
  now: Date = new Date(),
): { winners: number; claimedBy: string | null } {
  const first = claimDeliveryRow(row, tokens[0], now);
  const second = claimDeliveryRow(first || row, tokens[1], now);
  return {
    winners: Number(Boolean(first)) + Number(Boolean(second)),
    claimedBy: first ? tokens[0] : second ? tokens[1] : null,
  };
}

export function completeClaimedDelivery(
  row: Pick<DepositEmailDeliveryRow, "status" | "claim_token">,
  claimToken: string,
): "sent" | null {
  if (row.status !== "sending" || row.claim_token !== claimToken) return null;
  return "sent";
}

export function reportableDeliveryStatus(options: {
  completed: { status?: string | null } | null;
  persistError?: unknown;
}): DepositEmailStatus {
  if (options.persistError || !options.completed || options.completed.status !== "sent") {
    return "failed";
  }
  return "sent";
}

export function uniqueEmailRecipients(addresses: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const address of addresses) {
    const normalized = typeof address === "string" ? address.trim().toLowerCase() : "";
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    unique.push(address!.trim());
  }
  return unique;
}

export function hbwDepositRecipients(adminEmails: string[]): string[] {
  return uniqueEmailRecipients([...adminEmails, HBW_OPERATIONS_EMAIL]);
}

export function adminDealPacketPath(savedQuoteId: string): string {
  return `/admin/quotes/${savedQuoteId}`;
}

export function resendIdempotencyKey(customerQuoteId: string, audience: DepositEmailAudience): string {
  return `deposit-email:${customerQuoteId}:${audience}`;
}

export function generateDepositReference(options: {
  paymentIntentId?: string | null;
  savedQuoteId: string;
}): string {
  const paymentId = typeof options.paymentIntentId === "string" ? options.paymentIntentId.trim() : "";
  if (paymentId) return `HBW-${paymentId.slice(-8).toUpperCase()}`;
  return `HBW-${options.savedQuoteId.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

export function stableDepositTimestamp(values: Array<string | null | undefined>): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim() && Number.isFinite(Date.parse(value))) {
      return value;
    }
  }
  return "1970-01-01T00:00:00.000Z";
}

export function formatStableDepositEmailDate(paidAt: string): string {
  return new Date(paidAt).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/Toronto",
  });
}

export function formatStableDepositEmailTime(paidAt: string): string {
  return new Date(paidAt).toLocaleString("en-CA", { timeZone: "America/Toronto" });
}

export function deliveriesIndicateFailure(
  deliveries?: Record<string, string> | null,
): boolean {
  if (!deliveries) return true;
  return DEPOSIT_EMAIL_AUDIENCES.some((audience) => deliveries[audience] !== "sent");
}

export const DEPOSIT_OUTBOX_SCHEMA_KEY = "deposit_outbox_schema";
export const DEPOSIT_OUTBOX_SCHEMA_VERSION = 1;

export function hasDepositOutboxSchema(quoteData: unknown): boolean {
  return Boolean(
    quoteData
    && typeof quoteData === "object"
    && !Array.isArray(quoteData)
    && (quoteData as Record<string, unknown>)[DEPOSIT_OUTBOX_SCHEMA_KEY] === DEPOSIT_OUTBOX_SCHEMA_VERSION,
  );
}

export function shouldSeedAndInvokeDepositMailer(options: {
  alreadyPaid: boolean;
  deliveryRows?: Array<unknown> | null;
  deliveryReadError?: boolean;
  hasOutboxSchema?: boolean;
}): { seed: boolean; invoke: boolean } {
  if (options.deliveryReadError) {
    return { seed: false, invoke: false };
  }
  if ((options.deliveryRows?.length ?? 0) > 0) {
    return { seed: false, invoke: true };
  }
  if (!options.alreadyPaid) {
    return { seed: true, invoke: true };
  }
  if (options.hasOutboxSchema) {
    return { seed: true, invoke: true };
  }
  return { seed: false, invoke: false };
}

export function planDepositWebhookMailer(options: {
  alreadyPaid: boolean;
  deliveryRows?: Array<unknown> | null;
  deliveryReadError?: boolean;
  hasOutboxSchema?: boolean;
  legacyLeaseActive?: boolean;
}): { seed: boolean; invoke: boolean } {
  void options.legacyLeaseActive;
  return shouldSeedAndInvokeDepositMailer({
    alreadyPaid: options.alreadyPaid,
    deliveryRows: options.deliveryRows,
    deliveryReadError: options.deliveryReadError,
    hasOutboxSchema: options.hasOutboxSchema,
  });
}

export function legacyNotificationStatusFromAudienceResults(
  deliveries: Record<string, string> | null | undefined,
  options: { invoked: boolean; invokeFailed?: boolean },
): "delivered" | "manual_follow_up" | "not_sent" {
  if (!options.invoked) return "not_sent";
  if (options.invokeFailed || deliveriesIndicateFailure(deliveries)) return "manual_follow_up";
  return "delivered";
}

export function sanitizeDeliveryError(error: unknown): string {
  const raw = error instanceof Error ? error.message : "delivery_failed";
  const redacted = raw
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted]")
    .replace(/\+?[0-9][0-9().\s-]{6,}[0-9]/g, "[redacted]")
    .replace(/[{[][\s\S]*[}\]]/g, "[redacted]")
    .replace(/[{[][\s\S]*/g, "[redacted]");
  return redacted.slice(0, 180).trim() || "delivery_failed";
}

export type ResendEmailPayload = {
  from: string;
  to: string[];
  subject: string;
  html: string;
  reply_to?: string;
  attachments?: Array<{ filename: string; content: string }>;
};

export type ResendIdempotentResult =
  | { kind: "sent"; id: string }
  | { kind: "concurrent" }
  | { kind: "payload_mismatch" }
  | { kind: "missing_api_key" }
  | { kind: "network" }
  | { kind: "error"; error: Error };

export function classifyResendIdempotencyConflict(body: unknown): "concurrent" | "payload_mismatch" {
  const record = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const haystack = [record.name, record.message, record.type]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();
  if (
    haystack.includes("invalid_idempotent_request")
    || haystack.includes("payload mismatch")
    || haystack.includes("different payload")
  ) {
    return "payload_mismatch";
  }
  if (
    haystack.includes("concurrent_idempotent_requests")
    || haystack.includes("already in progress")
    || haystack.includes("concurrent")
  ) {
    return "concurrent";
  }
  return "payload_mismatch";
}

export function resendFailureCode(result: ResendIdempotentResult): string {
  switch (result.kind) {
    case "concurrent":
      return "provider_concurrent";
    case "payload_mismatch":
      return "provider_invalid_idempotent_request";
    case "missing_api_key":
      return "resend_api_key_missing";
    case "network":
      return "provider_network";
    case "error":
      return sanitizeDeliveryError(result.error);
    case "sent":
      return "";
  }
}

export function parseResendIdempotentResponse(options: {
  status: number;
  body: unknown;
}): ResendIdempotentResult {
  const body = options.body && typeof options.body === "object"
    ? options.body as Record<string, unknown>
    : {};
  if (options.status === 409) {
    return { kind: classifyResendIdempotencyConflict(body) };
  }
  if (options.status >= 200 && options.status < 300 && typeof body.id === "string" && body.id) {
    return { kind: "sent", id: body.id };
  }
  return { kind: "error", error: new Error("resend_delivery_failed") };
}

export function assertResendApiKeyConfigured(apiKey: string | null | undefined): apiKey is string {
  return typeof apiKey === "string" && apiKey.trim().length > 0;
}

export async function sendResendEmailWithIdempotency(options: {
  apiKey: string;
  idempotencyKey: string;
  payload: ResendEmailPayload;
  fetchImpl?: typeof fetch;
}): Promise<ResendIdempotentResult> {
  if (!assertResendApiKeyConfigured(options.apiKey)) {
    return { kind: "missing_api_key" };
  }
  const fetchImpl = options.fetchImpl || fetch;
  try {
    const response = await fetchImpl(RESEND_EMAILS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": options.idempotencyKey,
      },
      body: JSON.stringify(options.payload),
    });
    let body: unknown = {};
    try {
      body = await response.json();
    } catch {
      body = {};
    }
    return parseResendIdempotentResponse({ status: response.status, body });
  } catch {
    return { kind: "network" };
  }
}

export function stripeWebhookStatusAfterHandler(options: {
  paymentReconciled: boolean;
  failed?: boolean;
}): 200 | 500 {
  if (options.failed && !options.paymentReconciled) return 500;
  return 200;
}
