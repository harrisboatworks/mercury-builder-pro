import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import InstallationConfig from './InstallationConfig';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
vi.mock('@/contexts/SoundContext', () => ({
  useSound: () => ({ playCelebration: vi.fn() }),
}));

describe('InstallationConfig propeller choice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('defaults a 60 HP quote to the propeller allowance and permits bypass', () => {
    const onComplete = vi.fn();
    render(
      <InstallationConfig
        selectedMotor={{ model: '60 ELPT FourStroke', hp: 60 }}
        onComplete={onComplete}
      />,
    );

    const includeButton = screen.getByRole('button', { name: /Include a matched propeller/i });
    const reuseButton = screen.getByRole('button', { name: /I already have a propeller/i });
    expect(includeButton).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('+$350 allowance')).toBeInTheDocument();

    fireEvent.click(reuseButton);
    expect(reuseButton).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: /Continue to Offers/i }));

    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({
      propellerDecision: 'reuse_existing',
      waterTest: true,
    }));
  });

  it('preselects reuse for a same-HP Mercury trade-in but allows a new propeller', () => {
    const onComplete = vi.fn();
    render(
      <InstallationConfig
        selectedMotor={{ model: '60 ELPT FourStroke', hp: 60 }}
        tradeInInfo={{ hasTradeIn: true, brand: 'Mercury', horsepower: 60 }}
        onComplete={onComplete}
      />,
    );

    const includeButton = screen.getByRole('button', { name: /Include a matched propeller/i });
    const reuseButton = screen.getByRole('button', { name: /I already have a propeller/i });
    expect(reuseButton).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/reuse is selected automatically/i)).toBeInTheDocument();

    fireEvent.click(includeButton);
    expect(screen.queryByText(/reuse is selected automatically/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Continue to Offers/i }));

    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({
      propellerDecision: 'include_allowance',
    }));
  });

  it('restores the saved propeller decision when the customer navigates back', () => {
    render(
      <InstallationConfig
        selectedMotor={{ model: '60 ELPT FourStroke', hp: 60 }}
        initialConfig={{ propellerDecision: 'reuse_existing' }}
        onComplete={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /I already have a propeller/i }))
      .toHaveAttribute('aria-pressed', 'true');
  });
});
