/**
 * Pure evaluation logic for the production Markdown readback.
 *
 * The CLI (scripts/blog-live-readback.mjs) is responsible for fetching; this
 * module only interprets already-fetched documents so the pass/fail behaviour
 * is testable offline with fixtures.
 *
 * A "doc" is: { path, url, ok, status, contentType, body, error, redirected, finalUrl }
 */

export const OSHAWA_ROUTE = '/blog/mercury-dealer-bowmanville-ontario-hbw.md'; // was the retired Oshawa twin; the check verifies shared dealer-page storage wording
export const PRICING_REFERENCE_ROUTE = '/pricing-reference.md';
export const SALMON_ROUTE = '/blog/best-mercury-outboard-lake-ontario-salmon-trout.md';
export const FLAGSHIP_RIGGING_ROUTE = '/blog/why-mercury-dominates-outboard-market.md';

export const JOYSTICK_ROUTES = [
  '/blog/mercury-dts-retrofit-eligibility-2026.md',
  '/blog/center-console-mercury-motor-guide.md',
  '/blog/docking-boat-in-wind-rice-lake.md',
];

export const FINANCING_ROUTES = [
  '/blog/ontario-cottage-boat-motor-repower-guide.md',
  '/blog/cheapest-mercury-outboard-canada-2026.md',
  '/blog/complete-guide-boat-repower-kawarthas.md',
  '/blog/repair-repower-or-sell-boat-ontario-decision-guide.md',
  '/blog/new-vs-used-mercury-outboard-ontario.md',
];

export const BANNED_LENDERS = [
  'Mercury Repower Financing',
  'Medallion',
  'Sheffield',
  'LightStream',
  'Financeit',
];

/** Exact canonical salmon pair rows that must be parsed out of live pricing. */
export const SALMON_MAIN_MODEL = '250ELPT ProXS';
export const SALMON_KICKER_MODEL = '15ELPT ProKicker FourStroke';

export const READBACK_ROUTES = Array.from(
  new Set([
    PRICING_REFERENCE_ROUTE,
    OSHAWA_ROUTE,
    SALMON_ROUTE,
    FLAGSHIP_RIGGING_ROUTE,
    ...JOYSTICK_ROUTES,
    ...FINANCING_ROUTES,
  ]),
);

// Affirmative year-round storage, including verb-less "**Storage:** Year-round ..."
// labels. Legitimate denials must remain allowed on the same public surface.
const YEAR_ROUND_STORAGE =
  /year[-\s]?round[^.\n|]{0,40}\bstorage\b|\bstorage\b[^.\n|]{0,40}year[-\s]?round/i;
const YEAR_ROUND_STORAGE_DENIAL =
  /\b(?:no|not|never)\b[^.\n]{0,160}\byear[-\s]?round\b[^.\n]{0,60}\bstorage\b|\bdo(?:es)?n['’]t\b[^.\n]{0,160}\byear[-\s]?round\b[^.\n]{0,60}\bstorage\b|\bdo(?:es)? not\b[^.\n]{0,160}\byear[-\s]?round\b[^.\n]{0,60}\bstorage\b|\byear[-\s]?round\b[^.\n]{0,60}\bstorage\b[^.\n]{0,80}\b(?:is|are)\s+(?:not|never)\b/i;
const EARLY_APRIL = /early[-\s]April/i;
const JOYSTICK_ABSOLUTE_BAN =
  /Single-engine boats are not eligible(?: for joystick)?(?:,|\s)+(?:regardless|period)|requires twin engines minimum|requires twin matched Mercury motors from 2014 onward|joystick isn['’]t on the table|no single[-\s]engine[^.]{0,60}joystick|single[-\s]engine[^.]{0,80}joystick[^.]{0,60}(?:not eligible|ineligible|impossible|not possible|not available|isn't available)|joystick[^.]{0,80}single[-\s]engine[^.]{0,60}(?:not eligible|ineligible|impossible|not possible|not available|isn't available)/i;
const JOYSTICK_EXCEPTION = /Joystick Piloting for Single[-\s]Engine Outboards with Thruster/i;
const JOYSTICK_RELEASE_CITATION =
  /https?:\/\/(?:www\.)?mercurymarine\.com\/[a-z]{2}\/[a-z]{2}\/about-us\/news\/mercury-introduces-joystick-piloting-for-single-engine-outboards\.html/i;
const PONTOON_CLAIM = /pontoon/i;
// Broad "Canadian aluminum brands come Mercury-rigged from the factory" class of claim.
const RIGGING_CLAIM_SENTENCE =
  /(?:aluminum|aluminium)[^.!?\n]{0,200}(?:factory[-\s]rigg\w*|rigged\s+from\s+the\s+factory|come[s]?\s+Mercury[-\s]rigged|come[s]?\s+rigged\s+with\s+Mercury)|(?:factory[-\s]rigg\w*|rigged\s+from\s+the\s+factory|come[s]?\s+Mercury[-\s]rigged)[^.!?\n]{0,200}(?:aluminum|aluminium)/i;
const RIGGING_QUALIFIER =
  /\b(?:select|specific|certain|many|some|most)\b[^.!?\n]{0,80}(?:model|package|series|trim)|(?:model|package|trim|brand)[-\s]specific|depends on the (?:model|package|brand)|(?:varies|varying) by (?:brand|model|package)|by brand, model,? and package/i;


export const fmtCad = (value) => `$${Math.round(value).toLocaleString('en-CA')}`;

/** Parse the canonical pricing Markdown table used by /pricing-reference.md. */
export function parsePricingReference(markdown) {
  const rowRx = /^\|\s*([\d.]+)\s*\|\s*([^|]+?)\s*\|\s*([A-Z0-9]+)\s*\|.*?\|\s*\$([\d,]+)\s*_\(MSRP \$([\d,]+)\)_\s*\|/gm;
  const skus = [];
  for (const match of markdown.matchAll(rowRx)) {
    skus.push({
      hp: Number(match[1]),
      model: match[2].trim(),
      dealer: Number(match[4].replaceAll(',', '')),
      msrp: Number(match[5].replaceAll(',', '')),
    });
  }
  return { skus };
}

const normalizeModel = (model) => model.replace(/\s+/g, ' ').trim().toLowerCase();

/** Look up one exact model row; returns null if it cannot be parsed (fail closed). */
export function findExactSku(pricing, model) {
  const wanted = normalizeModel(model);
  const matches = pricing.skus.filter((sku) => normalizeModel(sku.model) === wanted);
  return matches.length === 1 ? matches[0] : null;
}

/**
 * Salmon package total: the exact live canonical pair,
 * 250ELPT ProXS + 15ELPT ProKicker FourStroke. Fails closed when either exact
 * row is missing or ambiguous — no generic 250/300 floor substitution.
 */
export function salmonPairTotal(pricing) {
  const main = findExactSku(pricing, SALMON_MAIN_MODEL);
  const kicker = findExactSku(pricing, SALMON_KICKER_MODEL);
  if (!main || !kicker) {
    return {
      total: null,
      main,
      kicker,
      missing: [!main && SALMON_MAIN_MODEL, !kicker && SALMON_KICKER_MODEL].filter(Boolean),
    };
  }
  return { total: main.dealer + kicker.dealer, main, kicker, missing: [] };
}


function transportFailure(doc) {
  if (!doc) return 'document was not fetched';
  if (doc.error) return `transport error: ${doc.error}`;
  if (!doc.ok || doc.status !== 200) return `unexpected HTTP status ${doc.status ?? 'none'}`;
  if (doc.redirected) return `redirected to ${doc.finalUrl || 'unknown URL'}`;
  const type = String(doc.contentType || '');
  if (/text\/html/i.test(type)) return `HTML response for a Markdown surface (content-type ${type})`;
  const body = String(doc.body || '');
  if (!body.trim()) return 'empty response body';
  if (/^\s*<(?:!doctype|html)/i.test(body)) return 'malformed response: HTML document returned instead of Markdown';
  return null;
}

/**
 * @param {Record<string, object>} docs keyed by route path
 * @returns {{ ok: boolean, checks: Array<{id: string, route?: string, status: 'PASS'|'FAIL', detail: string}> }}
 */
export function evaluateReadback(docs) {
  const checks = [];
  const add = (id, route, ok, detail) =>
    checks.push({ id, route, status: ok ? 'PASS' : 'FAIL', detail });

  // 0. Transport integrity for every expected surface.
  const usable = new Set();
  for (const route of READBACK_ROUTES) {
    const failure = transportFailure(docs[route]);
    add('transport', route, !failure, failure || 'fetched 200 Markdown without redirect');
    if (!failure) usable.add(route);
  }

  const body = (route) => (usable.has(route) ? String(docs[route].body) : null);

  // 1. Oshawa storage wording.
  const oshawa = body(OSHAWA_ROUTE);
  if (oshawa === null) {
    add('oshawa-storage', OSHAWA_ROUTE, false, 'surface unavailable, cannot verify storage wording');
  } else {
    add(
      'oshawa-storage-no-year-round',
      OSHAWA_ROUTE,
      !oshawa
        .split(/\n+/)
        .some((line) => YEAR_ROUND_STORAGE.test(line) && !YEAR_ROUND_STORAGE_DENIAL.test(line)),
      oshawa
        .split(/\n+/)
        .some((line) => YEAR_ROUND_STORAGE.test(line) && !YEAR_ROUND_STORAGE_DENIAL.test(line))
        ? 'affirmative year-round storage promise present'
        : 'no year-round storage promise',
    );
    add(
      'oshawa-storage-seasonal',
      OSHAWA_ROUTE,
      EARLY_APRIL.test(oshawa),
      EARLY_APRIL.test(oshawa) ? 'early-April seasonal wording present' : 'missing early-April seasonal wording',
    );
  }

  // 2. Joystick: no absolute single-engine ban, exception + official Mercury citation retained.
  for (const route of JOYSTICK_ROUTES) {
    const text = body(route);
    if (text === null) {
      add('joystick', route, false, 'surface unavailable, cannot verify joystick wording');
      continue;
    }
    add(
      'joystick-no-absolute-ban',
      route,
      !JOYSTICK_ABSOLUTE_BAN.test(text),
      JOYSTICK_ABSOLUTE_BAN.test(text)
        ? 'absolute single-engine joystick ban still present'
        : 'no absolute single-engine joystick ban',
    );
    const exceptionParagraph =
      text.split(/\n\s*\n/).find((paragraph) => JOYSTICK_EXCEPTION.test(paragraph)) ?? '';
    const hasException = exceptionParagraph.length > 0;
    const hasCitation = JOYSTICK_RELEASE_CITATION.test(exceptionParagraph);
    add(
      'joystick-exception-citation',
      route,
      hasException && hasCitation,
      hasException && hasCitation
        ? 'package-specific Mercury single-engine exception cited with an official Mercury source'
        : `missing ${[!hasException && 'package-specific single-engine exception', !hasCitation && 'official mercurymarine.com citation'].filter(Boolean).join(' and ')}`,
    );
    const pontoonLeak = PONTOON_CLAIM.test(exceptionParagraph);
    add(
      'joystick-no-pontoon-claim',
      route,
      !pontoonLeak,
      pontoonLeak
        ? 'pontoon-specific claim attached to the single-engine joystick exception'
        : 'no pontoon-specific claim attached to the exception',
    );
  }

  // 3. Salmon package total derived from the two exact live pricing rows.
  const pricingBody = body(PRICING_REFERENCE_ROUTE);
  const salmonBody = body(SALMON_ROUTE);
  if (pricingBody === null || salmonBody === null) {
    add('salmon-live-total', SALMON_ROUTE, false, 'pricing reference or salmon surface unavailable');
  } else {
    const pair = salmonPairTotal(parsePricingReference(pricingBody));
    if (pair.total === null) {
      add(
        'salmon-live-total',
        SALMON_ROUTE,
        false,
        `fail closed: could not parse exact live pricing row(s) for ${pair.missing.join(' and ')}`,
      );
    } else {
      const expected = fmtCad(pair.total);
      const present = salmonBody.includes(expected);
      add(
        'salmon-live-total',
        SALMON_ROUTE,
        present,
        present
          ? `package total ${expected} matches live ${SALMON_MAIN_MODEL} (${fmtCad(pair.main.dealer)}) + ${SALMON_KICKER_MODEL} (${fmtCad(pair.kicker.dealer)})`
          : `package total does not match live pricing rows (expected ${expected} = ${fmtCad(pair.main.dealer)} + ${fmtCad(pair.kicker.dealer)})`,
      );
    }
    const linked = salmonBody.includes('/pricing-reference');
    add(
      'salmon-pricing-link',
      SALMON_ROUTE,
      linked,
      linked ? 'links to /pricing-reference' : 'missing /pricing-reference pointer',
    );
  }

  // 4. Flagship factory-rigging claim stays qualified in the same paragraph.
  const rigging = body(FLAGSHIP_RIGGING_ROUTE);
  if (rigging === null) {
    add('flagship-rigging', FLAGSHIP_RIGGING_ROUTE, false, 'surface unavailable, cannot verify rigging claim');
  } else {
    const claimParagraphs = rigging
      .split(/\n\s*\n/)
      .filter((paragraph) => RIGGING_CLAIM_SENTENCE.test(paragraph));
    const unqualified = claimParagraphs.filter((paragraph) => !RIGGING_QUALIFIER.test(paragraph));
    add(
      'flagship-rigging',
      FLAGSHIP_RIGGING_ROUTE,
      unqualified.length === 0,
      claimParagraphs.length === 0
        ? 'no broad aluminum factory-rigging claim made'
        : unqualified.length === 0
          ? 'every factory-rigging claim is qualified by brand/model/package in the same paragraph'
          : `unqualified factory-rigging claim: "${unqualified[0].trim().slice(0, 160)}"`,
    );

  }

  // 5. Financing routes.
  for (const route of FINANCING_ROUTES) {
    const text = body(route);
    if (text === null) {
      add('financing', route, false, 'surface unavailable, cannot verify financing wording');
      continue;
    }
    const missing = [];
    if (!/TD Auto Finance/i.test(text)) missing.push('TD Auto Finance');
    if (!/\bprimarily\b[^.\n]{0,60}TD Auto Finance|TD Auto Finance[^.\n]{0,60}\bprimar/i.test(text))
      missing.push('"primarily" TD Auto Finance qualification');
    if (!/DealerPlan/i.test(text)) missing.push('DealerPlan');
    if (!/\bO\.?A\.?C\.?\b|on approved credit/i.test(text)) missing.push('OAC qualification');
    if (!/\bas of\b/i.test(text)) missing.push('as-of date qualification');
    if (!text.includes('/promotions')) missing.push('/promotions');
    add(
      'financing-required',
      route,
      missing.length === 0,
      missing.length
        ? `missing ${missing.join(', ')}`
        : 'DealerPlan + primarily TD Auto Finance + OAC/as-of + /promotions present',
    );

    const banned = BANNED_LENDERS.filter((lender) =>
      new RegExp(`\\b${lender.replace(/\s+/g, '\\s+')}\\b`, 'i').test(text),
    );
    add(
      'financing-banned-lenders',
      route,
      banned.length === 0,
      banned.length ? `banned lender wording present: ${banned.join(', ')}` : 'no banned lender wording',
    );
  }

  return { ok: checks.every((check) => check.status === 'PASS'), checks };
}
