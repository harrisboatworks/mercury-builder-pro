import { describe, expect, it } from 'vitest';
import { frozenPricingFromPdfSnapshot, hasCompleteFrozenQuoteSnapshot, isQuotePdfSnapshot, type QuotePdfSnapshot } from '../quote-pdf-data';
const snapshot: QuotePdfSnapshot = {
 version:1,createdAt:'2026-10-13T12:00:00Z',validUntil:'2026-10-30',
 motor:{model:'9.9 MH FourStroke',hp:9.9,msrp:3860,modelYear:2026,category:'FourStroke'},
 pricing:{msrp:3860,discount:861,adminDiscount:0,promoValue:300,motorSubtotal:2699,subtotal:2699,hst:350.87,totalCashPrice:3049.87,savings:1161},
 accessoryBreakdown:[],purchasePath:'loose',includedCoverageYears:5,paymentMethod:'cash_purchase',
 promotion:{name:'Synthetic recorded offer',endDate:'2026-10-30',combinationMode:'layered'},
};
describe('recorded quote readiness during promotion outage',()=>{
 it('accepts complete corresponding recorded terms',()=>expect(hasCompleteFrozenQuoteSnapshot(frozenPricingFromPdfSnapshot(snapshot),snapshot)).toBe(true));
 it('rejects a shallow-pass partial snapshot or partial frozen pricing',()=>{
  const partial={version:1,createdAt:snapshot.createdAt,validUntil:snapshot.validUntil,motor:{model:snapshot.motor.model},pricing:{totalCashPrice:3049.87},accessoryBreakdown:[]};
  expect(isQuotePdfSnapshot(partial)).toBe(true);
  expect(hasCompleteFrozenQuoteSnapshot({total:3049.87},partial)).toBe(false);
  expect(hasCompleteFrozenQuoteSnapshot({total:3049.87},snapshot)).toBe(false);
 });
 it('rejects mismatched or unreconciled monetary records',()=>{
  expect(hasCompleteFrozenQuoteSnapshot({...frozenPricingFromPdfSnapshot(snapshot),promoSavings:0},snapshot)).toBe(false);
  const wrong={...snapshot,pricing:{...snapshot.pricing,hst:389.87}};
  expect(hasCompleteFrozenQuoteSnapshot(frozenPricingFromPdfSnapshot(wrong),wrong)).toBe(false);
 });
 it('requires recorded coverage and deadline correspondence',()=>{
  const endOnly={...snapshot,validUntil:undefined};
  expect(hasCompleteFrozenQuoteSnapshot(frozenPricingFromPdfSnapshot(endOnly),endOnly)).toBe(false);
  const noCoverage={...snapshot,includedCoverageYears:undefined};
  expect(hasCompleteFrozenQuoteSnapshot(frozenPricingFromPdfSnapshot(noCoverage),noCoverage)).toBe(false);
  expect(hasCompleteFrozenQuoteSnapshot({...frozenPricingFromPdfSnapshot(snapshot),quoteExpiryDate:'2026-11-30'},snapshot)).toBe(false);
  expect(hasCompleteFrozenQuoteSnapshot({...frozenPricingFromPdfSnapshot(snapshot),quoteExpiryDate:'2026-10-31T03:59:59.999Z'},snapshot)).toBe(true);
 });
 it('does not substitute different promotion metadata',()=>expect(hasCompleteFrozenQuoteSnapshot({...frozenPricingFromPdfSnapshot(snapshot),promotionEndDate:'2026-11-30'},snapshot)).toBe(false));
});
