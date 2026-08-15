import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useFinancing } from '@/contexts/FinancingContext';
import { useQuote } from '@/contexts/QuoteContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SaveForLaterDialog } from '@/components/financing/SaveForLaterDialog';
import { FinancingResumeDialog } from '@/components/financing/FinancingResumeDialog';
import { FormProgressIndicator } from '@/components/financing/FormProgressIndicator';
import { FinancingApplicationSkeleton } from '@/components/financing/FinancingApplicationSkeleton';
import { AccessibleFormWrapper } from '@/components/financing/AccessibleFormWrapper';
import { useToast } from '@/hooks/use-toast';
import { Mail, ArrowLeft, ShieldCheck, Clock3, Phone } from 'lucide-react';
import harrisLogo from '@/assets/harris-logo-white.png';
import mercuryLogo from '@/assets/mercury-logo-white.png';
import { TDAlwaysOnBanner } from '@/components/promotions/TDAlwaysOnOffer';
import { useNoIndex } from '@/hooks/useNoIndex';
import { DEALERPLAN_FEE } from '@/lib/finance';
import { getFinancingFunnelStep, trackClarityFunnelStep } from '@/lib/analytics';
import { clearFinancingStorage, stripLocalSensitiveFields } from '@/lib/financingApplicationApi';
import { Helmet } from '@/lib/helmet';
import '@/styles/financing-mobile.css';

// Lazy load step components (~180KB total)
const PurchaseDetailsStep = lazy(() => import('@/components/financing/PurchaseDetailsStep').then(m => ({ default: m.PurchaseDetailsStep })));
const ApplicantStep = lazy(() => import('@/components/financing/ApplicantStep').then(m => ({ default: m.ApplicantStep })));
const EmploymentStep = lazy(() => import('@/components/financing/EmploymentStep').then(m => ({ default: m.EmploymentStep })));
const FinancialStep = lazy(() => import('@/components/financing/FinancialStep').then(m => ({ default: m.FinancialStep })));
const CoApplicantStep = lazy(() => import('@/components/financing/CoApplicantStep').then(m => ({ default: m.CoApplicantStep })));
const ReferencesStep = lazy(() => import('@/components/financing/ReferencesStep').then(m => ({ default: m.ReferencesStep })));
const ReviewSubmitStep = lazy(() => import('@/components/financing/ReviewSubmitStep').then(m => ({ default: m.ReviewSubmitStep })));

const stepTitles = {
  1: "Purchase Details",
  2: "Personal Information",
  3: "Employment",
  4: "Financial Information",
  5: "Co-Applicant",
  6: "References",
  7: "Review & Submit",
};

const stepComponents = {
  1: PurchaseDetailsStep,
  2: ApplicantStep,
  3: EmploymentStep,
  4: FinancialStep,
  5: CoApplicantStep,
  6: ReferencesStep,
  7: ReviewSubmitStep,
};

interface SavedDraft {
  data: any;
  currentStep: number;
  lastSaved: string;
  motorModel?: string;
  amountToFinance?: number;
}

export default function FinancingApplication() {
  useNoIndex();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { state: financingState, dispatch: financingDispatch } = useFinancing();
  const { state: quoteState } = useQuote();
  const { toast } = useToast();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [savedDraft, setSavedDraft] = useState<SavedDraft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initializationKey, setInitializationKey] = useState(0);
  const lastTrackedStepRef = useRef<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    const step = getFinancingFunnelStep(financingState.currentStep);
    if (!step || lastTrackedStepRef.current === step) return;
    lastTrackedStepRef.current = step;
    trackClarityFunnelStep('financing', step);
  }, [financingState.currentStep, isLoading]);

  // Detect saved drafts and handle auto-resume
  useEffect(() => {
    const detectSavedDraft = (): SavedDraft | null => {
      // Priority 1: Check 'financing_draft' (from Back to Quote)
      const backToQuoteDraft = localStorage.getItem('financing_draft');

      // Priority 2: Check 'financingApplication' (auto-save)
      const autoSavedDraft = localStorage.getItem('financingApplication');

      // Use most recent or most complete draft
      const draftStr = backToQuoteDraft || autoSavedDraft;

      if (!draftStr) return null;

      try {
        const stored = JSON.parse(draftStr);
        const parsed = stored.state
          ? { ...stored.state, lastSaved: stored.lastActivity || stored.timestamp }
          : stored;

        // Filter: Only show dialog if meaningful progress exists
        const hasMeaningfulProgress =
          parsed.currentStep > 1 ||
          (parsed.purchaseDetails && Object.keys(parsed.purchaseDetails).length > 2);

        if (!hasMeaningfulProgress) return null;

        // Filter: Ignore drafts older than 7 days
        const lastSaved = parsed.lastSaved || Date.now();
        const daysSince = (Date.now() - lastSaved) / (1000 * 60 * 60 * 24);

        if (daysSince > 7) {
          clearFinancingStorage();
          return null;
        }

        return {
          data: parsed,
          currentStep: parsed.currentStep,
          lastSaved: new Date(lastSaved).toISOString(),
          motorModel: parsed.purchaseDetails?.motorModel,
          amountToFinance: parsed.purchaseDetails?.amountToFinance,
        };
      } catch (e) {
        console.error('Failed to parse saved draft:', e);
        return null;
      }
    };

    // Check for saved draft first
    const draft = detectSavedDraft();

    if (draft) {
      // Show resume dialog
      setSavedDraft(draft);
      setShowResumeDialog(true);
      setIsLoading(false);
      return;
    }

    // Check for calculator pre-fill (from Finance Calculator)
    const calculatorState = (location.state as any)?.fromCalculator ? location.state : null;

    if (calculatorState) {
      console.log('Loading financing data from calculator:', calculatorState);

      // Preserve the calculator's amortization choice. Payment frequency must
      // never silently change the term handed into the application.
      const supportedAmortizations = [24, 36, 48, 60, 72, 84, 120, 180, 240] as const;
      const requestedAmortization = Number(calculatorState.amortizationMonths);
      const termMapping = supportedAmortizations.includes(requestedAmortization as typeof supportedAmortizations[number])
        ? String(requestedAmortization) as "24" | "36" | "48" | "60" | "72" | "84" | "120" | "180" | "240"
        : "60";

      financingDispatch({
        type: 'SET_PURCHASE_DETAILS',
        payload: {
          motorModel: calculatorState.motorModel || 'Motor',
          motorPrice: calculatorState.totalFinanced || 0,
          downPayment: calculatorState.downPayment || 0,
          tradeInValue: 0,
          amountToFinance: Math.max(0, (calculatorState.totalFinanced || 0) - (calculatorState.downPayment || 0)),
          preferredTerm: termMapping,
        }
      });

      toast({
        title: "Calculator Data Loaded",
        description: "Your financing estimate has been pre-filled from the calculator.",
        duration: 4000,
      });

      setIsLoading(false);
      return;
    }

    // Check for full quote restoration from saved_quotes (via quoteId)
    const savedQuoteIdParam = searchParams.get('quoteId');
    const restoredQuoteState = (location.state as any)?.savedQuoteState;

    if (savedQuoteIdParam && restoredQuoteState) {
      console.log('Restoring full quote state from database:', restoredQuoteState);

      // Handle both 'motor' and 'selectedMotor' keys (consistent with SavedQuotePage.tsx)
      const motorData = restoredQuoteState.motor || restoredQuoteState.selectedMotor;

      // Calculate accurate total from saved state - handle multiple field name variations
      const motorMSRP = parseFloat(motorData?.msrp) || parseFloat(motorData?.basePrice) || 0;
      const motorDiscount = parseFloat(motorData?.dealer_discount) ||
                            (motorMSRP - (parseFloat(motorData?.salePrice) || parseFloat(motorData?.price) || motorMSRP));

      // Get package-specific pricing
      let packageTotal = motorMSRP - motorDiscount;

      // Subtract admin discount (special pricing from admin)
      const adminDiscount = parseFloat(restoredQuoteState.adminDiscount) || 0;
      packageTotal -= adminDiscount;

      // Subtract promo rebate if cash_rebate option selected
      let promoRebate = 0;
      if (restoredQuoteState.selectedPromoOption === 'cash_rebate' &&
          restoredQuoteState.selectedPromoValue) {
        // Parse "$250 rebate" -> 250
        const match = restoredQuoteState.selectedPromoValue.match(/\$?([\d,]+)/);
        if (match) {
          promoRebate = parseFloat(match[1].replace(',', '')) || 0;
        }
      }
      packageTotal -= promoRebate;

      // Add accessories based on package
      const packageKey = restoredQuoteState.selectedPackage?.key || restoredQuoteState.selectedPackage;
      if (packageKey === 'better' || packageKey === 'best') {
        packageTotal += 180; // Battery
      }

      // Add warranty if selected
      const restoredWarrantyPrice =
        restoredQuoteState.warrantyConfig?.warrantyPrice ??
        restoredQuoteState.warranty?.warrantyPrice;
      if (restoredWarrantyPrice) {
        packageTotal += Number(restoredWarrantyPrice);
      }

      // Add installation costs
      if (restoredQuoteState.installConfig?.installationType === 'professional') {
        packageTotal += 450; // Professional installation
      }

      // Add controls/rigging
      if (restoredQuoteState.boatInfo?.controlsType === 'new') {
        packageTotal += 1200;
      } else if (restoredQuoteState.boatInfo?.controlsType === 'adapter') {
        packageTotal += 125;
      }

      // Subtract trade-in
      const tradeInValue = parseFloat(restoredQuoteState.tradeInInfo?.estimatedValue) || 0;

      // Add tax and fees (do NOT subtract trade-in here, the financing form handles that)
      const withTax = packageTotal * 1.13;
      const totalWithFees = withTax + DEALERPLAN_FEE;

      // Build motor model display with package info
      const packageLabel = restoredQuoteState.selectedPackage?.label ||
                           (packageKey ? packageKey.charAt(0).toUpperCase() + packageKey.slice(1) : '');
      const motorModel = packageLabel
        ? `${motorData?.model || 'Motor'} (${packageLabel})`
        : motorData?.model || 'Motor';

      // Dispatch to financing form
      financingDispatch({
        type: 'SET_PURCHASE_DETAILS',
        payload: {
          motorModel: motorModel,
          motorPrice: Math.round(totalWithFees * 100) / 100,
          downPayment: 0,
          tradeInValue: tradeInValue,
          amountToFinance: Math.round(totalWithFees * 100) / 100,
        }
      });

      // Show confirmation toast
      toast({
        title: "Quote Restored Successfully",
        description: `Your ${motorData?.model || 'motor'} configuration has been loaded with all accessories and options.`,
        duration: 5000,
      });

      setIsLoading(false);
      return; // Skip other pre-fill logic
    }

    // Check for URL parameters from QR code scan
    const motorModel = searchParams.get('motorModel') || searchParams.get('motor');
    const explicitAllInPrice = searchParams.get('motorPrice');
    const legacyMotorPrice = searchParams.get('price');
    const motorPrice = explicitAllInPrice || legacyMotorPrice;
    const downPayment = searchParams.get('downPayment');
    const tradeInValue = searchParams.get('tradeInValue');
    const packageName = searchParams.get('packageName');
    const fromQr = searchParams.get('fromQr') === 'true';

    // Pre-fill from URL parameters if available (takes precedence over quote context)
    if (motorModel && motorPrice) {
      const parsedPrice = parseFloat(motorPrice);
      // Legacy direct links used `price` for the pre-tax motor price. Modern
      // `motorPrice` links carry the all-in total so it is never taxed twice.
      const allInPrice = explicitAllInPrice
        ? parsedPrice
        : Math.round((parsedPrice * 1.13 + DEALERPLAN_FEE) * 100) / 100;

      financingDispatch({
        type: 'SET_PURCHASE_DETAILS',
        payload: {
          motorModel: packageName ? `${motorModel} (${packageName})` : motorModel,
          motorPrice: allInPrice,
          downPayment: parseFloat(downPayment || '0'),
          tradeInValue: parseFloat(tradeInValue || '0'),
          amountToFinance: Math.max(0, allInPrice - parseFloat(downPayment || '0') - parseFloat(tradeInValue || '0')),
        }
      });

      // Show confirmation toast if user came from QR code
      if (fromQr) {
        toast({
          title: "Quote Details Loaded",
          description: "Your motor and pricing information has been pre-filled from the PDF.",
          duration: 4000,
        });
      }

      // Skip quote context pre-fill since we have URL parameters
      setIsLoading(false);
      return;
    }

    // No draft or URL parameters found - proceed with quote pre-fill
    const quoteId = searchParams.get('quote');

    // Try to get quote data from localStorage (saved from quote summary)
    const savedQuoteState = localStorage.getItem('quote_state');
    let quoteData = quoteState;

    if (savedQuoteState) {
      try {
        quoteData = JSON.parse(savedQuoteState);
        // Clear it after reading to prevent stale data
        localStorage.removeItem('quote_state');
      } catch (e) {
        console.error('Failed to parse quote state:', e);
      }
    }

    // Pre-fill if we have motor data
    if (quoteData?.motor && !financingState.purchaseDetails?.motorModel) {
      if (quoteId) {
        financingDispatch({ type: 'SET_QUOTE_ID', payload: quoteId });
      }

      // Use totalWithFees (includes package subtotal + HST + Dealerplan fee)
      const totalWithFees = (quoteData as any).financingAmount?.totalWithFees;
      const motorPrice = totalWithFees || quoteData.motor.salePrice || quoteData.motor.price || 0;
      const tradeInValue = (quoteData as any).financingAmount?.tradeInValue || quoteData.tradeInInfo?.estimatedValue || 0;
      const downPayment = 0; // Will be set by user

      // Build motor model display with package info
      const motorModel = (quoteData as any).financingAmount?.packageName
        ? `${quoteData.motor.model || ''} (${(quoteData as any).financingAmount.packageName})`
        : quoteData.motor.model || '';

      // Extract promo details from financing amount or state
      const promoOption = (quoteData as any).financingAmount?.promoOption ||
                          (quoteData as any).selectedPromoOption || null;
      const promoRate = (quoteData as any).financingAmount?.promoRate ||
                        (quoteData as any).selectedPromoRate || null;
      const promoTerm = (quoteData as any).financingAmount?.promoTerm ||
                        (quoteData as any).selectedPromoTerm || null;
      const promoValue = (quoteData as any).financingAmount?.promoValue ||
                         (quoteData as any).selectedPromoValue || null;
      const promoName = (quoteData as any).financingAmount?.promoName ||
                        (quoteData as any).promotionName || null;
      const promoSavings = (quoteData as any).financingAmount?.promoSavings ??
                           (quoteData as any).frozenPricing?.promoSavings ?? null;
      const promoCombinationMode = (quoteData as any).financingAmount?.promoCombinationMode ||
                                   (quoteData as any).promotionCombinationMode || null;

      financingDispatch({
        type: 'SET_PURCHASE_DETAILS',
        payload: {
          motorModel: motorModel,
          motorPrice: motorPrice,
          downPayment: downPayment,
          tradeInValue: tradeInValue,
          amountToFinance: Math.max(0, motorPrice - downPayment - tradeInValue),
          // Include promo details
          promoOption: promoOption,
          promoRate: promoRate,
          promoTerm: promoTerm,
          promoValue: promoValue,
          promoName,
          promoSavings,
          promoCombinationMode,
        },
      });
    }

    // Simulate loading state for better UX
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, [searchParams, financingDispatch, initializationKey]);

  const handleBackToQuote = () => {
    // Only save if user has made progress (not on step 1)
    if (financingState.currentStep > 1 || Object.keys(financingState.purchaseDetails || {}).length > 1) {
      localStorage.setItem('financing_draft', JSON.stringify({
        ...financingState,
        applicant: stripLocalSensitiveFields(financingState.applicant as Record<string, unknown> | null),
        coApplicant: stripLocalSensitiveFields(financingState.coApplicant as Record<string, unknown> | null),
        lastSaved: Date.now(),
      }));
    }

    // Navigate back to quote summary
    navigate('/quote/summary');
  };

  const handleContinue = () => {
    if (savedDraft) {
      // Use LOAD_FROM_STORAGE since localStorage data uses camelCase format
      financingDispatch({
        type: 'LOAD_FROM_STORAGE',
        payload: savedDraft.data
      });
    }
    setShowResumeDialog(false);
  };

  const handleStartFresh = () => {
    // Clear old financing progress, then rerun the normal initialization path.
    // That preserves whichever current source brought the customer here:
    // calculator state, saved quote, direct link, or quote context.
    clearFinancingStorage();
    financingDispatch({ type: 'RESET_APPLICATION' });
    setSavedDraft(null);
    setShowResumeDialog(false);
    setIsLoading(true);
    setInitializationKey((current) => current + 1);
  };

  if (isLoading) {
    return <FinancingApplicationSkeleton />;
  }

  const CurrentStepComponent = stepComponents[financingState.currentStep as keyof typeof stepComponents];

  return (
    <div className="min-h-screen bg-repower-paper financing-form">
      <Helmet>
        <title>Boat Repower Financing Application | Harris Boat Works</title>
        <meta
          name="description"
          content="Secure Canadian boat repower financing application through Harris Boat Works."
        />
      </Helmet>
      <header className="border-b border-white/10 bg-repower-navy-900">
        <div className="mx-auto flex h-[72px] max-w-[1180px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 sm:gap-5">
            <img src={harrisLogo} alt="Harris Boat Works" className="h-10 w-auto" />
            <span className="h-8 w-px bg-white/20" aria-hidden="true" />
            <img src={mercuryLogo} alt="Mercury Repower Center" className="h-7 w-auto" />
          </div>
          <Button
            variant="ghost"
            onClick={handleBackToQuote}
            className="h-11 gap-2 rounded-none px-2 font-sans text-[12px] font-bold uppercase tracking-[0.12em] text-white/75 hover:bg-white/5 hover:text-white sm:px-4"
            aria-label="Return to quote summary"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Back to Quote</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] px-4 pb-24 pt-8 sm:px-6 md:pt-12 lg:px-8 lg:pb-16">
        <div className="mb-8 max-w-3xl md:mb-10">
          <p className="mb-3 font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-repower-mercury-red">
            Secure Canadian financing
          </p>
          <h1 className="font-display text-[clamp(34px,5vw,56px)] font-bold leading-[0.98] tracking-[-0.025em] text-repower-navy-900">
            Financing application
          </h1>
          <p className="mt-5 max-w-2xl font-sans text-[16px] leading-relaxed text-repower-navy-900/68 md:text-[18px]">
            Apply for boat repower financing through Harris Boat Works with Canadian marine lenders. Complete it at your pace—we will confirm the details before anything moves forward.
          </p>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 font-sans text-[13px] font-medium text-repower-navy-900/70">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-repower-gold" aria-hidden="true" />
              SIN encrypted separately
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-repower-gold" aria-hidden="true" />
              About 8–10 minutes
            </span>
            <a href="tel:+19053422153" className="inline-flex items-center gap-2 hover:text-repower-mercury-red">
              <Phone className="h-4 w-4 text-repower-gold" aria-hidden="true" />
              (905) 342-2153
            </a>
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[285px_minmax(0,1fr)] lg:gap-8">
          <FormProgressIndicator
            currentStep={financingState.currentStep}
            totalSteps={7}
            stepTitles={stepTitles}
            completedSteps={financingState.completedSteps}
          />

          <div className="min-w-0">
            <TDAlwaysOnBanner />

            <Card className="financing-step-card rounded-sm border-repower-navy-900/10 bg-white p-4 shadow-[0_18px_50px_-35px_rgba(5,18,36,0.35)] sm:p-7 md:p-9">
              {CurrentStepComponent ? (
                <AccessibleFormWrapper
                  stepNumber={financingState.currentStep}
                  stepTitle={stepTitles[financingState.currentStep as keyof typeof stepTitles]}
                  totalSteps={7}
                >
                  <Suspense fallback={<FinancingApplicationSkeleton />}>
                    <CurrentStepComponent />
                  </Suspense>
                </AccessibleFormWrapper>
              ) : (
                <div className="py-12 text-center" role="status">
                  <p className="text-repower-navy-900/60">Step {financingState.currentStep} coming soon</p>
                </div>
              )}
            </Card>

            <div className="mt-5 flex flex-col items-center justify-between gap-3 border-t border-repower-navy-900/10 pt-5 sm:flex-row">
              <p className="max-w-md font-sans text-[12px] leading-relaxed text-repower-navy-900/55">
                Need a break? We will email you a private 30-day link. Your SIN is never stored in the saved draft.
              </p>
              <Button
                variant="outline"
                onClick={() => setShowSaveDialog(true)}
                className="h-11 shrink-0 gap-2 rounded-none border-repower-navy-900/20 bg-white px-5 font-sans text-[12px] font-bold uppercase tracking-[0.1em] text-repower-navy-900 hover:border-repower-navy-900"
                aria-label="Save application and continue later"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                Save for later
              </Button>
            </div>
          </div>
        </div>

        <SaveForLaterDialog
          open={showSaveDialog}
          onOpenChange={setShowSaveDialog}
        />

        <FinancingResumeDialog
          open={showResumeDialog}
          draftData={savedDraft}
          onContinue={handleContinue}
          onStartFresh={handleStartFresh}
        />
      </main>
    </div>
  );
}
