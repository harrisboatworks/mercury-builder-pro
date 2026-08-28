import { beforeEach, describe, expect, it, vi } from 'vitest';
import { checkForNewBuild } from './siteFreshness';

describe('checkForNewBuild', () => {
  beforeEach(() => {
    vi.stubGlobal('__APP_BUILD_ID__', 'build-current');
    sessionStorage.clear();
  });

  it('keeps the page when the deployed build matches', async () => {
    const reload = vi.fn();
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ buildId: 'build-current' }),
    });

    await expect(checkForNewBuild(fetchImpl as unknown as typeof fetch, reload)).resolves.toBe(false);
    expect(reload).not.toHaveBeenCalled();
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringMatching(/^\/version\.json\?t=\d+$/),
      expect.objectContaining({ cache: 'no-store' }),
    );
  });

  it('reloads once when a newer deployment is detected', async () => {
    const reload = vi.fn();
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ buildId: 'build-new' }),
    });

    await expect(checkForNewBuild(fetchImpl as unknown as typeof fetch, reload)).resolves.toBe(true);
    await expect(checkForNewBuild(fetchImpl as unknown as typeof fetch, reload)).resolves.toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
