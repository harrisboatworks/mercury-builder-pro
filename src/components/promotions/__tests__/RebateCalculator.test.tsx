import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RebateCalculator } from '../RebateCalculator';

const matrix = [
  { hp_min: 2.5, hp_max: 9.9, rebate: 100 },
  { hp_min: 10, hp_max: 30, rebate: 250 },
  { hp_min: 40, hp_max: 115, rebate: 500 },
  { hp_min: 150, hp_max: 300, rebate: 1500 },
];

describe('RebateCalculator animated rebate transitions', () => {
  it('renders the initial rebate amount', () => {
    render(<RebateCalculator matrix={matrix} initialHP={90} />);
    expect(screen.getByText('$500')).toBeInTheDocument();
    expect(screen.getByText('40–115HP tier')).toBeInTheDocument();
  });

  it('updates the displayed rebate when a different tier pill is clicked', () => {
    render(<RebateCalculator matrix={matrix} initialHP={90} />);
    expect(screen.getByText('$500')).toBeInTheDocument();

    const pill = screen.getByRole('button', { name: /150–300HP/ });
    fireEvent.click(pill);
    expect(screen.getByText('$1,500')).toBeInTheDocument();
    expect(screen.getByText('150–300HP tier')).toBeInTheDocument();
  });

  it('cycles through multiple rebate values cleanly (animation key changes)', () => {
    render(<RebateCalculator matrix={matrix} initialHP={5} />);
    expect(screen.getByText('$100')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /10–30HP/ }));
    expect(screen.getByText('$250')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /40–115HP/ }));
    expect(screen.getByText('$500')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /150–300HP/ }));
    expect(screen.getByText('$1,500')).toBeInTheDocument();
  });
});
