import { buildAccessoryBreakdown, type AccessoryBreakdownItem } from '@/lib/build-accessory-breakdown';

export const QUOTE_PDF_SNAPSHOT_VERSION = 1 as const;
export const FINANCING_CONTRACT_TERM_MONTHS = 60;

export type QuotePaymentMethod = 'cash_purchase' | 'standard_financing' | 'special_financing';
export type QuotePromoOption = 'no_payments' | 'special_financing' | 'cash_rebate';

export function resolveQuoteMotorImage(motor: any): string | undefined {
  const firstGalleryImage = Array.isArray(motor?.images) ? motor.images[0] : undefined;
  const candidates = [
    motor?.imageUrl,
    motor?.hero_image_url,
    motor?.image_url,
    motor?.image,
    typeof firstGalleryImage === 'string'
      ? firstGalleryImage
      : firstGalleryImage?.media_url || firstGalleryImage?.url || firstGalleryImage?.image_url,
  ];

  return candidates.find((candidate) => typeof candidate === 'string' && candidate.trim().length > 0)?.trim();
}

export interface QuotePdfPricing {
  msrp: number;
  discount: number;
  adminDiscount?: number;
  promoValue: number;
  motorSubtotal: number;
  subtotal: number;
  hst: number;
  totalCashPrice: number;
  savings: number;
}

export interface QuotePdfFinancing {
  monthlyPayment: number;
  rate: number;
  amortizationMonths: number;
  contractTermMonths: number;
  amountFinanced: number;
  dealerFee: number;
  downPayment?: number;
}

export interface QuotePdfFinancingInput {
  amountFinanced: number;
  rate: number;
  amortizationMonths: number;
  contractTermMonths?: number;
  paymentMethod?: QuotePaymentMethod | null;
  dealerFee: number;
  downPayment?: number;
}

export interface QuotePdfPromotion {
  name?: string;
  endDate?: string;
  combinationMode?: 'layered' | 'choose_one';
  selectedOption?: QuotePromoOption | null;
  selectedValue?: string | null;
}

export interface QuotePdfProductProtection {
  planYears: number;
  totalCoverageYears: number;
  priceBeforeTax: number;
  monthlyDelta?: number;
}

export interface QuotePdfSnapshot {
  version: typeof QUOTE_PDF_SNAPSHOT_VERSION;
  createdAt: string;
  validUntil?: string;
  motor: {
    model: string;
    hp: number;
    msrp: number;
    modelYear: number;
    category: string;
    imageUrl?: string;
  };
  pricing: QuotePdfPricing;
  accessoryBreakdown: AccessoryBreakdownItem[];
  purchasePath: 'loose' | 'installed';
  tradeInValue?: number;
  tradeInInfo?: {
    brand: string;
    year: number;
    horsepower: number;
    model?: string;
  };
  includedCoverageYears: number;
  productProtection?: QuotePdfProductProtection;
  financing?: QuotePdfFinancing;
  paymentMethod?: QuotePaymentMethod | null;
  promotion?: QuotePdfPromotion;
  customerNotes?: string;
}

export interface QuotePdfValidationResult {
  isValid: boolean;
  errors: string[];
}

function monthlyPayment(principal: number, annualRate: number, amortizationMonths: number): number {
  if (principal <= 0 || amortizationMonths <= 0) return 0;
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return principal / amortizationMonths;
  return principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -amortizationMonths));
}

export function resolveFinancingContractTermMonths({
  paymentMethod,
  amortizationMonths,
  contractTermMonths,
}: {
  paymentMethod?: QuotePaymentMethod | null;
  amortizationMonths: number;
  contractTermMonths?: number | null;
}): number {
  if (paymentMethod === 'special_financing' && Number.isFinite(amortizationMonths) && amortizationMonths > 0) {
    return amortizationMonths;
  }

  return Number.isFinite(contractTermMonths) && Number(contractTermMonths) > 0
    ? Number(contractTermMonths)
    : FINANCING_CONTRACT_TERM_MONTHS;
}

/**
 * Build the financing block from one coherent set of inputs. The payment must
 * never be copied from a newer quote total while amountFinanced is retained
 * from an older PDF snapshot (for example, before a rebate or prop decision).
 */
export function buildQuotePdfFinancing({
  amountFinanced,
  rate,
  amortizationMonths,
  contractTermMonths,
  paymentMethod,
  dealerFee,
  downPayment,
}: QuotePdfFinancingInput): QuotePdfFinancing {
  return {
    monthlyPayment: Math.round(monthlyPayment(amountFinanced, rate, amortizationMonths)),
    rate,
    amortizationMonths,
    contractTermMonths: resolveFinancingContractTermMonths({
      paymentMethod,
      amortizationMonths,
      contractTermMonths,
    }),
    amountFinanced,
    dealerFee,
    downPayment,
  };
}

/**
 * Verify that the exact values printed in a quote still reconcile. This is a
 * final safety gate for customer PDFs, not a pricing calculator: callers must
 * fix or refresh a stale snapshot instead of silently changing its values.
 */
export function validateQuotePdfSnapshot(
  snapshot: QuotePdfSnapshot,
  tolerance = 0.02,
): QuotePdfValidationResult {
  const errors: string[] = [];
  const accessoryPrices = snapshot.accessoryBreakdown.map((item) => Number(item.price));
  const requiredPrices = [
    snapshot.pricing.motorSubtotal,
    snapshot.pricing.subtotal,
    snapshot.pricing.hst,
    snapshot.pricing.totalCashPrice,
    Number(snapshot.tradeInValue || 0),
    ...accessoryPrices,
  ];
  if (requiredPrices.some((value) => !Number.isFinite(value))) {
    errors.push('One or more printed prices are invalid.');
  }

  const accessoryTotal = accessoryPrices.reduce(
    (sum, price) => sum + price,
    0,
  );
  const expectedSubtotal = snapshot.pricing.motorSubtotal
    + accessoryTotal
    - Number(snapshot.tradeInValue || 0);
  const expectedHst = snapshot.pricing.subtotal * 0.13;
  const expectedTotal = snapshot.pricing.subtotal + snapshot.pricing.hst;

  if (Math.abs(snapshot.pricing.subtotal - expectedSubtotal) > tolerance) {
    errors.push('The itemized prices do not add up to the subtotal.');
  }
  if (Math.abs(snapshot.pricing.hst - expectedHst) > tolerance) {
    errors.push('The HST does not match 13% of the subtotal.');
  }
  if (Math.abs(snapshot.pricing.totalCashPrice - expectedTotal) > tolerance) {
    errors.push('The cash total does not match the subtotal plus HST.');
  }

  if (snapshot.financing) {
    const financingValues = [
      snapshot.financing.monthlyPayment,
      snapshot.financing.amountFinanced,
      snapshot.financing.rate,
      snapshot.financing.amortizationMonths,
    ];
    if (financingValues.some((value) => !Number.isFinite(value))) {
      errors.push('One or more financing values are invalid.');
    } else {
      const expectedPayment = Math.round(monthlyPayment(
        snapshot.financing.amountFinanced,
        snapshot.financing.rate,
        snapshot.financing.amortizationMonths,
      ));
      if (Math.abs(snapshot.financing.monthlyPayment - expectedPayment) > 1) {
        errors.push('The monthly payment does not match the financed amount, APR and amortization.');
      }
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Incremental payment for financing a Product Protection plan with the quote.
 * The rate-card price is before HST, so the financed increment includes 13% HST.
 */
export function calculateProtectionMonthlyDelta({
  priceBeforeTax,
  annualRate,
  amortizationMonths,
  taxRate = 0.13,
}: {
  priceBeforeTax: number;
  annualRate: number;
  amortizationMonths: number;
  taxRate?: number;
}): number {
  const financedPlanPrice = priceBeforeTax * (1 + taxRate);
  return Math.round(monthlyPayment(financedPlanPrice, annualRate, amortizationMonths));
}

export function isQuotePdfSnapshot(value: unknown): value is QuotePdfSnapshot {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<QuotePdfSnapshot>;
  return candidate.version === QUOTE_PDF_SNAPSHOT_VERSION
    && typeof candidate.createdAt === 'string'
    && typeof candidate.motor?.model === 'string'
    && typeof candidate.pricing?.totalCashPrice === 'number'
    && Array.isArray(candidate.accessoryBreakdown);
}

export function frozenPricingFromPdfSnapshot(snapshot: QuotePdfSnapshot) {
  return {
    motorMSRP: snapshot.pricing.msrp,
    motorDiscount: snapshot.pricing.discount,
    adminDiscount: snapshot.pricing.adminDiscount || 0,
    promoSavings: snapshot.pricing.promoValue,
    subtotal: snapshot.pricing.subtotal,
    hst: snapshot.pricing.hst,
    total: snapshot.pricing.totalCashPrice,
    savings: snapshot.pricing.savings,
    quoteExpiryDate: snapshot.validUntil,
    promotionName: snapshot.promotion?.name,
    promotionEndDate: snapshot.promotion?.endDate,
    promotionCombinationMode: snapshot.promotion?.combinationMode,
    selectedPromoOption: snapshot.promotion?.selectedOption,
    selectedPromoValue: snapshot.promotion?.selectedValue,
    selectedPaymentMethod: snapshot.paymentMethod,
    financingRate: snapshot.financing?.rate,
    financingAmortizationMonths: snapshot.financing?.amortizationMonths,
    financingContractTermMonths: snapshot.financing?.contractTermMonths,
    dealerFee: snapshot.financing?.dealerFee,
    amountFinanced: snapshot.financing?.amountFinanced,
  };
}

/**
 * Conservative adapter for quotes saved before PDF snapshots existed. It only
 * returns a snapshot when exact persisted totals are available; it never
 * estimates an MSRP, promotion value or financing payment.
 */
export function buildLegacyQuotePdfSnapshot(state: any, createdAt?: string): QuotePdfSnapshot | null {
  if (isQuotePdfSnapshot(state?.pdfSnapshot)) return state.pdfSnapshot;

  const frozen = state?.frozenPricing;
  const persisted = state?.pricing;
  const motor = state?.motor || state?.selectedMotor;
  const totalCashPrice = frozen?.total ?? persisted?.totalCashPrice;
  const subtotal = frozen?.subtotal ?? persisted?.subtotal;
  const hst = frozen?.hst ?? persisted?.hst;
  const msrp = frozen?.motorMSRP ?? persisted?.msrp;
  if (!motor || !Number.isFinite(totalCashPrice) || !Number.isFinite(subtotal) || !Number.isFinite(hst) || !Number.isFinite(msrp)) {
    return null;
  }

  const discount = frozen?.motorDiscount ?? persisted?.discount ?? 0;
  const adminDiscount = frozen?.adminDiscount ?? persisted?.adminDiscount ?? state?.adminDiscount ?? 0;
  const promoValue = frozen?.promoSavings ?? persisted?.promoValue ?? 0;
  const accessoryBreakdown = Array.isArray(state?.accessoryBreakdown) && state.accessoryBreakdown.length > 0
    ? state.accessoryBreakdown
    : buildAccessoryBreakdown({
        selectedOptions: state?.selectedOptions || [],
        motor,
        boatInfo: state?.boatInfo,
        purchasePath: state?.purchasePath,
        installConfig: state?.installConfig,
        looseMotorBattery: state?.looseMotorBattery,
        selectedPackage: state?.selectedPackage?.id || 'good',
        adminCustomItems: state?.adminCustomItems || [],
        warrantyConfig: state?.warrantyConfig,
        tradeInInfo: state?.tradeInInfo,
      });
  const includedCoverageYears = Math.max(
    3,
    Number(state?.warrantyConfig?.totalYears || 3) - Number(state?.warrantyConfig?.extendedYears || 0),
  );
  const financingComplete = [
    frozen?.amountFinanced,
    frozen?.financingRate,
    frozen?.financingAmortizationMonths,
  ].every((value) => Number.isFinite(value) && value > 0);
  const paymentMethod = frozen?.selectedPaymentMethod ?? state?.selectedPaymentMethod ?? null;

  return {
    version: QUOTE_PDF_SNAPSHOT_VERSION,
    createdAt: createdAt || state?.createdAt || new Date().toISOString(),
    validUntil: frozen?.quoteExpiryDate,
    motor: {
      model: motor.model || motor.display_name || 'Mercury Outboard',
      hp: Number(motor.hp || motor.horsepower || 0),
      msrp,
      modelYear: Number(motor.model_year || motor.modelYear || motor.year || 2026),
      category: motor.category || motor.motor_type || 'FourStroke',
      imageUrl: resolveQuoteMotorImage(motor),
    },
    pricing: {
      msrp,
      discount,
      adminDiscount,
      promoValue,
      motorSubtotal: persisted?.motorSubtotal ?? (msrp - discount - adminDiscount - promoValue),
      subtotal,
      hst,
      totalCashPrice,
      savings: frozen?.savings ?? persisted?.savings ?? (discount + adminDiscount + promoValue),
    },
    accessoryBreakdown,
    purchasePath: state?.purchasePath === 'installed' ? 'installed' : 'loose',
    ...(state?.tradeInInfo?.hasTradeIn && state.tradeInInfo.estimatedValue > 0 ? {
      tradeInValue: Number(state.tradeInInfo.estimatedValue),
      tradeInInfo: {
        brand: state.tradeInInfo.brand || 'Trade-in',
        year: Number(state.tradeInInfo.year || 0),
        horsepower: Number(state.tradeInInfo.horsepower || 0),
        model: state.tradeInInfo.model || undefined,
      },
    } : {}),
    includedCoverageYears,
    ...(state?.warrantyConfig?.extendedYears > 0 && state.warrantyConfig.warrantyPrice > 0 ? {
      productProtection: {
        planYears: Number(state.warrantyConfig.extendedYears),
        totalCoverageYears: Number(state.warrantyConfig.totalYears),
        priceBeforeTax: Number(state.warrantyConfig.warrantyPrice),
        ...(financingComplete ? {
          monthlyDelta: calculateProtectionMonthlyDelta({
            priceBeforeTax: Number(state.warrantyConfig.warrantyPrice),
            annualRate: Number(frozen.financingRate),
            amortizationMonths: Number(frozen.financingAmortizationMonths),
          }),
        } : {}),
      },
    } : {}),
    ...(financingComplete && paymentMethod !== 'cash_purchase' ? {
      financing: {
        monthlyPayment: Math.round(monthlyPayment(Number(frozen.amountFinanced), Number(frozen.financingRate), Number(frozen.financingAmortizationMonths))),
        rate: Number(frozen.financingRate),
        amortizationMonths: Number(frozen.financingAmortizationMonths),
        contractTermMonths: resolveFinancingContractTermMonths({
          paymentMethod,
          amortizationMonths: Number(frozen.financingAmortizationMonths),
          contractTermMonths: Number(frozen.financingContractTermMonths),
        }),
        amountFinanced: Number(frozen.amountFinanced),
        dealerFee: Number(frozen.dealerFee || 0),
        downPayment: Number(state?.financing?.downPayment || 0),
      },
    } : {}),
    paymentMethod,
    promotion: {
      name: frozen?.promotionName,
      endDate: frozen?.promotionEndDate,
      combinationMode: frozen?.promotionCombinationMode,
      selectedOption: frozen?.selectedPromoOption ?? state?.selectedPromoOption ?? null,
      selectedValue: frozen?.selectedPromoValue ?? state?.selectedPromoValue ?? null,
    },
    customerNotes: state?.customerNotes || undefined,
  };
}
