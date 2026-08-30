import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

import {
  fetchValidatedQuotePdf,
  normalizeQuoteUrls,
  validateQuotePageUrl,
  validateQuotePdfUrl,
} from "../../../supabase/functions/send-quote-email/attachment-policy";

const SUPABASE_URL = "https://eutsoqdpjurknjsshxes.supabase.co";
const PDF_URL = `${SUPABASE_URL}/storage/v1/object/public/spec-sheets/quotes/quote-123.pdf`;
const QUOTE_PAGE_URL =
  "https://www.mercuryrepower.ca/quote/saved/123e4567-e89b-42d3-a456-426614174000";
const PDF_BYTES = new TextEncoder().encode("%PDF-1.7\nsmall test pdf");

function pdfResponse(
  bytes: Uint8Array = PDF_BYTES,
  headers: Record<string, string> = {},
): Response {
  return new Response(bytes, {
    status: 200,
    headers: { "content-type": "application/pdf", ...headers },
  });
}

describe("quote email URL policy", () => {
  it("accepts only this project's HTTPS public spec-sheets objects", () => {
    expect(validateQuotePdfUrl(PDF_URL, SUPABASE_URL).toString()).toBe(PDF_URL);

    const rejected = [
      PDF_URL.replace("https:", "http:"),
      "javascript:alert(1)",
      "https://example.com/quote.pdf",
      "https://eutsoqdpjurknjsshxes.supabase.co.evil.example/storage/v1/object/public/spec-sheets/q.pdf",
      "https://otherproject.supabase.co/storage/v1/object/public/spec-sheets/q.pdf",
      "https://eutsoqdpjurknjsshxes.supabase.co@evil.example/storage/v1/object/public/spec-sheets/q.pdf",
      "https://user:pass@eutsoqdpjurknjsshxes.supabase.co/storage/v1/object/public/spec-sheets/q.pdf",
      "https://eutsoqdpjurknjsshxes.supabase.co:444/storage/v1/object/public/spec-sheets/q.pdf",
      `${SUPABASE_URL}/storage/v1/object/public/other/quote.pdf`,
      `${SUPABASE_URL}/storage/v1/object/public/spec-sheets/`,
      `${SUPABASE_URL}/storage/v1/object/public/spec-sheets/quotes//quote.pdf`,
      `${SUPABASE_URL}/storage/v1/object/public/spec-sheets/%252e%252e/other/quote.pdf`,
      `${SUPABASE_URL}/storage/v1/object/public/spec-sheets/%2E%2E%2Fother/quote.pdf`,
      `${SUPABASE_URL}/storage/v1/object/public/spec-sheets/quotes%5Cother.pdf`,
      `${PDF_URL}?download=1`,
      `${PDF_URL}#fragment`,
    ];

    for (const url of rejected) {
      expect(() => validateQuotePdfUrl(url, SUPABASE_URL), url).toThrow();
    }
  });

  it("accepts only the canonical saved-quote HTTPS page", () => {
    expect(validateQuotePageUrl(QUOTE_PAGE_URL).toString()).toBe(QUOTE_PAGE_URL);
    expect(validateQuotePageUrl(
      QUOTE_PAGE_URL.replace("www.mercuryrepower.ca", "mercuryrepower.ca"),
    ).toString()).toBe(QUOTE_PAGE_URL.replace("www.mercuryrepower.ca", "mercuryrepower.ca"));

    const rejected = [
      "javascript:alert(1)",
      QUOTE_PAGE_URL.replace("https:", "http:"),
      QUOTE_PAGE_URL.replace("www.mercuryrepower.ca", "www.mercuryrepower.ca.evil.example"),
      "https://www.mercuryrepower.ca@evil.example/quote/saved/123e4567-e89b-42d3-a456-426614174000",
      QUOTE_PAGE_URL.replace("quote/saved", "admin/quotes"),
      QUOTE_PAGE_URL.replace("123e4567-e89b-42d3-a456-426614174000", "not-a-uuid"),
      `${QUOTE_PAGE_URL}?redirect=https://evil.example`,
      `${QUOTE_PAGE_URL}#javascript:alert(1)`,
    ];

    for (const url of rejected) {
      expect(() => validateQuotePageUrl(url), url).toThrow();
    }
  });

  it("reclassifies the old saved-page PDF field without fetching it", () => {
    expect(normalizeQuoteUrls({
      pdfUrl: QUOTE_PAGE_URL,
      supabaseUrl: SUPABASE_URL,
    })).toEqual({ pdfUrl: undefined, quotePageUrl: QUOTE_PAGE_URL });

    expect(normalizeQuoteUrls({
      pdfUrl: PDF_URL,
      supabaseUrl: SUPABASE_URL,
    })).toEqual({ pdfUrl: PDF_URL, quotePageUrl: undefined });

    expect(() => normalizeQuoteUrls({
      pdfUrl: "https://otherproject.supabase.co/storage/v1/object/public/spec-sheets/q.pdf",
      supabaseUrl: SUPABASE_URL,
    })).toThrow(/this project's Supabase Storage origin/);
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
    await expect(fetchValidatedQuotePdf({
      rawUrl: PDF_URL,
      supabaseUrl: SUPABASE_URL,
      fetchImpl: async () => new Response(null, {
        status: 302,
        headers: { location: "https://evil.example/payload" },
      }),
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

  it("rejects advertised and streamed bodies over the byte cap", async () => {
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

    await expect(fetchValidatedQuotePdf({
      rawUrl: PDF_URL,
      supabaseUrl: SUPABASE_URL,
      maxBytes: 10,
      fetchImpl: async () => new Response(new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(PDF_BYTES);
          controller.close();
        },
      }), {
        headers: {
          "content-type": "application/pdf",
          "content-length": "5",
        },
      }),
    })).rejects.toThrow("size limit");
  });

  it("aborts a stalled allowlisted fetch", async () => {
    const fetchImpl = vi.fn((_input: string | URL | Request, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      }));

    await expect(fetchValidatedQuotePdf({
      rawUrl: PDF_URL,
      supabaseUrl: SUPABASE_URL,
      timeoutMs: 5,
      fetchImpl,
    })).rejects.toMatchObject({ name: "AbortError" });
  });

  it("aborts a body that stalls after its first chunk", async () => {
    await expect(fetchValidatedQuotePdf({
      rawUrl: PDF_URL,
      supabaseUrl: SUPABASE_URL,
      timeoutMs: 5,
      fetchImpl: async () => new Response(new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(PDF_BYTES.subarray(0, 5));
        },
      }), { headers: { "content-type": "application/pdf" } }),
    })).rejects.toMatchObject({ name: "AbortError" });
  });
});

describe("send-quote-email source contracts", () => {
  it("keeps saved HTML out of the attachment field and renders attachment claims from success", () => {
    const adminCaller = readFileSync(
      join(process.cwd(), "src/components/admin/SendQuoteEmail.tsx"),
      "utf8",
    );
    const mailer = readFileSync(
      join(process.cwd(), "supabase/functions/send-quote-email/index.ts"),
      "utf8",
    );

    expect(adminCaller).toContain("quotePageUrl: `${SITE_URL}/quote/saved/${quoteId}`");
    expect(adminCaller).not.toContain("pdfUrl: `${SITE_URL}/quote/saved/${quoteId}`");
    expect(mailer).toContain("normalizeQuoteUrls({");
    expect(mailer).toContain("fetchValidatedQuotePdf({");
    expect(mailer).toContain("Boolean(legacyPdfAttachment)");
    expect(mailer).toContain("${hasPdfAttachment ?");
    expect(mailer).toContain("|| emailData.pdfUrl");
    expect(mailer).toContain("|| emailData.quotePageUrl");
    expect(mailer).not.toContain("fetch(emailData.pdfUrl)");
  });

  it("leaves the private consultation binding and AgentMail routing intact", () => {
    const mailer = readFileSync(
      join(process.cwd(), "supabase/functions/send-quote-email/index.ts"),
      "utf8",
    );

    expect(mailer).toContain("rejectConsultationCallerPdfUrl(emailData.pdfUrl)");
    expect(mailer).toContain("Consultation email cannot accept a caller quote page URL");
    expect(mailer).toContain("assertConsultationAccessUrl(emailData.documentAccessUrl)");
    expect(mailer).toContain("buildQuoteEmailDestinations({");
    expect(mailer).toContain("GROK_BOT_AGENTMAIL");
    expect(mailer).toContain("CONSULTATION_DOCUMENTS_BUCKET");
    expect(mailer).toContain("canonicalConsultationDocumentPath(documentId)");
    expect(mailer).toContain("constantTimeEqual(digest, binding.sha256)");
    expect(mailer).toContain("if (legacyPdfAttachment)");
    expect(mailer.indexOf("if (legacyPdfAttachment)")).toBeLessThan(
      mailer.indexOf("if (isConsultationPath) {", mailer.indexOf("if (legacyPdfAttachment)")),
    );
  });
});
