import { describe, expect, it } from 'vitest';
import { buildQuotePdfFinancing, frozenPricingFromPdfSnapshot, hasCompleteFrozenQuoteSnapshot, isQuotePdfSnapshot, type QuotePdfSnapshot } from '../quote-pdf-data';
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
 it('requires payment and campaign metadata instead of treating paired omissions as complete',()=>{
  const missing={...snapshot,promotion:undefined,paymentMethod:undefined};
  expect(isQuotePdfSnapshot(missing)).toBe(true);
  expect(hasCompleteFrozenQuoteSnapshot(frozenPricingFromPdfSnapshot(missing),missing)).toBe(false);
  const noPromo={...snapshot,promotion:undefined};
  expect(hasCompleteFrozenQuoteSnapshot(frozenPricingFromPdfSnapshot(noPromo),noPromo)).toBe(false);
 });
 it('requires the same recorded trade credit as the reconciled snapshot',()=>{
  const trade={...snapshot,tradeInValue:100,pricing:{...snapshot.pricing,subtotal:2599,hst:337.87,totalCashPrice:2936.87}};
  const frozen=frozenPricingFromPdfSnapshot(trade);
  expect(hasCompleteFrozenQuoteSnapshot(frozen,trade)).toBe(true);
  expect(hasCompleteFrozenQuoteSnapshot({...frozen,appliedTradeCredit:200},trade)).toBe(false);
 });
 it.each(['standard_financing','special_financing'] as const)('requires complete financing terms for %s',paymentMethod=>{
  const missing={...snapshot,paymentMethod};
  expect(hasCompleteFrozenQuoteSnapshot(frozenPricingFromPdfSnapshot(missing),missing)).toBe(false);
  const complete={...missing,financing:buildQuotePdfFinancing({amountFinanced:3049.87,rate:7.99,amortizationMonths:60,paymentMethod,dealerFee:0,downPayment:0})};
  expect(hasCompleteFrozenQuoteSnapshot(frozenPricingFromPdfSnapshot(complete),complete)).toBe(true);
  const noDown={...complete,financing:{...complete.financing,downPayment:undefined}};
  expect(hasCompleteFrozenQuoteSnapshot(frozenPricingFromPdfSnapshot(noDown as QuotePdfSnapshot),noDown)).toBe(false);
 });
 it('does not substitute different promotion metadata',()=>expect(hasCompleteFrozenQuoteSnapshot({...frozenPricingFromPdfSnapshot(snapshot),promotionEndDate:'2026-11-30'},snapshot)).toBe(false));
 it.each([
  ['amountFinanced',0],['amountFinanced',-1],
  ['amortizationMonths',0],['amortizationMonths',-1],
  ['contractTermMonths',0],['contractTermMonths',-1],
  ['rate',-1],['dealerFee',-1],['downPayment',-1],
 ] as const)('rejects invalid recorded loan term %s=%s',(key,value)=>{
  const financing=buildQuotePdfFinancing({amountFinanced:3049.87,rate:7.99,amortizationMonths:60,paymentMethod:'standard_financing',dealerFee:0,downPayment:0});
  const invalid={...snapshot,paymentMethod:'standard_financing' as const,financing:{...financing,[key]:value}};
  expect(hasCompleteFrozenQuoteSnapshot(frozenPricingFromPdfSnapshot(invalid),invalid)).toBe(false);
 });
 it('accepts a fully recorded zero APR loan',()=>{
  const financing=buildQuotePdfFinancing({amountFinanced:3049.87,rate:0,amortizationMonths:60,paymentMethod:'standard_financing',dealerFee:0,downPayment:0});
  const complete={...snapshot,paymentMethod:'standard_financing' as const,financing};
  expect(hasCompleteFrozenQuoteSnapshot(frozenPricingFromPdfSnapshot(complete),complete)).toBe(true);
 });
 it('reconciles the loan principal with cash total, fee and down payment',()=>{
  const financing=buildQuotePdfFinancing({amountFinanced:2898.87,rate:7.99,amortizationMonths:60,paymentMethod:'standard_financing',dealerFee:349,downPayment:500});
  const complete={...snapshot,paymentMethod:'standard_financing' as const,financing};
  expect(hasCompleteFrozenQuoteSnapshot(frozenPricingFromPdfSnapshot(complete),complete)).toBe(true);
  const contradictory={...complete,financing:buildQuotePdfFinancing({...financing,amountFinanced:100,paymentMethod:'standard_financing'})};
  expect(hasCompleteFrozenQuoteSnapshot(frozenPricingFromPdfSnapshot(contradictory),contradictory)).toBe(false);
 });
});
