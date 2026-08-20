import { describe, expect, it, vi } from "vitest";
import {
  resolveQuotePdfUrl,
  hasPdfSignature,
  isPdfContentType,
  fetchQuotePdfAttachment,
  QuotePdfRejected,
  MIN_PDF_BYTES,
} from "../../../supabase/functions/_shared/quote-pdf-attachment.ts";
import {
  verifyResendResult,
  EmailSendFailed,
  deriveIdempotencyKey,
  normalizeRecipient,
  claimQuoteEmailDelivery,
} from "../../../supabase/functions/_shared/quote-email-delivery.ts";

const STORAGE = "https://eutsoqdpjurknjsshxes.supabase.co";
const GOOD_PDF_URL = `${STORAGE}/storage/v1/object/public/spec-sheets/abc/quote-1.pdf`;

function pdfBytes(size = MIN_PDF_BYTES + 10): Uint8Array {
  const bytes = new Uint8Array(size);
  bytes.set([0x25, 0x50, 0x44, 0x46, 0x2d], 0); // "%PDF-"
  return bytes;
}

function response(body: Uint8Array, init: { status?: number; type?: string | null } = {}) {
  const headers = new Headers();
  if (init.type !== null) headers.set("content-type", init.type ?? "application/pdf");
  return new Response(body, { status: init.status ?? 200, headers });
}

describe("quote PDF URL allowlist", () => {
  it("accepts a generated PDF artifact in storage", () => {
    expect(resolveQuotePdfUrl(GOOD_PDF_URL).url).not.toBeNull();
  });

  it("rejects the saved-quote web page that was being mailed as a PDF", () => {
    // The exact defect: SendQuoteEmail.tsx passed SITE_URL/quote/saved/<id>.
    const result = resolveQuotePdfUrl("https://www.mercuryrepower.ca/quote/saved/abc-123");
    expect(result.url).toBeNull();
    expect((result as { reason: string }).reason).toBe("path-not-a-pdf-artifact");
  });

  it.each([
    ["http://eutsoqdpjurknjsshxes.supabase.co/storage/v1/object/public/spec-sheets/a.pdf", "not-https"],
    ["https://evil.example.com/storage/v1/object/public/spec-sheets/a.pdf", "host-not-allowlisted"],
    ["https://169.254.169.254/latest/meta-data/", "host-not-allowlisted"],
    [`${STORAGE}:8443/storage/v1/object/public/spec-sheets/a.pdf`, "explicit-port"],
    [`https://user:pw@eutsoqdpjurknjsshxes.supabase.co/storage/v1/object/public/spec-sheets/a.pdf`, "embedded-credentials"],
    ["not a url", "unparseable-url"],
  ])("rejects %s", (url, reason) => {
    const result = resolveQuotePdfUrl(url);
    expect(result.url).toBeNull();
    expect((result as { reason: string }).reason).toBe(reason);
  });

  // WHATWG URL normalises both literal and percent-encoded traversal before the
  // guard sees it, so these land outside the artifact prefix instead. What
  // matters is that every form is refused; the explicit `..` guard stays as
  // defence in depth for any future non-URL-parsed caller.
  it.each([
    `${STORAGE}/storage/v1/object/public/spec-sheets/../../secrets.pdf`,
    `${STORAGE}/storage/v1/object/public/spec-sheets/%2e%2e/%2e%2e/secrets.pdf`,
    `${STORAGE}/storage/v1/object/public/../private/secrets.pdf`,
  ])("refuses traversal attempt %s", (url) => {
    expect(resolveQuotePdfUrl(url).url).toBeNull();
  });
});

describe("quote PDF content validation", () => {
  it("detects a real PDF signature", () => {
    expect(hasPdfSignature(pdfBytes())).toBe(true);
    expect(hasPdfSignature(new TextEncoder().encode("<!DOCTYPE html><html>"))).toBe(false);
  });

  it("accepts only PDF content types", () => {
    expect(isPdfContentType("application/pdf")).toBe(true);
    expect(isPdfContentType("application/pdf; charset=binary")).toBe(true);
    expect(isPdfContentType("text/html; charset=utf-8")).toBe(false);
    expect(isPdfContentType(null)).toBe(false);
  });

  it("fetches and returns a valid PDF", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response(pdfBytes()));
    const result = await fetchQuotePdfAttachment(GOOD_PDF_URL, fetchImpl as unknown as typeof fetch);
    expect(result.byteLength).toBeGreaterThanOrEqual(MIN_PDF_BYTES);
    expect(result.contentType).toBe("application/pdf");
  });

  it("rejects HTML served with a PDF content type (no magic bytes)", async () => {
    const html = new TextEncoder().encode("<!DOCTYPE html>" + "x".repeat(MIN_PDF_BYTES));
    const fetchImpl = vi.fn().mockResolvedValue(response(html));
    await expect(fetchQuotePdfAttachment(GOOD_PDF_URL, fetchImpl as unknown as typeof fetch))
      .rejects.toMatchObject({ reason: "missing-pdf-signature" });
  });

  it("rejects a non-PDF content type even when bytes look fine", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response(pdfBytes(), { type: "text/html" }));
    await expect(fetchQuotePdfAttachment(GOOD_PDF_URL, fetchImpl as unknown as typeof fetch))
      .rejects.toMatchObject({ reason: "content-type-not-pdf" });
  });

  it("rejects a non-200 response", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response(pdfBytes(), { status: 404 }));
    await expect(fetchQuotePdfAttachment(GOOD_PDF_URL, fetchImpl as unknown as typeof fetch))
      .rejects.toMatchObject({ reason: "status-404" });
  });

  it("rejects a suspiciously small body", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response(pdfBytes(20)));
    await expect(fetchQuotePdfAttachment(GOOD_PDF_URL, fetchImpl as unknown as typeof fetch))
      .rejects.toMatchObject({ reason: "size-too-small" });
  });

  it("never follows a redirect off the allowlist", async () => {
    const redirect = new Response(null, {
      status: 302,
      headers: new Headers({ location: "https://evil.example.com/x.pdf" }),
    });
    const fetchImpl = vi.fn().mockResolvedValue(redirect);
    await expect(fetchQuotePdfAttachment(GOOD_PDF_URL, fetchImpl as unknown as typeof fetch))
      .rejects.toBeInstanceOf(QuotePdfRejected);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});

describe("Resend result verification", () => {
  it("accepts a real message id", () => {
    expect(verifyResendResult({ data: { id: "abc-123" }, error: null }))
      .toEqual({ messageId: "abc-123" });
  });

  it("treats a provider error as a failure even though the promise resolved", () => {
    // The exact defect: the SDK resolves with {data,error}; it does not throw.
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

    // Opaque: the raw caller string never becomes the key.
    expect(key).toMatch(/^supplied:[0-9a-f]{64}$/);
    expect(key).not.toContain("quote-delivery:abc");
    // Deterministic for the same message identity.
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
