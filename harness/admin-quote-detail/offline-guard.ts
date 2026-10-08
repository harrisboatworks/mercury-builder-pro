import { RESERVATION_DOWNLOAD_URL } from './fixtures';
import { recordHarnessEvent } from './harness-log';

function isSameOrigin(url: string) {
  try {
    return new URL(url, window.location.href).origin === window.location.origin;
  } catch {
    return false;
  }
}

function isLocalSocket(url: string) {
  try {
    const parsed = new URL(url, window.location.href);
    return parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost';
  } catch {
    return false;
  }
}

/**
 * Blocks every outbound browser transport except this Vite origin and the one
 * synthetic reservation URL the deposit download reads through fetch.
 * That URL is answered here with a local blob. Nothing is sent.
 */
export function installOfflineGuard() {
  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (url === RESERVATION_DOWNLOAD_URL) {
      recordHarnessEvent('local-fetch', { url });
      return new Response(new Blob(['%PDF-synthetic'], { type: 'application/pdf' }), { status: 200 });
    }
    if (url.startsWith('blob:') || url.startsWith('data:') || isSameOrigin(url)) {
      return nativeFetch(input, init);
    }
    recordHarnessEvent('blocked', { transport: 'fetch', url });
    throw new Error(`offline harness blocked fetch ${url}`);
  };

  const nativeOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function open(method: string, url: string | URL, ...rest: unknown[]) {
    const target = String(url);
    if (!isSameOrigin(target) && !target.startsWith('blob:') && !target.startsWith('data:')) {
      recordHarnessEvent('blocked', { transport: 'xhr', url: target });
      throw new Error(`offline harness blocked xhr ${target}`);
    }
    return nativeOpen.apply(this, [method, url, ...rest] as never);
  };

  const NativeWebSocket = window.WebSocket;
  window.WebSocket = class OfflineWebSocket extends NativeWebSocket {
    constructor(url: string | URL, protocols?: string | string[]) {
      const target = String(url);
      if (!isLocalSocket(target)) {
        recordHarnessEvent('blocked', { transport: 'websocket', url: target });
        throw new Error(`offline harness blocked websocket ${target}`);
      }
      super(url, protocols);
    }
  };

  if (typeof EventSource !== 'undefined') {
    const NativeEventSource = EventSource;
    window.EventSource = class OfflineEventSource extends NativeEventSource {
      constructor(url: string | URL, options?: EventSourceInit) {
        const target = String(url);
        if (!isSameOrigin(target)) {
          recordHarnessEvent('blocked', { transport: 'eventsource', url: target });
          throw new Error(`offline harness blocked eventsource ${target}`);
        }
        super(url, options);
      }
    };
  }

  navigator.sendBeacon = (url: string | URL) => {
    recordHarnessEvent('blocked', { transport: 'beacon', url: String(url) });
    return false;
  };

  const clipboard = {
    writeText: async (text: string) => {
      recordHarnessEvent('clipboard', { text });
    },
  };
  try {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clipboard });
  } catch {
    recordHarnessEvent('blocked', { transport: 'clipboard-install', url: 'navigator.clipboard' });
  }

  HTMLAnchorElement.prototype.click = function recordDownloadClick(this: HTMLAnchorElement) {
    recordHarnessEvent('download', { href: this.href, download: this.download });
  };
}
