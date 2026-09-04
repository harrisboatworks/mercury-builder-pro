// @vitest-environment node
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MercuryProXSSEO } from '@/components/seo/MercuryProXSSEO';
import { HelmetProvider } from '@/lib/helmet';
import { CANONICAL_LAST_UPDATED, CANONICAL_SKUS } from './canonical-pricing.generated';
import { buildMercuryProXSOffers, isValidDateOnly } from './mercuryProXSOffers.js';

const structuredDataGuard = readFileSync('scripts/check-structured-data.mjs', 'utf8');
const staticPrerender = readFileSync('scripts/static-prerender.mjs', 'utf8');
const proXsPrerenderStart = staticPrerender.indexOf('function mercuryProXSSchema()');
const proXsPrerenderEnd = staticPrerender.indexOf(
  '\n// ============================================================',
  proXsPrerenderStart,
);
const proXsPrerenderSchema = staticPrerender.slice(proXsPrerenderStart, proXsPrerenderEnd);

type HelmetContext = {
  helmet?: {
    script: {
      toString: () => string;
    };
  };
};

type ProXsProduct = {
  name: string;
  offers: {
    price: number;
    priceCurrency: string;
    availability: string;
    validFrom: string;
    priceValidUntil?: string;
  };
};

function runStructuredDataGuard(products: object[]) {
  const dist = mkdtempSync(join(tmpdir(), 'pro-xs-structured-data-'));
  const pageDir = join(dist, 'mercury-pro-xs');

  try {
    mkdirSync(pageDir, { recursive: true });
    writeFileSync(
      join(pageDir, 'index.html'),
      `<script type="application/ld+json">${JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': products,
      })}</script>`,
    );

    return spawnSync(process.execPath, ['scripts/check-structured-data.mjs'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: { ...process.env, SCHEMA_DIST: dist },
    });
  } finally {
    rmSync(dist, { recursive: true, force: true });
  }
}

describe('buildMercuryProXSOffers', () => {
  it('uses the canonical pricing snapshot date for all four Merchant listing offers', () => {
    const offers = buildMercuryProXSOffers({
      skus: CANONICAL_SKUS,
      lastUpdated: CANONICAL_LAST_UPDATED,
      siteUrl: 'https://www.mercuryrepower.ca',
    });

    expect(offers.map((offer) => offer.name)).toEqual([
      'Mercury 115 Pro XS',
      'Mercury 150 Pro XS',
      'Mercury 200 Pro XS',
      'Mercury 250 Pro XS',
    ]);
    expect(offers.every((offer) => offer.validFrom === CANONICAL_LAST_UPDATED)).toBe(true);
    expect(offers.every((offer) => Number.isFinite(offer.startingAt))).toBe(true);
  });

  it('keeps hydrated and prerendered offers aligned without inventing an expiry', () => {
    const expectedOffers = buildMercuryProXSOffers({
      skus: CANONICAL_SKUS,
      lastUpdated: CANONICAL_LAST_UPDATED,
      siteUrl: 'https://www.mercuryrepower.ca',
    });
    const helmetContext: HelmetContext = {};

    renderToStaticMarkup(createElement(
      HelmetProvider,
      { context: helmetContext },
      createElement(MercuryProXSSEO),
    ));

    const scriptMarkup = helmetContext.helmet?.script.toString() ?? '';
    const jsonLd = scriptMarkup.match(
      /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/,
    )?.[1];
    expect(jsonLd).toBeDefined();
    const structuredData = JSON.parse(jsonLd ?? '');
    const productGroup = structuredData['@graph'].find(
      (node: Record<string, unknown>) => node['@type'] === 'ProductGroup',
    ) as { hasVariant: ProXsProduct[] } | undefined;
    expect(productGroup).toBeDefined();
    const hydratedOffers = (productGroup?.hasVariant ?? []).map(
      (product) => ({
        name: product.name,
        price: product.offers.price,
        priceCurrency: product.offers.priceCurrency,
        availability: product.offers.availability,
        validFrom: product.offers.validFrom,
        hasExpiry: Object.prototype.hasOwnProperty.call(product.offers, 'priceValidUntil'),
      }),
    );

    expect(hydratedOffers).toEqual(expectedOffers.map((offer) => ({
      name: offer.name,
      price: offer.startingAt,
      priceCurrency: 'CAD',
      availability: offer.availability,
      validFrom: CANONICAL_LAST_UPDATED,
      hasExpiry: false,
    })));
    expect(hydratedOffers).toHaveLength(4);
    expect(proXsPrerenderSchema).toContain('PRO_XS_STATIC_OFFERS_PRERENDER.map');
    expect(proXsPrerenderSchema).toContain('"validFrom": v.validFrom');
    expect(proXsPrerenderSchema).not.toContain('priceValidUntil');
  });

  it('fails closed when the canonical pricing snapshot has no valid date', () => {
    expect(() => buildMercuryProXSOffers({
      skus: CANONICAL_SKUS,
      lastUpdated: '',
      siteUrl: 'https://www.mercuryrepower.ca',
    })).toThrow('Invalid canonical pricing last_updated date');
  });

  it.each([
    '2026-13-40',
    '2026-00-10',
    '2026-01-00',
    '2026-02-29',
    '2026-04-31',
  ])('fails closed for the impossible calendar date %s', (lastUpdated) => {
    expect(isValidDateOnly(lastUpdated)).toBe(false);
    expect(() => buildMercuryProXSOffers({
      skus: CANONICAL_SKUS,
      lastUpdated,
      siteUrl: 'https://www.mercuryrepower.ca',
    })).toThrow('Invalid canonical pricing last_updated date');
  });

  it.each(['2024-02-29', '2026-02-28', '2000-02-29'])(
    'accepts the real calendar date %s',
    (value) => {
      expect(isValidDateOnly(value)).toBe(true);
    },
  );

  it('shares the strict calendar validator with the rendered-output guard', () => {
    expect(structuredDataGuard).toContain(
      "import { isValidDateOnly } from '../src/data/mercuryProXSOffers.js';",
    );
    expect(structuredDataGuard).toContain('if (!isValidDateOnly(offer.validFrom))');
  });

  it('blocks an impossible calendar date in rendered Pro XS offers', () => {
    const products = [115, 150, 200, 250].map((hp, index) => ({
      '@type': 'Product',
      name: `Mercury ${hp} Pro XS`,
      offers: {
        '@type': 'Offer',
        priceCurrency: 'CAD',
        price: 10000 + hp,
        availability: 'https://schema.org/InStock',
        validFrom: index === 0 ? '2026-13-40' : '2026-08-29',
      },
    }));

    const result = runStructuredDataGuard(products);

    expect(result.status).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toContain(
      'valid canonical calendar "validFrom" date',
    );
  });

  it('blocks an unsupported expiry in rendered Pro XS offers', () => {
    const products = [115, 150, 200, 250].map((hp, index) => ({
      '@type': 'Product',
      name: `Mercury ${hp} Pro XS`,
      offers: {
        '@type': 'Offer',
        priceCurrency: 'CAD',
        price: 10000 + hp,
        availability: 'https://schema.org/InStock',
        validFrom: '2026-08-19',
        ...(index === 0 ? { priceValidUntil: '2026-12-31' } : {}),
      },
    }));

    const result = runStructuredDataGuard(products);

    expect(result.status).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toContain(
      'unsupported "priceValidUntil" date',
    );
  });
});
