import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuoteLayout } from '@/components/quote-builder/QuoteLayout';
import { QuotePageShell } from '@/components/quote-builder/redesign/QuotePageShell';
import { PageTransition } from '@/components/ui/page-transition';
import FuelTankOptions from '@/components/quote-builder/FuelTankOptions';
import { useQuote } from '@/contexts/QuoteContext';
import { ArrowLeft } from 'lucide-react';

export default function FuelTankPage() {
  const navigate = useNavigate();
  const { state, dispatch, isStepAccessible } = useQuote();

  useEffect(() => {
    const isSmallTillerMotor = state.motor && state.motor.hp <= 9.9 && state.motor.type?.toLowerCase().includes('tiller');
    
    // Trust navigation if we have the right state for this optional step
    if (state.motor && state.purchasePath === 'loose' && isSmallTillerMotor) {
      document.title = 'Fuel Tank Options | Harris Boat Works';
      
      let desc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      if (!desc) {
        desc = document.createElement('meta');
        desc.name = 'description';
        document.head.appendChild(desc);
      }
      desc.content = 'Choose the right fuel tank configuration for your portable Mercury outboard motor.';
      return;
    }

    // Redirect if wrong path or wrong motor type
    if (!state.motor || state.purchasePath !== 'loose' || !isSmallTillerMotor) {
      navigate('/quote/motor-selection');
    }
  }, [state.motor, state.purchasePath, navigate]);

  const handleStepComplete = (fuelTankConfig: any) => {
    dispatch({ type: 'SET_FUEL_TANK_CONFIG', payload: fuelTankConfig });
    dispatch({ type: 'COMPLETE_STEP', payload: 3 });
    navigate('/quote/trade-in');
  };

  const handleBack = () => {
    navigate('/quote/purchase-path');
  };

  return (
    <PageTransition>
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
          eyebrow="Step 3 · Fuel Tank"
          title="Choose your fuel tank"
          subhead="Portable Mercury motors run on an external tank. Pick the setup that fits your boat."
          className="!py-6 md:!py-8"
        >
          <FuelTankOptions
            selectedMotor={state.motor!}
            onComplete={handleStepComplete}
            onBack={handleBack}
          />
        </QuotePageShell>
      </QuoteLayout>
    </PageTransition>
  );
}