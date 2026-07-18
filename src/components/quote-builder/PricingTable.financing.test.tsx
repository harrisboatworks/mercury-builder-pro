// @vitest-environment happy-dom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PricingTable } from './PricingTable';

vi.mock('@/hooks/useActiveFinancingPromo', () => ({
  useActiveFinancingPromo: () => ({ promo: { rate: 5.48 } }),
}));

describe('PricingTable financing terms', () => {
  it('renders the effective quote financing instead of recalculating default terms', () => {
    render(
      <PricingTable
        pricing={{
          msrp: 12_040,
          discount: 0,
          adminDiscount: 0,
          promoValue: 250,
          subtotal: 11_790,
          tax: 1_532.70,
          total: 13_322.70,
          savings: 250,
        }}
        financingTerms={{
          payment: 605,
          rate: 2.99,
          termMonths: 24,
          isPromotional: true,
        }}
      />,
    );

    expect(screen.getByText(/From \$605\/month/i)).toBeInTheDocument();
    expect(screen.getByText(/2\.99% APR · 24 months/i)).toBeInTheDocument();
    expect(screen.getByText(/your selected promotional terms/i)).toBeInTheDocument();
    expect(screen.queryByText(/5\.48% APR/i)).not.toBeInTheDocument();
  });

  it('respects a cash purchase while keeping the factory rebate visible', () => {
    render(
      <PricingTable
        pricing={{
          msrp: 12_040,
          discount: 0,
          adminDiscount: 0,
          promoValue: 250,
          subtotal: 11_790,
          tax: 1_532.70,
          total: 13_322.70,
          savings: 250,
        }}
        selectedPromoOption="cash_rebate"
        selectedPromoValue="$250"
        selectedPaymentMethod="cash_purchase"
        onApplyForFinancing={vi.fn()}
        financingTerms={{
          payment: 255,
          rate: 5.48,
          termMonths: 60,
          isPromotional: false,
        }}
      />,
    );

    expect(screen.getByText('Cash purchase selected')).toBeInTheDocument();
    expect(screen.getByText(/No financing is included/i)).toBeInTheDocument();
    expect(screen.getByText('Mercury Rebate')).toBeInTheDocument();
    expect(screen.queryByText(/From \$255\/month/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Apply for Financing/i })).not.toBeInTheDocument();
  });
});
