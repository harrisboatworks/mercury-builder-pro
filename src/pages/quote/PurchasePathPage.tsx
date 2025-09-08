import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuoteLayout } from '@/components/quote-builder/QuoteLayout';
import PurchasePath from '@/components/quote-builder/PurchasePath';
import { useQuote } from '@/contexts/QuoteContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { isTillerMotor } from '@/lib/utils';

export default function PurchasePathPage() {
  const navigate = useNavigate();
  const { state, dispatch, isStepAccessible } = useQuote();

  useEffect(() => {
    // Redirect if step not accessible
    if (!isStepAccessible(2)) {
      navigate('/quote/motor-selection');
      return;
    }

    document.title = 'Choose Installation Option | Harris Boat Works';
    
    let desc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!desc) {
      desc = document.createElement('meta');
      desc.name = 'description';
      document.head.appendChild(desc);
    }
    desc.content = 'Choose between professional installation or loose motor purchase for your Mercury outboard.';
  }, [isStepAccessible, navigate]);

  const handleStepComplete = (path: 'loose' | 'installed') => {
    dispatch({ type: 'SET_PURCHASE_PATH', payload: path });
    dispatch({ type: 'COMPLETE_STEP', payload: 2 });
    
    if (path === 'installed') {
      // Check if it's a tiller motor using Mercury's naming convention
      const isTiller = state.motor && isTillerMotor(state.motor.model || '');
      
      if (isTiller) {
        // Tiller motors don't need installation configuration, skip to trade-in
        navigate('/quote/trade-in');
      } else {
        // Non-tiller motors need installation configuration
        navigate('/quote/boat-info');
      }
    } else {
      // For loose path, check if it's a small tiller motor
      const isSmallTillerMotor = state.motor && state.motor.hp <= 9.9 && state.motor.type?.toLowerCase().includes('tiller');
      if (isSmallTillerMotor) {
        navigate('/quote/fuel-tank');
      } else {
        navigate('/quote/trade-in');
      }
    }
  };

  const handleBack = () => {
    navigate('/quote/motor-selection');
  };

  return (
    <QuoteLayout title="Choose Installation Option">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Motor Selection
          </Button>
        </div>
        
        <PurchasePath 
          selectedMotor={state.motor!}
          onSelectPath={handleStepComplete}
        />
      </div>
    </QuoteLayout>
  );
}