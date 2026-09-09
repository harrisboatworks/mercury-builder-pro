/**
 * Admin quote-email helpers: history presentation and the display ref.
 *
 * Keys are minted in `_shared/quote-email-delivery.ts` so the consultation
 * path and the admin sender use the same shape.
 *
 * `adminQuoteEmailRef` is the first UUID group (8 hex chars), used only as the
 * human-visible Quote # in outbound copy. It is not a lookup key.
 */

export {
  ADMIN_QUOTE_EMAIL_IDEMPOTENCY_PREFIX,
  mintAdminQuoteEmailIdempotencyKey,
  type AdminQuoteEmailType,
} from "../../supabase/functions/_shared/quote-email-delivery.ts";

export function adminQuoteEmailRef(quoteId: string): string {
  return quoteId.slice(0, 8).toUpperCase();
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
  provider_message_id?: string | null;
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
