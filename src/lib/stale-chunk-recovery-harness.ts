/**
 * Offline stale-chunk recovery harness.
 * Synthetic import failures, sessionStorage, and a counted reload intercept.
 * This is a reload simulation in the current document, not a second-document load.
 * No network, provider, customer, credential, or database access.
 */
import type { ComponentType } from 'react';
import { lazyWithRetry } from './lazyWithRetry';

export const CHUNK_MESSAGE = 'Failed to fetch dynamically imported module';
export const BROAD_FETCH_MESSAGE = 'Failed to fetch';
export const ORDINARY_MESSAGE = 'TypeError: render exploded';
export const RELOAD_KEY = 'chunkReload:TradeInValuePage';
export const HARNESS_KEY = 'TradeInValuePage';

export type StorageMode =
  | 'memory'
  | 'getItem-throws'
  | 'setItem-throws'
  | 'storage-unavailable'
  | 'non-persisting';

export interface StorageProbe {
  mode: StorageMode;
  getItemCalls: number;
  setItemCalls: number;
  removeItemCalls: number;
  snapshot: () => Record<string, string>;
}

type LazyPayload = {
  _payload?: { _result?: () => Promise<{ default: unknown }> };
};

const componentSentinel: ComponentType = function TradeInProbe() {
  return null;
};

export function moduleSentinel() {
  return { default: componentSentinel };
}

export function readLoader(component: unknown): () => Promise<{ default: unknown }> {
  const loader = (component as LazyPayload)._payload?._result;
  if (typeof loader !== 'function') {
    throw new Error('React.lazy did not keep the factory on _payload._result');
  }
  return loader;
}

export function loaderFor(
  factory: () => Promise<{ default: ComponentType }>,
  key = HARNESS_KEY,
) {
  return readLoader(lazyWithRetry(factory, key));
}

export function installSessionStorage(mode: StorageMode): StorageProbe {
  const data = new Map<string, string>();
  const stats = { getItemCalls: 0, setItemCalls: 0, removeItemCalls: 0 };
  const getThrows = mode === 'getItem-throws' || mode === 'storage-unavailable';
  const setThrows = mode === 'setItem-throws' || mode === 'storage-unavailable';
  const removeThrows = mode === 'storage-unavailable';
  const persistWrites = mode !== 'non-persisting';

  const storage = {
    get length() {
      return data.size;
    },
    key(index: number) {
      return [...data.keys()][index] ?? null;
    },
    getItem(key: string) {
      stats.getItemCalls += 1;
      if (getThrows) {
        throw new Error('SecurityError: synthetic sessionStorage.getItem blocked');
      }
      return data.has(key) ? data.get(key)! : null;
    },
    setItem(key: string, value: string) {
      stats.setItemCalls += 1;
      if (setThrows) {
        throw new Error('SecurityError: synthetic sessionStorage.setItem blocked');
      }
      if (persistWrites) {
        data.set(key, String(value));
      }
    },
    removeItem(key: string) {
      stats.removeItemCalls += 1;
      if (removeThrows) {
        throw new Error('SecurityError: synthetic sessionStorage.removeItem blocked');
      }
      data.delete(key);
    },
    clear() {
      data.clear();
    },
  };

  const install = (target: object) => {
    try {
      Object.defineProperty(target, 'sessionStorage', {
        configurable: true,
        writable: true,
        value: storage,
      });
    } catch {
      (target as { sessionStorage?: unknown }).sessionStorage = storage;
    }
  };
  install(globalThis);
  if (window !== globalThis) install(window);
  if (window.sessionStorage !== storage) {
    throw new Error('Could not install synthetic sessionStorage');
  }

  return {
    mode,
    get getItemCalls() {
      return stats.getItemCalls;
    },
    get setItemCalls() {
      return stats.setItemCalls;
    },
    get removeItemCalls() {
      return stats.removeItemCalls;
    },
    snapshot() {
      return Object.fromEntries(data.entries());
    },
  };
}

export interface ReloadSimulation {
  calls: number;
  /** True when location.reload was replaced and will not navigate. */
  intercepted: true;
  restore: () => void;
}

/**
 * Counts reload attempts and does not navigate.
 * Refuses to return unless window.location.reload is the simulation.
 */
export function installReloadSimulation(): ReloadSimulation {
  let calls = 0;
  function simulatedChunkReload() {
    calls += 1;
  }

  const prototype = Object.getPrototypeOf(window.location) as { reload?: () => void } | null;
  const originalPrototypeReload = prototype?.reload;
  let replacedLocation = false;
  const originalLocation = window.location;

  if (prototype && 'reload' in prototype) {
    try {
      prototype.reload = simulatedChunkReload;
    } catch {
      // Fall through to replacing location when the prototype is locked.
    }
  }

  if (window.location.reload !== simulatedChunkReload) {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        href: originalLocation?.href ?? 'http://localhost/trade-in-value',
        reload: simulatedChunkReload,
      },
    });
    replacedLocation = true;
  }

  if (window.location.reload !== simulatedChunkReload) {
    throw new Error('Could not intercept location.reload; refusing to run the harness');
  }

  return {
    get calls() {
      return calls;
    },
    intercepted: true,
    restore() {
      if (replacedLocation) {
        Object.defineProperty(window, 'location', {
          configurable: true,
          value: originalLocation,
        });
        return;
      }
      if (prototype && originalPrototypeReload) {
        prototype.reload = originalPrototypeReload;
      }
    },
  };
}
