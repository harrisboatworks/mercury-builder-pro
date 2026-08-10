import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { resolvePaymentOrigin } from '../../../../supabase/functions/create-payment/origin-policy';

const requestFrom = (origin?: string) => new Request('https://example.test', {
  headers: origin ? { origin } : undefined,
});

describe('payment origin policy', () => {
  it.each([
    'https://www.mercuryrepower.ca',
    'https://mercuryrepower.ca',
    'https://quote.harrisboatworks.ca',
    'https://www.mercuryquote.ca',
    'https://mercuryquote.ca',
    'https://mercury-builder-pro.vercel.app',
    'https://mercury-builder-pro-hbw.vercel.app',
    'https://mercury-builder-pro-git-main-hbw.vercel.app',
  ])('allows the exact HBW-owned origin %s', (origin) => {
    expect(resolvePaymentOrigin(requestFrom(origin))).toBe(origin);
  });

  it.each([
    'https://attacker.vercel.app',
    'https://attacker.lovable.app',
    'https://attacker.lovable.dev',
    'https://mercury-builder-pro-git-lookalike-hbw.vercel.app',
    'https://www.mercuryrepower.ca.attacker.example',
  ])('rejects unconfigured shared-hosting or lookalike origin %s', (origin) => {
    expect(resolvePaymentOrigin(requestFrom(origin))).toBeNull();
  });

  it('allows only exact HTTPS preview origins supplied by configuration', () => {
    const configured = [
      'https://mercury-builder-pro-git-feature-hbw.vercel.app',
      'https://specific-preview.example',
    ].join(',');

    expect(resolvePaymentOrigin(
      requestFrom('https://mercury-builder-pro-git-feature-hbw.vercel.app'),
      configured,
    )).toBe('https://mercury-builder-pro-git-feature-hbw.vercel.app');
    expect(resolvePaymentOrigin(
      requestFrom('https://specific-preview.example'),
      configured,
    )).toBe('https://specific-preview.example');
    expect(resolvePaymentOrigin(
      requestFrom('https://another-preview.example'),
      configured,
    )).toBeNull();
  });

  it.each([
    'http://specific-preview.example',
    'https://specific-preview.example/path',
    'https://user@specific-preview.example',
    'not-an-origin',
  ])('ignores invalid configured preview entry %s', (configured) => {
    expect(resolvePaymentOrigin(
      requestFrom('https://specific-preview.example'),
      configured,
    )).toBeNull();
  });

  it.each([
    'http://localhost:4188',
    'http://127.0.0.1:5173',
  ])('keeps local development origin %s', (origin) => {
    expect(resolvePaymentOrigin(requestFrom(origin))).toBe(origin);
  });

  it('rejects missing, malformed, and path-bearing Origin headers', () => {
    expect(resolvePaymentOrigin(requestFrom())).toBeNull();
    expect(resolvePaymentOrigin(requestFrom('not-an-origin'))).toBeNull();
    expect(resolvePaymentOrigin(requestFrom('null'))).toBeNull();
    expect(resolvePaymentOrigin(
      requestFrom('https://www.mercuryrepower.ca/payment-success'),
    )).toBeNull();
    expect(resolvePaymentOrigin(
      requestFrom('https://www.mercuryrepower.ca?redirect=attacker'),
    )).toBeNull();
  });

  it('uses the validated origin for every Stripe return URL and denies unknown origins', () => {
    const source = readFileSync('supabase/functions/create-payment/index.ts', 'utf8');

    expect(source.match(/if \(!paymentOrigin\)/g)).toHaveLength(2);
    expect(source.match(/status: 403/g)).toHaveLength(2);
    expect(source.match(/success_url: `\$\{origin\}\/payment-success/g)).toHaveLength(2);
    expect(source.match(/cancel_url: `\$\{origin\}\/payment-canceled`/g)).toHaveLength(2);
  });
});
