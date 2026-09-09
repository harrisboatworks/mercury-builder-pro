// @vitest-environment happy-dom
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  toast: vi.fn(),
  insert: vi.fn(),
  insertResult: { data: null as { id: string } | null, error: null as { message: string } | null },
  user: { id: 'user-1', email: 'boater@example.com', user_metadata: { full_name: 'Pat' } } as
    | { id: string; email: string; user_metadata: { full_name: string } }
    | null,
  motor: { model: '115 ELPT', hp: 115, price: 14000 } as { model: string; hp: number; price: number } | null,
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: mocks.user, loading: false }),
}));

vi.mock('@/contexts/QuoteContext', () => ({
  useQuote: () => ({
    state: { motor: mocks.motor, pdfSnapshot: null },
    getQuoteData: () => ({ motor: mocks.motor }),
  }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      if (table !== 'saved_quotes') throw new Error(`unexpected table ${table}`);
      return {
        insert: (payload: unknown) => {
          mocks.insert(payload);
          return {
            select: () => ({
              single: () => Promise.resolve(mocks.insertResult),
            }),
          };
        },
      };
    },
    functions: { invoke: vi.fn() },
  },
}));

import { useAutoSaveQuoteOnAuth } from './useAutoSaveQuoteOnAuth';

describe('useAutoSaveQuoteOnAuth writes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.insertResult = { data: null, error: null };
    window.history.replaceState({}, '', '/quote/summary?auth_save=1');
  });

  it('does not claim the quote was saved when the insert is rejected', async () => {
    mocks.insertResult = { data: null, error: { message: 'permission denied' } };

    renderHook(() => useAutoSaveQuoteOnAuth());

    await waitFor(() => {
      expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Could not save quote',
        variant: 'destructive',
      }));
    });

    expect(mocks.insert).toHaveBeenCalled();
    expect(mocks.toast).not.toHaveBeenCalledWith(expect.objectContaining({
      title: '✓ Quote saved to your account',
    }));
  });
});
