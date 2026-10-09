import { cleanup, render, screen } from '@testing-library/react';
import { existsSync, readFileSync } from 'node:fs';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { STALE_SMART_REVIEW_STORAGE_KEY } from '../../lib/data/mercury-reviews';
import MotorDetailsSheet from './MotorDetailsSheet';

const read = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), 'utf8');

function looseChain() {
  const chain: Record<string, unknown> = {};
  const self = () => chain;
  for (const method of ['select', 'eq', 'in', 'or', 'order', 'gte', 'lte', 'limit', 'is', 'neq', 'filter']) {
    chain[method] = self;
  }
  chain.single = () => Promise.resolve({ data: null, error: null });
  chain.maybeSingle = () => Promise.resolve({ data: null, error: null });
  chain.then = (resolve: (value: unknown) => unknown) =>
    Promise.resolve({ data: [], error: null }).then(resolve);
  return chain;
}

vi.mock('./FinanceCalculatorDrawer', () => ({
  FinanceCalculatorDrawer: () => null,
}));

vi.mock('../../integrations/supabase/client', () => ({
  supabase: {
    from: () => looseChain(),
  },
}));

const PLACEHOLDER_COMMENT = 'My dad bought his first Merc from Harris in 1971.';

function seedCachedPlaceholder() {
  localStorage.setItem(
    STALE_SMART_REVIEW_STORAGE_KEY,
    JSON.stringify({
      '115_115 HP FourStroke': {
        lastViewDate: new Date().toDateString(),
        selectedReview: {
          motorHP: 115,
          comment: PLACEHOLDER_COMMENT,
          reviewer: 'Tony Russo',
          location: 'Oshawa, ON',
          rating: 5,
          verified: true,
        },
        viewCount: 3,
      },
    }),
  );
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('MotorDetailsSheet customer reviews', () => {
  it('does not replay a same-day cached placeholder review', () => {
    seedCachedPlaceholder();

    render(
      <MemoryRouter>
        <MotorDetailsSheet
          open
          onClose={() => undefined}
          title="115 HP FourStroke"
          hp={115}
          motor={{ id: 'motor-115', family: 'fourstroke', model: '115 FourStroke', hp: 115, price: 12000 }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: '115 HP FourStroke' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Specifications' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Customer Review' })).toBeNull();
    expect(screen.queryByText('Tony Russo')).toBeNull();
    expect(screen.queryByText(PLACEHOLDER_COMMENT)).toBeNull();
    expect(screen.queryByText(/Verified Purchase/i)).toBeNull();
  });

  it('has no smart-review rotation or Customer Review block in either motor details view', () => {
    const sheet = read('./MotorDetailsSheet.tsx');
    const modal = read('./MotorDetailsPremiumModal.tsx');
    const boot = read('../../main.tsx');

    for (const source of [sheet, modal]) {
      expect(source).not.toContain('useSmartReviewRotation');
      expect(source).not.toContain('smart-review-rotation');
      expect(source).not.toContain('Customer Review');
      expect(source).not.toContain('smartReview');
    }

    expect(existsSync(new URL('../../lib/smart-review-rotation.ts', import.meta.url))).toBe(false);
    expect(boot).toContain('clearStaleSmartReviewCache');
  });
});
