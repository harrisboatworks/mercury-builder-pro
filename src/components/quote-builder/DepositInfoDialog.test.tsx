// @vitest-environment happy-dom
import '@testing-library/jest-dom/vitest';

import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}));

import { DepositInfoDialog } from './DepositInfoDialog';

describe('DepositInfoDialog', () => {
  it('associates validation errors with the required deposit fields', () => {
    render(
      <DepositInfoDialog
        open
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
        depositAmount={100}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Review Secure Checkout' }));

    const name = screen.getByLabelText(/Full Name/i);
    const email = screen.getByLabelText(/Email Address/i);
    const phone = screen.getByLabelText(/Phone Number/i);
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(phone).toHaveAttribute('aria-invalid', 'true');
    expect(name).toHaveAccessibleDescription('Name is required');
    expect(screen.getAllByRole('alert')[0]).toHaveTextContent('Name is required');
  });
});
