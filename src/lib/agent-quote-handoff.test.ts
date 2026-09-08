// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { BoatInfo } from '@/components/QuoteBuilder';
import { initialState, quoteReducer, type QuoteState } from '@/contexts/QuoteContext';
import {
  applyAgentQuoteHandoff,
  buildAgentQuoteHandoffActions,
  canOpenMotorFromHandoff,
  parseAgentQuoteHandoff,
  parseTradeHpParam,
  parseTradeYearParam,
  stripConsumedAgentQuoteHandoffParams,
  UCP_CHECKOUT_REF_FLAG,
} from './agent-quote-handoff';

const CURRENT_YEAR = 2026;

const existingBoat = (overrides: Partial<BoatInfo> = {}): BoatInfo => ({
  type: 'utility',
  make: 'Crestliner',
  model: '1600',
  length: '16',
  currentMotorBrand: 'Yamaha',
  currentHp: 90,
  currentMotorYear: 2018,
  serialNumber: '',
  controlType: 'side-mount-external',
  shaftLength: '20',
  ...overrides,
});

describe('parseAgentQuoteHandoff', () => {
  it('parses the documented /agents quote fields', () => {
    const parsed = parseAgentQuoteHandoff(new URLSearchParams({
      motor: 'motor-123',
      boat_make: 'Lund',
      boat_model: 'Pro-V',
      trade_brand: 'mercury',
      trade_year: '2010',
      trade_hp: '75',
      ucp: 'chk_abc-123',
    }), CURRENT_YEAR);

    expect(parsed).toEqual({
      motorId: 'motor-123',
      boatMake: 'Lund',
      boatModel: 'Pro-V',
      tradeBrand: 'Mercury',
      tradeYear: 2010,
      tradeHp: 75,
      ucpCheckoutRef: 'chk_abc-123',
    });
    expect(parseAgentQuoteHandoff(new URLSearchParams({
      select: 'alt-motor',
    }), CURRENT_YEAR).motorId).toBe('alt-motor');
  });

  it('treats empty params as absent', () => {
    expect(parseAgentQuoteHandoff(new URLSearchParams({
      boat_make: '   ',
      boat_model: '',
      trade_brand: '',
      trade_year: '',
      trade_hp: '',
      motor: '',
      ucp: '',
    }), CURRENT_YEAR)).toEqual({});
  });

  it('rejects malformed numeric params', () => {
    expect(parseTradeYearParam('2010.5', CURRENT_YEAR)).toBeUndefined();
    expect(parseTradeYearParam('abc', CURRENT_YEAR)).toBeUndefined();
    expect(parseTradeYearParam('1800', CURRENT_YEAR)).toBeUndefined();
    expect(parseTradeYearParam('2027', CURRENT_YEAR)).toBeUndefined();
    expect(parseTradeHpParam('75abc')).toBeUndefined();
    expect(parseTradeHpParam('-10')).toBeUndefined();
    expect(parseTradeHpParam('1e2')).toBeUndefined();
    expect(parseTradeHpParam('900')).toBeUndefined();

    expect(parseAgentQuoteHandoff(new URLSearchParams({
      trade_year: '2010.5',
      trade_hp: '75abc',
    }), CURRENT_YEAR)).toEqual({});
  });

  it('rejects long and control-character strings', () => {
    const longMake = 'L'.repeat(81);
    const parsed = parseAgentQuoteHandoff(new URLSearchParams({
      boat_make: `Lund\u0000Works`,
      boat_model: `Pro-V\u0007`,
      trade_brand: `Mercury\u001F`,
      motor: `id\u007F`,
      ucp: 'chk\nsecret',
    }), CURRENT_YEAR);

    expect(parsed).toEqual({});
    expect(parseAgentQuoteHandoff(new URLSearchParams({
      boat_make: longMake,
    }), CURRENT_YEAR)).toEqual({});
  });

  it('does not invent missing year, condition, or trade values', () => {
    const parsed = parseAgentQuoteHandoff(new URLSearchParams({
      trade_brand: 'Yamaha',
    }), CURRENT_YEAR);

    expect(parsed.tradeBrand).toBe('Yamaha');
    expect(parsed.tradeYear).toBeUndefined();
    expect(parsed.tradeHp).toBeUndefined();
    expect(parsed).not.toHaveProperty('condition');
    expect(parsed).not.toHaveProperty('estimatedValue');
  });
});

describe('applyAgentQuoteHandoff reducer', () => {
  it('prefills BoatInfo and TradeInInfo field names without completing the quote', () => {
    const handoff = parseAgentQuoteHandoff(new URLSearchParams({
      boat_make: 'Lund',
      boat_model: 'Pro-V',
      trade_brand: 'Mercury',
      trade_year: '2010',
      trade_hp: '9.9',
      ucp: 'session_opaque_1',
    }), CURRENT_YEAR);

    const next = applyAgentQuoteHandoff(initialState, quoteReducer, handoff);

    expect(next.boatInfo).toMatchObject({
      type: '',
      make: 'Lund',
      model: 'Pro-V',
      currentMotorBrand: 'Mercury',
      currentMotorYear: 2010,
      currentHp: 9.9,
    });
    expect(next.tradeInInfo).toMatchObject({
      hasTradeIn: true,
      brand: 'Mercury',
      year: 2010,
      horsepower: 9.9,
      estimatedValue: 0,
    });
    expect(next.tradeInInfo.condition).toBeUndefined();
    expect(next.hasTradein).toBe(true);
    expect(next.completedSteps).toEqual([]);
    expect(next.frozenPricing).toBeUndefined();
    expect(next.uiFlags[UCP_CHECKOUT_REF_FLAG]).toBe('session_opaque_1');
    expect(buildAgentQuoteHandoffActions(initialState, handoff).map((action) => action.type))
      .toEqual(['SET_BOAT_INFO', 'PROMOTE_TRADE_IN', 'SET_UI_FLAG']);
  });

  it('preserves existing entered values when a parameter is absent', () => {
    const state: QuoteState = {
      ...initialState,
      isLoading: false,
      boatInfo: existingBoat(),
      tradeInInfo: {
        hasTradeIn: true,
        brand: 'Honda',
        year: 2012,
        horsepower: 60,
        model: 'BF60',
        serialNumber: '',
        condition: 'good',
        estimatedValue: 1800,
        confidenceLevel: 'medium',
      },
      completedSteps: [1],
      hasTradein: false,
    };

    const next = applyAgentQuoteHandoff(
      state,
      quoteReducer,
      parseAgentQuoteHandoff(new URLSearchParams({
        boat_make: 'Lund',
        trade_hp: '115',
      }), CURRENT_YEAR),
    );

    expect(next.boatInfo).toMatchObject({
      make: 'Lund',
      model: '1600',
      currentMotorBrand: 'Yamaha',
      currentMotorYear: 2018,
      currentHp: 90,
    });
    expect(next.tradeInInfo).toMatchObject({
      brand: 'Honda',
      year: 2012,
      horsepower: 115,
      model: 'BF60',
      condition: 'good',
      estimatedValue: 0,
    });
    expect(next.completedSteps).toEqual([1]);
    expect(next.hasTradein).toBe(true);
  });

  it('does not apply boat or trade fields on the express motor-only path', () => {
    const handoff = parseAgentQuoteHandoff(new URLSearchParams({
      boat_make: 'Lund',
      trade_brand: 'Mercury',
      ucp: 'ucp_express_1',
    }), CURRENT_YEAR);

    const next = applyAgentQuoteHandoff(initialState, quoteReducer, handoff, {
      skipBoatAndTrade: true,
    });

    expect(next.boatInfo).toBeNull();
    expect(next.tradeInInfo).toBeNull();
    expect(next.uiFlags[UCP_CHECKOUT_REF_FLAG]).toBe('ucp_express_1');
  });

  it('does not select a motor or invent trusted pricing from the URL', () => {
    const handoff = parseAgentQuoteHandoff(new URLSearchParams({
      motor: 'e920cfdf-223a-408a-850b-6f112e15c4d7',
      boat_make: 'Lund',
    }), CURRENT_YEAR);

    const actions = buildAgentQuoteHandoffActions(initialState, handoff);
    const next = applyAgentQuoteHandoff(initialState, quoteReducer, handoff);

    expect(handoff.motorId).toBe('e920cfdf-223a-408a-850b-6f112e15c4d7');
    expect(actions.some((action) => action.type === 'SET_MOTOR' || action.type === 'START_MOTOR_ONLY_QUOTE' || action.type === 'COMPLETE_STEP')).toBe(false);
    expect(next.motor).toBeNull();
    expect(next.purchasePath).toBeNull();
    expect(canOpenMotorFromHandoff(handoff.motorId, false)).toBe(false);
    expect(canOpenMotorFromHandoff(handoff.motorId, true)).toBe(true);
  });
});

describe('stripConsumedAgentQuoteHandoffParams', () => {
  it('removes only consumed valid params and retains unrelated ones', () => {
    const params = new URLSearchParams([
      ['motor', 'motor-123'],
      ['boat_make', 'Lund'],
      ['boat_model', ''],
      ['trade_brand', 'NotABrand'],
      ['trade_year', '2010.5'],
      ['trade_hp', '75'],
      ['ucp', 'chk_keep'],
      ['utm_source', 'agent'],
      ['intent', 'motor-only'],
      ['q', '115'],
    ]);
    const handoff = parseAgentQuoteHandoff(params, CURRENT_YEAR);
    const stripped = stripConsumedAgentQuoteHandoffParams(params, handoff);

    expect(handoff.boatMake).toBe('Lund');
    expect(handoff.tradeHp).toBe(75);
    expect(handoff.tradeBrand).toBeUndefined();
    expect(handoff.tradeYear).toBeUndefined();
    expect(stripped.get('motor')).toBe('motor-123');
    expect(stripped.get('boat_make')).toBeNull();
    expect(stripped.get('boat_model')).toBe('');
    expect(stripped.get('trade_brand')).toBe('NotABrand');
    expect(stripped.get('trade_year')).toBe('2010.5');
    expect(stripped.get('trade_hp')).toBeNull();
    expect(stripped.get('ucp')).toBe('chk_keep');
    expect(stripped.get('utm_source')).toBe('agent');
    expect(stripped.get('intent')).toBe('motor-only');
    expect(stripped.get('q')).toBe('115');
  });
});
