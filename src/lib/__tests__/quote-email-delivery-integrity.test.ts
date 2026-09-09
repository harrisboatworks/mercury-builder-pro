import { describe, expect, it, vi } from "vitest";
import {
  verifyResendResult,
  EmailSendFailed,
  deriveIdempotencyKey,
  normalizeRecipient,
  claimQuoteEmailDelivery,
} from "../../../supabase/functions/_shared/quote-email-delivery.ts";

describe("Resend result verification", () => {
  it("accepts a real message id", () => {
    expect(verifyResendResult({ data: { id: "abc-123" }, error: null }))
      .toEqual({ messageId: "abc-123" });
  });

  it("treats a provider error as a failure even though the promise resolved", () => {
    expect(() => verifyResendResult({
      data: null,
      error: { name: "validation_error", message: "recipient rejected" },
    })).toThrow(EmailSendFailed);
  });

  it.each([
    [{ data: null, error: null }],
    [{ data: { id: null }, error: null }],
    [{ data: { id: "   " }, error: null }],
    [null],
  ])("rejects a result with no usable message id: %j", (result) => {
    expect(() => verifyResendResult(result as never)).toThrow(EmailSendFailed);
  });
});

describe("idempotency", () => {
  it("namespaces and hashes a caller-supplied key rather than trusting it raw", async () => {
    const base = {
      suppliedKey: "quote-delivery:abc",
      emailType: "quote_delivery",
      quoteNumber: "Q1",
      recipient: "a@b.ca",
    };
    const key = await deriveIdempotencyKey(base);

    expect(key).toMatch(/^supplied:[0-9a-f]{64}$/);
    expect(key).not.toContain("quote-delivery:abc");
    expect(await deriveIdempotencyKey(base)).toBe(key);
  });

  it("cannot be squatted: the same supplied key for another recipient differs", async () => {
    const supplied = "quote-delivery:11111111-1111-4111-8111-111111111111";
    const legitimate = await deriveIdempotencyKey({
      suppliedKey: supplied,
      emailType: "quote_delivery",
      quoteNumber: "Q1",
      recipient: "buyer@example.ca",
    });
    const attacker = await deriveIdempotencyKey({
      suppliedKey: supplied,
      emailType: "quote_delivery",
      quoteNumber: "Q1",
      recipient: "attacker@evil.example",
    });
    expect(attacker).not.toBe(legitimate);
  });

  it("derives the same key for an immediate retry", async () => {
    const base = {
      emailType: "quote_delivery",
      quoteNumber: "Q1",
      recipient: "Buyer@Example.CA",
      now: 1_760_000_000_000,
    };
    expect(await deriveIdempotencyKey(base)).toBe(await deriveIdempotencyKey(base));
  });

  it("normalises recipient case so a retry with different casing still dedupes", async () => {
    const now = 1_760_000_000_000;
    const a = await deriveIdempotencyKey({ emailType: "q", quoteNumber: "Q1", recipient: "A@B.ca", now });
    const b = await deriveIdempotencyKey({ emailType: "q", quoteNumber: "Q1", recipient: "a@b.CA", now });
    expect(a).toBe(b);
    expect(normalizeRecipient(" A@B.ca ")).toBe("a@b.ca");
  });

  it("allows a deliberate resend in a later window", async () => {
    const base = { emailType: "q", quoteNumber: "Q1", recipient: "a@b.ca" };
    const first = await deriveIdempotencyKey({ ...base, now: 1_760_000_000_000 });
    const later = await deriveIdempotencyKey({ ...base, now: 1_760_000_000_000 + 3_600_000 });
    expect(first).not.toBe(later);
  });

  it("keeps the 10-minute derived-key default for callers that omit a key", async () => {
    const base = { emailType: "q", quoteNumber: "Q1", recipient: "a@b.ca" };
    const bucketMs = 10 * 60 * 1000;
    const t0 = Math.floor(1_760_000_000_000 / bucketMs) * bucketMs;
    const sameBucket = await deriveIdempotencyKey({ ...base, now: t0 + 9 * 60 * 1000 });
    const nextBucket = await deriveIdempotencyKey({ ...base, now: t0 + 10 * 60 * 1000 });
    expect(await deriveIdempotencyKey({ ...base, now: t0 })).toBe(sameBucket);
    expect(await deriveIdempotencyKey({ ...base, now: t0 })).not.toBe(nextBucket);
    expect(await deriveIdempotencyKey({ ...base, now: t0, bucketMs: 10 * 60 * 1000 }))
      .toBe(await deriveIdempotencyKey({ ...base, now: t0 }));
  });

  it("suppresses a duplicate instead of sending twice", async () => {
    const client = {
      rpc: vi.fn().mockResolvedValue({
        data: { status: "duplicate", delivery_id: "d-1", message_id: "m-1" },
        error: null,
      }),
    };
    const verdict = await claimQuoteEmailDelivery(client, {
      idempotencyKey: "supplied:k",
      emailType: "quote_delivery",
      quoteNumber: "Q1",
      recipientHash: "hash",
      initiator: "customer",
    });
    expect(verdict).toEqual({ status: "duplicate", deliveryId: "d-1", messageId: "m-1" });
  });

  it("surfaces a claim failure rather than silently sending", async () => {
    const client = { rpc: vi.fn().mockResolvedValue({ data: null, error: { message: "boom" } }) };
    await expect(claimQuoteEmailDelivery(client, {
      idempotencyKey: "k",
      emailType: "quote_delivery",
      quoteNumber: "Q1",
      recipientHash: "hash",
      initiator: "customer",
    })).rejects.toThrow(/delivery claim failed/);
  });
});
