import { describe, expect, it } from 'vitest';

import {
  MAX_QUOTE_DOCUMENT_BYTES,
  QuoteDocumentConflictError,
  QuoteDocumentRequestError,
  QuoteDocumentUnavailableError,
  assertCanonicalQuoteDocumentReady,
  assertQuoteDocumentPaymentAvailable,
  authorizeQuoteDocumentDownload,
  authorizeQuoteDocumentUpload,
  canonicalQuoteDocumentPath,
  parseResumeToken,
  quoteDocumentBinding,
  readLimitedStream,
  sha256Hex,
  validateQuotePdf,
  type QuoteDocumentSavedQuote,
} from '../../../supabase/functions/_shared/quote-document-policy';

const QUOTE_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_QUOTE_ID = '44444444-4444-4444-8444-444444444444';
const OTHER_USER_ID = '22222222-2222-4222-8222-222222222222';
const OWNER_ID = '33333333-3333-4333-8333-333333333333';
const RESUME_TOKEN = 'dep_0123456789abcdef01234567';
const DOCUMENT_SHA256 = 'a'.repeat(64);

function savedQuote(overrides: Partial<QuoteDocumentSavedQuote> = {}): QuoteDocumentSavedQuote {
  return {
    id: QUOTE_ID,
    user_id: OWNER_ID,
    email: 'owner@example.com',
    resume_token: RESUME_TOKEN,
    expires_at: '2099-01-01T00:00:00.000Z',
    is_soft_lead: false,
    deposit_status: 'pending',
    quote_pdf_path: null,
    quote_pdf_sha256: null,
    quote_state: { motor: { id: 'motor-1' } },
    ...overrides,
  };
}

function pdfBytes(label = 'minimal'): Uint8Array {
  return new TextEncoder().encode(`%PDF-1.7\n${label}`);
}

describe('private quote document policy', () => {
  it('derives one canonical key and rejects path-shaped IDs', () => {
    expect(canonicalQuoteDocumentPath(QUOTE_ID)).toBe(`saved-quotes/${QUOTE_ID}/quote.pdf`);
    expect(() => canonicalQuoteDocumentPath('../victim/quote.pdf')).toThrow(QuoteDocumentRequestError);
    expect(() => canonicalQuoteDocumentPath(`${QUOTE_ID}/victim`)).toThrow(QuoteDocumentRequestError);
    expect(() => canonicalQuoteDocumentPath('deposit-quotes/other-object.pdf')).toThrow(QuoteDocumentRequestError);
  });

  it('requires a bounded high-entropy resume capability', () => {
    expect(parseResumeToken(RESUME_TOKEN)).toBe(RESUME_TOKEN);
    expect(() => parseResumeToken('short')).toThrow(QuoteDocumentRequestError);
    expect(() => parseResumeToken('a'.repeat(129))).toThrow(QuoteDocumentRequestError);
    expect(() => parseResumeToken('dep_not-hex-not-hex-not-hex')).toThrow(QuoteDocumentRequestError);
  });

  it('authorizes upload only for the owner or matching resume capability', () => {
    const path = `saved-quotes/${QUOTE_ID}/quote.pdf`;
    expect(authorizeQuoteDocumentUpload({
      row: savedQuote(),
      savedQuoteId: QUOTE_ID,
      user: { id: OWNER_ID },
    })).toBe(path);
    expect(authorizeQuoteDocumentUpload({
      row: savedQuote({ user_id: null }),
      savedQuoteId: QUOTE_ID,
      resumeToken: RESUME_TOKEN,
    })).toBe(path);
    expect(() => authorizeQuoteDocumentUpload({
      row: savedQuote(),
      savedQuoteId: QUOTE_ID,
      resumeToken: 'dep_abcdef0123456789abcdef01',
      user: { id: OTHER_USER_ID },
    })).toThrow(QuoteDocumentUnavailableError);
    expect(() => authorizeQuoteDocumentUpload({
      row: savedQuote(),
      savedQuoteId: QUOTE_ID,
    })).toThrow(QuoteDocumentUnavailableError);
  });

  it('rejects a wrong quote ID even with a matching capability', () => {
    expect(() => authorizeQuoteDocumentUpload({
      row: savedQuote(),
      savedQuoteId: OTHER_QUOTE_ID,
      resumeToken: RESUME_TOKEN,
    })).toThrow(QuoteDocumentRequestError);
  });

  it.each([
    { is_soft_lead: true },
    { expires_at: '2020-01-01T00:00:00.000Z' },
    { deposit_status: 'paid' },
    { quote_state: {} },
  ])('rejects unavailable upload rows: %o', (override) => {
    expect(() => authorizeQuoteDocumentUpload({
      row: savedQuote(override),
      savedQuoteId: QUOTE_ID,
      resumeToken: RESUME_TOKEN,
      now: new Date('2026-08-09T00:00:00.000Z'),
    })).toThrow(QuoteDocumentUnavailableError);
  });

  it('rechecks expiry, paid state, soft-lead, and missing motor at payment time', () => {
    expect(() => assertQuoteDocumentPaymentAvailable({
      row: savedQuote(),
      savedQuoteId: QUOTE_ID,
      now: new Date('2026-08-09T00:00:00.000Z'),
    })).not.toThrow();
    expect(() => assertQuoteDocumentPaymentAvailable({
      row: savedQuote({ expires_at: '2026-08-08T23:59:59.000Z' }),
      savedQuoteId: QUOTE_ID,
      now: new Date('2026-08-09T00:00:00.000Z'),
    })).toThrow(QuoteDocumentUnavailableError);
    expect(() => assertQuoteDocumentPaymentAvailable({
      row: savedQuote({ is_soft_lead: true }),
      savedQuoteId: QUOTE_ID,
      now: new Date('2026-08-09T00:00:00.000Z'),
    })).toThrow(QuoteDocumentUnavailableError);
    expect(() => assertQuoteDocumentPaymentAvailable({
      row: savedQuote({ deposit_status: 'paid' }),
      savedQuoteId: QUOTE_ID,
      now: new Date('2026-08-09T00:00:00.000Z'),
    })).toThrow(QuoteDocumentUnavailableError);
    expect(() => assertQuoteDocumentPaymentAvailable({
      row: savedQuote({ quote_state: { package: {} } }),
      savedQuoteId: QUOTE_ID,
      now: new Date('2026-08-09T00:00:00.000Z'),
    })).toThrow(QuoteDocumentUnavailableError);
  });

  it('keeps download authority with the owner, confirmed matching email, or admin', () => {
    const canonicalPath = canonicalQuoteDocumentPath(QUOTE_ID);
    const row = savedQuote({
      quote_pdf_path: canonicalPath,
      quote_pdf_sha256: DOCUMENT_SHA256,
    });
    expect(authorizeQuoteDocumentDownload({
      row,
      savedQuoteId: QUOTE_ID,
      user: { id: OWNER_ID },
    })).toBe(canonicalPath);
    expect(authorizeQuoteDocumentDownload({
      row: savedQuote({
        user_id: null,
        quote_pdf_path: canonicalPath,
        quote_pdf_sha256: DOCUMENT_SHA256,
      }),
      savedQuoteId: QUOTE_ID,
      user: {
        id: OTHER_USER_ID,
        email: 'OWNER@example.com',
        emailConfirmedAt: '2026-08-09T00:00:00.000Z',
      },
    })).toBe(canonicalPath);
    expect(authorizeQuoteDocumentDownload({
      row,
      savedQuoteId: QUOTE_ID,
      user: { id: OTHER_USER_ID, isAdmin: true },
    })).toBe(canonicalPath);
    expect(() => authorizeQuoteDocumentDownload({
      row,
      savedQuoteId: QUOTE_ID,
      user: { id: OTHER_USER_ID, email: 'attacker@example.com' },
    })).toThrow(QuoteDocumentUnavailableError);
    expect(() => authorizeQuoteDocumentDownload({
      row,
      savedQuoteId: QUOTE_ID,
      user: null,
    })).toThrow(QuoteDocumentUnavailableError);
  });

  it('requires the canonical binding before download', () => {
    expect(() => authorizeQuoteDocumentDownload({
      row: savedQuote({
        quote_pdf_path: `deposit-quotes/${QUOTE_ID}.pdf`,
        quote_pdf_sha256: DOCUMENT_SHA256,
      }),
      savedQuoteId: QUOTE_ID,
      user: { id: OWNER_ID },
    })).toThrow(QuoteDocumentUnavailableError);
  });

  it('rejects off-contract or half-bound stored paths', () => {
    expect(quoteDocumentBinding({
      row: savedQuote(),
      savedQuoteId: QUOTE_ID,
    })).toEqual({ path: null, sha256: null });
    expect(() => quoteDocumentBinding({
      row: savedQuote({
        quote_pdf_path: `deposit-quotes/${QUOTE_ID}.pdf`,
        quote_pdf_sha256: DOCUMENT_SHA256,
      }),
      savedQuoteId: QUOTE_ID,
    })).toThrow(QuoteDocumentConflictError);
    expect(() => quoteDocumentBinding({
      row: savedQuote({
        quote_pdf_path: canonicalQuoteDocumentPath(QUOTE_ID),
        quote_pdf_sha256: null,
      }),
      savedQuoteId: QUOTE_ID,
    })).toThrow(QuoteDocumentConflictError);
  });

  it('accepts only bounded PDF bytes with a PDF signature', () => {
    const pdf = pdfBytes();
    expect(() => validateQuotePdf(pdf, 'application/pdf')).not.toThrow();
    expect(() => validateQuotePdf(pdf, 'text/plain')).toThrow(QuoteDocumentRequestError);
    expect(() => validateQuotePdf(new TextEncoder().encode('not-pdf'), 'application/pdf'))
      .toThrow(QuoteDocumentRequestError);
    expect(() => validateQuotePdf(new Uint8Array(MAX_QUOTE_DOCUMENT_BYTES + 1), 'application/pdf'))
      .toThrow(QuoteDocumentRequestError);
  });

  it('hashes identical content deterministically for idempotent retries', async () => {
    const first = pdfBytes('same');
    const second = pdfBytes('same');
    const different = pdfBytes('different');
    await expect(sha256Hex(first)).resolves.toBe(await sha256Hex(second));
    await expect(sha256Hex(first)).resolves.not.toBe(await sha256Hex(different));
  });

  it('caps streamed uploads even when Content-Length is missing or understated', async () => {
    const overLimit = new Uint8Array(MAX_QUOTE_DOCUMENT_BYTES + 64);
    overLimit.set(new TextEncoder().encode('%PDF-'));
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(overLimit.subarray(0, 1024));
        controller.enqueue(overLimit.subarray(1024));
        controller.close();
      },
    });
    await expect(readLimitedStream(stream)).rejects.toBeInstanceOf(QuoteDocumentRequestError);

    const valid = pdfBytes('stream');
    await expect(readLimitedStream(new Blob([valid]).stream())).resolves.toEqual(valid);
  });

  it('fails closed on missing objects, digest mismatch, and wrong MIME at payment time', async () => {
    const bytes = pdfBytes('bound');
    const sha256 = await sha256Hex(bytes);
    const row = savedQuote({
      quote_pdf_path: canonicalQuoteDocumentPath(QUOTE_ID),
      quote_pdf_sha256: sha256,
    });

    await expect(assertCanonicalQuoteDocumentReady({
      row,
      savedQuoteId: QUOTE_ID,
      object: { bytes, contentType: 'application/pdf' },
    })).resolves.toEqual({
      path: canonicalQuoteDocumentPath(QUOTE_ID),
      sha256,
    });

    await expect(assertCanonicalQuoteDocumentReady({
      row,
      savedQuoteId: QUOTE_ID,
      object: null,
    })).rejects.toBeInstanceOf(QuoteDocumentUnavailableError);

    await expect(assertCanonicalQuoteDocumentReady({
      row,
      savedQuoteId: QUOTE_ID,
      object: { bytes: pdfBytes('tampered'), contentType: 'application/pdf' },
    })).rejects.toBeInstanceOf(QuoteDocumentUnavailableError);

    await expect(assertCanonicalQuoteDocumentReady({
      row,
      savedQuoteId: QUOTE_ID,
      object: { bytes, contentType: 'application/octet-stream' },
    })).rejects.toBeInstanceOf(QuoteDocumentUnavailableError);
  });
});
