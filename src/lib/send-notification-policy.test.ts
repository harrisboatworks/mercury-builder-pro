import { describe, expect, it, vi } from 'vitest';
import {
  constantTimeTokenEqual,
  handleServiceRoleRequest,
  NOTIFICATION_LIMITS,
  validateNotificationPayload,
} from '../../supabase/functions/_shared/send-notification-policy';

const serviceRoleKey = 'service-role-test-secret';

const request = (authorization?: string) => new Request(
  'https://example.test/functions/v1/send-notification',
  {
    method: 'POST',
    headers: authorization ? { Authorization: authorization } : {},
    body: JSON.stringify({ user_id: 'attacker-controlled' }),
  },
);

const validPayload = {
  user_id: 'b792e6bf-fd61-4b0e-9b0d-f596e16681e9',
  title: 'Service update',
  message: 'Your requested service update is ready.',
  type: 'info',
  metadata: { source: 'trusted-server', attempt: 1 },
};

describe('send-notification trusted-server policy', () => {
  it('rejects missing and wrong bearer tokens before the authorized handler runs', async () => {
    for (const candidate of [
      request(),
      request(`Bearer ${'x'.repeat(serviceRoleKey.length)}`),
      request(`Basic ${serviceRoleKey}`),
    ]) {
      const authorizedHandler = vi.fn(async () => new Response('sent'));
      const response = await handleServiceRoleRequest(
        candidate,
        serviceRoleKey,
        authorizedHandler,
      );

      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
      expect(authorizedHandler).not.toHaveBeenCalled();
    }
  });

  it('fails closed when the service-role secret is not configured', async () => {
    const authorizedHandler = vi.fn(async () => new Response('sent'));
    const response = await handleServiceRoleRequest(
      request(`Bearer ${serviceRoleKey}`),
      undefined,
      authorizedHandler,
    );

    expect(response.status).toBe(401);
    expect(authorizedHandler).not.toHaveBeenCalled();
  });

  it('accepts the exact service bearer and only then runs the handler', async () => {
    const authorizedHandler = vi.fn(async () => new Response('sent', { status: 202 }));
    const response = await handleServiceRoleRequest(
      request(`Bearer ${serviceRoleKey}`),
      serviceRoleKey,
      authorizedHandler,
    );

    expect(response.status).toBe(202);
    expect(authorizedHandler).toHaveBeenCalledOnce();
  });

  it('compares the complete token without accepting same-length near matches', async () => {
    await expect(constantTimeTokenEqual(serviceRoleKey, serviceRoleKey)).resolves.toBe(true);
    await expect(constantTimeTokenEqual(
      `${serviceRoleKey.slice(0, -1)}x`,
      serviceRoleKey,
    )).resolves.toBe(false);
    await expect(constantTimeTokenEqual(`${serviceRoleKey}x`, serviceRoleKey)).resolves.toBe(false);
  });

  it('accepts a valid arbitrary-recipient payload for a trusted server caller', () => {
    expect(validateNotificationPayload(validPayload)).toEqual({
      ok: true,
      value: validPayload,
    });
  });

  it('accepts metadata exactly at the documented byte boundary', () => {
    const emptyMetadataBytes = new TextEncoder()
      .encode(JSON.stringify({ value: '' }))
      .byteLength;
    const metadata = {
      value: 'x'.repeat(NOTIFICATION_LIMITS.metadataBytes - emptyMetadataBytes),
    };

    expect(new TextEncoder().encode(JSON.stringify(metadata)).byteLength)
      .toBe(NOTIFICATION_LIMITS.metadataBytes);
    expect(validateNotificationPayload({ ...validPayload, metadata }).ok).toBe(true);
  });

  it.each([
    ['array body', []],
    ['invalid UUID', { ...validPayload, user_id: 'not-a-uuid' }],
    ['empty message', { ...validPayload, message: '   ' }],
    ['oversized message', {
      ...validPayload,
      message: 'm'.repeat(NOTIFICATION_LIMITS.messageCharacters + 1),
    }],
    ['non-string title', { ...validPayload, title: 42 }],
    ['oversized title', {
      ...validPayload,
      title: 't'.repeat(NOTIFICATION_LIMITS.titleCharacters + 1),
    }],
    ['unknown type', { ...validPayload, type: 'marketing' }],
    ['array metadata', { ...validPayload, metadata: [] }],
    ['too many metadata keys', {
      ...validPayload,
      metadata: Object.fromEntries(Array.from(
        { length: NOTIFICATION_LIMITS.metadataKeys + 1 },
        (_, index) => [`key-${index}`, index],
      )),
    }],
    ['oversized metadata', {
      ...validPayload,
      metadata: { value: 'x'.repeat(NOTIFICATION_LIMITS.metadataBytes) },
    }],
    ['prototype-sensitive metadata key', {
      ...validPayload,
      metadata: JSON.parse('{"__proto__":"blocked"}'),
    }],
  ])('rejects invalid payload: %s', (_label, payload) => {
    expect(validateNotificationPayload(payload).ok).toBe(false);
  });
});
