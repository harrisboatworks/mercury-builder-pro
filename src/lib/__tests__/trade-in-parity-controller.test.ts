import {initialState,quoteReducer} from '@/contexts/QuoteContext';
import {calculateRunningTotal} from '@/hooks/useQuoteRunningTotal';
import {calculateQuotePricing} from '@/lib/quote-utils';
import {describe,it,expect} from 'vitest';
import {parseCanonicalHbwValuation,normalizeHbwStroke} from '@/lib/hbw-valuation-response';
import {resolveTradeInInput,isPresentTradeIn} from '@/lib/trade-in-input';
import {parseTradeInDraft,serializeTradeInDraft} from '@/lib/trade-in-state';
import {isUsableVoiceTradeInCard,estimateVoiceTradeIn} from '@/lib/voice-trade-in';
import {calculateFinancingPurchase,financingAmountToFinance,financingPurchaseFromQuote,financingPurchaseFromLink} from '@/lib/financing-purchase';
import {fetchHBWValuationFromInvoker} from '@/lib/trade-valuation';
const payload={wholesale:5000,listing:6500,rangeLow:4250,rangeHigh:5750,confidence:'high',hstSavings:650};
const trade={hasTradeIn:true,brand:'Mercury',year:2020,horsepower:90,condition:'good',engineType:'4-stroke',estimatedValue:5000};
describe('controller parity and adversarial cases',()=>{
 it.each([{listingRangeLow:7000,listingRangeHigh:6000},{rangeLow:5100},{rangeHigh:4900},{listingRangeHigh:Infinity}])('rejects inconsistent canonical money %j',change=>expect(parseCanonicalHbwValuation({...payload,...change})).toBeNull());
 it.each([['E-TEC','etec'],['Pro XS','proxs'],['Opti Max','optimax']])('normalizes %s consistently', (input,want)=>expect(normalizeHbwStroke(input)).toBe(want));
 it.each([{engine_hours:-1},{engine_hours:'many'},{horsepower:'bad',model:'90 FourStroke'},{year:new Date().getFullYear()+1},{horsepower:99999}])('rejects invalid trade details %j',change=>expect(()=>resolveTradeInInput({...trade,...change})).toThrow());
 it('does not silently ignore a non-object trade payload',()=>{for(const value of ['bad',[],false,0]){expect(isPresentTradeIn(value)).toBe(true);expect(()=>resolveTradeInInput(value)).toThrow()}});
 it('dates a legacy estimate once so repeated autosaves cannot refresh it',()=>{const first=parseTradeInDraft(serializeTradeInDraft(trade as any,1000),2000)!;expect(first.valuedAt).toBe(1000);const later=parseTradeInDraft(serializeTradeInDraft(first as any,30*60_000),31*60_000);expect(later?.estimatedValue).toBe(0)});
 it('discards a future-dated valuation while preserving inputs',()=>{const restored=parseTradeInDraft(serializeTradeInDraft({...trade,valuedAt:3000} as any,1000),2000);expect(restored?.estimatedValue).toBe(0);expect(restored?.horsepower).toBe(90)});
 it('keeps canonical version and report metadata through the browser adapter',async()=>{const result=await fetchHBWValuationFromInvoker({brand:'Mercury',year:2020,horsepower:90,condition:'good',stroke:'4-stroke'},async()=>({error:null,data:{...payload,engineVersion:'synthetic-version',referenceDataVersion:'synthetic-reference',reportUrl:'https://valuation.mercuryrepower.ca/?hours=0'}}));expect(result.ok).toBe(true);if(result.ok)expect(result.value).toMatchObject({average:5000,engineVersion:'synthetic-version',referenceVersion:'synthetic-reference',reportUrl:'https://valuation.mercuryrepower.ca/?hours=0'})});
 it('rejects future voice cards and non-finite ranges',()=>{const card={...trade,wholesale:5000,valueRange:{low:4250,high:5750},architecture:'4-stroke',confidenceLevel:'high',valuedAt:Date.now()};expect(isUsableVoiceTradeInCard(card as any)).toBe(true);expect(isUsableVoiceTradeInCard({...card,valuedAt:Date.now()+60000} as any)).toBe(false);expect(isUsableVoiceTradeInCard({...card,valueRange:{low:NaN,high:5750}} as any)).toBe(false)});
 it('rejects invalid hours before voice calls the provider',async()=>{let calls=0;const result=await estimateVoiceTradeIn({brand:'Mercury',year:2020,horsepower:90,condition:'good',engine_type:'4-stroke',hours:-1},async()=>{calls++;throw Error('unexpected')});expect(result.ok).toBe(false);expect(calls).toBe(0)});
});
describe('financing handoff parity',()=>{
 it('preserves estimate separately from capped credit',()=>{const p=calculateFinancingPurchase({preTradeSubtotal:3000,estimatedValue:8000});expect(p.tradeEstimate).toBe(8000);expect(p.tradeInValue).toBe(3000);expect(p.motorPrice).toBe(0)});
 it('recalculates edited trade with HST and applies down payment afterwards',()=>{expect(financingAmountToFinance(9660.2,1000,3125,'all_in_after_trade',{includedTradeInValue:4125,preTradeSubtotal:12365})).toBeCloseTo(9790.2,2)});
 it('caps an edited trade without consuming the financing fee',()=>expect(financingAmountToFinance(9660.2,0,99999,'all_in_after_trade',{includedTradeInValue:4125,preTradeSubtotal:12365})).toBeCloseTo(349,2));
 it('restores frozen after-trade totals despite changed live motor price',()=>{const p=financingPurchaseFromQuote({motor:{msrp:99999,price:99999},tradeInInfo:{...trade,estimatedValue:4125},frozenPricing:{motorMSRP:12365,motorDiscount:0,adminDiscount:0,promoSavings:0,subtotal:8240,hst:1071.2,total:9311.2,appliedTradeCredit:4125}});expect(p.amountToFinance).toBeCloseTo(9660.2,2);expect(p.includedTradeInValue).toBe(4125)});
 it('repairs the old quote_state handoff from its correct net subtotal',()=>{const p=financingPurchaseFromQuote({motor:{msrp:12365,price:12365},tradeInInfo:{...trade,estimatedValue:4125},financingAmount:{packageSubtotal:8240,totalWithFees:14321.45,tradeInValue:4125}});expect(p.amountToFinance).toBeCloseTo(9660.2,2)});
 it.each([{price:12365,allInPrice:false},{price:14321.45,allInPrice:true},{price:9660.2,allInPrice:true,priceBasis:'all_in_after_trade'}])('legacy and explicit link bases yield the same amount %j',input=>expect(financingPurchaseFromLink({...input,tradeInValue:4125}).amountToFinance).toBeCloseTo(9660.2,2));
});

describe('running bar and summary use the same credit basis',()=>{
 it.each([0,3000,8000])('matches with discounts, custom items and trade %s',tradeInValue=>{
 const running=calculateRunningTotal({price:3000,model:'90 FourStroke',hp:90},{adminCustomItems:[{name:'Custom',price:1000}],adminDiscount:100,getRebateForHP:()=>200,tradeInValue,hasTradeIn:true});
 const summary=calculateQuotePricing({motorMSRP:3000,motorDiscount:0,adminDiscount:100,accessoryTotal:1000,warrantyPrice:0,promotionalSavings:200,tradeInValue});
 expect(running.subtotal).toBe(summary.subtotal);expect(running.hst).toBe(summary.tax);expect(running.appliedTradeCredit).toBe(summary.appliedTradeCredit);
 });
});

describe('saved quote trade changes',()=>{
 const state={...initialState,hasTradein:true,tradeInInfo:trade,frozenPricing:{subtotal:8240,total:9311.2},pdfSnapshot:{id:'synthetic'}} as any;
 it('retains snapshots when identical details are restored',()=>{const next=quoteReducer(state,{type:'SET_TRADE_IN_INFO',payload:{...trade}});expect(next.frozenPricing).toBe(state.frozenPricing)});
 it('invalidates frozen totals and synchronizes flags when a trade changes',()=>{const next=quoteReducer(state,{type:'SET_TRADE_IN_INFO',payload:{...trade,hasTradeIn:false,estimatedValue:0}});expect(next.frozenPricing).toBeUndefined();expect(next.pdfSnapshot).toBeUndefined();expect(next.hasTradein).toBe(false)});
 it('removing trade clears its value and saved totals',()=>{const next=quoteReducer(state,{type:'SET_HAS_TRADEIN',payload:false});expect(next.tradeInInfo.estimatedValue).toBe(0);expect(next.tradeInInfo.hasTradeIn).toBe(false);expect(next.frozenPricing).toBeUndefined()});
 it('retains an explicitly saved applied credit without needing the old estimate',()=>{const p=financingPurchaseFromQuote({financingAmount:{packageSubtotal:8240,totalWithFees:9660.2,priceBasis:'all_in_after_trade',includedTradeInValue:4125,preTradeSubtotal:12365}});expect(p.includedTradeInValue).toBe(4125);expect(p.amountToFinance).toBeCloseTo(9660.2,2)});
 it('handles a pre-tax legacy price with after-trade metadata',()=>{expect(financingPurchaseFromLink({price:8240,allInPrice:false,priceBasis:'all_in_after_trade',tradeInValue:4125}).amountToFinance).toBeCloseTo(9660.2,2)});
});
