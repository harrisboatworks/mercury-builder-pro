import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

  it('points the dialog aria-describedby at the rendered instruction description', () => {
    render(
      <ExpandableImage
        src="/lovable-uploads/inline/lock-chamber.png"
        alt="Pleasure boat in a lock chamber"
      />,
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Expand image: Pleasure boat in a lock chamber',
      }),
    );

    const dialog = screen.getByRole('dialog', {
      name: 'Expanded image: Pleasure boat in a lock chamber',
    });
    const describedBy = dialog.getAttribute('aria-describedby');

    expect(describedBy).toBeTruthy();

    const description = document.getElementById(describedBy!);

    expect(description).toBeTruthy();
    expect(description).toHaveTextContent('Click outside or press ESC to close');
    expect(description).toHaveTextContent('Pinch to zoom • Tap outside to close');
  });

  it('traps focus, closes on Escape, and restores focus to the trigger', async () => {
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
    const closeButton = screen.getByRole('button', { name: 'Close expanded image' });

    expect(closeButton).toHaveFocus();
    fireEvent.keyDown(closeButton, { key: 'Tab' });
    expect(closeButton).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
