import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TradeInInfo } from '@/lib/trade-valuation';

const navigateMock = vi.fn();
const dispatchMock = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
  Link: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@/contexts/QuoteContext', () => ({
  useQuote: () => ({ dispatch: dispatchMock }),
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

import { TradeInValueEstimator } from './TradeInValueEstimator';

beforeEach(() => {
  navigateMock.mockClear();
  dispatchMock.mockClear();
});

describe('TradeInValueEstimator', () => {
  it('reuses TradeInValuation and continues without an estimate via PROMOTE_TRADE_IN', () => {
    render(<TradeInValueEstimator />);

    fireEvent.click(screen.getByRole('button', { name: 'Simulate unavailable valuation' }));
    fireEvent.click(screen.getByRole('button', { name: /continue with these trade-in details/i }));

    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'PROMOTE_TRADE_IN',
      payload: unavailableValuation,
    });
    expect(navigateMock).toHaveBeenCalledWith('/quote/motor-selection');
  });
});
