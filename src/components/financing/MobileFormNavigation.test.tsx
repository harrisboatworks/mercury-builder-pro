import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MobileFormNavigation } from './MobileFormNavigation';

vi.mock('@/hooks/useHapticFeedback', () => ({
  useHapticFeedback: () => ({ triggerHaptic: vi.fn() }),
}));

describe('MobileFormNavigation', () => {
  it('uses the supplied next handler without also submitting the parent form', () => {
    const onNext = vi.fn();
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());

    render(
      <form onSubmit={onSubmit}>
        <MobileFormNavigation onNext={onNext} showBack={false} />
      </form>,
    );

    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
