import { useEffect, useReducer } from 'react';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter, useSearchParams } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { initialState, quoteReducer } from '@/contexts/QuoteContext';
import { useAgentQuoteHandoff } from './agent-quote-handoff';
import { readMotorSelectionUrlState, writeMotorSelectionUrlState } from './motor-selection-url-state';
function RouterHandoffHarness() {
  const [params, setParams] = useSearchParams();
  const [state, dispatch] = useReducer(quoteReducer, { ...initialState, isLoading: false });
  const cleanup = useAgentQuoteHandoff({ searchParams: params, setSearchParams: setParams, state, dispatch });
  useEffect(() => {
    const normalized = cleanup(writeMotorSelectionUrlState(params, readMotorSelectionUrlState(params)));
    if (normalized.toString() !== params.toString()) setParams(current => cleanup(writeMotorSelectionUrlState(current, readMotorSelectionUrlState(current))), { replace: true });
  }, [params, setParams, cleanup]);
  return <div data-testid="state" data-path={state.purchasePath} data-hours={state.tradeInInfo?.engineHours} data-params={params.toString()} />;
}
describe('handoff with actual router snapshots', () => {
  it('does not revive consumed answers when another effect canonicalizes the same render without a motor parameter', async () => {
    const { getByTestId } = render(<MemoryRouter initialEntries={['/quote/motor-selection?purchase_path=loose&trade_engine_hours=125&q=90&stock=0&src=agent_rest']}><RouterHandoffHarness /></MemoryRouter>);
    await waitFor(() => expect(getByTestId('state')).toHaveAttribute('data-path', 'loose'));
    expect(getByTestId('state')).toHaveAttribute('data-hours', '125');
    expect(getByTestId('state').getAttribute('data-params')).not.toMatch(/purchase_path|trade_engine_hours|stock=/);
    expect(getByTestId('state').getAttribute('data-params')).toContain('src=agent_rest');
  });
  it('does not replace the URL when no handoff values were consumed', () => {
    const setParams = vi.fn();
    function Noop() { useAgentQuoteHandoff({ searchParams: new URLSearchParams('src=agent_rest'), setSearchParams: setParams, state: { ...initialState, isLoading: false }, dispatch: vi.fn() }); return null; }
    render(<Noop />);
    expect(setParams).not.toHaveBeenCalled();
  });
});
