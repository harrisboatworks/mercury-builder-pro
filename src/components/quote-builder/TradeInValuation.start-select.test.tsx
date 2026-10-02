import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TradeInValuation } from './TradeInValuation';

vi.mock('@/hooks/useHapticFeedback', () => ({
  useHapticFeedback: () => ({ triggerHaptic: vi.fn() }),
}));

const info = {
  hasTradeIn: true, brand: 'Mercury', year: 2020, horsepower: 9.9,
  model: '9.9 FourStroke', serialNumber: '', condition: 'good' as const,
  engineType: '4-stroke' as const, estimatedValue: 0,
  confidenceLevel: 'medium' as const,
};

afterEach(cleanup);

describe('trade-in start type menu', () => {
  it('selects electric start without the popper positioning path', async () => {
    const changed = vi.fn();
    render(<TradeInValuation standalone tradeInInfo={info} onTradeInChange={changed} />);
    fireEvent.click(screen.getByRole('button', { name: /more details/i }));
    const trigger = screen.getByRole('combobox', { name: /start type/i });
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    const electric = await screen.findByRole('option', { name: 'Electric Start' });
    expect(screen.getByRole('option', { name: 'Manual (Pull Start)' })).toBeVisible();
    expect(document.querySelector('[data-radix-popper-content-wrapper]')).toBeNull();
    fireEvent.click(electric);
    expect(changed).toHaveBeenCalledWith({ ...info, startType: 'electric' });
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
  });

  it('dismisses the menu with Escape without changing the trade-in', async () => {
    const changed = vi.fn();
    render(<TradeInValuation standalone tradeInInfo={info} onTradeInChange={changed} />);
    fireEvent.click(screen.getByRole('button', { name: /more details/i }));
    const trigger = screen.getByRole('combobox', { name: /start type/i });
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    const option = await screen.findByRole('option', { name: 'Manual (Pull Start)' });
    fireEvent.keyDown(option, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    expect(changed).not.toHaveBeenCalled();
    expect(trigger).toHaveTextContent('Manual (default)');
  });
});
