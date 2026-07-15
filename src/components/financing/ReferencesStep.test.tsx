import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReferencesStep } from './ReferencesStep';

const dispatch = vi.fn();

vi.mock('@/contexts/FinancingContext', () => ({
  useFinancing: () => ({
    state: { references: null },
    dispatch,
  }),
}));

vi.mock('@/hooks/useHapticFeedback', () => ({
  useHapticFeedback: () => ({ triggerHaptic: vi.fn() }),
}));

describe('ReferencesStep', () => {
  beforeEach(() => {
    dispatch.mockClear();
  });

  it('turns an invalid Continue click into actionable field feedback', async () => {
    render(<ReferencesStep />);

    const continueButton = screen.getByRole('button', { name: /continue to review/i });
    expect(continueButton).toBeEnabled();

    fireEvent.click(continueButton);

    expect(
      await screen.findByText(/complete the highlighted reference fields before continuing/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/full name is required/i)).toHaveLength(2);
    expect(dispatch).not.toHaveBeenCalled();
  });
});
