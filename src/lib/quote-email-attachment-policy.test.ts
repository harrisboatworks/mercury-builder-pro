import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  fetchValidatedQuotePdf,
  validateQuotePageUrl,
  validateQuotePdfUrl,
} from "../../supabase/functions/send-quote-email/attachment-policy";

const SUPABASE_URL = "https://eutsoqdpjurknjsshxes.supabase.co";
const PDF_URL = `${SUPABASE_URL}/storage/v1/object/public/spec-sheets/quote-123.pdf`;
const QUOTE_PAGE_URL = "https://www.mercuryrepower.ca/quote/saved/123e4567-e89b-42d3-a456-426614174000";
const PDF_BYTES = new TextEncoder().encode("%PDF-1.7\nsmall test pdf");

function pdfResponse(bytes: Uint8Array = PDF_BYTES, headers: Record<string, string> = {}) {
  return new Response(bytes, {
    status: 200,
    headers: { "content-type": "application/pdf", ...headers },
  });
}

describe("quote email attachment URL policy", () => {
  it("accepts only this project's public spec-sheets HTTPS path", () => {
    expect(validateQuotePdfUrl(PDF_URL, SUPABASE_URL).toString()).toBe(PDF_URL);

    const rejected = [
      PDF_URL.replace("https:", "http:"),
      "https://example.com/quote.pdf",
      `${SUPABASE_URL}/storage/v1/object/public/other/quote.pdf`,
      `${SUPABASE_URL}/storage/v1/object/public/spec-sheets/`,
      `https://user:pass@eutsoqdpjurknjsshxes.supabase.co/storage/v1/object/public/spec-sheets/quote.pdf`,
      `https://eutsoqdpjurknjsshxes.supabase.co:444/storage/v1/object/public/spec-sheets/quote.pdf`,
      `${SUPABASE_URL}/storage/v1/object/public/spec-sheets/%2e%2e/other/quote.pdf`,
      `${PDF_URL}?download=1`,
      `${PDF_URL}#fragment`,
    ];

    for (const url of rejected) {
      expect(() => validateQuotePdfUrl(url, SUPABASE_URL)).toThrow();
    }
  });

  it("accepts only canonical saved-quote page URLs", () => {
    expect(validateQuotePageUrl(QUOTE_PAGE_URL).toString()).toBe(QUOTE_PAGE_URL);
    expect(() => validateQuotePageUrl(QUOTE_PAGE_URL.replace("https:", "http:"))).toThrow();
    expect(() => validateQuotePageUrl(QUOTE_PAGE_URL.replace("www.mercuryrepower.ca", "example.com"))).toThrow();
    expect(() => validateQuotePageUrl(`${QUOTE_PAGE_URL}?redirect=https://example.com`)).toThrow();
    expect(() => validateQuotePageUrl("https://www.mercuryrepower.ca/quote/saved/not-a-uuid")).toThrow();
  });
});

describe("quote PDF fetch policy", () => {
  it("uses no redirects and returns a bounded, signed PDF", async () => {
    const fetchImpl = vi.fn(async () => pdfResponse());
    const bytes = await fetchValidatedQuotePdf({
      rawUrl: PDF_URL,
      supabaseUrl: SUPABASE_URL,
      fetchImpl,
    });

    expect(Array.from(bytes)).toEqual(Array.from(PDF_BYTES));
    expect(fetchImpl).toHaveBeenCalledWith(
      new URL(PDF_URL),
      expect.objectContaining({ redirect: "error", signal: expect.any(AbortSignal) }),
    );
  });

  it("rejects redirects, non-PDF types, and invalid PDF signatures", async () => {
    const redirectFetch = vi.fn(async () => new Response(null, {
      status: 302,
      headers: { location: "https://example.com/payload" },
    }));
    await expect(fetchValidatedQuotePdf({
      rawUrl: PDF_URL,
      supabaseUrl: SUPABASE_URL,
      fetchImpl: redirectFetch,
    })).rejects.toThrow("status 302");

    await expect(fetchValidatedQuotePdf({
      rawUrl: PDF_URL,
      supabaseUrl: SUPABASE_URL,
      fetchImpl: async () => new Response("<html>not a pdf</html>", {
        headers: { "content-type": "text/html" },
      }),
    })).rejects.toThrow("Content-Type");

    await expect(fetchValidatedQuotePdf({
      rawUrl: PDF_URL,
      supabaseUrl: SUPABASE_URL,
      fetchImpl: async () => pdfResponse(new TextEncoder().encode("not a pdf")),
    })).rejects.toThrow("file signature");
  });

  it("rejects both advertised and streamed bodies over the byte cap", async () => {
    await expect(fetchValidatedQuotePdf({
      rawUrl: PDF_URL,
      supabaseUrl: SUPABASE_URL,
      maxBytes: 10,
      fetchImpl: async () => pdfResponse(PDF_BYTES, { "content-length": "100" }),
    })).rejects.toThrow("size limit");

    await expect(fetchValidatedQuotePdf({
      rawUrl: PDF_URL,
      supabaseUrl: SUPABASE_URL,
      maxBytes: 10,
      fetchImpl: async () => new Response(new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(PDF_BYTES.subarray(0, 6));
          controller.enqueue(PDF_BYTES.subarray(6));
          controller.close();
        },
      }), { headers: { "content-type": "application/pdf" } }),
    })).rejects.toThrow("size limit");
  });

  it("cancels response bodies rejected before consumption", async () => {
    const cancel = vi.fn();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(PDF_BYTES);
      },
      cancel,
    });

    await expect(fetchValidatedQuotePdf({
      rawUrl: PDF_URL,
      supabaseUrl: SUPABASE_URL,
      fetchImpl: async () => new Response(body, { status: 500 }),
    })).rejects.toThrow("status 500");
    expect(cancel).toHaveBeenCalledOnce();
  });

  it("aborts a stalled fetch at the configured timeout", async () => {
    const fetchImpl = vi.fn((_input: string | URL | Request, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
      }));

    await expect(fetchValidatedQuotePdf({
      rawUrl: PDF_URL,
      supabaseUrl: SUPABASE_URL,
      timeoutMs: 5,
      fetchImpl,
    })).rejects.toMatchObject({ name: "AbortError" });
  });
});

describe("send-quote-email caller contract", () => {
  it("keeps saved quote HTML out of the PDF attachment field", () => {
    const adminCaller = readFileSync(
      join(process.cwd(), "src/components/admin/SendQuoteEmail.tsx"),
      "utf8",
    );
    const edgeFunction = readFileSync(
      join(process.cwd(), "supabase/functions/send-quote-email/index.ts"),
      "utf8",
    );

    expect(adminCaller).toContain("quotePageUrl: `${SITE_URL}/quote/saved/${quoteId}`");
    expect(adminCaller).not.toContain("pdfUrl: `${SITE_URL}/quote/saved/${quoteId}`");
    expect(edgeFunction).not.toContain("fetch(emailData.pdfUrl)");
    expect(edgeFunction).toContain("fetchValidatedQuotePdf");
  });
});
