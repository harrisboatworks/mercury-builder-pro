import {describe,expect,it} from 'vitest';
import {getAppliedPromotionWarrantyYears} from '../../../supabase/functions/_shared/promotion-warranty';
import {getAppliedPromotion,getAppliedWarrantyExtraYears} from '@/lib/warranty-display';
import {calculateMercuryPlatinumCoverageCost} from '@/data/mercuryProductProtection';
import {calculateMercuryPlatinumCoverageCost as edgePrice} from '../../../supabase/functions/_shared/mercury-platinum-coverage';

describe('applied promotion warranty parity',()=>{
  it.each([{promotions:[{warranty_extra_years:2},{warranty_extra_years:2}]},{promotions:[{warranty_extra_years:2},{warranty_extra_years:4}]}])('never stacks overlapping Gold promotions',({promotions})=>{
    const quoteYears=getAppliedWarrantyExtraYears(getAppliedPromotion(promotions));
    const apiYears=getAppliedPromotionWarrantyYears(promotions);
    expect(quoteYears).toBe(2);
    expect(apiYears).toBe(quoteYears);
    expect(calculateMercuryPlatinumCoverageCost(60,3+quoteYears,8)?.totalPrice).toBe(1057);
    expect(edgePrice(60,3+apiYears,8)?.totalPrice).toBe(1057);
  });
  it('uses the applied first offer even when a lower-priority offer has warranty years',()=>{
    const promotions=[{warranty_extra_years:0},{warranty_extra_years:2}];
    expect(getAppliedPromotionWarrantyYears(promotions)).toBe(0);
    expect(getAppliedWarrantyExtraYears(getAppliedPromotion(promotions))).toBe(0);
  });
});
