// @vitest-environment happy-dom
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  toast: vi.fn(),
  trackLeadConversion: vi.fn(),
  insert: vi.fn(),
  insertResult: { data: null as { id: string } | null, error: null as { message: string } | null },
  user: { id: 'user-1', email: 'boater@example.com', user_metadata: { full_name: 'Pat' } } as
    | { id: string; email: string; user_metadata: { full_name: string } }
    | null,
  motor: { model: '115 ELPT', hp: 115, price: 14000 } as { model: string; hp: number; price: number } | null,
}));

vi.mock('@/lib/analytics', () => ({ trackLeadConversion: mocks.trackLeadConversion }));

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
    functions: { invoke: vi.fn().mockResolvedValue({ error: null }) },
  },
}));

import { useAutoSaveQuoteOnAuth } from './useAutoSaveQuoteOnAuth';

describe('useAutoSaveQuoteOnAuth writes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.insertResult = { data: null, error: null };
    mocks.user = { id: 'user-1', email: 'boater@example.com', user_metadata: { full_name: 'Pat' } };
    localStorage.clear();
    window.history.replaceState({}, '', '/quote/summary?auth_save=1');
  });

  it('retains the OAuth save request until promotion pricing is ready', async () => {
    mocks.insertResult = { data: null, error: { message: 'permission denied' } };
    const { rerender } = renderHook(({ ready }) => useAutoSaveQuoteOnAuth(ready), {
      initialProps: { ready: false },
    });
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(new URLSearchParams(window.location.search).get('auth_save')).toBe('1');
    rerender({ ready: true });
    await waitFor(() => expect(mocks.insert).toHaveBeenCalledTimes(1));
    expect(new URLSearchParams(window.location.search).has('auth_save')).toBe(false);
  });

  it('checks live readiness at the OAuth save boundary', () => {
    const canSave = vi.fn(() => false);
    renderHook(() => useAutoSaveQuoteOnAuth(canSave));
    expect(canSave).toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(new URLSearchParams(window.location.search).get('auth_save')).toBe('1');
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
    expect(mocks.trackLeadConversion).not.toHaveBeenCalled();
  });

  it('tracks an authenticated email save once, using only the confirmed saved ID', async () => {
    mocks.insertResult = { data: { id: 'saved-quote-1' }, error: null };
    const { rerender } = renderHook(() => useAutoSaveQuoteOnAuth());
    await waitFor(() => expect(mocks.trackLeadConversion).toHaveBeenCalledWith('quote_saved_email', 'saved-quote-1'));
    rerender();
    expect(mocks.trackLeadConversion).toHaveBeenCalledTimes(1);
  });

  it('does not count an authenticated save without an email address', async () => {
    mocks.user!.email = '';
    mocks.insertResult = { data: { id: 'saved-quote-1' }, error: null };
    renderHook(() => useAutoSaveQuoteOnAuth());
    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: '✓ Quote saved to your account',
    })));
    expect(mocks.trackLeadConversion).not.toHaveBeenCalled();
  });

});
