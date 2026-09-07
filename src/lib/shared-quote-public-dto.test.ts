import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildPublicQuoteData,
  buildPublicQuoteResponse,
  isSavedQuotePubliclyReadable,
} from '../../supabase/functions/get-shared-quote/public-quote';

const MIGRATION_PATH =
  'supabase/migrations/20260830211200_atomic_saved_quote_access.sql';

function collectKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, keys);
    return keys;
  }
  if (value === null || typeof value !== 'object') return keys;
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    keys.add(key);
    collectKeys(nested, keys);
  }
  return keys;
}

describe('public shared quote DTO', () => {
  it('fails closed on contact data, internal fields, serials and dealer cost', () => {
    const result = buildPublicQuoteData({
      customerName: 'Customer Name',
      customerEmail: 'private@example.test',
      customerPhone: '555-0100',
      customerNotes: 'Customer-facing note',
      adminNotes: 'Internal note',
      adminDiscount: 500,
      isAdminQuote: true,
      editingQuoteId: 'internal-id',
      conversationId: 'internal-conversation',
      unknownFutureField: { secret: true },
      motor: {
        id: 'motor-1',
        model: '150 Pro XS',
        hp: 150,
        msrp: 25000,
        dealerPrice: 17000,
        dealer_price: 17000,
      },
      boatInfo: {
        type: 'Fishing',
        make: 'Example',
        serialNumber: 'BOAT-SERIAL',
        tradeIn: {
          hasTradeIn: true,
          brand: 'Mercury',
          serialNumber: 'NESTED-TRADE-SERIAL',
          rangePrePenaltyLow: 1000,
          penaltyFactor: 0.8,
        },
      },
      tradeInInfo: {
        hasTradeIn: true,
        brand: 'Mercury',
        estimatedValue: 2500,
        engine_type: '4-stroke',
        engine_hours: 321,
        confidence: 'high',
        serialNumber: 'TRADE-SERIAL',
        valuationReportUrl: 'https://internal.example.test/report',
        rangeFinalHigh: 3000,
      },
      frozenPricing: {
        motorMSRP: 25000,
        adminDiscount: 500,
        total: 28000,
        adminNotes: 'nested internal note',
      },
      pdfSnapshot: {
        version: 1,
        createdAt: '2026-08-09T12:00:00.000Z',
        purchasePath: 'installed',
        customerNotes: 'Customer-facing note',
        customerEmail: 'private@example.test',
        motor: {
          model: '150 Pro XS',
          hp: 150,
          msrp: 25000,
          modelYear: 2026,
          category: 'Pro XS',
          imageUrl: '/motor.webp',
          dealerPrice: 17000,
        },
        pricing: {
          msrp: 25000,
          discount: 1000,
          adminDiscount: 500,
          promoValue: 0,
          motorSubtotal: 23500,
          subtotal: 24000,
          hst: 3120,
          totalCashPrice: 27120,
          savings: 1500,
          adminNotes: 'nested internal note',
        },
        accessoryBreakdown: [{ name: 'Propeller', price: 500, internalCost: 250 }],
      },
    });

    expect(result).toMatchObject({
      customerName: 'Customer Name',
      customerNotes: 'Customer-facing note',
      adminDiscount: 500,
      motor: { id: 'motor-1', model: '150 Pro XS', hp: 150, msrp: 25000 },
      boatInfo: {
        type: 'Fishing',
        make: 'Example',
        tradeIn: { hasTradeIn: true, brand: 'Mercury' },
      },
      tradeInInfo: {
        hasTradeIn: true,
        brand: 'Mercury',
        estimatedValue: 2500,
        engineType: '4-stroke',
        engineHours: 321,
        confidenceLevel: 'high',
      },
      frozenPricing: { motorMSRP: 25000, adminDiscount: 500, total: 28000 },
      pdfSnapshot: {
        version: 1,
        customerNotes: 'Customer-facing note',
        motor: { model: '150 Pro XS', modelYear: 2026, imageUrl: '/motor.webp' },
        pricing: { adminDiscount: 500, totalCashPrice: 27120 },
        accessoryBreakdown: [{ name: 'Propeller', price: 500 }],
      },
    });

    const publicKeys = [...collectKeys(result)];
    for (const forbidden of [
      'customerEmail', 'customerPhone', 'adminNotes', 'isAdminQuote', 'editingQuoteId',
      'serialNumber', 'dealerPrice', 'dealer_price', 'conversationId',
      'valuationReportUrl', 'rangePrePenaltyLow', 'rangeFinalHigh', 'penaltyFactor',
      'unknownFutureField', 'internalCost',
    ]) {
      expect(publicKeys).not.toContain(forbidden);
    }
    const serialized = JSON.stringify(result);
    for (const privateValue of [
      'private@example.test', '555-0100', 'Internal note', 'BOAT-SERIAL',
      'NESTED-TRADE-SERIAL', 'TRADE-SERIAL', 'internal.example.test',
    ]) {
      expect(serialized).not.toContain(privateValue);
    }
  });

  it('preserves legacy and agent quote shapes needed for customer-visible parity', () => {
    const result = buildPublicQuoteData({
      motorId: 'motor-2',
      motorModel: '90 ELPT',
      motorHp: 90,
      motorMsrp: 12000,
      motorPrice: 11000,
      selectedMotor: { id: 'motor-2', model: '90 ELPT', hp: 90, price: 11000 },
      purchasePath: 'installed',
      selectedPromoOption: 'cash_rebate',
      selectedPromoValue: 500,
      adminDiscount: 250,
      finalPrice: 14000,
      selectedOptions: [{ optionId: 'controls', name: 'Controls', price: 1200, isIncluded: false }],
      adminCustomItems: [{ name: 'Battery box', price: 0, internalCost: 99 }],
      accessoryBreakdown: [{ name: 'Installation', price: 450, category: 'installation' }],
      completedSteps: [1, 2, 'bad'],
      uiFlags: { motorOnlyExpress: false, unknown: 'drop-me' },
    });

    expect(result).toMatchObject({
      motorId: 'motor-2',
      motorModel: '90 ELPT',
      motorHp: 90,
      motorMsrp: 12000,
      motorPrice: 11000,
      selectedMotor: { id: 'motor-2', model: '90 ELPT', hp: 90, price: 11000 },
      purchasePath: 'installed',
      selectedPromoOption: 'cash_rebate',
      selectedPromoValue: 500,
      adminDiscount: 250,
      finalPrice: 14000,
      selectedOptions: [{ optionId: 'controls', name: 'Controls', price: 1200, isIncluded: false }],
      adminCustomItems: [{ name: 'Battery box', price: 0 }],
      accessoryBreakdown: [{ name: 'Installation', price: 450, category: 'installation' }],
      completedSteps: [1, 2],
      uiFlags: { motorOnlyExpress: false },
    });
  });

  it('allows only intentional, unexpired saved quotes', () => {
    const now = Date.parse('2026-08-09T12:00:00.000Z');
    expect(isSavedQuotePubliclyReadable({
      expires_at: '2026-08-10T12:00:00.000Z',
      is_soft_lead: false,
    }, now)).toBe(true);
    expect(isSavedQuotePubliclyReadable({
      expires_at: '2026-08-08T12:00:00.000Z',
      is_soft_lead: false,
    }, now)).toBe(false);
    expect(isSavedQuotePubliclyReadable({
      expires_at: '2026-08-10T12:00:00.000Z',
      is_soft_lead: true,
    }, now)).toBe(false);
    expect(isSavedQuotePubliclyReadable({ is_soft_lead: false }, now)).toBe(false);
  });

  it('uses the same minimal response contract for customer quote fallbacks', () => {
    const response = buildPublicQuoteResponse({
      id: 'quote-id',
      quoteData: {
        motor: { id: 'motor-1', model: '115 Pro XS', dealerPrice: 9999 },
        customerEmail: 'private@example.test',
        customerNotes: 'Embedded note',
        isAdminQuote: true,
      },
      customerName: 'Customer Name',
      customerNotes: 'Column note',
    });

    expect(response).toEqual({
      id: 'quote-id',
      quote_data: {
        motor: { id: 'motor-1', model: '115 Pro XS' },
        customerNotes: 'Embedded note',
      },
      customer_name: 'Customer Name',
      customer_notes: 'Column note',
    });
    expect(response).not.toHaveProperty('is_admin_quote');
  });
});

describe('shared quote boundary source contract', () => {
  it('keeps the edge and browser consumers fail closed on errors and edit state', () => {
    const edgeSource = readFileSync(
      resolve(process.cwd(), 'supabase/functions/get-shared-quote/index.ts'),
      'utf8',
    );
    const pageSource = readFileSync(
      resolve(process.cwd(), 'src/pages/quote/SavedQuotePage.tsx'),
      'utf8',
    );
    const financingSource = readFileSync(
      resolve(process.cwd(), 'src/pages/financing/FinancingFromQuote.tsx'),
      'utf8',
    );
    const migration = readFileSync(
      resolve(process.cwd(), MIGRATION_PATH),
      'utf8',
    );

    expect(edgeSource).toContain('buildPublicQuoteResponse');
    expect(edgeSource).toContain('isSavedQuotePubliclyReadable');
    expect(edgeSource).toContain('increment_saved_quote_access');
    expect(edgeSource).toContain('.select("id, quote_state, expires_at, is_soft_lead")');
    expect(edgeSource).toContain('.maybeSingle()');
    expect(edgeSource).toContain('if (savedError) throw savedError');
    expect(edgeSource).toContain('if (error) throw error');
    expect(edgeSource).not.toContain('...safeQuoteData');
    expect(edgeSource).not.toContain('is_admin_quote');
    expect(edgeSource).toContain('JSON.stringify({ error: "Internal server error" })');

    const savedErrorGuard = edgeSource.indexOf('if (savedError) throw savedError');
    const savedQuoteBranch = edgeSource.indexOf('if (savedQuote)');
    const customerQuoteFallback = edgeSource.indexOf('.from("customer_quotes")');
    const customerErrorGuard = edgeSource.indexOf('if (error) throw error');
    const customerNotFound = edgeSource.indexOf('if (!quote)');
    expect(savedErrorGuard).toBeGreaterThan(-1);
    expect(savedErrorGuard).toBeLessThan(savedQuoteBranch);
    expect(savedQuoteBranch).toBeLessThan(customerQuoteFallback);
    expect(customerQuoteFallback).toBeLessThan(customerErrorGuard);
    expect(customerErrorGuard).toBeLessThan(customerNotFound);

    expect(pageSource).not.toContain("type: 'SET_ADMIN_MODE'");
    expect(pageSource).not.toContain('quote.is_admin_quote');
    expect(pageSource).toContain("customerEmail: ''");
    expect(pageSource).toContain("customerPhone: ''");
    expect(pageSource).toContain('isAdminQuote: false');
    expect(pageSource).toContain('editingQuoteId: null');
    expect(financingSource).toContain('state: { savedQuoteState: result.quote_data }');
    expect(financingSource).not.toContain('result.customer_email');
    expect(financingSource).not.toContain('result.customer_phone');
    expect(migration).toContain('access_count = COALESCE(access_count, 0) + 1');
    expect(migration).toContain('SECURITY DEFINER');
    expect(migration).toContain("SET search_path = ''");
    expect(migration).toContain('COALESCE(is_soft_lead, false) = false');
    expect(migration).toContain('expires_at > now()');
    expect(migration).toContain('REVOKE ALL ON FUNCTION public.increment_saved_quote_access(uuid) FROM PUBLIC');
    expect(migration).toContain('REVOKE ALL ON FUNCTION public.increment_saved_quote_access(uuid) FROM anon');
    expect(migration).toContain('REVOKE ALL ON FUNCTION public.increment_saved_quote_access(uuid) FROM authenticated');
    expect(migration).toContain('GRANT EXECUTE ON FUNCTION public.increment_saved_quote_access(uuid) TO service_role');
  });
});
