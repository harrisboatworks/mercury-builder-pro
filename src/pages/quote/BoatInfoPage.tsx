import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuoteLayout } from '@/components/quote-builder/QuoteLayout';
import { BoatInformation } from '@/components/quote-builder/BoatInformation';
import { useQuote } from '@/contexts/QuoteContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { BoatInfo } from '@/components/QuoteBuilder';

export default function BoatInfoPage() {
  const navigate = useNavigate();
  const { state, dispatch, isStepAccessible } = useQuote();

  useEffect(() => {
    // Add delay to prevent navigation during state updates
    const checkAccessibility = () => {
      if (!state.isLoading && !isStepAccessible(3)) {
        navigate('/quote/motor-selection');
        return;
      }
    };

    // Delay the accessibility check to allow for state synchronization
    const timeoutId = setTimeout(checkAccessibility, 100);

    document.title = 'Boat Information | Harris Boat Works';
    
    let desc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!desc) {
      desc = document.createElement('meta');
      desc.name = 'description';
      document.head.appendChild(desc);
    }
    desc.content = 'Provide your boat details for accurate motor compatibility and installation requirements.';

    return () => clearTimeout(timeoutId);
  }, [state.isLoading, isStepAccessible, navigate]);

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

  return (
    <QuoteLayout title="Boat Information">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Purchase Path
          </Button>
        </div>
        
        <BoatInformation 
          onStepComplete={handleStepComplete}
          onBack={handleBack}
          selectedMotor={state.motor!}
          onShowCompatibleMotors={handleShowCompatibleMotors}
          includeTradeIn={false}
        />
      </div>
    </QuoteLayout>
  );
}