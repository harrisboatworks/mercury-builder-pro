import {describe,it,expect} from 'vitest';
import {fetchHBWValuationFromInvoker,buildHBWReportUrl} from '@/lib/trade-valuation';
import {calculateQuotePricing} from '@/lib/quote-utils';
import {calculateQuoteFinancingEstimate} from '@/lib/quote-financing-estimate';
import {parseTradeInDraft,serializeTradeInDraft,isSupportedTradeInYear} from '@/lib/trade-in-state';
const input={brand:'Mercury',year:2020,horsepower:90,condition:'good' as const,stroke:'4-stroke' as const};
const payload={wholesale:5000,listing:6500,rangeLow:4250,rangeHigh:5750,confidence:'high',hstSavings:650,factors:[]};
describe('trade-in boundary evaluation',()=>{
 it.each([{wholesale:undefined},{wholesale:NaN},{wholesale:-1},{rangeLow:-20},{rangeLow:9000,rangeHigh:8000},{listing:Infinity}])('rejects malformed canonical response %j',async override=>{expect((await fetchHBWValuationFromInvoker(input,async()=>({error:null,data:{...payload,...override}}))).ok).toBe(false)});
 it('keeps explicit zero hours in the detailed report',()=>{expect(new URL(buildHBWReportUrl({brand:'Mercury',year:2020,hp:90,condition:'good',stroke:'4-stroke',hours:0})).searchParams.get('hours')).toBe('0')});
 it('does not create negative tax or totals when a trade exceeds the purchase',()=>{const p=calculateQuotePricing({motorMSRP:3000,motorDiscount:0,accessoryTotal:0,warrantyPrice:0,promotionalSavings:0,tradeInValue:8000});expect(p.subtotal).toBe(0);expect(p.tax).toBe(0);expect(p.total).toBe(0)});
 it('does not apply a disabled trade in financing previews',()=>{const p=calculateQuoteFinancingEstimate({motor:{msrp:10000,price:10000},purchasePath:'loose',tradeInInfo:{hasTradeIn:false,estimatedValue:5000}} as any);expect(p.pricing.subtotal).toBeGreaterThanOrEqual(10000)});
 it('rejects fractional manufacture years',()=>expect(isSupportedTradeInYear(2020.5,2026)).toBe(false));
 it('does not accept a fresh negative draft valuation',()=>{const x=parseTradeInDraft(serializeTradeInDraft({...input,hasTradeIn:true,model:'90 FourStroke',estimatedValue:-500,confidenceLevel:'high',serialNumber:''} as any,1000),2000);expect(x?.estimatedValue).toBe(0)});
});
