/**
 * Shared utility to build the full accessory breakdown for a quote.
 * Used by QuoteSummaryPage (live), AdminQuoteControls (save), and AdminQuoteDetail (legacy restore).
 */
import { isTillerMotor, requiresMercuryControls, includesPropeller, canAddExternalFuelTank } from '@/lib/motor-helpers';
import { getPropellerAllowance } from '@/lib/propeller-allowance';
import { hasElectricStart } from '@/lib/motor-config-utils';

// Package warranty year constants
const COMPLETE_TARGET_YEARS = 7;
const PREMIUM_TARGET_YEARS = 8;

export interface AccessoryBreakdownItem {
  name: string;
  price: number;
  description?: string;
}

export interface BuildAccessoryBreakdownParams {
  selectedOptions?: Array<{ name: string; price: number; isIncluded?: boolean }>;
  motor: any;
  boatInfo?: any;
  purchasePath?: 'loose' | 'installed' | null;
  installConfig?: any;
  looseMotorBattery?: { wantsBattery?: boolean; batteryCost?: number };
  selectedPackage?: string; // 'good' | 'better' | 'best'
  adminCustomItems?: Array<{ name: string; price: number }>;
  completeWarrantyCost?: number;
  premiumWarrantyCost?: number;
  currentCoverageYears?: number;
}

export function buildAccessoryBreakdown(params: BuildAccessoryBreakdownParams): AccessoryBreakdownItem[] {
  const {
    selectedOptions = [],
    motor = {},
    boatInfo,
    purchasePath,
    installConfig,
    looseMotorBattery,
    selectedPackage = 'good',
    adminCustomItems = [],
    completeWarrantyCost = 0,
    premiumWarrantyCost = 0,
    currentCoverageYears = 3,
  } = params;

  const breakdown: AccessoryBreakdownItem[] = [];

  const motorModel = motor?.model || '';
  const hp = typeof motor?.hp === 'string' ? parseFloat(motor.hp) : (motor?.hp || motor?.horsepower || 0);
  const isManualTiller = isTillerMotor(motorModel);
  const needsControls = requiresMercuryControls(motor);
  const isElectricStart = hasElectricStart(motorModel);
  const includesProp = includesPropeller(motor);
  const propAllowance = getPropellerAllowance(hp);
  const canAddFuelTank = canAddExternalFuelTank(motor);

  // Controls cost from selection
  const getControlsCost = (): number => {
    if (!needsControls) return 0;
    const controlsOption = boatInfo?.controlsOption;
    switch (controlsOption) {
      case 'none': return 1200;
      case 'adapter': return 125;
      case 'compatible': return 0;
      default: return 0;
    }
  };
  const controlsCost = getControlsCost();

  // Installation labor (only for remote motors on installed path)
  const installationLaborCost = (!isManualTiller && purchasePath === 'installed') ? 450 : 0;

  // Tiller installation cost (only for installed path)
  const tillerInstallCost = isManualTiller && purchasePath === 'installed'
    ? (installConfig?.installationCost || 0)
    : 0;

  // --- Build breakdown items ---

  // Check fuel tank upgrade logic
  const hasUpgradedFuelTank = selectedOptions.some(
    opt => opt.name?.toLowerCase().includes('fuel tank') && opt.price > 0
  );
  const hasAnyFuelTankSelected = selectedOptions.some(
    opt => opt.name?.toLowerCase().includes('fuel tank')
  );

  // Selected motor options
  selectedOptions.forEach(option => {
    const isFuelTank = option.name?.toLowerCase().includes('fuel tank');
    const isIncludedTank = isFuelTank && option.isIncluded && option.price === 0;
    if (isIncludedTank && hasUpgradedFuelTank) return;

    breakdown.push({
      name: option.name,
      price: option.price,
      description: option.isIncluded ? 'Included with motor' : undefined
    });
  });

  // Tiller installation
  if (isManualTiller && tillerInstallCost > 0) {
    const mountingType = installConfig?.mounting === 'transom_bolt' ? 'Bolt-On Transom' : 'Installation';
    breakdown.push({
      name: `${mountingType} Installation`,
      price: tillerInstallCost,
      description: 'Professional mounting and setup'
    });
  } else if (isManualTiller && tillerInstallCost === 0 && purchasePath === 'installed') {
    breakdown.push({
      name: 'Clamp-On Installation',
      price: 0,
      description: 'DIY-friendly mounting system (no installation labor required)'
    });
  }

  // Controls
  if (needsControls && controlsCost > 0) {
    const controlsOption = boatInfo?.controlsOption;
    const controlsName = controlsOption === 'adapter'
      ? 'Control Adaptor Harness'
      : 'Controls & Rigging Package';
    const controlsDesc = controlsOption === 'adapter'
      ? 'Adapter to connect your existing Mercury controls to the new motor'
      : 'New throttle/shift controls, cables, and installation hardware';
    breakdown.push({ name: controlsName, price: controlsCost, description: controlsDesc });
  }

  // Professional installation for remote motors (installed path only)
  if (!isManualTiller && purchasePath === 'installed') {
    breakdown.push({
      name: 'Professional Installation',
      price: installationLaborCost,
      description: 'Expert rigging, mounting, and commissioning by certified technicians'
    });
  }

  // Battery for electric start
  if (isElectricStart && looseMotorBattery?.wantsBattery) {
    breakdown.push({
      name: 'Marine Starting Battery',
      price: looseMotorBattery.batteryCost || 179.99,
      description: 'Marine starting battery for electric start motor'
    });
  }

  // Propeller allowance
  if (!includesProp && propAllowance) {
    breakdown.push({
      name: propAllowance.name,
      price: propAllowance.price,
      description: propAllowance.description
    });
  }

  // Premium package fuel tank
  if (selectedPackage === 'best' && canAddFuelTank && !hasAnyFuelTankSelected) {
    breakdown.push({
      name: '12L External Fuel Tank & Hose',
      price: 199,
      description: 'Portable fuel tank for extended range'
    });
  }

  // Warranty extensions
  if (selectedPackage === 'better' && completeWarrantyCost > 0 && currentCoverageYears < COMPLETE_TARGET_YEARS) {
    const extensionYears = COMPLETE_TARGET_YEARS - currentCoverageYears;
    breakdown.push({
      name: `Complete Package: Extended Warranty (${extensionYears} additional year${extensionYears > 1 ? 's' : ''})`,
      price: completeWarrantyCost,
      description: `Total coverage: ${COMPLETE_TARGET_YEARS} years`
    });
  } else if (selectedPackage === 'best' && premiumWarrantyCost > 0 && currentCoverageYears < PREMIUM_TARGET_YEARS) {
    const extensionYears = PREMIUM_TARGET_YEARS - currentCoverageYears;
    breakdown.push({
      name: `Premium Package: Extended Warranty (${extensionYears} additional year${extensionYears > 1 ? 's' : ''})`,
      price: premiumWarrantyCost,
      description: `Total coverage: ${PREMIUM_TARGET_YEARS} years`
    });
  }

  // Admin custom line items
  adminCustomItems.forEach(item => {
    breakdown.push({
      name: item.name,
      price: item.price,
      description: 'Custom item'
    });
  });

  return breakdown;
}
