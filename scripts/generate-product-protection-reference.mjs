import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(ROOT, 'src', 'data', 'mercuryProductProtectionRates.json');
const PUBLIC_DIR = join(ROOT, 'public');
const SITE_URL = 'https://www.mercuryrepower.ca';
const rateCard = JSON.parse(readFileSync(SOURCE, 'utf8'));

const money = (value) => `$${Number(value).toLocaleString('en-CA')}`;
const rows = rateCard.rates.map((band) =>
  `| ${band.label} | ${money(band.prices['1'])} | ${money(band.prices['2'])} | ${money(band.prices['3'])} | ${money(band.prices['4'])} | ${money(band.prices['5'])} |`,
);

const markdown = `---
title: Mercury Product Protection Platinum Plans and Prices Canada
canonical: ${SITE_URL}/mercury-product-protection
currency: ${rateCard.currency}
prices_exclude_tax: ${rateCard.pricesExcludeTax}
last_verified: ${rateCard.lastVerified}
source: Harris Boat Works
---

# Mercury Product Protection Platinum Plans and Prices Canada

Harris Boat Works publishes current Canadian-dollar retail pricing for Mercury Platinum Product Protection plans. Platinum is the highest Mercury Product Protection coverage tier and covers eligible mechanical and electrical failures under the plan contract.

## Direct answer

Mercury Platinum Product Protection at Harris Boat Works currently starts at ${money(rateCard.rates[0].prices['1'])} CAD for a one-year plan on a 2.5-14.9 HP outboard. A four-year plan for a 75-149.9 HP outboard is ${money(rateCard.rates[3].prices['4'])} CAD. The complete rate card ranges up to ${money(rateCard.rates.at(-1).prices['5'])} CAD for a five-year plan on a 600 HP outboard. Prices are before HST and final eligibility and price are confirmed by serial number. Mercury defines Product Protection as an extended service contract, not an extension of the standard product warranty.

## Current Platinum rate card (CAD before HST)

| Horsepower | 1 year | 2 years | 3 years | 4 years | 5 years |
|---|---:|---:|---:|---:|---:|
${rows.join('\n')}

Each column is the purchased Product Protection term, not the combined warranty total. Plans are available in one- through five-year terms, subject to Mercury eligibility, with up to ${rateCard.maximumCombinedYears} years of combined factory limited warranty and Product Protection.

## Promotion-aware quote calculation

When an applicable Mercury promotion changes the included warranty period, the HBW quote builder counts that coverage before calculating a paid Platinum term. It then prices only the remaining one- through five-year plan needed to reach the selected combined total, never above Mercury's ${rateCard.maximumCombinedYears}-year maximum. HBW confirms current coverage from the motor serial record; current promotional terms always defer to ${SITE_URL}/promotions.

## Eligibility snapshot

- Purchase before the applicable Mercury factory limited warranty expires.
- Recreational use and fewer than 500 engine hours, subject to the complete Mercury plan terms.
- Manufactured in the current calendar year or four preceding calendar years, subject to the complete eligibility rules and serial-number verification.
- Transferable to a subsequent recreational-use purchaser when Mercury's transfer requirements are met.
- $50 deductible per claim under the current Canadian Platinum plan terms.

## Sources and important notice

- Human-readable page and estimator: ${SITE_URL}/mercury-product-protection
- Current promotions: ${SITE_URL}/promotions
- Official Mercury Canada overview: ${rateCard.officialOverviewUrl}
- Official Canadian Platinum plan benefits and provisions: ${rateCard.officialCanadaPlanTermsUrl}
- Harris Boat Works: (905) 342-2153, Gores Landing, Ontario

Pricing last verified ${rateCard.lastVerified}. Eligibility, exclusions, maintenance requirements, transfer rules and the actual Mercury Product Protection contract govern. Final eligibility, term and price are confirmed by motor serial number before registration.
`;

const publicJson = {
  '@context': 'https://schema.org',
  '@type': 'Dataset',
  name: 'Mercury Platinum Product Protection Canadian Rate Card',
  description: 'Canadian-dollar retail pricing by horsepower band and one- through five-year plan term.',
  url: `${SITE_URL}/mercury-product-protection`,
  license: `${SITE_URL}/terms`,
  creator: { '@type': 'Organization', name: 'Harris Boat Works', url: SITE_URL },
  dateModified: rateCard.lastVerified,
  ...rateCard,
};

mkdirSync(PUBLIC_DIR, { recursive: true });
writeFileSync(join(PUBLIC_DIR, 'mercury-product-protection.md'), markdown, 'utf8');
writeFileSync(join(PUBLIC_DIR, 'mercury-product-protection.json'), `${JSON.stringify(publicJson, null, 2)}\n`, 'utf8');

console.log('[product-protection] wrote public/mercury-product-protection.md and .json from the canonical JSON rate card');
