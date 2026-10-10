import { cleanup, render, screen, waitFor, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { FinancingProvider } from '@/contexts/FinancingContext';
import { financingPurchaseFromQuote } from '@/lib/financing-purchase';

const fixture = vi.hoisted(() => ({ quote: { motor: null } as any }));
vi.mock('@/contexts/QuoteContext', () => ({ useQuote: () => ({ state: fixture.quote }) }));
vi.mock('@/hooks/useNoIndex', () => ({ useNoIndex: () => {} }));
vi.mock('@/components/promotions/TDAlwaysOnOffer', () => ({ TDAlwaysOnBanner: () => null }));
vi.mock('@/lib/helmet', () => ({ Helmet: () => null }));
vi.mock('@/components/financing/PurchaseDetailsStep', async () => {
  const { useFinancing } = await import('@/contexts/FinancingContext');
  return { PurchaseDetailsStep: () => <pre data-testid="purchase-state">{JSON.stringify(useFinancing().state)}</pre> };
});
import FinancingApplication from './FinancingApplication';

const oldPurchase = { motorModel: 'Previous synthetic motor', motorPrice: 9349.25, downPayment: 200, tradeInValue: 0, amountToFinance: 9149.25 };
const freshQuote = {
  motor: { id: 'synthetic-new', model: 'New synthetic tiller', hp: 60, msrp: 12000, price: 11000 },
  purchasePath: 'loose', selectedOptions: [], adminCustomItems: [{ name: 'Accessory', price: 405.37 }], adminDiscount: 480,
  tradeInInfo: { hasTradeIn: false, estimatedValue: 0 },
  frozenPricing: { motorMSRP: 12000, motorDiscount: 1000, adminDiscount: 480, promoSavings: 0, subtotal: 10925.37, hst: 1420.30, total: 12345.67, dealerFee: 199.50 },
};
const mount = () => render(<MemoryRouter initialEntries={['/financing/apply']}><FinancingProvider><FinancingApplication /></FinancingProvider></MemoryRouter>);
const state = () => JSON.parse(screen.getByTestId('purchase-state').textContent!);

beforeEach(() => { localStorage.clear(); fixture.quote = { motor: null }; });
afterEach(() => { cleanup(); localStorage.clear(); });

describe('financing application quote precedence', () => {
  it('retains a matching pending quote when starting fresh without quote context', async () => {
    const purchaseDetails = { ...financingPurchaseFromQuote(freshQuote), motorModel: freshQuote.motor.model };
    localStorage.setItem('financingApplication', JSON.stringify({ state: { applicationId: 'matching-synthetic-draft', purchaseDetails, currentStep: 1 }, timestamp: Date.now(), lastActivity: Date.now() }));
    localStorage.setItem('quote_state', JSON.stringify(freshQuote));
    mount();
    await screen.findByText('Welcome back');
    expect(localStorage.getItem('quote_state')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /start fresh/i }));
    await waitFor(() => expect(state().purchaseDetails.motorModel).toBe(freshQuote.motor.model));
    expect(state().purchaseDetails.motorPrice).toBe(12545.17);
    expect(state().purchaseDetails.dealerFee).toBe(199.50);
    expect(state().applicationId).toBeNull();
  });

  it('loads a newly selected quote instead of a previous auto-saved application', async () => {
    localStorage.setItem('financingApplication', JSON.stringify({ state: { applicationId: "previous-synthetic-draft", purchaseDetails: oldPurchase, currentStep: 1 }, timestamp: Date.now(), lastActivity: Date.now() }));
    localStorage.setItem('quote_state', JSON.stringify(freshQuote));
    mount();
    await waitFor(() => expect(state().purchaseDetails.motorModel).toContain('New synthetic tiller'));
    expect(state().purchaseDetails.motorPrice).toBe(12545.17);
    expect(state().purchaseDetails.amountToFinance).toBe(12545.17);
    expect(state().applicationId).toBeNull();
    expect(screen.queryByText('Welcome back')).not.toBeInTheDocument();
  });

  it('keeps standalone draft resumption available without a new quote', async () => {
    localStorage.setItem('financingApplication', JSON.stringify({ state: { applicationId: "previous-synthetic-draft", purchaseDetails: oldPurchase, currentStep: 1 }, timestamp: Date.now(), lastActivity: Date.now() }));
    mount();
    await screen.findByText('Welcome back');
    fireEvent.click(screen.getByRole('button', { name: /continue application/i }));
    await waitFor(() => expect(state().purchaseDetails.amountToFinance).toBe(9149.25));
    expect(state().purchaseDetails.motorModel).toBe('Previous synthetic motor');
  });
});
