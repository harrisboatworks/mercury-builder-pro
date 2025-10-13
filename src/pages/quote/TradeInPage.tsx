import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuoteLayout } from '@/components/quote-builder/QuoteLayout';
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
    // Redirect if step not accessible
    if (!isStepAccessible(4)) {
      navigate('/quote/motor-selection');
      return;
    }

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
  }, [isStepAccessible, navigate, state.tradeInInfo]);

  const handleTradeInChange = (updatedTradeInInfo: TradeInInfo) => {
    setTradeInInfo(updatedTradeInInfo);
  };

  const handleComplete = () => {
    console.log('TradeInPage handleComplete - tradeInInfo:', tradeInInfo);
    
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
    
    dispatch({ type: 'SET_TRADE_IN_INFO', payload: finalTradeInInfo });
    dispatch({ type: 'SET_HAS_TRADEIN', payload: finalTradeInInfo.hasTradeIn });
    dispatch({ type: 'COMPLETE_STEP', payload: 4 });
    
    console.log('Navigating to next step - purchasePath:', state.purchasePath);
    
    if (state.purchasePath === 'installed') {
      navigate('/quote/installation');
    } else {
      navigate('/quote/summary');
    }
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
  );
}