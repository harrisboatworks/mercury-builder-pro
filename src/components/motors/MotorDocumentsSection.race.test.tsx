import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MotorDocumentsSection from './MotorDocumentsSection';

type QueryResult = { data: Array<Record<string, unknown>>; error: null };
type Resolver = (result: QueryResult) => void;

const pending = vi.hoisted(() => ({
  current: new Map<string, Resolver>(),
}));

vi.mock('../../integrations/supabase/client', () => ({
  supabase: {
    from: () => {
      let motorId = '';
      let orders = 0;
      const chain: Record<string, unknown> = {
        select: () => chain,
        or: (filter: string) => {
          motorId = filter.match(/motor_id\.eq\.([^,]+)/)?.[1] ?? '';
          return chain;
        },
        in: () => chain,
        eq: () => chain,
        order: () => {
          orders += 1;
          if (orders < 2) return chain;
          return new Promise<QueryResult>((resolve) => {
            pending.current.set(motorId, resolve);
          });
        },
      };
      return chain;
    },
  },
}));

function row(motorId: string, title: string) {
  return {
    id: `doc-${motorId}`,
    media_type: 'pdf',
    media_category: 'manual',
    media_url: 'https://example.invalid/object/public/docs/manual.pdf',
    title,
    description: null,
    file_size: null,
  };
}

afterEach(() => {
  cleanup();
  pending.current = new Map();
});

describe('MotorDocumentsSection stale responses', () => {
  it('shows documents for the motor that was requested', async () => {
    render(<MotorDocumentsSection motorId="motor-a" />);
    await waitFor(() => expect(pending.current.has('motor-a')).toBe(true));

    await act(async () => {
      pending.current.get('motor-a')!({ data: [row('motor-a', 'alpha-manual')], error: null });
    });

    expect(await screen.findByRole('heading', { name: 'Alpha Manual' })).toBeTruthy();
  });

  it('ignores a document response after the motor id has changed', async () => {
    const { rerender } = render(<MotorDocumentsSection motorId="motor-a" />);
    await waitFor(() => expect(pending.current.has('motor-a')).toBe(true));

    rerender(<MotorDocumentsSection motorId="motor-b" />);
    await waitFor(() => expect(pending.current.has('motor-b')).toBe(true));

    await act(async () => {
      pending.current.get('motor-b')!({ data: [row('motor-b', 'bravo-manual')], error: null });
    });
    expect(await screen.findByRole('heading', { name: 'Bravo Manual' })).toBeTruthy();

    await act(async () => {
      pending.current.get('motor-a')!({ data: [row('motor-a', 'alpha-manual')], error: null });
    });

    expect(screen.queryByRole('heading', { name: 'Alpha Manual' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Bravo Manual' })).toBeTruthy();
  });
});
