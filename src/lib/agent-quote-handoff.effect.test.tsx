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
}: {
  params: string;
  isLoading?: boolean;
}) {
  const [searchParams, setSearchParamsState] = useState(() => new URLSearchParams(params));
  const [state, setState] = useState<QuoteState>({ ...initialState, isLoading: false });

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
      data-params={searchParams.toString()}
    />
  );
}

describe('useAgentQuoteHandoff', () => {
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
