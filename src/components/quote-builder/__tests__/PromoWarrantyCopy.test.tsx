// @vitest-environment happy-dom
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

vi.mock('react-router-dom', () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
  useNavigate: () => vi.fn(),
}));

vi.mock('@/components/ui/countdown-timer', () => ({
  CountdownTimer: () => <div data-testid="countdown" />,
}));

vi.mock('@/assets/mercury-logo.png', () => ({ default: 'mercury-logo.png' }));

let currentPromotions: Array<Record<string, unknown>> = [];
vi.mock('@/hooks/useActivePromotions', () => ({
  useActivePromotions: () => ({
    promotions: currentPromotions,
    getRebateForHP: () => 500,
    getSpecialFinancingRates: () => [{ months: 24, rate: 2.99 }],
  }),
}));

import { PromoSummaryCard } from '../PromoSummaryCard';
import { PromoSelectionBadge } from '../PromoSelectionBadge';

function makePromo(overrides: Record<string, unknown> = {}) {
  return {
    id: 'promo-1',
    name: 'Summer Savings',
    warranty_extra_years: 4,
    end_date: '2026-08-31',
    promo_options: { type: 'choose_one', options: [{ id: 'cash_rebate' }] },
    ...overrides,
  };
}

beforeEach(() => {
  currentPromotions = [];
});

describe('PromoSummaryCard warranty copy', () => {
  it('shows 7 years when the applied promotion adds 4', () => {
    currentPromotions = [makePromo({ warranty_extra_years: 4 })];
    render(
      <PromoSummaryCard motorHP={150} selectedOption={null} onChangeOption={() => undefined} endDate={null} />,
    );

    expect(screen.getByText('7-YEAR WARRANTY')).toBeInTheDocument();
    expect(screen.getByText('7 Years Warranty')).toBeInTheDocument();
    expect(screen.getByText('3 + 4 FREE years')).toBeInTheDocument();
  });

  it('shows 5 years when the applied promotion adds 2', () => {
    currentPromotions = [makePromo({ warranty_extra_years: 2 })];
    render(
      <PromoSummaryCard motorHP={150} selectedOption={null} onChangeOption={() => undefined} endDate={null} />,
    );

    expect(screen.getByText('5-YEAR WARRANTY')).toBeInTheDocument();
    expect(screen.getByText('5 Years Warranty')).toBeInTheDocument();
    expect(screen.getByText('3 + 2 FREE years')).toBeInTheDocument();
  });

  it('ignores an unrelated later active promotion', () => {
    currentPromotions = [
      makePromo({ id: 'applied', warranty_extra_years: 2 }),
      makePromo({ id: 'unrelated-active', name: 'Other promo', warranty_extra_years: 4 }),
    ];
    render(
      <PromoSummaryCard motorHP={150} selectedOption={null} onChangeOption={() => undefined} endDate={null} />,
    );

    expect(screen.getByText('5-YEAR WARRANTY')).toBeInTheDocument();
    expect(screen.queryByText('7-YEAR WARRANTY')).not.toBeInTheDocument();
  });

  it('shows only standard warranty wording when the applied promotion has no extra years', () => {
    currentPromotions = [makePromo({ warranty_extra_years: 0 })];
    render(
      <PromoSummaryCard motorHP={150} selectedOption={null} onChangeOption={() => undefined} endDate={null} />,
    );

    expect(screen.getByText('3-YEAR WARRANTY')).toBeInTheDocument();
    expect(screen.getByText('3-year factory-backed warranty')).toBeInTheDocument();
    expect(screen.queryByText(/FREE years/i)).not.toBeInTheDocument();
  });

  it('does not render when no promotion was applied', () => {
    currentPromotions = [];
    const { container } = render(
      <PromoSummaryCard motorHP={150} selectedOption={null} onChangeOption={() => undefined} endDate={null} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});

describe('PromoSelectionBadge warranty copy', () => {
  it('shows 5 years when the applied promotion adds 2', () => {
    currentPromotions = [makePromo({ warranty_extra_years: 2 })];
    render(<PromoSelectionBadge motorHP={150} selectedOption={null} />);

    expect(screen.getByText('5-YEAR WARRANTY')).toBeInTheDocument();
    expect(screen.getByText('5 Years')).toBeInTheDocument();
  });

  it('shows 3 years when no promotion is applied', () => {
    currentPromotions = [];
    render(<PromoSelectionBadge motorHP={150} selectedOption={null} />);

    expect(screen.getByText('3-YEAR WARRANTY')).toBeInTheDocument();
    expect(screen.getByText('3 Years')).toBeInTheDocument();
  });

  it('shows 3 years when an inactive or expired promotion was not applied', () => {
    currentPromotions = [];
    render(<PromoSelectionBadge motorHP={150} selectedOption={null} />);

    expect(screen.getByText('3-YEAR WARRANTY')).toBeInTheDocument();
    expect(screen.queryByText('7-YEAR WARRANTY')).not.toBeInTheDocument();
  });

  it('ignores an unrelated later active promotion', () => {
    currentPromotions = [
      makePromo({ id: 'applied', warranty_extra_years: 2 }),
      makePromo({ id: 'unrelated-active', warranty_extra_years: 4 }),
    ];
    render(<PromoSelectionBadge motorHP={150} selectedOption={null} />);

    expect(screen.getByText('5-YEAR WARRANTY')).toBeInTheDocument();
    expect(screen.queryByText('7-YEAR WARRANTY')).not.toBeInTheDocument();
  });

  it('falls back to the standard term when the applied promotion has no extra years', () => {
    currentPromotions = [makePromo({ warranty_extra_years: 0 })];
    render(<PromoSelectionBadge motorHP={150} selectedOption={null} />);

    expect(screen.getByText('3-YEAR WARRANTY')).toBeInTheDocument();
    expect(screen.getByText('3 Years')).toBeInTheDocument();
    expect(screen.queryByText('7-YEAR WARRANTY')).not.toBeInTheDocument();
  });
});
