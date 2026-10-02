declare module 'virtual:stale-chunk-harness-helper' {
  export function lazyWithRetry(
    factory: () => Promise<{ default: unknown }>,
    key: string,
    retries?: number,
  ): unknown;
}
