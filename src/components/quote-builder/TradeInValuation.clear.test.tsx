import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TradeInValuation } from './TradeInValuation';
import type { TradeInInfo } from '@/lib/trade-valuation';

describe('TradeInValuation clearing', () => {
  it('advances with the cleared trade instead of the previous render value', () => {
    const previousTrade: TradeInInfo = {
      hasTradeIn: true,
      brand: 'Mercury',
      year: 2020,
      horsepower: 90,
      model: '90 ELPT',
      serialNumber: 'TEST',
      condition: 'good',
      estimatedValue: 3500,
      confidenceLevel: 'high',
      tradeinValueFinal: 3500,
      valuationReportUrl: 'https://example.com/old-trade',
    };
    const onTradeInChange = vi.fn();
    const onAutoAdvance = vi.fn();

    render(
      <TradeInValuation
        tradeInInfo={previousTrade}
        onTradeInChange={onTradeInChange}
        onAutoAdvance={onAutoAdvance}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /no trade-in/i }));

    const clearedTrade = expect.objectContaining({
      hasTradeIn: false,
      brand: '',
      year: 0,
      horsepower: 0,
      estimatedValue: 0,
    });
    expect(onTradeInChange).toHaveBeenCalledWith(clearedTrade);
    expect(onAutoAdvance).toHaveBeenCalledWith(clearedTrade);
    expect(onAutoAdvance.mock.calls[0][0]).not.toHaveProperty('valuationReportUrl');
  });
});
