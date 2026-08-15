import { useMemo } from 'react';
import { useQuote } from '@/contexts/QuoteContext';
import { useActivePromotions } from '@/hooks/useActivePromotions';
import { getPropellerAllowance } from '@/lib/propeller-allowance';
import { includesPropeller } from '@/lib/motor-helpers';
import { resolvePropellerDecision } from '@/lib/propeller-selection';

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
    propellerAllowance?: { name: string; price: number } | null;
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

  // Propellers are included below 25 HP. Callers pass the appropriate
  // allowance only when a 25 HP+ quote is not reusing an existing propeller.
  if (opts.propellerAllowance?.price) {
    subtotal += opts.propellerAllowance.price;
    lineItems.push({
      label: opts.propellerAllowance.name,
      value: opts.propellerAllowance.price,
    });
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

  // Trade-in credit (capped at subtotal — no cash refunds)
  if (opts.tradeInValue) {
    const cappedTradeIn = Math.min(opts.tradeInValue, subtotal);
    subtotal -= cappedTradeIn;
    lineItems.push({ label: 'Trade-In Credit', value: cappedTradeIn, isCredit: true });
    if (opts.tradeInValue > cappedTradeIn) {
      lineItems.push({ label: 'Trade-in exceeds motor cost (capped)', value: 0 });
    }
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

  // Cash rebate — HP matrix is the sole source of truth. Applied whenever a
  // rebate is available for this motor's HP, regardless of whether the
  // customer selected "cash_rebate" or "special_financing" (Summer Savings
  // is a layered offer: rebate + optional promo financing). Legacy paths
  // that pass selectedPromoOption === 'cash_rebate' still get the rebate.
  if (motor.hp && opts.getRebateForHP && opts.selectedPromoOption !== 'no_payments') {
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
    const hp = Number(motor?.hp || 0);
    const allowance = motor && !includesPropeller(motor as Parameters<typeof includesPropeller>[0])
      ? getPropellerAllowance(hp)
      : null;
    const propellerDecision = resolvePropellerDecision({
      hp,
      installConfig: state.installConfig,
      boatInfo: state.boatInfo,
      tradeInInfo: state.tradeInInfo,
    });

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
      propellerAllowance: propellerDecision === 'include_allowance' ? allowance : null,
    });
  }, [
    motor,
    state.selectedOptions,
    state.boatInfo,
    state.purchasePath,
    state.installConfig,
    state.fuelTankConfig?.tankSize,
    state.fuelTankConfig?.tankCost,
    state.looseMotorBattery?.wantsBattery,
    state.looseMotorBattery?.batteryCost,
    state.warrantyConfig?.warrantyPrice,
    state.warrantyConfig?.totalYears,
    state.tradeInInfo,
    state.adminCustomItems,
    state.adminDiscount,
    state.selectedPromoOption,
    getRebateForHP,
  ]);
}
