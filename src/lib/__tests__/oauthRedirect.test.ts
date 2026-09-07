import { describe, expect, it } from 'vitest';
import { oauthRedirectUrl } from '../oauthRedirect';
import { SITE_URL } from '../site';
import { STAFF_QUOTE_PREVIEW_ORIGIN } from '../../../supabase/functions/_shared/browser-origin';

describe('OAuth callback for the verified staff quote preview', () => {
  it('keeps preview sign-in on its exact branch alias', () => {
    expect(oauthRedirectUrl(STAFF_QUOTE_PREVIEW_ORIGIN)).toBe(`${STAFF_QUOTE_PREVIEW_ORIGIN}/`);
  });

  it.each([
    'https://www.mercuryrepower.ca',
    'https://mercuryrepower.ca',
    'https://mercury-builder-76p5fgnik-hbw.vercel.app',
    'https://mercury-builder-evil-hbw.vercel.app',
    `${STAFF_QUOTE_PREVIEW_ORIGIN}.attacker.example`,
    `${STAFF_QUOTE_PREVIEW_ORIGIN}:444`,
    STAFF_QUOTE_PREVIEW_ORIGIN.replace('https:', 'http:'),
    'http://localhost:5173',
  ])('preserves the canonical default for %s', (origin) => {
    expect(oauthRedirectUrl(origin)).toBe(`${SITE_URL}/`);
  });

  it('preserves an explicit quote-success callback and empty-string fallback', () => {
    const callback = `${SITE_URL}/quote/success?ref=TEST&oauth=google`;
    expect(oauthRedirectUrl(STAFF_QUOTE_PREVIEW_ORIGIN, callback)).toBe(callback);
    expect(oauthRedirectUrl(STAFF_QUOTE_PREVIEW_ORIGIN, '')).toBe(`${STAFF_QUOTE_PREVIEW_ORIGIN}/`);
  });
});
