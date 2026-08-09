import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  insert: vi.fn(),
  invoke: vi.fn(),
  score: vi.fn(),
  triggerWebhooks: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { getUser: mocks.getUser },
    from: vi.fn(() => ({ insert: mocks.insert })),
    functions: { invoke: mocks.invoke },
  },
}));

vi.mock('./webhooks', () => ({
  calculateEnhancedLeadScore: mocks.score,
  triggerHotLeadWebhooks: mocks.triggerWebhooks,
}));

vi.mock('./smsTemplates', () => ({
  generateSMSMessage: vi.fn(() => 'hot lead'),
}));

import { isLeadIdempotencyConflict, saveLead } from './leadCapture';

describe('saveLead PDF idempotency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('sms_preferences', JSON.stringify({
      hotLeads: true,
      phoneNumber: '+19055550100',
    }));
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    mocks.score.mockReturnValue(85);
    mocks.triggerWebhooks.mockResolvedValue(undefined);
    mocks.invoke.mockResolvedValue({ data: {}, error: null });
  });

  it('creates and notifies once when the same PDF snapshot is retried', async () => {
    mocks.insert
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({
        error: {
          code: '23505',
          message: 'duplicate key value violates unique constraint "uq_customer_quotes_idempotency_key"',
        },
      });

    const lead = {
      customer_name: 'Taylor',
      customer_email: 'taylor@example.com',
      customer_phone: '+19055550123',
      final_price: 25000,
      lead_status: 'downloaded' as const,
      lead_source: 'pdf_download' as const,
      idempotency_key: `pdf_${'a'.repeat(64)}`,
    };

    const first = await saveLead(lead);
    const replay = await saveLead(lead);

    expect(first.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(replay).toMatchObject({ id: null, idempotent_replay: true });
    expect(mocks.insert).toHaveBeenCalledTimes(2);
    expect(mocks.triggerWebhooks).toHaveBeenCalledTimes(1);
    expect(mocks.invoke).toHaveBeenCalledTimes(1);
  });

  it('does not suppress an unrelated unique-constraint error', () => {
    expect(isLeadIdempotencyConflict({
      code: '23505',
      message: 'duplicate key value violates unique constraint "customer_quotes_pkey"',
    })).toBe(false);
  });

  it('recognizes the idempotency constraint when PostgREST reports it in details', () => {
    expect(isLeadIdempotencyConflict({
      code: '23505',
      message: 'duplicate key value violates unique constraint',
      details: 'Key (idempotency_key) already exists.',
    })).toBe(true);
  });

  it('propagates a non-conflict insert error without notifying', async () => {
    mocks.insert.mockResolvedValueOnce({
      error: { code: '57014', message: 'request timed out' },
    });

    await expect(saveLead({
      customer_name: 'Taylor',
      customer_email: 'taylor@example.com',
      final_price: 25000,
      lead_status: 'downloaded',
      lead_source: 'pdf_download',
      idempotency_key: `pdf_${'b'.repeat(64)}`,
    })).rejects.toMatchObject({ code: '57014' });

    expect(mocks.triggerWebhooks).not.toHaveBeenCalled();
    expect(mocks.invoke).not.toHaveBeenCalled();
  });
});
