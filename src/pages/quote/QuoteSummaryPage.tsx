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
import { getRecommendedDeposit } from '@/lib/deposit';
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
import { CreditCard } from 'lucide-react';
import { computeTotals, calculateMonthlyPayment, getFinancingTerm, DEALERPLAN_FEE, FINANCING_MINIMUM } from '@/lib/finance';
import { calculateQuotePricing, getFinanceableAmount, promoEndOfDay } from '@/lib/quote-utils';
import { supabase } from '@/integrations/supabase/client';
import { useActiveFinancingPromo } from '@/hooks/useActiveFinancingPromo';
import { useActivePromotions } from '@/hooks/useActivePromotions';
import { useGoogleReviewStats } from '@/hooks/useGoogleReviewStats';
import { useToast } from '@/hooks/use-toast';
import { Download } from 'lucide-react';
import { SITE_URL } from '@/lib/site';
import { generateSavedQuoteQrCode } from '@/lib/saved-quote-qr';
import { hasIdentifiedPdfCustomer } from '@/lib/pdf-lead-tracking';
import { QuoteSummaryPageSEO } from '@/components/seo/QuoteSummaryPageSEO';
import { trackAgentEvent } from '@/lib/agentEvents';
import { trackEvent } from '@/lib/analytics';
import {
  reconcileWarrantyConfig,
  type QuoteWarrantyConfig,
} from '@/lib/quote-product-protection';
import {
  buildQuotePdfFinancing,
  calculateProtectionMonthlyDelta,
  frozenPricingFromPdfSnapshot,
  QUOTE_PDF_SNAPSHOT_VERSION,
  resolveQuoteMotorImage,
  type QuotePdfSnapshot,
} from '@/lib/quote-pdf-data';

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
  const { user, isAdmin } = useAuth();
  const { promo } = useActiveFinancingPromo();
  const { promotions, loading: promoLoading, getWarrantyPromotions, getTotalWarrantyBonusYears, getTotalPromotionalSavings, getPromotionSavingsForMotor, getPromotionOptions, getRebateForHP, getSpecialFinancingRates } = useActivePromotions();
  const { rating: googleRating, totalReviews: googleReviewCount } = useGoogleReviewStats();
  const { toast } = useToast();
  const baseCoverageYears = 3;
  const promoYears = getTotalWarrantyBonusYears?.() ?? 0;
  const currentCoverageYears = useMemo(
    () => Math.min(baseCoverageYears + promoYears, 8),
    [promoYears],
  );
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
  const isMounted = true; // Render immediately, no artificial delay
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showAuthSaveDialog, setShowAuthSaveDialog] = useState(false);
  const [showPhoneCapture, setShowPhoneCapture] = useState(false);
  const [phoneCaptureQuoteId, setPhoneCaptureQuoteId] = useState<string | undefined>();
  const pdfSavedQuoteRef = useRef<{
    id: string;
    referenceNumber?: string;
    snapshotKey: string;
  } | null>(null);
  
  // Auto-save quote when returning from Google OAuth
  useAutoSaveQuoteOnAuth();

  // Silent soft-lead save, auto-persist quote snapshot for anonymous visitors
  const latestQuoteStateRef = useRef(state);
  const softLeadAnalyticsTrackedRef = useRef(false);
  useEffect(() => {
    latestQuoteStateRef.current = state;
  }, [state]);
  const softLeadSnapshotRef = useRef<string | null>(null);
  useEffect(() => {
    if (state.isLoading || !state.motor) return;
    const snapshotKey = [
      state.motor.id,
      state.warrantyConfig?.extendedYears ?? 0,
      state.warrantyConfig?.warrantyPrice ?? 0,
      state.warrantyConfig?.totalYears ?? currentCoverageYears,
      state.pdfSnapshot?.createdAt ?? 'snapshot-pending',
    ].join(':');
    if (softLeadSnapshotRef.current === snapshotKey) return;
    softLeadSnapshotRef.current = snapshotKey;
    const quoteStateSnapshot = latestQuoteStateRef.current;

    // Analytics: count the viewed quote once. Warranty changes still refresh
    // the saved snapshot below without inflating quote-generated reporting.
    if (!softLeadAnalyticsTrackedRef.current) {
      softLeadAnalyticsTrackedRef.current = true;
      trackAgentEvent({
        event_type: 'quote_generated',
        motor_model: quoteStateSnapshot.motor?.model || null,
        motor_hp: (quoteStateSnapshot.motor as any)?.hp ?? (quoteStateSnapshot.motor as any)?.horsepower ?? null,
        motor_id: quoteStateSnapshot.motor?.id ?? null,
      });
    }

    const sessionId = getOrCreateSessionId();
    (async () => {
      try {
        // Check if a soft-lead already exists for this session
        const { data: existing } = await (supabase as any)
          .from('saved_quotes')
          .select('id')
          .eq('session_id', sessionId)
          .eq('is_soft_lead', true)
          .maybeSingle();

        if (existing) {
          // Update the existing soft lead with latest state
          await (supabase as any)
            .from('saved_quotes')
            .update({ quote_state: quoteStateSnapshot as any, updated_at: new Date().toISOString() })
            .eq('id', existing.id);
        } else {
          // Create new soft-lead record
          await (supabase as any)
            .from('saved_quotes')
            .insert({
              email: 'anonymous@soft-lead.local',
              resume_token: `sl_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`,
              quote_state: quoteStateSnapshot as any,
              user_id: user?.id || null,
              session_id: sessionId,
              is_soft_lead: true,
              expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            } as any);
        }
      } catch {
        // Silently fail, analytics should never break the app
      }
    })();
  }, [
    state.isLoading,
    state.motor,
    state.warrantyConfig?.extendedYears,
    state.warrantyConfig?.warrantyPrice,
    state.warrantyConfig?.totalYears,
    state.pdfSnapshot?.createdAt,
    currentCoverageYears,
    user?.id,
  ]);

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
    navigate('/quote/trade-in');
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
    if (state.isLoading || promoLoading || !state.motor || state.frozenPricing) return;

    const reconciled = reconcileWarrantyConfig(
      Number(hp),
      currentCoverageYears,
      state.warrantyConfig,
    );
    const current = state.warrantyConfig;
    if (
      current?.extendedYears === reconciled.extendedYears &&
      current?.warrantyPrice === reconciled.warrantyPrice &&
      current?.totalYears === reconciled.totalYears
    ) {
      return;
    }

    dispatch({ type: 'SET_WARRANTY_CONFIG', payload: reconciled });
  }, [
    currentCoverageYears,
    dispatch,
    hp,
    promoLoading,
    state.frozenPricing,
    state.isLoading,
    state.motor,
    state.warrantyConfig,
  ]);
  
  // Auto-calculated deposit based on motor HP (no user selection)
  const depositAmount = getRecommendedDeposit(hp);

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
        const rebate = getRebateForHP(motorHP);
        return rebate ? `$${rebate.toLocaleString()}` : '$0';
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
  const basePromoSavings = getTotalPromotionalSavings?.(motorMSRP) || 0;
  const calculatedPromoSavings = getPromotionSavingsForMotor?.(hp, motorMSRP) || 0;
  const promoSavings = state.frozenPricing?.promoSavings ?? calculatedPromoSavings;

  // Live (non-frozen) values for stale-quote comparison
  const liveMotorMSRP = quoteData.motor?.msrp || quoteData.motor?.basePrice || 0;
  const livePromoSavings = getPromotionSavingsForMotor?.(hp, liveMotorMSRP) || 0;
  
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
      tradeInValue: state.tradeInInfo?.estimatedValue || 0,
      taxRate: 0.13
    });
  }, [motorMSRP, motorDiscount, state.adminDiscount, accessoryBreakdown, promoSavings, state.tradeInInfo?.estimatedValue]);

  // When frozenPricing exists with full totals, use those for display
  // to guarantee PDF ↔ web parity. Live recalc is only for stale-quote comparison.
  const displayPricing = useMemo(() => {
    if (state.frozenPricing?.subtotal != null && state.frozenPricing?.total != null) {
      return {
        ...packageSpecificTotals,
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
      tradeInValue: state.tradeInInfo?.estimatedValue || 0,
      taxRate: 0.13
    });
    return result.total;
  }, [state.frozenPricing, liveMotorMSRP, livePromoSavings, accessoryBreakdown, state.adminDiscount, state.tradeInInfo?.estimatedValue, quoteData.motor]);


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
          tradeInValue: state.tradeInInfo?.estimatedValue,
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

  const amountToFinance = getFinanceableAmount(displayPricing.subtotal, 0.13, DEALERPLAN_FEE);
  const isCashPurchase = state.selectedPaymentMethod === 'cash_purchase';
  // If the customer opted in to promotional financing on PromoSelectionPage,
  // use that rate/term for the monthly payment displayed in the summary.
  // Otherwise fall back to the TD "Always On" promo rate (unchanged).
  const usePromoFinancing =
    state.selectedPromoOption === 'special_financing' &&
    state.selectedPromoRate != null &&
    state.selectedPromoTerm != null;
  const currentPromotion = promotions[0] ?? null;
  const effectiveRate = usePromoFinancing ? state.selectedPromoRate : (promo?.rate || null);
  const effectiveTerm = usePromoFinancing ? state.selectedPromoTerm : null;
  const { payment: monthlyPayment, termMonths, rate: financingRate } = calculateMonthlyPayment(amountToFinance, effectiveRate, effectiveTerm);

  const quoteValidUntil = useMemo(() => {
    if (state.frozenPricing?.quoteExpiryDate) return new Date(state.frozenPricing.quoteExpiryDate);
    if (state.pdfSnapshot?.validUntil) return new Date(state.pdfSnapshot.validUntil);
    const thirtyDaysOut = new Date();
    thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);
    const promotionEnd = currentPromotion?.end_date ? promoEndOfDay(currentPromotion.end_date) : null;
    return promotionEnd && promotionEnd < thirtyDaysOut ? promotionEnd : thirtyDaysOut;
  }, [currentPromotion?.end_date, state.frozenPricing?.quoteExpiryDate, state.pdfSnapshot?.validUntil]);

  const pdfSnapshot = useMemo<QuotePdfSnapshot>(() => {
    const frozen = state.frozenPricing;
    const existing = state.pdfSnapshot;
    const paymentMethod = frozen?.selectedPaymentMethod ?? state.selectedPaymentMethod ?? existing?.paymentMethod;
    const financingAmortization = frozen?.financingAmortizationMonths ?? termMonths;
    const financingApr = frozen?.financingRate ?? financingRate;
    const financingAmount = frozen?.amountFinanced ?? amountToFinance;
    const financingDealerFee = frozen?.dealerFee ?? DEALERPLAN_FEE;
    const planPrice = state.warrantyConfig?.warrantyPrice || 0;
    const canShowFinancing = paymentMethod !== 'cash_purchase' && displayPricing.total >= FINANCING_MINIMUM;
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
      ...(state.tradeInInfo?.hasTradeIn && state.tradeInInfo?.estimatedValue > 0 && state.tradeInInfo?.brand ? {
        tradeInValue: state.tradeInInfo.estimatedValue,
        tradeInInfo: {
          brand: state.tradeInInfo.brand,
          year: Number(state.tradeInInfo.year),
          horsepower: Number(state.tradeInInfo.horsepower),
          model: state.tradeInInfo.model || undefined,
        },
      } : {}),
      includedCoverageYears: currentCoverageYears,
      ...(state.warrantyConfig && state.warrantyConfig.extendedYears > 0 && planPrice > 0 ? {
        productProtection: {
          planYears: state.warrantyConfig.extendedYears,
          totalCoverageYears: state.warrantyConfig.totalYears,
          priceBeforeTax: planPrice,
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
        name: frozen ? frozen.promotionName : (currentPromotion?.name ?? existing?.promotion?.name),
        endDate: frozen ? frozen.promotionEndDate : (currentPromotion?.end_date ?? existing?.promotion?.endDate),
        combinationMode: frozen?.promotionCombinationMode ?? currentPromotion?.promo_options?.type ?? existing?.promotion?.combinationMode,
        selectedOption: frozen?.selectedPromoOption ?? state.selectedPromoOption,
        selectedValue: selectedPromoValue,
      },
      customerNotes: state.customerNotes || undefined,
    };
  }, [
    accessoryBreakdown,
    amountToFinance,
    currentCoverageYears,
    currentPromotion?.end_date,
    currentPromotion?.name,
    currentPromotion?.promo_options?.type,
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

  useEffect(() => {
    if (JSON.stringify(state.pdfSnapshot) !== JSON.stringify(pdfSnapshot)) {
      dispatch({ type: 'SET_PDF_SNAPSHOT', payload: pdfSnapshot });
    }
  }, [dispatch, pdfSnapshot, state.pdfSnapshot]);

  // CTA handlers
  const noMotorSelected = !state.motor;

  const handleDownloadPDF = async () => {
    if (noMotorSelected) {
      toast({ title: 'No motor selected', description: 'Please select a motor before downloading a PDF.', variant: 'destructive' });
      return;
    }
    setIsGeneratingPDF(true);
    
    try {
      const quoteNumber = `HBW-${Date.now().toString().slice(-6)}`;
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
              quote_state: { ...state, frozenPricing: frozenPricingSnapshot, pdfSnapshot } as any,
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
          savedQuoteRefForSms = savedForQr.reference_number || undefined;
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
        googleRating,
        googleReviewCount,
        promotionalFinancingAlternative: (() => {
          if (state.selectedPaymentMethod === 'special_financing') return undefined;
          const promotionalFinancing = getPromotionOptions()
            .find((option) => option.id === 'special_financing');
          if (
            promotionalFinancing?.minimum_amount
            && amountToFinance < promotionalFinancing.minimum_amount
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
            quote_data: quoteData
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
    const tradeInValue = state.tradeInInfo?.estimatedValue || 0;
    
    // Use the pre-trade-in subtotal so the financing form handles the single subtraction
    // packageSpecificTotals.subtotal already has trade-in deducted, so add it back
    const preTradeInSubtotal = displayPricing.subtotal + tradeInValue;
    const subtotalWithTax = preTradeInSubtotal * 1.13;
    const totalWithFees = subtotalWithTax + DEALERPLAN_FEE;
    const financingData = {
      ...state,
      financingAmount: {
        packageSubtotal: displayPricing.subtotal,
        hst: displayPricing.subtotal * 0.13,
        financingFee: DEALERPLAN_FEE,
        totalWithFees: totalWithFees,
        motorModel: quoteData.motor?.model || motorName,
        packageName: selectedPackageLabel,
        tradeInValue: tradeInValue,
        // Include promo details for financing application
        promoOption: state.selectedPromoOption,
        promoRate: state.selectedPromoRate,
        promoTerm: state.selectedPromoTerm,
        promoValue: state.selectedPromoValue,
        promoName: currentPromotion?.name || null,
        promoSavings,
        promoCombinationMode: currentPromotion?.promo_options?.type || null,
      }
    };
    
    localStorage.setItem('quote_state', JSON.stringify(financingData));
    navigate('/financing/apply');
  };

  // Open the deposit info dialog (replaces direct payment flow)
  const handleReserveDeposit = () => {
    trackEvent('quote_deposit_dialog_opened', {
      motor_hp: hp,
      deposit_amount: depositAmount,
      device: window.innerWidth < 1024 ? 'mobile_or_tablet' : 'desktop',
    });
    setShowDepositDialog(true);
  };

  // Handle deposit after customer info is collected
  const handleDepositSubmit = async (customerInfo: DepositCustomerInfo) => {
    setShowDepositDialog(false);
    setIsProcessingDeposit(true);
    try {
      const { generatePDFBlob } = await import('@/lib/react-pdf-generator');
      const quoteNumber = `HBW-${Date.now().toString().slice(-6)}`;
      const referenceNumber = `HBW-DEP-${quoteNumber.slice(4)}`;
      
      const basePdfData = {
        quoteNumber,
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        snapshot: pdfSnapshot,
      };

      // Generate TWO PDFs: clean quote + deposit-confirmed version
      let quotePdfPath: string | undefined;
      let depositPdfPath: string | undefined;
      
      try {
        // 1. Clean quote PDF
        const cleanBlob = await generatePDFBlob(basePdfData);
        const cleanFileName = `deposit-quotes/${quoteNumber}-${Date.now()}.pdf`;
        const { error: cleanErr } = await supabase.storage
          .from('quotes')
          .upload(cleanFileName, cleanBlob, { contentType: 'application/pdf' });
        if (!cleanErr) {
          quotePdfPath = cleanFileName;
          console.log('Clean quote PDF uploaded:', cleanFileName);
        }

        // 2. Deposit-confirmed PDF (with depositInfo baked in)
        const depositPdfData = {
          ...basePdfData,
          depositInfo: {
            amount: depositAmount,
            referenceNumber,
            paymentDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            paymentMethod: 'Credit Card (Stripe)',
            status: 'Confirmed',
          },
        };
        const depositBlob = await generatePDFBlob(depositPdfData);
        const depositFileName = `deposit-quotes/${quoteNumber}-${Date.now()}-deposit.pdf`;
        const { error: depositErr } = await supabase.storage
          .from('quotes')
          .upload(depositFileName, depositBlob, { contentType: 'application/pdf' });
        if (!depositErr) {
          depositPdfPath = depositFileName;
          console.log('Deposit-confirmed PDF uploaded:', depositFileName);
        }
      } catch (pdfErr) {
        console.warn('Could not generate quote PDFs for deposit:', pdfErr);
      }

      // Save/update saved_quotes record with PDF paths
      let savedQuoteId: string | undefined;
      try {
        const { data: savedQuote, error: sqError } = await supabase
          .from('saved_quotes')
          .insert({
            email: customerInfo.email,
            resume_token: `dep_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`,
            quote_state: { ...state, frozenPricing: frozenPricingFromPdfSnapshot(pdfSnapshot), pdfSnapshot } as any,
            user_id: user?.id || null,
            expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            quote_pdf_path: quotePdfPath || null,
            deposit_pdf_path: depositPdfPath || null,
            deposit_status: 'pending',
            deposit_amount: depositAmount,
          } as any)
          .select('id')
          .single();
        if (!sqError && savedQuote) {
          savedQuoteId = savedQuote.id;
          console.log('Saved quote created for deposit tracking:', savedQuoteId);
        }
      } catch (sqErr) {
        console.warn('Could not create saved_quotes record:', sqErr);
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
            name: customerInfo.name,
            email: customerInfo.email,
            phone: customerInfo.phone,
          },
          motorInfo: {
            model: motorName,
            hp: hp,
            year: modelYear || 2026
          },
          quotePdfPath: depositPdfPath || quotePdfPath,
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
    } catch (error: any) {
      console.error('Deposit error:', error);
      toast({
        title: 'Payment Error',
        description: error.message || 'Failed to initiate deposit. Please try again.',
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
  }, [depositAmount, user, motorName, hp, modelYear]);

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
        open={showDepositDialog}
        onOpenChange={setShowDepositDialog}
        onSubmit={handleDepositSubmit}
        depositAmount={depositAmount}
        defaultValues={{
          name: state.customerName || user?.user_metadata?.full_name || '',
          email: state.customerEmail || user?.email || '',
          phone: state.customerPhone || '',
        }}
        isProcessing={isProcessingDeposit}
      />
      
      {/* Stale Quote Detection */}
      {state.frozenPricing && (
        <StaleQuoteAlert
          frozenPricing={state.frozenPricing}
          liveMotorMSRP={liveMotorMSRP}
          livePromoSavings={livePromoSavings}
          liveTotal={liveTotalForComparison}
          promoEndDate={promotions?.[0]?.end_date ?? null}
          onKeepOriginal={() => {/* keep frozen, do nothing */}}
          onUpdatePricing={() => dispatch({ type: 'SET_FROZEN_PRICING', payload: undefined })}
        />
      )}

      <ScrollToTop />
      <PageTransition>
        <QuoteLayout>
          {!isMounted ? (
            <QuoteSummarySkeleton />
          ) : (
          <div className="bg-repower-paper">
          <div className="mx-auto w-full max-w-[1100px] px-6 py-12 md:px-8 md:py-16 min-[1180px]:px-0">
            <div className="grid lg:grid-cols-[1fr_440px] gap-12">
              {/* Main Content - Left Column */}
              <div className="space-y-6">
                <p className="text-sm font-medium text-foreground">Your configured quote</p>

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
                    tradeInValue={state.tradeInInfo?.estimatedValue || 0}
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
                    value={state.warrantyConfig}
                    onChange={handleProductProtectionChange}
                    financing={!isCashPurchase && displayPricing.total >= FINANCING_MINIMUM ? {
                      rate: financingRate,
                      amortizationMonths: termMonths,
                    } : undefined}
                  />
                </motion.div>

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
                  <button
                    onClick={handleReserveDeposit}
                    disabled={isProcessingDeposit || noMotorSelected}
                    title={noMotorSelected ? 'Select a motor first' : undefined}
                    className="group w-full rounded bg-repower-mercury-red px-6 py-4 font-sans text-[13px] font-bold uppercase tracking-[0.12em] text-repower-cream transition hover:opacity-90 hover:-translate-y-px hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      {isProcessingDeposit
                        ? 'Preparing secure checkout…'
                        : `Reserve this motor — $${depositAmount.toLocaleString()}`
                      }
                      {!isProcessingDeposit && (
                        <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                      )}
                    </span>
                  </button>
                  <p className="px-2 text-center font-sans text-[12px] leading-relaxed text-repower-navy-900/60">
                    Secure Stripe checkout. HBW confirms the motor and quote details before anything is ordered.
                  </p>
                  <div className="flex items-center gap-3 py-1" aria-hidden>
                    <span className="h-px flex-1 bg-repower-navy-900/10" />
                    <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-repower-navy-900/45">
                      Not ready to reserve?
                    </span>
                    <span className="h-px flex-1 bg-repower-navy-900/10" />
                  </div>
                  <button
                    onClick={handleStepComplete}
                    className="group w-full rounded border border-repower-navy-900 bg-transparent px-6 py-4 font-sans text-[13px] font-bold uppercase tracking-[0.12em] text-repower-navy-900 transition hover:bg-repower-navy-900 hover:text-repower-cream"
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      Have HBW Review My Quote
                      <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                    </span>
                  </button>
                  <button
                    onClick={() => user ? setShowSaveDialog(true) : setShowAuthSaveDialog(true)}
                    disabled={noMotorSelected}
                    title={noMotorSelected ? 'Select a motor first' : undefined}
                    className="w-full rounded border border-repower-navy-900/15 bg-transparent px-6 py-4 font-sans text-[13px] font-bold uppercase tracking-[0.12em] text-repower-navy-900 transition hover:border-repower-navy-900/40 disabled:opacity-50"
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      <Download className="w-4 h-4" />
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
                  {!isCashPurchase && displayPricing.total >= FINANCING_MINIMUM && (
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
                  bullets={selectedPackageFeatures}
                  onReserve={handleReserveDeposit}
                  onReview={handleStepComplete}
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
                  onApplyForFinancing={!isCashPurchase && displayPricing.total >= FINANCING_MINIMUM ? handleApplyForFinancing : undefined}
                  isGeneratingPDF={isGeneratingPDF}
                  isProcessingPayment={isProcessingDeposit}
                  quoteValidUntil={quoteValidUntil}
                />
              </div>
            </div>
          </div>
          </div>
          )}
          
          <SaveQuoteDialog 
            open={showSaveDialog}
            onOpenChange={setShowSaveDialog}
            quoteData={{ ...state, frozenPricing: frozenPricingFromPdfSnapshot(pdfSnapshot), pdfSnapshot }}
            motorModel={motorName}
            finalPrice={displayPricing.total}
          />
          <SaveQuoteWithAuth
            open={showAuthSaveDialog}
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
