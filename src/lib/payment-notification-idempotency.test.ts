import { describe, expect, it } from 'vitest';

import {
  RESEND_RETRY_GUARD_MS,
  SMS_ATTEMPT_LEASE_MS,
  paymentEmailIdempotencyKey,
  paymentEmailRetryWindowExpired,
  paymentNotificationAttemptedAt,
  paymentSmsAttemptIsActive,
} from '../../supabase/functions/_shared/payment-notification-idempotency';

describe('payment notification idempotency policy', () => {
  it('derives a stable provider key from the payment session and channel', () => {
    expect(paymentEmailIdempotencyKey('deposit-customer', 'cs_test_abc123'))
      .toBe('payment/deposit-customer/cs_test_abc123');
    expect(paymentEmailIdempotencyKey('deposit-admin', 'cs_test_abc123'))
      .toBe('payment/deposit-admin/cs_test_abc123');
    expect(paymentEmailIdempotencyKey('quote-admin', 'cs_live_xyz789'))
      .toBe('payment/quote-admin/cs_live_xyz789');
    expect(() => paymentEmailIdempotencyKey('deposit-admin', '../other-event'))
      .toThrow('Invalid Stripe session ID');
  });

  it('preserves the first valid attempt time so retries render identical mail', () => {
    const firstAttempt = '2026-08-09T12:00:00.000Z';
    const later = new Date('2026-08-09T12:05:00.000Z');

    expect(paymentNotificationAttemptedAt(firstAttempt, later)).toBe(firstAttempt);
    expect(paymentNotificationAttemptedAt('invalid', later)).toBe(later.toISOString());
  });

  it('stops automatic retries before the provider key can expire', () => {
    const firstAttempt = '2026-08-09T00:00:00.000Z';
    const justInside = new Date(Date.parse(firstAttempt) + RESEND_RETRY_GUARD_MS - 1);
    const atBoundary = new Date(Date.parse(firstAttempt) + RESEND_RETRY_GUARD_MS);

    expect(paymentEmailRetryWindowExpired(firstAttempt, justInside)).toBe(false);
    expect(paymentEmailRetryWindowExpired(firstAttempt, atBoundary)).toBe(true);
    expect(paymentEmailRetryWindowExpired(undefined, atBoundary)).toBe(false);
  });

  it('distinguishes an in-flight SMS from an abandoned attempt', () => {
    const attemptedAt = '2026-08-09T12:00:00.000Z';
    const inFlight = new Date(Date.parse(attemptedAt) + SMS_ATTEMPT_LEASE_MS - 1);
    const abandoned = new Date(Date.parse(attemptedAt) + SMS_ATTEMPT_LEASE_MS);

    expect(paymentSmsAttemptIsActive('attempting', attemptedAt, inFlight)).toBe(true);
    expect(paymentSmsAttemptIsActive('attempting', attemptedAt, abandoned)).toBe(false);
    expect(paymentSmsAttemptIsActive('delivered', attemptedAt, inFlight)).toBe(false);
    expect(paymentSmsAttemptIsActive('attempting', undefined, inFlight)).toBe(false);
  });
});
