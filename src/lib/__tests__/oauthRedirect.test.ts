import { describe, expect, it } from 'vitest';
import { oauthRedirectUrl } from '../oauthRedirect';
import { SITE_URL } from '../site';

describe('OAuth callback defaults to the canonical site origin', () => {
  it.each([
    'https://www.mercuryrepower.ca',
    'https://mercuryrepower.ca',
    'https://mercury-builder-pro-git-fix-consultation-quote-display-hbw.vercel.app',
    'https://mercury-builder-76p5fgnik-hbw.vercel.app',
    'https://mercury-builder-evil-hbw.vercel.app',
    'https://mercury-builder-pro-git-fix-consultation-quote-display-hbw.vercel.app.attacker.example',
    'http://localhost:5173',
  ])('preserves the canonical default for %s', (origin) => {
    expect(oauthRedirectUrl(origin)).toBe(`${SITE_URL}/`);
  });

  it('preserves an explicit quote-success callback and empty-string fallback', () => {
    const callback = `${SITE_URL}/quote/success?ref=TEST&oauth=google`;
    expect(oauthRedirectUrl('https://www.mercuryrepower.ca', callback)).toBe(callback);
    expect(oauthRedirectUrl(
      'https://mercury-builder-pro-git-fix-consultation-quote-display-hbw.vercel.app',
      '',
    )).toBe(`${SITE_URL}/`);
  });
});
