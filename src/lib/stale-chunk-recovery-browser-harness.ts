/**
 * In-browser driver for the offline stale-chunk harness.
 * A dev-only Vite transform retargets the helper's reload call to a counter.
 * window.location is not replaced. This is a synthetic two-instance simulation
 * in the current document, not a real second-document reload.
 */
import {
  CHUNK_MESSAGE,
  HARNESS_KEY,
  RELOAD_KEY,
  installSessionStorage,
  readLoader,
  type StorageMode,
} from './stale-chunk-recovery-harness';
import { lazyWithRetry as harnessLazyWithRetry } from 'virtual:stale-chunk-harness-helper';
import { HARNESS_RELOAD_SIMULATION } from './stale-chunk-recovery-harness-plugin';

type SimulationHost = typeof globalThis & {
  [HARNESS_RELOAD_SIMULATION]?: () => void;
};

type InstanceStatus = 'fulfilled' | 'rejected' | 'pending';

interface InstanceResult {
  status: InstanceStatus;
  message: string;
  sameError: boolean;
}

interface ProbeResult {
  mode: StorageMode;
  first: InstanceResult;
  second: InstanceResult;
  reloadSimulations: number;
  flagReadback: string;
  note: string;
}

const BACKOFF_BUDGET_MS = 2500;
const SIMULATION_NOTE =
  'Synthetic two-instance simulation. A dev-only transform retargets the helper reload call to a counter. window.location was not replaced, and this is not a second-document reload.';

function assertHarnessTransform() {
  const source = harnessLazyWithRetry.toString();
  if (
    source.includes('window.location.reload') ||
    !source.includes(`globalThis.${HARNESS_RELOAD_SIMULATION}()`)
  ) {
    throw new Error(
      'Dev-only harness transform did not retarget window.location.reload(). Refusing to run so this page cannot navigate.',
    );
  }
}

function installReloadCounter() {
  assertHarnessTransform();
  let calls = 0;
  const host = globalThis as SimulationHost;
  host[HARNESS_RELOAD_SIMULATION] = () => {
    calls += 1;
  };
  return {
    get calls() {
      return calls;
    },
    restore() {
      delete host[HARNESS_RELOAD_SIMULATION];
    },
  };
}

function loaderFor(factory: () => Promise<{ default: import('react').ComponentType }>) {
  return readLoader(harnessLazyWithRetry(factory, HARNESS_KEY));
}

function text(id: string, value: string) {
  const node = document.getElementById(id);
  if (node) node.textContent = value;
}

async function runInstance(reloadCalls: () => number): Promise<InstanceResult> {
  const error = new Error(CHUNK_MESSAGE);
  const callsBefore = reloadCalls();
  const loader = loaderFor(async () => {
    throw error;
  });
  let result: InstanceResult | null = null;
  const pending = loader().then(
    () => {
      result = { status: 'fulfilled', message: 'module resolved', sameError: false };
    },
    (reason: unknown) => {
      const message = reason instanceof Error ? reason.message : String(reason);
      result = { status: 'rejected', message, sameError: reason === error };
    },
  );
  const deadline = Date.now() + BACKOFF_BUDGET_MS;
  while (result === null && Date.now() < deadline) {
    if (reloadCalls() > callsBefore) {
      return {
        status: 'pending',
        message: 'loader still pending after the reload simulation',
        sameError: false,
      };
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  void pending;
  if (result === null) {
    return {
      status: 'pending',
      message: 'timed out without a reload simulation or a rejection',
      sameError: false,
    };
  }
  return result;
}

function flagReadback(): string {
  try {
    const value = sessionStorage.getItem(RELOAD_KEY);
    return value === null ? 'null' : JSON.stringify(value);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return `threw: ${message}`;
  }
}

export async function runRecoveryProbe(mode: StorageMode): Promise<ProbeResult> {
  installSessionStorage(mode);
  const reload = installReloadCounter();
  try {
    const first = await runInstance(() => reload.calls);
    const second = await runInstance(() => reload.calls);
    return {
      mode,
      first,
      second,
      reloadSimulations: reload.calls,
      flagReadback: flagReadback(),
      note: SIMULATION_NOTE,
    };
  } finally {
    reload.restore();
  }
}

function render(result: ProbeResult) {
  text('result-mode', result.mode);
  text('result-first', `${result.first.status}: ${result.first.message}`);
  text('result-second', `${result.second.status}: ${result.second.message}`);
  text('result-reloads', String(result.reloadSimulations));
  text('result-flag', result.flagReadback);
  text('result-same-error', `${result.first.sameError ? 'yes' : 'no'} / ${result.second.sameError ? 'yes' : 'no'}`);
  text('result-note', result.note);
}

async function onMode(mode: StorageMode, button: HTMLButtonElement) {
  const buttons = document.querySelectorAll<HTMLButtonElement>('button[data-mode]');
  buttons.forEach((entry) => {
    entry.disabled = true;
  });
  text('result-mode', mode);
  text('result-first', 'running synthetic import failures…');
  text('result-second', 'waiting');
  text('result-reloads', '…');
  text('result-flag', '…');
  text('result-same-error', '…');
  text('result-note', 'Synthetic two-instance simulation. This click does not navigate.');
  try {
    render(await runRecoveryProbe(mode));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    text('result-first', 'probe refused');
    text('result-second', 'not run');
    text('result-reloads', '0');
    text('result-flag', 'not read');
    text('result-same-error', 'no / no');
    text('result-note', message);
  } finally {
    buttons.forEach((entry) => {
      entry.disabled = false;
    });
    button.focus();
  }
}

function mount() {
  document.querySelectorAll<HTMLButtonElement>('button[data-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      const mode = button.dataset.mode as StorageMode;
      void onMode(mode, button);
    });
  });
}

mount();
