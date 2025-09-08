import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuoteLayout } from '@/components/quote-builder/QuoteLayout';
import InstallationConfig from '@/components/quote-builder/InstallationConfig';
import { useQuote } from '@/contexts/QuoteContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { isTillerMotor } from '@/lib/utils';

export default function InstallationPage() {
  const navigate = useNavigate();
  const { state, dispatch, isStepAccessible } = useQuote();

  useEffect(() => {
    // Only accessible for installed path
    if (!isStepAccessible(5) || state.purchasePath !== 'installed') {
      navigate('/quote/motor-selection');
      return;
    }

    // Redirect tiller motors directly to quote summary (they don't need installation config)
    if (state.motor && isTillerMotor(state.motor.model || '')) {
      navigate('/quote/summary');
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

  return (
    <QuoteLayout title="Installation Configuration">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Trade-In
          </Button>
        </div>
        
        <InstallationConfig 
          selectedMotor={state.motor!}
          onComplete={handleStepComplete}
        />
      </div>
    </QuoteLayout>
  );
}