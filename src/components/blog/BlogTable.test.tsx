// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterAll, describe, expect, it, vi } from 'vitest';

import { BlogTable } from './BlogTable';

vi.stubGlobal(
  'IntersectionObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

afterAll(() => {
  vi.unstubAllGlobals();
});

describe('BlogTable', () => {
  it('keeps non-interactive body rows visually static', () => {
    render(
      <BlogTable>
        <thead>
          <tr>
            <th>Pattern</th>
            <th>When it happens</th>
          </tr>
        </thead>
        <tbody>
          <tr data-testid="alarm-row">
            <td>Alarm at WOT only</td>
            <td>At wide-open throttle</td>
          </tr>
        </tbody>
      </BlogTable>,
    );

    const row = screen.getByTestId('alarm-row');

    expect(row).not.toHaveClass('hover:bg-mercury-red/5');
    expect(row).not.toHaveClass('transition-colors');
  });

  it('preserves hover feedback for intentionally interactive body rows', () => {
    const onClick = vi.fn();

    render(
      <BlogTable>
        <tbody>
          <tr data-testid="interactive-row" onClick={onClick} tabIndex={0}>
            <td>Open details</td>
          </tr>
        </tbody>
      </BlogTable>,
    );

    const row = screen.getByTestId('interactive-row');

    expect(row).toHaveClass('hover:bg-mercury-red/5');
    expect(row).toHaveClass('transition-colors');
    fireEvent.click(row);
    expect(onClick).toHaveBeenCalledOnce();
  });
});
