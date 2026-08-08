import { describe, expect, it, vi } from 'vitest';
import { fetchHBWValuationFromInvoker, type HBWValuationParams } from './trade-valuation';

const params = {
  brand: 'Mercury',
  year: 2018,
  horsepower: 115,
  condition: 'good',
  stroke: '4-stroke',
} satisfies HBWValuationParams;

const successPayload = {
  wholesale: 5000,
  listing: 6500,
  rangeLow: 4500,
  rangeHigh: 5500,
  confidence: 'high' as const,
  hstSavings: 650,
  depreciation: 0,
  conditionFactor: 1,
  marketDemand: 'normal',
  seasonal: 'normal',
  factors: [],
};

describe('HBW valuation client result contract', () => {
  it('returns the caller-specific reason for concurrent 429 and 502 failures', async () => {
    const rateLimited = vi.fn(async () => ({
      data: null,
      error: { context: { status: 429 } },
    }));
    const unavailable = vi.fn(async () => ({
      data: null,
      error: { context: { status: 502 } },
    }));

    const [first, second] = await Promise.all([
      fetchHBWValuationFromInvoker(params, rateLimited),
      fetchHBWValuationFromInvoker(params, unavailable),
    ]);

    expect(first).toEqual({ ok: false, reason: 'rate_limited' });
    expect(second).toEqual({ ok: false, reason: 'unavailable' });
  });

  it.each([
    ['rate-limit payload', { data: { error: 'slow down', code: 'rate_limited' }, error: null }, 'rate_limited'],
    ['ordinary error payload', { data: { error: 'upstream failed' }, error: null }, 'unavailable'],
    ['malformed success', { data: { wholesale: 5000 }, error: null }, 'unavailable'],
  ] as const)('classifies %s', async (_name, response, reason) => {
    const result = await fetchHBWValuationFromInvoker(params, async () => response);
    expect(result).toEqual({ ok: false, reason });
  });

  it('classifies a network exception without contaminating the next success', async () => {
    const failed = await fetchHBWValuationFromInvoker(params, async () => {
      throw new Error('network down');
    });
    const recovered = await fetchHBWValuationFromInvoker(params, async () => ({
      data: successPayload,
      error: null,
    }));

    expect(failed).toEqual({ ok: false, reason: 'unavailable' });
    expect(recovered.ok).toBe(true);
    if (recovered.ok) {
      expect(recovered.value).toMatchObject({ low: 4500, high: 5500, average: 5000, fromHBW: true });
    }
  });

  it('forwards an explicit stroke so the API never silently assumes four-stroke', async () => {
    let sentBody: Record<string, unknown> | undefined;
    await fetchHBWValuationFromInvoker(
      { ...params, year: 1998, stroke: '2-stroke', model: '115 ELPT' },
      async (_name, options) => {
        sentBody = options.body;
        return { data: successPayload, error: null };
      },
    );

    expect(sentBody).toMatchObject({ hp: 115, model: '115 ELPT', stroke: '2-stroke' });
  });

  it.each([400, 422])('classifies HTTP %s as rejected input', async (status) => {
    const result = await fetchHBWValuationFromInvoker(params, async () => ({
      data: null,
      error: { context: { status } },
    }));
    expect(result).toEqual({ ok: false, reason: 'input_rejected' });
  });
});
