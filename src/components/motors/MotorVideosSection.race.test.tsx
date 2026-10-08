import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MotorDetailsSheet from './MotorDetailsSheet';
import MotorVideosSection from './MotorVideosSection';

type QueryResult = { data: Array<Record<string, unknown>>; error: null };
type Resolver = (result: QueryResult) => void;
type PendingQuery = { motorId: string; filter: string; resolve: Resolver };

const queries = vi.hoisted(() => ({
  current: [] as PendingQuery[],
}));

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
    from: (table: string) => {
      if (table !== 'motor_media') return looseChain();
      let motorId = '';
      let filter = '';
      let orders = 0;
      let videos = false;
      const chain: Record<string, unknown> = {
        select: (columns: string) => {
          videos = !String(columns).includes('file_size');
          return chain;
        },
        or: (nextFilter: string) => {
          filter = nextFilter;
          motorId = nextFilter.match(/motor_id\.eq\.([^,]+)/)?.[1] ?? '';
          return chain;
        },
        in: () => chain,
        eq: () => chain,
        order: () => {
          orders += 1;
          if (orders < 2) return chain;
          if (!videos) return Promise.resolve({ data: [], error: null });
          return new Promise<QueryResult>((resolve) => {
            queries.current.push({ motorId, filter, resolve });
          });
        },
      };
      return chain;
    },
  },
}));

function row(motorId: string, title: string) {
  return {
    id: `vid-${motorId}-${title}`,
    media_type: 'video',
    media_category: 'demo',
    media_url: 'https://example.invalid/videos/synthetic.mp4',
    title,
    description: null,
  };
}

function settle(index: number, motorId: string, title: string) {
  queries.current[index].resolve({ data: [row(motorId, title)], error: null });
}

afterEach(() => {
  cleanup();
  queries.current = [];
});

function SectionCaller({
  motorId,
  motorFamily,
}: {
  motorId: string;
  motorFamily?: string;
}) {
  return <MotorVideosSection motorId={motorId} motorFamily={motorFamily} />;
}

describe('MotorVideosSection stale responses', () => {
  it('shows the video for the motor that was requested', async () => {
    render(<SectionCaller motorId="motor-a" />);
    await waitFor(() => expect(queries.current).toHaveLength(1));

    await act(async () => {
      settle(0, 'motor-a', 'Alpha Demo');
    });

    expect(await screen.findByRole('heading', { name: 'Alpha Demo' })).toBeTruthy();
  });

  it('keeps the newer request loading when the older response settles first', async () => {
    const { rerender } = render(<SectionCaller motorId="motor-a" />);
    await waitFor(() => expect(queries.current).toHaveLength(1));

    rerender(<SectionCaller motorId="motor-b" />);
    await waitFor(() => expect(queries.current).toHaveLength(2));
    expect(screen.getByText('Loading videos...')).toBeTruthy();

    await act(async () => {
      settle(0, 'motor-a', 'Alpha Demo');
    });

    expect(screen.queryByRole('heading', { name: 'Alpha Demo' })).toBeNull();
    expect(screen.getByText('Loading videos...')).toBeTruthy();

    await act(async () => {
      settle(1, 'motor-b', 'Bravo Demo');
    });

    expect(await screen.findByRole('heading', { name: 'Bravo Demo' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Alpha Demo' })).toBeNull();
    expect(screen.queryByText('Loading videos...')).toBeNull();
  });

  it('keeps the newer video when the older response arrives later', async () => {
    const { rerender } = render(<SectionCaller motorId="motor-a" />);
    await waitFor(() => expect(queries.current).toHaveLength(1));

    rerender(<SectionCaller motorId="motor-b" />);
    await waitFor(() => expect(queries.current).toHaveLength(2));

    await act(async () => {
      settle(1, 'motor-b', 'Bravo Demo');
    });
    expect(await screen.findByRole('heading', { name: 'Bravo Demo' })).toBeTruthy();

    await act(async () => {
      settle(0, 'motor-a', 'Alpha Demo');
    });

    expect(screen.queryByRole('heading', { name: 'Alpha Demo' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Bravo Demo' })).toBeTruthy();
  });

  it('ignores the previous response when only motorFamily changes', async () => {
    const { rerender } = render(<SectionCaller motorId="motor-a" motorFamily="fourstroke" />);
    await waitFor(() => expect(queries.current).toHaveLength(1));

    rerender(<SectionCaller motorId="motor-a" motorFamily="pro-xs" />);
    await waitFor(() => expect(queries.current).toHaveLength(2));

    expect(queries.current[0].motorId).toBe('motor-a');
    expect(queries.current[1].motorId).toBe('motor-a');
    expect(queries.current[1].filter).toBe(queries.current[0].filter);
    expect(queries.current[0].filter).not.toContain('fourstroke');
    expect(queries.current[0].filter).not.toContain('pro-xs');
    expect(screen.getByText('Loading videos...')).toBeTruthy();

    await act(async () => {
      settle(0, 'motor-a', 'Alpha Demo');
    });

    expect(screen.queryByRole('heading', { name: 'Alpha Demo' })).toBeNull();
    expect(screen.getByText('Loading videos...')).toBeTruthy();

    await act(async () => {
      settle(1, 'motor-a', 'Second Demo');
    });

    expect(await screen.findByRole('heading', { name: 'Second Demo' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Alpha Demo' })).toBeNull();
    expect(screen.queryByText('Loading videos...')).toBeNull();
  });

  it('keeps one sheet instance when the motor id changes and an older video response settles', async () => {
    const motor = (id: string, family: string) =>
      ({ id, family, model: `${family} model`, hp: 25, price: 1000 });

    const { rerender } = render(
      <MemoryRouter>
        <MotorDetailsSheet open onClose={() => undefined} title="Synthetic motor" motor={motor('motor-a', 'fourstroke')} />
      </MemoryRouter>,
    );
    await waitFor(() => expect(queries.current.some((query) => query.motorId === 'motor-a')).toBe(true));
    const first = queries.current.length;

    rerender(
      <MemoryRouter>
        <MotorDetailsSheet open onClose={() => undefined} title="Synthetic motor" motor={motor('motor-b', 'pro-xs')} />
      </MemoryRouter>,
    );
    await waitFor(() => expect(queries.current.length).toBeGreaterThan(first));

    const alphaIndex = queries.current.findIndex((query) => query.motorId === 'motor-a');
    const bravoIndex = queries.current.findIndex((query) => query.motorId === 'motor-b');
    expect(alphaIndex).toBeGreaterThanOrEqual(0);
    expect(bravoIndex).toBeGreaterThan(alphaIndex);

    await act(async () => {
      settle(alphaIndex, 'motor-a', 'Alpha Demo');
    });

    expect(screen.queryByRole('heading', { name: 'Alpha Demo' })).toBeNull();
    expect(screen.getByText('Loading videos...')).toBeTruthy();

    await act(async () => {
      settle(bravoIndex, 'motor-b', 'Bravo Demo');
    });

    expect(await screen.findByRole('heading', { name: 'Bravo Demo' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Alpha Demo' })).toBeNull();
  });
});
