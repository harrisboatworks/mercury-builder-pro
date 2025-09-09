import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PremiumShell from '@/components/layout/PremiumShell';
import StepHeader from '@/components/ui/StepHeader';
import { useQuote } from '@/contexts/QuoteContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { BoatInfo } from '@/components/QuoteBuilder';

export default function BoatInfoPage() {
  const navigate = useNavigate();
  const { state, dispatch, isStepAccessible, isNavigationBlocked } = useQuote();

  useEffect(() => {
    // Add delay to prevent navigation during state updates
    const checkAccessibility = () => {
      // Only navigate if we're not in loading state, not navigation blocked, and have a valid motor selected
      if (!state.isLoading && !isNavigationBlocked && state.motor && !isStepAccessible(3)) {
        navigate('/quote/motor-selection');
        return;
      }
    };

    // Standardized delay to 500ms to match other pages
    const timeoutId = setTimeout(checkAccessibility, 500);

    document.title = 'Boat Information | Harris Boat Works';
    
    let desc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!desc) {
      desc = document.createElement('meta');
      desc.name = 'description';
      document.head.appendChild(desc);
    }
    desc.content = 'Provide your boat details for accurate motor compatibility and installation requirements.';

    return () => clearTimeout(timeoutId);
  }, [state.isLoading, isStepAccessible, isNavigationBlocked, navigate]);

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
    <PremiumShell 
      title="Configure Your Boat"
      subtitle="Help us match the perfect motor to your boat."
    >
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Purchase Path
        </Button>
      </div>

      <StepHeader 
        label="Boat Details" 
        help="Accurate boat information ensures proper motor compatibility and installation."
      >
        <div className="text-sm p-quiet">
          We'll verify compatibility before finalizing your quote. Have questions about boat specifications? Our team can help.
        </div>
      </StepHeader>
      
      <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {/* Simplified boat information form - remove gamification */}
        <div className="space-y-4">
          <div className="text-sm text-slate-600 dark:text-slate-300">
            Complete boat details form would go here - simplified without XP/gamification elements.
          </div>
          <Button onClick={() => handleStepComplete({} as BoatInfo)} className="w-full">
            Continue to Trade-In
          </Button>
        </div>
      </div>
    </PremiumShell>
  );
}