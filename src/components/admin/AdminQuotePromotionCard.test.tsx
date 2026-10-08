import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AdminQuotePromotionCard } from './AdminQuotePromotionCard';
import { buildLegacyQuotePdfSnapshot, type QuotePdfSnapshot } from '@/lib/quote-pdf-data';

afterEach(cleanup);

export function quoteSnapshot(overrides: Partial<QuotePdfSnapshot> = {}): QuotePdfSnapshot {
  return {
    version: 1,
    createdAt: '2026-09-20T12:00:00Z',
    motor: { model: 'Synthetic motor', hp: 30, msrp: 8000, modelYear: 2026, category: 'FourStroke' },
    pricing: { msrp: 8000, discount: 0, promoValue: 0, motorSubtotal: 8000, subtotal: 8000, hst: 1040, totalCashPrice: 9040, savings: 0 },
    accessoryBreakdown: [],
    purchasePath: 'loose',
    includedCoverageYears: 3,
    paymentMethod: 'cash_purchase',
    promotion: { name: 'Always On Financing', selectedOption: 'cash_rebate', selectedValue: '$0', endDate: '2026-12-31' },
    ...overrides,
  };
}

describe('AdminQuotePromotionCard saved quote parity', () => {
  it('does not advertise a live warranty offer or zero rebate on a standard-coverage cash quote', () => {
    render(<AdminQuotePromotionCard snapshot={quoteSnapshot()} />);
    expect(screen.getByRole('heading', { name: 'Included Coverage' })).toBeVisible();
    expect(screen.getByText('3-year limited factory warranty included')).toBeVisible();
    expect(screen.getByText('No promotional benefit applied to this quote.')).toBeVisible();
    expect(screen.queryByText(/Always On|rebate|5.year|expiry|APR/i)).not.toBeInTheDocument();
  });

  it('retains historical combined coverage and its recorded date, without claiming five factory years', () => {
    render(<AdminQuotePromotionCard snapshot={quoteSnapshot({
      includedCoverageYears: 5,
      promotion: { name: 'Saved seasonal promotion', endDate: '2026-10-30' },
    })} />);
    expect(screen.getByText('5 years total combined Mercury coverage included')).toBeVisible();
    expect(screen.getByText('Saved seasonal promotion')).toBeVisible();
    expect(screen.getByText(/October 30, 2026/)).toBeVisible();
    expect(screen.queryByText(/5.year.*factory/i)).not.toBeInTheDocument();
  });

  it('uses the saved monetary savings instead of stale option display text', () => {
    const snapshot = quoteSnapshot();
    snapshot.pricing.promoValue = 400;
    snapshot.promotion = { name: 'Saved rebate', selectedOption: 'cash_rebate', selectedValue: '$999' };
    render(<AdminQuotePromotionCard snapshot={snapshot} />);
    expect(screen.getByText('Promotional savings applied: $400.00')).toBeVisible();
    expect(screen.queryByText(/999/)).not.toBeInTheDocument();
  });

  it('requires persisted financing, and suppresses it for cash purchases', () => {
    const snapshot = quoteSnapshot({
      paymentMethod: 'special_financing',
      promotion: { selectedOption: 'special_financing' },
      financing: { monthlyPayment: 350, rate: 2.99, amortizationMonths: 24, contractTermMonths: 24, amountFinanced: 8000, dealerFee: 0 },
    });
    const { rerender } = render(<AdminQuotePromotionCard snapshot={snapshot} />);
    expect(screen.getByText('Promotional financing: 2.99% APR')).toBeVisible();
    rerender(<AdminQuotePromotionCard snapshot={{ ...snapshot, paymentMethod: 'cash_purchase' }} />);
    expect(screen.queryByText(/APR/)).not.toBeInTheDocument();
  });

  it('omits unverified promotions when no exact saved snapshot is available', () => {
    const { container } = render(<AdminQuotePromotionCard snapshot={buildLegacyQuotePdfSnapshot({ selectedPromoOption: 'cash_rebate' })} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('uses the exact PDF snapshot over conflicting legacy coverage fields', () => {
    const saved = quoteSnapshot();
    const snapshot = buildLegacyQuotePdfSnapshot({ pdfSnapshot: saved, warrantyConfig: { totalYears: 7 } });
    expect(snapshot).toBe(saved);
    render(<AdminQuotePromotionCard snapshot={snapshot} />);
    expect(screen.getByText('3-year limited factory warranty included')).toBeVisible();
  });
});
