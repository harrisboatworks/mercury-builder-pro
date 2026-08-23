import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  assertNoCallerDocumentPath,
  assertResendApiKeyConfigured,
  audiencesNeedingDelivery,
  claimDeliveryRow,
  classifyResendIdempotencyConflict,
  completeClaimedDelivery,
  deriveDepositMailAttachmentKey,
  formatStableDepositEmailDate,
  generateDepositReference,
  hbwDepositRecipients,
  parseResendIdempotentResponse,
  reportableDeliveryStatus,
  resendFailureCode,
  resendIdempotencyKey,
  sanitizeDeliveryError,
  seedDepositEmailDeliveryRows,
  sendResendEmailWithIdempotency,
  simulateConcurrentClaims,
} from '../../../supabase/functions/_shared/deposit-email-deliveries.ts';
import { authenticatedBrowserCors } from '../../../supabase/functions/_shared/origin-check.ts';
import {
  MAX_QUOTE_DOCUMENT_BYTES,
  assertCanonicalPaidQuoteDocument,
  QuoteDocumentUnavailableError,
} from '../../../supabase/functions/_shared/quote-document-policy.ts';

const QUOTE_ID = '11111111-1111-4111-8111-111111111111';
const DEAL_ID = '22222222-2222-4222-8222-222222222222';

function pdfBytes(label = 'mailer'): Uint8Array {
  return new TextEncoder().encode(`%PDF-1.7\n${label}`);
}

describe('deposit confirmation mailer contract', () => {
  it('rejects caller paths and public URLs and derives only the canonical private key', () => {
    expect(() => assertNoCallerDocumentPath({ quotePdfPath: 'saved-quotes/x/quote.pdf' }))
      .toThrow('Caller document paths are not accepted');
    expect(() => assertNoCallerDocumentPath({ publicUrl: 'https://example.supabase.co/storage/v1/object/public/quotes/x.pdf' }))
      .toThrow();
    expect(deriveDepositMailAttachmentKey(QUOTE_ID)).toBe(`saved-quotes/${QUOTE_ID}/quote.pdf`);
    expect(hbwDepositRecipients(['jayharris97@gmail.com', 'info@harrisboatworks.ca']))
      .toEqual(['jayharris97@gmail.com', 'info@harrisboatworks.ca']);
  });

  it('seeds three audiences and treats sent rows as terminal', () => {
    const seeds = seedDepositEmailDeliveryRows({
      customerQuoteId: DEAL_ID,
      savedQuoteId: QUOTE_ID,
    });
    expect(seeds.map((row) => row.audience)).toEqual(['customer', 'hbw', 'grok_bot']);
    expect(audiencesNeedingDelivery([
      { audience: 'customer', status: 'sent' },
      { audience: 'hbw', status: 'failed' },
    ])).toEqual(['hbw', 'grok_bot']);
    expect(audiencesNeedingDelivery([
      { audience: 'customer', status: 'sent' },
      { audience: 'hbw', status: 'sent' },
      { audience: 'grok_bot', status: 'sent' },
    ])).toEqual([]);
    expect(audiencesNeedingDelivery([
      {
        audience: 'customer',
        status: 'sending',
        claim_expires_at: '2099-01-01T00:00:00.000Z',
      },
      { audience: 'hbw', status: 'sent' },
      { audience: 'grok_bot', status: 'sent' },
    ], new Date('2026-08-23T00:00:00.000Z'))).toEqual([]);
  });

  it('lets only one concurrent claim own an audience', () => {
    const pending = { audience: 'customer' as const, status: 'pending' as const, attempt_count: 0 };
    const raced = simulateConcurrentClaims(pending, ['token-a', 'token-b'], new Date('2026-08-23T12:00:00.000Z'));
    expect(raced.winners).toBe(1);
    expect(raced.claimedBy).toBe('token-a');
    expect(claimDeliveryRow({
      audience: 'customer',
      status: 'sent',
    }, 'token-c')).toBeNull();
  });

  it('does not report sent when completion persistence fails', () => {
    expect(completeClaimedDelivery({ status: 'sending', claim_token: 'claim-1' }, 'other')).toBeNull();
    expect(reportableDeliveryStatus({ completed: null })).toBe('failed');
    expect(reportableDeliveryStatus({ completed: { status: 'sent' }, persistError: new Error('db') })).toBe('failed');
    expect(reportableDeliveryStatus({ completed: { status: 'sent' } })).toBe('sent');
  });

  it('keeps provider idempotency keys and email payload inputs stable', () => {
    expect(resendIdempotencyKey(DEAL_ID, 'customer')).toBe(`deposit-email:${DEAL_ID}:customer`);
    expect(generateDepositReference({ savedQuoteId: QUOTE_ID })).toBe('HBW-11111111');
    expect(generateDepositReference({
      paymentIntentId: 'pi_test_12345678',
      savedQuoteId: QUOTE_ID,
    })).toBe('HBW-12345678');
    expect(formatStableDepositEmailDate('2026-08-01T15:00:00.000Z'))
      .toBe(formatStableDepositEmailDate('2026-08-01T15:00:00.000Z'));
    const helper = readFileSync('supabase/functions/_shared/deposit-email-deliveries.ts', 'utf8');
    const referenceFn = helper.slice(
      helper.indexOf('export function generateDepositReference'),
      helper.indexOf('export function stableDepositTimestamp'),
    );
    expect(referenceFn).not.toContain('Date.now');
  });

  it('treats Resend concurrent-idempotency as retryable failure and never uses a fake SDK option', async () => {
    expect(parseResendIdempotentResponse({
      status: 409,
      body: { message: 'A request with this idempotency key is already in progress' },
    })).toEqual({ kind: 'concurrent' });
    expect(parseResendIdempotentResponse({
      status: 200,
      body: { id: 're_123' },
    })).toEqual({ kind: 'sent', id: 're_123' });

    const result = await sendResendEmailWithIdempotency({
      apiKey: 're_test',
      idempotencyKey: resendIdempotencyKey(DEAL_ID, 'hbw'),
      payload: {
        from: 'Harris Boat Works <deposits@example.com>',
        to: ['ops@example.com'],
        subject: 'stable',
        html: '<p>stable</p>',
      },
      fetchImpl: async (url, init) => {
        expect(String(url)).toBe('https://api.resend.com/emails');
        expect((init?.headers as Record<string, string>)['Idempotency-Key'])
          .toBe(`deposit-email:${DEAL_ID}:hbw`);
        return {
          status: 409,
          json: async () => ({ message: 'concurrent idempotency' }),
        } as Response;
      },
    });
    expect(result).toEqual({ kind: 'concurrent' });

    const mailer = readFileSync('supabase/functions/send-deposit-confirmation-email/index.ts', 'utf8');
    const helper = readFileSync('supabase/functions/_shared/deposit-email-deliveries.ts', 'utf8');
    expect(mailer).not.toMatch(/resend\.emails\.send\([\s\S]{0,300}idempotencyKey/);
    expect(helper).toContain('"Idempotency-Key": options.idempotencyKey');
    expect(helper).toContain('RESEND_EMAILS_URL');
  });

  it('redacts provider errors instead of storing raw payloads or PII', () => {
    expect(sanitizeDeliveryError(new Error('Resend failed for ada@example.com with {"html":"secret"}')))
      .not.toContain('ada@example.com');
    expect(sanitizeDeliveryError(new Error('Resend failed for ada@example.com with {"html":"secret"}')))
      .not.toContain('secret');
  });

  it('keeps the live mailer fail-closed on seed/read and claim-before-send', () => {
    const mailer = readFileSync('supabase/functions/send-deposit-confirmation-email/index.ts', 'utf8');
    expect(mailer).toContain('assertNoCallerDocumentPath(requestBody)');
    expect(mailer).toContain('deriveDepositMailAttachmentKey(savedQuote.id)');
    expect(mailer).toContain('assertCanonicalPaidQuoteDocument({');
    expect(mailer).toContain('.download(canonicalPath)');
    expect(mailer).toContain('attachments: pdfAttachment');
    expect(mailer).toContain('audiencesNeedingDelivery');
    expect(mailer).toContain('resolveDepositAudienceRecipients');
    expect(mailer).toContain('SUPABASE_URL: Deno.env.get("SUPABASE_URL")');
    expect(mailer).toContain('GROK_BOT_AGENTMAIL');
    expect(mailer).toContain('createInternalDealEmailHtml');
    expect(mailer).toContain('createGrokDealEmailHtml');
    expect(mailer).toContain('customerDepositEmailSubject');
    expect(readFileSync('supabase/functions/_shared/deposit-email-templates.ts', 'utf8')).toContain('adminDealPacketPath(savedQuoteId)');
    expect(mailer).toContain('isAuthorizedInternalRequest(req)');
    expect(mailer).toContain('requireAdmin(req, corsHeaders)');
    expect(readFileSync('supabase/functions/_shared/deposit-email-templates.ts', 'utf8')).toContain('Your reservation document is attached to this email as a PDF.');
    expect(mailer).toContain('throw new DepositEmailOutboxError()');
    expect(mailer).toContain('assertDeliveryOutboxReady(deliveryRows)');
    expect(mailer).toContain('claim_deposit_email_delivery');
    expect(mailer).toContain('complete_deposit_email_delivery');
    expect(mailer).toContain('sendResendEmailWithIdempotency');
    const sendBody = mailer.slice(mailer.indexOf('const { error: seedError }'));
    expect(sendBody.indexOf('throw new DepositEmailOutboxError()'))
      .toBeLessThan(sendBody.indexOf('await sendAudience'));
    expect(sendBody.indexOf('claim_deposit_email_delivery'))
      .toBeLessThan(sendBody.indexOf('sendResendEmailWithIdempotency({'));
    expect(sendBody.indexOf('sendResendEmailWithIdempotency({'))
      .toBeLessThan(sendBody.indexOf('complete_deposit_email_delivery'));
    expect(mailer).not.toContain('getPublicUrl');
    expect(mailer).not.toContain('bcc:');
    expect(mailer).not.toContain('This email does not attach a quote PDF.');
    const customerQuestions = 'Questions? Reply to this email or call us';
    const templates = readFileSync('supabase/functions/_shared/deposit-email-templates.ts', 'utf8');
    const customerTemplate = templates.slice(
      templates.indexOf('export function createDepositConfirmationEmailHtml'),
      templates.indexOf('export function createInternalDealEmailHtml'),
    );
    expect(customerTemplate.split(customerQuestions)).toHaveLength(2);
    expect(templates.split(customerQuestions)).toHaveLength(2);
    expect(templates.slice(templates.indexOf('export function createInternalDealEmailHtml'))).not.toContain(customerQuestions);
    expect(mailer).not.toContain(customerQuestions);
    expect(sendBody.indexOf('reportableDeliveryStatus({ completed, persistError: completeError })'))
      .toBeLessThan(sendBody.indexOf('results[audience] = "sent"'));
    expect(mailer).toContain('resolveDepositMailContact');
    expect(mailer).toContain('resolveDealAddress');
    expect(mailer).toContain('depositRecordIsPaid');
    expect(mailer).toContain('formatDealAddressForEmail');
    expect(mailer).not.toContain('parseSavedQuoteIdentity(savedQuote)');
    expect(mailer).toContain("contains(\"quote_data\", { saved_quote_id: savedQuoteDealId })");
    expect(mailer).toContain('authenticatedBrowserCors(req)');
    expect(mailer).toContain('requireAdmin(req, corsHeaders)');
    expect(mailer).toContain('assertResendApiKeyConfigured(resendApiKey)');
    expect(mailer).toContain('resendFailureCode(provider)');
    expect(mailer).toContain('catch (providerError)');
    expect(mailer).not.toContain('Access-Control-Allow-Origin": "*"');
    expect(mailer).not.toContain("Access-Control-Allow-Origin': '*'");
  });

  it('uses origin-safe CORS for admin browser calls and keeps service-to-service requests without a wildcard', () => {
    const allowed = authenticatedBrowserCors(new Request('https://edge.example/mailer', {
      headers: { origin: 'https://www.mercuryrepower.ca' },
    }));
    expect(allowed.forbiddenOrigin).toBe(false);
    expect(allowed.headers['Access-Control-Allow-Origin']).toBe('https://www.mercuryrepower.ca');
    expect(allowed.headers['Access-Control-Allow-Headers']).toContain('authorization');
    expect(allowed.headers['Access-Control-Allow-Methods']).toContain('POST');

    const internal = authenticatedBrowserCors(new Request('https://edge.example/mailer'));
    expect(internal.forbiddenOrigin).toBe(false);
    expect(internal.headers['Access-Control-Allow-Origin']).toBeUndefined();

    const attacker = authenticatedBrowserCors(new Request('https://edge.example/mailer', {
      headers: { origin: 'https://evil.example' },
    }));
    expect(attacker.forbiddenOrigin).toBe(true);
    expect(attacker.headers['Access-Control-Allow-Origin']).toBeUndefined();
  });

  it('distinguishes Resend concurrent 409 from payload mismatch and never throws on network or missing key', async () => {
    expect(classifyResendIdempotencyConflict({
      name: 'concurrent_idempotent_requests',
      message: 'A request with this idempotency key is already in progress',
    })).toBe('concurrent');
    expect(classifyResendIdempotencyConflict({
      name: 'invalid_idempotent_request',
      message: 'The payload does not match the original request',
    })).toBe('payload_mismatch');
    expect(parseResendIdempotentResponse({
      status: 409,
      body: { name: 'invalid_idempotent_request', message: 'payload mismatch for ada@example.com' },
    })).toEqual({ kind: 'payload_mismatch' });
    expect(resendFailureCode({ kind: 'payload_mismatch' })).toBe('provider_invalid_idempotent_request');
    expect(resendFailureCode({ kind: 'concurrent' })).toBe('provider_concurrent');
    expect(assertResendApiKeyConfigured('')).toBe(false);
    expect(await sendResendEmailWithIdempotency({
      apiKey: '',
      idempotencyKey: resendIdempotencyKey(DEAL_ID, 'customer'),
      payload: {
        from: 'Harris Boat Works <deposits@example.com>',
        to: ['ops@example.com'],
        subject: 'stable',
        html: '<p>stable</p>',
      },
      fetchImpl: async () => {
        throw new Error('should not fetch without an API key');
      },
    })).toEqual({ kind: 'missing_api_key' });
    expect(await sendResendEmailWithIdempotency({
      apiKey: 're_test',
      idempotencyKey: resendIdempotencyKey(DEAL_ID, 'customer'),
      payload: {
        from: 'Harris Boat Works <deposits@example.com>',
        to: ['ops@example.com'],
        subject: 'stable',
        html: '<p>stable</p>',
      },
      fetchImpl: async () => {
        throw new Error('network down');
      },
    })).toEqual({ kind: 'network' });
    expect(reportableDeliveryStatus({ completed: { status: 'sent' }, persistError: new Error('db') })).toBe('failed');
  });

  it('rehydrates a previously accepted provider id on forced retry and only mints a new id when never accepted', async () => {
    const acceptedHbwId = 're_hbw_accepted';
    const key = resendIdempotencyKey(DEAL_ID, 'hbw');
    expect(key).toBe(`deposit-email:${DEAL_ID}:hbw`);
    expect(key).not.toMatch(/attempt/);

    const payload = {
      from: 'Harris Boat Works <deposits@example.com>',
      to: ['ops@example.com'],
      subject: 'stable',
      html: '<p>stable</p>',
    };
    const fetchImpl = async (_url: string | URL | Request, init?: RequestInit) => {
      expect((init?.headers as Record<string, string>)['Idempotency-Key']).toBe(key);
      return {
        status: 200,
        json: async () => ({ id: acceptedHbwId }),
      } as Response;
    };
    const first = await sendResendEmailWithIdempotency({
      apiKey: 're_test',
      idempotencyKey: key,
      payload,
      fetchImpl,
    });
    const retried = await sendResendEmailWithIdempotency({
      apiKey: 're_test',
      idempotencyKey: key,
      payload,
      fetchImpl,
    });
    expect(first).toEqual({ kind: 'sent', id: acceptedHbwId });
    expect(retried).toEqual(first);
    expect(parseResendIdempotentResponse({
      status: 200,
      body: { id: acceptedHbwId },
    })).toEqual(first);

    const neverAccepted = parseResendIdempotentResponse({
      status: 500,
      body: { message: 'provider never accepted' },
    });
    expect(neverAccepted.kind).toBe('error');
    expect(parseResendIdempotentResponse({
      status: 200,
      body: { id: 're_hbw_first_accept' },
    })).toEqual({ kind: 'sent', id: 're_hbw_first_accept' });

    expect(audiencesNeedingDelivery([
      { audience: 'customer', status: 'sent' },
      { audience: 'hbw', status: 'sent' },
      { audience: 'grok_bot', status: 'sent' },
    ])).toEqual([]);
    expect(audiencesNeedingDelivery([
      { audience: 'customer', status: 'sent' },
      { audience: 'hbw', status: 'failed' },
      { audience: 'grok_bot', status: 'sent' },
    ])).toEqual(['hbw']);
    expect(claimDeliveryRow({
      audience: 'customer',
      status: 'sent',
      provider_id: 're_customer_accepted',
    }, 'token-reset')).toBeNull();

    const mailer = readFileSync('supabase/functions/send-deposit-confirmation-email/index.ts', 'utf8');
    const helper = readFileSync('supabase/functions/_shared/deposit-email-deliveries.ts', 'utf8');
    expect(mailer).toContain('idempotencyKey: resendIdempotencyKey(depositRecord.id, audience)');
    const keyFn = helper.slice(
      helper.indexOf('export function resendIdempotencyKey'),
      helper.indexOf('export function generateDepositReference'),
    );
    expect(keyFn).not.toContain('attempt');
  });
});

describe('paid canonical document read', () => {
  it('accepts the correct bound path/hash and rejects wrong path, hash, oversize, and non-PDF', async () => {
    const bytes = pdfBytes('bound-paid');
    const sha256 = await (await import('../../../supabase/functions/_shared/quote-document-policy.ts')).sha256Hex(bytes);
    const row = {
      id: QUOTE_ID,
      user_id: '33333333-3333-4333-8333-333333333333',
      email: 'owner@example.com',
      resume_token: 'dep_0123456789abcdef01234567',
      expires_at: '2099-01-01T00:00:00.000Z',
      is_soft_lead: false,
      deposit_status: 'paid',
      quote_pdf_path: `saved-quotes/${QUOTE_ID}/quote.pdf`,
      quote_pdf_sha256: sha256,
      quote_state: { motor: { id: 'motor-1' } },
    };

    await expect(assertCanonicalPaidQuoteDocument({
      row,
      savedQuoteId: QUOTE_ID,
      object: { bytes, contentType: 'application/pdf' },
    })).resolves.toEqual({
      path: `saved-quotes/${QUOTE_ID}/quote.pdf`,
      sha256,
    });

    await expect(assertCanonicalPaidQuoteDocument({
      row: { ...row, quote_pdf_path: `saved-quotes/${QUOTE_ID}/other.pdf` },
      savedQuoteId: QUOTE_ID,
      object: { bytes, contentType: 'application/pdf' },
    })).rejects.toBeInstanceOf(QuoteDocumentUnavailableError);

    await expect(assertCanonicalPaidQuoteDocument({
      row,
      savedQuoteId: QUOTE_ID,
      object: { bytes: pdfBytes('tampered'), contentType: 'application/pdf' },
    })).rejects.toBeInstanceOf(QuoteDocumentUnavailableError);

    await expect(assertCanonicalPaidQuoteDocument({
      row,
      savedQuoteId: QUOTE_ID,
      object: { bytes: new TextEncoder().encode('not-pdf'), contentType: 'application/pdf' },
    })).rejects.toBeInstanceOf(QuoteDocumentUnavailableError);

    await expect(assertCanonicalPaidQuoteDocument({
      row,
      savedQuoteId: QUOTE_ID,
      object: { bytes: new Uint8Array(MAX_QUOTE_DOCUMENT_BYTES + 1), contentType: 'application/pdf' },
    })).rejects.toBeInstanceOf(QuoteDocumentUnavailableError);

    await expect(assertCanonicalPaidQuoteDocument({
      row: { ...row, deposit_status: 'pending' },
      savedQuoteId: QUOTE_ID,
      object: { bytes, contentType: 'application/pdf' },
    })).rejects.toBeInstanceOf(QuoteDocumentUnavailableError);
  });
});
