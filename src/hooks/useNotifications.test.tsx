import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationBadge } from '@/components/notifications/NotificationBadge';
import { NotificationList } from '@/components/notifications/NotificationList';
import type { Notification } from './useNotifications';

type RealtimePayload = { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; new?: Partial<Notification>; old?: Partial<Notification> };

const { realtime, rows, auth } = vi.hoisted(() => ({
  realtime: { handlers: [] as Array<(payload: RealtimePayload) => void> },
  rows: { current: [] as Notification[] },
  auth: { user: { id: 'synthetic-user' } },
}));

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => auth,
}));

vi.mock('@/integrations/supabase/client', () => {
  const query = () => {
    let op = 'select';
    const chain: Record<string, unknown> = {};
    for (const method of ['select', 'eq', 'order', 'limit']) chain[method] = () => chain;
    chain.update = () => { op = 'update'; return chain; };
    chain.delete = () => { op = 'delete'; return chain; };
    chain.then = (resolve: (value: unknown) => unknown) =>
      Promise.resolve(op === 'select' ? { data: rows.current, error: null } : { error: null }).then(resolve);
    return chain;
  };
  type Channel = { handler?: (payload: RealtimePayload) => void; on: unknown; subscribe: () => Channel };
  const channel = () => {
    const ch: Channel = {
      on: (_event: string, _filter: unknown, handler: (payload: RealtimePayload) => void) => {
        ch.handler = handler;
        realtime.handlers.push(handler);
        return ch;
      },
      subscribe: () => ch,
    };
    return ch;
  };
  const removeChannel = (ch: Channel) => {
    realtime.handlers = realtime.handlers.filter(handler => handler !== ch.handler);
  };
  return { supabase: { from: query, channel, removeChannel } };
});

const notification = (id: string, read: boolean): Notification => ({
  id,
  user_id: 'synthetic-user',
  title: `Synthetic ${id}`,
  message: `Synthetic message ${id}`,
  type: 'info',
  read,
  metadata: {},
  channel: 'in_app',
  created_at: '2026-09-29T12:00:00Z',
});

const broadcast = (payload: RealtimePayload) => act(() => realtime.handlers.forEach(handler => handler(payload)));

const rowButtons = (id: string) =>
  within(screen.getByText(`Synthetic ${id}`).closest('div.relative') as HTMLElement).getAllByRole('button');

const renderDashboard = async () => {
  render(
    <>
      <div data-testid="badge"><NotificationBadge /></div>
      <NotificationList />
    </>,
  );
  await screen.findByText('Synthetic n1');
  await waitFor(() => expect(screen.getByTestId('badge').textContent).toBe('2'));
};

beforeEach(() => {
  realtime.handlers = [];
  rows.current = [notification('n1', false), notification('n2', false), notification('n3', true)];
});

afterEach(cleanup);

describe('useNotifications unread count across hook instances', () => {
  it('drops the badge when another view deletes an unread notification', async () => {
    await renderDashboard();

    const [, deleteButton] = rowButtons('n1');
    await act(async () => { fireEvent.click(deleteButton); });
    await waitFor(() => expect(screen.queryByText('Synthetic n1')).toBeNull());
    broadcast({ eventType: 'DELETE', old: { id: 'n1' } });

    expect(screen.getByTestId('badge').textContent).toBe('1');
  });

  it('drops the badge when another view marks a notification read', async () => {
    await renderDashboard();

    const [markReadButton] = rowButtons('n2');
    await act(async () => { fireEvent.click(markReadButton); });
    broadcast({ eventType: 'UPDATE', new: { ...notification('n2', true) } });

    expect(screen.getByTestId('badge').textContent).toBe('1');
  });

  it('keeps the count for read deletions and counts unread inserts once', async () => {
    await renderDashboard();

    broadcast({ eventType: 'DELETE', old: { id: 'n3' } });
    expect(screen.getByTestId('badge').textContent).toBe('2');

    broadcast({ eventType: 'INSERT', new: notification('n4', false) });
    expect(screen.getByTestId('badge').textContent).toBe('3');
  });
});
