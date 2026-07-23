import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MaskedInput } from './MaskedInput';

describe('MaskedInput', () => {
  it('obscures a SIN by default and preserves the React change-event contract', () => {
    let receivedValue = '';
    const onChange = vi.fn((event: React.ChangeEvent<HTMLInputElement>) => {
      receivedValue = event.target.value;
    });

    render(
      <MaskedInput
        maskType="sin"
        sensitive
        value="123456789"
        onChange={onChange}
      />,
    );

    const input = screen.getByPlaceholderText('123-456-789');
    expect(input).toHaveAttribute('type', 'password');

    fireEvent.change(input, { target: { value: '987-654-321' } });
    expect(onChange).toHaveBeenCalledOnce();
    expect(receivedValue).toBe('987654321');

    fireEvent.click(screen.getByRole('button', { name: 'Show Social Insurance Number' }));
    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Hide Social Insurance Number' })).toBeInTheDocument();
  });
});
