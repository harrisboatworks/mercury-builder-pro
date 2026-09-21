// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TableOfContents } from './TableOfContents';

vi.stubGlobal(
  'IntersectionObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(() => {
  vi.unstubAllGlobals();
});

const items = [
  { id: 'fourstroke-vs-pro-xs-the-differences-that-matter', text: 'FourStroke vs Pro XS: The Differences That Matter', level: 2 as const },
  { id: 'choose-the-standard-150-fourstroke-when', text: 'Choose the standard 150 FourStroke when', level: 3 as const },
];

describe('TableOfContents', () => {
  beforeEach(() => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 1;
    });
    document.body.innerHTML = '';
    const heading = document.createElement('h3');
    heading.id = 'choose-the-standard-150-fourstroke-when';
    document.body.append(heading);
    heading.scrollIntoView = vi.fn();
  });

  it('keeps the compact default toggle and nested target classes', () => {
    render(<TableOfContents items={items} />);

    expect(screen.getByRole('button', { name: 'Table of Contents' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show table of contents' })).not.toBeInTheDocument();

    const nested = screen.getByRole('link', { name: 'Choose the standard 150 FourStroke when' });
    expect(nested).toHaveAttribute('href', '#choose-the-standard-150-fourstroke-when');
    expect(nested.className).toContain('py-1');
    expect(nested.className).not.toContain('min-h-11');
  });

  it('uses explicit show/hide labels and generous mobile targets when opted in', () => {
    render(<TableOfContents items={items} mobileAffordances />);

    const toggle = screen.getByRole('button', { name: 'Show table of contents' });
    const panel = document.getElementById(toggle.getAttribute('aria-controls')!);
    const nested = screen.getByRole('link', { name: 'Choose the standard 150 FourStroke when' });
    const section = screen.getByRole('link', {
      name: 'FourStroke vs Pro XS: The Differences That Matter',
    });

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(panel).toHaveClass('hidden');
    expect(nested).toHaveAttribute('href', '#choose-the-standard-150-fourstroke-when');
    expect(nested.className).toContain('min-h-11');
    expect(section.className).toContain('min-h-11');
    expect(section).toHaveAttribute('href', '#fourstroke-vs-pro-xs-the-differences-that-matter');

    fireEvent.click(toggle);
    expect(screen.getByRole('button', { name: 'Hide table of contents' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(panel).toHaveClass('block');
    expect(panel).not.toHaveClass('hidden');

    fireEvent.click(nested);
    expect(screen.getByRole('button', { name: 'Show table of contents' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(panel).toHaveClass('hidden');
    expect(document.getElementById('choose-the-standard-150-fourstroke-when')?.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });
  });
});
