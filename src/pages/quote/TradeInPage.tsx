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

  useEffect(() => {
    // Trust navigation if we have required state
    if (state.motor && state.purchasePath) {
      // Always start with clean trade-in state - no auto-loading from context
      console.log('🧹 TradeInPage: Starting with clean trade-in state');
      setTradeInInfo({
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
  }, [state.motor, state.purchasePath, navigate]);

  const handleTradeInChange = (updatedTradeInInfo: TradeInInfo) => {
    console.log('🔄 TradeInPage: Trade-in changed', {
      hasTradeIn: updatedTradeInInfo.hasTradeIn,
      brand: updatedTradeInInfo.brand,
      estimatedValue: updatedTradeInInfo.estimatedValue
    });
    
    setTradeInInfo(updatedTradeInInfo);
    
    // Dispatch immediately to context (don't wait for handleComplete)
    dispatch({ type: 'SET_TRADE_IN_INFO', payload: updatedTradeInInfo });
    dispatch({ type: 'SET_HAS_TRADEIN', payload: updatedTradeInInfo.hasTradeIn });
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
    
    // If no trade-in, clear it from localStorage before navigating
    if (!finalTradeInInfo.hasTradeIn) {
      try {
        const stored = localStorage.getItem('quoteBuilder');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.state) {
            parsed.state.tradeInInfo = finalTradeInInfo;
            parsed.state.hasTradein = false;
            localStorage.setItem('quoteBuilder', JSON.stringify(parsed));
            console.log('🧹 Cleared trade-in from localStorage on navigation');
          }
        }
      } catch (e) {
        console.error('Failed to clear localStorage:', e);
      }
    }
    
    // Dispatch all state updates - React 18 will batch these automatically
    dispatch({ type: 'SET_TRADE_IN_INFO', payload: finalTradeInInfo });
    dispatch({ type: 'SET_HAS_TRADEIN', payload: finalTradeInInfo.hasTradeIn });
    dispatch({ type: 'COMPLETE_STEP', payload: 4 });
    
    console.log('🚀 TradeInPage: State updates dispatched, navigating', {
      hasTradeIn: finalTradeInInfo.hasTradeIn,
      estimatedValue: finalTradeInInfo.estimatedValue
    });
    
    // Navigate immediately - React 18 batches state updates automatically
    const target = state.purchasePath === 'installed' ? '/quote/installation' : '/quote/summary';
    navigate(target);
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
              className="border-gray-300 hover:border-gray-900 font-light"
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