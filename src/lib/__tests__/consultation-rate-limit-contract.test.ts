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
    const rateLimit = read('supabase/functions/_shared/rate-limit.ts');

    const upload = extractCheck(api, 'consultation_document_upload_ip');
    const redeemIp = extractCheck(api, 'consultation_document_redeem_ip');
    const redeemToken = extractCheck(api, 'consultation_document_redeem_token');
    const emailIp = extractCheck(mailer, 'send_quote_email_ip');
    const emailRecipient = extractCheck(mailer, 'send_quote_email_recipient');
    const smsIp = extractCheck(sms, 'send_sms_ip');
    const smsRecipient = extractCheck(sms, 'send_sms_recipient');

    expect(upload).toContain('failClosed: true');
    expect(redeemIp).toContain('failClosed: true');
    expect(redeemToken).toContain('failClosed: true');
    expect(emailIp).toContain('failClosed: isConsultationPath');
    expect(emailRecipient).toContain('failClosed: isConsultationPath');
    expect(smsIp).toContain('failClosed: tokenBearing');
    expect(smsRecipient).toContain('failClosed: tokenBearing');

    expect(mailer.match(/failClosed:\s*isConsultationPath/g)?.length).toBe(2);
    expect(sms.match(/failClosed:\s*tokenBearing/g)?.length).toBe(2);
    expect(rateLimit).toContain('failClosed?: boolean');
    expect(rateLimit).toContain('default remains fail-open unless callers opt in');

    const uploadCheck = api.indexOf('consultation_document_upload_ip');
    const persistCall = api.indexOf('await persistConsultationDocument');
    expect(uploadCheck).toBeGreaterThan(-1);
    expect(persistCall).toBeGreaterThan(uploadCheck);
    expect(api).toContain('.from("consultation_documents").insert');
    expect(api).toContain('.upload(storageKey, pdfBytes');
    expect(api.split('await persistConsultationDocument').length).toBe(2);

    const emailIpAt = mailer.indexOf("action: 'send_quote_email_ip'");
    const emailRecipientAt = mailer.indexOf("action: 'send_quote_email_recipient'");
    expect(emailRecipientAt).toBeGreaterThan(emailIpAt);
    expect(mailer.indexOf('resend.emails.send(emailOptions)')).toBeGreaterThan(emailRecipientAt);

    const smsIpAt = sms.indexOf("action: 'send_sms_ip'");
    const smsRecipientAt = sms.indexOf("action: 'send_sms_recipient'");
    expect(smsRecipientAt).toBeGreaterThan(smsIpAt);
    expect(sms.indexOf('api.twilio.com')).toBeGreaterThan(smsRecipientAt);
  });
});
