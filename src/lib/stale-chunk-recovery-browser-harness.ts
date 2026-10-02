/**
 * In-browser driver for the offline stale-chunk harness.
 * Reload is simulated: location.reload is counted and does not navigate.
 * The second lazyWithRetry() call is another instance in this same document.
 * That is not proof of a second document load.
 */
import {
  CHUNK_MESSAGE,
  RELOAD_KEY,
  installReloadSimulation,
  installSessionStorage,
  loaderFor,
  type StorageMode,
} from './stale-chunk-recovery-harness';

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
  const reload = installReloadSimulation();
  try {
    const first = await runInstance(() => reload.calls);
    const second = await runInstance(() => reload.calls);
    return {
      mode,
      first,
      second,
      reloadSimulations: reload.calls,
      flagReadback: flagReadback(),
      note: 'Reload simulation only. The second instance is a new lazyWithRetry() call in this document, not a second document.',
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
  text('result-note', 'Reload is intercepted. This click does not navigate.');
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
