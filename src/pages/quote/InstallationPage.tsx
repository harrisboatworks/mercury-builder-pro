import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuoteLayout } from '@/components/quote-builder/QuoteLayout';
import { PageTransition } from '@/components/ui/page-transition';
import InstallationConfig from '@/components/quote-builder/InstallationConfig';
import { useQuote } from '@/contexts/QuoteContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
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
    // Trust navigation if we have required state for installed path
    if (state.motor && state.purchasePath === 'installed') {
      document.title = 'Installation Configuration | Harris Boat Works';
      
      let desc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      if (!desc) {
        desc = document.createElement('meta');
        desc.name = 'description';
        document.head.appendChild(desc);
      }
      desc.content = 'Configure your professional motor installation requirements and timeline.';
      return;
    }

    // Redirect to appropriate page based on state
    if (!state.motor) {
      navigate('/quote/motor-selection');
    } else if (state.purchasePath !== 'installed') {
      // If user has motor but wrong path, send them to summary
      navigate('/quote/summary');
    }
  }, [state.motor, state.purchasePath, navigate]);

  const handleStepComplete = (installConfig: any) => {
    dispatch({ type: 'SET_INSTALL_CONFIG', payload: installConfig });
    dispatch({ type: 'COMPLETE_STEP', payload: 5 });
    navigate('/quote/promo-selection');
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

  if (!state.motor || state.purchasePath !== 'installed') {
    return (
      <PageTransition>
        <QuoteLayout>
          <div className="text-center py-8">
            <p>Redirecting to motor selection...</p>
          </div>
        </QuoteLayout>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <QuoteLayout>
          <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handleBack} className="border-gray-300 hover:border-gray-900 font-light">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Trade-In
            </Button>
          </div>
          
          <InstallationConfig 
            selectedMotor={state.motor}
            onComplete={handleStepComplete}
          />
        </div>
      </QuoteLayout>
    </PageTransition>
  );
}