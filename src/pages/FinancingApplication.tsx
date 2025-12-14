import { useEffect, useState, lazy, Suspense } from 'react';
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
import { Mail, ArrowLeft } from 'lucide-react';
import harrisLogo from '@/assets/harris-logo.png';
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
        const parsed = JSON.parse(draftStr);
        
        // Filter: Only show dialog if meaningful progress exists
        const hasMeaningfulProgress = 
          parsed.currentStep > 1 || 
          (parsed.purchaseDetails && Object.keys(parsed.purchaseDetails).length > 2);
        
        if (!hasMeaningfulProgress) return null;
        
        // Filter: Ignore drafts older than 7 days
        const lastSaved = parsed.lastSaved || Date.now();
        const daysSince = (Date.now() - lastSaved) / (1000 * 60 * 60 * 24);
        
        if (daysSince > 7) {
          localStorage.removeItem('financing_draft');
          localStorage.removeItem('financingApplication');
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
      
      // Map frequency to appropriate term
      let termMapping: "36" | "48" | "60" | "72" | "84" | "120" | "180" = "60";
      if (calculatorState.frequency === 'bi-weekly') {
        termMapping = "120"; // ~5 years bi-weekly
      } else if (calculatorState.frequency === 'weekly') {
        termMapping = "180"; // ~3.5 years weekly
      }
      
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
      
      // Calculate accurate total from saved state
      const motorMSRP = parseFloat(restoredQuoteState.selectedMotor?.msrp) || 0;
      const motorDiscount = parseFloat(restoredQuoteState.selectedMotor?.dealer_discount) || 0;
      
      // Get package-specific pricing
      let packageTotal = motorMSRP - motorDiscount;
      
      // Add accessories based on package
      if (restoredQuoteState.selectedPackage === 'better' || restoredQuoteState.selectedPackage === 'best') {
        packageTotal += 180; // Battery
      }
      
      // Add warranty if selected
      if (restoredQuoteState.warranty?.warrantyPrice) {
        packageTotal += parseFloat(restoredQuoteState.warranty.warrantyPrice);
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
      
      // Add tax and fees
      const withTax = (packageTotal - tradeInValue) * 1.13;
      const totalWithFees = withTax + 299; // Dealerplan fee
      
      // Dispatch to financing form
      financingDispatch({
        type: 'SET_PURCHASE_DETAILS',
        payload: {
          motorModel: restoredQuoteState.selectedMotor?.model || 'Motor',
          motorPrice: Math.round(totalWithFees * 100) / 100,
          downPayment: 0,
          tradeInValue: tradeInValue,
          amountToFinance: Math.round(totalWithFees * 100) / 100,
        }
      });
      
      // Show confirmation toast
      toast({
        title: "Quote Restored Successfully",
        description: `Your ${restoredQuoteState.selectedMotor?.model || 'motor'} configuration has been loaded with all accessories and options.`,
        duration: 5000,
      });
      
      setIsLoading(false);
      return; // Skip other pre-fill logic
    }

    // Check for URL parameters from QR code scan
    const motorModel = searchParams.get('motorModel');
    const motorPrice = searchParams.get('motorPrice');
    const downPayment = searchParams.get('downPayment');
    const tradeInValue = searchParams.get('tradeInValue');
    const packageName = searchParams.get('packageName');
    const fromQr = searchParams.get('fromQr') === 'true';

    // Pre-fill from URL parameters if available (takes precedence over quote context)
    if (motorModel && motorPrice) {
      financingDispatch({
        type: 'SET_PURCHASE_DETAILS',
        payload: {
          motorModel: packageName ? `${motorModel} (${packageName})` : motorModel,
          motorPrice: parseFloat(motorPrice),
          downPayment: parseFloat(downPayment || '0'),
          tradeInValue: parseFloat(tradeInValue || '0'),
          amountToFinance: Math.max(0, parseFloat(motorPrice) - parseFloat(downPayment || '0') - parseFloat(tradeInValue || '0')),
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
      
      financingDispatch({
        type: 'SET_PURCHASE_DETAILS',
        payload: {
          motorModel: motorModel,
          motorPrice: motorPrice,
          downPayment: downPayment,
          tradeInValue: tradeInValue,
          amountToFinance: Math.max(0, motorPrice - downPayment - tradeInValue),
        },
      });
    }
    
    // Simulate loading state for better UX
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, [searchParams, financingDispatch]);

  const handleBackToQuote = () => {
    // Only save if user has made progress (not on step 1)
    if (financingState.currentStep > 1 || Object.keys(financingState.purchaseDetails || {}).length > 1) {
      localStorage.setItem('financing_draft', JSON.stringify(financingState));
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
    // Clear all saved drafts and quote data
    localStorage.removeItem('financing_draft');
    localStorage.removeItem('financingApplication');
    localStorage.removeItem('quote_state');
    
    // Reset context to initial state
    financingDispatch({ type: 'RESET_APPLICATION' });
    
    setShowResumeDialog(false);
  };

  if (isLoading) {
    return <FinancingApplicationSkeleton />;
  }

  const CurrentStepComponent = stepComponents[financingState.currentStep as keyof typeof stepComponents];

  return (
    <div className="min-h-screen bg-white py-4 md:py-8 px-4 financing-form">
      {/* Minimal Luxury Header */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <img 
            src={harrisLogo} 
            alt="Harris Boat Works" 
            className="h-10 md:h-12 w-auto"
          />
          
          <Button
            variant="ghost"
            onClick={handleBackToQuote}
            className="gap-2 text-sm font-light text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Return to quote summary"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Quote
          </Button>
        </div>
      </div>
      
      <div className="max-w-2xl mx-auto pb-24 md:pb-8">
        {/* Progress Header */}
        <FormProgressIndicator
          currentStep={financingState.currentStep}
          totalSteps={7}
          stepTitles={stepTitles}
          completedSteps={financingState.completedSteps}
        />

        {/* Step Content */}
        <Card className="p-4 sm:p-6 md:p-8">
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
            <div className="text-center py-12" role="status">
              <p className="text-muted-foreground">Step {financingState.currentStep} coming soon</p>
            </div>
          )}
        </Card>

        {/* Save & Continue Later Link */}
        <div className="mt-6 space-y-3 text-center">
          <Button
            variant="outline"
            onClick={() => setShowSaveDialog(true)}
            className="gap-2"
            aria-label="Save application and continue later"
          >
            <Mail className="h-4 w-4" aria-hidden="true" />
            Save & Continue Later
          </Button>
          
          {/* Security Message */}
          <p className="text-xs text-gray-400 font-light">
            All information encrypted and secure
          </p>
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
      </div>
    </div>
  );
}
