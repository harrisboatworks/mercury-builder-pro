import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuoteLayout } from '@/components/quote-builder/QuoteLayout';
import FuelTankOptions from '@/components/quote-builder/FuelTankOptions';
import { useQuote } from '@/contexts/QuoteContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function FuelTankPage() {
  const navigate = useNavigate();
  const { state, dispatch, isStepAccessible } = useQuote();

  useEffect(() => {
    // Only accessible for small tiller motors on loose path
    const isSmallTillerMotor = state.motor && state.motor.hp <= 9.9 && state.motor.type?.toLowerCase().includes('tiller');
    if (!isStepAccessible(3) || state.purchasePath !== 'loose' || !isSmallTillerMotor) {
      navigate('/quote/motor-selection');
      return;
    }

    document.title = 'Fuel Tank Options | Harris Boat Works';
    
    let desc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!desc) {
      desc = document.createElement('meta');
      desc.name = 'description';
      document.head.appendChild(desc);
    }
    desc.content = 'Choose the right fuel tank configuration for your portable Mercury outboard motor.';
  }, [state.motor, state.purchasePath, isStepAccessible, navigate]);

  const handleStepComplete = (fuelTankConfig: any) => {
    dispatch({ type: 'SET_FUEL_TANK_CONFIG', payload: fuelTankConfig });
    dispatch({ type: 'COMPLETE_STEP', payload: 3 });
    navigate('/quote/trade-in');
  };

  const handleBack = () => {
    navigate('/quote/purchase-path');
  };

  return (
    <QuoteLayout title="Fuel Tank Configuration">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Purchase Path
          </Button>
        </div>
        
        <FuelTankOptions 
          selectedMotor={state.motor!}
          onComplete={handleStepComplete}
          onBack={handleBack}
        />
      </div>
    </QuoteLayout>
  );
}