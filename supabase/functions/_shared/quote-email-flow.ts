/**
 * Quote email control flow, extracted so it can be tested without Deno.
 *
 * index.ts keeps the Deno-only concerns (serve, zod schema parsing from a
 * deno.land URL, rate limiting, the Supabase and Resend clients) and hands an
 * already-validated payload plus injected dependencies to executeQuoteEmailFlow.
 * That makes every branch below reachable from vitest with mocks, which is what
 * the helper-only tests in the first draft could not do.
 *
 * Ordering rule that drives this file: the attachment is resolved and fetched
 * BEFORE any HTML is rendered. The first draft rendered the body (including a
 * CTA button whose href was the caller-supplied pdfUrl) and only afterwards
 * validated the URL, so a rejected URL still shipped a customer-facing link to
 * caller-controlled input. Nothing caller-supplied reaches the rendered email
 * until it has passed validation.
 */

import {
  fetchQuotePdfAttachment,
  resolveQuotePdfUrl,
  QuotePdfRejected,
  type QuotePdfAttachment,
} from "./quote-pdf-attachment.ts";
import {
  verifyResendResult,
  EmailSendFailed,
  type ResendSendResult,
} from "./quote-email-delivery.ts";
import type { ClaimVerdict } from "./quote-email-delivery.ts";

export interface QuoteEmailPayload {
  customerEmail: string;
  customerName: string;
  quoteNumber: string;
  motorModel: string;
  totalPrice: number;
  pdfUrl?: string;
  emailType: string;
  idempotencyKey?: string;
  leadData?: { quoteId?: string | null; customerName?: string } | null;
}

export interface RenderedEmail {
  subject: string;
  html: string;
}

export interface QuoteEmailDeps {
  /** Render subject + body. MUST be called only with a validated payload. */
  renderEmail: (payload: QuoteEmailPayload) => Promise<RenderedEmail> | RenderedEmail;
  fetchAttachment?: (url: string) => Promise<QuotePdfAttachment>;
  claim: (input: { idempotencyKey: string; recipientHash: string }) => Promise<ClaimVerdict>;
  complete: (input: {
    deliveryId: string;
    status: "sent" | "failed";
    messageId?: string | null;
    errorDetail?: string | null;
    attachmentStatus: string;
  }) => Promise<boolean>;
  sendEmail: (options: {
    to: string[];
    subject: string;
    html: string;
    attachments?: Array<{ filename: string; content: string }>;
    headers?: Record<string, string>;
  }) => Promise<ResendSendResult>;
  buildIdempotencyKey: (payload: QuoteEmailPayload) => Promise<string>;
  hashRecipient: (email: string) => Promise<string>;
  encodeAttachment: (bytes: Uint8Array) => string;
  log?: (message: string, detail?: unknown) => void;
}

export interface FlowResult {
  status: number;
  body: Record<string, unknown>;
}

/**
 * Returns the response to send. Never throws for expected failures; callers
 * translate `FlowResult` straight into an HTTP response.
 */
export async function executeQuoteEmailFlow(
  payload: QuoteEmailPayload,
  deps: QuoteEmailDeps,
): Promise<FlowResult> {
  const log = deps.log ?? (() => {});

  // ---------------------------------------------------------------------
  // 1. Attachment decided BEFORE rendering, BEFORE claiming, BEFORE sending.
  // ---------------------------------------------------------------------
  let attachmentStatus = "none";
  let attachment: QuotePdfAttachment | null = null;
  let effectivePayload: QuoteEmailPayload = payload;

  if (payload.pdfUrl !== undefined && payload.pdfUrl !== null) {
    const resolved = resolveQuotePdfUrl(payload.pdfUrl);

    // A bad URL shape, a foreign host, or the saved-quote web page is a caller
    // error. Reject outright: no claim, no send, nothing rendered.
    if (!resolved.url) {
      log("pdf url rejected", resolved.reason);
      return {
        status: 400,
        body: { success: false, error: "Invalid PDF URL", reason: resolved.reason },
      };
    }

    // The URL is allowed; the artifact behind it may still be unusable.
    try {
      const fetchAttachment = deps.fetchAttachment ?? ((url: string) => fetchQuotePdfAttachment(url));
      attachment = await fetchAttachment(resolved.url.toString());
      attachmentStatus = `attached:${attachment.byteLength}`;
    } catch (attachmentError) {
      attachmentStatus = attachmentError instanceof QuotePdfRejected
        ? `rejected:${attachmentError.reason}`
        : "rejected:fetch-error";
      log("pdf attachment refused", attachmentStatus);
      // Fail safe by telling the truth: drop pdfUrl entirely so the rendered
      // email carries no attachment, no "PDF attached" copy and no CTA to the
      // rejected URL.
      attachment = null;
      effectivePayload = { ...payload, pdfUrl: undefined };
    }
  }

  // ---------------------------------------------------------------------
  // 2. Render only from the effective (possibly cleared) payload.
  // ---------------------------------------------------------------------
  const rendered = await deps.renderEmail(effectivePayload);

  // ---------------------------------------------------------------------
  // 3. Claim before dispatch.
  // ---------------------------------------------------------------------
  const idempotencyKey = await deps.buildIdempotencyKey(effectivePayload);
  const recipientHash = await deps.hashRecipient(effectivePayload.customerEmail);

  let claim: ClaimVerdict;
  try {
    claim = await deps.claim({ idempotencyKey, recipientHash });
  } catch (claimError) {
    const detail = claimError instanceof Error ? claimError.message : "claim failed";
    log("delivery claim failed", detail);
    // Never send when the guard against duplicates is unavailable.
    return { status: 503, body: { success: false, error: "Delivery guard unavailable", detail } };
  }

  if (claim.status === "duplicate") {
    log("duplicate suppressed", claim.deliveryId);
    return {
      status: 200,
      body: {
        success: true,
        duplicate: true,
        messageId: claim.messageId,
        emailType: effectivePayload.emailType,
        attachmentStatus,
      },
    };
  }

  if (claim.status === "in_flight") {
    return {
      status: 409,
      body: { success: false, error: "A send for this quote is already in progress" },
    };
  }

  if (claim.status === "mismatch") {
    // Someone reused an idempotency key that belongs to a different recipient,
    // quote or email type. Refuse rather than let them suppress a real send.
    log("idempotency key mismatch", claim.deliveryId);
    return {
      status: 409,
      body: { success: false, error: "Idempotency key does not match this message" },
    };
  }

  // ---------------------------------------------------------------------
  // 4. Send, then verify the provider actually accepted it.
  // ---------------------------------------------------------------------
  let messageId: string;
  try {
    const result = await deps.sendEmail({
      to: [effectivePayload.customerEmail],
      subject: rendered.subject,
      html: rendered.html,
      ...(attachment
        ? {
          attachments: [{
            filename: `Quote-${effectivePayload.quoteNumber}.pdf`,
            content: deps.encodeAttachment(attachment.bytes),
          }],
        }
        : {}),
      // Passed through for providers that honour it. See LIMITATIONS in the
      // rollout packet: the pinned SDK is not confirmed to forward this, so it
      // is defence in depth, not the primary duplicate guard.
      headers: { "Idempotency-Key": idempotencyKey },
    });
    messageId = verifyResendResult(result).messageId;
  } catch (sendError) {
    const detail = sendError instanceof EmailSendFailed
      ? sendError.detail
      : sendError instanceof Error
      ? sendError.message
      : "unknown send error";
    log("send failed", detail);
    await deps.complete({
      deliveryId: claim.deliveryId,
      status: "failed",
      errorDetail: detail,
      attachmentStatus,
    });
    return { status: 502, body: { success: false, error: "Email delivery failed", detail } };
  }

  // ---------------------------------------------------------------------
  // 5. Record the outcome. A failed audit write must be visible, because the
  //    row stays 'sending' and this message is now unrepeatable by design.
  // ---------------------------------------------------------------------
  const audited = await deps.complete({
    deliveryId: claim.deliveryId,
    status: "sent",
    messageId,
    attachmentStatus,
  });

  return {
    status: 200,
    body: {
      success: true,
      messageId,
      emailType: effectivePayload.emailType,
      attachmentStatus,
      ...(audited ? {} : { auditWarning: "delivery-audit-write-failed" }),
    },
  };
}
