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

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      extendedYears: 5,
      warrantyPrice: 2077,
      totalYears: 8,
      goldUpgradePrice: 0,
      platinumExtensionPrice: 2077,
    }));
  });

  it('shows promo Gold upgrade breakdown, upgrade-only, and can return to Gold at $0', () => {
    const onChange = vi.fn();
    render(
      <PlatinumProtectionSelector
        horsepower={115}
        currentCoverageYears={5}
        value={{ extendedYears: 3, warrantyPrice: 1609, totalYears: 8, goldUpgradePrice: 233, platinumExtensionPrice: 1376 }}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole('button', { name: /8 years total coverage, add \$1,609 CAD/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /5 years total coverage, add \$233 CAD/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /5 years total coverage, add \$233 CAD/i }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ extendedYears: 0, warrantyPrice: 233, totalYears: 5, goldUpgradePrice: 233 }));

    fireEvent.click(screen.getByRole('button', { name: /No additional plan/i }));
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({
      extendedYears: 0,
      warrantyPrice: 0,
      totalYears: 5,
    }));
  });

  it('does not render guessed promo upgrade pricing for 500HP', () => {
    const { container } = render(
      <PlatinumProtectionSelector horsepower={500} currentCoverageYears={5} value={null} onChange={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
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
  it('blocks customer changes to legacy custom-priced coverage', () => {
    const onChange=vi.fn();
    render(<PlatinumProtectionSelector horsepower={60} currentCoverageYears={5}
      value={{extendedYears:3,totalYears:8,warrantyPrice:904}} onChange={onChange} customPricingReview="customer" />);
    expect(screen.getByRole('alert')).toHaveTextContent(/contact Harris Boat Works/i);
    const plan=screen.getByRole('button',{name:/8 years total coverage, add \$1,057 CAD/i});
    expect(plan).toBeDisabled();
    fireEvent.click(plan);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('requires staff to review custom charges before selecting the complete price', () => {
    const onChange=vi.fn();
    const legacy={extendedYears:3,totalYears:8,warrantyPrice:904};
    const view=render(<PlatinumProtectionSelector horsepower={60} currentCoverageYears={5}
      value={legacy} onChange={onChange} customPricingReview="staff" />);
    const plan=screen.getByRole('button',{name:/8 years total coverage, add \$1,057 CAD/i});
    expect(plan).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox'));
    expect(plan).not.toBeDisabled();
    fireEvent.click(plan);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({warrantyPrice:1057,goldUpgradePrice:153,platinumExtensionPrice:904}));
    view.rerender(<PlatinumProtectionSelector horsepower={60} currentCoverageYears={5}
      value={{...legacy}} onChange={onChange} customPricingReview="staff" />);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('allows a Gold conversion even when eight chronological years are included', () => {
    const onChange=vi.fn();
    render(<PlatinumProtectionSelector horsepower={60} currentCoverageYears={8} value={null} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button',{name:/8 years total coverage, add \$328 CAD/i}));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({extendedYears:0,totalYears:8,warrantyPrice:328,goldUpgradeYears:5}));
  });

});
