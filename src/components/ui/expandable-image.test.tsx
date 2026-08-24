import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ExpandableImage } from './expandable-image';

describe('ExpandableImage', () => {
  it('exposes a named image trigger and an accessible lightbox dialog', () => {
    render(
      <ExpandableImage
        src="/lovable-uploads/inline/lock-chamber.png"
        alt="Pleasure boat in a lock chamber"
      />,
    );

    const trigger = screen.getByRole('button', {
      name: 'Expand image: Pleasure boat in a lock chamber',
    });

    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(trigger);

    expect(
      screen.getByRole('dialog', {
        name: 'Expanded image: Pleasure boat in a lock chamber',
      }),
    ).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Close expanded image' })).toHaveFocus();
  });

  it('closes on Escape and restores focus and body overflow', () => {
    document.body.style.overflow = 'clip';

    render(
      <ExpandableImage
        src="/lovable-uploads/inline/lock-chamber.png"
        alt="Pleasure boat in a lock chamber"
      />,
    );

    const trigger = screen.getByRole('button', {
      name: 'Expand image: Pleasure boat in a lock chamber',
    });

    fireEvent.click(trigger);
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('clip');
    expect(trigger).toHaveFocus();
  });
});
