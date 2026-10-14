import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initialState } from '@/contexts/QuoteContext';
import PurchasePathPage from '../PurchasePathPage';
const mocks = vi.hoisted(() => ({ state: {} as any, dispatch: vi.fn() }));
vi.mock('@/contexts/QuoteContext', async importOriginal => ({ ...await importOriginal<any>(), useQuote: () => ({ state: mocks.state, dispatch: mocks.dispatch, isStepAccessible: () => true, isNavigationBlocked: false }) }));
vi.mock('@/components/quote-builder/QuoteLayout', () => ({ QuoteLayout: ({ children }: any) => <main>{children}</main> }));
beforeEach(() => { mocks.dispatch.mockClear(); mocks.state = { ...initialState, isLoading: false, motor: { id: 'synthetic', hp: 90, model: '90 ELPT', price: 14960 }, purchasePath: 'loose', completedSteps: [1, 2] }; });
describe('purchase path keeps the buyer propeller answer', () => {
  it.each(['include_allowance', 'reuse_existing'])('keeps %s when confirming loose pickup and removes rigging choices', decision => {
    mocks.state.installConfig = { propellerDecision: decision, controls: 'existing_adapter', mounting: 'transom' };
    render(<MemoryRouter><PurchasePathPage /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /Loose motor/i }));
    expect(mocks.dispatch).toHaveBeenCalledWith({ type: 'SET_INSTALL_CONFIG', payload: { propellerDecision: decision } });
    expect(mocks.dispatch).toHaveBeenCalledWith({ type: 'SET_PURCHASE_PATH', payload: 'loose' });
  });
  it('keeps the legacy empty installation default when there was no propeller answer', () => {
    render(<MemoryRouter><PurchasePathPage /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /Loose motor/i }));
    expect(mocks.dispatch).toHaveBeenCalledWith({ type: 'SET_INSTALL_CONFIG', payload: null });
  });
});
