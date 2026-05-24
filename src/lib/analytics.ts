/**
 * Phase-1 analytics helper. Pushes events into window.dataLayer for GTM
 * to read later. Currently a no-op if dataLayer isn't initialized (SSR/prerender).
 *
 * NEVER push PII: no email, no full phone, no full name, no full postal code.
 */

declare global {
  interface Window {
    dataLayer: Array<Record<string, any>>;
  }
}

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export type PageCategory =
  | 'money'
  | 'location'
  | 'case_study'
  | 'blog'
  | 'faq'
  | 'quote'
  | 'home'
  | 'other';

const CONSENT_COOKIE = 'mr_consent';
const CONSENT_DAYS = 180;
const QUOTE_ID_KEY = 'mr_quote_id';

/** Generate a RFC4122 v4 UUID without external deps. */
export function uuidv4(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    try { return (crypto as any).randomUUID(); } catch { /* fall through */ }
  }
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const h = Array.from(bytes, b => b.toString(16).padStart(2, '0'));
  return `${h.slice(0, 4).join('')}-${h.slice(4, 6).join('')}-${h.slice(6, 8).join('')}-${h.slice(8, 10).join('')}-${h.slice(10, 16).join('')}`;
}

/** Push an event to the dataLayer. Safe no-op on server. */
export function trackEvent(name: string, params?: Record<string, any>): void {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...(params || {}) });
}

export function getDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  if (w < 640) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

/* ---------------- quote_id session helpers ---------------- */

export function getQuoteId(): string | null {
  if (typeof window === 'undefined') return null;
  try { return sessionStorage.getItem(QUOTE_ID_KEY); } catch { return null; }
}

export function ensureQuoteId(): string {
  if (typeof window === 'undefined') return `q_${uuidv4()}`;
  let id = getQuoteId();
  if (!id) {
    id = `q_${uuidv4()}`;
    try { sessionStorage.setItem(QUOTE_ID_KEY, id); } catch { /* noop */ }
  }
  return id;
}

export function clearQuoteId(): void {
  if (typeof window === 'undefined') return;
  try { sessionStorage.removeItem(QUOTE_ID_KEY); } catch { /* noop */ }
}

/* ---------------- Consent Mode v2 helpers ---------------- */

export type ConsentValue = 'granted' | 'denied';

const DENIED_STATE = {
  ad_storage: 'denied',
  analytics_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
} as const;

const GRANTED_STATE = {
  ad_storage: 'granted',
  analytics_storage: 'granted',
  ad_user_data: 'granted',
  ad_personalization: 'granted',
} as const;

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, days: number): void {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 86400 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function getStoredConsent(): ConsentValue | null {
  const v = readCookie(CONSENT_COOKIE);
  return v === 'granted' || v === 'denied' ? v : null;
}

export function pushConsentDefault(): void {
  trackEvent('consent_default', { ...DENIED_STATE });
}

export function pushConsentUpdate(value: ConsentValue): void {
  trackEvent('consent_update', value === 'granted' ? { ...GRANTED_STATE } : { ...DENIED_STATE });
}

export function setConsent(value: ConsentValue): void {
  writeCookie(CONSENT_COOKIE, value, CONSENT_DAYS);
  pushConsentUpdate(value);
}

/* ---------------- Page category mapping ---------------- */

export function getPageCategory(pathname: string): PageCategory {
  if (pathname === '/' || pathname === '/index') return 'home';
  if (pathname.startsWith('/quote')) return 'quote';
  if (pathname.startsWith('/locations')) return 'location';
  if (pathname.startsWith('/case-studies')) return 'case_study';
  if (pathname.startsWith('/blog')) return 'blog';
  if (pathname === '/faq' || pathname.endsWith('-faq') || pathname.includes('/faq')) return 'faq';
  if (pathname.startsWith('/repower') || pathname.startsWith('/mercury')) return 'money';
  return 'other';
}

/** Stable page id. Uses Bucket-2 mappings where known, else a slug-derived value. */
const PAGE_ID_MAP: Record<string, string> = {
  '/': 'HOME',
  '/index': 'HOME',
  '/repower': 'M1',
  '/mercury-outboards-ontario': 'M2',
  '/mercury-pro-xs': 'M3',
  '/mercury/pro-xs-250': 'M4',
  '/mercury-pontoon-outboards': 'M5',
  '/faq': 'F1',
  '/mercury-repower-faq': 'F1',
};

export function getPageId(pathname: string): string {
  if (PAGE_ID_MAP[pathname]) return PAGE_ID_MAP[pathname];
  if (pathname.startsWith('/quote')) return 'QUOTE';
  // Slug-derived stable fallback. Example: /locations/peterborough-mercury-dealer -> LOCATION_PETERBOROUGH_MERCURY_DEALER
  const seg = pathname.replace(/^\//, '').replace(/\/$/, '');
  if (!seg) return 'HOME';
  const slug = seg.replace(/\//g, '_').replace(/[^a-zA-Z0-9_-]/g, '').toUpperCase();
  return slug || 'OTHER';
}
