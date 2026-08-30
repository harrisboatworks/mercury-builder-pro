import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TradeInInfo } from '@/lib/trade-valuation';

const navigateMock = vi.fn();
const dispatchMock = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('@/contexts/QuoteContext', () => ({
  useQuote: () => ({ dispatch: dispatchMock }),
}));

vi.mock('@/lib/helmet', () => ({
  Helmet: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  },
}));

vi.mock('@/components/repower/RepowerHeader', () => ({
  RepowerHeader: () => <header />,
}));

vi.mock('@/components/ui/site-footer', () => ({
  SiteFooter: () => <footer />,
}));

const unavailableValuation: TradeInInfo = {
  hasTradeIn: true,
  brand: 'Mercury',
  year: 2019,
  horsepower: 90,
  model: '90 ELPT',
  serialNumber: '',
  condition: 'good',
  estimatedValue: 0,
  confidenceLevel: 'medium',
  engineType: '4-stroke',
};

vi.mock('@/components/quote-builder/TradeInValuation', () => ({
  TradeInValuation: ({
    onTradeInChange,
  }: {
    onTradeInChange: (tradeInInfo: TradeInInfo) => void;
  }) => (
    <button type="button" onClick={() => onTradeInChange(unavailableValuation)}>
      Simulate unavailable valuation
    </button>
  ),
}));

import TradeInValuePage from './TradeInValuePage';

beforeEach(() => {
  localStorage.clear();
  navigateMock.mockClear();
  dispatchMock.mockClear();
});

describe('TradeInValuePage', () => {
  it('continues into the quote when details exist but no positive valuation is available', () => {
    render(<TradeInValuePage />);

    expect(screen.queryByRole('button', { name: /start a quote/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Simulate unavailable valuation' }));

    const continueButton = screen.getByRole('button', { name: /start a quote/i });
    expect(continueButton).toBeInTheDocument();
    fireEvent.click(continueButton);

    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'PROMOTE_TRADE_IN',
      payload: unavailableValuation,
    });
    expect(navigateMock).toHaveBeenCalledWith('/quote/motor-selection');
  });
});
