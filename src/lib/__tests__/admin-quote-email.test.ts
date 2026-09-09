import { describe, expect, it } from "vitest";
import { deriveIdempotencyKey } from "../../../supabase/functions/_shared/quote-email-delivery.ts";
import {
  ADMIN_QUOTE_EMAIL_IDEMPOTENCY_PREFIX,
  adminQuoteEmailRef,
  mintAdminQuoteEmailIdempotencyKey,
  presentQuoteEmailDelivery,
  resolveQuoteEmailDisplayRecipient,
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
  it("resolves the display address from the quote row, not a delivery hash", () => {
    const presented = presentQuoteEmailDelivery(
      {
        id: "d-1",
        email_type: "quote_delivery",
        status: "sent",
        attachment_status: "attached:2048",
        created_at: "2026-08-15T12:00:00.000Z",
        completed_at: "2026-08-15T12:00:02.000Z",
        initiator: "customer",
        error_detail: null,
      },
      "  Buyer@Example.CA  ",
    );

    expect(presented.recipientDisplay).toBe("Buyer@Example.CA");
    expect(presented.emailType).toBe("quote_delivery");
    expect(presented.status).toBe("sent");
    expect(presented.attachmentStatus).toBe("attached:2048");
    expect(presented.timestamp).toBe("2026-08-15T12:00:02.000Z");
    expect(presented.initiator).toBe("customer");
    expect(presented.errorDetail).toBeNull();
    expect(JSON.stringify(presented)).not.toContain("recipient_sha256");
  });

  it("keeps an empty quote email as a dash rather than inventing an address", () => {
    expect(resolveQuoteEmailDisplayRecipient("")).toBe("—");
    expect(resolveQuoteEmailDisplayRecipient(null)).toBe("—");
    expect(presentQuoteEmailDelivery({
      id: "d-2",
      email_type: "follow_up",
      status: "failed",
      attachment_status: null,
      created_at: "2026-08-15T12:00:00.000Z",
      completed_at: null,
      initiator: "admin",
      error_detail: "provider returned no message id",
    }, "   ").errorDetail).toBe("provider returned no message id");
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
});
