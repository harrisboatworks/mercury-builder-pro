/**
 * Admin quote-email helpers: history presentation, the display ref, and
 * honest interpretation of send-quote-email claim verdicts.
 *
 * Keys are minted in `_shared/quote-email-delivery.ts` so the consultation
 * path and the admin sender use the same shape.
 *
 * `adminQuoteEmailRef` is the first UUID group (8 hex chars), used only as the
 * human-visible Quote # in outbound copy. It is not a lookup key.
 *
 * Delivery rows store `recipient_sha256`, never a plaintext address. History
 * must not invent or imply one. After PR #508, `quote_id` is trusted-only:
 * customer-initiated sends are audited with `quote_id = NULL` and cannot be
 * listed by this quote's UUID.
 *
 * `quote_email_deliveries` is service-role write / RLS default-deny. Admins
 * read through `get_quote_email_deliveries_v1`, which is SECURITY DEFINER
 * and checks `has_role(auth.uid(), 'admin')`. Do not select the table.
 */

export {
  ADMIN_QUOTE_EMAIL_IDEMPOTENCY_PREFIX,
  mintAdminQuoteEmailIdempotencyKey,
  type AdminQuoteEmailType,
} from "../../supabase/functions/_shared/quote-email-delivery.ts";

export const QUOTE_EMAIL_DELIVERY_READ_RPC = "get_quote_email_deliveries_v1";

/** Exact error strings returned by send-quote-email for claim refusals. */
export const QUOTE_EMAIL_CLAIM_IN_FLIGHT_ERROR =
  "A send for this quote is already in progress";
export const QUOTE_EMAIL_CLAIM_MISMATCH_ERROR =
  "Idempotency key does not match this message";

export const ADMIN_QUOTE_EMAIL_HISTORY_SCOPE =
  "Only admin-initiated sends are listed here. Those are the deliveries stored with a trusted quote id. A customer sending from the public quote page is recorded without a quote id, so it will not appear in this list.";

export const ADMIN_QUOTE_EMAIL_HISTORY_EMPTY =
  "No admin-initiated emails recorded for this quote.";

export const ADMIN_QUOTE_EMAIL_HISTORY_UNAVAILABLE =
  "Email history is unavailable right now. The rest of this quote is still usable.";

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

export function sortQuoteEmailDeliveriesNewestFirst<T extends { created_at: string }>(
  rows: T[],
): T[] {
  return [...rows].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

export function presentQuoteEmailDelivery(row: QuoteEmailDeliveryRecord) {
  return {
    id: row.id,
    emailType: row.email_type,
    status: row.status,
    attachmentStatus: row.attachment_status || "none",
    timestamp: row.completed_at || row.created_at,
    initiator: row.initiator,
    errorDetail: row.error_detail,
  };
}

export type AdminQuoteEmailDeliveryRpc = (
  name: string,
  args: { _quote_id: string },
) => PromiseLike<{ data: unknown; error: unknown }>;

export async function fetchAdminQuoteEmailDeliveries(
  quoteId: string,
  rpc: AdminQuoteEmailDeliveryRpc,
): Promise<{ ok: true; rows: QuoteEmailDeliveryRecord[] } | { ok: false }> {
  try {
    const { data, error } = await rpc(QUOTE_EMAIL_DELIVERY_READ_RPC, {
      _quote_id: quoteId,
    });
    if (error) return { ok: false };
    const rows = Array.isArray(data) ? (data as QuoteEmailDeliveryRecord[]) : [];
    return { ok: true, rows };
  } catch {
    return { ok: false };
  }
}

export type AdminQuoteEmailSendVerdict =
  | { kind: "sent" }
  | { kind: "duplicate" }
  | { kind: "in_flight"; message: string }
  | { kind: "mismatch"; message: string }
  | { kind: "failed"; message: string };

export type AdminQuoteEmailInvokeResult = {
  data?: unknown;
  error?: unknown;
  response?: Response;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function payloadErrorMessage(payload: Record<string, unknown> | null): string | null {
  const error = payload?.error;
  return typeof error === "string" && error.trim() !== "" ? error.trim() : null;
}

function claimFromPayload(
  payload: Record<string, unknown> | null,
): "claimed" | "duplicate" | "in_flight" | "mismatch" | null {
  const claim = payload?.claim;
  if (
    claim === "claimed" ||
    claim === "duplicate" ||
    claim === "in_flight" ||
    claim === "mismatch"
  ) {
    return claim;
  }
  return null;
}

async function readJsonRecord(candidate: unknown): Promise<Record<string, unknown> | null> {
  if (!candidate || typeof (candidate as Response).clone !== "function") return null;
  try {
    const parsed = await (candidate as Response).clone().json();
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function readAdminQuoteEmailInvokePayload(
  result: AdminQuoteEmailInvokeResult,
): Promise<Record<string, unknown> | null> {
  if (isRecord(result.data)) return result.data;

  const context = isRecord(result.error) ? result.error.context : undefined;
  const fromResponse = await readJsonRecord(result.response);
  if (fromResponse) return fromResponse;
  const fromContext = await readJsonRecord(context);
  if (fromContext) return fromContext;
  if (isRecord(context)) {
    const nested = await readJsonRecord(context.response);
    if (nested) return nested;
  }
  return null;
}

function invokeHttpStatus(result: AdminQuoteEmailInvokeResult): number | null {
  if (typeof result.response?.status === "number") return result.response.status;
  if (!isRecord(result.error)) return null;
  const context = result.error.context;
  if (typeof context === "number") return null;
  if (isRecord(context)) {
    if (typeof context.status === "number") return context.status;
    if (isRecord(context.response) && typeof context.response.status === "number") {
      return context.response.status;
    }
  }
  if (typeof (context as Response | undefined)?.status === "number") {
    return (context as Response).status;
  }
  return null;
}

/**
 * Map a supabase.functions.invoke result onto the claim contract.
 *
 * send-quote-email returns:
 *   claimed send → 200 { success: true }
 *   duplicate    → 200 { success: true, duplicate: true }
 *   in_flight    → 409 { success: false, error: QUOTE_EMAIL_CLAIM_IN_FLIGHT_ERROR }
 *   mismatch     → 409 { success: false, error: QUOTE_EMAIL_CLAIM_MISMATCH_ERROR }
 *
 * `mismatch` is a refusal. It is never a successful send.
 */
export async function interpretAdminQuoteEmailSendResult(
  result: AdminQuoteEmailInvokeResult,
): Promise<AdminQuoteEmailSendVerdict> {
  const payload = await readAdminQuoteEmailInvokePayload(result);
  const claim = claimFromPayload(payload);
  const errorMessage = payloadErrorMessage(payload);
  const httpStatus = invokeHttpStatus(result);
  const invokeFailed = result.error != null;

  if (claim === "mismatch" || errorMessage === QUOTE_EMAIL_CLAIM_MISMATCH_ERROR) {
    return {
      kind: "mismatch",
      message: errorMessage || QUOTE_EMAIL_CLAIM_MISMATCH_ERROR,
    };
  }
  if (claim === "in_flight" || errorMessage === QUOTE_EMAIL_CLAIM_IN_FLIGHT_ERROR) {
    return {
      kind: "in_flight",
      message: errorMessage || QUOTE_EMAIL_CLAIM_IN_FLIGHT_ERROR,
    };
  }
  if (claim === "duplicate" || (payload?.success === true && payload.duplicate === true)) {
    return { kind: "duplicate" };
  }

  const looksSuccessful = payload?.success === true && !invokeFailed
    && (httpStatus === null || httpStatus < 400);

  if (looksSuccessful) {
    return { kind: "sent" };
  }

  return {
    kind: "failed",
    message: errorMessage || "Could not send email.",
  };
}

export function describeAdminQuoteEmailSendVerdict(
  verdict: AdminQuoteEmailSendVerdict,
  intent: "send" | "resend",
): { title: string; description: string; variant?: "destructive" } {
  switch (verdict.kind) {
    case "sent":
      return {
        title: intent === "resend" ? "Another copy sent" : "Email Sent",
        description: intent === "resend"
          ? "The customer will receive another copy of this quote."
          : "Quote email sent.",
      };
    case "duplicate":
      return {
        title: "Already sent",
        description: "This quote was already emailed. Use Send again to deliver another copy to the customer.",
      };
    case "in_flight":
      return {
        title: "Send already in progress",
        description: verdict.message,
        variant: "destructive",
      };
    case "mismatch":
      return {
        title: "Send refused",
        description: verdict.message,
        variant: "destructive",
      };
    case "failed":
      return {
        title: "Failed to Send",
        description: verdict.message,
        variant: "destructive",
      };
  }
}
