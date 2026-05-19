import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuoteLayout } from '@/components/quote-builder/QuoteLayout';
import { QuotePageShell } from '@/components/quote-builder/redesign/QuotePageShell';
import { PageTransition } from '@/components/ui/page-transition';
import { BoatInformation } from '@/components/quote-builder/BoatInformation';
import { BoatInfoPageSEO } from '@/components/seo/BoatInfoPageSEO';
import { useQuote } from '@/contexts/QuoteContext';
import { ArrowLeft } from 'lucide-react';
import { BoatInfo } from '@/components/QuoteBuilder';
import { useMotorMonthlyPayment } from '@/hooks/useMotorMonthlyPayment';

export default function BoatInfoPage() {
  const navigate = useNavigate();
  const { state, dispatch, isStepAccessible, isNavigationBlocked } = useQuote();
  
  // Get monthly payment if motor is selected
  const monthlyPayment = useMotorMonthlyPayment({ 
    motorPrice: state.motor?.price || 0 
  });

  useEffect(() => {
    // Don't redirect if we have the required state - trust the navigation
    if (state.motor && state.purchasePath) {
      document.title = 'Boat Information | Harris Boat Works';
      
      let desc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      if (!desc) {
        desc = document.createElement('meta');
        desc.name = 'description';
        document.head.appendChild(desc);
      }
      desc.content = 'Provide your boat details for accurate motor compatibility and installation requirements.';
      return;
    }

    // Only redirect if clearly inaccessible (no motor selected at all)
    if (!state.isLoading && !isNavigationBlocked && !state.motor) {
      navigate('/quote/motor-selection');
    }
  }, [state.motor, state.purchasePath, state.isLoading, isNavigationBlocked, navigate]);

  const handleStepComplete = (boatInfo: BoatInfo) => {
    dispatch({ type: 'SET_BOAT_INFO', payload: boatInfo });
    dispatch({ type: 'COMPLETE_STEP', payload: 3 });
    navigate('/quote/trade-in');
  };

  const handleBack = () => {
    navigate('/quote/purchase-path');
  };

  const handleShowCompatibleMotors = () => {
    navigate('/quote/motor-selection');
  };

  const getModelString = () => {
    if (!state.motor) return undefined;
    return `${state.motor.year} Mercury ${state.motor.hp}HP ${state.motor.model}`;
  };

  const getTotalWithTax = () => {
    if (!state.motor?.price) return undefined;
    return Math.round(state.motor.price * 1.13); // 13% HST
  };

  const getCoverageYears = () => {
    const baseYears = 3; // Standard Mercury warranty
    const extendedYears = state.warrantyConfig?.extendedYears || 0;
    return baseYears + extendedYears;
  };

  return (
    <PageTransition>
      <BoatInfoPageSEO />
      <QuoteLayout>
        <div className="mx-auto w-full max-w-[880px] px-6 pt-8">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 font-sans text-[12px] font-semibold uppercase tracking-[0.14em] text-repower-navy-900/65 hover:text-repower-mercury-red transition-colors min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
        <QuotePageShell
          eyebrow="Step 3 · Your Boat"
          title="Tell us about your boat"
          subhead="A few details help us match the right shaft length, controls, and rigging."
          className="!py-6 md:!py-8"
        >
          <BoatInformation
            onStepComplete={handleStepComplete}
            onBack={handleBack}
            selectedMotor={state.motor!}
            onShowCompatibleMotors={handleShowCompatibleMotors}
            includeTradeIn={false}
          />
        </QuotePageShell>
      </QuoteLayout>
    </PageTransition>
  );
}