import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { TradeInValuation } from '@/components/quote-builder/TradeInValuation';
import { useQuote } from '@/contexts/QuoteContext';
import { type TradeInInfo } from '@/lib/trade-valuation';

const INITIAL_TRADE_IN: TradeInInfo = {
  hasTradeIn: true,
  brand: '',
  year: 0,
  horsepower: 0,
  model: '',
  serialNumber: '',
  condition: 'good',
  estimatedValue: 0,
  confidenceLevel: 'medium',
};

function hasTradeInDetails(info: Partial<TradeInInfo>): boolean {
  return Boolean(
    info.brand?.trim() || info.year || info.horsepower || info.model?.trim()
  );
}

export function TradeInValueEstimator() {
  const [tradeInInfo, setTradeInInfo] = useState<TradeInInfo>(INITIAL_TRADE_IN);
  const { dispatch } = useQuote();
  const navigate = useNavigate();
  const hasEstimate = tradeInInfo.estimatedValue > 0;
  const canContinue = hasTradeInDetails(tradeInInfo);

  const handleContinueToQuote = () => {
    const promoted: TradeInInfo = { ...tradeInInfo, hasTradeIn: true };
    dispatch({ type: 'PROMOTE_TRADE_IN', payload: promoted });
    navigate('/quote/motor-selection');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="font-display text-2xl font-bold tracking-[-0.025em] text-repower-navy-900">
          Estimate your trade-in value
        </h3>
        <p className="font-sans text-sm text-repower-navy-900/65">
          Estimate your motor's trade-in value, then carry its details into a Mercury quote.
        </p>
      </div>

      <TradeInValuation
        standalone
        tradeInInfo={tradeInInfo}
        onTradeInChange={setTradeInInfo}
        onAutoAdvance={handleContinueToQuote}
      />

      {canContinue && (
        <div className="rounded border border-repower-navy-900/10 bg-repower-cream p-6 text-center">
          <p className="font-display text-lg text-repower-navy-900 mb-4">
            {hasEstimate
              ? 'Ready to apply this trade-in to a Mercury quote?'
              : 'Ready to keep building your Mercury quote?'}
          </p>
          <button
            type="button"
            onClick={handleContinueToQuote}
            className="group inline-flex items-center gap-2 bg-repower-mercury-red text-repower-cream px-6 py-3 font-sans font-bold text-[13px] uppercase tracking-[0.14em] hover:bg-repower-mercury-red-deep transition-colors"
          >
            {hasEstimate
              ? 'Continue With This Trade-In'
              : 'Continue With These Trade-In Details'}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      )}
    </div>
  );
}

export default TradeInValueEstimator;
