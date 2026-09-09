/// <reference types="node" />

import { readFileSync } from 'node:fs';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const QUOTE_ID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';

const customerQuote = {
  id: QUOTE_ID,
  created_at: '2026-01-15T12:00:00Z',
  customer_name: 'Pat Boater',
  customer_email: 'pat@example.com',
  customer_phone: '9055550100',
  base_price: 20000,
  final_price: 18000,
  deposit_amount: 0,
  loan_amount: 0,
  monthly_payment: 0,
  term_months: 0,
  total_cost: 18000,
  tradein_value_pre_penalty: 2000,
  tradein_value_final: 2000,
  admin_discount: 0,
  admin_notes: '',
  customer_notes: '',
  quote_data: {
    motor: { model: '115 ELPT', hp: 115 },
    tradeInInfo: {
      hasTradeIn: true,
      estimatedValue: 2000,
      year: 2018,
      brand: 'Mercury',
    },
  },
};

const mocks = vi.hoisted(() => ({
  toast: vi.fn(),
  navigate: vi.fn(),
  dispatch: vi.fn(),
  customerQuotesUpdate: vi.fn(),
  savedQuotesUpdate: vi.fn(),
  changeLogInsert: vi.fn(),
  savedQuotesUpdateError: null as { message: string } | null,
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: QUOTE_ID }),
  useNavigate: () => mocks.navigate,
}));

vi.mock('@/contexts/QuoteContext', () => ({
  useQuote: () => ({ dispatch: mocks.dispatch }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'admin-1' } }),
}));

vi.mock('@/hooks/useActivePromotions', () => ({
  useActivePromotions: () => ({ promotions: [] }),
}));

vi.mock('@/components/admin/AdminNav', () => ({
  default: () => <div>Admin nav</div>,
}));

vi.mock('@/components/admin/QuoteChangeLog', () => ({
  QuoteChangeLog: () => null,
}));

vi.mock('@/components/admin/QuoteHistoryTimeline', () => ({
  default: () => null,
}));

vi.mock('@/components/admin/ContactLog', () => ({
  default: () => null,
}));

vi.mock('@/components/admin/FollowUpReminder', () => ({
  default: () => null,
}));

vi.mock('@/components/admin/SendQuoteEmail', () => ({
  default: () => null,
}));

vi.mock('@/components/quote-builder/SubmittedQuote', () => ({
  default: () => null,
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'customer_quotes') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: customerQuote, error: null }),
            }),
          }),
          update: (payload: unknown) => {
            mocks.customerQuotesUpdate(payload);
            return {
              eq: () => Promise.resolve({ error: null }),
            };
          },
        };
      }
      if (table === 'saved_quotes') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
          update: (payload: unknown) => {
            mocks.savedQuotesUpdate(payload);
            return {
              eq: () => Promise.resolve({ error: mocks.savedQuotesUpdateError }),
              contains: () => Promise.resolve({ error: mocks.savedQuotesUpdateError }),
            };
          },
        };
      }
      if (table === 'quote_change_log') {
        return {
          insert: (payload: unknown) => {
            mocks.changeLogInsert(payload);
            return Promise.resolve({ error: null });
          },
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  },
}));

import AdminQuoteDetail from './AdminQuoteDetail';

const source = readFileSync('src/pages/AdminQuoteDetail.tsx', 'utf8');

async function saveTradeInOverride(value: string) {
  const heading = await screen.findByRole('heading', { name: 'Trade-In' });
  fireEvent.click(within(heading).getByRole('button'));
  fireEvent.change(screen.getByPlaceholderText('Enter override value...'), {
    target: { value },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
}

describe('AdminQuoteDetail trade-in writes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.savedQuotesUpdateError = null;
  });

  it('writes quote_state on saved_quotes, not quote_data', async () => {
    render(<AdminQuoteDetail />);

    await saveTradeInOverride('2500');

    await waitFor(() => {
      expect(mocks.savedQuotesUpdate).toHaveBeenCalled();
    });

    const savedPayload = mocks.savedQuotesUpdate.mock.calls[0][0] as Record<string, unknown>;
    expect(savedPayload).toHaveProperty('quote_state');
    expect(savedPayload).not.toHaveProperty('quote_data');
    expect(mocks.customerQuotesUpdate).toHaveBeenCalledWith(expect.objectContaining({
      quote_data: expect.objectContaining({
        tradeInInfo: expect.objectContaining({ overrideValue: 2500 }),
      }),
    }));
  });

  it('toasts when the saved_quotes dual-write is rejected', async () => {
    mocks.savedQuotesUpdateError = { message: 'column quote_data does not exist' };

    render(<AdminQuoteDetail />);

    await saveTradeInOverride('2500');

    await waitFor(() => {
      expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Saved quote copy not updated',
        variant: 'destructive',
      }));
    });

    expect(mocks.savedQuotesUpdate).toHaveBeenCalledWith(expect.objectContaining({
      quote_state: expect.any(Object),
    }));
  });

  it('does not write quote_data onto saved_quotes or filter on a nonexistent customer_quote_id', () => {
    expect(source).toContain(".from('saved_quotes')");
    expect(source).toContain('update({ quote_state: updatedQuoteData })');
    expect(source).toContain(".contains('quote_state', { customerQuoteId: q.id })");
    expect(source).not.toContain("update({ quote_data: updatedQuoteData })");
    // The column does not exist on saved_quotes. Pin the query shape rather than the
    // whole file, so the explanatory comment naming the wrong column can stay.
    expect(source).not.toContain(".eq('customer_quote_id'");
    expect(source).not.toContain('.eq("customer_quote_id"');
    expect(source).not.toContain("customer_quote_id:");
  });
});
