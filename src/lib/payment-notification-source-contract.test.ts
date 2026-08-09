import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('payment notification delivery contract', () => {
  it('uses stable provider keys and deterministic email content', () => {
    const mailer = read('supabase/functions/send-deposit-confirmation-email/index.ts');

    expect(mailer).toContain('"Idempotency-Key": idempotencyKey');
    expect(mailer).toContain('signal: AbortSignal.timeout(15_000)');
    expect(mailer).toContain('paymentEmailIdempotencyKey("deposit-customer"');
    expect(mailer).toContain('paymentEmailIdempotencyKey("deposit-admin"');
    expect(mailer).toContain('paymentEmailIdempotencyKey(\n        "quote-admin"');
    expect(mailer).toContain('new Date(notificationTimestamp).toLocaleDateString');
    expect(mailer).toContain('new Date(notificationTimestamp).toLocaleString');
    expect(mailer).toContain('generateReferenceNumber(paymentId, notificationSessionId)');
    expect(mailer).not.toContain('Date.now()');
    expect(mailer).not.toContain('resend.emails.send');
  });

  it('records the email outcome before any secondary SMS', () => {
    const webhook = read('supabase/functions/stripe-webhook/index.ts');
    const depositEmail = webhook.indexOf('body: { stripeSessionId: session.id }');
    const depositOutcome = webhook.indexOf('const { data: notificationUpdate');
    const depositSms = webhook.indexOf('message: `Deposit email FAILED');
    const quoteEmail = webhook.indexOf('quotePaymentSessionId: session.id');
    const quoteOutcome = webhook.indexOf('const { data: quoteNotificationUpdate');
    const quoteSms = webhook.indexOf('message: `Quote payment received');
    const depositTerminalCheck = webhook.indexOf('notificationsComplete(boundQuoteData)');
    const depositClaim = webhook.indexOf('let claimQuery = supabase');
    const quoteTerminalCheck = webhook.indexOf('notificationsComplete(existingQuoteData)');
    const quoteClaim = webhook.indexOf('let quoteClaimQuery = supabase');

    expect(depositEmail).toBeGreaterThan(-1);
    expect(depositOutcome).toBeGreaterThan(depositEmail);
    expect(depositSms).toBeGreaterThan(depositOutcome);
    expect(quoteEmail).toBeGreaterThan(depositSms);
    expect(quoteOutcome).toBeGreaterThan(quoteEmail);
    expect(quoteSms).toBeGreaterThan(quoteOutcome);
    expect(depositTerminalCheck).toBeLessThan(depositClaim);
    expect(quoteTerminalCheck).toBeLessThan(quoteClaim);
    expect(webhook).toContain('notification_sms_status: "attempting"');
    expect(webhook).toContain('notification_sms_status: smsFailed ? "partial_failure" : "delivered"');
    expect(webhook).toContain('notification_sms_status: quoteSmsFailed ? "partial_failure" : "delivered"');
    expect(webhook).toContain('Deposit SMS delivery is already in progress');
    expect(webhook).toContain('Quote SMS delivery is already in progress');
  });

  it('fails over to manual follow-up before provider idempotency expires', () => {
    const webhook = read('supabase/functions/stripe-webhook/index.ts');

    expect(webhook).toContain('notification_email_attempted_at: paymentNotificationAttemptedAt(');
    expect(webhook).toContain('paymentEmailRetryWindowExpired(');
    expect(webhook).toContain('Provider idempotency retry window expired');
    expect(webhook).toContain('SMS outcome unknown after interrupted delivery');
    expect(webhook).toContain('notificationSmsOutcomeAmbiguous(');
    expect(webhook).toContain('manualFollowUp: true');
  });
});
