/**
 * Quote email delivery: send-result verification, idempotency, durable audit.
 *
 * Three defects this addresses:
 *
 *   1. The function did `await resend.emails.send(...)` and never inspected the
 *      result. Resend's SDK resolves with `{ data, error }` - it does not throw
 *      on a rejected send. So a rejected send returned `success: true`, the UI
 *      showed "Email Sent", and an "email sent" note was written.
 *
 *   2. The audit write was `customer_quotes.update({notes}).eq('quote_number',
 *      <caller-supplied>)`. Any anonymous caller could overwrite the notes
 *      field of ANY quote row by naming its quote number. The audit now goes to
 *      a dedicated append-only table that only service_role can write, and the
 *      caller never chooses the target row's contents.
 *
 *   3. Retries duplicated customer emails. Delivery is now claimed before the
 *      send, so a repeated attempt is suppressed instead of re-sent.
 */

export interface ResendSendResult {
  data?: { id?: string | null } | null;
  error?: { name?: string; message?: string } | null;
}

export interface VerifiedSend {
  messageId: string;
}

export class EmailSendFailed extends Error {
  constructor(public readonly detail: string) {
    super(detail);
    this.name = "EmailSendFailed";
  }
}

/**
 * A send counts as successful only when the provider reported no error AND
 * returned a non-empty message id. Anything else is a failure, full stop.
 */
export function verifyResendResult(result: ResendSendResult | null | undefined): VerifiedSend {
  if (!result) throw new EmailSendFailed("provider returned no result");

  if (result.error) {
    const name = result.error.name || "ProviderError";
    const message = result.error.message || "unknown provider error";
    throw new EmailSendFailed(name + ": " + message);
  }

  const messageId = result.data?.id;
  if (typeof messageId !== "string" || messageId.trim() === "") {
    throw new EmailSendFailed("provider returned no message id");
  }

  return { messageId: messageId.trim() };
}

/** Normalise a recipient for idempotency purposes (case/whitespace only). */
export function normalizeRecipient(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Idempotency key for one logical send.
 *
 * Callers SHOULD pass a stable `idempotencyKey` generated once per user action
 * so retries of the same click collapse. When absent we derive one from the
 * message identity plus a coarse time bucket, so an accidental double-submit
 * dedupes while a deliberate resend an hour later still goes out.
 */
export async function deriveIdempotencyKey(input: {
  suppliedKey?: string | null;
  emailType: string;
  quoteNumber: string;
  quoteId?: string | null;
  recipient: string;
  now?: number;
  bucketMs?: number;
}): Promise<string> {
  if (input.suppliedKey && input.suppliedKey.trim() !== "") {
    return "supplied:" + input.suppliedKey.trim();
  }

  const bucketMs = input.bucketMs ?? 10 * 60 * 1000;
  const bucket = Math.floor((input.now ?? Date.now()) / bucketMs);
  const material = [
    input.emailType,
    input.quoteNumber,
    input.quoteId || "",
    normalizeRecipient(input.recipient),
    String(bucket),
  ].join("|");

  return "derived:" + (await sha256Hex(material));
}

/** SHA-256 hex of a string, used to store a recipient without storing the address. */
export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export type ClaimVerdict =
  | { status: "claimed"; deliveryId: string }
  | { status: "duplicate"; deliveryId: string; messageId: string | null }
  | { status: "in_flight"; deliveryId: string };

interface RpcClient {
  rpc: (
    name: string,
    params?: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: { message?: string } | null }>;
}

/**
 * Atomically claim the right to send. Returns "duplicate" when this exact
 * logical send already succeeded, in which case the caller must NOT send again.
 */
export async function claimQuoteEmailDelivery(
  client: RpcClient,
  params: {
    idempotencyKey: string;
    emailType: string;
    quoteNumber: string;
    quoteId?: string | null;
    recipientHash: string;
    initiator: string;
  },
): Promise<ClaimVerdict> {
  const { data, error } = await client.rpc("claim_quote_email_delivery_v1", {
    _idempotency_key: params.idempotencyKey,
    _email_type: params.emailType,
    _quote_number: params.quoteNumber,
    _quote_id: params.quoteId ?? null,
    _recipient_sha256: params.recipientHash,
    _initiator: params.initiator,
  });

  if (error) throw new Error("delivery claim failed: " + (error.message || "unknown"));

  const verdict = data as
    | { status?: string; delivery_id?: string; message_id?: string | null }
    | null;
  if (!verdict?.status || !verdict.delivery_id) {
    throw new Error("delivery claim returned an unusable verdict");
  }

  switch (verdict.status) {
    case "claimed":
      return { status: "claimed", deliveryId: verdict.delivery_id };
    case "duplicate":
      return {
        status: "duplicate",
        deliveryId: verdict.delivery_id,
        messageId: verdict.message_id ?? null,
      };
    case "in_flight":
      return { status: "in_flight", deliveryId: verdict.delivery_id };
    default:
      throw new Error("unknown delivery claim status: " + verdict.status);
  }
}

/** Record the outcome of a claimed delivery. Never throws - audit must not break delivery. */
export async function completeQuoteEmailDelivery(
  client: RpcClient,
  params: {
    deliveryId: string;
    status: "sent" | "failed";
    messageId?: string | null;
    errorDetail?: string | null;
    attachmentStatus: string;
  },
): Promise<void> {
  try {
    const { error } = await client.rpc("complete_quote_email_delivery_v1", {
      _delivery_id: params.deliveryId,
      _status: params.status,
      _message_id: params.messageId ?? null,
      _error_detail: params.errorDetail ?? null,
      _attachment_status: params.attachmentStatus,
    });
    if (error) console.error("delivery audit write failed:", error.message || "unknown");
  } catch (auditError) {
    console.error("delivery audit write threw:", auditError);
  }
}
