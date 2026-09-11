import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  toast: vi.fn(),
  upsert: vi.fn(),
  upsertResult: { error: null as { message: string } | null },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock('@/components/admin/AdminNav', () => ({
  default: () => <div>Admin nav</div>,
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      if (table !== 'admin_sources') throw new Error(`unexpected table ${table}`);
      return {
        select: () => ({
          in: () => Promise.resolve({ data: [], error: null }),
        }),
        upsert: (payload: unknown) => {
          mocks.upsert(payload);
          return Promise.resolve(mocks.upsertResult);
        },
      };
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ error: null }),
        createSignedUrl: () => Promise.resolve({ data: { signedUrl: 'https://example.com/price.csv' } }),
      }),
    },
  },
}));

import AdminConnectors from './AdminConnectors';

describe('AdminConnectors source writes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.upsertResult = { error: null };
  });

  it('does not claim Files Uploaded when the admin_sources upsert is rejected', async () => {
    mocks.upsertResult = { error: { message: 'permission denied' } };

    render(<AdminConnectors />);

    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    const file = new File(['sku,price'], 'pricelist.csv', { type: 'text/csv' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    fireEvent.click(screen.getByRole('button', { name: /Upload & Capture/i }));

    await waitFor(() => {
      expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Upload Error',
        variant: 'destructive',
      }));
    });

    expect(mocks.upsert).toHaveBeenCalled();
    expect(mocks.toast).not.toHaveBeenCalledWith(expect.objectContaining({
      title: 'Files Uploaded',
    }));
  });
});
