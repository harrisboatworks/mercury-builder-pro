/**
 * Admin quote-email helpers: stable idempotency keys and history presentation.
 *
 * The edge function still accepts an optional key and, when one is omitted,
 * derives a 10-minute time-bucket fallback. The admin sender always supplies
 * a key so a second click cannot slip through after that window.
 *
 * Shape: `hbw-admin-v1:{quoteId}:{emailType}`
 *
 * Collision-safe across quotes because `quoteId` is the quote UUID. Collision-safe
 * across templates because `emailType` is the template enum. The server then
 * hashes this supplied key together with quote number, quote id, email type,
 * and the normalised recipient, so two recipients of the same quote+template
 * still get distinct stored keys. No time component, so a repeat send stays
 * `duplicate` indefinitely.
 *
 * A deliberate resend appends `:resend:{nonce}` so it cannot collide with the
 * stable primary key. The raw recipient address is never part of the key.
 */

export const ADMIN_QUOTE_EMAIL_IDEMPOTENCY_PREFIX = "hbw-admin-v1";

export type AdminQuoteEmailType =
  | "quote_delivery"
  | "follow_up"
  | "reminder"
  | "admin_quote_notification";

export function adminQuoteEmailRef(quoteId: string): string {
  return quoteId.slice(0, 8).toUpperCase();
}

export function mintAdminQuoteEmailIdempotencyKey(input: {
  quoteId: string;
  emailType: AdminQuoteEmailType | string;
  intent: "send" | "resend";
  resendNonce?: string;
}): string {
  const quoteId = input.quoteId.trim();
  const emailType = input.emailType.trim();
  const key =
    input.intent === "resend"
      ? `${ADMIN_QUOTE_EMAIL_IDEMPOTENCY_PREFIX}:${quoteId}:${emailType}:resend:${(input.resendNonce ?? crypto.randomUUID()).trim()}`
      : `${ADMIN_QUOTE_EMAIL_IDEMPOTENCY_PREFIX}:${quoteId}:${emailType}`;

  if (key.length < 8 || key.length > 200) {
    throw new Error("admin quote email idempotency key is outside the accepted length");
  }
  return key;
}

export interface QuoteEmailDeliveryRecord {
  id: string;
  email_type: string;
  status: string;
  attachment_status: string | null;
  created_at: string;
  completed_at: string | null;
  initiator: string;
  error_detail: string | null;
}

export function resolveQuoteEmailDisplayRecipient(
  quoteCustomerEmail: string | null | undefined,
): string {
  const trimmed = quoteCustomerEmail?.trim() ?? "";
  return trimmed || "—";
}

export function sortQuoteEmailDeliveriesNewestFirst<T extends { created_at: string }>(
  rows: T[],
): T[] {
  return [...rows].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

export function presentQuoteEmailDelivery(
  row: QuoteEmailDeliveryRecord,
  quoteCustomerEmail: string | null | undefined,
) {
  return {
    id: row.id,
    emailType: row.email_type,
    status: row.status,
    attachmentStatus: row.attachment_status || "none",
    timestamp: row.completed_at || row.created_at,
    initiator: row.initiator,
    errorDetail: row.error_detail,
    recipientDisplay: resolveQuoteEmailDisplayRecipient(quoteCustomerEmail),
  };
}
