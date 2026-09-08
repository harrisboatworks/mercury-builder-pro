import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import type { TradeInInfo } from '@/lib/trade-valuation';
const { dispatch, navigate, saved, motor } = vi.hoisted(() => ({
  dispatch: vi.fn(), navigate: vi.fn(), motor: { id: 'synthetic', price: 14000 },
  saved: { hasTradeIn: true, brand: 'Mercury', year: 2020, horsepower: 90, model: '90 FourStroke', serialNumber: '', condition: 'good', estimatedValue: 5925, confidenceLevel: 'high' },
}));
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));
vi.mock('@/contexts/QuoteContext', () => ({ useQuote: () => ({ dispatch, state: { motor, purchasePath: 'loose', tradeInInfo: saved } }) }));
vi.mock('@/components/quote-builder/QuoteLayout', () => ({ QuoteLayout: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock('@/components/quote-builder/redesign/QuotePageShell', () => ({ QuotePageShell: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock('@/components/ui/page-transition', () => ({ PageTransition: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock('@/components/quote-builder/TradeInValuation', () => ({ TradeInValuation: ({ onTradeInChange, onAutoAdvance }: { onTradeInChange: (value: TradeInInfo) => void; onAutoAdvance: () => void }) => <button onClick={() => {
  onTradeInChange({ hasTradeIn: false, brand: '', year: 0, horsepower: 0, model: '', serialNumber: '', condition: 'good', estimatedValue: 0, confidenceLevel: 'medium' });
  onAutoAdvance();
}}>No trade-in</button> }));
import TradeInPage from './TradeInPage';
beforeEach(() => { vi.clearAllMocks(); localStorage.clear(); });
it('does not restore the previous credit when removal and advance occur in the same event', () => {
  render(<TradeInPage />);
  fireEvent.click(screen.getByRole('button', { name: 'No trade-in' }));
  const writes = dispatch.mock.calls.map(([action]) => action).filter(action => action.type === 'SET_TRADE_IN_INFO');
  expect(writes.length).toBeGreaterThan(0);
  expect(writes.every(action => action.payload.hasTradeIn === false && action.payload.estimatedValue === 0)).toBe(true);
  expect(navigate).toHaveBeenCalledWith('/quote/promo-selection');
});
