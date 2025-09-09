import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuoteLayout } from '@/components/quote-builder/QuoteLayout';
import InstallationConfig from '@/components/quote-builder/InstallationConfig';
import { useQuote } from '@/contexts/QuoteContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import StickyQuoteBar from '@/components/quote/StickyQuoteBar';
import { useMotorMonthlyPayment } from '@/hooks/useMotorMonthlyPayment';
import { computeDelta } from '@/lib/ui-delta';

export default function InstallationPage() {
  const navigate = useNavigate();
  const { state, dispatch, isStepAccessible } = useQuote();
  
  // Track previous totals for delta calculation
  const [prevTotal, setPrevTotal] = useState<number | null>(null);
  const [prevMonthly, setPrevMonthly] = useState<number | null>(null);
  
  // Get monthly payment if motor is selected
  const monthlyPayment = useMotorMonthlyPayment({ 
    motorPrice: state.motor?.price || 0 
  });

  useEffect(() => {
    // Add defensive checks
    if (!state || !state.motor) {
      navigate('/quote/motor-selection');
      return;
    }
    
    // Only accessible for installed path
    if (!isStepAccessible(5) || state.purchasePath !== 'installed') {
      navigate('/quote/motor-selection');
      return;
    }

    document.title = 'Installation Configuration | Harris Boat Works';
    
    let desc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!desc) {
      desc = document.createElement('meta');
      desc.name = 'description';
      document.head.appendChild(desc);
    }
    desc.content = 'Configure your professional motor installation requirements and timeline.';
  }, [state.purchasePath, isStepAccessible, navigate]);

  const handleStepComplete = (installConfig: any) => {
    dispatch({ type: 'SET_INSTALL_CONFIG', payload: installConfig });
    dispatch({ type: 'COMPLETE_STEP', payload: 5 });
    navigate('/quote/summary');
  };

  const handleBack = () => {
    navigate('/quote/trade-in');
  };

  const getModelString = () => {
    if (!state.motor) return undefined;
    return `${state.motor.year} Mercury ${state.motor.hp}HP ${state.motor.model}`;
  };

  const getTotalWithTax = () => {
    if (!state.motor?.price) return null;
    // Add installation costs if any
    let total = state.motor.price;
    if (state.installConfig?.removeDispose) total += 200;
    if (state.installConfig?.waterTest) total += 150;
    return Math.round(total * 1.13); // 13% HST
  };

  const getCoverageYears = () => {
    const baseYears = 3; // Standard Mercury warranty
    const extendedYears = state.warrantyConfig?.extendedYears || 0;
    return baseYears + extendedYears;
  };

  // Calculate deltas for price changes
  const currentTotal = getTotalWithTax();
  const currentMonthly = monthlyPayment?.amount || null;
  
  const deltaOnce = {
    cash: computeDelta(prevTotal, currentTotal),
    monthly: computeDelta(prevMonthly, currentMonthly)
  };

  // Update previous values when totals change
  useEffect(() => {
    if (currentTotal !== null && currentTotal !== prevTotal) {
      setPrevTotal(currentTotal);
    }
    if (currentMonthly !== null && currentMonthly !== prevMonthly) {
      setPrevMonthly(currentMonthly);
    }
  }, [currentTotal, currentMonthly]);

  return (
    <>
      <QuoteLayout title="Installation Configuration">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Trade-In
            </Button>
          </div>
          
          {state.motor ? (
            <InstallationConfig 
              selectedMotor={state.motor}
              onComplete={handleStepComplete}
            />
          ) : (
            <div className="text-center py-8">
              <p>Loading installation configuration...</p>
            </div>
          )}
        </div>
      </QuoteLayout>
      
      {/* Sticky Quote Bar - show when motor is selected */}
      {state.motor && (
        <StickyQuoteBar
          model={getModelString()}
          total={currentTotal}
          monthly={currentMonthly}
          coverageYears={getCoverageYears()}
          stepLabel="Step 3 of 7"
          primaryLabel="Continue"
          secondaryLabel="Edit Motor"
          onPrimary={() => navigate('/quote/summary')}
          onSecondary={() => navigate('/quote/motor-selection')}
          deltaOnce={deltaOnce}
        />
      )}
    </>
  );
}