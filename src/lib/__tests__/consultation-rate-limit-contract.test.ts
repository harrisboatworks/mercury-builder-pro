import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { probeRateLimit } from '../../../supabase/functions/_shared/rate-limit-probe.ts';

const read = (path: string) => readFileSync(path, 'utf8');

const PROBE_OPTS = {
  identifier: '127.0.0.1',
  action: 'consultation_document_upload_ip',
  maxAttempts: 20,
  windowMinutes: 15,
};

function extractCheck(source: string, action: string): string {
  const actionAt = source.indexOf(action);
  expect(actionAt).toBeGreaterThan(-1);
  const blockStart = source.lastIndexOf('checkRateLimit', actionAt);
  const blockEnd = source.indexOf('});', actionAt);
  expect(blockStart).toBeGreaterThan(-1);
  expect(blockEnd).toBeGreaterThan(blockStart);
  return source.slice(blockStart, blockEnd + 3);
}

describe('rate-limit probe unavailability', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fails open by default when the client is missing, the RPC errors, or the helper throws', async () => {
    const rpcErrorClient = { rpc: vi.fn(async () => ({ data: null, error: { message: 'unavailable' } })) };
    const thrownClient = { rpc: vi.fn(async () => { throw new Error('probe exploded'); }) };

    expect(await probeRateLimit(null, PROBE_OPTS)).toBe(true);
    expect(await probeRateLimit(rpcErrorClient, PROBE_OPTS)).toBe(true);
    expect(await probeRateLimit(thrownClient, PROBE_OPTS)).toBe(true);
    expect(await probeRateLimit(null, { ...PROBE_OPTS, failClosed: false })).toBe(true);
  });

  it('fails closed on missing-client, RPC-error, and thrown-exception when opted in', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const rpcErrorClient = { rpc: vi.fn(async () => ({ data: true, error: { message: 'unavailable' } })) };
    const thrownClient = { rpc: vi.fn(async () => { throw new Error('probe exploded'); }) };

    expect(await probeRateLimit(null, { ...PROBE_OPTS, failClosed: true })).toBe(false);
    expect(await probeRateLimit(rpcErrorClient, { ...PROBE_OPTS, failClosed: true })).toBe(false);
    expect(await probeRateLimit(thrownClient, { ...PROBE_OPTS, failClosed: true })).toBe(false);
    expect(warn).toHaveBeenCalled();
  });

  it('honors an explicit RPC allow or deny when the probe succeeds', async () => {
    const allowClient = { rpc: vi.fn(async () => ({ data: true, error: null })) };
    const denyClient = { rpc: vi.fn(async () => ({ data: false, error: null })) };

    expect(await probeRateLimit(allowClient, { ...PROBE_OPTS, failClosed: true })).toBe(true);
    expect(await probeRateLimit(denyClient, { ...PROBE_OPTS, failClosed: true })).toBe(false);
    expect(await probeRateLimit(denyClient, PROBE_OPTS)).toBe(false);
  });
});

describe('consultation rate-limit call-site contract', () => {
  it('fail-closes every consultation side-effect boundary before persistence or provider delivery', () => {
    const api = read('supabase/functions/consultation-document-api/index.ts');
    const mailer = read('supabase/functions/send-quote-email/index.ts');
    const sms = read('supabase/functions/send-sms/index.ts');
    const submit = read('supabase/functions/submit-quote-lead/index.ts');
    const retention = read('supabase/functions/consultation-document-retention/index.ts');
    const rateLimit = read('supabase/functions/_shared/rate-limit.ts');

    const redeemIp = extractCheck(api, 'consultation_document_redeem_ip');
    const redeemToken = extractCheck(api, 'consultation_document_redeem_token');
    const emailIp = extractCheck(mailer, 'send_quote_email_ip');
    const emailRecipient = extractCheck(mailer, 'send_quote_email_recipient');
    const smsIp = extractCheck(sms, 'send_sms_ip');
    const smsRecipient = extractCheck(sms, 'send_sms_recipient');
    const submitIp = extractCheck(submit, 'submit_quote_lead_ip');
    const submitEmail = extractCheck(submit, 'submit_quote_lead_email');
    const retentionIp = extractCheck(retention, 'consultation_document_retention_ip');

    expect(redeemIp).toContain('failClosed: true');
    expect(redeemToken).toContain('failClosed: true');
    expect(emailIp).toContain('failClosed: isConsultationPath');
    expect(emailRecipient).toContain('failClosed: isConsultationPath');
    expect(smsIp).toContain('failClosed: tokenBearing');
    expect(smsRecipient).toContain('failClosed: tokenBearing');
    expect(submitIp).toContain('failClosed: true');
    expect(submitEmail).toContain('failClosed: true');
    expect(retentionIp).toContain('failClosed: true');

    expect(mailer.match(/failClosed:\s*isConsultationPath/g)?.length).toBe(2);
    expect(sms.match(/failClosed:\s*tokenBearing/g)?.length).toBe(2);
    expect(rateLimit).toContain('failClosed?: boolean');
    expect(rateLimit).toContain('default remains fail-open unless callers opt in');

    const uploadClosed = api.indexOf('consultationMultipartUploadRejection');
    const createClientAt = api.indexOf('createClient(supabaseUrl, serviceRoleKey');
    const redeemParse = api.indexOf('const { token } = parseConsultationRedeemRequest(body);');
    expect(uploadClosed).toBeGreaterThan(-1);
    expect(createClientAt).toBeGreaterThan(uploadClosed);
    expect(redeemParse).toBeGreaterThan(createClientAt);
    expect(api).not.toContain('consultation_document_upload_ip');
    expect(api).not.toContain('persistConsultationDocument');
    expect(api).not.toContain('.from("consultation_documents").insert');
    expect(api).not.toContain('.upload(storageKey, pdfBytes');

    const emailIpAt = mailer.indexOf("action: 'send_quote_email_ip'");
    const emailRecipientAt = mailer.indexOf("action: 'send_quote_email_recipient'");
    expect(emailRecipientAt).toBeGreaterThan(emailIpAt);
    expect(mailer.indexOf('resend.emails.send(emailOptions)')).toBeGreaterThan(emailRecipientAt);

    const smsIpAt = sms.indexOf("action: 'send_sms_ip'");
    const smsRecipientAt = sms.indexOf("action: 'send_sms_recipient'");
    const smsOutboxAt = sms.indexOf("status: 'pending'");
    expect(smsRecipientAt).toBeGreaterThan(smsIpAt);
    expect(smsOutboxAt).toBeGreaterThan(smsRecipientAt);
    expect(sms.indexOf('api.twilio.com')).toBeGreaterThan(smsOutboxAt);
    expect(sms).toContain('assertPublicConsultationSmsAllowed');

    const turnstileAt = submit.indexOf('verifyTurnstileToken');
    const insertAt = submit.indexOf('.from("customer_quotes")');
    const mintAt = submit.indexOf('await mintConsultationDocument');
    const resendAt = submit.indexOf('resend.emails.send');
    const submitIpAt = submit.indexOf('submit_quote_lead_ip');
    expect(turnstileAt).toBeGreaterThan(-1);
    expect(submitIpAt).toBeGreaterThan(turnstileAt);
    expect(insertAt).toBeGreaterThan(submitIpAt);
    const savedAt = submit.indexOf('.from("saved_quotes")');
    expect(mintAt).toBeGreaterThan(insertAt);
    expect(savedAt).toBeGreaterThan(insertAt);
    expect(mintAt).toBeGreaterThan(savedAt);
    expect(resendAt).toBeGreaterThan(mintAt);
    expect(submit).toContain('consultationSubmitCustomerDestinations(String(data.customer_email))');
    expect(submit).toContain('consultationPdfBase64(minted.pdfBytes)');
    expect(submit).toContain('assertResendAccepted');
    expect(submit).toContain('parseConsultationCallerQuoteSnapshot');
    // Internal attachments use a server-minted ID; public callers cannot select or receive it.
    expect(submit).not.toMatch(/(?:p|raw)\.documentId/);
    expect(submit).not.toContain('success: true, documentId');
  });
});
