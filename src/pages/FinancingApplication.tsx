import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFinancing } from '@/contexts/FinancingContext';
import { useQuote } from '@/contexts/QuoteContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SaveForLaterDialog } from '@/components/financing/SaveForLaterDialog';
import { FormProgressIndicator } from '@/components/financing/FormProgressIndicator';
import { FinancingApplicationSkeleton } from '@/components/financing/FinancingApplicationSkeleton';
import { AccessibleFormWrapper } from '@/components/financing/AccessibleFormWrapper';
import { Mail } from 'lucide-react';
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

export default function FinancingApplication() {
  const [searchParams] = useSearchParams();
  const { state: financingState, dispatch: financingDispatch } = useFinancing();
  const { state: quoteState } = useQuote();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Pre-fill from quote if available (URL params or localStorage)
  useEffect(() => {
    // Check URL params first
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
      
      // Calculate pricing
      const motorPrice = quoteData.motor.salePrice || quoteData.motor.price || 0;
      const tradeInValue = quoteData.tradeInInfo?.estimatedValue || 0;
      const downPayment = 0; // Will be set by user
      
      financingDispatch({
        type: 'SET_PURCHASE_DETAILS',
        payload: {
          motorModel: quoteData.motor.model || '',
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

  if (isLoading) {
    return <FinancingApplicationSkeleton />;
  }

  const CurrentStepComponent = stepComponents[financingState.currentStep as keyof typeof stepComponents];

  return (
    <div className="min-h-screen bg-white py-4 md:py-8 px-4 financing-form">
      {/* Minimal Luxury Header */}
      <div className="max-w-2xl mx-auto mb-8">
        <img 
          src={harrisLogo} 
          alt="Harris Boat Works" 
          className="h-10 md:h-12 w-auto"
        />
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
      </div>
    </div>
  );
}
