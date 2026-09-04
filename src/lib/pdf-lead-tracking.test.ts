import { describe, expect, it } from 'vitest';
import { buildPdfLeadIdempotencyKey, hasIdentifiedPdfCustomer } from './pdf-lead-tracking';

describe('hasIdentifiedPdfCustomer', () => {
  it('requires both a non-blank name and email', () => {
    expect(hasIdentifiedPdfCustomer({ name: 'Taylor', email: 'taylor@example.com' })).toBe(true);
    expect(hasIdentifiedPdfCustomer({ name: ' ', email: 'taylor@example.com' })).toBe(false);
    expect(hasIdentifiedPdfCustomer({ name: 'Taylor', email: ' ' })).toBe(false);
    expect(hasIdentifiedPdfCustomer({})).toBe(false);
  });
});

describe('buildPdfLeadIdempotencyKey', () => {
  it('normalizes email and remains stable for an unchanged quote snapshot', async () => {
    const snapshot = { motor: { id: 'motor-1' }, pricing: { totalCashPrice: 12345 } };

    await expect(buildPdfLeadIdempotencyKey({
      email: ' Taylor@Example.com ',
      snapshot,
    })).resolves.toBe(await buildPdfLeadIdempotencyKey({
      email: 'taylor@example.com',
      snapshot,
    }));
  });

  it('changes when either the customer or quote snapshot changes', async () => {
    const first = await buildPdfLeadIdempotencyKey({
      email: 'taylor@example.com',
      snapshot: { motor: '90 ELPT', total: 10000 },
    });
    const changedQuote = await buildPdfLeadIdempotencyKey({
      email: 'taylor@example.com',
      snapshot: { motor: '115 ELPT', total: 12000 },
    });
    const changedCustomer = await buildPdfLeadIdempotencyKey({
      email: 'alex@example.com',
      snapshot: { motor: '90 ELPT', total: 10000 },
    });

    expect(first).not.toBe(changedQuote);
    expect(first).not.toBe(changedCustomer);
    expect(first).toMatch(/^pdf_[0-9a-f]{64}$/);
  });

  it('ignores volatile PDF timestamps and object key order', async () => {
    const first = await buildPdfLeadIdempotencyKey({
      email: 'taylor@example.com',
      snapshot: {
        createdAt: '2026-08-09T10:00:00.000Z',
        validUntil: '2026-09-08T10:00:00.000Z',
        motor: { hp: 90, id: 'motor-1' },
        pricing: { totalCashPrice: 12345 },
      },
    });
    const laterRender = await buildPdfLeadIdempotencyKey({
      email: 'taylor@example.com',
      snapshot: {
        pricing: { totalCashPrice: 12345 },
        motor: { id: 'motor-1', hp: 90 },
        createdAt: '2026-08-09T10:00:02.000Z',
        validUntil: '2026-09-08T10:00:02.000Z',
      },
    });

    expect(laterRender).toBe(first);
  });
});
