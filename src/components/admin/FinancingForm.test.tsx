import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FinancingForm from './FinancingForm';

describe('FinancingForm resolver compatibility', () => {
  it('hydrates, coerces numeric inputs, and submits cleaned non-promo values', async () => {
    const onSubmit = vi.fn();

    render(<FinancingForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Standard financing' },
    });
    fireEvent.change(screen.getByLabelText('Rate (%)'), {
      target: { value: '6.49' },
    });
    fireEvent.change(screen.getByLabelText('Term (months)'), {
      target: { value: '72' },
    });
    fireEvent.change(screen.getByLabelText('Minimum Amount ($)'), {
      target: { value: '7500.50' },
    });
    fireEvent.change(screen.getByLabelText('Display Order'), {
      target: { value: '3' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Standard financing',
      rate: 6.49,
      term_months: 72,
      min_amount: 7500.5,
      is_promo: false,
      promo_text: null,
      promo_end_date: null,
      is_active: true,
      display_order: 3,
    });
  });

  it('keeps invalid values from reaching the submit handler', async () => {
    const onSubmit = vi.fn();

    render(<FinancingForm onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Rate (%)'), { target: { value: '-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(await screen.findByText('Rate must be >= 0')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
