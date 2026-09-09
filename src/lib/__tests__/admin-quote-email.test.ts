import { describe, expect, it } from "vitest";
import { deriveIdempotencyKey } from "../../../supabase/functions/_shared/quote-email-delivery.ts";
import {
  ADMIN_QUOTE_EMAIL_HISTORY_EMPTY,
  ADMIN_QUOTE_EMAIL_HISTORY_SCOPE,
  ADMIN_QUOTE_EMAIL_IDEMPOTENCY_PREFIX,
  QUOTE_EMAIL_CLAIM_IN_FLIGHT_ERROR,
  QUOTE_EMAIL_CLAIM_MISMATCH_ERROR,
  QUOTE_EMAIL_DELIVERY_READ_RPC,
  adminQuoteEmailRef,
  describeAdminQuoteEmailSendVerdict,
  fetchAdminQuoteEmailDeliveries,
  interpretAdminQuoteEmailSendResult,
  mintAdminQuoteEmailIdempotencyKey,
  presentQuoteEmailDelivery,
  sortQuoteEmailDeliveriesNewestFirst,
} from "../admin-quote-email";

const QUOTE_A = "11111111-1111-4111-8111-111111111111";
const QUOTE_B = "22222222-2222-4222-8222-222222222222";
const PREFIX_TWIN_A = "aaaaaaaa-1111-4111-8111-111111111111";
const PREFIX_TWIN_B = "aaaaaaaa-2222-4222-8222-222222222222";

describe("admin quote email idempotency keys", () => {
  it("mints a stable primary key with no time component", () => {
    const first = mintAdminQuoteEmailIdempotencyKey({
      quoteId: QUOTE_A,
      emailType: "quote_delivery",
      intent: "send",
    });
    const second = mintAdminQuoteEmailIdempotencyKey({
      quoteId: QUOTE_A,
      emailType: "quote_delivery",
      intent: "send",
    });

    expect(first).toBe(`${ADMIN_QUOTE_EMAIL_IDEMPOTENCY_PREFIX}:${QUOTE_A}:quote_delivery`);
    expect(second).toBe(first);
    expect(first).not.toMatch(/resend/);
    expect(first.length).toBeGreaterThanOrEqual(8);
    expect(first.length).toBeLessThanOrEqual(200);
  });

  it("is collision-safe across quotes and templates", () => {
    const deliveryA = mintAdminQuoteEmailIdempotencyKey({
      quoteId: QUOTE_A,
      emailType: "quote_delivery",
      intent: "send",
    });
    const reminderA = mintAdminQuoteEmailIdempotencyKey({
      quoteId: QUOTE_A,
      emailType: "reminder",
      intent: "send",
    });
    const deliveryB = mintAdminQuoteEmailIdempotencyKey({
      quoteId: QUOTE_B,
      emailType: "quote_delivery",
      intent: "send",
    });

    expect(deliveryA).not.toBe(reminderA);
    expect(deliveryA).not.toBe(deliveryB);
    expect(reminderA).not.toBe(deliveryB);
  });

  it("mints a new key for a deliberate resend", () => {
    const primary = mintAdminQuoteEmailIdempotencyKey({
      quoteId: QUOTE_A,
      emailType: "quote_delivery",
      intent: "send",
    });
    const resend = mintAdminQuoteEmailIdempotencyKey({
      quoteId: QUOTE_A,
      emailType: "quote_delivery",
      intent: "resend",
      resendNonce: "nonce-1",
    });
    const otherResend = mintAdminQuoteEmailIdempotencyKey({
      quoteId: QUOTE_A,
      emailType: "quote_delivery",
      intent: "resend",
      resendNonce: "nonce-2",
    });

    expect(resend).toBe(
      `${ADMIN_QUOTE_EMAIL_IDEMPOTENCY_PREFIX}:${QUOTE_A}:quote_delivery:resend:nonce-1`,
    );
    expect(resend).not.toBe(primary);
    expect(otherResend).not.toBe(resend);
  });

  it("stays duplicate across time windows once the admin supplies the stable key", async () => {
    const supplied = mintAdminQuoteEmailIdempotencyKey({
      quoteId: QUOTE_A,
      emailType: "quote_delivery",
      intent: "send",
    });
    const base = {
      suppliedKey: supplied,
      emailType: "quote_delivery",
      quoteNumber: adminQuoteEmailRef(QUOTE_A),
      quoteId: QUOTE_A,
      recipient: "Buyer@Example.CA",
    };

    const first = await deriveIdempotencyKey({ ...base, now: 1_760_000_000_000 });
    const later = await deriveIdempotencyKey({ ...base, now: 1_760_000_000_000 + 3_600_000 });
    expect(first).toBe(later);
    expect(first).toMatch(/^supplied:[0-9a-f]{64}$/);
    expect(first).not.toContain(supplied);
  });

  it("still distinguishes recipients of the same admin key at the server hash", async () => {
    const supplied = mintAdminQuoteEmailIdempotencyKey({
      quoteId: QUOTE_A,
      emailType: "quote_delivery",
      intent: "send",
    });
    const buyer = await deriveIdempotencyKey({
      suppliedKey: supplied,
      emailType: "quote_delivery",
      quoteNumber: adminQuoteEmailRef(QUOTE_A),
      quoteId: QUOTE_A,
      recipient: "buyer@example.ca",
    });
    const other = await deriveIdempotencyKey({
      suppliedKey: supplied,
      emailType: "quote_delivery",
      quoteNumber: adminQuoteEmailRef(QUOTE_A),
      quoteId: QUOTE_A,
      recipient: "other@example.ca",
    });
    expect(buyer).not.toBe(other);
  });

  it("keeps derived keys distinct when two UUIDs share an 8-hex display prefix", async () => {
    expect(adminQuoteEmailRef(PREFIX_TWIN_A)).toBe(adminQuoteEmailRef(PREFIX_TWIN_B));
    expect(adminQuoteEmailRef(PREFIX_TWIN_A)).toBe("AAAAAAAA");

    const shared = {
      emailType: "quote_delivery",
      quoteNumber: adminQuoteEmailRef(PREFIX_TWIN_A),
      recipient: "buyer@example.ca",
      now: 1_760_000_000_000,
    };
    const first = await deriveIdempotencyKey({ ...shared, quoteId: PREFIX_TWIN_A });
    const second = await deriveIdempotencyKey({ ...shared, quoteId: PREFIX_TWIN_B });
    expect(first).not.toBe(second);

    const keyA = mintAdminQuoteEmailIdempotencyKey({
      quoteId: PREFIX_TWIN_A,
      emailType: "quote_delivery",
      intent: "send",
    });
    const keyB = mintAdminQuoteEmailIdempotencyKey({
      quoteId: PREFIX_TWIN_B,
      emailType: "quote_delivery",
      intent: "send",
    });
    expect(keyA).not.toBe(keyB);
  });
});

describe("admin quote email history presentation", () => {
  it("does not attach a quote-contact address as if it were the delivery recipient", () => {
    const presented = presentQuoteEmailDelivery({
      id: "d-1",
      email_type: "quote_delivery",
      status: "sent",
      attachment_status: "attached:2048",
      created_at: "2026-08-15T12:00:00.000Z",
      completed_at: "2026-08-15T12:00:02.000Z",
      initiator: "admin",
      error_detail: null,
      provider_message_id: "msg-1",
    });

    expect(presented.emailType).toBe("quote_delivery");
    expect(presented.status).toBe("sent");
    expect(presented.attachmentStatus).toBe("attached:2048");
    expect(presented.timestamp).toBe("2026-08-15T12:00:02.000Z");
    expect(presented.initiator).toBe("admin");
    expect(presented.errorDetail).toBeNull();
    expect(presented).not.toHaveProperty("recipientDisplay");
    expect(JSON.stringify(presented)).not.toContain("recipient_sha256");
    expect(JSON.stringify(presented)).not.toContain("@");
  });

  it("keeps a failed row's provider detail without inventing an address", () => {
    const presented = presentQuoteEmailDelivery({
      id: "d-2",
      email_type: "follow_up",
      status: "failed",
      attachment_status: null,
      created_at: "2026-08-15T12:00:00.000Z",
      completed_at: null,
      initiator: "admin",
      error_detail: "provider returned no message id",
    });
    expect(presented.errorDetail).toBe("provider returned no message id");
    expect(presented.attachmentStatus).toBe("none");
    expect(presented.timestamp).toBe("2026-08-15T12:00:00.000Z");
  });

  it("uses the first UUID group only as a display quote number", () => {
    expect(adminQuoteEmailRef(QUOTE_A)).toBe("11111111");
  });

  it("orders history newest first", () => {
    const ordered = sortQuoteEmailDeliveriesNewestFirst([
      { id: "old", created_at: "2026-01-01T00:00:00.000Z" },
      { id: "new", created_at: "2026-08-15T12:00:00.000Z" },
    ]);
    expect(ordered.map((row) => row.id)).toEqual(["new", "old"]);
  });

  it("documents that the panel is admin/trusted-quote-id only", () => {
    expect(ADMIN_QUOTE_EMAIL_HISTORY_SCOPE).toContain("admin-initiated");
    expect(ADMIN_QUOTE_EMAIL_HISTORY_SCOPE).toContain("without a quote id");
    expect(ADMIN_QUOTE_EMAIL_HISTORY_EMPTY).toContain("admin-initiated");
    expect(ADMIN_QUOTE_EMAIL_HISTORY_EMPTY).not.toMatch(/no emails sent yet/i);
  });
});

describe("admin quote email history read path", () => {
  it("asks the admin RPC for the full quote UUID and never a display prefix", async () => {
    const calls: Array<{ name: string; args: { _quote_id: string } }> = [];
    const result = await fetchAdminQuoteEmailDeliveries(QUOTE_A, async (name, args) => {
      calls.push({ name, args });
      return {
        data: [{
          id: "d-1",
          email_type: "quote_delivery",
          status: "sent",
          attachment_status: "none",
          created_at: "2026-09-09T12:00:00.000Z",
          completed_at: "2026-09-09T12:00:01.000Z",
          initiator: "admin",
          error_detail: null,
        }],
        error: null,
      };
    });

    expect(calls).toEqual([{
      name: QUOTE_EMAIL_DELIVERY_READ_RPC,
      args: { _quote_id: QUOTE_A },
    }]);
    expect(result).toEqual({
      ok: true,
      rows: [expect.objectContaining({ id: "d-1", initiator: "admin" })],
    });
    expect(JSON.stringify(calls)).not.toContain("_quote_number");
    expect(calls[0]?.args._quote_id).toBe(QUOTE_A);
  });

  it("fails closed when the RPC errors or throws", async () => {
    const denied = await fetchAdminQuoteEmailDeliveries(QUOTE_A, async () => ({
      data: null,
      error: { message: "permission denied" },
    }));
    const exploded = await fetchAdminQuoteEmailDeliveries(QUOTE_A, async () => {
      throw new Error("network down");
    });
    expect(denied).toEqual({ ok: false });
    expect(exploded).toEqual({ ok: false });
  });
});

describe("admin quote email send claim interpretation", () => {
  it("treats a verified 200 as sent and a duplicate flag as already sent", async () => {
    await expect(interpretAdminQuoteEmailSendResult({
      data: { success: true, messageId: "msg-1" },
      error: null,
    })).resolves.toEqual({ kind: "sent" });

    await expect(interpretAdminQuoteEmailSendResult({
      data: { success: true, duplicate: true, messageId: "msg-dup" },
      error: null,
    })).resolves.toEqual({ kind: "duplicate" });
  });

  it("reads the real 409 body supabase-js leaves on FunctionsHttpError.context", async () => {
    const mismatchResponse = new Response(JSON.stringify({
      success: false,
      error: QUOTE_EMAIL_CLAIM_MISMATCH_ERROR,
    }), { status: 409, headers: { "Content-Type": "application/json" } });
    const inFlightResponse = new Response(JSON.stringify({
      success: false,
      error: QUOTE_EMAIL_CLAIM_IN_FLIGHT_ERROR,
    }), { status: 409, headers: { "Content-Type": "application/json" } });

    const mismatch = await interpretAdminQuoteEmailSendResult({
      data: null,
      error: {
        name: "FunctionsHttpError",
        message: "Edge Function returned a non-2xx status code",
        context: mismatchResponse,
      },
      response: mismatchResponse,
    });
    const inFlight = await interpretAdminQuoteEmailSendResult({
      data: null,
      error: {
        name: "FunctionsHttpError",
        message: "Edge Function returned a non-2xx status code",
        context: inFlightResponse,
      },
      response: inFlightResponse,
    });

    expect(mismatch).toEqual({
      kind: "mismatch",
      message: QUOTE_EMAIL_CLAIM_MISMATCH_ERROR,
    });
    expect(inFlight).toEqual({
      kind: "in_flight",
      message: QUOTE_EMAIL_CLAIM_IN_FLIGHT_ERROR,
    });
  });

  it("refuses to treat mismatch or in_flight as success even if success is true", async () => {
    const mismatch = await interpretAdminQuoteEmailSendResult({
      data: { success: true, claim: "mismatch", error: QUOTE_EMAIL_CLAIM_MISMATCH_ERROR },
      error: null,
    });
    const inFlight = await interpretAdminQuoteEmailSendResult({
      data: { success: true, claim: "in_flight" },
      error: null,
    });
    const refused409 = await interpretAdminQuoteEmailSendResult({
      data: { success: true, messageId: "should-not-count" },
      error: { name: "FunctionsHttpError", message: "Edge Function returned a non-2xx status code" },
      response: new Response("{}", { status: 409 }),
    });

    expect(mismatch.kind).toBe("mismatch");
    expect(inFlight.kind).toBe("in_flight");
    expect(refused409.kind).toBe("failed");
    expect([mismatch, inFlight, refused409].map((verdict) => verdict.kind))
      .not.toContain("sent");
  });

  it("surfaces a provider failure without calling it a send", async () => {
    await expect(interpretAdminQuoteEmailSendResult({
      data: { success: false, error: "Email delivery failed", detail: "provider returned no message id" },
      error: { name: "FunctionsHttpError", message: "Edge Function returned a non-2xx status code" },
      response: new Response("{}", { status: 502 }),
    })).resolves.toEqual({
      kind: "failed",
      message: "Email delivery failed",
    });
  });

  it("describes each claim honestly in the toast copy", () => {
    expect(describeAdminQuoteEmailSendVerdict({ kind: "sent" }, "send")).toEqual({
      title: "Email Sent",
      description: "Quote email sent.",
    });
    expect(describeAdminQuoteEmailSendVerdict({ kind: "duplicate" }, "send")).toMatchObject({
      title: "Already sent",
    });
    expect(describeAdminQuoteEmailSendVerdict({
      kind: "in_flight",
      message: QUOTE_EMAIL_CLAIM_IN_FLIGHT_ERROR,
    }, "send")).toEqual({
      title: "Send already in progress",
      description: QUOTE_EMAIL_CLAIM_IN_FLIGHT_ERROR,
      variant: "destructive",
    });
    expect(describeAdminQuoteEmailSendVerdict({
      kind: "mismatch",
      message: QUOTE_EMAIL_CLAIM_MISMATCH_ERROR,
    }, "send")).toEqual({
      title: "Send refused",
      description: QUOTE_EMAIL_CLAIM_MISMATCH_ERROR,
      variant: "destructive",
    });
    expect(describeAdminQuoteEmailSendVerdict({
      kind: "mismatch",
      message: QUOTE_EMAIL_CLAIM_MISMATCH_ERROR,
    }, "send").title).not.toMatch(/sent/i);
  });
});
