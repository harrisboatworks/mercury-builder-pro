import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFinancing } from '@/contexts/FinancingContext';
import { useQuote } from '@/contexts/QuoteContext';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { PurchaseDetailsStep } from '@/components/financing/PurchaseDetailsStep';
import { ApplicantStep } from '@/components/financing/ApplicantStep';
import { EmploymentStep } from '@/components/financing/EmploymentStep';
import { FinancialStep } from '@/components/financing/FinancialStep';
import { CoApplicantStep } from '@/components/financing/CoApplicantStep';
import { ReferencesStep } from '@/components/financing/ReferencesStep';
import { ReviewSubmitStep } from '@/components/financing/ReviewSubmitStep';

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

  // Pre-fill from quote if quote_id is provided
  useEffect(() => {
    const quoteId = searchParams.get('quote');
    if (quoteId && quoteState.motor) {
      financingDispatch({ type: 'SET_QUOTE_ID', payload: quoteId });
      
      // Pre-fill purchase details from quote
      const motorPrice = (quoteState.motor.price || 0);
      const downPayment = 0; // Will be set by user
      const tradeInValue = quoteState.tradeInInfo?.estimatedValue || 0;
      
      financingDispatch({
        type: 'SET_PURCHASE_DETAILS',
        payload: {
          motorModel: quoteState.motor.model || '',
          motorPrice: motorPrice,
          downPayment: downPayment,
          tradeInValue: tradeInValue,
          amountToFinance: motorPrice - downPayment - tradeInValue,
        },
      });
    }
  }, [searchParams, quoteState, financingDispatch]);

  const progress = (financingState.completedSteps.length / 7) * 100;
  const CurrentStepComponent = stepComponents[financingState.currentStep as keyof typeof stepComponents];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-foreground">Financing Application</h1>
            <span className="text-sm text-muted-foreground">
              Step {financingState.currentStep} of 7
            </span>
          </div>
          
          <Progress value={progress} className="h-2 mb-2" />
          
          <p className="text-sm text-muted-foreground">
            {stepTitles[financingState.currentStep as keyof typeof stepTitles]}
          </p>
        </div>

        {/* Step Content */}
        <Card className="p-6 sm:p-8">
          {CurrentStepComponent ? (
            <CurrentStepComponent />
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Step {financingState.currentStep} coming soon</p>
              <p className="text-sm text-muted-foreground mt-2">
                Steps 1-2 are now complete
              </p>
            </div>
          )}
        </Card>

        {/* Save & Continue Later Link */}
        <div className="mt-6 text-center">
          <button
            className="text-sm text-primary hover:text-primary/80 underline transition-colors"
            onClick={() => {
              console.log('Save & continue later - Phase 4');
            }}
          >
            Save & Continue Later
          </button>
        </div>
      </div>
    </div>
  );
}
