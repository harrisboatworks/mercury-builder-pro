const VERSION_ENDPOINT = '/version.json';
const RELOAD_GUARD_KEY = 'hbw:last-build-refresh';
const LEGACY_CACHE_RESET_KEY = 'hbw:legacy-pwa-reset';
const LEGACY_CACHE_RESET_VERSION = '2026-07-10-v1';
const CHECK_INTERVAL_MS = 5 * 60 * 1000;

type BuildVersion = {
  buildId?: string;
};

export async function retireLegacyPwa(): Promise<void> {
  if (typeof window === 'undefined') return;

  const hasController = Boolean(navigator.serviceWorker?.controller);
  let resetComplete = false;

  try {
    resetComplete = localStorage.getItem(LEGACY_CACHE_RESET_KEY) === LEGACY_CACHE_RESET_VERSION;
  } catch {
    // Storage can be unavailable in private/restricted browser modes.
  }

  if (resetComplete && !hasController) return;

  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }

    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
    }

    localStorage.setItem(LEGACY_CACHE_RESET_KEY, LEGACY_CACHE_RESET_VERSION);
  } catch {
    // Cache cleanup is best-effort; the network-first site still renders normally.
  }
}

export async function checkForNewBuild(
  fetchImpl: typeof fetch = fetch,
  reload: () => void = () => window.location.reload(),
): Promise<boolean> {
  if (typeof window === 'undefined' || document.visibilityState === 'hidden') return false;

  try {
    const response = await fetchImpl(`${VERSION_ENDPOINT}?t=${Date.now()}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return false;

    const remoteVersion = (await response.json()) as BuildVersion;
    if (!remoteVersion.buildId) return false;

    if (remoteVersion.buildId === __APP_BUILD_ID__) {
      sessionStorage.removeItem(RELOAD_GUARD_KEY);
      return false;
    }

    // Reload once per observed deployment. This avoids loops during the few
    // seconds when CDN nodes may be converging on a new release.
    if (sessionStorage.getItem(RELOAD_GUARD_KEY) === remoteVersion.buildId) return false;
    sessionStorage.setItem(RELOAD_GUARD_KEY, remoteVersion.buildId);
    reload();
    return true;
  } catch {
    // Offline visitors keep the currently rendered page and retry on resume.
    return false;
  }
}

export function startSiteFreshnessMonitor(): () => void {
  if (typeof window === 'undefined') return () => {};

  void retireLegacyPwa();
  void checkForNewBuild();

  const checkWhenVisible = () => {
    if (document.visibilityState !== 'hidden') void checkForNewBuild();
  };

  window.addEventListener('focus', checkWhenVisible);
  window.addEventListener('pageshow', checkWhenVisible);
  document.addEventListener('visibilitychange', checkWhenVisible);
  const intervalId = window.setInterval(checkWhenVisible, CHECK_INTERVAL_MS);

  return () => {
    window.removeEventListener('focus', checkWhenVisible);
    window.removeEventListener('pageshow', checkWhenVisible);
    document.removeEventListener('visibilitychange', checkWhenVisible);
    window.clearInterval(intervalId);
  };
}
