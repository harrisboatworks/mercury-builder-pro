// @vitest-environment happy-dom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PlatinumProtectionSelector } from './PlatinumProtectionSelector';

describe('PlatinumProtectionSelector', () => {
  it('starts with no additional plan and returns the exact selected rate', () => {
    const onChange = vi.fn();
    render(
      <PlatinumProtectionSelector
        horsepower={115}
        currentCoverageYears={3}
        value={{ extendedYears: 0, warrantyPrice: 0, totalYears: 3 }}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole('button', { name: /No additional plan/i })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: /8 years total coverage, add \$2,077 CAD/i }));

    expect(onChange).toHaveBeenCalledWith({
      extendedYears: 5,
      warrantyPrice: 2077,
      totalYears: 8,
    });
  });

  it('shows only promotion-compatible choices and can return to included coverage', () => {
    const onChange = vi.fn();
    render(
      <PlatinumProtectionSelector
        horsepower={115}
        currentCoverageYears={5}
        value={{ extendedYears: 3, warrantyPrice: 1376, totalYears: 8 }}
        onChange={onChange}
      />,
    );

    expect(screen.queryByRole('button', { name: /5 years total coverage/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /8 years total coverage/i })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: /No additional plan/i }));
    expect(onChange).toHaveBeenCalledWith({
      extendedYears: 0,
      warrantyPrice: 0,
      totalYears: 5,
    });
  });

  it('does not render guessed pricing for an unsupported motor', () => {
    const { container } = render(
      <PlatinumProtectionSelector
        horsepower={0}
        currentCoverageYears={3}
        value={null}
        onChange={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
