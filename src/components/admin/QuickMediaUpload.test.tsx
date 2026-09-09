import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  toast: vi.fn(),
  insert: vi.fn(),
  insertResult: { error: null as { message: string } | null },
  onUploadComplete: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: { path: 'uploads/file.png' }, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: 'https://example.com/file.png' } }),
      }),
    },
    from: (table: string) => {
      if (table !== 'motor_media') throw new Error(`unexpected table ${table}`);
      return {
        insert: (payload: unknown) => {
          mocks.insert(payload);
          return Promise.resolve(mocks.insertResult);
        },
      };
    },
  },
}));

import { QuickMediaUpload } from './QuickMediaUpload';

describe('QuickMediaUpload writes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.insertResult = { error: null };
  });

  it('does not claim Upload complete when the motor_media insert is rejected', async () => {
    mocks.insertResult = { error: { message: 'permission denied' } };

    render(<QuickMediaUpload motorId="motor-1" onUploadComplete={mocks.onUploadComplete} />);

    const input = document.getElementById('file-upload') as HTMLInputElement;
    const file = new File(['png'], 'hero.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });

    fireEvent.click(await screen.findByRole('button', { name: /Upload & Assign 1 file/i }));

    await waitFor(() => {
      expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Upload failed',
        variant: 'destructive',
      }));
    });

    expect(mocks.insert).toHaveBeenCalled();
    expect(mocks.toast).not.toHaveBeenCalledWith(expect.objectContaining({
      title: 'Upload complete',
    }));
    expect(mocks.onUploadComplete).not.toHaveBeenCalled();
  });
});
