import { describe, expect, it } from 'vitest';

import {
  CONSULTATION_META_MAX_BYTES,
  ConsultationDocumentRequestError,
  ConsultationDocumentUnavailableError,
  MAX_QUOTE_DOCUMENT_BYTES,
  assertConsultationStoredDocument,
  authorizeConsultationRedemption,
  canonicalConsultationDocumentPath,
  consultationDocumentAccessUrl,
  createConsultationAccessToken,
  hashConsultationToken,
  parseConsultationMultipart,
  parseConsultationRedeemRequest,
  parseConsultationUploadMeta,
  parseDurableDocumentAccessUrl,
  parseFragmentToken,
} from '../../../supabase/functions/_shared/consultation-document-policy.ts';
import {
  CONSULTATION_ATTACHMENT_STATEMENT,
  assertConsultationAccessUrl,
  assertResolvedConsultationTemplate,
  rejectConsultationCallerPdfUrl,
  replaceConsultationTemplateVariables,
} from '../../../supabase/functions/_shared/consultation-quote-email.ts';
import {
  assertTokenSafeSmsLog,
  isTokenBearingSmsMessage,
} from '../../../supabase/functions/_shared/consultation-sms-policy.ts';

const DOCUMENT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const QUOTE_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const TOKEN = `cd_${'ab'.repeat(32)}`;
const TOKEN_HASH = 'c'.repeat(64);

function validMeta(overrides: Record<string, unknown> = {}) {
  return {
    flow: 'submit',
    quoteNumber: 'HBW-123456',
    customerName: 'Jay Harris',
    customerEmail: 'jay@example.com',
    customerPhone: `+1${'9053766208'}`,
    motorModel: 'Mercury 150 FourStroke',
    totalPrice: 18450,
    customerQuoteId: QUOTE_ID,
    ...overrides,
  };
}

function pdfBytes(label = 'minimal'): Uint8Array {
  return new TextEncoder().encode(`%PDF-1.7\n${label}`);
}

function multipartBody(parts: Array<{ name: string; type?: string; value: string | Uint8Array }>): {
  contentType: string;
  body: Uint8Array;
} {
  const boundary = '----ConsultationBoundary1234';
  const chunks: Uint8Array[] = [];
  const encoder = new TextEncoder();
  for (const part of parts) {
    const header = `--${boundary}\r\nContent-Disposition: form-data; name="${part.name}"\r\nContent-Type: ${part.type || 'text/plain'}\r\n\r\n`;
    chunks.push(encoder.encode(header));
    chunks.push(typeof part.value === 'string' ? encoder.encode(part.value) : part.value);
    chunks.push(encoder.encode('\r\n'));
  }
  chunks.push(encoder.encode(`--${boundary}--\r\n`));
  const body = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0));
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { contentType: `multipart/form-data; boundary=${boundary}`, body };
}

describe('consultation document policy', () => {
  it('derives only the canonical server key', () => {
    expect(canonicalConsultationDocumentPath(DOCUMENT_ID)).toBe(`consultation/${DOCUMENT_ID}/quote.pdf`);
    expect(() => canonicalConsultationDocumentPath('../victim/quote.pdf')).toThrow(ConsultationDocumentRequestError);
    expect(() => canonicalConsultationDocumentPath('spec-sheets/temp/quote.pdf')).toThrow(ConsultationDocumentRequestError);
  });

  it('requires a real customer quote on submit and forbids one on standalone sends', () => {
    expect(parseConsultationUploadMeta(validMeta()).customerQuoteId).toBe(QUOTE_ID);
    expect(() => parseConsultationUploadMeta(validMeta({ customerQuoteId: null }))).toThrow(ConsultationDocumentRequestError);
    expect(parseConsultationUploadMeta(validMeta({ flow: 'send_email', customerQuoteId: null })).customerQuoteId).toBeNull();
    expect(parseConsultationUploadMeta(validMeta({ flow: 'send_sms', customerQuoteId: undefined })).customerQuoteId).toBeNull();
    expect(() => parseConsultationUploadMeta(validMeta({ flow: 'send_email' }))).toThrow(/cannot bind a quote/);
    expect(() => parseConsultationUploadMeta(validMeta({ flow: 'send_sms', customerQuoteId: QUOTE_ID }))).toThrow(/cannot bind a quote/);
  });

  it('rejects caller paths, malformed identity, extra upload parts, oversize, and bad MIME or magic', async () => {
    expect(() => parseConsultationUploadMeta(validMeta({ pdfUrl: 'https://example.com/quote.pdf' }))).toThrow(/paths/);
    expect(() => parseConsultationUploadMeta(validMeta({ filePath: 'temp/quote.pdf' }))).toThrow(/paths/);
    expect(() => parseConsultationUploadMeta(validMeta({ quoteNumber: 'HBW-12' }))).toThrow(ConsultationDocumentRequestError);
    expect(() => parseConsultationUploadMeta(validMeta({ customerEmail: 'not-an-email' }))).toThrow(ConsultationDocumentRequestError);
    expect(() => parseConsultationUploadMeta(validMeta({ customerPhone: '9053766208' }))).toThrow(ConsultationDocumentRequestError);

    const good = multipartBody([
      { name: 'meta', type: 'application/json', value: JSON.stringify(validMeta()) },
      { name: 'pdf', type: 'application/pdf', value: pdfBytes() },
    ]);
    const parsed = await parseConsultationMultipart(new Request('https://www.mercuryrepower.ca', {
      method: 'POST',
      headers: { 'content-type': good.contentType },
      body: good.body,
    }));
    expect(parsed.meta.flow).toBe('submit');

    const extra = multipartBody([
      { name: 'meta', type: 'application/json', value: JSON.stringify(validMeta()) },
      { name: 'pdf', type: 'application/pdf', value: pdfBytes() },
      { name: 'path', type: 'text/plain', value: 'consultation/evil/quote.pdf' },
    ]);
    await expect(parseConsultationMultipart(new Request('https://www.mercuryrepower.ca', {
      method: 'POST',
      headers: { 'content-type': extra.contentType },
      body: extra.body,
    }))).rejects.toThrow(/only metadata and a PDF/);

    const badMagic = multipartBody([
      { name: 'meta', type: 'application/json', value: JSON.stringify(validMeta()) },
      { name: 'pdf', type: 'application/pdf', value: new TextEncoder().encode('not-a-pdf') },
    ]);
    await expect(parseConsultationMultipart(new Request('https://www.mercuryrepower.ca', {
      method: 'POST',
      headers: { 'content-type': badMagic.contentType },
      body: badMagic.body,
    }))).rejects.toThrow(/signature/);

    const oversizedMeta = multipartBody([
      { name: 'meta', type: 'application/json', value: `{"pad":"${'x'.repeat(CONSULTATION_META_MAX_BYTES)}"}` },
      { name: 'pdf', type: 'application/pdf', value: pdfBytes() },
    ]);
    await expect(parseConsultationMultipart(new Request('https://www.mercuryrepower.ca', {
      method: 'POST',
      headers: { 'content-type': oversizedMeta.contentType },
      body: oversizedMeta.body,
    }))).rejects.toThrow(ConsultationDocumentRequestError);

    expect(MAX_QUOTE_DOCUMENT_BYTES).toBe(5 * 1024 * 1024);
  });

  it('returns generic unavailability for unknown, expired, and revoked tokens', async () => {
    const { token, tokenHash } = await createConsultationAccessToken();
    expect(token).toMatch(/^cd_[0-9a-f]{64}$/);
    expect(await hashConsultationToken(token)).toBe(tokenHash);
    expect(() => parseFragmentToken('cd_short')).toThrow(ConsultationDocumentUnavailableError);
    expect(() => parseConsultationRedeemRequest({ action: 'download', token })).toThrow(ConsultationDocumentUnavailableError);

    const capability = {
      documentId: DOCUMENT_ID,
      tokenHash: TOKEN_HASH,
      purpose: 'submit' as const,
      boundEmail: 'jay@example.com',
      boundPhone: '+19053766208',
      expiresAt: '2099-01-01T00:00:00.000Z',
      revokedAt: null,
    };
    expect(() => authorizeConsultationRedemption({
      capability,
      documentId: DOCUMENT_ID,
      tokenHash: 'd'.repeat(64),
    })).toThrow(ConsultationDocumentUnavailableError);
    expect(() => authorizeConsultationRedemption({
      capability: { ...capability, expiresAt: '2000-01-01T00:00:00.000Z' },
      documentId: DOCUMENT_ID,
      tokenHash: TOKEN_HASH,
    })).toThrow(ConsultationDocumentUnavailableError);
    expect(() => authorizeConsultationRedemption({
      capability: { ...capability, revokedAt: '2026-08-22T00:00:00.000Z' },
      documentId: DOCUMENT_ID,
      tokenHash: TOKEN_HASH,
    })).toThrow(ConsultationDocumentUnavailableError);
    expect(authorizeConsultationRedemption({
      capability,
      documentId: DOCUMENT_ID,
      tokenHash: TOKEN_HASH,
    })).toBe(`consultation/${DOCUMENT_ID}/quote.pdf`);
  });

  it('stores only hashed tokens and never exposes raw tokens in access metadata', () => {
    const url = consultationDocumentAccessUrl(TOKEN);
    expect(url).toBe(`https://www.mercuryrepower.ca/quote/document#${TOKEN}`);
    expect(parseDurableDocumentAccessUrl(url)).toBe(url);
    expect(() => parseDurableDocumentAccessUrl('https://www.mercuryrepower.ca/quote/document?token=cd_ab')).toThrow();
    expect(() => assertConsultationStoredDocument({
      documentId: DOCUMENT_ID,
      storageKey: `consultation/${DOCUMENT_ID}/other.pdf`,
      sha256: TOKEN_HASH,
      byteSize: 12,
      contentType: 'application/pdf',
    })).toThrow(ConsultationDocumentUnavailableError);
  });
});

describe('consultation email safety', () => {
  const accessUrl = consultationDocumentAccessUrl(TOKEN);

  it('rejects caller PDF URLs and unresolved CTAs before send', () => {
    expect(() => rejectConsultationCallerPdfUrl('https://example.supabase.co/storage/v1/object/public/spec-sheets/temp/q.pdf')).toThrow();
    expect(() => assertConsultationAccessUrl('https://example.supabase.co/storage/v1/object/sign/consultation-documents/x?token=abc')).toThrow();
    expect(assertConsultationAccessUrl(accessUrl)).toBe(accessUrl);

    const html = replaceConsultationTemplateVariables(
      `<p>${CONSULTATION_ATTACHMENT_STATEMENT}</p><a href="{{documentAccessUrl}}">Open</a>`,
      {
        customerName: 'Jay',
        quoteNumber: 'HBW-123456',
        motorModel: 'Mercury 150',
        totalPrice: 1000,
        documentAccessUrl: accessUrl,
      },
    );
    expect(() => assertResolvedConsultationTemplate(html, accessUrl)).not.toThrow();
    expect(() => assertResolvedConsultationTemplate('<p>attached</p><a href="{{documentAccessUrl}}">Open</a>', accessUrl)).toThrow(/unresolved/);
    expect(() => assertResolvedConsultationTemplate('<p>No file.</p>', accessUrl)).toThrow();
  });
});

describe('consultation SMS safety', () => {
  it('fails closed before Twilio when redacted audit text is missing', () => {
    const message = `Hi Jay! Here's your quote: ${consultationDocumentAccessUrl(TOKEN)} - Harris Boat Works`;
    expect(isTokenBearingSmsMessage(message)).toBe(true);
    expect(() => assertTokenSafeSmsLog({ message })).toThrow(/audit message is required/);
    expect(assertTokenSafeSmsLog({
      message,
      auditMessage: 'Consultation quote HBW-123456 access link sent',
    })).toBe('Consultation quote HBW-123456 access link sent');
    expect(() => assertTokenSafeSmsLog({
      message,
      auditMessage: `sent ${TOKEN}`,
    })).toThrow(/cannot include a document token/);
    expect(assertTokenSafeSmsLog({
      message: 'Thanks, we received your quote request.',
    })).toBe('Thanks, we received your quote request.');
  });
});
