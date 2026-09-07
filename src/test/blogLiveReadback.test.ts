import { describe, expect, it } from 'vitest';
import {
  evaluateReadback,
  findExactSku,
  fmtCad,
  parsePricingReference,
  salmonPairTotal,
  BANNED_LENDERS,
  FINANCING_ROUTES,
  JOYSTICK_ROUTES,
  OSHAWA_ROUTE,
  PRICING_REFERENCE_ROUTE,
  READBACK_ROUTES,
  SALMON_ROUTE,
  SALMON_MAIN_MODEL,
  SALMON_KICKER_MODEL,
  FLAGSHIP_RIGGING_ROUTE,
} from '../../scripts/lib/blog-live-readback.mjs';

// Shaped exactly like the live /pricing-reference.md rows.
const row = (hp: string, model: string, part: string, shaft: string, control: string, price: string, msrp: string) =>
  `| ${hp} | ${model} | ${part} | ${shaft} | ${control} | ${price} _(MSRP ${msrp})_ | In stock | [build](https://www.mercuryrepower.ca/quote/motor-selection?motor=x) |`;

const PRICING_MD = [
  '# Pricing reference',
  '_Last updated 2026-08-09_',
  '',
  '| HP | Model | Part | Shaft | Control | Price | Status | Build |',
  '| --- | --- | --- | --- | --- | --- | --- | --- |',
  row('15', '15ELPT ProKicker FourStroke', '1A15452BK', '20"', 'Remote', '$5,500', '$5,860'),
  row('15', '15EXLPT ProKicker FourStroke', '1A15462BK', '25"', 'Remote', '$5,594', '$5,960'),
  row('250', '250ELPT ProXS', '12500033A', '20"', 'Remote', '$34,848', '$38,820'),
  row('250', '250EXLPT ProXS', '12500034A', '25"', 'Remote', '$35,646', '$39,710'),
  row('250', '250XL FourStroke', '12500013A', '25"', ' - ', '$36,619', '$40,795'),
].join('\n');

const EXPECTED_SALMON = fmtCad(salmonPairTotal(parsePricingReference(PRICING_MD)).total!);

const goodDoc = (body: string) => ({
  ok: true,
  status: 200,
  contentType: 'text/markdown; charset=utf-8',
  redirected: false,
  body,
});

const OSHAWA_GOOD = [
  '**Storage:** HBW offers outdoor storage with professional shrink wrap, outdoor uncovered storage, and shrink-wrap-only service. Boats stay here through winter.',
  "We don't offer indoor, heated, climate-controlled, summer, or year-round storage.",
  'Eligible work resumes when we reopen in early-April.',
].join('\n\n');
const JOYSTICK_GOOD = [
  'Conventional Mercury Joystick Piloting for Outboards requires two or more DTS-equipped engines.',
  'Most single-engine rigs do not qualify. Mercury also offers [Joystick Piloting for Single-Engine Outboards with Thruster]',
  '(https://www.mercurymarine.com/us/en/about-us/news/mercury-introduces-joystick-piloting-for-single-engine-outboards.html)',
  'for a narrow compatible package.',
].join(' ');
const RIGGING_GOOD =
  'Many aluminum boats sold here, including models from Lund, Crestliner, Princecraft and Lowe, are commonly rigged with Mercury from the factory. Rigging varies by brand, model and package, so confirm what your specific boat came with.';
const FINANCING_GOOD = [
  'HBW arranges Canadian financing through DealerPlan, primarily with TD Auto Finance, O.A.C.',
  'Rates shown are as of August 2026. Check [current terms](/promotions) before relying on an estimate.',
].join(' ');

function buildDocs(overrides: Record<string, unknown> = {}) {
  const docs: Record<string, unknown> = {};
  for (const route of READBACK_ROUTES) {
    let body = 'Generic surface copy.';
    if (route === PRICING_REFERENCE_ROUTE) body = PRICING_MD;
    else if (route === OSHAWA_ROUTE) body = OSHAWA_GOOD;
    else if (route === SALMON_ROUTE)
      body = `Package total ${EXPECTED_SALMON} CAD. See the [live pricing reference](/pricing-reference).`;
    else if (route === FLAGSHIP_RIGGING_ROUTE) body = RIGGING_GOOD;
    else if (JOYSTICK_ROUTES.includes(route)) body = JOYSTICK_GOOD;
    else if (FINANCING_ROUTES.includes(route)) body = FINANCING_GOOD;
    docs[route] = goodDoc(body);
  }
  return { ...docs, ...overrides };
}

const findCheck = (result: ReturnType<typeof evaluateReadback>, id: string, route?: string) =>
  result.checks.find((check) => check.id === id && (!route || check.route === route));

describe('blog live readback route map', () => {
  it('pins the exact punchlist routes so substitution cannot recur', () => {
    // Oshawa retired in the 2026-09 blog audit; the shared dealer-page storage
    // contract now rides on the Bowmanville twin (see scripts/lib/blog-live-readback.mjs).
    expect(OSHAWA_ROUTE).toBe('/blog/mercury-dealer-bowmanville-ontario-hbw.md');
    expect(SALMON_ROUTE).toBe('/blog/best-mercury-outboard-lake-ontario-salmon-trout.md');
    expect(FLAGSHIP_RIGGING_ROUTE).toBe('/blog/why-mercury-dominates-outboard-market.md');
    expect(JOYSTICK_ROUTES).toEqual([
      '/blog/mercury-dts-retrofit-eligibility-2026.md',
      '/blog/center-console-mercury-motor-guide.md',
      '/blog/docking-boat-in-wind-rice-lake.md',
    ]);
    expect(FINANCING_ROUTES).toEqual([
      '/blog/ontario-cottage-boat-motor-repower-guide.md',
      '/blog/cheapest-mercury-outboard-canada-2026.md',
      '/blog/complete-guide-boat-repower-kawarthas.md',
      '/blog/repair-repower-or-sell-boat-ontario-decision-guide.md',
      '/blog/new-vs-used-mercury-outboard-ontario.md',
    ]);
    expect(BANNED_LENDERS).toEqual([
      'Mercury Repower Financing',
      'Medallion',
      'Sheffield',
      'LightStream',
      'Financeit',
    ]);
  });
});

describe('blog live readback parser', () => {
  it('passes on a fully corrected corpus', () => {
    const result = evaluateReadback(buildDocs());
    expect(result.checks.filter((check) => check.status === 'FAIL')).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('fails verb-less year-round storage labels and missing seasonal wording', () => {
    const result = evaluateReadback(
      buildDocs({ [OSHAWA_ROUTE]: goodDoc('**Storage:** Year-round indoor and outdoor space in Oshawa.') }),
    );
    expect(findCheck(result, 'oshawa-storage-no-year-round')?.status).toBe('FAIL');
    expect(findCheck(result, 'oshawa-storage-seasonal')?.status).toBe('FAIL');
    expect(result.ok).toBe(false);
  });

  it('allows an explicit year-round storage denial on the corrected Oshawa surface', () => {
    const result = evaluateReadback(buildDocs());
    expect(findCheck(result, 'oshawa-storage-no-year-round')?.status).toBe('PASS');
    expect(findCheck(result, 'oshawa-storage-seasonal')?.status).toBe('PASS');
  });

  it('fails an absolute single-engine joystick ban and a missing citation on each affected route', () => {
    for (const route of JOYSTICK_ROUTES) {
      const result = evaluateReadback(
        buildDocs({ [route]: goodDoc('Joystick piloting on a single-engine boat is simply not possible.') }),
      );
      expect(findCheck(result, 'joystick-no-absolute-ban', route)?.status).toBe('FAIL');
      expect(findCheck(result, 'joystick-exception-citation', route)?.status).toBe('FAIL');
    }
  });

  it('allows conventional twin-package requirements when the cited single-engine exception follows', () => {
    const result = evaluateReadback(buildDocs());
    for (const route of JOYSTICK_ROUTES) {
      expect(findCheck(result, 'joystick-no-absolute-ban', route)?.status).toBe('PASS');
      expect(findCheck(result, 'joystick-exception-citation', route)?.status).toBe('PASS');
    }
  });

  it('does not accept an unrelated Mercury link as the exception citation', () => {
    const route = JOYSTICK_ROUTES[0];
    const result = evaluateReadback(
      buildDocs({
        [route]: goodDoc(
          [
            'See https://www.mercurymarine.com/us/en/engines/outboard for engine details.',
            'Mercury Joystick Piloting for Single-Engine Outboards with Thruster is a narrow exception.',
          ].join('\n\n'),
        ),
      }),
    );
    expect(findCheck(result, 'joystick-exception-citation', route)?.status).toBe('FAIL');
  });

  it('fails a pontoon-specific claim attached to the joystick exception', () => {
    const route = JOYSTICK_ROUTES[1];
    const result = evaluateReadback(
      buildDocs({
        [route]: goodDoc(
          'Mercury Joystick Piloting for Single-Engine Outboards with Thruster is standard on any pontoon. https://www.mercurymarine.com/en/us/news/joystick',
        ),
      }),
    );
    expect(findCheck(result, 'joystick-no-pontoon-claim', route)?.status).toBe('FAIL');
  });

  it('derives the salmon total from the two exact canonical rows', () => {
    const pricing = parsePricingReference(PRICING_MD);
    expect(findExactSku(pricing, SALMON_MAIN_MODEL)?.dealer).toBe(34848);
    expect(findExactSku(pricing, SALMON_KICKER_MODEL)?.dealer).toBe(5500);
    expect(EXPECTED_SALMON).toBe('$40,348');
  });

  it('mutating either exact row changes the expected total', () => {
    const mainShift = PRICING_MD.replace('$34,848', '$33,848');
    const kickerShift = PRICING_MD.replace('$5,500 _(MSRP $5,860)_', '$5,700 _(MSRP $5,860)_');
    expect(fmtCad(salmonPairTotal(parsePricingReference(mainShift)).total!)).toBe('$39,348');
    expect(fmtCad(salmonPairTotal(parsePricingReference(kickerShift)).total!)).toBe('$40,548');

    const expected = fmtCad(salmonPairTotal(parsePricingReference(mainShift)).total!);
    const stale = evaluateReadback(buildDocs({ [PRICING_REFERENCE_ROUTE]: goodDoc(mainShift) }));
    expect(findCheck(stale, 'salmon-live-total')?.status).toBe('FAIL');
    const fresh = evaluateReadback(
      buildDocs({
        [PRICING_REFERENCE_ROUTE]: goodDoc(mainShift),
        [SALMON_ROUTE]: goodDoc(`Package total ${expected}. See the [live pricing reference](/pricing-reference).`),
      }),
    );
    expect(findCheck(fresh, 'salmon-live-total')?.status).toBe('PASS');
  });

  it('fails closed when the exact ProXS row cannot be parsed instead of picking a FourStroke floor', () => {
    const withoutProXs = PRICING_MD.split('\n').filter((line) => !line.includes('250ELPT ProXS')).join('\n');
    expect(salmonPairTotal(parsePricingReference(withoutProXs)).total).toBeNull();
    const result = evaluateReadback(buildDocs({ [PRICING_REFERENCE_ROUTE]: goodDoc(withoutProXs) }));
    const check = findCheck(result, 'salmon-live-total');
    expect(check?.status).toBe('FAIL');
    expect(check?.detail).toContain('fail closed');
  });

  it('requires a /pricing-reference pointer on the salmon route', () => {
    const result = evaluateReadback({
      ...buildDocs(),
      [SALMON_ROUTE]: goodDoc(`Package total ${EXPECTED_SALMON} CAD.`),
    });
    expect(findCheck(result, 'salmon-pricing-link')?.status).toBe('FAIL');
  });

  it('fails an unqualified aluminum factory-rigging claim even when a qualifier exists elsewhere', () => {
    const result = evaluateReadback(
      buildDocs({
        [FLAGSHIP_RIGGING_ROUTE]: goodDoc(
          [
            'Canadian aluminum brands come Mercury-rigged from the factory.',
            'Elsewhere on this page, prop selection is model-specific and depends on the package.',
          ].join('\n\n'),
        ),
      }),
    );
    const check = findCheck(result, 'flagship-rigging');
    expect(check?.status).toBe('FAIL');
    expect(check?.detail).toContain('unqualified factory-rigging claim');
  });

  it('fails financing routes missing required terms or naming banned lenders', () => {
    for (const route of FINANCING_ROUTES) {
      const result = evaluateReadback(
        buildDocs({ [route]: goodDoc('Ask about Mercury Repower Financing or Sheffield for your loan.') }),
      );
      expect(findCheck(result, 'financing-required', route)?.detail).toContain('TD Auto Finance');
      expect(findCheck(result, 'financing-banned-lenders', route)?.status).toBe('FAIL');
    }
  });

  it('fails a financing route that drops the OAC/as-of qualification', () => {
    const route = FINANCING_ROUTES[0];
    const result = evaluateReadback(
      buildDocs({
        [route]: goodDoc('Financing runs through DealerPlan, primarily with TD Auto Finance. See [promos](/promotions).'),
      }),
    );
    const check = findCheck(result, 'financing-required', route);
    expect(check?.status).toBe('FAIL');
    expect(check?.detail).toContain('OAC');
  });

  it('fails explicitly on transport errors, redirects, and HTML responses', () => {
    const [a, b, c] = [OSHAWA_ROUTE, SALMON_ROUTE, FINANCING_ROUTES[1]];
    const result = evaluateReadback(
      buildDocs({
        [a]: { ok: false, status: null, error: 'TimeoutError: timed out' },
        [b]: {
          ok: true,
          status: 200,
          contentType: 'text/markdown',
          redirected: true,
          finalUrl: 'https://www.mercuryrepower.ca/404',
          body: '# hi',
        },
        [c]: {
          ok: true,
          status: 200,
          contentType: 'text/html; charset=utf-8',
          redirected: false,
          body: '<!doctype html><html></html>',
        },
      }),
    );
    const transport = (route: string) =>
      result.checks.find((check) => check.id === 'transport' && check.route === route);
    expect(transport(a)?.detail).toContain('transport error');
    expect(transport(b)?.detail).toContain('redirected');
    expect(transport(c)?.detail).toContain('HTML response');
    expect(result.ok).toBe(false);
  });

  it('fails when a surface was never fetched', () => {
    const docs = buildDocs();
    delete (docs as Record<string, unknown>)[FLAGSHIP_RIGGING_ROUTE];
    const result = evaluateReadback(docs);
    expect(
      result.checks.find((check) => check.id === 'transport' && check.route === FLAGSHIP_RIGGING_ROUTE)?.detail,
    ).toContain('not fetched');
  });
});
