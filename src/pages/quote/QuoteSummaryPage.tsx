import { meetsPromotionFinancingMinimum, resolveSelectedPromotionFinancing } from '@/lib/promotion-financing';
import { formatFactoryRebateDisplayAmount } from '@/lib/factory-rebate-copy';
import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { calculateRunningTotal } from '@/hooks/useQuoteRunningTotal';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getOrCreateSessionId } from '@/hooks/useQuoteActivityTracker';
import { ScrollToTop } from '@/components/ui/ScrollToTop';
import { QuoteLayout } from '@/components/quote-builder/QuoteLayout';
import { PageTransition } from '@/components/ui/page-transition';
import { QuoteSummarySkeleton } from '@/components/quote-builder/QuoteSummarySkeleton';
import StickySummary from '@/components/quote-builder/StickySummary';
import { StaleQuoteAlert } from '@/components/quote-builder/StaleQuoteAlert';
import { UCP_CHECKOUT_REF_FLAG } from '@/lib/agent-quote-handoff';
import { getExpressReservationDeposit, getRecommendedDeposit } from '@/lib/deposit';
import {
  formatDepositAddress,
  parseDepositIdentity,
  quoteStateCustomerPatch,
  savedQuoteIdentityColumns,
} from '@/lib/deposit-identity';
import { DepositInfoDialog, type DepositCustomerInfo } from '@/components/quote-builder/DepositInfoDialog';

import { PricingTable } from '@/components/quote-builder/PricingTable';
import { BonusOffers } from '@/components/quote-builder/BonusOffers';
import { PlatinumProtectionSelector } from '@/components/quote-builder/PlatinumProtectionSelector';


import { SaveQuoteDialog } from '@/components/quote-builder/SaveQuoteDialog';
import { SaveQuoteWithAuth } from '@/components/quote-builder/SaveQuoteWithAuth';
import { PhoneCapture } from '@/components/quote-builder/PhoneCapture';
import { useAutoSaveQuoteOnAuth } from '@/hooks/useAutoSaveQuoteOnAuth';
import { isTillerMotor, requiresMercuryControls, includesPropeller, canAddExternalFuelTank } from '@/lib/motor-helpers';
import { getPropellerAllowance } from '@/lib/propeller-allowance';
import { resolvePropellerDecision } from '@/lib/propeller-selection';
import { hasElectricStart } from '@/lib/motor-config-utils';
import { buildAccessoryBreakdown } from '@/lib/build-accessory-breakdown';

import { useQuote } from '@/contexts/QuoteContext';
import { useAuth } from '@/components/auth/AuthProvider';
import { AdminQuoteControls } from '@/components/admin/AdminQuoteControls';
import { Bookmark, CreditCard, Download } from 'lucide-react';
import { computeTotals, calculateMonthlyPayment, getFinancingTerm, DEALERPLAN_FEE, FINANCING_MINIMUM } from '@/lib/finance';
import { calculateQuotePricing, formatPromoCalendarDate, getFinanceableAmount, resolveQuoteValidUntil } from '@/lib/quote-utils';
import { resolveAppliedTradeValue } from '@/lib/trade-credit';
import { calculateFinancingPurchase, FINANCING_PRICE_BASIS_ALL_IN_AFTER_TRADE } from '@/lib/financing-purchase';
import { supabase } from '@/integrations/supabase/client';
import { useActiveFinancingPromo } from '@/hooks/useActiveFinancingPromo';
import { isQuoteSnapshotExpired } from '../../../supabase/functions/_shared/quote-snapshot-expiry';
import { useActivePromotions } from '@/hooks/useActivePromotions';
import { useGoogleReviewStats } from '@/hooks/useGoogleReviewStats';
import { useToast } from '@/hooks/use-toast';
import { SITE_URL } from '@/lib/site';
import { generateSavedQuoteQrCode } from '@/lib/saved-quote-qr';
import { hasIdentifiedPdfCustomer } from '@/lib/pdf-lead-tracking';
import { QuoteSummaryPageSEO } from '@/components/seo/QuoteSummaryPageSEO';
import { trackAgentEvent } from '@/lib/agentEvents';
import { trackEvent } from '@/lib/analytics';
import { buildSoftLeadSnapshotKey, softLeadSaveCoordinator } from '@/lib/soft-lead-save';
import { getSoftLeadReference } from '@/lib/soft-lead-reference';
import { COMPANY_INFO } from '@/lib/companyInfo';
import {
  reconcileWarrantyConfig,
  requiresCustomProtectionReview,
  type QuoteWarrantyConfig,
} from '@/lib/quote-product-protection';
import { getAppliedPromotion, getAppliedWarrantyExtraYears } from '@/lib/warranty-display';
import {
  buildQuotePdfFinancing,
  calculateProtectionMonthlyDelta,
  frozenPricingFromPdfSnapshot,
  hasCompleteFrozenQuoteSnapshot,
  isQuotePdfSnapshot,
  QUOTE_PDF_SNAPSHOT_VERSION,
  resolveQuoteIncludedCoverageYears,
  resolveQuoteMotorImage,
  type QuotePdfSnapshot,
} from '@/lib/quote-pdf-data';
import {
  DEPOSIT_POLICY_PUBLIC_SUMMARY,
  DEPOSIT_POLICY_QUOTE_STATE_KEY,
  customerPolicyText,
  tryBuildDepositPolicySnapshot,
} from '../../../supabase/functions/_shared/deposit-policy';

// Animation variants
const sectionVariants = {
  hidden: { y: 8 },
  visible: {
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  }
};

const pricingTableVariants = {
  hidden: { y: 15 },
  visible: {
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
      delay: 0.2
    }
  }
};

export default function QuoteSummaryPage() {
  const navigate = useNavigate();
  const { state, dispatch, getQuoteData } = useQuote();
  const isMotorOnlyExpress = state.uiFlags.motorOnlyExpress === true;
  const suppressAdditionalPromoSavings = state.uiFlags.suppressAdditionalPromoSavings === true;
  const { user, isAdmin } = useAuth();
  const { promo } = useActiveFinancingPromo();
  const { promotions, loading: promoLoading, error: promoError, arePromotionsCurrent, getTotalPromotionalSavings, getPromotionSavingsForMotor, getPromotionOptions, getRebateForHP, getSpecialFinancingRates } = useActivePromotions({ motor: state.motor });
  const { rating: googleRating, totalReviews: googleReviewCount } = useGoogleReviewStats();
  const { toast } = useToast();
  const baseCoverageYears = 3;
  const currentPromotion = getAppliedPromotion(promotions);
  const appliedPromotion = suppressAdditionalPromoSavings ? null : currentPromotion;
  const currentCoverageYears = useMemo(
    () => resolveQuoteIncludedCoverageYears({
      frozen: Boolean(state.frozenPricing),
      snapshotYears: state.pdfSnapshot?.includedCoverageYears,
      warrantyConfig: state.warrantyConfig,
      liveYears: Math.min(baseCoverageYears + getAppliedWarrantyExtraYears(appliedPromotion), 8),
    }),
    [appliedPromotion, state.frozenPricing, state.pdfSnapshot?.includedCoverageYears, state.warrantyConfig],
  );
  const promoYears = Math.max(0, currentCoverageYears - baseCoverageYears);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
  const isMounted = true; // Render immediately, no artificial delay
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showAuthSaveDialog, setShowAuthSaveDialog] = useState(false);
  const [showPhoneCapture, setShowPhoneCapture] = useState(false);
  const [phoneCaptureQuoteId, setPhoneCaptureQuoteId] = useState<string | undefined>();
  const [sessionReferenceNumber, setSessionReferenceNumber] = useState<string | null>(null);
  const [sessionReferenceResolved, setSessionReferenceResolved] = useState(false);
  // A quote resumed from a PDF QR code keeps the number printed on that PDF.
  // Otherwise the number belongs to this session's soft save.
  const canonicalReferenceNumber = state.restoredReferenceNumber ?? sessionReferenceNumber;
  const referenceNumberResolved = Boolean(state.restoredReferenceNumber) || sessionReferenceResolved;
  const pdfSavedQuoteRef = useRef<{
    id: string;
    referenceNumber?: string;
    snapshotKey: string;
  } | null>(null);
  
  // The session-scoped soft-lead coordinator survives page remounts and keeps
  // all anonymous snapshot writes in one ordered queue.
  const softLeadAnalyticsTrackedRef = useRef(false);

  // Listen for quote-saved-via-auth event to show phone capture
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setPhoneCaptureQuoteId(detail?.savedQuoteId);
      setShowPhoneCapture(true);
    };
    window.addEventListener('quote-saved-via-auth', handler);
    return () => window.removeEventListener('quote-saved-via-auth', handler);
  }, []);
  
  // Deposit processing state - amount is auto-calculated from HP
  const [isProcessingDeposit, setIsProcessingDeposit] = useState(false);
  const [showDepositDialog, setShowDepositDialog] = useState(false);

  // isMounted gate removed, content renders immediately from context

  // Set document title
  useEffect(() => {
    document.title = 'Your Mercury Motor Quote | Harris Boat Works';
  }, []);

  // Redirect if no motor selected (wait for loading to complete first)
  useEffect(() => {
    if (isMounted && !state.isLoading) {
      if (!state.motor) {
        navigate('/quote/motor-selection');
      } else if (!state.selectedPackage) {
        // Keep the internal baseline package for quote-data compatibility. The
        // customer-facing package selector is intentionally retired.
        dispatch({ type: 'SET_SELECTED_PACKAGE', payload: { id: 'good', label: 'Configured Quote', priceBeforeTax: 0 } });
      }
    }
  }, [isMounted, state.isLoading, state.motor, state.selectedPackage, navigate, dispatch]);

  const handleStepComplete = () => {
    trackEvent('quote_review_started', {
      motor_hp: hp,
      purchase_path: state.purchasePath || 'unknown',
      device: window.innerWidth < 1024 ? 'mobile_or_tablet' : 'desktop',
    });
    dispatch({ type: 'COMPLETE_STEP', payload: 6 });
    navigate('/quote/schedule');
  };

  const handleBack = () => {
    navigate(
      isMotorOnlyExpress
        ? '/motors/fourstroke-9-9hp-9-9mh-fourstroke'
        : '/quote/trade-in',
    );
  };

  const quoteData = getQuoteData();

  // Motor details
  const motor = state?.motor ?? {} as any;
  const motorName = motor?.model ?? motor?.name ?? motor?.displayName ?? "Mercury Outboard";
  const modelYear = motor?.year ?? motor?.modelYear ?? undefined;
  const hp = quoteData.motor?.hp || motor?.hp || motor?.horsepower || 0;
  const motorHp = hp;
  const sku = motor?.sku ?? motor?.partNumber ?? null;
  const imageUrl = resolveQuoteMotorImage(motor) ?? null;

  // Keep a selected combined-coverage target aligned with current promotional
  // years and the selected motor's exact rate band. Frozen shared quotes retain
  // their original snapshot until the customer explicitly changes the plan.
  useEffect(() => {
    if (state.isLoading || promoLoading || promoError || !state.motor || state.frozenPricing) return;

    const reconciled = reconcileWarrantyConfig(
      Number(hp),
      currentCoverageYears,
      state.warrantyConfig,
      state.adminCustomItems,
    );
    const current = state.warrantyConfig;
    if (
      current?.extendedYears === reconciled.extendedYears &&
      current?.warrantyPrice === reconciled.warrantyPrice &&
      current?.totalYears === reconciled.totalYears &&
      current?.goldUpgradePrice === reconciled.goldUpgradePrice &&
      current?.platinumExtensionPrice === reconciled.platinumExtensionPrice &&
      current?.promoGoldYears === reconciled.promoGoldYears
    ) {
      return;
    }

    dispatch({ type: 'SET_WARRANTY_CONFIG', payload: reconciled });
  }, [
    currentCoverageYears,
    dispatch,
    hp,
    promoLoading,
    promoError,
    state.frozenPricing,
    state.isLoading,
    state.motor,
    state.warrantyConfig,
    state.adminCustomItems,
  ]);
  
  // Auto-calculated deposit based on motor HP (no user selection)
  const depositAmount = isMotorOnlyExpress
    ? getExpressReservationDeposit(hp)
    : getRecommendedDeposit(hp);
  const depositPolicySnapshot = useMemo(
    () => tryBuildDepositPolicySnapshot({
      motorId: state.motor?.id,
      motor: state.motor,
      purchasePath: state.purchasePath,
    }),
    [state.motor, state.purchasePath],
  );
  const canReserveMotor = Boolean(depositPolicySnapshot) && !isQuoteSnapshotExpired({
    validUntil: state.frozenPricing?.quoteExpiryDate ?? state.pdfSnapshot?.validUntil,
    promotion: state.pdfSnapshot?.promotion,
  });

  // Spec pills
  const specs = [
    motor?.shaftLength ? { label: "Shaft", value: String(motor.shaftLength) } : null,
    motor?.starting ? { label: "Start", value: String(motor.starting) } : null,
    motor?.controls ? { label: "Controls", value: String(motor.controls) } : null,
    motor?.weight ? { label: "Weight", value: `${motor.weight} lb` } : null,
    motor?.alternatorOutput ? { label: "Alt", value: `${motor.alternatorOutput} A` } : null,
  ].filter(Boolean) as Array<{label:string; value:string}>;


  // Helper to get display value for promo option
  const getPromoDisplayValue = useCallback((
    option: 'no_payments' | 'special_financing' | 'cash_rebate' | null | undefined,
    motorHP: number
  ): string => {
    if (!option) return '';
    
    switch (option) {
      case 'no_payments':
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() + 6);
        return `Payments begin ${startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
      case 'special_financing':
        const rates = getSpecialFinancingRates();
        return rates?.[0]?.rate ? `${rates[0].rate}%` : '2.99%';
      case 'cash_rebate':
        return formatFactoryRebateDisplayAmount(getRebateForHP(motorHP));
      default:
        return '';
    }
  }, [getRebateForHP, getSpecialFinancingRates]);

  const specSheetUrl = motor?.specSheetUrl ?? null;
  
  // Motor type calculations
  const motorModel = motor?.model || state.motor?.model || '';
  const isManualTiller = isTillerMotor(motorModel);
  const needsControls = requiresMercuryControls(motor);
  const isElectricStart = hasElectricStart(motorModel);
  
  // Calculate base accessory costs
  const motorHP = typeof motor.hp === 'string' ? parseFloat(motor.hp) : motor.hp;
  
  const getControlsCostFromSelection = (): number => {
    if (!needsControls) return 0;
    const controlsOption = state.boatInfo?.controlsOption;
    switch (controlsOption) {
      case 'none': return 1200;
      case 'adapter': return 125;
      case 'compatible': return 0;
      default: return 0;
    }
  };
  
  const controlsCost = getControlsCostFromSelection();
  // Only charge installation labor for installed path AND remote motors
  const installationLaborCost = (!isManualTiller && state.purchasePath === 'installed') ? 450 : 0;
  const batteryCost = isElectricStart ? 179.99 : 0;
  const includesProp = includesPropeller(motor);
  const propAllowance = getPropellerAllowance(hp);
  const propCost = (!includesProp && propAllowance) ? propAllowance.price : 0;
  const canAddFuelTank = canAddExternalFuelTank(motor);
  const baseAccessoryCost = controlsCost + installationLaborCost;
  // Only apply tiller installation cost if purchasePath is 'installed'
  const tillerInstallCost = isManualTiller && state.purchasePath === 'installed' 
    ? (state.installConfig?.installationCost || 0) 
    : 0;
  // Calculate pricing, use frozen snapshot if available (shared/QR links),
  // otherwise calculate live from current promo data
  const motorMSRP = state.frozenPricing?.motorMSRP ?? (quoteData.motor?.msrp || quoteData.motor?.basePrice || 0);
  const motorSalePrice = quoteData.motor?.salePrice || quoteData.motor?.price || motorMSRP;
  const motorDiscount = state.frozenPricing?.motorDiscount ?? (motorMSRP - motorSalePrice);
  
  // Calculate every promotion discount through the shared production helper.
  // Matrix rebates remain layered with optional promo financing.
  const basePromoSavings = suppressAdditionalPromoSavings
    ? 0
    : (getTotalPromotionalSavings?.(motorMSRP) || 0);
  const calculatedPromoSavings = suppressAdditionalPromoSavings
    ? 0
    : (getPromotionSavingsForMotor?.(hp, motorMSRP) || 0);
  const promoSavings = suppressAdditionalPromoSavings
    ? 0
    : (state.frozenPricing?.promoSavings ?? calculatedPromoSavings);

  // Live (non-frozen) values for stale-quote comparison
  const liveMotorMSRP = quoteData.motor?.msrp || quoteData.motor?.basePrice || 0;
  const livePromoSavings = suppressAdditionalPromoSavings
    ? 0
    : (getPromotionSavingsForMotor?.(hp, liveMotorMSRP) || 0);
  
  const selectedOptionsTotal = (state.selectedOptions || []).reduce((sum, opt) => sum + opt.price, 0);
  
  // Preserve the internal baseline package ID for calculation and saved-quote
  // compatibility without exposing package tiers in the customer journey.
  const selectedPackage = state.selectedPackage?.id || 'good';
  const selectedPackageLabel = state.selectedPackage?.label || 'Configured Quote';
  
  // Get coverage years for selected package
  const selectedPackageCoverageYears = useMemo(() => {
    if (state.warrantyConfig?.totalYears) return state.warrantyConfig.totalYears;
    return currentCoverageYears;
  }, [state.warrantyConfig?.totalYears, currentCoverageYears]);

  // Build accessory breakdown
  const accessoryBreakdown = useMemo(() => {
    return buildAccessoryBreakdown({
      selectedOptions: state.selectedOptions,
      motor,
      boatInfo: state.boatInfo,
      purchasePath: state.purchasePath,
      installConfig: state.installConfig,
      looseMotorBattery: state.looseMotorBattery,
      selectedPackage,
      adminCustomItems: state.adminCustomItems || [],
      warrantyConfig: state.warrantyConfig,
      tradeInInfo: state.tradeInInfo,
    });
  }, [state.selectedOptions, motor, state.boatInfo, state.purchasePath, state.installConfig, state.looseMotorBattery, selectedPackage, state.adminCustomItems, state.warrantyConfig, state.tradeInInfo]);
  const resolvedPropellerDecision = resolvePropellerDecision({
    hp,
    installConfig: state.installConfig,
    boatInfo: state.boatInfo,
    tradeInInfo: state.tradeInInfo,
  });

  // Calculate quote totals
  const packageSpecificTotals = useMemo(() => {
    const accessoryTotal = accessoryBreakdown.reduce((sum, item) => sum + item.price, 0);
    return calculateQuotePricing({
      motorMSRP,
      motorDiscount,
      adminDiscount: state.adminDiscount || 0,
      accessoryTotal,
      warrantyPrice: 0,
      promotionalSavings: promoSavings,
      tradeInValue: resolveAppliedTradeValue(state.tradeInInfo),
      taxRate: 0.13
    });
  }, [motorMSRP, motorDiscount, state.adminDiscount, accessoryBreakdown, promoSavings, state.tradeInInfo]);

  // When frozenPricing exists with full totals, use those for display
  // to guarantee PDF ↔ web parity. Live recalc is only for stale-quote comparison.
  const displayPricing = useMemo(() => {
    if (state.frozenPricing?.subtotal != null && state.frozenPricing?.total != null) {
      return {
        ...packageSpecificTotals,
        appliedTradeCredit: state.frozenPricing.appliedTradeCredit ?? packageSpecificTotals.appliedTradeCredit,
        subtotal: state.frozenPricing.subtotal,
        tax: state.frozenPricing.hst ?? Math.round(state.frozenPricing.subtotal * 0.13 * 100) / 100,
        total: state.frozenPricing.total,
        savings: state.frozenPricing.savings ?? packageSpecificTotals.savings,
      };
    }
    return packageSpecificTotals;
  }, [packageSpecificTotals, state.frozenPricing]);

  // Live total for stale-quote comparison (always calculated from current data, ignoring frozen)
  const liveTotalForComparison = useMemo(() => {
    if (!state.frozenPricing) return 0;
    const liveMSRP = liveMotorMSRP;
    const liveSalePrice = quoteData.motor?.salePrice || quoteData.motor?.price || liveMSRP;
    const liveDiscount = liveMSRP - liveSalePrice;
    const accessoryTotal = accessoryBreakdown.reduce((sum, item) => sum + item.price, 0);
    const result = calculateQuotePricing({
      motorMSRP: liveMSRP,
      motorDiscount: liveDiscount,
      adminDiscount: state.adminDiscount || 0,
      accessoryTotal,
      warrantyPrice: 0,
      promotionalSavings: livePromoSavings,
      tradeInValue: resolveAppliedTradeValue(state.tradeInInfo),
      taxRate: 0.13
    });
    return result.total;
  }, [state.frozenPricing, liveMotorMSRP, livePromoSavings, accessoryBreakdown, state.adminDiscount, state.tradeInInfo, quoteData.motor]);


  // Note: calculateRunningTotal doesn't model promotion-level discounts (discount_fixed_amount,
  // discount_percentage), those are only applied in the summary page via getTotalPromotionalSavings.
  // We subtract basePromoSavings from the effective price to align the two systems, then compare.
  useEffect(() => {
    if (import.meta.env.DEV && motor) {
      const effectiveMotorPrice = (motorMSRP || 0) - motorDiscount - basePromoSavings;

      // Build package-aware options to match what buildAccessoryBreakdown produces
      const augmentedOptions = [...(state.selectedOptions || [])];

      // Propeller allowance (added by breakdown when motor doesn't include prop)
      if (!includesProp && propAllowance && resolvedPropellerDecision === 'include_allowance') {
        augmentedOptions.push({ optionId: 'prop-allowance', name: propAllowance.name, price: propAllowance.price, category: 'propeller', assignmentType: 'required' as const, isIncluded: false });
      }

      // Premium package auto-adds fuel tank if none selected
      const hasAnyFuelTank = (state.selectedOptions || []).some(
        o => o.name?.toLowerCase().includes('fuel tank')
      );
      if (selectedPackage === 'best' && canAddFuelTank && !hasAnyFuelTank) {
        augmentedOptions.push({ optionId: 'pkg-fuel-tank', name: '12L External Fuel Tank & Hose', price: 199, category: 'fuel', assignmentType: 'required' as const, isIncluded: false });
      }

      const check = calculateRunningTotal(
        { price: effectiveMotorPrice, model: motor.model, hp: hp },
        {
          selectedOptions: augmentedOptions,
          controlsOption: state.boatInfo?.controlsOption,
          purchasePath: state.purchasePath,
          installationCost: state.installConfig?.installationCost,
          tankSize: state.fuelTankConfig?.tankSize,
          tankCost: state.fuelTankConfig?.tankCost,
          wantsBattery: state.looseMotorBattery?.wantsBattery,
          batteryCost: state.looseMotorBattery?.batteryCost,
          warrantyPrice: state.warrantyConfig?.warrantyPrice || 0,
          warrantyTotalYears: state.warrantyConfig?.totalYears,
          tradeInValue: resolveAppliedTradeValue(state.tradeInInfo),
          hasTradeIn: state.tradeInInfo?.hasTradeIn,
          adminCustomItems: state.adminCustomItems,
          adminDiscount: state.adminDiscount,
          selectedPromoOption: state.selectedPromoOption,
          getRebateForHP,
        }
      );
      if (Math.abs(check.total - packageSpecificTotals.total) > 1) {
        console.warn('[PRICING DRIFT]', { runningTotal: check.total, summaryPage: packageSpecificTotals.total, diff: check.total - packageSpecificTotals.total });
      }
    }
  }, [packageSpecificTotals.total, motor, motorMSRP, motorDiscount, basePromoSavings, hp,
      state.selectedOptions, state.boatInfo?.controlsOption, state.purchasePath,
      state.installConfig?.installationCost, resolvedPropellerDecision,
      state.fuelTankConfig?.tankSize, state.fuelTankConfig?.tankCost,
      state.looseMotorBattery?.wantsBattery, state.looseMotorBattery?.batteryCost,
      state.warrantyConfig?.warrantyPrice, state.warrantyConfig?.totalYears,
      state.tradeInInfo?.estimatedValue, state.adminCustomItems, state.adminDiscount,
      state.selectedPromoOption, getRebateForHP, includesProp, propAllowance, selectedPackage,
      canAddFuelTank]);

  const financingDealerFee = state.frozenPricing?.dealerFee ?? state.pdfSnapshot?.financing?.dealerFee ?? DEALERPLAN_FEE;
  const amountToFinance = Math.round((displayPricing.total + financingDealerFee) * 100) / 100;
  const isCashPurchase = state.selectedPaymentMethod === 'cash_purchase';
  // If the customer opted in to promotional financing on PromoSelectionPage,
  // use that rate/term for the monthly payment displayed in the summary.
  // Otherwise fall back to the TD "Always On" promo rate (unchanged).
  const {
    rate: effectiveRate,
    term: effectiveTerm,
    usesSpecialFinancing: usePromoFinancing,
  } = resolveSelectedPromotionFinancing({
    selectedPromoOption: state.selectedPromoOption,
    selectedPromoRate: state.selectedPromoRate,
    selectedPromoTerm: state.selectedPromoTerm,
    specialFinancingOption: getPromotionOptions().find(option => option.id === 'special_financing'),
    amount: amountToFinance,
    standingRate: promo?.rate,
  });
  const { payment: monthlyPayment, termMonths, rate: financingRate } = calculateMonthlyPayment(amountToFinance, effectiveRate, effectiveTerm);

  const quoteValidUntil = useMemo(() => {
    return resolveQuoteValidUntil({
      frozenExpiry: state.frozenPricing?.quoteExpiryDate,
      snapshotExpiry: state.pdfSnapshot?.validUntil,
      promotionEndDate: appliedPromotion?.end_date,
    });
  }, [appliedPromotion?.end_date, state.frozenPricing?.quoteExpiryDate, state.pdfSnapshot?.validUntil]);

  const pdfSnapshot = useMemo<QuotePdfSnapshot>(() => {
    if (hasCompleteFrozenQuoteSnapshot(state.frozenPricing, state.pdfSnapshot)) return state.pdfSnapshot!;
    const frozen = state.frozenPricing;
    const existing = state.pdfSnapshot;
    const paymentMethod = frozen?.selectedPaymentMethod ?? state.selectedPaymentMethod ?? existing?.paymentMethod;
    const financingAmortization = frozen?.financingAmortizationMonths ?? termMonths;
    const financingApr = frozen?.financingRate ?? financingRate;
    const financingAmount = frozen?.amountFinanced ?? amountToFinance;
    const financingDealerFee = frozen?.dealerFee ?? existing?.financing?.dealerFee ?? DEALERPLAN_FEE;
    const planPrice = state.warrantyConfig?.warrantyPrice || 0;
    const canShowFinancing = paymentMethod !== 'cash_purchase' && displayPricing.subtotal >= FINANCING_MINIMUM;
    const selectedPromoValue = frozen?.selectedPromoValue
      ?? state.selectedPromoValue
      ?? getPromoDisplayValue(state.selectedPromoOption, Number(hp));

    return {
      version: QUOTE_PDF_SNAPSHOT_VERSION,
      createdAt: state.pdfSnapshot?.createdAt || new Date().toISOString(),
      validUntil: quoteValidUntil.toISOString(),
      motor: {
        model: motorName,
        hp: Number(hp),
        msrp: motorMSRP,
        modelYear: Number(modelYear || 2026),
        category: motor?.category || 'FourStroke',
        imageUrl: imageUrl || undefined,
      },
      pricing: {
        msrp: motorMSRP,
        discount: motorDiscount,
        adminDiscount: state.adminDiscount || 0,
        promoValue: promoSavings,
        motorSubtotal: motorMSRP - motorDiscount - (state.adminDiscount || 0) - promoSavings,
        subtotal: displayPricing.subtotal,
        hst: displayPricing.tax,
        totalCashPrice: displayPricing.total,
        savings: motorDiscount + (state.adminDiscount || 0) + promoSavings,
      },
      accessoryBreakdown,
      purchasePath: state.purchasePath === 'installed' ? 'installed' : 'loose',
      ...(state.tradeInInfo?.hasTradeIn && resolveAppliedTradeValue(state.tradeInInfo) > 0 && state.tradeInInfo?.brand ? {
        tradeInValue: displayPricing.appliedTradeCredit ?? resolveAppliedTradeValue(state.tradeInInfo),
        tradeInInfo: {
          brand: state.tradeInInfo.brand,
          year: Number(state.tradeInInfo.year),
          horsepower: Number(state.tradeInInfo.horsepower),
          model: state.tradeInInfo.model || undefined,
        },
      } : {}),
      includedCoverageYears: currentCoverageYears,
      ...(state.warrantyConfig && planPrice > 0 && (state.warrantyConfig.extendedYears > 0 || (state.warrantyConfig.goldUpgradePrice || 0) > 0) ? {
        productProtection: {
          planYears: state.warrantyConfig.extendedYears,
          totalCoverageYears: state.warrantyConfig.totalYears,
          priceBeforeTax: planPrice,
          promoGoldYears: state.warrantyConfig.promoGoldYears,
          goldUpgradeYears: state.warrantyConfig.goldUpgradeYears,
          goldUpgradePrice: state.warrantyConfig.goldUpgradePrice,
          platinumExtensionYears: state.warrantyConfig.platinumExtensionYears ?? state.warrantyConfig.extendedYears,
          platinumExtensionPrice: state.warrantyConfig.platinumExtensionPrice,
          ...(canShowFinancing ? {
            monthlyDelta: calculateProtectionMonthlyDelta({
              priceBeforeTax: planPrice,
              annualRate: financingApr,
              amortizationMonths: financingAmortization,
            }),
          } : {}),
        },
      } : {}),
      ...(canShowFinancing ? {
        financing: buildQuotePdfFinancing({
          amountFinanced: financingAmount,
          rate: financingApr,
          amortizationMonths: financingAmortization,
          contractTermMonths: frozen?.financingContractTermMonths,
          paymentMethod,
          dealerFee: financingDealerFee,
          downPayment: state.financing.downPayment,
        }),
      } : {}),
      paymentMethod,
      promotion: {
        name: frozen ? (frozen.promotionName ?? existing?.promotion?.name) : appliedPromotion?.name,
        endDate: frozen ? (frozen.promotionEndDate ?? existing?.promotion?.endDate) : (appliedPromotion?.end_date ?? undefined),
        combinationMode: frozen ? (frozen.promotionCombinationMode ?? existing?.promotion?.combinationMode) : appliedPromotion?.promo_options?.type,
        selectedOption: frozen?.selectedPromoOption ?? state.selectedPromoOption,
        selectedValue: selectedPromoValue,
      },
      customerNotes: state.customerNotes || undefined,
    };
  }, [
    accessoryBreakdown,
    amountToFinance,
    currentCoverageYears,
    appliedPromotion,
    displayPricing.subtotal,
    displayPricing.tax,
    displayPricing.total,
    financingRate,
    hp,
    imageUrl,
    modelYear,
    motor?.category,
    motorDiscount,
    motorMSRP,
    motorName,
    promoSavings,
    quoteValidUntil,
    state.adminDiscount,
    state.customerNotes,
    state.financing.downPayment,
    state.frozenPricing,
    state.pdfSnapshot,
    state.purchasePath,
    state.selectedPaymentMethod,
    state.selectedPromoOption,
    state.selectedPromoValue,
    state.tradeInInfo,
    state.warrantyConfig,
    termMonths,
    getPromoDisplayValue,
  ]);

  const hasFrozenSnapshot = hasCompleteFrozenQuoteSnapshot(state.frozenPricing, state.pdfSnapshot);
  const isQuoteExpired = () => isQuoteSnapshotExpired(pdfSnapshot);
  const isQuoteReady = () => !isQuoteExpired() && (hasFrozenSnapshot || (arePromotionsCurrent() && !promoLoading && !promoError)) && !state.isLoading && Boolean(state.motor)
    && (hasFrozenSnapshot || !requiresCustomProtectionReview(state.warrantyConfig, state.adminCustomItems))
    && JSON.stringify(state.pdfSnapshot) === JSON.stringify(pdfSnapshot);

  const quoteReady = isQuoteReady();

  // OAuth saves must use the same settled snapshot as PDF and reservation actions.
  useAutoSaveQuoteOnAuth(isQuoteReady);

  useEffect(() => {
    if (state.isLoading || (!hasFrozenSnapshot && (promoLoading || promoError)) || !state.motor) return;
    if (JSON.stringify(state.pdfSnapshot) !== JSON.stringify(pdfSnapshot)) {
      dispatch({ type: 'SET_PDF_SNAPSHOT', payload: pdfSnapshot });
    }
  }, [dispatch, pdfSnapshot, hasFrozenSnapshot, promoLoading, promoError, state.isLoading, state.motor, state.pdfSnapshot]);

  // Persist only the synchronized anonymous quote state through the atomic RPC.
  useEffect(() => {
    if (!isQuoteReady() || !isQuotePdfSnapshot(state.pdfSnapshot)) return;

    // Wait until QuoteContext contains the exact derived snapshot rendered on
    // this page. Persisting before SET_PDF_SNAPSHOT lands can save stale totals.
    if (buildSoftLeadSnapshotKey(state.pdfSnapshot) !== buildSoftLeadSnapshotKey(pdfSnapshot)) return;

    const quoteStateSnapshot = state;
    const snapshotKey = buildSoftLeadSnapshotKey(quoteStateSnapshot);

    // Analytics: count the viewed quote once. Subsequent quote changes refresh
    // the saved snapshot without inflating quote-generated reporting.
    if (!softLeadAnalyticsTrackedRef.current) {
      softLeadAnalyticsTrackedRef.current = true;
      trackAgentEvent({
        event_type: 'quote_generated',
        motor_model: quoteStateSnapshot.motor?.model || null,
        motor_hp: quoteStateSnapshot.motor?.hp ?? null,
        motor_id: quoteStateSnapshot.motor?.id ?? null,
      });
    }

    const sessionId = getOrCreateSessionId();
    let cancelled = false;

    void softLeadSaveCoordinator.enqueue({
      sessionId,
      quoteState: quoteStateSnapshot,
      snapshotKey,
    }).then(async () => {
      const referenceNumber = await getSoftLeadReference(sessionId);
      if (!cancelled) {
        setSessionReferenceNumber(referenceNumber);
        setSessionReferenceResolved(true);
      }
    }).catch(() => {
      if (!cancelled) {
        setSessionReferenceNumber(null);
        setSessionReferenceResolved(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [pdfSnapshot, quoteReady, state]);

  // CTA handlers
  const noMotorSelected = !state.motor;

  const handleDownloadPDF = async () => {
    if (!isQuoteReady()) return;
    if (noMotorSelected) {
      toast({ title: 'No motor selected', description: 'Please select a motor before downloading a PDF.', variant: 'destructive' });
      return;
    }
    setIsGeneratingPDF(true);
    
    try {
      const quoteNumber = canonicalReferenceNumber || `HBW-${Date.now().toString().slice(-6)}`;
      const packageTotal = pdfSnapshot.pricing.totalCashPrice;
      
      let qrTargetUrl: string | null = null;
      let savedQuoteIdForSms: string | undefined;
      let savedQuoteRefForSms: string | undefined;
      
      // A resumable QR is shown only after the exact quote state is saved.
      try {
        const frozenPricingSnapshot = frozenPricingFromPdfSnapshot(pdfSnapshot);
        const snapshotKey = JSON.stringify(pdfSnapshot);
        let savedForQr: { id: string; reference_number?: string | null } | null = null;

        // Reuse an already-saved link for an unchanged quote. Anonymous
        // visitors cannot update saved_quotes under RLS, so a changed snapshot
        // gets a new record rather than pointing at stale values.
        if (pdfSavedQuoteRef.current?.snapshotKey === snapshotKey) {
          savedForQr = {
            id: pdfSavedQuoteRef.current.id,
            reference_number: pdfSavedQuoteRef.current.referenceNumber,
          };
        }

        if (!savedForQr) {
          // Anonymous visitors may INSERT saved_quotes but cannot SELECT the
          // row back under RLS. Generate the UUID client-side so a successful
          // insert is enough to build the resumable URL without requesting a
          // representation that the SELECT policy correctly blocks.
          const savedQuoteId = crypto.randomUUID();
          const { error: insertError } = await supabase
            .from('saved_quotes')
            .insert({
              id: savedQuoteId,
              email: state.customerEmail || 'pdf-download@placeholder.com',
              resume_token: `qr_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`,
              quote_state: {
                ...state,
                frozenPricing: frozenPricingSnapshot,
                pdfSnapshot,
                ...(depositPolicySnapshot
                  ? { [DEPOSIT_POLICY_QUOTE_STATE_KEY]: depositPolicySnapshot }
                  : {}),
                ...(canonicalReferenceNumber ? { reference_number: canonicalReferenceNumber } : {}),
              } as any,
              user_id: user?.id || null,
              expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            } as any);
          if (insertError) throw insertError;
          savedForQr = { id: savedQuoteId };
        }

        if (savedForQr?.id) {
          pdfSavedQuoteRef.current = {
            id: savedForQr.id,
            referenceNumber: savedForQr.reference_number || undefined,
            snapshotKey,
          };
          qrTargetUrl = `${SITE_URL}/quote/saved/${savedForQr.id}`;
          savedQuoteIdForSms = savedForQr.id;
          savedQuoteRefForSms = canonicalReferenceNumber || savedForQr.reference_number || undefined;
        }
      } catch (qrSaveErr) {
        console.warn('Could not save quote for QR code:', qrSaveErr);
      }
      
      let savedQuoteQrCode: string | undefined;
      try {
        savedQuoteQrCode = await generateSavedQuoteQrCode(qrTargetUrl);
      } catch (error) {
        console.error('QR code generation failed:', error);
      }
      
      const pdfData = {
        quoteNumber,
        customerName: state.customerName || 'Valued Customer',
        customerEmail: state.customerEmail || '',
        customerPhone: state.customerPhone || '',
        snapshot: pdfSnapshot,
        savedQuoteQrCode,
        recommendedDepositAmount: depositAmount,
        depositPolicySnapshot,
        reservationRequiresConfirmation: depositPolicySnapshot?.policyCode === 'special_order_until_written_approval',
        googleRating,
        googleReviewCount,
        promotionalFinancingAlternative: (() => {
          if (state.selectedPaymentMethod === 'special_financing') return undefined;
          if (displayPricing.subtotal < FINANCING_MINIMUM) return undefined;
          const promotionalFinancing = getPromotionOptions()
            .find((option) => option.id === 'special_financing');
          if (
            !meetsPromotionFinancingMinimum(promotionalFinancing, amountToFinance)
          ) {
            return undefined;
          }
          const promotionalRate = promotionalFinancing?.rates?.[0];
          if (!promotionalRate) return undefined;
          return {
            rate: promotionalRate.rate,
            termMonths: promotionalRate.months,
          };
        })(),
      };
      
      // Save a CRM lead only when the quote has a real, contactable customer.
      // Anonymous downloads remain represented by saved_quotes + activity
      // tracking without inventing placeholder CRM identities.
      if (hasIdentifiedPdfCustomer({ name: state.customerName, email: state.customerEmail })) {
        try {
          const { saveLead } = await import('@/lib/leadCapture');
          await saveLead({
            motor_model: quoteData.motor?.model,
            motor_hp: quoteData.motor?.hp,
            base_price: displayPricing.subtotal,
            final_price: packageTotal,
            customer_name: state.customerName,
            customer_email: state.customerEmail,
            customer_phone: state.customerPhone || undefined,
            lead_status: 'downloaded',
            lead_source: 'pdf_download',
            quote_data: {
              ...quoteData,
              ...(canonicalReferenceNumber ? { reference_number: canonicalReferenceNumber } : {}),
            }
          });
        } catch (leadError) {
          console.error('Failed to save identified PDF lead:', leadError);
        }
      }
      
      const { generateQuotePDF, downloadPDF } = await import('@/lib/react-pdf-generator');
      const pdfUrl = await generateQuotePDF(pdfData);
      await downloadPDF(pdfUrl, `Mercury-Quote-${quoteNumber}.pdf`);
      
      // Notify admin via SMS about the PDF download
      try {
        const customerLabel = state.customerName || state.customerEmail || 'Anonymous visitor';
        const tradeInNote = state.tradeInInfo?.hasTradeIn 
          ? ` | Trade-in: ${state.tradeInInfo.year || ''} ${state.tradeInInfo.brand || ''} ${state.tradeInInfo.horsepower || ''}HP`
          : '';
        const promoNote = state.selectedPromoOption ? ` | Promo: ${state.selectedPromoOption}` : '';
        const refNote = savedQuoteRefForSms ? `\nRef: ${savedQuoteRefForSms}` : '';
        const quoteLink = savedQuoteIdForSms ? `\nView: https://www.mercuryrepower.ca/quote/saved/${savedQuoteIdForSms}` : '';
        const smsMessage = `👀 Quote Downloaded!${refNote}\n${customerLabel}\n${hp}HP ${motorName}\nTotal: $${packageTotal.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}${tradeInNote}${promoNote}${quoteLink}`;
        
        await supabase.functions.invoke('send-sms', {
          body: { to: 'admin', message: smsMessage }
        });
      } catch (smsErr) {
        console.warn('Admin SMS notification failed:', smsErr);
      }
      
    } catch (error) {
      console.error('PDF generation error:', error);
      const detail = error instanceof Error ? error.message : String(error);
      toast({
        title: "PDF generation failed",
        description: `Please try again. If this keeps happening, share this with support: ${detail}`,
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleApplyForFinancing = () => {
    if (!isQuoteReady() || isQuoteSnapshotExpired(pdfSnapshot)) return;
    const purchase = calculateFinancingPurchase({
      afterTradeSubtotal: displayPricing.subtotal,
      preTradeSubtotal: displayPricing.subtotal + (displayPricing.appliedTradeCredit ?? 0),
      estimatedValue: state.tradeInInfo?.estimatedValue,
      hasTradeIn: state.tradeInInfo?.hasTradeIn,
      dealerFee: financingDealerFee,
      frozenTotal: displayPricing.total,
    });
    const financingData = {
      ...state,
      ...(hasFrozenSnapshot ? {
        selectedPromoOption: pdfSnapshot.promotion?.selectedOption ?? null,
        selectedPromoValue: pdfSnapshot.promotion?.selectedValue ?? null,
        promotionName: pdfSnapshot.promotion?.name ?? null,
        promotionCombinationMode: pdfSnapshot.promotion?.combinationMode ?? null,
      } : {}),
      financingAmount: {
        packageSubtotal: displayPricing.subtotal,
        hst: purchase.tax,
        financingFee: financingDealerFee,
        totalWithFees: purchase.motorPrice,
        motorModel: quoteData.motor?.model || motorName,
        packageName: selectedPackageLabel,
        tradeInValue: purchase.tradeInValue,
        includedTradeInValue: purchase.includedTradeInValue,
        preTradeSubtotal: purchase.preTradeSubtotal,
        priceBasis: FINANCING_PRICE_BASIS_ALL_IN_AFTER_TRADE,
        // Include promo details for financing application
        promoOption: hasFrozenSnapshot ? pdfSnapshot.promotion?.selectedOption : state.selectedPromoOption,
        promoRate: hasFrozenSnapshot ? pdfSnapshot.financing?.rate : (state.frozenPricing?.financingRate ?? state.selectedPromoRate),
        promoTerm: hasFrozenSnapshot ? pdfSnapshot.financing?.amortizationMonths : (state.frozenPricing?.financingAmortizationMonths ?? state.selectedPromoTerm),
        promoValue: hasFrozenSnapshot ? pdfSnapshot.promotion?.selectedValue : state.selectedPromoValue,
        promoName: pdfSnapshot.promotion?.name || null,
        promoSavings: hasFrozenSnapshot ? pdfSnapshot.pricing.promoValue : promoSavings,
        promoCombinationMode: pdfSnapshot.promotion?.combinationMode || null,
      }
    };
    
    localStorage.setItem('quote_state', JSON.stringify(financingData));
    navigate('/financing/apply');
  };

  // Open the deposit info dialog (replaces direct payment flow)
  const [depositRail, setDepositRail] = useState<'hosted' | 'assistant'>('hosted');
  const nativeParentRef = state.uiFlags?.[UCP_CHECKOUT_REF_FLAG];
  const canUseAssistantDeposit = import.meta.env.VITE_NATIVE_DEPOSIT_ENABLED === 'true'
    && typeof nativeParentRef === 'string' && /^chk_[A-Za-z0-9._-]{1,120}$/.test(nativeParentRef) && Boolean(user);
  const handleReserveDeposit = () => {
    if (!isQuoteReady() || isQuoteSnapshotExpired(pdfSnapshot)) return;
    setDepositRail('hosted');
    if (!depositPolicySnapshot) {
      toast({
        title: 'Reservation terms unavailable',
        description: 'The reservation terms could not be verified. Please refresh and try again.',
        variant: 'destructive',
      });
      return;
    }
    trackEvent('quote_deposit_dialog_opened', {
      motor_hp: hp,
      deposit_amount: depositAmount,
      device: window.innerWidth < 1024 ? 'mobile_or_tablet' : 'desktop',
    });
    setShowDepositDialog(true);
  };

  const callHref = `tel:${COMPANY_INFO.contact.phone.replace(/\D/g, '')}`;
  const smsMessage = canonicalReferenceNumber
    ? `Hi, I'm looking at quote ${canonicalReferenceNumber} (${motorName}, $${displayPricing.total.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CAD).`
    : '';
  const smsHref = canonicalReferenceNumber
    ? `sms:${COMPANY_INFO.contact.sms.replace(/\D/g, '')}?body=${encodeURIComponent(smsMessage)}`
    : `sms:${COMPANY_INFO.contact.sms.replace(/\D/g, '')}`;

  const handleContactClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    eventName: 'phone_click' | 'sms_click',
  ) => {
    event.stopPropagation();
    const eventData = {
      location: 'quote_summary',
      reference_number: canonicalReferenceNumber,
      motor_model: motorName,
      quote_total: displayPricing.total,
    };
    // GlobalCtaTracker owns GA4 handoffs; this handler records first-party activity.
    const activityPayload = {
      session_id: getOrCreateSessionId(),
      user_id: user?.id ?? null,
      event_type: eventName,
      motor_model: motorName,
      motor_hp: Number(hp),
      quote_value: displayPricing.total,
      event_data: eventData,
      page_path: '/quote/summary',
    };
    const supabaseUrl = (supabase as any).supabaseUrl;
    const supabaseKey = (supabase as any).supabaseKey;
    void fetch(`${supabaseUrl}/rest/v1/quote_activity_events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(activityPayload),
      keepalive: true,
    }).catch(() => {});
  };

  // Handle deposit after customer info is collected
  const handleDepositSubmit = async (customerInfo: DepositCustomerInfo) => {
    if (!isQuoteReady() || isQuoteSnapshotExpired(pdfSnapshot)) return;
    setShowDepositDialog(false);
    setIsProcessingDeposit(true);
    try {
      const identity = parseDepositIdentity(customerInfo);
      const customerPatch = quoteStateCustomerPatch(identity);
      const quoteNumber = canonicalReferenceNumber || `HBW-${Date.now().toString().slice(-6)}`;
      const savedQuoteId = crypto.randomUUID();
      const resumeTokenEntropy = crypto.getRandomValues(new Uint8Array(12));
      const resumeToken = `dep_${Array.from(
        resumeTokenEntropy,
        (byte) => byte.toString(16).padStart(2, '0'),
      ).join('')}`;
      if (!depositPolicySnapshot) {
        throw new Error('The reservation terms could not be verified. Please refresh and try again.');
      }
      const quoteStateSnapshot = {
        ...state,
        ...customerPatch,
        frozenPricing: frozenPricingFromPdfSnapshot(pdfSnapshot),
        pdfSnapshot,
        [DEPOSIT_POLICY_QUOTE_STATE_KEY]: depositPolicySnapshot,
      };
      
      const basePdfData = {
        quoteNumber,
        customerName: identity.fullName,
        customerEmail: identity.email,
        customerPhone: identity.phone,
        customerAddress: formatDepositAddress(identity.address),
        snapshot: pdfSnapshot,
        recommendedDepositAmount: depositAmount,
        depositPolicySnapshot,
        reservationRequiresConfirmation: depositPolicySnapshot.policyCode === 'special_order_until_written_approval',
      };

      // Persist identity/address before the immutable PDF is bound.
      const { error: sqError } = await supabase
        .from('saved_quotes')
        .insert({
          id: savedQuoteId,
          email: identity.email,
          resume_token: resumeToken,
          quote_state: {
            ...quoteStateSnapshot,
            ...(canonicalReferenceNumber ? { reference_number: canonicalReferenceNumber } : {}),
          } as any,
          user_id: user?.id || null,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          quote_pdf_path: null,
          deposit_pdf_path: null,
          deposit_status: 'pending',
          deposit_amount: depositAmount,
          ...savedQuoteIdentityColumns(identity),
        } as any);
      if (sqError) {
        throw new Error('Could not prepare this motor reservation. Please try again.');
      }

      // Store the customer document through the server-authorized private
      // document boundary before creating a usable Stripe checkout.
      const { generatePDFBlob } = await import('@/lib/react-pdf-generator');
      const quotePdf = await generatePDFBlob(basePdfData);
      const { data: quoteDocument, error: quoteDocumentError } = await supabase.functions.invoke(
        'quote-document-api',
        {
          body: quotePdf,
          headers: {
            'Content-Type': 'application/pdf',
            'x-saved-quote-id': savedQuoteId,
            'x-resume-token': resumeToken,
          },
        },
      );
      if (quoteDocumentError || quoteDocument?.success !== true) {
        throw new Error('Could not securely store this quote. Please try again.');
      }

      if (depositRail === 'assistant') {
        if (!canUseAssistantDeposit) throw new Error('Sign in and reopen the quote from your assistant before continuing.');
        const { data: child, error: childError } = await supabase.functions.invoke(
          `ucp-checkout/checkout-sessions/${encodeURIComponent(nativeParentRef)}/deposits`, {
            body: { operation: 'motor_reservation', saved_quote_id: savedQuoteId },
          });
        if (childError || !child?.id || !/^ndc_[0-9a-f]{32}$/.test(child.id))
          throw new Error('Your assistant quote changed or expired. Ask for a fresh quote before making a payment.');
        window.location.assign(`/quote/agent-deposit/${child.id}`);
        return;
      }

      // Build full quote snapshot for persistence
      const quoteSnapshot = {
        motor: state.motor ? { id: state.motor.id, model: state.motor.model, hp: state.motor.hp, price: state.motor.price } : null,
        selectedOptions: state.selectedOptions?.map(o => ({ name: o.name, price: o.price })) || [],
        selectedPackage: state.selectedPackage ? { id: state.selectedPackage.id, label: state.selectedPackage.label } : null,
        purchasePath: state.purchasePath,
        tradeIn: state.hasTradein && state.tradeInInfo ? {
          brand: state.tradeInInfo.brand,
          year: state.tradeInInfo.year,
          horsepower: state.tradeInInfo.horsepower,
          condition: state.tradeInInfo.condition,
          engineType: state.tradeInInfo.engineType,
          engineHours: state.tradeInInfo.engineHours,
          estimatedValue: state.tradeInInfo.estimatedValue,
          prePenaltyValue: state.tradeInInfo.prePenaltyValue,
        } : null,
        financing: state.financing,
        warrantyConfig: state.warrantyConfig,
        selectedPromoOption: state.selectedPromoOption,
        boatInfo: state.boatInfo,
        installConfig: state.installConfig,
        adminDiscount: state.adminDiscount || 0,
        customerNotes: state.customerNotes || '',
        ...(canonicalReferenceNumber ? { reference_number: canonicalReferenceNumber } : {}),
      };

      trackAgentEvent({
        event_type: 'deposit_started',
        motor_model: motorName,
        motor_hp: hp,
        quote_value: depositAmount,
      });

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          paymentType: 'deposit',
          depositAmount: String(depositAmount),
          customerInfo: {
            name: identity.fullName,
            email: identity.email,
            phone: identity.phone,
            addressLine1: identity.address.addressLine1,
            addressLine2: identity.address.addressLine2 || '',
            city: identity.address.city,
            region: identity.address.region,
            postalCode: identity.address.postalCode,
            country: identity.address.country,
          },
          quoteData: {
            motorId: state.motor?.id,
            motorModel: motorName,
            horsepower: hp,
            motorPrice: motorSalePrice,
            totalPrice: displayPricing.total,
            ...(canonicalReferenceNumber ? { reference_number: canonicalReferenceNumber } : {}),
          },
          motorInfo: {
            model: motorName,
            hp: hp,
          },
          savedQuoteId,
          quoteSnapshot,
        }
      });

      if (error) throw error;
      if (data?.url) {
        trackEvent('quote_deposit_checkout_created', {
          motor_hp: hp,
          deposit_amount: depositAmount,
        });
        window.location.assign(data.url);
        return;
      }
      throw new Error('Secure checkout did not return a payment link.');
    } catch (error: unknown) {
      console.error('Deposit error');
      toast({
        title: 'Payment Error',
        description: error instanceof Error ? error.message : 'Failed to initiate deposit. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessingDeposit(false);
    }
  };

  // Listen for deposit trigger from UnifiedMobileBar
  useEffect(() => {
    const handleInitiateDeposit = () => {
      handleReserveDeposit();
    };
    window.addEventListener('initiate-deposit', handleInitiateDeposit);
    return () => window.removeEventListener('initiate-deposit', handleInitiateDeposit);
  }, [depositAmount, user, motorName, hp, modelYear, depositPolicySnapshot, quoteReady]);

  // Plain-language inclusions for the configured quote. Product Protection is
  // presented separately and is not bundled into customer-facing package tiers.
  const isInstalled = state.purchasePath === 'installed';
  const selectedPackageFeatures = useMemo(() => {
    return [
      "Mercury motor",
      `${selectedPackageCoverageYears} years total combined Mercury coverage`,
      ...(isInstalled ? ["Professional installation"] : ["Loose motor pickup"])
    ];
  }, [selectedPackageCoverageYears, isInstalled]);

  const handleProductProtectionChange = useCallback((config: QuoteWarrantyConfig) => {
    if (state.frozenPricing) {
      dispatch({ type: 'SET_FROZEN_PRICING', payload: undefined });
    }
    dispatch({ type: 'SET_WARRANTY_CONFIG', payload: config });
    trackEvent('quote_product_protection_changed', {
      motor_hp: Number(hp),
      paid_plan_years: config.extendedYears,
      total_coverage_years: config.totalYears,
      price_cad: config.warrantyPrice,
    });
  }, [dispatch, hp, state.frozenPricing]);

  return (
    <>
      <QuoteSummaryPageSEO
        selectedMotor={
          state.motor
            ? {
                name: (state.motor as any).model_display || state.motor.model || `Mercury ${hp}HP`,
                hp: hp || null,
                family: (state.motor as any).family || null,
                shaft: (state.motor as any).shaft_code || (state.motor as any).shaft || null,
                modelNumber: (state.motor as any).model_number || (state.motor as any).mercury_model_no || null,
                image: (state.motor as any).hero_image_url || (state.motor as any).image_url || null,
                priceCAD: motorSalePrice || null,
                inStock: !!(state.motor as any).in_stock,
              }
            : null
        }
      />
      {/* Deposit Info Dialog */}
      <DepositInfoDialog
        open={quoteReady && showDepositDialog}
        onOpenChange={setShowDepositDialog}
        onSubmit={handleDepositSubmit}
        depositAmount={depositAmount}
        policyText={depositPolicySnapshot
          ? customerPolicyText(depositPolicySnapshot.policyCode)
          : DEPOSIT_POLICY_PUBLIC_SUMMARY}
        defaultValues={{
          name: state.customerName || user?.user_metadata?.full_name || '',
          email: state.customerEmail || user?.email || '',
          phone: state.customerPhone || '',
        }}
        isProcessing={isProcessingDeposit}
      />
      
      {/* Stale Quote Detection */}
      {state.frozenPricing && !promoLoading && !promoError && arePromotionsCurrent() && (
        <StaleQuoteAlert
          frozenPricing={state.frozenPricing}
          liveMotorMSRP={liveMotorMSRP}
          livePromoSavings={livePromoSavings}
          liveTotal={liveTotalForComparison}
          promoEndDate={appliedPromotion?.end_date ?? null}
          onKeepOriginal={() => {/* keep frozen, do nothing */}}
          onUpdatePricing={() => dispatch({ type: 'SET_FROZEN_PRICING', payload: undefined })}
        />
      )}

      <ScrollToTop />
      <PageTransition>
        <QuoteLayout showProgress={!isMotorOnlyExpress}>
          {promoError && !hasFrozenSnapshot ? (
            <div role="alert" className="mx-auto my-12 max-w-xl rounded-xl border border-destructive/30 bg-white p-6">
              <h1 className="text-xl font-semibold">Promotion pricing unavailable</h1>
              <p className="mt-3 text-muted-foreground">We could not verify current rebates and promotional coverage. Retry before saving, downloading or reserving this quote.</p>
              <button type="button" onClick={() => window.location.reload()} className="mt-5 rounded bg-repower-mercury-red px-5 py-3 font-semibold text-white">
                Retry promotion pricing
              </button>
            </div>
          ) : isQuoteExpired() ? (
            <div role="alert" className="mx-auto my-12 max-w-xl rounded-xl border border-repower-mercury-red/30 bg-white p-6">
              <h1 className="text-xl font-semibold">Quote pricing has expired</h1>
              <p className="mt-3 text-muted-foreground">Start a new quote to verify current pricing, rebates and promotional coverage.</p>
              <button type="button" onClick={() => { dispatch({ type: 'RESET_QUOTE' }); navigate('/quote/motor-selection'); }} className="mt-5 rounded bg-repower-mercury-red px-5 py-3 font-semibold text-white">
                Start a new quote
              </button>
            </div>
          ) : !isMounted || !quoteReady ? (
            <QuoteSummarySkeleton />
          ) : (
          <div className="bg-repower-paper">
          <div className="mx-auto w-full max-w-[1100px] px-6 py-12 md:px-8 md:py-16 min-[1180px]:px-0">
            <div className="grid lg:grid-cols-[1fr_440px] gap-12">
              {/* Main Content - Left Column */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">
                    {isMotorOnlyExpress ? 'Your motor-only reservation' : 'Your configured quote'}
                  </p>
                  <p className="text-sm text-muted-foreground lg:hidden">
                    Pricing valid until {formatPromoCalendarDate(quoteValidUntil)}.
                  </p>
                </div>

                {(!referenceNumberResolved || canonicalReferenceNumber) && (
                  <div
                    className="min-h-[92px] border border-repower-navy-900/20 border-l-4 border-l-repower-mercury-red bg-white px-4 py-3 sm:min-h-[68px] sm:px-5"
                    aria-live="polite"
                  >
                    {canonicalReferenceNumber ? (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                        <div className="shrink-0">
                          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-repower-navy-900/60">
                            Your quote number
                          </p>
                          <p className="select-text font-display text-xl font-bold text-repower-navy-900">
                            {canonicalReferenceNumber}
                          </p>
                        </div>
                        <p className="max-w-[34ch] font-sans text-sm leading-snug text-repower-navy-900/70 sm:text-right">
                          Have it handy when you call or text. We can pull this quote up in seconds.
                        </p>
                      </div>
                    ) : (
                      <div className="h-10 animate-pulse bg-repower-navy-900/5" aria-hidden="true" />
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  {isMotorOnlyExpress && (
                    <div className="rounded-[12px] border border-repower-mercury-red/20 bg-white p-5 shadow-sm">
                      <p className="font-display text-xl font-bold text-repower-navy-900">
                        Motor only. No installation or added options.
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-repower-navy-900/65">
                        Review the pickup total below, then reserve this exact motor with a ${depositAmount.toLocaleString()} deposit. HBW confirms availability and ETA before anything is ordered.
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-repower-navy-900/55">
                        {depositPolicySnapshot
                          ? customerPolicyText(depositPolicySnapshot.policyCode)
                          : DEPOSIT_POLICY_PUBLIC_SUMMARY}
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-repower-navy-900/55">
                        {suppressAdditionalPromoSavings
                          ? 'This saved quote retains its original promotional terms. HBW confirms current eligibility and delivery timing before purchase.'
                          : 'Eligible factory rebates and promotional coverage are included in this quote, subject to dealer verification of engine eligibility and delivery timing.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Detailed Pricing Breakdown */}
                <motion.div
                  variants={pricingTableVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <PricingTable
                    pricing={displayPricing}
                    motorName={quoteData.motor?.model || 'Mercury Motor'}
                    accessoryBreakdown={accessoryBreakdown}
                    tradeInValue={displayPricing.appliedTradeCredit ?? resolveAppliedTradeValue(state.tradeInInfo)}
                    tradeInInfo={state.tradeInInfo?.hasTradeIn ? {
                      brand: state.tradeInInfo.brand,
                      year: state.tradeInInfo.year,
                      horsepower: state.tradeInInfo.horsepower,
                      model: state.tradeInInfo.model
                    } : undefined}
                    packageName="Rigging & Installation"
                    includesInstallation={state.purchasePath === 'installed'}
                    onApplyForFinancing={isCashPurchase ? undefined : handleApplyForFinancing}
                    selectedPromoOption={state.selectedPromoOption}
                    selectedPromoValue={getPromoDisplayValue(state.selectedPromoOption, hp)}
                    selectedPaymentMethod={state.selectedPaymentMethod}
                    warrantyPromoYears={promoYears > 0 ? promoYears : undefined}
                    totalCoverageYears={selectedPackageCoverageYears}
                    financingTerms={isCashPurchase ? undefined : {
                      payment: monthlyPayment,
                      rate: financingRate,
                      termMonths,
                      isPromotional: usePromoFinancing,
                    }}
                  />
                </motion.div>

                {!isMotorOnlyExpress && (
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                      ...sectionVariants,
                      visible: {
                        ...sectionVariants.visible,
                        transition: {
                          ...sectionVariants.visible.transition,
                          delay: 0.3,
                        },
                      },
                    }}
                  >
                    <PlatinumProtectionSelector
                      horsepower={Number(hp)}
                      currentCoverageYears={currentCoverageYears}
                      customPricingReview={requiresCustomProtectionReview(state.warrantyConfig, state.adminCustomItems)
                        ? (state.isAdminQuote ? 'staff' : 'customer') : undefined}
                      value={state.warrantyConfig}
                      onChange={handleProductProtectionChange}
                      financing={!isCashPurchase && displayPricing.subtotal >= FINANCING_MINIMUM ? {
                        rate: financingRate,
                        amortizationMonths: termMonths,
                      } : undefined}
                    />
                  </motion.div>
                )}

                {/* Bonus Offers */}
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    ...sectionVariants,
                    visible: {
                      ...sectionVariants.visible,
                      transition: {
                        ...sectionVariants.visible.transition,
                        delay: 0.4
                      }
                    }
                  }}
                >
                  <div className="grid md:grid-cols-2 gap-6">
                    <BonusOffers motor={quoteData.motor} />
                  </div>
                </motion.div>

                {/* Admin Controls - Only visible to admins */}
                {isAdmin && state.isAdminQuote && (
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                      ...sectionVariants,
                      visible: {
                        ...sectionVariants.visible,
                        transition: {
                          ...sectionVariants.visible.transition,
                          delay: 0.5
                        }
                      }
                    }}
                  >
                    <AdminQuoteControls 
                      onSave={() => navigate('/admin/quotes')}
                    />
                  </motion.div>
                )}

                {/* Mobile CTA Section */}
                <div className="lg:hidden space-y-3">
                  <div className="pb-1 text-center font-sans">
                    <p className="text-[13px] font-semibold text-repower-navy-900">Questions about this quote? Talk to a person.</p>
                    {canonicalReferenceNumber && (
                      <p className="mt-1 select-text text-[12px] text-repower-navy-900/60">Quote {canonicalReferenceNumber}</p>
                    )}
                  </div>
                  <a
                    href={callHref}
                    onClick={(event) => handleContactClick(event, 'phone_click')}
                    data-cta-location="quote_summary"
                    className="group flex w-full items-center justify-center rounded bg-repower-mercury-red px-6 py-4 text-center font-sans text-[13px] font-bold uppercase tracking-[0.12em] text-repower-cream transition hover:opacity-90 hover:-translate-y-px hover:shadow-md"
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      Call (905) 342-2153
                      <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                    </span>
                  </a>
                  <a
                    href={smsHref}
                    onClick={(event) => handleContactClick(event, 'sms_click')}
                    data-cta-location="quote_summary"
                    className="group flex w-full items-center justify-center rounded border border-repower-navy-900 bg-transparent px-6 py-4 text-center font-sans text-[13px] font-bold uppercase tracking-[0.12em] text-repower-navy-900 transition hover:bg-repower-navy-900 hover:text-repower-cream"
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      Text This Quote to HBW
                      <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                    </span>
                  </a>
                  <button
                    onClick={handleStepComplete}
                    className="group w-full rounded border border-repower-navy-900 bg-transparent px-6 py-4 font-sans text-[13px] font-bold uppercase tracking-[0.12em] text-repower-navy-900 transition hover:bg-repower-navy-900 hover:text-repower-cream"
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      Have HBW Review My Quote
                      <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                    </span>
                  </button>
                  <div className="flex items-center gap-3 py-1" aria-hidden>
                    <span className="h-px flex-1 bg-repower-navy-900/10" />
                    <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-repower-navy-900/45">
                      Ready to lock it in?
                    </span>
                    <span className="h-px flex-1 bg-repower-navy-900/10" />
                  </div>
                  <button
                    onClick={handleReserveDeposit}
                    disabled={isProcessingDeposit || noMotorSelected || !canReserveMotor}
                    title={noMotorSelected ? 'Select a motor first' : !canReserveMotor ? 'Reservation terms could not be verified' : undefined}
                    className="group w-full rounded border border-repower-navy-900 bg-transparent px-6 py-4 font-sans text-[13px] font-bold uppercase tracking-[0.12em] text-repower-navy-900 transition hover:bg-repower-navy-900 hover:text-repower-cream disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      {isProcessingDeposit
                        ? 'Preparing secure checkout…'
                        : `Reserve this motor, $${depositAmount.toLocaleString()}`
                      }
                      {!isProcessingDeposit && (
                        <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                      )}
                    </span>
                  </button>
                  {canUseAssistantDeposit && <button
                    type="button" disabled={isProcessingDeposit || noMotorSelected || !canReserveMotor}
                    className="w-full rounded border px-6 py-3 text-sm font-medium disabled:opacity-50"
                    onClick={() => { setDepositRail('assistant'); setShowDepositDialog(true); }}>
                    Review this deposit with my assistant
                  </button>}
                  <p className="px-2 text-center font-sans text-[12px] leading-relaxed text-repower-navy-900/60">
                    Secure Stripe checkout. HBW confirms the motor and quote details before anything is ordered.
                  </p>
                  <button
                    onClick={() => user ? setShowSaveDialog(true) : setShowAuthSaveDialog(true)}
                    disabled={noMotorSelected}
                    title={noMotorSelected ? 'Select a motor first' : undefined}
                    className="w-full rounded border border-repower-navy-900/15 bg-transparent px-6 py-4 font-sans text-[13px] font-bold uppercase tracking-[0.12em] text-repower-navy-900 transition hover:border-repower-navy-900/40 disabled:opacity-50"
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      <Bookmark className="w-4 h-4" />
                      Save for Later
                    </span>
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    disabled={isGeneratingPDF || noMotorSelected}
                    title={noMotorSelected ? 'Select a motor first' : undefined}
                    className="w-full rounded border border-repower-navy-900/15 bg-transparent px-6 py-4 font-sans text-[13px] font-bold uppercase tracking-[0.12em] text-repower-navy-900 transition hover:border-repower-navy-900/40 disabled:opacity-50"
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      <Download className="w-4 h-4" />
                      {isGeneratingPDF ? 'PDF' : 'Download PDF'}
                    </span>
                  </button>
                  {!isCashPurchase && displayPricing.subtotal >= FINANCING_MINIMUM && (
                    <button
                      onClick={handleApplyForFinancing}
                      className="w-full rounded border border-repower-navy-900/15 bg-transparent px-6 py-4 font-sans text-[13px] font-bold uppercase tracking-[0.12em] text-repower-navy-900 transition hover:border-repower-navy-900/40"
                    >
                      <span className="inline-flex items-center justify-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Apply for Financing
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Sticky Summary - Right Column (Desktop) */}         
              <div>
                <StickySummary
                  packageLabel="Configured quote"
                  yourPriceBeforeTax={displayPricing.subtotal}
                  totalWithTax={displayPricing.total}
                  totalSavings={displayPricing.savings}
                  monthly={isCashPurchase ? undefined : monthlyPayment}
                  financingTermMonths={isCashPurchase ? undefined : termMonths}
                  financingRate={isCashPurchase ? undefined : financingRate}
                  bullets={selectedPackageFeatures}
                  onReserve={handleReserveDeposit}
                  onReview={handleStepComplete}
                  callHref={callHref}
                  smsHref={smsHref}
                  quoteReference={canonicalReferenceNumber}
                  onCall={(event) => handleContactClick(event, 'phone_click')}
                  onText={(event) => handleContactClick(event, 'sms_click')}
                  depositAmount={depositAmount}
                  coverageYears={selectedPackageCoverageYears}
                  promoWarrantyYears={promoYears > 0 ? promoYears : undefined}
                  onDownloadPDF={handleDownloadPDF}
                  onSaveForLater={() => {
                    if (user) {
                      setShowSaveDialog(true);
                    } else {
                      setShowAuthSaveDialog(true);
                    }
                  }}
                  onApplyForFinancing={!isCashPurchase && displayPricing.subtotal >= FINANCING_MINIMUM ? handleApplyForFinancing : undefined}
                  isGeneratingPDF={isGeneratingPDF}
                  reserveDisabled={!canReserveMotor || noMotorSelected}
                  isProcessingPayment={isProcessingDeposit}
                  quoteValidUntil={quoteValidUntil}
                />
              </div>
            </div>
          </div>
          </div>
          )}
          
          <SaveQuoteDialog 
            open={quoteReady && showSaveDialog}
            onOpenChange={setShowSaveDialog}
            canSave={isQuoteReady}
            quoteData={{
              ...state,
              frozenPricing: frozenPricingFromPdfSnapshot(pdfSnapshot),
              pdfSnapshot,
              ...(canonicalReferenceNumber ? { reference_number: canonicalReferenceNumber } : {}),
            }}
            motorModel={motorName}
            finalPrice={displayPricing.total}
          />
          <SaveQuoteWithAuth
            open={quoteReady && showAuthSaveDialog}
            onOpenChange={setShowAuthSaveDialog}
            onFallbackEmail={() => {
              setShowAuthSaveDialog(false);
              setShowSaveDialog(true);
            }}
          />
          <PhoneCapture
            open={showPhoneCapture}
            onOpenChange={setShowPhoneCapture}
            savedQuoteId={phoneCaptureQuoteId}
          />
        </QuoteLayout>
      </PageTransition>
    </>
  );
}
