import { useMemo } from 'react';
import { useQuote } from '@/contexts/QuoteContext';
import { useActivePromotions } from '@/hooks/useActivePromotions';

export interface LineItem {
  label: string;
  value: number;
  isCredit?: boolean;
}

export interface RunningTotalResult {
  subtotal: number;
  hst: number;
  total: number;
  lineItems: LineItem[];
}

/**
 * Pure function: single source of truth for quote running-total arithmetic.
 * Every component that needs a subtotal/total should call this (via the hook).
 */
export function calculateRunningTotal(
  motor: { price?: number; basePrice?: number; msrp?: number; model?: string; hp?: number } | null,
  opts: {
    selectedOptions?: Array<{ name: string; price: number }>;
    controlsOption?: string | null;
    purchasePath?: 'loose' | 'installed' | null;
    installationCost?: number;
    tankSize?: string;
    tankCost?: number;
    wantsBattery?: boolean;
    batteryCost?: number;
    warrantyPrice?: number;
    warrantyTotalYears?: number;
    tradeInValue?: number;
    adminCustomItems?: Array<{ name: string; price: number }>;
    adminDiscount?: number;
    selectedPromoOption?: string | null;
    getRebateForHP?: (hp: number) => number | null;
    hasCompatibleProp?: boolean;
  } = {}
): RunningTotalResult {
  if (!motor) return { subtotal: 0, hst: 0, total: 0, lineItems: [] };

  const motorPrice = motor.price || motor.basePrice || motor.msrp || 0;
  if (!motorPrice) return { subtotal: 0, hst: 0, total: 0, lineItems: [] };

  let subtotal = motorPrice;
  const lineItems: LineItem[] = [{ label: 'Motor Price', value: motorPrice }];

  // Selected options (fuel tanks, accessories, etc.)
  if (opts.selectedOptions?.length) {
    for (const o of opts.selectedOptions) {
      if (o.price > 0) {
        subtotal += o.price;
        lineItems.push({ label: o.name, value: o.price });
      }
    }
  }

  // Warranty
  if (opts.warrantyPrice) {
    subtotal += opts.warrantyPrice;
    const extraLabel = opts.warrantyTotalYears
      ? ` (+${opts.warrantyTotalYears - 5} yrs)`
      : '';
    lineItems.push({ label: `Extended Warranty${extraLabel}`, value: opts.warrantyPrice });
  }

  // Controls
  if (opts.controlsOption === 'none') {
    subtotal += 1200;
    lineItems.push({ label: 'Controls & Rigging Package', value: 1200 });
  } else if (opts.controlsOption === 'adapter') {
    subtotal += 125;
    lineItems.push({ label: 'Control Adaptor Harness', value: 125 });
  }

  // Installation labor for remote motors
  const isTiller = motor.model?.includes('TLR') || motor.model?.includes('MH');
  if (opts.purchasePath === 'installed' && !isTiller) {
    subtotal += 450;
    lineItems.push({ label: 'Installation Labor', value: 450 });
  }

  // Installation config (mounting hardware) — installed path only
  if (opts.purchasePath === 'installed' && opts.installationCost) {
    subtotal += opts.installationCost;
    lineItems.push({ label: 'Mounting Hardware', value: opts.installationCost });
  }

  // Fuel tank
  if (opts.tankCost && opts.tankSize) {
    subtotal += opts.tankCost;
    lineItems.push({ label: `${opts.tankSize} Fuel Tank`, value: opts.tankCost });
  }

  // Battery
  if (opts.wantsBattery && opts.batteryCost) {
    subtotal += opts.batteryCost;
    lineItems.push({ label: 'Marine Starting Battery', value: opts.batteryCost });
  }

  // Trade-in credit
  if (opts.tradeInValue) {
    subtotal -= opts.tradeInValue;
    lineItems.push({ label: 'Trade-In Credit', value: opts.tradeInValue, isCredit: true });
  }

  // Admin custom items
  if (opts.adminCustomItems?.length) {
    for (const item of opts.adminCustomItems) {
      subtotal += item.price;
      lineItems.push({ label: item.name, value: item.price });
    }
  }

  // Admin discount
  if (opts.adminDiscount && opts.adminDiscount > 0) {
    subtotal -= opts.adminDiscount;
    lineItems.push({ label: 'Discount', value: opts.adminDiscount, isCredit: true });
  }

  // Cash rebate
  if (opts.selectedPromoOption === 'cash_rebate' && motor.hp && opts.getRebateForHP) {
    const rebate = opts.getRebateForHP(motor.hp);
    if (rebate && rebate > 0) {
      subtotal -= rebate;
      lineItems.push({ label: 'Mercury Rebate', value: rebate, isCredit: true });
    }
  }

  const hst = subtotal * 0.13;
  const total = subtotal + hst;

  return { subtotal, hst, total, lineItems };
}

/**
 * React hook that wires calculateRunningTotal to QuoteContext + promotions.
 * Pass `motorOverride` to price a different motor (e.g. preview motor).
 */
export function useQuoteRunningTotal(
  motorOverride?: { price?: number; basePrice?: number; msrp?: number; model?: string; hp?: number } | null
) {
  const { state } = useQuote();
  const { getRebateForHP } = useActivePromotions();

  const motor = motorOverride !== undefined ? motorOverride : state.motor;

  return useMemo(() => {
    return calculateRunningTotal(motor, {
      selectedOptions: state.selectedOptions,
      controlsOption: state.boatInfo?.controlsOption,
      purchasePath: state.purchasePath,
      installationCost: state.installConfig?.installationCost,
      tankSize: state.fuelTankConfig?.tankSize,
      tankCost: state.fuelTankConfig?.tankCost,
      wantsBattery: state.looseMotorBattery?.wantsBattery,
      batteryCost: state.looseMotorBattery?.batteryCost,
      warrantyPrice: state.warrantyConfig?.warrantyPrice,
      warrantyTotalYears: state.warrantyConfig?.totalYears,
      tradeInValue: state.tradeInInfo?.estimatedValue,
      adminCustomItems: state.adminCustomItems,
      adminDiscount: state.adminDiscount,
      selectedPromoOption: state.selectedPromoOption,
      getRebateForHP,
    });
  }, [
    motor,
    state.selectedOptions,
    state.boatInfo?.controlsOption,
    state.purchasePath,
    state.installConfig?.installationCost,
    state.fuelTankConfig?.tankSize,
    state.fuelTankConfig?.tankCost,
    state.looseMotorBattery?.wantsBattery,
    state.looseMotorBattery?.batteryCost,
    state.warrantyConfig?.warrantyPrice,
    state.warrantyConfig?.totalYears,
    state.tradeInInfo?.estimatedValue,
    state.adminCustomItems,
    state.adminDiscount,
    state.selectedPromoOption,
    getRebateForHP,
  ]);
}
