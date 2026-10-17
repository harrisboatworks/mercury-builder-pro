import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { RebateTable } from '../RebateTable';

describe('promotion rebate table', () => {
  it('shows every supplied tier and rebate without selection controls', () => {
    render(<RebateTable matrix={[
      { hp_min: 2.5, hp_max: 3.5, rebate: 250 },
      { hp_min: 4, hp_max: 9.9, rebate: 300 },
      { hp_min: 15, hp_max: 20, rebate: 350 },
      { hp_min: 25, hp_max: 30, rebate: 400 },
    ]} />);
    const rows = within(screen.getByRole('table')).getAllByRole('row');
    expect(rows.map(row => row.textContent)).toEqual([
      'HorsepowerRebate (CAD)', '2.5–3.5 HP$250', '4–9.9 HP$300',
      '15–20 HP$350', '25–30 HP$400',
    ]);
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
