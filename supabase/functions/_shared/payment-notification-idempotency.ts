const STRIPE_SESSION_PATTERN = /^cs_(?:test_|live_)?[A-Za-z0-9]+$/;

export const RESEND_RETRY_GUARD_MS = 23 * 60 * 60 * 1000;
export const SMS_ATTEMPT_LEASE_MS = 5 * 60 * 1000;

export type PaymentEmailChannel =
  | 'deposit-customer'
  | 'deposit-admin'
  | 'quote-admin';

function parseTimestamp(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function paymentNotificationAttemptedAt(
  existing: unknown,
  now = new Date(),
): string {
  const parsed = parseTimestamp(existing);
  return parsed === null ? now.toISOString() : new Date(parsed).toISOString();
}

export function paymentEmailRetryWindowExpired(
  attemptedAt: unknown,
  now = new Date(),
): boolean {
  const parsed = parseTimestamp(attemptedAt);
  return parsed !== null && now.getTime() - parsed >= RESEND_RETRY_GUARD_MS;
}

export function paymentSmsAttemptIsActive(
  status: unknown,
  attemptedAt: unknown,
  now = new Date(),
): boolean {
  const parsed = parseTimestamp(attemptedAt);
  const age = parsed === null ? Number.NaN : now.getTime() - parsed;
  return status === 'attempting'
    && Number.isFinite(age)
    && age >= 0
    && age < SMS_ATTEMPT_LEASE_MS;
}

export function paymentEmailIdempotencyKey(
  channel: PaymentEmailChannel,
  stripeSessionId: unknown,
): string {
  if (typeof stripeSessionId !== 'string' || !STRIPE_SESSION_PATTERN.test(stripeSessionId)) {
    throw new Error('Invalid Stripe session ID');
  }
  return `payment/${channel}/${stripeSessionId}`;
}
