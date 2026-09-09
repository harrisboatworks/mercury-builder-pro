import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { it, expect, vi, afterEach } from 'vitest';
import { PurchaseDetailsStep } from '@/components/financing/PurchaseDetailsStep';

const fixture = vi.hoisted(() => ({
  purchase: {
    motorModel: '150 FourStroke',
    motorPrice: 20112.7,
    downPayment: 0,
    tradeInValue: 0,
    amountToFinance: 20112.7,
    preferredTerm: '60',
    priceBasis: 'all_in_after_trade',
    includedTradeInValue: 0,
    preTradeSubtotal: 20112.7,
    promoOption: 'special_financing',
    promoRate: 0,
    promoTerm: 60,
    promoValue: '0% APR for 60 months',
    promoName: 'Mercury 0% Promo',
    promoSavings: 0,
    promoCombinationMode: 'choose_one',
  },
  dispatch: vi.fn(),
}));

vi.mock('@/contexts/FinancingContext', () => ({
  useFinancing: () => ({
    state: { purchaseDetails: fixture.purchase },
    dispatch: fixture.dispatch,
  }),
}));

vi.mock('@/hooks/useActivePromotions', () => ({
  useActivePromotions: () => ({
    loading: false,
    getPromotionOptions: () => [
      {
        id: 'special_financing',
        title: 'Special Financing',
        description: '0% APR',
        rates: [{ months: 60, rate: 0 }],
      },
    ],
  }),
}));

vi.mock('@/components/financing/MobileFormNavigation', () => ({
  MobileFormNavigation: () => null,
}));

afterEach(cleanup);

it('treats a 0% promo as active and shows 0% APR copy plus zero-rate payments', () => {
  render(<PurchaseDetailsStep />);

  expect(screen.getByText('Special Financing: 0% APR for 60 months')).toBeInTheDocument();
  expect(screen.getByText('✓ Qualifies for 0% APR special financing')).toBeInTheDocument();
  expect(screen.getByText('Using promotional rate of 0% APR')).toBeInTheDocument();
  expect(
    screen.getByText('Promotional 0% APR applied. Your lender will confirm final terms.'),
  ).toBeInTheDocument();
  expect(screen.queryByText(/undefined months/i)).not.toBeInTheDocument();

  // Special-financing term set is 24/36/48, not the standing 60/72/84 tier.
  expect(screen.getByText('24 months')).toBeInTheDocument();
  expect(screen.getByText('$838')).toBeInTheDocument();
  expect(screen.getByText('$559')).toBeInTheDocument();
  expect(screen.getByText('$419')).toBeInTheDocument();
});

it('does not render undefined months when the 0% promo has no term', () => {
  fixture.purchase.promoTerm = null;
  render(<PurchaseDetailsStep />);
  expect(screen.getByText('Special Financing: 0% APR')).toBeInTheDocument();
  expect(screen.queryByText(/undefined months/i)).not.toBeInTheDocument();
  fixture.purchase.promoTerm = 60;
});
