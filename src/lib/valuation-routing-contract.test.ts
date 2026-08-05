import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('canonical valuation routing contract', () => {
  it('routes all Edge Function valuation callers through the shared HBW adapter', () => {
    const agentApi = source('supabase/functions/agent-quote-api/index.ts');
    const publicApi = source('supabase/functions/public-quote-api/index.ts');
    const browserProxy = source('supabase/functions/hbw-valuation-proxy/index.ts');

    for (const runtime of [agentApi, publicApi, browserProxy]) {
      expect(runtime).toContain('fetchCanonicalHbwValuation');
      expect(runtime).not.toContain('trade_valuation_brackets');
      expect(runtime).not.toContain('trade_valuation_config');
      expect(runtime).not.toContain('runTradeEstimate');
      expect(runtime).not.toContain('ballparkTradeValue');
    }
  });

  it('fails closed on invalid or conflicting stroke input', () => {
    const adapter = source('supabase/functions/_shared/hbw-valuation.ts');
    const decoder = source('src/components/quote-builder/tradeInModelDecoder.ts');
    const form = source('src/components/quote-builder/TradeInValuation.tsx');

    expect(adapter).toContain('invalid_stroke');
    expect(adapter).toContain('stroke_model_conflict');
    expect(adapter).toContain('compact === "2stroke"');
    expect(adapter).not.toContain('return "4-stroke"; // default');
    expect(decoder).not.toContain('year >= 2007');
    expect(decoder).not.toContain("result.stroke = '4-Stroke';\n      result.strokeConfidence = 'medium'");
    expect(form).toContain('requiresStrokeConfirmation');
    expect(form).toContain('stroke: effectiveEngineType');
    expect(form).not.toContain('stroke: tradeInInfo.engineType');
  });

  it('keeps an explicit agent override usable only across upstream outages', () => {
    const agentApi = source('supabase/functions/agent-quote-api/index.ts');

    expect(agentApi).toContain('manual_override_without_canonical_readback');
    expect(agentApi).toContain('error.status < 500');
    expect(agentApi).toContain('originalEstimate: formulaEstimate');
  });

  it('does not ship a second browser valuation engine', () => {
    const client = source('src/lib/trade-valuation.ts');
    const quoteDisplay = source('src/components/quote-builder/QuoteDisplay.tsx');

    expect(client).not.toContain('fallbackTradeValues');
    expect(client).not.toContain('estimateTradeValue');
    expect(quoteDisplay).not.toContain('estimateTradeValue');
  });
});
