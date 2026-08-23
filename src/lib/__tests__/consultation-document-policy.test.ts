import { describe, expect, it } from 'vitest';

import {
  CONSULTATION_DOCUMENT_ACCESS_ORIGIN,
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
  CONSULTATION_UPLOAD_UNAVAILABLE_ERROR,
  CONSULTATION_UPLOAD_UNAVAILABLE_STATUS,
  consultationMultipartUploadRejection,
} from '../../../supabase/functions/_shared/consultation-document-policy.ts';
import {
  CONSULTATION_ATTACHMENT_STATEMENT,
  assertConsultationAccessUrl,
  assertResolvedConsultationTemplate,
  buildQuoteEmailDestinations,
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
  it('fails closed on every multipart upload content type before any persistence', () => {
    expect(consultationMultipartUploadRejection('multipart/form-data; boundary=abc')).toEqual({
      status: CONSULTATION_UPLOAD_UNAVAILABLE_STATUS,
      body: { error: CONSULTATION_UPLOAD_UNAVAILABLE_ERROR },
    });
    expect(consultationMultipartUploadRejection('Multipart/Form-Data')).toEqual({
      status: 403,
      body: { error: 'Consultation document upload is unavailable' },
    });
    expect(consultationMultipartUploadRejection('multipart/mixed')).toEqual({
      status: 403,
      body: { error: CONSULTATION_UPLOAD_UNAVAILABLE_ERROR },
    });
    expect(consultationMultipartUploadRejection('application/json')).toBeNull();
    expect(consultationMultipartUploadRejection('application/json; charset=utf-8')).toBeNull();
    expect(consultationMultipartUploadRejection(null)).toBeNull();
    expect(consultationMultipartUploadRejection(undefined)).toBeNull();
    expect(CONSULTATION_UPLOAD_UNAVAILABLE_STATUS).toBe(403);
  });

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

  it('delivers consultation mail only to the customer with no CC or BCC', () => {
    const customerEmail = 'customer@example.com';
    const destinations = buildQuoteEmailDestinations({
      isConsultationPath: true,
      isAdminNotification: false,
      customerEmail,
      adminRecipients: ['grokbot@mercuryrepower.ca', 'info@harrisboatworks.ca'],
      auditBccRecipient: 'grokbot@mercuryrepower.ca',
    });

    expect(destinations).toEqual({ to: [customerEmail] });
    expect(destinations).not.toHaveProperty('cc');
    expect(destinations).not.toHaveProperty('bcc');
    expect(Object.keys(destinations)).toEqual(['to']);
    expect(destinations.to).toHaveLength(1);
    expect(destinations.to[0]).toBe(customerEmail);
    expect(buildQuoteEmailDestinations({
      isConsultationPath: true,
      isAdminNotification: true,
      customerEmail,
      adminRecipients: ['grokbot@mercuryrepower.ca', 'info@harrisboatworks.ca'],
      auditBccRecipient: 'grokbot@mercuryrepower.ca',
    })).toEqual({ to: [customerEmail] });

    expect(buildQuoteEmailDestinations({
      isConsultationPath: false,
      isAdminNotification: false,
      customerEmail,
      adminRecipients: ['grokbot@mercuryrepower.ca', 'info@harrisboatworks.ca'],
      auditBccRecipient: 'grokbot@mercuryrepower.ca',
    })).toEqual({ to: [customerEmail], bcc: ['grokbot@mercuryrepower.ca'] });

    expect(buildQuoteEmailDestinations({
      isConsultationPath: false,
      isAdminNotification: true,
      customerEmail,
      adminRecipients: ['grokbot@mercuryrepower.ca', 'info@harrisboatworks.ca'],
      auditBccRecipient: 'grokbot@mercuryrepower.ca',
    })).toEqual({ to: ['grokbot@mercuryrepower.ca', 'info@harrisboatworks.ca'] });
  });

  it('HTML-escapes adversarial template values and keeps the durable fragment href exact', () => {
    const html = replaceConsultationTemplateVariables(
      `<p>Hi {{customerName}}</p>
       <p>{{quoteNumber}} / {{motorModel}} / {{totalPrice}}</p>
       <p>${CONSULTATION_ATTACHMENT_STATEMENT}</p>
       <a href="{{documentAccessUrl}}">Open</a>`,
      {
        customerName: `Jay <script>alert(1)</script> & "Pat" '{{documentAccessUrl}}' <a href="https://evil.example/phish">link</a> <img src="https://evil.example/x.png" onerror="alert(1)"> &lt;already-encoded&gt;`,
        quoteNumber: 'HBW-"123"&<tag>',
        motorModel: `Mercury <img src=x onerror=alert(1)> & Co's "Pro"`,
        totalPrice: 18450,
        documentAccessUrl: accessUrl,
      },
    );

    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('<a href="https://evil.example/phish">');
    expect(html).not.toMatch(/<[^>]*onerror=/i);
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&lt;img');
    expect(html).toContain('onerror=&quot;alert(1)&quot;');
    expect(html).toContain('&lt;a href=&quot;https://evil.example/phish&quot;&gt;');
    expect(html).toContain('&amp;');
    expect(html).toContain('&quot;');
    expect(html).toContain('&#39;');
    expect(html).toContain('&amp;lt;');
    expect(html).not.toContain("{{documentAccessUrl}}");
    expect(html).toContain('&#123;&#123;documentAccessUrl&#125;&#125;');
    expect(html).toContain(`href="${accessUrl}"`);
    expect(html.includes(accessUrl)).toBe(true);
    expect(html.includes(`${CONSULTATION_DOCUMENT_ACCESS_ORIGIN}/quote/document#cd_`)).toBe(true);
    expect(html.split(accessUrl)).toHaveLength(2);
    expect(() => assertResolvedConsultationTemplate(html, accessUrl)).not.toThrow();

    expect(() => replaceConsultationTemplateVariables(
      `<p>${CONSULTATION_ATTACHMENT_STATEMENT}</p><a href="{{documentAccessUrl}}">Open</a>`,
      {
        customerName: 'Jay',
        quoteNumber: 'HBW-123456',
        motorModel: 'Mercury 150',
        totalPrice: 1000,
        documentAccessUrl: 'javascript:alert(1)',
      },
    )).toThrow();
    expect(() => replaceConsultationTemplateVariables(
      `<p>${CONSULTATION_ATTACHMENT_STATEMENT}</p><a href="{{documentAccessUrl}}">Open</a>`,
      {
        customerName: 'Jay',
        quoteNumber: 'HBW-123456',
        motorModel: 'Mercury 150',
        totalPrice: 1000,
        documentAccessUrl: 'https://evil.example/" onclick="alert(1)',
      },
    )).toThrow();
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
