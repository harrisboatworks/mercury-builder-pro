import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useFinancing } from '@/contexts/FinancingContext';
import { useQuote } from '@/contexts/QuoteContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SaveForLaterDialog } from '@/components/financing/SaveForLaterDialog';
import { FinancingResumeDialog } from '@/components/financing/FinancingResumeDialog';
import { FormProgressIndicator } from '@/components/financing/FormProgressIndicator';
import { FinancingApplicationSkeleton } from '@/components/financing/FinancingApplicationSkeleton';
import { AccessibleFormWrapper } from '@/components/financing/AccessibleFormWrapper';
import { Mail, ArrowLeft } from 'lucide-react';
import harrisLogo from '@/assets/harris-logo.png';
import { PurchaseDetailsStep } from '@/components/financing/PurchaseDetailsStep';
import { ApplicantStep } from '@/components/financing/ApplicantStep';
import { EmploymentStep } from '@/components/financing/EmploymentStep';
import { FinancialStep } from '@/components/financing/FinancialStep';
import { CoApplicantStep } from '@/components/financing/CoApplicantStep';
import { ReferencesStep } from '@/components/financing/ReferencesStep';
import { ReviewSubmitStep } from '@/components/financing/ReviewSubmitStep';
import '@/styles/financing-mobile.css';

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
  const { state: financingState, dispatch: financingDispatch } = useFinancing();
  const { state: quoteState } = useQuote();
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

    // No draft found - proceed with quote pre-fill
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
      
      // Use complete package subtotal if available, otherwise fall back to motor price
      const packageSubtotal = (quoteData as any).financingAmount?.packageSubtotal;
      const motorPrice = packageSubtotal || quoteData.motor.salePrice || quoteData.motor.price || 0;
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
      financingDispatch({ 
        type: 'LOAD_FROM_DATABASE', 
        payload: savedDraft.data 
      });
    }
    setShowResumeDialog(false);
  };

  const handleStartFresh = () => {
    // Clear all saved drafts
    localStorage.removeItem('financing_draft');
    localStorage.removeItem('financingApplication');
    
    // Reset context to initial state
    financingDispatch({ type: 'RESET_APPLICATION' });
    
    // Pre-fill from quote if available
    const savedQuoteState = localStorage.getItem('quote_state');
    if (savedQuoteState) {
      try {
        const quoteData = JSON.parse(savedQuoteState);
        if (quoteData?.motor) {
          const packageSubtotal = quoteData.financingAmount?.packageSubtotal;
          const motorPrice = packageSubtotal || quoteData.motor.salePrice || quoteData.motor.price || 0;
          const tradeInValue = quoteData.financingAmount?.tradeInValue || quoteData.tradeInInfo?.estimatedValue || 0;
          const downPayment = 0;
          
          const motorModel = quoteData.financingAmount?.packageName 
            ? `${quoteData.motor.model || ''} (${quoteData.financingAmount.packageName})`
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
        localStorage.removeItem('quote_state');
      } catch (e) {
        console.error('Failed to parse quote state:', e);
      }
    }
    
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
              <CurrentStepComponent />
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
