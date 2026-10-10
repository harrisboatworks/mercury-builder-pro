import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initialState, quoteReducer, type QuoteState } from '@/contexts/QuoteContext';
import { AdminQuoteControls } from './AdminQuoteControls';
import { buildLegacyQuotePdfSnapshot } from '@/lib/quote-pdf-data';

const mocks = vi.hoisted(() => ({
  state: null as any,
  isAdmin: true,
  dispatch: vi.fn(),
  insert: vi.fn(),
  toast: vi.fn(),
}));

vi.mock('@/contexts/QuoteContext', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/contexts/QuoteContext')>(),
  useQuote: () => ({
    state: mocks.state,
    dispatch: mocks.dispatch,
    getQuoteData: () => mocks.state,
  }),
}));
vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ isAdmin: mocks.isAdmin, user: { id: 'test-admin' } }),
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      insert: (payload: unknown) => {
        mocks.insert(payload);
        return {
          select: () => ({ single: async () => ({ data: { id: 'test-quote' }, error: null }) }),
          error: null,
        };
      },
    }),
  },
}));

describe('admin custom propeller quotes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isAdmin = true;
    mocks.state = {
      ...initialState,
      motor: { model: '60 ELHPT', hp: 60, msrp: 10000, price: 10000 },
      isAdminQuote: true,
      purchasePath: 'loose',
      customerName: 'Test Boater',
      customerEmail: 'boater@example.com',
      installConfig: { propellerDecision: 'reuse_existing', mounting: 'transom_bolt' },
      adminCustomItems: [{ name: 'Specific stainless propeller', price: 650 }, { name: 'Matching hub', price: 125 }],
    };
    mocks.dispatch.mockImplementation((action) => {
      mocks.state = quoteReducer(mocks.state, action);
    });
  });

  it('saves the custom choice and prices once, and restores matching PDF data', async () => {
    const { rerender } = render(<AdminQuoteControls />);
    fireEvent.change(screen.getByLabelText('Propeller'), { target: { value: 'custom_propeller' } });
    expect(mocks.state.installConfig).toEqual({ propellerDecision: 'custom_propeller', mounting: 'transom_bolt' });
    rerender(<AdminQuoteControls />);
    expect(screen.getByLabelText('Propeller')).toHaveValue('custom_propeller');
    fireEvent.click(screen.getByRole('button', { name: /Save Quote/i }));
    await waitFor(() => expect(mocks.insert).toHaveBeenCalled());

    const saved = mocks.insert.mock.calls[0][0];
    const data = JSON.parse(JSON.stringify(saved.quote_data));
    expect(data.installConfig.propellerDecision).toBe('custom_propeller');
    expect(saved.base_price).toBe(10775);
    expect(saved.final_price).toBe(12175.75);
    expect(data.accessoryBreakdown).toContainEqual(expect.objectContaining({ name: 'Propeller: Custom', price: 0 }));
    expect(data.accessoryBreakdown.filter((item: any) => item.category === 'custom')).toEqual([
      expect.objectContaining({ name: 'Specific stainless propeller', price: 650 }),
      expect.objectContaining({ name: 'Matching hub', price: 125 }),
    ]);
    expect(data.accessoryBreakdown.some((item: any) => /Use Existing|Propeller Allowance/.test(item.name))).toBe(false);

    const restored = quoteReducer(initialState, { type: 'RESTORE_QUOTE', payload: data });
    expect(restored.installConfig.propellerDecision).toBe('custom_propeller');
    const pdf = buildLegacyQuotePdfSnapshot(restored);
    expect(pdf?.accessoryBreakdown).toEqual(data.accessoryBreakdown);
    expect(pdf?.pricing.totalCashPrice).toBe(saved.final_price);
  });

  it('hides the bypass from non-admins and ordinary customer quotes', () => {
    mocks.isAdmin = false;
    const { rerender } = render(<AdminQuoteControls />);
    expect(screen.queryByLabelText('Propeller')).not.toBeInTheDocument();
    mocks.isAdmin = true;
    mocks.state.isAdminQuote = false;
    rerender(<AdminQuoteControls />);
    expect(screen.queryByLabelText('Propeller')).not.toBeInTheDocument();
  });

  it.each([
    { items: [] },
    { items: [{ name: 'Heated grip', price: 300 }, { name: 'Hub kit', price: 125 }] },
    { items: [{ name: 'Stainless propeller', price: -1 }] },
  ])('blocks saving a custom choice without a valid propeller line: $items', ({ items }) => {
    mocks.state.installConfig.propellerDecision = 'custom_propeller';
    mocks.state.adminCustomItems = items;
    render(<AdminQuoteControls />);
    fireEvent.click(screen.getByRole('button', { name: /Save Quote/i }));
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Add the custom propeller', variant: 'destructive' }));
  });

  it('leaves factory-included propellers alone', () => {
    mocks.state.motor = { model: '20 ELH', hp: 20, price: 4000 };
    render(<AdminQuoteControls />);
    expect(screen.queryByLabelText('Propeller')).not.toBeInTheDocument();
  });

  it('clears stale allowance totals and PDF lines when the decision changes', () => {
    const frozenPricing = { total: 12000 } as QuoteState['frozenPricing'];
    const pdfSnapshot = { version: 1 } as QuoteState['pdfSnapshot'];
    const state = { ...mocks.state, installConfig: { propellerDecision: 'include_allowance' }, frozenPricing, pdfSnapshot };
    const unchanged = quoteReducer(state, { type: 'SET_INSTALL_CONFIG', payload: state.installConfig });
    expect(unchanged.frozenPricing).toBe(frozenPricing);
    expect(unchanged.pdfSnapshot).toBe(pdfSnapshot);
    const changed = quoteReducer(state, {
      type: 'SET_INSTALL_CONFIG',
      payload: { ...state.installConfig, propellerDecision: 'custom_propeller' },
    });
    expect(changed.frozenPricing).toBeUndefined();
    expect(changed.pdfSnapshot).toBeUndefined();
    expect(changed.adminCustomItems).toEqual(state.adminCustomItems);
    expect(changed.selectedPromoOption).toBe(state.selectedPromoOption);
  });

  it('keeps frozen prices and finance terms for a wording-only existing-to-custom change', () => {
    const frozenPricing = { total: 12000, financingRate: 5.48 } as QuoteState['frozenPricing'];
    const state = { ...mocks.state, frozenPricing };
    const changed = quoteReducer(state, {
      type: 'SET_INSTALL_CONFIG',
      payload: { ...state.installConfig, propellerDecision: 'custom_propeller' },
    });
    expect(changed.frozenPricing).toBe(frozenPricing);
    expect(changed.installConfig.propellerDecision).toBe('custom_propeller');
  });
});
