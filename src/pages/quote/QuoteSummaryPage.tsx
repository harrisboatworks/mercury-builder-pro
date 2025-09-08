import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuoteLayout } from '@/components/quote-builder/QuoteLayout';
import { QuoteDisplay } from '@/components/quote-builder/QuoteDisplay';
import { BonusOffers } from '@/components/quote-builder/BonusOffers';
import { useQuote } from '@/contexts/QuoteContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function QuoteSummaryPage() {
  const navigate = useNavigate();
  const { state, dispatch, isStepAccessible, getQuoteData } = useQuote();

  useEffect(() => {
    // Add delay and loading check to prevent navigation during state updates
    const checkAccessibility = () => {
      if (!state.isLoading && !isStepAccessible(6)) {
        navigate('/quote/motor-selection');
        return;
      }
    };

    // Delay the accessibility check to allow for state synchronization
    const timeoutId = setTimeout(checkAccessibility, 100);

    document.title = 'Your Mercury Motor Quote | Harris Boat Works';
    
    let desc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!desc) {
      desc = document.createElement('meta');
      desc.name = 'description';
      document.head.appendChild(desc);
    }
    desc.content = 'Review your complete Mercury outboard motor quote with pricing, financing options, and bonus offers.';

    return () => clearTimeout(timeoutId);
  }, [state.isLoading, isStepAccessible, navigate]);

  const handleStepComplete = () => {
    dispatch({ type: 'COMPLETE_STEP', payload: 6 });
    navigate('/quote/schedule');
  };

  const handleBack = () => {
    if (state.purchasePath === 'installed') {
      navigate('/quote/installation');
    } else {
      navigate('/quote/trade-in');
    }
  };

  const quoteData = getQuoteData();

  return (
    <QuoteLayout title="Your Mercury Motor Quote">
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        
        <QuoteDisplay 
          quoteData={quoteData}
          onStepComplete={handleStepComplete} 
          onBack={handleBack}
        />
        
        {/* Bonus offers section under the quote details */}
        <BonusOffers motor={quoteData.motor} />
      </div>
    </QuoteLayout>
  );
}