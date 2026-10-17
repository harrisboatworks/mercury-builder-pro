import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  __resetGoogleAdsForTests, GOOGLE_ANALYTICS_ID, loadGoogleAnalyticsAfterConsent,
  pushConsentDefault, pushConsentUpdate, setConsent, trackEvent,
} from './analytics';

describe('GA4 accepted-consent gate', () => {
  let gtag: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    document.cookie = 'mr_consent=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    localStorage.clear();
    document.querySelectorAll('script[data-google-analytics]').forEach((s) => s.remove());
    window.dataLayer = [];
    __resetGoogleAdsForTests();
    gtag = vi.fn();
    window.gtag = gtag;
  });
  it('does not load or queue analytics events before a choice', () => {
    pushConsentDefault();
    trackEvent('page_view');
    expect(loadGoogleAnalyticsAfterConsent()).toBe(false);
    expect(document.querySelector('script[data-google-analytics]')).toBeNull();
    expect(gtag.mock.calls.filter((c) => c[0] !== 'consent')).toEqual([]);
    expect(window.dataLayer).toEqual([]);
  });
  it('keeps Decline denied without loading or firing analytics', () => {
    setConsent('denied');
    trackEvent('page_view');
    expect(document.querySelector('script[data-google-analytics]')).toBeNull();
    expect(gtag.mock.calls.filter((c) => c[0] !== 'consent')).toEqual([]);
    expect(gtag.mock.calls[0][2].analytics_storage).toBe('denied');
    expect(window.dataLayer).toEqual([]);
  });
  it('loads once after Accept and discards earlier events', () => {
    trackEvent('before_choice');
    setConsent('granted');
    loadGoogleAnalyticsAfterConsent();
    trackEvent('after_choice');
    expect(document.querySelectorAll('script[data-google-analytics]')).toHaveLength(1);
    expect(gtag.mock.calls.filter((c) => c[0] === 'config' && c[1] === GOOGLE_ANALYTICS_ID)).toHaveLength(1);
    expect(gtag.mock.calls.some((c) => c[1] === 'before_choice')).toBe(false);
    expect(gtag.mock.calls.some((c) => c[1] === 'after_choice')).toBe(true);
  });
  it.each(['granted', 'denied'] as const)('honours stored %s consent', (choice) => {
    localStorage.setItem('mr_consent', choice);
    pushConsentUpdate(choice);
    expect(Boolean(document.querySelector('script[data-google-analytics]'))).toBe(choice === 'granted');
  });
  it('stops events after an accepted visitor declines', () => {
    setConsent('granted');
    gtag.mockClear();
    window.dataLayer = [];
    setConsent('denied');
    trackEvent('after_decline');
    expect(gtag.mock.calls.filter((c) => c[0] === 'event')).toEqual([]);
    expect(window.dataLayer).toEqual([]);
  });
  it('the HTML queue rejects legacy direct events before consent and after Decline', () => {
    const html = readFileSync('index.html', 'utf8');
    const bootstrap = html.match(/<script>\s*var analyticsAccepted[\s\S]*?<\/script>/)?.[0];
    if (!bootstrap) throw new Error('Missing consent bootstrap');
    const queue: unknown[] = [];
    const execute = new Function('window', 'dataLayer', `${bootstrap.replace(/<\/?script>/g, '')}; return gtag;`);
    const direct = execute({}, queue);
    direct('event', 'before_choice');
    direct('config', GOOGLE_ANALYTICS_ID);
    direct('consent', 'update', { analytics_storage: 'granted' });
    direct('event', 'accepted');
    direct('consent', 'update', { analytics_storage: 'denied' });
    direct('event', 'declined');
    const events = queue.map((args) => Array.from(args as ArrayLike<unknown>)).filter((args) => args[0] === 'event');
    expect(events).toEqual([['event', 'accepted']]);
  });
});