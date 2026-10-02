/**
 * Durable sessionStorage guard for stale-chunk reload.
 * Synthetic factories, storage, and reload only. Fake timers. No network.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BROAD_FETCH_MESSAGE,
  CHUNK_MESSAGE,
  ORDINARY_MESSAGE,
  RELOAD_KEY,
  installReloadSimulation,
  installSessionStorage,
  loaderFor,
  moduleSentinel,
  type StorageMode,
} from './stale-chunk-recovery-harness';

type LoaderOutcome =
  | { status: 'fulfilled'; value: { default: unknown } }
  | { status: 'rejected'; reason: unknown }
  | { status: 'pending' };

function scriptedFactory(message: string, failuresBeforeSuccess: number) {
  let calls = 0;
  return vi.fn(async () => {
    calls += 1;
    if (calls <= failuresBeforeSuccess) {
      throw new Error(message);
    }
    return moduleSentinel();
  });
}

function failingFactory(error: Error) {
  return vi.fn(async () => {
    throw error;
  });
}

async function settleLoader(loader: () => Promise<{ default: unknown }>): Promise<LoaderOutcome> {
  let outcome: LoaderOutcome = { status: 'pending' };
  loader().then(
    (value) => {
      outcome = { status: 'fulfilled', value };
    },
    (reason) => {
      outcome = { status: 'rejected', reason };
    },
  );
  await vi.runAllTimersAsync();
  await Promise.resolve();
  await Promise.resolve();
  return outcome;
}

describe('lazyWithRetry stale-chunk recovery', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('clears a prior reload flag on success and does not reload', async () => {
    const storage = installSessionStorage('memory');
    const reload = installReloadSimulation();
    sessionStorage.setItem(RELOAD_KEY, '1');
    const factory = scriptedFactory(CHUNK_MESSAGE, 0);

    const outcome = await settleLoader(loaderFor(factory));

    expect(outcome.status).toBe('fulfilled');
    if (outcome.status === 'fulfilled') {
      expect(outcome.value.default).toEqual(expect.any(Function));
    }
    expect(factory).toHaveBeenCalledTimes(1);
    expect(reload.calls).toBe(0);
    expect(storage.snapshot()).toEqual({});
    expect(storage.removeItemCalls).toBe(1);
  });

  it('returns the module after one failed attempt and does not reload', async () => {
    installSessionStorage('memory');
    const reload = installReloadSimulation();
    const factory = scriptedFactory(CHUNK_MESSAGE, 1);

    const outcome = await settleLoader(loaderFor(factory));

    expect(outcome.status).toBe('fulfilled');
    expect(factory).toHaveBeenCalledTimes(2);
    expect(reload.calls).toBe(0);
    expect(sessionStorage.getItem(RELOAD_KEY)).toBeNull();
  });

  it('backs off 200ms, 400ms, then 600ms across the three attempts', async () => {
    installSessionStorage('memory');
    installReloadSimulation();
    const error = new Error(ORDINARY_MESSAGE);
    const factory = failingFactory(error);
    let status: LoaderOutcome['status'] = 'pending';
    const pending = loaderFor(factory)().then(
      () => {
        status = 'fulfilled';
      },
      () => {
        status = 'rejected';
      },
    );

    await vi.advanceTimersByTimeAsync(0);
    expect(factory).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(199);
    expect(factory).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(factory).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(399);
    expect(factory).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(factory).toHaveBeenCalledTimes(3);

    await vi.advanceTimersByTimeAsync(599);
    expect(status).toBe('pending');
    await vi.advanceTimersByTimeAsync(1);
    await pending;
    expect(status).toBe('rejected');
  });

  it('throws the original chunk error when a reload flag already exists', async () => {
    const storage = installSessionStorage('memory');
    const reload = installReloadSimulation();
    sessionStorage.setItem(RELOAD_KEY, '1');
    const writesAfterSeed = storage.setItemCalls;
    const error = new Error(CHUNK_MESSAGE);
    const factory = failingFactory(error);

    const outcome = await settleLoader(loaderFor(factory));

    expect(factory).toHaveBeenCalledTimes(3);
    expect(reload.calls).toBe(0);
    expect(storage.setItemCalls).toBe(writesAfterSeed);
    expect(storage.snapshot()).toEqual({ [RELOAD_KEY]: '1' });
    expect(outcome.status).toBe('rejected');
    if (outcome.status === 'rejected') {
      expect(outcome.reason).toBe(error);
    }
  });

  it('propagates an ordinary non-chunk error and does not write the flag or reload', async () => {
    const storage = installSessionStorage('memory');
    const reload = installReloadSimulation();
    const error = new Error(ORDINARY_MESSAGE);
    const factory = failingFactory(error);

    const outcome = await settleLoader(loaderFor(factory));

    expect(factory).toHaveBeenCalledTimes(3);
    expect(reload.calls).toBe(0);
    expect(storage.setItemCalls).toBe(0);
    expect(storage.snapshot()).toEqual({});
    expect(outcome.status).toBe('rejected');
    if (outcome.status === 'rejected') {
      expect(outcome.reason).toBe(error);
    }
  });

  it('reloads once when storage readback is 1, then the next fresh instance does not reload', async () => {
    const storage = installSessionStorage('memory');
    const reload = installReloadSimulation();
    const firstError = new Error(CHUNK_MESSAGE);
    const firstFactory = failingFactory(firstError);

    const first = await settleLoader(loaderFor(firstFactory));

    expect(firstFactory).toHaveBeenCalledTimes(3);
    expect(first.status).toBe('pending');
    expect(reload.calls).toBe(1);
    expect(storage.snapshot()).toEqual({ [RELOAD_KEY]: '1' });

    const secondError = new Error(CHUNK_MESSAGE);
    const secondFactory = failingFactory(secondError);
    const second = await settleLoader(loaderFor(secondFactory));

    expect(secondFactory).toHaveBeenCalledTimes(3);
    expect(second.status).toBe('rejected');
    if (second.status === 'rejected') {
      expect(second.reason).toBe(secondError);
    }
    expect(reload.calls).toBe(1);
    expect(storage.snapshot()).toEqual({ [RELOAD_KEY]: '1' });
  });

  it('still treats Failed to fetch as a chunk error and reloads once when storage works', async () => {
    const storage = installSessionStorage('memory');
    const reload = installReloadSimulation();
    const factory = failingFactory(new Error(BROAD_FETCH_MESSAGE));

    const outcome = await settleLoader(loaderFor(factory));

    expect(outcome.status).toBe('pending');
    expect(reload.calls).toBe(1);
    expect(storage.snapshot()).toEqual({ [RELOAD_KEY]: '1' });
  });

  it.each<[StorageMode]>([
    ['getItem-throws'],
    ['setItem-throws'],
    ['storage-unavailable'],
    ['non-persisting'],
  ])(
    'throws the original chunk error on two fresh instances when sessionStorage is %s',
    async (mode) => {
      const storage = installSessionStorage(mode);
      const reload = installReloadSimulation();
      const firstError = new Error(CHUNK_MESSAGE);
      const secondError = new Error(CHUNK_MESSAGE);

      const first = await settleLoader(loaderFor(failingFactory(firstError)));
      const second = await settleLoader(loaderFor(failingFactory(secondError)));

      expect(first.status).toBe('rejected');
      expect(second.status).toBe('rejected');
      if (first.status === 'rejected' && second.status === 'rejected') {
        expect(first.reason).toBe(firstError);
        expect(second.reason).toBe(secondError);
      }
      expect(reload.calls).toBe(0);
      expect(storage.setItemCalls).toBe(2);
      if (mode === 'getItem-throws' || mode === 'storage-unavailable') {
        expect(() => sessionStorage.getItem(RELOAD_KEY)).toThrow(/synthetic sessionStorage/);
      } else {
        expect(sessionStorage.getItem(RELOAD_KEY)).not.toBe('1');
      }
      if (mode !== 'getItem-throws') {
        expect(storage.snapshot()[RELOAD_KEY]).toBeUndefined();
      }
    },
  );
});
