// @vitest-environment happy-dom
import { lazy, Suspense, type ReactNode } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { QuoteProvider, useQuote } from '@/contexts/QuoteContext';
import PromoSelectionPage from '../PromoSelectionPage';

vi.mock('@/components/quote-builder/QuoteLayout', () => ({ QuoteLayout: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock('@/components/quote-builder/redesign/QuotePageShell', () => ({ QuotePageShell: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock('@/components/ui/page-transition', () => ({ PageTransition: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock('@/components/ui/countdown-timer', () => ({ CountdownTimer: () => null }));
vi.mock('@/hooks/useHapticFeedback', () => ({ useHapticFeedback: () => ({ triggerHaptic: () => {} }) }));
vi.mock('@/lib/analytics', () => ({ trackEvent: () => {} }));
const promo = {
  id: 'financing-only', name: 'Current financing offer', warranty_extra_years: 0,
  end_date: '2026-12-31', promo_options: null,
};
vi.mock('@/hooks/useActivePromotions', () => ({ useActivePromotions: () => ({
  promotions: [promo], loading: false, getRebateForHP: () => 0,
  getPromotionSavingsForMotor: () => 0, getSpecialFinancingRates: () => null,
}) }));

function Summary() {
  const { state } = useQuote();
  return <div data-testid="summary">{JSON.stringify({
    payment: state.selectedPaymentMethod, trade: state.tradeInInfo?.estimatedValue ?? 0,
    warranty: state.warrantyConfig,
  })}</div>;
}

beforeEach(() => localStorage.clear());

describe('cash purchase routed navigation', () => {
  it.each([0, 3725])('waits for cash selection then loads a lazy summary with trade %s', async (trade) => {
    localStorage.setItem('quoteBuilder', JSON.stringify({ timestamp: Date.now(), state: {
      motor: { id: 'test-motor', hp: 115, model: '115 ELPT ProXS', price: 17490 },
      purchasePath: 'loose', hasTradein: trade > 0,
      tradeInInfo: trade ? { hasTradeIn: true, estimatedValue: trade } : null,
      warrantyConfig: { extendedYears: 0, warrantyPrice: 0, totalYears: 3 },
    } }));
    let resolveSummary!: (module: { default: typeof Summary }) => void;
    const LazySummary = lazy(() => new Promise<{ default: typeof Summary }>(resolve => { resolveSummary = resolve; }));
    function RoutedQuote() {
      const { state } = useQuote();
      const location = useLocation();
      if (state.isLoading) return null;
      return <><output data-testid="route">{location.pathname}</output>
        <Suspense fallback={<div>Loading summary</div>}>
          <Routes location={location} key={location.pathname}>
            <Route path="/quote/promo-selection" element={<PromoSelectionPage />} />
            <Route path="/quote/summary" element={<LazySummary />} />
          </Routes>
        </Suspense></>;
    }
    render(<QuoteProvider><MemoryRouter initialEntries={['/quote/promo-selection']}><RoutedQuote /></MemoryRouter></QuoteProvider>);
    const cash = await screen.findByRole('radio', { name: /Cash Purchase/i });
    expect(screen.getByTestId('route')).toHaveTextContent('/quote/promo-selection');
    expect(screen.queryByRole('radio', { name: /^Promotional Financing/i })).not.toBeInTheDocument();
    fireEvent.click(cash);
    fireEvent.click(screen.getByRole('button', { name: /Continue to Quote/i }));
    // React Router may retain the payment page during a transition instead of
    // showing Suspense's fallback. Wait for the lazy module request itself.
    await waitFor(() => expect(resolveSummary).toBeTypeOf('function'));
    await act(async () => { resolveSummary({ default: Summary }); });
    expect(await screen.findByTestId('summary')).toBeInTheDocument();
    expect(screen.getByTestId('route')).toHaveTextContent('/quote/summary');
    expect(JSON.parse(screen.getByTestId('summary').textContent!)).toEqual({
      payment: 'cash_purchase', trade,
      warranty: { extendedYears: 0, warrantyPrice: 0, totalYears: 3 },
    });
  });
});
