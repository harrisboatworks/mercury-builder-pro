import { useEffect, useState } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { initialState, quoteReducer, type QuoteAction, type QuoteState } from '@/contexts/QuoteContext';
import {
  parseAgentQuoteHandoff,
  useAgentQuoteHandoff,
  UCP_CHECKOUT_REF_FLAG,
} from './agent-quote-handoff';

function HandoffHarness({
  params,
  isLoading = false,
  initial = initialState,
}: {
  params: string;
  isLoading?: boolean;
  initial?: QuoteState;
}) {
  const [searchParams, setSearchParamsState] = useState(() => new URLSearchParams(params));
  const [state, setState] = useState<QuoteState>({ ...initial, isLoading: false });

  useEffect(() => {
    setSearchParamsState(new URLSearchParams(params));
  }, [params]);

  const dispatch = (action: QuoteAction) => {
    setState((current) => quoteReducer(current, action));
  };

  const setSearchParams = (next: URLSearchParams) => {
    setSearchParamsState(new URLSearchParams(next));
  };

  useAgentQuoteHandoff({
    searchParams,
    setSearchParams,
    state: { ...state, isLoading },
    dispatch,
  });

  return (
    <div
      data-testid="handoff-state"
      data-make={state.boatInfo?.make ?? ''}
      data-trade-brand={state.tradeInInfo?.brand ?? ''}
      data-ucp={String(state.uiFlags[UCP_CHECKOUT_REF_FLAG] ?? '')}
      data-path={state.purchasePath ?? ''}
      data-prop={String(state.boatInfo?.hasCompatibleProp ?? '')}
      data-hours={String(state.tradeInInfo?.engineHours ?? '')}
      data-params={searchParams.toString()}
    />
  );
}

describe('useAgentQuoteHandoff', () => {
  it('applies false propeller and zero hours after persisted state loads and keeps provenance', async () => {
    const params = 'motor=abc&purchase_path=loose&customer_has_propeller=false&trade_engine_hours=0&src=agent_rest';
    const { rerender, getByTestId } = render(<HandoffHarness params={params} isLoading />);
    expect(getByTestId('handoff-state')).toHaveAttribute('data-path', '');
    rerender(<HandoffHarness params={params} />);
    await waitFor(() => expect(getByTestId('handoff-state')).toHaveAttribute('data-path', 'loose'));
    expect(getByTestId('handoff-state')).toHaveAttribute('data-prop', 'false');
    expect(getByTestId('handoff-state')).toHaveAttribute('data-hours', '0');
    expect(getByTestId('handoff-state')).toHaveAttribute('data-params', 'motor=abc&src=agent_rest');
  });
  it('leaves a restored quote and its URL untouched', async () => {
    const params = 'purchase_path=loose&customer_has_propeller=false&trade_engine_hours=200&ucp=chk_other';
    const { getByTestId } = render(<HandoffHarness params={params} initial={{ ...initialState, restoredReferenceNumber: 'HBW-SYNTHETIC', purchasePath: 'installed' }} />);
    await act(async () => { await Promise.resolve(); });
    expect(getByTestId('handoff-state')).toHaveAttribute('data-path', 'installed');
    expect(getByTestId('handoff-state')).toHaveAttribute('data-ucp', '');
    expect(getByTestId('handoff-state')).toHaveAttribute('data-params', params);
  });
  it('waits for quote loading, then applies documented fields once', async () => {
    const params = 'boat_make=Lund&boat_model=Pro-V&trade_brand=Mercury&trade_year=2010&trade_hp=75&motor=abc&utm_source=agent';
    const { rerender, getByTestId } = render(
      <HandoffHarness params={params} isLoading />,
    );

    expect(getByTestId('handoff-state')).toHaveAttribute('data-make', '');
    expect(getByTestId('handoff-state').getAttribute('data-params')).toContain('boat_make=Lund');

    rerender(<HandoffHarness params={params} />);

    await waitFor(() => {
      expect(getByTestId('handoff-state')).toHaveAttribute('data-make', 'Lund');
      expect(getByTestId('handoff-state')).toHaveAttribute('data-trade-brand', 'Mercury');
    });

    expect(getByTestId('handoff-state').getAttribute('data-params')).not.toContain('boat_make=');
    expect(getByTestId('handoff-state').getAttribute('data-params')).not.toContain('trade_hp=');
    expect(getByTestId('handoff-state').getAttribute('data-params')).toContain('motor=abc');
    expect(getByTestId('handoff-state').getAttribute('data-params')).toContain('utm_source=agent');
  });

  it('does not clobber later param changes after the first apply', async () => {
    const { rerender, getByTestId } = render(
      <HandoffHarness params="boat_make=Lund" />,
    );

    await waitFor(() => {
      expect(getByTestId('handoff-state')).toHaveAttribute('data-make', 'Lund');
    });

    rerender(<HandoffHarness params="boat_make=Crestliner&trade_brand=Yamaha" />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(getByTestId('handoff-state')).toHaveAttribute('data-make', 'Lund');
    expect(getByTestId('handoff-state')).toHaveAttribute('data-trade-brand', '');
  });

  it('applies boat and trade fields before motors have loaded', async () => {
    const handoff = parseAgentQuoteHandoff(new URLSearchParams('boat_make=Lund&motor=not-loaded-yet'));
    expect(handoff.motorId).toBe('not-loaded-yet');

    const { getByTestId } = render(
      <HandoffHarness params="boat_make=Lund&motor=not-loaded-yet" />,
    );

    await waitFor(() => {
      expect(getByTestId('handoff-state')).toHaveAttribute('data-make', 'Lund');
    });
    expect(getByTestId('handoff-state').getAttribute('data-params')).toContain('motor=not-loaded-yet');
  });

  it('skips boat and trade prefill for the express motor-only intent', async () => {
    const { getByTestId } = render(
      <HandoffHarness params="motor=e920cfdf-223a-408a-850b-6f112e15c4d7&intent=motor-only&boat_make=Lund&trade_brand=Mercury&ucp=chk_express" />,
    );

    await waitFor(() => {
      expect(getByTestId('handoff-state')).toHaveAttribute('data-ucp', 'chk_express');
    });
    expect(getByTestId('handoff-state')).toHaveAttribute('data-make', '');
    expect(getByTestId('handoff-state')).toHaveAttribute('data-trade-brand', '');
    expect(getByTestId('handoff-state').getAttribute('data-params')).toContain('boat_make=Lund');
  });
});
