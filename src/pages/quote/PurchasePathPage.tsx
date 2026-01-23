import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuoteLayout } from '@/components/quote-builder/QuoteLayout';
import { PageTransition } from '@/components/ui/page-transition';
import PurchasePath from '@/components/quote-builder/PurchasePath';
import { useQuote } from '@/contexts/QuoteContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function PurchasePathPage() {
  const navigate = useNavigate();
  const { state, dispatch, isStepAccessible, isNavigationBlocked } = useQuote();
  const pathSelectedOnThisPage = useRef(false);

  useEffect(() => {
    document.title = 'Choose Installation Option | Harris Boat Works';
    
    let desc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!desc) {
      desc = document.createElement('meta');
      desc.name = 'description';
      document.head.appendChild(desc);
    }
    desc.content = 'Choose between professional installation or loose motor purchase for your Mercury outboard.';
  }, []);

  // Prefetch likely next pages for faster navigation
  useEffect(() => {
    // Prefetch trade-in page (most common next step)
    import('@/pages/quote/TradeInPage');
    // Prefetch boat-info page (for installed path)
    import('@/pages/quote/BoatInfoPage');
  }, []);

  // Separate effect for access control check - only runs on mount
  useEffect(() => {
    if (!state.isLoading && !isNavigationBlocked && !isStepAccessible(2)) {
      navigate('/quote/motor-selection');
    }
  }, []);

  // Navigate after purchase path is set (state has been committed)
  useEffect(() => {
    // Only proceed if we have a motor, purchase path is set, step 2 is complete, AND user selected path on this page
    if (!state.motor || !state.purchasePath || !state.completedSteps.includes(2) || !pathSelectedOnThisPage.current) {
      return;
    }

    // Small delay to ensure state is fully committed and navigation isn't blocked
    const navigationTimer = setTimeout(() => {
      if (state.purchasePath === 'installed') {
        // Check if it's a tiller motor
        const model = (state.motor?.model || '').toUpperCase();
        const hp = typeof state.motor?.hp === 'string' ? parseInt(state.motor.hp, 10) : state.motor?.hp;
        const isTiller = model.includes('TILLER') || (hp && hp <= 30 && (model.includes('EH') || model.includes('MH') || /\bH\b/.test(model)));
        
        if (isTiller) {
          navigate('/quote/trade-in');
        } else {
          navigate('/quote/boat-info');
        }
      } else {
        // For loose path
        const isSmallTillerMotor = state.motor && state.motor.hp <= 9.9 && state.motor.type?.toLowerCase().includes('tiller');
        if (isSmallTillerMotor) {
          navigate('/quote/fuel-tank');
        } else {
          navigate('/quote/trade-in');
        }
      }
    }, 150);

    return () => clearTimeout(navigationTimer);
  }, [state.purchasePath, state.completedSteps, state.motor, navigate]);

  const handleStepComplete = (path: 'loose' | 'installed') => {
    pathSelectedOnThisPage.current = true;
    dispatch({ type: 'SET_PURCHASE_PATH', payload: path });
    
    // Clear installation config when selecting loose motor (no installation)
    if (path === 'loose') {
      dispatch({ type: 'SET_INSTALL_CONFIG', payload: null });
    }
    
    dispatch({ type: 'COMPLETE_STEP', payload: 2 });
    // Navigation handled by useEffect above
  };

  const handleBack = () => {
    navigate('/quote/motor-selection');
  };

  return (
    <PageTransition>
      <QuoteLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handleBack} className="border-gray-300 hover:border-gray-900 font-light">
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
    </PageTransition>
  );
}