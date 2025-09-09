import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuoteLayout } from '@/components/quote-builder/QuoteLayout';
import { HeroPrice } from '@/components/quote-builder/HeroPrice';
import { PackageCards } from '@/components/quote-builder/PackageCards';
import { PromoPanel } from '@/components/quote-builder/PromoPanel';
import { PricingTable } from '@/components/quote-builder/PricingTable';
import { StickySummary } from '@/components/quote-builder/StickySummary';
import { MobileSummaryBar } from '@/components/quote-builder/MobileSummaryBar';
import { WarrantySelector } from '@/components/quote-builder/WarrantySelector';
import { BonusOffers } from '@/components/quote-builder/BonusOffers';

import { useQuote } from '@/contexts/QuoteContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { computeTotals, PACKAGE_CONFIGS } from '@/lib/quote-utils';
import { useActiveFinancingPromo } from '@/hooks/useActiveFinancingPromo';
import { useToast } from '@/hooks/use-toast';

export default function QuoteSummaryPage() {
  const navigate = useNavigate();
  const { state, dispatch, isStepAccessible, getQuoteData, isNavigationBlocked } = useQuote();
  const { promo } = useActiveFinancingPromo();
  const { toast } = useToast();
  const [selectedPackage, setSelectedPackage] = useState<string>('better');

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

  // Calculate pricing breakdown
  const motorPrice = quoteData.motor?.salePrice || quoteData.motor?.basePrice || quoteData.motor?.price || 0;
  const hp = quoteData.motor?.hp || 0;
  
  // Calculate accessories based on selected package
  const selectedPackageConfig = PACKAGE_CONFIGS.find(pkg => pkg.id === selectedPackage);
  const accessoryTotal = selectedPackageConfig ? selectedPackageConfig.additionalCost + 2500 : 2500; // Base rigging cost
  
  // Build accessory breakdown
  const accessoryBreakdown = [
    { name: 'Controls & Rigging', price: 2500, description: 'Premium marine controls and installation hardware' }
  ];
  
  if (selectedPackage !== 'good') {
    accessoryBreakdown.push({
      name: 'Marine Battery',
      price: 179.99,
      description: 'Marine starting battery (standard)'
    });
  }
  
  if (selectedPackage === 'best') {
    accessoryBreakdown.push({
      name: 'Extended Warranty',
      price: 500,
      description: 'Additional coverage and peace of mind'
    });
  }

  // Calculate totals
  const pricing = computeTotals({
    motorPrice,
    accessoryTotal,
    promotionalSavings: 0, // Would be calculated from active promotions
    tradeInValue: 0, // Would come from trade-in data
    taxRate: 0.13
  });

  // Get financing rate
  const financingRate = promo?.rate || 7.99;

  // Get package inclusions
  const packageInclusions = selectedPackageConfig?.inclusions || [];

  // CTA handlers (stub functions for now)
  const handleReserveDeposit = () => {
    toast({
      title: "Reserve Your Motor",
      description: "Deposit functionality would be integrated here.",
    });
  };

  const handleEmailQuote = () => {
    toast({
      title: "Email Quote",
      description: "Quote will be emailed to your address.",
    });
  };

  const handleTextQuote = () => {
    toast({
      title: "Text Quote",
      description: "Quote will be sent via SMS.",
    });
  };

  const handleBookConsult = () => {
    navigate('/quote/schedule');
  };

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackage(packageId);
  };

  return (
    <QuoteLayout title="Your Mercury Motor Quote">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Back Navigation */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-3 space-y-8">
            {/* Hero Price Section */}
            <HeroPrice 
              pricing={pricing}
              rate={financingRate}
              showMonthly={true}
            />

            {/* Package Selection */}
            <PackageCards
              basePricing={pricing}
              onPackageSelect={handlePackageSelect}
              selectedPackage={selectedPackage}
              rate={financingRate}
            />

            {/* Active Promotions */}
            <PromoPanel motorHp={hp} />

            {/* Detailed Pricing Breakdown */}
            <PricingTable
              pricing={pricing}
              motorName={quoteData.motor?.model || 'Mercury Motor'}
              accessoryBreakdown={accessoryBreakdown}
              tradeInValue={0}
            />
            
            {/* Legacy Components - Keep for compatibility */}
            <div className="grid md:grid-cols-2 gap-6">
              <WarrantySelector />
              <BonusOffers motor={quoteData.motor} />
            </div>

            {/* Mobile CTA Section */}
            <div className="lg:hidden space-y-4">
              <Button 
                onClick={handleStepComplete}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                size="lg"
              >
                Continue to Schedule
              </Button>
            </div>
          </div>

          {/* Sticky Summary - Right Column (Desktop) */}         
          <div className="lg:col-span-1">
            <StickySummary
              pricing={pricing}
              selectedPackage={selectedPackage}
              packageInclusions={packageInclusions}
              onReserveDeposit={handleReserveDeposit}
              onEmailQuote={handleEmailQuote}
              onTextQuote={handleTextQuote}
              onBookConsult={handleBookConsult}
              depositAmount={200}
              rate={financingRate}
            />
          </div>
        </div>

        {/* Mobile Summary Bar */}
        <MobileSummaryBar
          pricing={pricing}
          selectedPackage={selectedPackage}
          packageInclusions={packageInclusions}
          onReserveDeposit={handleReserveDeposit}
          onEmailQuote={handleEmailQuote}
          onTextQuote={handleTextQuote}
          onBookConsult={handleBookConsult}
          depositAmount={200}
          rate={financingRate}
        />
      </div>
    </QuoteLayout>
  );
}