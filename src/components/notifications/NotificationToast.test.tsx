import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NotificationToast } from './NotificationToast';

const { auth, realtime, toast, removeChannel } = vi.hoisted(() => ({
  auth: { available: true, value: { user: { id: 'synthetic-user' } } },
  realtime: { handlers: [] as Array<(payload: { new: Record<string, unknown> }) => void>, subscribed: 0 },
  toast: vi.fn(),
  removeChannel: vi.fn(),
}));

vi.mock('sonner', () => ({ toast }));

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => {
    if (!auth.available) throw new Error('useAuth must be used within an AuthProvider');
    return auth.value;
  },
}));

vi.mock('@/integrations/supabase/client', () => {
  const channel = () => {
    const ch = {
      on: (_event: string, _filter: unknown, handler: (payload: { new: Record<string, unknown> }) => void) => {
        realtime.handlers.push(handler);
        return ch;
      },
      subscribe: () => { realtime.subscribed++; return ch; },
    };
    return ch;
  };
  return { supabase: { channel, removeChannel } };
});

afterEach(() => {
  cleanup();
  auth.available = true;
  realtime.handlers = [];
  realtime.subscribed = 0;
  toast.mockReset();
  removeChannel.mockReset();
});

describe('NotificationToast', () => {
  it('renders nothing and does not subscribe without an auth provider', () => {
    auth.available = false;
    const { container } = render(<NotificationToast />);
    expect(container.innerHTML).toBe('');
    expect(realtime.subscribed).toBe(0);
  });

  it('shows a toast for a new unread notification', () => {
    render(<NotificationToast />);
    expect(realtime.subscribed).toBe(1);

    act(() => realtime.handlers[0]({ new: { title: 'Synthetic title', message: 'Synthetic body', read: false } }));
    expect(toast).toHaveBeenCalledWith('Synthetic title', expect.objectContaining({ description: 'Synthetic body' }));
  });

  it('removes the realtime subscription when the auth context disappears after mounting', () => {
    const { rerender, container, unmount } = render(<NotificationToast />);
    expect(realtime.subscribed).toBe(1);

    auth.available = false;
    rerender(<NotificationToast />);

    // Cleanup must run on the auth transition itself, before teardown.
    expect(container.innerHTML).toBe('');
    expect(removeChannel).toHaveBeenCalledTimes(1);

    unmount();
    expect(removeChannel).toHaveBeenCalledTimes(1);
  });
});
