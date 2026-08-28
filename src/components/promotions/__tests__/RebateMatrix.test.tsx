import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { RebateMatrix, getRebateForHP } from '../RebateMatrix';

const matrix = [
  { hp_min: 2.5, hp_max: 9.9, rebate: 100 },
  { hp_min: 10, hp_max: 30, rebate: 250 },
  { hp_min: 40, hp_max: 115, rebate: 500 },
  { hp_min: 150, hp_max: 300, rebate: 1500 },
];

const GOLD_DOT_CLASS = 'bg-repower-gold';

function getActiveRows() {
  return screen
    .getAllByTestId('rebate-matrix-row')
    .filter((el) => el.getAttribute('data-highlighted') === 'true');
}

describe('RebateMatrix highlight + gold dot', () => {
  it('full mode: highlights the matching HP row and shows the gold dot only there', () => {
    render(<RebateMatrix matrix={matrix} highlightHP={90} />);
    const active = getActiveRows();
    expect(active).toHaveLength(1);
    expect(active[0]).toHaveTextContent('40–115HP');
    const dot = within(active[0]).getByTestId('rebate-matrix-dot');
    expect(dot.className).toContain(GOLD_DOT_CLASS);

    // No other dots should be gold
    const allDots = screen.getAllByTestId('rebate-matrix-dot');
    const goldDots = allDots.filter((d) => d.className.includes(GOLD_DOT_CLASS));
    expect(goldDots).toHaveLength(1);
  });

  it('compact mode: highlights the matching HP row and shows the gold dot only there', () => {
    render(<RebateMatrix matrix={matrix} highlightHP={200} compact />);
    const active = getActiveRows();
    expect(active).toHaveLength(1);
    expect(active[0]).toHaveTextContent('150–300HP');
    const dot = within(active[0]).getByTestId('rebate-matrix-dot');
    expect(dot.className).toContain(GOLD_DOT_CLASS);

    const allDots = screen.getAllByTestId('rebate-matrix-dot');
    const goldDots = allDots.filter((d) => d.className.includes(GOLD_DOT_CLASS));
    expect(goldDots).toHaveLength(1);
  });

  it('no highlightHP: no row highlighted, no gold dots', () => {
    render(<RebateMatrix matrix={matrix} />);
    expect(getActiveRows()).toHaveLength(0);
    const goldDots = screen
      .getAllByTestId('rebate-matrix-dot')
      .filter((d) => d.className.includes(GOLD_DOT_CLASS));
    expect(goldDots).toHaveLength(0);
  });

  it('boundary HP values match the correct tier', () => {
    const { rerender } = render(<RebateMatrix matrix={matrix} highlightHP={10} />);
    expect(getActiveRows()[0]).toHaveTextContent('10–30HP');
    rerender(<RebateMatrix matrix={matrix} highlightHP={30} />);
    expect(getActiveRows()[0]).toHaveTextContent('10–30HP');
    rerender(<RebateMatrix matrix={matrix} highlightHP={31} />);
    expect(getActiveRows()).toHaveLength(0);
  });
});

describe('getRebateForHP helper', () => {
  it('returns the rebate for matching HP', () => {
    expect(getRebateForHP(matrix, 90)).toBe(500);
    expect(getRebateForHP(matrix, 5)).toBe(100);
    expect(getRebateForHP(matrix, 250)).toBe(1500);
  });
  it('returns null when no tier matches', () => {
    expect(getRebateForHP(matrix, 999)).toBeNull();
    expect(getRebateForHP(matrix, 0)).toBeNull();
  });
});
