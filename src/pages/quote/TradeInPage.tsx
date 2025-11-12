import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuoteLayout } from '@/components/quote-builder/QuoteLayout';
import { PageTransition } from '@/components/ui/page-transition';
import { TradeInValuation } from '@/components/quote-builder/TradeInValuation';
import { useQuote } from '@/contexts/QuoteContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import type { TradeInInfo } from '@/lib/trade-valuation';

export default function TradeInPage() {
  const navigate = useNavigate();
  const { state, dispatch, isStepAccessible } = useQuote();
  const [isReadyToNavigate, setIsReadyToNavigate] = useState(false);
  const [navigationTarget, setNavigationTarget] = useState<string | null>(null);
  const [tradeInInfo, setTradeInInfo] = useState<TradeInInfo>({
    hasTradeIn: false,
    brand: '',
    year: 0,
    horsepower: 0,
    model: '',
    serialNumber: '',
    condition: 'good' as const,
    estimatedValue: 0,
    confidenceLevel: 'medium' as const
  });

  // Watch for state updates completion and navigate when ready
  useEffect(() => {
    if (isReadyToNavigate && navigationTarget) {
      console.log('✅ TradeInPage: State synchronized, navigating to:', navigationTarget);
      navigate(navigationTarget);
      setIsReadyToNavigate(false);
      setNavigationTarget(null);
    }
  }, [isReadyToNavigate, navigationTarget, state.hasTradein, state.tradeInInfo, navigate]);

  useEffect(() => {
    // Trust navigation if we have required state
    if (state.motor && state.purchasePath) {
      // Load existing trade-in info if available
      if (state.tradeInInfo) {
        setTradeInInfo(state.tradeInInfo);
      }

      document.title = 'Trade-In Valuation | Harris Boat Works';
      
      let desc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      if (!desc) {
        desc = document.createElement('meta');
        desc.name = 'description';
        document.head.appendChild(desc);
      }
      desc.content = 'Get an instant trade-in valuation for your current outboard motor.';
      return;
    }

    // Only redirect if no motor selected
    if (!state.motor) {
      navigate('/quote/motor-selection');
    }
  }, [state.motor, state.purchasePath, state.tradeInInfo, navigate]);

  const handleTradeInChange = (updatedTradeInInfo: TradeInInfo) => {
    setTradeInInfo(updatedTradeInInfo);
  };

  const handleComplete = () => {
    console.log('🔄 TradeInPage handleComplete - tradeInInfo:', tradeInInfo);
    
    // If no trade-in, ensure clean state
    const finalTradeInInfo = tradeInInfo.hasTradeIn ? tradeInInfo : {
      hasTradeIn: false,
      brand: '',
      year: 0,
      horsepower: 0,
      model: '',
      serialNumber: '',
      condition: 'good' as const,
      estimatedValue: 0,
      confidenceLevel: 'medium' as const
    };
    
    // Dispatch all state updates
    dispatch({ type: 'SET_TRADE_IN_INFO', payload: finalTradeInInfo });
    dispatch({ type: 'SET_HAS_TRADEIN', payload: finalTradeInInfo.hasTradeIn });
    dispatch({ type: 'COMPLETE_STEP', payload: 4 });
    
    console.log('🚀 TradeInPage: State updates dispatched', {
      hasTradeIn: finalTradeInInfo.hasTradeIn,
      estimatedValue: finalTradeInInfo.estimatedValue
    });
    
    // Determine navigation target
    const target = state.purchasePath === 'installed' ? '/quote/installation' : '/quote/summary';
    setNavigationTarget(target);
    
    // Signal ready after dispatches (next render cycle)
    requestAnimationFrame(() => {
      console.log('✨ TradeInPage: Ready to navigate');
      setIsReadyToNavigate(true);
    });
  };

  const handleBack = () => {
    if (state.purchasePath === 'installed') {
      navigate('/quote/boat-info');
    } else {
      const isSmallTillerMotor = state.motor && state.motor.hp <= 9.9 && state.motor.type?.toLowerCase().includes('tiller');
      if (isSmallTillerMotor) {
        navigate('/quote/fuel-tank');
      } else {
        navigate('/quote/purchase-path');
      }
    }
  };

  return (
    <PageTransition>
      <QuoteLayout>
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleBack}
              className="border-gray-300 dark:border-gray-600 hover:border-gray-900 dark:hover:border-gray-100 dark:text-gray-100 dark:hover:bg-gray-800 font-light"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
          
          <TradeInValuation 
            tradeInInfo={tradeInInfo}
            onTradeInChange={handleTradeInChange}
            onAutoAdvance={handleComplete}
            currentMotorBrand={state.boatInfo?.currentMotorBrand}
            currentHp={state.boatInfo?.currentHp}
            currentMotorYear={state.boatInfo?.currentMotorYear}
          />
        </div>
      </QuoteLayout>
    </PageTransition>
  );
}