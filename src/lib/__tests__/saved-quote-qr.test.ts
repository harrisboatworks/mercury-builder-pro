import { beforeEach, describe, expect, it, vi } from 'vitest';

const { toDataURL } = vi.hoisted(() => ({ toDataURL: vi.fn() }));

vi.mock('qrcode', () => ({
  default: { toDataURL },
}));

import { generateSavedQuoteQrCode } from '@/lib/saved-quote-qr';

describe('saved quote QR generation', () => {
  beforeEach(() => {
    toDataURL.mockReset();
  });

  it('does not create a misleading QR when no saved quote URL exists', async () => {
    await expect(generateSavedQuoteQrCode(null)).resolves.toBeUndefined();
    expect(toDataURL).not.toHaveBeenCalled();
  });

  it('uses a full four-module quiet zone for a resumable quote URL', async () => {
    toDataURL.mockResolvedValue('data:image/png;base64,saved-quote');
    const url = 'https://www.mercuryrepower.ca/quote/saved/123';

    await expect(generateSavedQuoteQrCode(url)).resolves.toBe('data:image/png;base64,saved-quote');
    expect(toDataURL).toHaveBeenCalledWith(url, expect.objectContaining({
      width: 240,
      margin: 4,
    }));
  });
});
