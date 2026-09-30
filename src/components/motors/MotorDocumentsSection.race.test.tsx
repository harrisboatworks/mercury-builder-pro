import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MotorDocumentsSection from './MotorDocumentsSection';

type QueryResult = { data: Array<Record<string, unknown>>; error: null };
type Resolver = (result: QueryResult) => void;
type PendingQuery = { motorId: string; filter: string; resolve: Resolver };

const queries = vi.hoisted(() => ({
  current: [] as PendingQuery[],
}));

vi.mock('../../integrations/supabase/client', () => ({
  supabase: {
    from: () => {
      let motorId = '';
      let filter = '';
      let orders = 0;
      const chain: Record<string, unknown> = {
        select: () => chain,
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
    id: `doc-${motorId}-${title}`,
    media_type: 'pdf',
    media_category: 'manual',
    media_url: 'https://example.invalid/object/public/docs/manual.pdf',
    title,
    description: null,
    file_size: null,
  };
}

function settle(index: number, motorId: string, title: string) {
  queries.current[index].resolve({ data: [row(motorId, title)], error: null });
}

afterEach(() => {
  cleanup();
  queries.current = [];
});

describe('MotorDocumentsSection stale responses', () => {
  it('shows documents for the motor that was requested', async () => {
    render(<MotorDocumentsSection motorId="motor-a" />);
    await waitFor(() => expect(queries.current).toHaveLength(1));

    await act(async () => {
      settle(0, 'motor-a', 'alpha-manual');
    });

    expect(await screen.findByRole('heading', { name: 'Alpha Manual' })).toBeTruthy();
  });

  it('ignores a document response after the motor id has changed', async () => {
    const { rerender } = render(<MotorDocumentsSection motorId="motor-a" />);
    await waitFor(() => expect(queries.current).toHaveLength(1));

    rerender(<MotorDocumentsSection motorId="motor-b" />);
    await waitFor(() => expect(queries.current).toHaveLength(2));

    await act(async () => {
      settle(1, 'motor-b', 'bravo-manual');
    });
    expect(await screen.findByRole('heading', { name: 'Bravo Manual' })).toBeTruthy();

    await act(async () => {
      settle(0, 'motor-a', 'alpha-manual');
    });

    expect(screen.queryByRole('heading', { name: 'Alpha Manual' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Bravo Manual' })).toBeTruthy();
  });

  it('keeps the newer request loading when the older response settles first', async () => {
    const { rerender } = render(<MotorDocumentsSection motorId="motor-a" />);
    await waitFor(() => expect(queries.current).toHaveLength(1));

    rerender(<MotorDocumentsSection motorId="motor-b" />);
    await waitFor(() => expect(queries.current).toHaveLength(2));
    expect(screen.getByText('Loading documents...')).toBeTruthy();

    await act(async () => {
      settle(0, 'motor-a', 'alpha-manual');
    });

    expect(screen.queryByRole('heading', { name: 'Alpha Manual' })).toBeNull();
    expect(screen.getByText('Loading documents...')).toBeTruthy();

    await act(async () => {
      settle(1, 'motor-b', 'bravo-manual');
    });

    expect(await screen.findByRole('heading', { name: 'Bravo Manual' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Alpha Manual' })).toBeNull();
    expect(screen.queryByText('Loading documents...')).toBeNull();
  });

  it('ignores the previous response when only motorFamily changes', async () => {
    const { rerender } = render(
      <MotorDocumentsSection motorId="motor-a" motorFamily="fourstroke" />,
    );
    await waitFor(() => expect(queries.current).toHaveLength(1));

    rerender(<MotorDocumentsSection motorId="motor-a" motorFamily="pro-xs" />);
    await waitFor(() => expect(queries.current).toHaveLength(2));

    expect(queries.current[0].motorId).toBe('motor-a');
    expect(queries.current[1].motorId).toBe('motor-a');
    expect(queries.current[1].filter).toBe(queries.current[0].filter);
    expect(queries.current[0].filter).not.toContain('fourstroke');
    expect(queries.current[0].filter).not.toContain('pro-xs');
    expect(screen.getByText('Loading documents...')).toBeTruthy();

    await act(async () => {
      settle(0, 'motor-a', 'alpha-manual');
    });

    expect(screen.queryByRole('heading', { name: 'Alpha Manual' })).toBeNull();
    expect(screen.getByText('Loading documents...')).toBeTruthy();

    await act(async () => {
      settle(1, 'motor-a', 'second-manual');
    });

    expect(await screen.findByRole('heading', { name: 'Second Manual' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Alpha Manual' })).toBeNull();
    expect(screen.queryByText('Loading documents...')).toBeNull();
  });
});
