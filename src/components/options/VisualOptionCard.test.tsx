import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { VisualOptionCard } from './VisualOptionCard';
import type { MotorOption } from '@/hooks/useMotorOptions';

const option: MotorOption = {
  id: 'service-kit',
  name: '100-Hour Service Kit',
  description: null,
  short_description: 'Filters and gear lube',
  category: 'maintenance',
  base_price: 132.53,
  msrp: null,
  image_url: '/service-kit.webp',
  part_number: null,
  is_taxable: true,
  display_order: 1,
  specifications: null,
  features: [],
  assignment_type: 'available',
  price_override: null,
  is_included: false,
};

describe('VisualOptionCard', () => {
  it('can be selected from the keyboard and exposes a precise details label', () => {
    const onToggle = vi.fn();
    render(
      <VisualOptionCard
        option={option}
        isSelected={false}
        onToggle={onToggle}
        onViewDetails={() => {}}
      />,
    );

    const card = screen.getByRole('checkbox', { name: 'Add 100-Hour Service Kit' });
    expect(card).toHaveAttribute('aria-checked', 'false');
    fireEvent.keyDown(card, { key: 'Enter' });
    fireEvent.keyDown(card, { key: ' ' });
    expect(onToggle).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('button', { name: 'View details for 100-Hour Service Kit' })).toBeInTheDocument();
  });
});
