import { describe, expect, it, vi } from "vitest";
import {
  executeQuoteEmailFlow,
  type QuoteEmailDeps,
  type QuoteEmailPayload,
} from "../../../supabase/functions/_shared/quote-email-flow.ts";
import { QuotePdfRejected } from "../../../supabase/functions/_shared/quote-pdf-attachment.ts";

const STORAGE = "https://eutsoqdpjurknjsshxes.supabase.co";
const GOOD_PDF = `${STORAGE}/storage/v1/object/public/spec-sheets/abc/quote-1.pdf`;

const basePayload: QuoteEmailPayload = {
  customerEmail: "buyer@example.ca",
  customerName: "Buyer",
  quoteNumber: "Q-1",
  motorModel: "115 ELPT",
  totalPrice: 1000,
  emailType: "quote_delivery",
  leadData: { quoteId: "11111111-1111-4111-8111-111111111111" },
};

function makeDeps(over: Partial<QuoteEmailDeps> = {}) {
  const renderEmail = vi.fn((p: QuoteEmailPayload) => ({
    subject: "subject",
    // Mirrors the real templates: the CTA href is the pdfUrl.
    html: p.pdfUrl ? `<a href="${p.pdfUrl}">Open quote PDF</a>` : "<p>no attachment</p>",
  }));
  const sendEmail = vi.fn(async () => ({ data: { id: "msg-1" }, error: null }));
  const complete = vi.fn(async () => true);
  const deps: QuoteEmailDeps = {
    renderEmail,
    sendEmail,
    complete,
    claim: vi.fn(async () => ({ status: "claimed" as const, deliveryId: "d-1" })),
    fetchAttachment: vi.fn(async () => ({
      bytes: new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]),
      byteLength: 5,
      contentType: "application/pdf",
    })),
    buildIdempotencyKey: vi.fn(async () => "key-1"),
    hashRecipient: vi.fn(async () => "hash-1"),
    encodeAttachment: vi.fn(() => "BASE64"),
    ...over,
  };
  return deps;
}

describe("invalid pdfUrl is genuinely no-send", () => {
  it.each([
    ["https://www.mercuryrepower.ca/quote/saved/abc-123", "the saved-quote web page"],
    ["https://evil.example.com/x.pdf", "an off-allowlist host"],
    ["http://169.254.169.254/latest/meta-data/", "an internal metadata endpoint"],
    ["not-a-url", "an unparseable url"],
  ])("returns 400 and never sends for %s (%s)", async (pdfUrl) => {
    const deps = makeDeps();
    const result = await executeQuoteEmailFlow({ ...basePayload, pdfUrl }, deps);

    expect(result.status).toBe(400);
    expect(result.body.success).toBe(false);
    // The whole point: nothing downstream of validation runs.
    expect(deps.sendEmail).not.toHaveBeenCalled();
    expect(deps.claim).not.toHaveBeenCalled();
    expect(deps.renderEmail).not.toHaveBeenCalled();
    expect(deps.complete).not.toHaveBeenCalled();
  });
});

describe("an allowed URL whose artifact fails validation", () => {
  it("sends an honest email with no attachment and no CTA to the rejected url", async () => {
    const deps = makeDeps({
      fetchAttachment: vi.fn(async () => {
        throw new QuotePdfRejected("missing-pdf-signature");
      }),
    });
    const result = await executeQuoteEmailFlow({ ...basePayload, pdfUrl: GOOD_PDF }, deps);

    expect(result.status).toBe(200);
    // Rendered from a payload with pdfUrl cleared.
    expect(deps.renderEmail).toHaveBeenCalledWith(
      expect.objectContaining({ pdfUrl: undefined }),
    );
    const sent = (deps.sendEmail as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(sent.attachments).toBeUndefined();
    expect(sent.html).not.toContain(GOOD_PDF);
    expect(sent.html).not.toContain("Open quote PDF");
    expect(result.body.attachmentStatus).toBe("rejected:missing-pdf-signature");
  });

  it("attaches and keeps the CTA when the artifact is valid", async () => {
    const deps = makeDeps();
    const result = await executeQuoteEmailFlow({ ...basePayload, pdfUrl: GOOD_PDF }, deps);

    const sent = (deps.sendEmail as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(sent.attachments).toEqual([{ filename: "Quote-Q-1.pdf", content: "BASE64" }]);
    expect(sent.html).toContain(GOOD_PDF);
    expect(result.body.attachmentStatus).toBe("attached:5");
  });
});

describe("omitted pdfUrl", () => {
  it("sends an honest no-attachment email", async () => {
    const deps = makeDeps();
    const result = await executeQuoteEmailFlow(basePayload, deps);

    expect(result.status).toBe(200);
    expect(deps.fetchAttachment).not.toHaveBeenCalled();
    const sent = (deps.sendEmail as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(sent.attachments).toBeUndefined();
    expect(result.body.attachmentStatus).toBe("none");
  });
});

describe("provider result handling", () => {
  it("returns 502 and records a failure when the provider reports an error", async () => {
    const deps = makeDeps({
      sendEmail: vi.fn(async () => ({
        data: null,
        error: { name: "validation_error", message: "recipient rejected" },
      })),
    });
    const result = await executeQuoteEmailFlow(basePayload, deps);

    expect(result.status).toBe(502);
    expect(result.body.success).toBe(false);
    expect(deps.complete).toHaveBeenCalledWith(
      expect.objectContaining({ status: "failed", deliveryId: "d-1" }),
    );
  });

  it("returns 502 when the provider returns no message id", async () => {
    const deps = makeDeps({ sendEmail: vi.fn(async () => ({ data: { id: "" }, error: null })) });
    const result = await executeQuoteEmailFlow(basePayload, deps);
    expect(result.status).toBe(502);
    expect(deps.complete).toHaveBeenCalledWith(expect.objectContaining({ status: "failed" }));
  });
});

describe("audit and duplicate semantics", () => {
  it("surfaces an audit-write failure instead of silently succeeding", async () => {
    const deps = makeDeps({ complete: vi.fn(async () => false) });
    const result = await executeQuoteEmailFlow(basePayload, deps);

    expect(result.status).toBe(200);
    expect(result.body.auditWarning).toBe("delivery-audit-write-failed");
  });

  it("suppresses a duplicate without calling the provider", async () => {
    const deps = makeDeps({
      claim: vi.fn(async () => ({
        status: "duplicate" as const,
        deliveryId: "d-1",
        messageId: "msg-original",
      })),
    });
    const result = await executeQuoteEmailFlow(basePayload, deps);

    expect(result.status).toBe(200);
    expect(result.body.duplicate).toBe(true);
    expect(deps.sendEmail).not.toHaveBeenCalled();
  });

  it("returns 409 for a concurrent in-flight send", async () => {
    const deps = makeDeps({
      claim: vi.fn(async () => ({ status: "in_flight" as const, deliveryId: "d-1" })),
    });
    const result = await executeQuoteEmailFlow(basePayload, deps);

    expect(result.status).toBe(409);
    expect(deps.sendEmail).not.toHaveBeenCalled();
  });

  it("returns 409 when a supplied key belongs to a different message", async () => {
    const deps = makeDeps({
      claim: vi.fn(async () => ({ status: "mismatch" as const, deliveryId: "d-1" })),
    });
    const result = await executeQuoteEmailFlow(basePayload, deps);

    expect(result.status).toBe(409);
    expect(result.body.error).toMatch(/does not match/i);
    expect(deps.sendEmail).not.toHaveBeenCalled();
  });

  it("never sends when the duplicate guard itself is unavailable", async () => {
    const deps = makeDeps({
      claim: vi.fn(async () => {
        throw new Error("delivery claim failed: db down");
      }),
    });
    const result = await executeQuoteEmailFlow(basePayload, deps);

    expect(result.status).toBe(503);
    expect(deps.sendEmail).not.toHaveBeenCalled();
  });
});

describe("provider-level idempotency header", () => {
  it("passes the same key it claimed with", async () => {
    const deps = makeDeps();
    await executeQuoteEmailFlow(basePayload, deps);
    const sent = (deps.sendEmail as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(sent.headers).toEqual({ "Idempotency-Key": "key-1" });
  });
});
