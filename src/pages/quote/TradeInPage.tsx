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
    dispatch({ type: 'SET_TRADE_IN_INFO', payload: tradeInInfo });
    dispatch({ type: 'SET_HAS_TRADEIN', payload: tradeInInfo.hasTradeIn || false });
    dispatch({ type: 'COMPLETE_STEP', payload: 4 });
    
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
    <QuoteLayout title="Trade-In Valuation">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        
        <div className="space-y-4">
          <TradeInValuation 
            tradeInInfo={tradeInInfo}
            onTradeInChange={handleTradeInChange}
            currentMotorBrand={state.boatInfo?.currentMotorBrand || 'Mercury'}
            currentHp={state.boatInfo?.currentHp || (typeof state.motor?.hp === 'string' ? parseInt(state.motor.hp, 10) : state.motor?.hp)}
            autoAdvance={true}
            onComplete={handleComplete}
          />
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button onClick={handleComplete}>
              Continue to {state.purchasePath === 'installed' ? 'Installation' : 'Quote'}
            </Button>
          </div>
        </div>
      </div>
    </QuoteLayout>
  );
}