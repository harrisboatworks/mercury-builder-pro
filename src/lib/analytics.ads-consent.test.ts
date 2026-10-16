import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GOOGLE_ADS_CONVERSION_LABELS, GOOGLE_ADS_ID } from '@/config/googleAds';
import {
  __resetGoogleAdsForTests,
  loadGoogleAdsAfterConsent,
  pushConsentUpdate,
  setConsent,
  trackLeadConversion,
} from './analytics';

const context = vi.hoisted(() => ({ origin: 'https://www.mercuryrepower.ca' }));

// Exercise the real origin predicate with each address without changing jsdom's
// non-configurable Location or sending any request to those sites.
vi.mock('@/config/googleAds', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/config/googleAds')>();
  return { ...actual, isGoogleAdsProductionOrigin: () => actual.isGoogleAdsProductionOrigin(context.origin) };
});

const labels = GOOGLE_ADS_CONVERSION_LABELS as Record<string, string>;

function adsCalls(gtag: ReturnType<typeof vi.fn>) {
  return gtag.mock.calls.filter(
    (c) => (c[0] === 'config' && c[1] === GOOGLE_ADS_ID) || (c[0] === 'event' && (c[1] === 'conversion' || c[1] === 'generate_lead')),
  );
}

describe('Google Ads consent gating', () => {
  let gtag: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    context.origin = 'https://www.mercuryrepower.ca';
    document.cookie = 'mr_consent=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    localStorage.clear();
    __resetGoogleAdsForTests();
    gtag = vi.fn();
    (window as any).gtag = gtag;
    labels.quote_review = '';
    labels.quote_saved_email = '';
  });

  it('fires nothing before a consent choice', () => {
    labels.quote_review = 'LBL';
    expect(loadGoogleAdsAfterConsent()).toBe(false);
    expect(trackLeadConversion('quote_review', 'HBW-1')).toBe(false);
    expect(adsCalls(gtag)).toHaveLength(0);
  });

  it('fires nothing after decline and keeps all signals denied', () => {
    labels.quote_review = 'LBL';
    setConsent('denied');
    trackLeadConversion('quote_review', 'HBW-1');
    expect(adsCalls(gtag)).toHaveLength(0);
    const update = gtag.mock.calls.find((c) => c[0] === 'consent');
    expect(update?.[2]).toEqual({
      ad_storage: 'denied', analytics_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
    });
  });

  it('accept grants all four signals and configures Ads once', () => {
    setConsent('granted');
    pushConsentUpdate('granted');
    expect(gtag.mock.calls.find((c) => c[0] === 'consent')?.[2]).toEqual({
      ad_storage: 'granted', analytics_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted',
    });
    loadGoogleAdsAfterConsent();
    expect(gtag.mock.calls.filter((c) => c[0] === 'config' && c[1] === GOOGLE_ADS_ID)).toHaveLength(1);
  });

  it('fires conversion and generate_lead once per reference after success', () => {
    labels.quote_review = 'LBL';
    setConsent('granted');
    expect(trackLeadConversion('quote_review', 'HBW-1')).toBe(true);
    expect(trackLeadConversion('quote_review', 'HBW-1')).toBe(false);
    const conv = gtag.mock.calls.filter((c) => c[1] === 'conversion');
    expect(conv).toHaveLength(1);
    expect(conv[0][2]).toEqual({ send_to: `${GOOGLE_ADS_ID}/LBL`, transaction_id: 'HBW-1' });
    expect(gtag.mock.calls.filter((c) => c[1] === 'generate_lead')).toEqual([
      ['event', 'generate_lead', { lead_type: 'quote_review' }],
    ]);
  });

  it('empty label skips the Ads conversion call but still sends generate_lead', () => {
    setConsent('granted');
    trackLeadConversion('quote_saved_email', 'abc');
    expect(gtag.mock.calls.filter((c) => c[1] === 'conversion')).toHaveLength(0);
    expect(gtag.mock.calls.filter((c) => c[1] === 'generate_lead')).toHaveLength(1);
  });

  it.each(['https://www.mercuryrepower.ca', 'https://mercuryrepower.ca'])(
    'allows consented Ads conversions on %s', (origin) => {
      context.origin = origin;
      labels.quote_review = 'LBL';
      setConsent('granted');
      expect(loadGoogleAdsAfterConsent()).toBe(true);
      trackLeadConversion('quote_review', 'HBW-1');
      expect(gtag).toHaveBeenCalledWith('event', 'conversion', {
        send_to: `${GOOGLE_ADS_ID}/LBL`, transaction_id: 'HBW-1',
      });
    },
  );

  it.each([
    'http://localhost:5178',
    'http://127.0.0.1:4179',
    'https://mercury-builder-pro-git-codex-labels-hbw.vercel.app',
    'https://www.mercuryrepower.ca.example.test',
    'http://www.mercuryrepower.ca',
    'https://mercuryrepower.ca:8443',
    'https://quote.harrisboatworks.ca',
  ])('keeps production Ads destinations disabled on %s even after consent', (origin) => {
    context.origin = origin;
    labels.quote_review = 'LBL';
    setConsent('granted');
    expect(loadGoogleAdsAfterConsent()).toBe(false);
    trackLeadConversion('quote_review', 'HBW-1');
    expect(gtag.mock.calls.filter((c) => c[0] === 'config' && c[1] === GOOGLE_ADS_ID)).toHaveLength(0);
    expect(gtag.mock.calls.filter((c) => c[1] === 'conversion')).toHaveLength(0);
    expect(gtag).toHaveBeenCalledWith('event', 'generate_lead', { lead_type: 'quote_review' });
  });
});
