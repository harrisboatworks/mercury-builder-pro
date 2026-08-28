import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { RebateMatrix } from '../RebateMatrix';

const matrix = [
  { hp_min: 2.5, hp_max: 9.9, rebate: 100 },
  { hp_min: 10, hp_max: 30, rebate: 250 },
  { hp_min: 40, hp_max: 115, rebate: 500 },
  { hp_min: 150, hp_max: 300, rebate: 1500 },
];

// Lightweight visual regression: snapshot the DOM (classes + structure) for
// each layout variant. Any unintended style or markup change will break the
// snapshot and require explicit acknowledgement via `vitest -u`.
describe('RebateMatrix visual regression snapshots', () => {
  it('full layout, no highlight (desktop default)', () => {
    const { container } = render(<RebateMatrix matrix={matrix} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('full layout, highlightHP=90 (gold dot on 40–115HP)', () => {
    const { container } = render(<RebateMatrix matrix={matrix} highlightHP={90} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('compact layout, no highlight (mobile / inside ChooseOneCard)', () => {
    const { container } = render(<RebateMatrix matrix={matrix} compact />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('compact layout, highlightHP=200 (gold dot on 150–300HP)', () => {
    const { container } = render(
      <RebateMatrix matrix={matrix} highlightHP={200} compact />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
