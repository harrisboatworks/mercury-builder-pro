import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
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
  rates: [{ months: 60, rate: 0 }],
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
        rates: fixture.rates,
        minimum_amount: 5000,
        minimum_amount_exclusive: true,
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

  // Only the term attached to the approved rate is offered.
  expect(screen.getByText('60 months')).toBeInTheDocument();
  expect(screen.getByText('$335')).toBeInTheDocument();
  expect(screen.queryByText('24 months')).not.toBeInTheDocument();
  expect(screen.queryByText('48 months')).not.toBeInTheDocument();
});

it('does not render undefined months when the 0% promo has no term', () => {
  fixture.purchase.promoTerm = null;
  render(<PurchaseDetailsStep />);
  expect(screen.getByText('Special Financing: 0% APR')).toBeInTheDocument();
  expect(screen.queryByText(/undefined months/i)).not.toBeInTheDocument();
  fixture.purchase.promoTerm = 60;
});

it('keeps a 24-month offer at 24 months and removes its rate below the loan minimum', () => {
  const original = { ...fixture.purchase };
  fixture.purchase = { ...fixture.purchase, motorPrice: 7235.22, amountToFinance: 7235.22, promoRate: 2.99, promoTerm: 24, preferredTerm: '48' };
  fixture.rates = [{ months: 24, rate: 2.99 }];
  render(<PurchaseDetailsStep />);
  expect(screen.getByRole('button', { name: '24 months $311 /month' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.queryByText('48 months')).not.toBeInTheDocument();
  const downPaymentInput = screen.getAllByRole('spinbutton').find(input => input.getAttribute('id') !== 'motorPrice');
  fireEvent.change(downPaymentInput!, { target: { value: '3000' } });
  expect(screen.queryByText('Using promotional rate of 2.99% APR')).not.toBeInTheDocument();
  fixture.purchase = original;
  fixture.rates = [{ months: 60, rate: 0 }];
});
