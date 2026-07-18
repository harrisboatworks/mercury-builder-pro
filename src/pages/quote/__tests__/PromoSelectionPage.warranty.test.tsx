// @vitest-environment happy-dom
/**
 * End-to-end-ish integration test for the "Choose your bonus" step.
 *
 * Covers the recent warranty-copy fix:
 *  - When the active promotion has bonus warranty years, the badge shows
 *    "{3 + bonus} Years Factory Warranty" and "3 years standard + {bonus}
 *    years FREE extension".
 *  - When the active promotion has NO bonus warranty years, the entire
 *    warranty badge is hidden (no hardcoded "7 Years").
 *  - On "Continue to Quote", the dispatched SET_WARRANTY_CONFIG
 *    payload records totalYears = 3 + bonus, so the saved quote summary
 *    reflects the currently-active promotion (not a stale 7-year value).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

// --- Mocks: keep the render surface tiny so we can focus on the copy + dispatch contract ---

const navigateMock = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('@/components/quote-builder/QuoteLayout', () => ({
  QuoteLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/quote-builder/redesign/QuotePageShell', () => ({
  QuotePageShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/ui/page-transition', () => ({
  PageTransition: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/ui/countdown-timer', () => ({
  CountdownTimer: () => <div data-testid="countdown" />,
}));
vi.mock('@/assets/mercury-logo.png', () => ({ default: 'mercury-logo.png' }));

vi.mock('@/hooks/useHapticFeedback', () => ({
  useHapticFeedback: () => ({ triggerHaptic: vi.fn() }),
}));

const dispatchMock = vi.fn();
const baseQuoteState = {
  motor: { hp: 150, salePrice: 15000, price: 15000 },
  tradeInInfo: null,
  purchasePath: 'installed' as const,
  selectedPromoOption: null,
  selectedPromoRate: null,
  selectedPromoTerm: null,
  selectedPaymentMethod: null,
};
let currentQuoteState: any = baseQuoteState;
vi.mock('@/contexts/QuoteContext', () => ({
  useQuote: () => ({ state: currentQuoteState, dispatch: dispatchMock }),
}));

let currentPromotions: any[] = [];
vi.mock('@/hooks/useActivePromotions', () => ({
  useActivePromotions: () => ({
    promotions: currentPromotions,
    loading: false,
    getRebateForHP: () => 500,
    getSpecialFinancingRates: () => [
      { months: 24, rate: 2.99 },
      { months: 36, rate: 3.99 },
      { months: 48, rate: 3.99 },
      { months: 60, rate: 4.99 },
    ],
  }),
}));

// Import AFTER mocks are registered.
import PromoSelectionPage from '../PromoSelectionPage';

function makePromo(overrides: Partial<any> = {}) {
  return {
    id: 'promo-1',
    name: 'Spring Promo',
    bonus_title: 'Choose Your Bonus',
    bonus_description: 'Pick one.',
    end_date: '2026-12-31T23:59:59Z',
    warranty_extra_years: 2,
    promo_options: {
      type: 'choose_one',
      options: [{ id: 'no_payments' }, { id: 'special_financing' }, { id: 'cash_rebate' }],
    },
    ...overrides,
  };
}

beforeEach(() => {
  dispatchMock.mockClear();
  navigateMock.mockClear();
  currentQuoteState = { ...baseQuoteState };
});

describe('PromoSelectionPage — warranty copy + saved-quote contract', () => {
  it('renders "{3+bonus} Years Factory Warranty" when the promo has bonus years', () => {
    currentPromotions = [makePromo({ warranty_extra_years: 2 })];

    render(<PromoSelectionPage />);

    // Headline reflects the promo's warranty length dynamically.
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      '5-Year Factory-Backed Warranty',
    );
    // Badge headline + subhead are driven by warranty_extra_years, not hardcoded 7.
    expect(screen.getByText('5 Years Factory Warranty')).toBeInTheDocument();
    expect(
      screen.getByText('3 years standard + 2 years FREE extension'),
    ).toBeInTheDocument();
    // "INCLUDED" chip only renders inside the badge block.
    expect(screen.getByText(/INCLUDED/i)).toBeInTheDocument();
  });

  it('renders a 4-year badge for a 3+1 promo (regression: no hardcoded 7-year copy)', () => {
    currentPromotions = [makePromo({ warranty_extra_years: 1 })];

    render(<PromoSelectionPage />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      '4-Year Factory-Backed Warranty',
    );
    expect(screen.getByText('4 Years Factory Warranty')).toBeInTheDocument();
    expect(
      screen.getByText('3 years standard + 1 years FREE extension'),
    ).toBeInTheDocument();
    // The old hardcoded copy must NOT appear anywhere on the page.
    expect(screen.queryByText(/7 Years Factory Warranty/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/3 years standard \+ 4 years FREE extension/i),
    ).not.toBeInTheDocument();
  });

  it('hides the warranty badge entirely when the promo has no bonus years', () => {
    currentPromotions = [makePromo({ warranty_extra_years: 0 })];

    render(<PromoSelectionPage />);

    // Headline falls back to the promo name / bonus_title, no "X-Year Factory-Backed".
    expect(
      screen.queryByText(/Year Factory-Backed Warranty/i),
    ).not.toBeInTheDocument();
    // No warranty badge subhead.
    expect(
      screen.queryByText(/Years Factory Warranty$/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/FREE extension/i),
    ).not.toBeInTheDocument();
    // Hardcoded 7-year copy must also be absent.
    expect(screen.queryByText(/7 Years/i)).not.toBeInTheDocument();
  });

  it('saves totalYears = 3 + bonus to the quote on Continue (matches active promo)', () => {
    currentPromotions = [makePromo({ warranty_extra_years: 2 })];

    render(<PromoSelectionPage />);

    fireEvent.click(screen.getByRole('button', { name: /Cash Purchase/i }));

    fireEvent.click(screen.getByRole('button', { name: /Continue to Quote/i }));

    // The saved-quote contract: warranty config total years reflects the promo.
    const warrantyDispatches = dispatchMock.mock.calls
      .map((c) => c[0])
      .filter((a: any) => a?.type === 'SET_WARRANTY_CONFIG');
    expect(warrantyDispatches.length).toBeGreaterThan(0);
    const last = warrantyDispatches[warrantyDispatches.length - 1];
    expect(last.payload).toEqual({
      extendedYears: 0,
      warrantyPrice: 0,
      totalYears: 5,
    });
    const packageDispatch = dispatchMock.mock.calls
      .map((c) => c[0])
      .filter((action) => action?.type === 'SET_SELECTED_PACKAGE')
      .pop();
    expect(packageDispatch?.payload).toEqual({
      id: 'good',
      label: 'Configured Quote',
      priceBeforeTax: 0,
    });
    expect(navigateMock).toHaveBeenCalledWith('/quote/summary');
  });

  it('saves totalYears = 3 on Continue when the active promo has no bonus warranty', () => {
    currentPromotions = [makePromo({ warranty_extra_years: 0 })];

    render(<PromoSelectionPage />);

    fireEvent.click(screen.getByRole('button', { name: /Cash Purchase/i }));
    fireEvent.click(screen.getByRole('button', { name: /Continue to Quote/i }));

    const warrantyDispatches = dispatchMock.mock.calls
      .map((c) => c[0])
      .filter((a: any) => a?.type === 'SET_WARRANTY_CONFIG');
    const last = warrantyDispatches[warrantyDispatches.length - 1];
    expect(last.payload.totalYears).toBe(3);
  });

  it('persists the auto-selected 2.99% / 24-month rate without requiring a second tile click', async () => {
    currentPromotions = [makePromo()];

    render(<PromoSelectionPage />);

    fireEvent.click(screen.getByRole('button', { name: /Promotional Financing/i }));

    const continueButton = screen.getByRole('button', { name: /Continue to Quote/i });
    await waitFor(() => expect(continueButton).toBeEnabled());
    fireEvent.click(continueButton);

    const financingDispatches = dispatchMock.mock.calls
      .map((c) => c[0])
      .filter((action) => action?.type === 'SET_PROMO_DETAILS' && action.payload?.option === 'special_financing');

    expect(financingDispatches.length).toBeGreaterThan(0);
    expect(financingDispatches[financingDispatches.length - 1].payload).toEqual({
      option: 'special_financing',
      rate: 2.99,
      term: 24,
      value: '2.99% APR for 24 months',
    });
    expect(navigateMock).toHaveBeenCalledWith('/quote/summary');
  });

  it('keeps a layered promotion step visible for optional financing', () => {
    currentPromotions = [makePromo({
      warranty_extra_years: 0,
      promo_options: {
        type: 'layered',
        options: [{ id: 'cash_rebate' }, { id: 'special_financing' }],
      },
    })];

    render(<PromoSelectionPage />);

    expect(screen.getByText(/Factory Rebate: \$500 auto-applied/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cash Purchase/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Promotional Financing/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Standard TD Financing/i })).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalledWith('/quote/summary', { replace: true });
  });

  it('records cash as the payment method while retaining the factory rebate benefit', () => {
    currentPromotions = [makePromo({
      warranty_extra_years: 0,
      promo_options: {
        type: 'layered',
        options: [{ id: 'cash_rebate' }, { id: 'special_financing' }],
      },
    })];

    render(<PromoSelectionPage />);
    fireEvent.click(screen.getByRole('button', { name: /Cash Purchase/i }));

    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'SET_PAYMENT_METHOD',
      payload: 'cash_purchase',
    });
    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'SET_PROMO_DETAILS',
      payload: {
        option: 'cash_rebate',
        rate: null,
        term: null,
        value: '$500 rebate',
      },
    });
  });

  it('keeps standard financing distinct from a cash purchase', () => {
    currentPromotions = [makePromo({ warranty_extra_years: 0 })];

    render(<PromoSelectionPage />);
    fireEvent.click(screen.getByRole('button', { name: /^Standard TD Financing/i }));

    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'SET_PAYMENT_METHOD',
      payload: 'standard_financing',
    });
    expect(screen.getByRole('button', { name: /Continue to Quote/i })).toBeEnabled();
  });

  it('shows only cash when the quote is below the financing minimum', () => {
    currentQuoteState = {
      ...baseQuoteState,
      motor: { hp: 2.5, salePrice: 1298, price: 1298 },
      purchasePath: 'loose',
    };
    currentPromotions = [makePromo({ warranty_extra_years: 0 })];

    render(<PromoSelectionPage />);

    expect(screen.getByRole('button', { name: /Cash Purchase/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Promotional Financing/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Standard TD Financing/i })).not.toBeInTheDocument();
  });

  it('renders a date-only promotion through the advertised local calendar day', () => {
    currentPromotions = [makePromo({ end_date: '2026-08-31' })];

    render(<PromoSelectionPage />);

    expect(screen.getByText(/Offer ends August 31, 2026/i)).toBeInTheDocument();
  });
});
