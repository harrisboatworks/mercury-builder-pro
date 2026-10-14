import { describe, expect, it } from 'vitest';
import { getMcpMotor, presentMcpMotor, searchMcpMotors } from '../../../supabase/functions/_shared/public-mcp-motors.ts';
import { resolveMercuryCatalogSpecs } from '../../../supabase/functions/_shared/mercury-codes.ts';

const row = { id: 'synthetic-90', horsepower: 90, model_display: '90 ELPT FourStroke', family: 'FourStroke', availability: null, shaft_code: null, control_type: null, dealer_price: 14960 };

function database(rows: object[]) {
  const calls: unknown[][] = [];
  const q: any = {
    select: (...args: unknown[]) => { calls.push(['select', ...args]); return q; },
    or: (...args: unknown[]) => { calls.push(['or', ...args]); return q; },
    order: (...args: unknown[]) => { calls.push(['order', ...args]); return q; },
    limit: (...args: unknown[]) => { calls.push(['limit', ...args]); return q; },
    eq: (...args: unknown[]) => { calls.push(['eq', ...args]); return q; },
    gte: () => q, lte: () => q,
    then: (resolve: (x: object) => void) => resolve({ data: rows, error: null }),
  };
  return { client: { from: () => q }, calls };
}

describe('MCP public motor facts', () => {
  it('returns the REST decoder facts and keeps canonical prices/links', () => {
    const actual = presentMcpMotor(row)!;
    expect(actual).toMatchObject(resolveMercuryCatalogSpecs({ modelDisplay: row.model_display }));
    expect(actual).toMatchObject({ shaftLength: 'L', shaftInches: 20, controlType: 'Remote', startType: 'Electric', powerTrim: true, commandThrust: null, specSource: 'model_code', sellingPrice: 14960, currency: 'CAD' });
    expect(actual.url).toContain('/motors/');
    expect(actual).not.toHaveProperty('row');
    expect(actual).not.toHaveProperty('manual_overrides');
  });
  it('preserves explicit database facts and leaves unstated facts null', () => {
    expect(presentMcpMotor({ ...row, shaft_code: 'XL', control_type: 'Tiller' })).toMatchObject({ shaftLength: 'XL', shaftInches: 25, controlType: 'Tiller', specSource: 'database' });
    expect(presentMcpMotor({ ...row, model_display: 'Unspecified motor' })).toMatchObject({ shaftLength: null, shaftInches: null, controlType: null, specSource: null });
  });
  it.each([
    [0, true, 'In Stock', false],
    [2, false, 'Available to Order', true],
    [null, false, 'In Stock', true],
    [null, true, null, true],
    [null, false, null, false],
    [-1, true, 'In Stock', false],
  ])('normalizes quantity=%s flag=%s availability=%s', (stock_quantity, in_stock, availability, expected) => {
    expect(presentMcpMotor({ ...row, stock_quantity, in_stock, availability })?.inStock).toBe(expected);
  });
  it('filters stock/eligibility before caller limit, without SQL boolean truncation', async () => {
    const db = database([
      { ...row, id: 'empty', stock_quantity: 0, in_stock: true },
      { ...row, id: 'excluded', availability: 'Exclude', stock_quantity: 2 },
      { ...row, id: 'verado', family: 'Verado', stock_quantity: 2 },
      { ...row, id: 'late-stock', stock_quantity: 1, in_stock: false },
    ]);
    expect((await searchMcpMotors(db.client, { in_stock_only: true, limit: 1 })).motors.map((m: any) => m.id)).toEqual(['late-stock']);
    expect(db.calls).toContainEqual(['limit', 501]);
    expect(db.calls).not.toContainEqual(['eq', 'in_stock', true]);
  });
  it('get-by-id and slug return the same corrected facts as search', async () => {
    const source = { ...row, model_number: '1F904632D', model_display: '90 EXLPT FourStroke', description: 'Synthetic', features: ['Test'] };
    const expected = presentMcpMotor(source)!;
    const db = database([source]);
    const byId = await getMcpMotor(db.client, { id: source.id });
    const bySlug = await getMcpMotor(db.client, { slug: expected.slug });
    expect(byId).toEqual(bySlug);
    expect(byId).toMatchObject({ ...expected, commandThrust: true, description: 'Synthetic' });
    expect((await searchMcpMotors(db.client, { family: 'FourStroke' })).motors).toEqual([expected]);
    expect(String(db.calls.find(c => c[0] === 'select')?.[1])).toContain('shaft, shaft_code, control_type');
  });
  it('flags a truncated candidate window and keeps deterministic query ordering', async () => {
    const db = database(Array.from({ length: 501 }, (_, i) => ({ ...row, id: String(i) })));
    const result = await searchMcpMotors(db.client, { limit: 1 });
    expect(result).toMatchObject({ candidateLimit: 500, candidatePageTruncated: true });
    expect(result.motors).toHaveLength(1);
    expect(db.calls.filter(c => c[0] === 'order').map(c => c[1])).toEqual(['horsepower', 'id']);
    expect((await searchMcpMotors(database([row]).client, {})).candidatePageTruncated).toBe(false);
  });
  it.each([{ availability: 'Exclude' }, { family: 'Verado' }])('does not expose excluded motors %s', async (fields) => {
    expect(await getMcpMotor(database([{ ...row, ...fields }]).client, { id: row.id })).toBeNull();
  });
});
