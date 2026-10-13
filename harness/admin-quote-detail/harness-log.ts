export type HarnessEvent = {
  kind: 'table' | 'rpc' | 'invoke' | 'clipboard' | 'download' | 'local-fetch' | 'blocked';
  detail: Record<string, unknown>;
};

const events: HarnessEvent[] = [];
const listeners = new Set<() => void>();

export function recordHarnessEvent(kind: HarnessEvent['kind'], detail: Record<string, unknown>) {
  events.push({ kind, detail });
  listeners.forEach((listener) => listener());
}

export function getHarnessEvents(): HarnessEvent[] {
  return events.slice();
}

export function resetHarnessEvents(kinds?: HarnessEvent['kind'][]) {
  if (!kinds) {
    events.length = 0;
  } else {
    for (let index = events.length - 1; index >= 0; index -= 1) {
      if (kinds.includes(events[index].kind)) events.splice(index, 1);
    }
  }
  listeners.forEach((listener) => listener());
}

export function subscribeHarnessEvents(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
