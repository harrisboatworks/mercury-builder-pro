// @vitest-environment happy-dom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { calculateMonthlyPayment, DEALERPLAN_FEE, formatFinancingEstimateLine } from '@/lib/finance';
import { PackageCards, type PackageOption } from './PackageCards';

vi.mock('@/hooks/useHapticFeedback', () => ({
  useHapticFeedback: () => ({ triggerHaptic: vi.fn() }),
}));

vi.mock('@/contexts/SoundContext', () => ({
  useSound: () => ({ playPackageSelect: vi.fn() }),
}));

const chase = { minimum_amount: 5000, minimum_amount_exclusive: true };

function financedAmount(priceBeforeTax: number) {
  return priceBeforeTax * 1.13 + DEALERPLAN_FEE;
}

function option(id: string, priceBeforeTax: number): PackageOption {
  return {
    id,
    label: id === 'good' ? 'Essential • Best Value' : 'Complete • Extended Coverage',
    priceBeforeTax,
    savings: 0,
    features: ['Mercury motor'],
    coverageYears: 3,
  };
}

function renderCards(options: PackageOption[]) {
  return render(
    <PackageCards
      options={options}
      onSelect={vi.fn()}
      selectedPromoOption="special_financing"
      promoRate={2.99}
      promoTerm={24}
      specialFinancingOption={chase}
      standingRate={5.48}
      showUpgradeDeltas={false}
    />,
  );
}

describe('PackageCards special-financing minimum', () => {
  it('uses the standing TD Always On line when the package is below the promo minimum', () => {
    const priceBeforeTax = 3500;
    const amount = financedAmount(priceBeforeTax);
    expect(amount).toBeLessThan(5000);
    const standing = calculateMonthlyPayment(amount, 5.48, null);

    renderCards([option('good', priceBeforeTax)]);

    expect(screen.getByText(formatFinancingEstimateLine({
      payment: Math.round(standing.payment),
      termMonths: standing.termMonths,
      rate: standing.rate,
    }))).toBeInTheDocument();
    expect(screen.queryByText(/2\.99% OAC/)).not.toBeInTheDocument();
    expect(screen.queryByText(/24 mo/)).not.toBeInTheDocument();
  });

  it('uses 2.99% for 24 months when the package is above the promo minimum', () => {
    const priceBeforeTax = 8000;
    const amount = financedAmount(priceBeforeTax);
    expect(amount).toBeGreaterThan(5000);
    const promo = calculateMonthlyPayment(amount, 2.99, 24);

    renderCards([option('good', priceBeforeTax)]);

    expect(screen.getByText(formatFinancingEstimateLine({
      payment: Math.round(promo.payment),
      termMonths: 24,
      rate: 2.99,
    }))).toBeInTheDocument();
  });

  it('gates each package independently when one is below and one is above the minimum', () => {
    const belowPrice = 3500;
    const abovePrice = 8000;
    const below = calculateMonthlyPayment(financedAmount(belowPrice), 5.48, null);
    const above = calculateMonthlyPayment(financedAmount(abovePrice), 2.99, 24);

    renderCards([option('good', belowPrice), option('better', abovePrice)]);

    expect(screen.getByText(formatFinancingEstimateLine({
      payment: Math.round(below.payment),
      termMonths: below.termMonths,
      rate: below.rate,
    }))).toBeInTheDocument();
    expect(screen.getByText(formatFinancingEstimateLine({
      payment: Math.round(above.payment),
      termMonths: 24,
      rate: 2.99,
    }))).toBeInTheDocument();
  });
});
