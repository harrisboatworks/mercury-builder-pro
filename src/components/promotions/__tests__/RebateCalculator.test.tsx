import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// In jsdom, framer-motion's AnimatePresence mode="wait" never completes its
// exit animation, so the new keyed child never mounts. Stub it out so we can
// assert the rebate amount actually transitions across multiple values.
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: new Proxy(
    {},
    {
      get: () => (props: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) => {
        const { children, ...rest } = props;
        return <div {...rest}>{children}</div>;
      },
    }
  ),
}));

import { RebateCalculator } from '../RebateCalculator';

const matrix = [
  { hp_min: 2.5, hp_max: 9.9, rebate: 100 },
  { hp_min: 10, hp_max: 30, rebate: 250 },
  { hp_min: 40, hp_max: 115, rebate: 500 },
  { hp_min: 150, hp_max: 300, rebate: 1500 },
];

// AnimatePresence may keep an exiting node briefly; collect all anchor nodes.
const anchorText = () =>
  screen.getAllByTestId('rebate-anchor').map((el) => el.textContent).join(' ');

describe('RebateCalculator animated rebate transitions', () => {
  it('renders the initial rebate amount', () => {
    render(<RebateCalculator matrix={matrix} initialHP={90} />);
    expect(anchorText()).toContain('$500');
    expect(screen.getByText('40–115HP tier')).toBeInTheDocument();
  });

  it('updates the displayed rebate when a different tier pill is clicked', async () => {
    render(<RebateCalculator matrix={matrix} initialHP={90} />);
    expect(anchorText()).toContain('$500');

    fireEvent.click(screen.getByRole('button', { name: /150–300HP/ }));
    await screen.findByText('150–300HP tier');
    expect(anchorText()).toContain('$1,500');
  });

  it('cycles through multiple rebate values cleanly (animation key changes)', async () => {
    render(<RebateCalculator matrix={matrix} initialHP={5} />);
    expect(anchorText()).toContain('$100');

    fireEvent.click(screen.getByRole('button', { name: /10–30HP/ }));
    await screen.findByText('10–30HP tier');
    expect(anchorText()).toContain('$250');

    fireEvent.click(screen.getByRole('button', { name: /40–115HP/ }));
    await screen.findByText('40–115HP tier');
    expect(anchorText()).toContain('$500');

    fireEvent.click(screen.getByRole('button', { name: /150–300HP/ }));
    await screen.findByText('150–300HP tier');
    expect(anchorText()).toContain('$1,500');
  });
});

const chase = [
  { hp_min: 2.5, hp_max: 3.5, rebate: 250 },
  { hp_min: 4, hp_max: 9.9, rebate: 300 },
  { hp_min: 15, hp_max: 20, rebate: 350 },
  { hp_min: 25, hp_max: 30, rebate: 400 },
];

describe('eligible horsepower selection', () => {
  it('advances through every eligible engine size with the keyboard', () => {
    render(<RebateCalculator matrix={chase} initialHP={2.5} />);
    const slider = screen.getByRole('slider', { name: 'Engine horsepower' });
    for (const hp of [3.5, 4, 5, 6, 8, 9.9, 15, 20, 25, 30]) {
      fireEvent.keyDown(slider, { key: 'ArrowRight' });
      expect(slider).toHaveAttribute('aria-valuetext', `${hp} horsepower`);
      const tier = chase.find(row => hp >= row.hp_min && hp <= row.hp_max)!;
      expect(anchorText()).toContain(`$${tier.rebate}`);
    }
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(slider).toHaveAttribute('aria-valuetext', '30 horsepower');
    fireEvent.keyDown(slider, { key: 'Home' });
    expect(slider).toHaveAttribute('aria-valuetext', '2.5 horsepower');
  });

  it('keeps the selection eligible when the promotion matrix changes', () => {
    const { rerender } = render(<RebateCalculator matrix={matrix} initialHP={90} />);
    rerender(<RebateCalculator matrix={chase} initialHP={90} />);
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', '2.5 horsepower');
    expect(anchorText()).toContain('$250');
    fireEvent.click(screen.getByRole('button', { name: /25–30HP/ }));
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', '25 horsepower');
    expect(anchorText()).toContain('$400');
  });
});
