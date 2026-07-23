import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BlogTable } from './BlogTable';

vi.stubGlobal(
  'IntersectionObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

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

    expect(row).toHaveClass('even:bg-repower-paper/30');
    expect(row).not.toHaveClass('hover:bg-mercury-red/5');
    expect(row).not.toHaveClass('transition-colors');
    expect(row).not.toHaveAttribute('role');
    expect(row).not.toHaveAttribute('tabindex');
  });
});
