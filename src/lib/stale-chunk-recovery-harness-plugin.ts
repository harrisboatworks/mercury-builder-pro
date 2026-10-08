import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

/** Dev-server only. The production helper keeps window.location.reload(). */
export const HARNESS_RELOAD_SIMULATION = '__hbwStaleChunkReloadSimulation' as const;

const RELOAD_CALL = 'window.location.reload()';
const VIRTUAL_ID = 'virtual:stale-chunk-harness-helper';
const RESOLVED_VIRTUAL_ID = '\0virtual:stale-chunk-harness-helper.ts';

/**
 * Retargets the single reload call in the helper source.
 * The dev server serves this as virtual:stale-chunk-harness-helper.
 * Any other count refuses the transform so the harness cannot fall through to a real reload.
 */
export function retargetHarnessReload(source: string): string {
  const count = source.split(RELOAD_CALL).length - 1;
  if (count !== 1) {
    throw new Error(`stale-chunk harness transform expected one ${RELOAD_CALL} call, found ${count}`);
  }
  return source.replace(RELOAD_CALL, `globalThis.${HARNESS_RELOAD_SIMULATION}()`);
}

export function staleChunkHarnessReloadPlugin(): Plugin {
  const helperPath = join(dirname(fileURLToPath(import.meta.url)), 'lazyWithRetry.ts');
  return {
    name: 'stale-chunk-harness-reload-simulation',
    apply: 'serve',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_VIRTUAL_ID;
      return null;
    },
    load(id) {
      if (id !== RESOLVED_VIRTUAL_ID) return null;
      return retargetHarnessReload(readFileSync(helperPath, 'utf8'));
    },
  };
}
