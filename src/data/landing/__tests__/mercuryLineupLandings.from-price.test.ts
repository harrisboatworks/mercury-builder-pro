// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  ALL_LINEUP_LANDINGS,
  type LandingConfig,
  type LandingVariant,
} from '../mercuryLineupLandings';
import { CANONICAL_SKUS } from '../../canonical-pricing.generated';

// Resolve the canonical dealer price for a variant. Prefer the canonical SKU
// lookup so the test fails if the variant's hbwPrice has drifted from
// CANONICAL_SKUS — that's the whole point of a single source of truth.
function canonicalDealerFor(v: LandingVariant): number {
  if (v.sku) {
    const sku = CANONICAL_SKUS.find((s) => s.partNo === v.sku);
    if (!sku) {
      throw new Error(`Variant "${v.name}" references unknown canonical SKU ${v.sku}`);
    }
    return sku.dealer;
  }
  return v.hbwPrice;
}

function lowestCanonicalDealer(config: LandingConfig): number {
  const prices = config.variants.map(canonicalDealerFor);
  return Math.min(...prices);
}

// Match "from $X", "From $X,XXX", etc. Captures the numeric portion.
// Excludes range expressions like "from $17,941 to $18,299" — those describe
// a sub-range of variants, not the page's headline starting price.
const FROM_PRICE_RE = /from\s+\$([0-9][0-9,]*)(?!\s+to\s+\$)/gi;

function extractFromPrices(text: string): number[] {
  const out: number[] = [];
  for (const m of text.matchAll(FROM_PRICE_RE)) {
    out.push(Number(m[1].replace(/,/g, '')));
  }
  return out;
}

function targetsFor(config: LandingConfig): { label: string; text: string }[] {
  const targets: { label: string; text: string }[] = [
    { label: 'metaTitle', text: config.metaTitle },
    { label: 'metaDescription', text: config.metaDescription },
    { label: 'heroLead', text: config.heroLead },
    { label: 'tableNote', text: config.tableNote },
  ];
  config.faq.forEach((f, i) => {
    targets.push({ label: `faq[${i}].question`, text: f.question });
    targets.push({ label: `faq[${i}].answer`, text: f.answer });
  });
  return targets;
}

describe('mercury lineup landing pages — "from $X" copy matches canonical pricing', () => {
  for (const config of ALL_LINEUP_LANDINGS) {
    describe(config.slug, () => {
      const expected = lowestCanonicalDealer(config);

      // Sanity: every variant.hbwPrice equals its canonical dealer price.
      it('variant hbwPrice values match CANONICAL_SKUS (no drift)', () => {
        for (const v of config.variants) {
          if (!v.sku) continue;
          const canonical = canonicalDealerFor(v);
          expect(
            v.hbwPrice,
            `variant "${v.name}" hbwPrice ${v.hbwPrice} drifted from canonical dealer ${canonical} (sku ${v.sku})`,
          ).toBe(canonical);
        }
      });

      for (const { label, text } of targetsFor(config)) {
        const prices = extractFromPrices(text);
        if (prices.length === 0) continue;
        it(`${label}: every "from $X" equals lowest canonical dealer ($${expected})`, () => {
          for (const p of prices) {
            expect(
              p,
              `"${label}" contains "from $${p.toLocaleString()}" but lowest canonical dealer is $${expected.toLocaleString()}\nText: ${text}`,
            ).toBe(expected);
          }
        });
      }
    });
  }
});
