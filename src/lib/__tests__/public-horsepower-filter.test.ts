// @vitest-environment node
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { describe, expect, it, vi } from 'vitest';
import * as filters from '../../../supabase/functions/_shared/public-horsepower-filter';
import * as contract from '../../../supabase/functions/_shared/public-motor-contract';
import * as slugs from '../../../supabase/functions/_shared/motor-slug';
import * as codes from '../../../supabase/functions/_shared/mercury-codes';

const catalog = [9.9, 40, 50, 60, 90].map(horsepower => ({
  id: `motor-${horsepower}`, horsepower, model: `${horsepower} ELPT FourStroke`,
  model_display: `${horsepower} ELPT FourStroke`, family: 'FourStroke', motor_type: 'Outboard',
  availability: 'Available', in_stock: true, stock_quantity: 1, msrp: 10000, dealer_price: 9000,
}));

function loadHandler(endpoint: 'public-motors-api' | 'public-quote-api') {
  const from = vi.fn(() => {
    let rows = [...catalog];
    const q = {
      select: () => q, or: () => q, order: () => q,
      gte: (key: string, value: number) => { rows = rows.filter(m => Number(m[key as keyof typeof m]) >= value); return q; },
      lte: (key: string, value: number) => { rows = rows.filter(m => Number(m[key as keyof typeof m]) <= value); return q; },
      eq: (key: string, value: number) => { rows = rows.filter(m => m[key as keyof typeof m] === value); return q; },
      ilike: () => q,
      limit: (limit: number) => { rows = rows.slice(0, limit); return q; },
      then: (resolve: (result: unknown) => unknown) => Promise.resolve({ data: rows, error: null }).then(resolve),
    };
    return q;
  });
  let handler!: (req: Request) => Promise<Response>;
  const source = readFileSync(`supabase/functions/${endpoint}/index.ts`, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  // Execute the real endpoint body. Only infrastructure and unrelated actions are stubbed.
  const dependencies = (name: string) => {
    if (name.includes('supabase-js')) return { createClient: () => ({ from }) };
    if (name.endsWith('/public-horsepower-filter.ts')) return filters;
    if (name.endsWith('/public-motor-contract.ts')) return contract;
    if (name.endsWith('/motor-slug.ts')) return slugs;
    if (name.endsWith('/mercury-codes.ts')) return codes;
    if (name.endsWith('/rate-limit.ts')) return { checkRateLimit: async () => true };
    if (name.endsWith('/public-agent-mcp.ts')) return { McpInvalidParamsError: class extends Error {} };
    if (name.endsWith('/trade-in-input.ts')) return { TradeInInputError: class extends Error {} };
    if (name.endsWith('/hbw-valuation.ts')) return { HbwValuationError: class extends Error {} };
    return {};
  };
  new Function('require', 'exports', 'Deno', compiled)(dependencies, {}, {
    env: { get: () => 'synthetic' }, serve: (fn: typeof handler) => { handler = fn; },
  });
  return { handler, from };
}

describe.each(['public-motors-api', 'public-quote-api'] as const)('%s horsepower requests', endpoint => {
  const request = (query: string) => new Request(`https://example.test/?${endpoint === 'public-quote-api' ? 'action=list_motors&format=json&' : ''}${query}`);

  it.each([
    ['horsepower=60', [60], { min_hp: 60, max_hp: 60 }],
    ['horsepower=9.9', [9.9], { min_hp: 9.9, max_hp: 9.9 }],
    ['min_hp=40&max_hp=60', [40, 50, 60], { min_hp: 40, max_hp: 60 }],
    ['min_hp=0', [9.9, 40, 50, 60, 90], { min_hp: 0, max_hp: null }],
    ['', [9.9, 40, 50, 60, 90], { min_hp: null, max_hp: null }],
  ])('filters the actual handler for %s', async (query, expected, applied) => {
    const { handler } = loadHandler(endpoint);
    const response = await handler(request(query));
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.motors.map((m: { horsepower: number }) => m.horsepower)).toEqual(expected);
    expect(result.filters_applied).toEqual(applied);
  });

  it.each(['horsepower=oops', 'horsepower=Infinity', 'horsepower=-1', 'horsepower=0', 'horsepower=',
    'min_hp=60&max_hp=40', 'horsepower=60&max_hp=50', 'horsepower=50&horsepower=60', 'min_hp=40&min_hp=50'])('rejects %s before querying motors', async query => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const { handler, from } = loadHandler(endpoint);
      const response = await handler(request(query));
      expect(response.status).toBe(400);
      expect(await response.json()).toHaveProperty('error');
      expect(from).not.toHaveBeenCalled();
    } finally { log.mockRestore(); }
  });
});

it('applies the same filter to POST list_motors without enabling a write action', async () => {
  const { handler } = loadHandler('public-quote-api');
  const response = await handler(new Request('https://example.test/', {
    method: 'POST', body: JSON.stringify({ action: 'list_motors', horsepower: 60 }),
  }));
  expect(response.status).toBe(200);
  expect((await response.json()).motors.map((m: { horsepower: number }) => m.horsepower)).toEqual([60]);
});

it.each([NaN, Infinity, -1, true, [], {}, '0x10'])('rejects malformed POST horsepower %s', horsepower => {
  expect(() => filters.parseHorsepowerFilter({ horsepower })).toThrow(filters.HorsepowerFilterError);
});

it('accepts an exact HP inside a compatible range', () => {
  expect(filters.parseHorsepowerFilter({ horsepower: 50, min_hp: 40, max_hp: 60 })).toEqual({ min_hp: 50, max_hp: 50 });
});
