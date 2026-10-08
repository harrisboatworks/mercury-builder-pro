// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';

import { BlogTable } from './BlogTable';

function mockTableOverflow(scrollWidth: number, clientWidth: number) {
  vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function () {
    return this.classList.contains('blog-table-scroll') ? scrollWidth : 0;
  });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function () {
    return this.classList.contains('blog-table-scroll') ? clientWidth : 0;
  });
}

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

  it('does not render an overflow hint unless the article opts in', () => {
    mockTableOverflow(640, 332);

    render(
      <BlogTable>
        <thead>
          <tr>
            <th>Feature</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Rated power</td>
            <td>150 HP</td>
          </tr>
        </tbody>
      </BlogTable>,
    );

    expect(screen.queryByText('Scroll sideways for more columns')).not.toBeInTheDocument();
    expect(document.querySelector('[data-table-overflow-hint]')).toBeNull();
  });

  it('shows a persistent overflow hint only while the table is wider than its region', () => {
    const table = (
      <BlogTable overflowHint>
        <thead>
          <tr>
            <th>Feature</th>
            <th>150 FourStroke</th>
            <th>150 Pro XS</th>
            <th>What it means</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Rated power</td>
            <td>150 HP</td>
            <td>150 HP</td>
            <td>Same rating</td>
          </tr>
        </tbody>
      </BlogTable>
    );

    mockTableOverflow(640, 332);
    const overflowing = render(table);
    const region = screen.getByRole('region', { name: 'Scrollable table' });
    const hint = screen.getByText('Scroll sideways for more columns');

    expect(region).toHaveAttribute('tabIndex', '0');
    expect(region).toHaveClass('blog-table-scroll');
    expect(region).toHaveAttribute('aria-describedby', hint.id);
    expect(document.querySelector('[data-table-overflow-fade]')).toHaveClass('pointer-events-none');
    overflowing.unmount();

    mockTableOverflow(332, 332);
    render(table);

    expect(screen.queryByText('Scroll sideways for more columns')).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Scrollable table' })).not.toHaveAttribute(
      'aria-describedby',
    );
  });

  it('keeps keyboard scrolling and published-test links working when the hint is shown', () => {
    mockTableOverflow(640, 332);

    render(
      <BlogTable overflowHint>
        <thead>
          <tr>
            <th>Boat</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <a href="https://boattest.com/boats/nitro/z18-w-mercury-150-hp-pro-xs-2019">
                2019 Nitro Z18
              </a>
            </td>
            <td>60.2 mph</td>
          </tr>
        </tbody>
      </BlogTable>,
    );

    const region = screen.getByRole('region', { name: 'Scrollable table' });
    region.focus();
    expect(region).toHaveFocus();
    expect(fireEvent.keyDown(region, { key: 'ArrowRight' })).toBe(true);
    expect(fireEvent.keyDown(region, { key: 'ArrowLeft' })).toBe(true);

    expect(
      screen.getByRole('link', { name: '2019 Nitro Z18' }),
    ).toHaveAttribute(
      'href',
      'https://boattest.com/boats/nitro/z18-w-mercury-150-hp-pro-xs-2019',
    );
  });
});
