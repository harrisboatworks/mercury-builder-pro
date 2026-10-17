import { describe, expect, it } from 'vitest';
import { getPlatinumQuoteOptions, reconcileWarrantyConfig, createBaselineWarrantyConfig } from '@/lib/quote-product-protection';
import { calculateQuotePricing, getFinanceableAmount, calculateWarrantyExtensionCost } from '@/lib/quote-utils';
import { calculateMonthlyPayment } from '@/lib/finance';
import { buildAccessoryBreakdown } from '@/lib/build-accessory-breakdown';

// Independent expectations taken from the Canadian MSRP calculator, October 17.
const bands = [
  [2.5, [19,33,47,59,70], [76,137,194,247,293]],
  [15, [42,77,110,138,164], [178,319,454,576,684]],
  [60, [85,153,218,275,328], [355,639,904,1149,1365]],
  [115, [129,233,330,420,498], [539,971,1376,1748,2077]],
  [150, [181,325,461,585,696], [753,1357,1921,2442,2900]],
  [250, [434,782,1107,1406,1671], [1809,3256,4612,5861,6964]],
  [300, [619,1115,1580,2007,2384], [2580,4644,6579,8358,9932]],
  [400, [862,1553,2198,2794,3320], [3593,6468,9162,11642,13833]],
  [425, [903,1624,2301,2925,3475], [3760,6770,9589,12183,14478]],
] as const;

describe('independent promotional Gold upgrade acceptance', () => {
  it('matches every observed upgrade-plus-extension quote through eight total years', () => {
    for (const [hp, upgrades, extension] of bands) {
      for (let promo=1; promo<=4; promo++) {
        const included=3+promo;
        const options=getPlatinumQuoteOptions(hp,included);
        for (let extra=1;extra<=8-included;extra++) {
          expect(options.find(o=>o.totalYears===included+extra)?.price,`${hp}HP ${promo}Gold +${extra}Platinum`).toBe(upgrades[promo-1]+extension[extra-1]);
        }
        expect(options.every(o=>o.totalYears<=8)).toBe(true);
      }
    }
  });
  it('retains zero-cost factory plus Gold when the customer declines a paid plan', () => {
    expect(createBaselineWarrantyConfig(5)).toMatchObject({extendedYears:0,totalYears:5,warrantyPrice:0});
    expect(reconcileWarrantyConfig(60,5,null)).toMatchObject({extendedYears:0,totalYears:5,warrantyPrice:0});
  });
  it('does not accumulate an upgrade charge during repeated promotion reconciliation', () => {
    let config = {extendedYears:5,totalYears:8,warrantyPrice:1365};
    for (let i=0;i<5;i++) config = reconcileWarrantyConfig(60,5,config);
    expect(config).toMatchObject({extendedYears:3,totalYears:8,warrantyPrice:1057});
    const withoutPromotion=reconcileWarrantyConfig(60,3,config);
    expect(withoutPromotion).toMatchObject({extendedYears:5,totalYears:8,warrantyPrice:1365});
    expect(reconcileWarrantyConfig(115,5,config)).toMatchObject({totalYears:8,warrantyPrice:1609});
  });
  it('keeps the original no-promotion cumulative plan costs', () => {
    for(const [hp,,prices] of bands) {
      const options=getPlatinumQuoteOptions(hp,3);
      for(let term=1;term<=5;term++) expect(options.find(o=>o.totalYears===3+term)?.price).toBe(prices[term-1]);
    }
  });
  it('does not sell an unverified Gold conversion for 500 or 600 HP', () => {
    for(const hp of [500,600]) expect(getPlatinumQuoteOptions(hp,5)).toEqual([]);
  });
  it('charges the full corrected protection once in the accessory total', () => {
    const warranty=reconcileWarrantyConfig(60,5,{extendedYears:3,totalYears:8,warrantyPrice:904});
    const rows=buildAccessoryBreakdown({selectedOptions:[],motor:{hp:60,model:'60 ELHPT Tiller'},purchasePath:'loose',adminCustomItems:[],warrantyConfig:warranty});
    const protection=rows.filter(row=>/Platinum|Gold|Product Protection/i.test(row.name));
    expect(protection.reduce((sum,row)=>sum+row.price,0)).toBe(1057);
  });
  it('keeps the public quote utility on full Gold-plus-Platinum pricing', () => {
    expect(calculateWarrantyExtensionCost(60,5,8)).toBe(1057);
  });
  it('adds Gold conversion exactly once before HST and DealerPlan financing fee', () => {
    const protection=getPlatinumQuoteOptions(60,5).find(o=>o.totalYears===8)!;
    const pricing=calculateQuotePricing({motorMSRP:14545,motorDiscount:1488,accessoryTotal:303.37+99+233.23+382.21,warrantyPrice:protection.price,promotionalSavings:0,tradeInValue:0,taxRate:.13});
    expect(pricing.subtotal).toBeCloseTo(15131.81,2);
    expect(pricing.tax).toBeCloseTo(1967.1353,4);
    expect(pricing.total).toBeCloseTo(17098.9453,4);
    const financed=getFinanceableAmount(pricing.subtotal,.13,349);
    expect(financed).toBeCloseTo(17447.9453,4);
    // The existing shopper teaser deliberately rounds payments to whole dollars.
    expect(calculateMonthlyPayment(financed,5.48,60).payment).toBe(333);
    const monthlyRate=5.48/100/12;
    expect(Number(financed.toFixed(2))*monthlyRate/(1-Math.pow(1+monthlyRate,-60))).toBeCloseTo(333.12,2);
  });

});
