import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuoteLayout } from '@/components/quote-builder/QuoteLayout';
import { QuoteDisplay } from '@/components/quote-builder/QuoteDisplay';
import { WarrantySelector } from '@/components/quote-builder/WarrantySelector';
import { BonusOffers } from '@/components/quote-builder/BonusOffers';
import { StripePaymentButton } from '@/components/quote-builder/StripePaymentButton';
import { useQuote } from '@/contexts/QuoteContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function QuoteSummaryPage() {
  const navigate = useNavigate();
  const { state, dispatch, isStepAccessible, getQuoteData, isNavigationBlocked } = useQuote();

  useEffect(() => {
    // Add delay and loading check to prevent navigation during state updates
    const checkAccessibility = () => {
      if (!state.isLoading && !isNavigationBlocked && !isStepAccessible(6)) {
        navigate('/quote/motor-selection');
        return;
      }
    };

    // Standardized timeout to 500ms to match other pages
    const timeoutId = setTimeout(checkAccessibility, 500);

    document.title = 'Your Mercury Motor Quote | Harris Boat Works';
    
    let desc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!desc) {
      desc = document.createElement('meta');
      desc.name = 'description';
      document.head.appendChild(desc);
    }
    desc.content = 'Review your complete Mercury outboard motor quote with pricing, financing options, and bonus offers.';

    return () => clearTimeout(timeoutId);
  }, [state.isLoading, isStepAccessible, isNavigationBlocked, navigate]);

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

  // Calculate total cash price for Stripe integration
  const calculateTotalCashPrice = () => {
    const motorPrice = quoteData.motor?.salePrice || quoteData.motor?.basePrice || 0;
    const accessoryCosts = state.purchasePath === 'loose' ? 0 : 3800; // Simplified calculation
    const installationCost = state.installConfig?.selectedOption?.price || 0;
    const tradeInValue = state.tradeInInfo?.estimatedValue || 0;
    const subtotal = motorPrice + accessoryCosts + installationCost - tradeInValue;
    return subtotal * 1.13; // Add 13% HST
  };

  const totalCashPrice = calculateTotalCashPrice();

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
          purchasePath={state.purchasePath}
        />
        
        {/* Warranty selection section */}
        <WarrantySelector />
        
        {/* Bonus offers section under the warranty selector */}
        <BonusOffers motor={quoteData.motor} />
        
        {/* Stripe Payment Section */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3 text-purple-800">Complete Your Purchase</h3>
          <p className="text-sm text-purple-700 mb-4">
            Pay securely with your credit or debit card through Stripe
          </p>
          <StripePaymentButton
            quoteData={quoteData}
            motorPrice={quoteData.motor?.basePrice || 0} 
            accessoryCosts={0}
            totalCashPrice={totalCashPrice}
            hasTradeIn={!!state.tradeInInfo?.hasTradeIn}
            tradeInValue={state.tradeInInfo?.estimatedValue || 0}
          />
        </div>
      </div>
    </QuoteLayout>
  );
}