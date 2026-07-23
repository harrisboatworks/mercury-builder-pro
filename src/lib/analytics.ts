/**
 * Phase-1 analytics helper. Sends events through direct gtag.js and mirrors them
 * into window.dataLayer for debugging. Currently a no-op on SSR/prerender.
 *
 * NEVER push PII: no email, no full phone, no full name, no full postal code.
 */

declare global {
  interface Window {
    dataLayer: Array<Record<string, any>>;
    gtag?: (command: 'event', eventName: string, params?: Record<string, any>) => void;
    clarity?: ClarityFunction;
  }
}

type ClarityFunction = ((command: string, ...args: unknown[]) => void) & {
  q?: unknown[][];
};

export type ClarityFunnel = 'quote' | 'financing';

export type QuoteFunnelStep =
  | 'motor-selection'
  | 'options'
  | 'purchase-path'
  | 'boat-info'
  | 'trade-in'
  | 'fuel-tank'
  | 'installation'
  | 'promo-selection'
  | 'package-selection'
  | 'summary'
  | 'schedule'
  | 'success';

export type FinancingFunnelStep =
  | 'purchase-details'
  | 'applicant'
  | 'employment'
  | 'financial'
  | 'co-applicant'
  | 'references'
  | 'review-submit';

export type ClarityFunnelStep = QuoteFunnelStep | FinancingFunnelStep;

export type ClarityMotorFamily =
  | 'FourStroke'
  | 'Pro XS'
  | 'SeaPro'
  | 'Verado'
  | 'ProKicker';

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
export const CLARITY_PROJECT_ID = 'xlz4gut71c';

const CLARITY_SCRIPT_SELECTOR = `script[data-clarity-project-id="${CLARITY_PROJECT_ID}"]`;

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

/** Send an analytics event. Safe no-op on server. */
export function trackEvent(name: string, params?: Record<string, any>): void {
  if (typeof window === 'undefined') return;
  const eventParams = params || {};
  if (typeof window.gtag === 'function') {
    window.gtag('event', name, eventParams);
  }
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...eventParams });
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

/* ---------------- Microsoft Clarity consent gate ---------------- */

const CLARITY_DENIED_STATE = {
  ad_Storage: 'denied',
  analytics_Storage: 'denied',
} as const;

const CLARITY_ANALYTICS_STATE = {
  ad_Storage: 'denied',
  analytics_Storage: 'granted',
} as const;

let pendingClarityFunnelStep: {
  funnel: ClarityFunnel;
  step: ClarityFunnelStep;
} | null = null;

function ensureClarityQueue(): ClarityFunction {
  if (typeof window.clarity === 'function') return window.clarity;

  const clarity = ((...args: unknown[]) => {
    clarity.q = clarity.q || [];
    clarity.q.push(args);
  }) as ClarityFunction;
  window.clarity = clarity;
  return clarity;
}

/**
 * Load Clarity only after the visitor has granted analytics consent.
 * The queued Consent API v2 command is processed before recording begins.
 */
export function loadClarityAfterConsent(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  if (getStoredConsent() !== 'granted') return false;

  const clarity = ensureClarityQueue();
  clarity('consentv2', CLARITY_ANALYTICS_STATE);

  if (document.querySelector(CLARITY_SCRIPT_SELECTOR)) return true;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.clarity.ms/tag/${CLARITY_PROJECT_ID}`;
  script.dataset.clarityProjectId = CLARITY_PROJECT_ID;
  document.head.appendChild(script);
  return true;
}

/** Keep Clarity aligned with the existing mr_consent decision. */
export function syncClarityConsent(value: ConsentValue): void {
  if (typeof window === 'undefined') return;
  if (value === 'granted') {
    loadClarityAfterConsent();
    replayPendingClarityFunnelStep();
    return;
  }

  pendingClarityFunnelStep = null;
  if (typeof window.clarity === 'function') {
    window.clarity('consentv2', CLARITY_DENIED_STATE);
  }
}

/* ---------------- Privacy-safe Microsoft Clarity funnel signals ---------------- */

const QUOTE_FUNNEL_STEPS: Record<string, QuoteFunnelStep> = {
  '/quote': 'motor-selection',
  '/quote/motor-selection': 'motor-selection',
  '/quote/options': 'options',
  '/quote/purchase-path': 'purchase-path',
  '/quote/boat-info': 'boat-info',
  '/quote/trade-in': 'trade-in',
  '/quote/fuel-tank': 'fuel-tank',
  '/quote/installation': 'installation',
  '/quote/promo-selection': 'promo-selection',
  '/quote/package-selection': 'package-selection',
  '/quote/summary': 'summary',
  '/quote/schedule': 'schedule',
  '/quote/success': 'success',
};

const FINANCING_FUNNEL_STEPS: Record<number, FinancingFunnelStep> = {
  1: 'purchase-details',
  2: 'applicant',
  3: 'employment',
  4: 'financial',
  5: 'co-applicant',
  6: 'references',
  7: 'review-submit',
};

function getConsentedClarity(): ClarityFunction | null {
  if (typeof window === 'undefined' || getStoredConsent() !== 'granted') return null;
  if (typeof window.clarity !== 'function') loadClarityAfterConsent();
  return typeof window.clarity === 'function' ? window.clarity : null;
}

function sendClarityFunnelStep(
  clarity: ClarityFunction,
  funnel: ClarityFunnel,
  step: ClarityFunnelStep,
): void {
  clarity('set', 'funnel', funnel);
  clarity('set', 'funnel_step', `${funnel}:${step}`);
  clarity('event', `${funnel}_step_view`);
}

function replayPendingClarityFunnelStep(): boolean {
  if (!pendingClarityFunnelStep) return false;
  const clarity = getConsentedClarity();
  if (!clarity) return false;

  const { funnel, step } = pendingClarityFunnelStep;
  pendingClarityFunnelStep = null;
  sendClarityFunnelStep(clarity, funnel, step);
  return true;
}

function sanitizeCatalogLabel(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9+./()\-\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80) || 'unknown';
}

export function getQuoteFunnelStep(pathname: string): QuoteFunnelStep | null {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return QUOTE_FUNNEL_STEPS[normalized] || null;
}

export function getFinancingFunnelStep(step: number): FinancingFunnelStep | null {
  return FINANCING_FUNNEL_STEPS[step] || null;
}

/**
 * Add only stable, non-PII funnel labels to the current Clarity recording.
 * The helper intentionally has no free-form metadata parameter.
 */
export function trackClarityFunnelStep(
  funnel: ClarityFunnel,
  step: ClarityFunnelStep,
): boolean {
  const clarity = getConsentedClarity();
  if (!clarity) {
    if (typeof window !== 'undefined' && getStoredConsent() === null) {
      pendingClarityFunnelStep = { funnel, step };
    }
    return false;
  }

  pendingClarityFunnelStep = null;
  sendClarityFunnelStep(clarity, funnel, step);
  return true;
}

/** Catalog-only motor dimensions. Never pass quote IDs, stock numbers, or customer data. */
export function trackClarityMotorSelection(input: {
  model: string;
  hp: number;
  family: ClarityMotorFamily;
}): boolean {
  const clarity = getConsentedClarity();
  if (!clarity) return false;
  const hp = Number.isFinite(input.hp) && input.hp > 0 && input.hp <= 600
    ? String(input.hp)
    : 'unknown';
  clarity('set', 'funnel', 'quote');
  clarity('set', 'motor_model', sanitizeCatalogLabel(input.model));
  clarity('set', 'motor_hp', hp);
  clarity('set', 'motor_family', input.family);
  clarity('event', 'quote_motor_selected');
  return true;
}

export function trackClarityValidationBlocked(
  funnel: ClarityFunnel,
  category: 'references_incomplete',
): boolean {
  const clarity = getConsentedClarity();
  if (!clarity) return false;
  clarity('set', 'funnel', funnel);
  clarity('set', 'validation_error', category);
  clarity('event', `${funnel}_validation_blocked`);
  return true;
}

export function trackClaritySubmission(funnel: ClarityFunnel): boolean {
  const clarity = getConsentedClarity();
  if (!clarity) return false;
  clarity('set', 'funnel', funnel);
  clarity('set', 'funnel_status', 'submitted');
  clarity('event', `${funnel}_submitted`);
  return true;
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
