import { describe, expect, it } from 'vitest';

import {
  customerQuoteMutationRejected,
} from '@/lib/deposit-authority-plan';

const websiteRow = {
  lead_source: 'website',
  payment_status: null,
  saved_quote_id: null,
};

describe('customer quote deposit authority plan', () => {
  it('rejects anon/authenticated non-deposit payment-column poisoning on insert and update', () => {
    expect(customerQuoteMutationRejected({
      op: 'INSERT',
      caller: 'anon',
      newRow: { ...websiteRow, payment_status: 'paid' },
    })).toBe(true);
    expect(customerQuoteMutationRejected({
      op: 'INSERT',
      caller: 'authenticated',
      newRow: { ...websiteRow, stripe_checkout_session_id: 'cs_test_poison' },
    })).toBe(true);
    expect(customerQuoteMutationRejected({
      op: 'INSERT',
      caller: 'authenticated',
      newRow: websiteRow,
    })).toBe(false);
    expect(customerQuoteMutationRejected({
      op: 'UPDATE',
      caller: 'authenticated',
      oldRow: websiteRow,
      newRow: { ...websiteRow, saved_quote_id: '11111111-1111-4111-8111-111111111111' },
    })).toBe(true);
    expect(customerQuoteMutationRejected({
      op: 'UPDATE',
      caller: 'authenticated',
      oldRow: websiteRow,
      newRow: { ...websiteRow, customer_notes: 'follow up' } as typeof websiteRow,
    })).toBe(false);
  });

  it('blocks buyer delete of a deposit packet and allows service/admin DML', () => {
    expect(customerQuoteMutationRejected({
      op: 'DELETE',
      caller: 'authenticated',
      oldRow: { lead_source: 'deposit' },
    })).toBe(true);
    expect(customerQuoteMutationRejected({
      op: 'DELETE',
      caller: 'authenticated',
      oldRow: websiteRow,
    })).toBe(false);
    expect(customerQuoteMutationRejected({
      op: 'INSERT',
      caller: 'service_role',
      newRow: { lead_source: 'deposit', payment_status: 'pending' },
    })).toBe(false);
    expect(customerQuoteMutationRejected({
      op: 'UPDATE',
      caller: 'admin',
      oldRow: { lead_source: 'deposit', payment_status: 'pending' },
      newRow: { lead_source: 'deposit', payment_status: 'paid' },
    })).toBe(false);
    expect(customerQuoteMutationRejected({
      op: 'DELETE',
      caller: 'admin',
      oldRow: { lead_source: 'deposit' },
    })).toBe(false);
  });

  it('protects deposit quote_data authority keys including the outbox marker', () => {
    const depositRow = {
      lead_source: 'deposit',
      quote_data: { deposit_outbox_schema: 1, motor_info: { model: '9.9 MH' } },
    };
    expect(customerQuoteMutationRejected({
      op: 'UPDATE',
      caller: 'authenticated',
      oldRow: depositRow,
      newRow: {
        ...depositRow,
        quote_data: { deposit_outbox_schema: 1, motor_info: { model: 'tampered' } },
      },
    })).toBe(true);
    expect(customerQuoteMutationRejected({
      op: 'UPDATE',
      caller: 'authenticated',
      oldRow: depositRow,
      newRow: {
        ...depositRow,
        quote_data: { deposit_outbox_schema: null, motor_info: { model: '9.9 MH' } },
      },
    })).toBe(true);
    expect(customerQuoteMutationRejected({
      op: 'UPDATE',
      caller: 'authenticated',
      oldRow: depositRow,
      newRow: {
        ...depositRow,
        quote_data: { ...depositRow.quote_data, customer_notes: 'ok' },
      },
    })).toBe(false);
  });
});
