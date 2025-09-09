import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuoteLayout } from '@/components/quote-builder/QuoteLayout';
import HeroPrice from '@/components/quote-builder/HeroPrice';
import { PackageCards, type PackageOption } from '@/components/quote-builder/PackageCards';
import StickySummary from '@/components/quote-builder/StickySummary';
import { PromoPanel } from '@/components/quote-builder/PromoPanel';
import { PricingTable } from '@/components/quote-builder/PricingTable';
import { WarrantySelector } from '@/components/quote-builder/WarrantySelector';
import { BonusOffers } from '@/components/quote-builder/BonusOffers';

import { useQuote } from '@/contexts/QuoteContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { computeTotals } from '@/lib/finance';
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
  
  // Mock data - replace with real quote data
  const data = {
    msrp: motorPrice + 2500, // Motor + base accessories
    discount: 546,
    promoValue: 400,
    subtotal: motorPrice + 2500 - 546 - 400,
    tax: (motorPrice + 2500 - 546 - 400) * 0.13,
    total: (motorPrice + 2500 - 546 - 400) * 1.13,
  };
  
  const totals = computeTotals(data);

  // Package options
  const packages: PackageOption[] = [
    { 
      id: "good", 
      label: "Essential", 
      priceBeforeTax: data.subtotal, 
      savings: totals.savings, 
      features: ["Mercury motor", "Standard controls & rigging", "Basic installation"] 
    },
    { 
      id: "better", 
      label: "Complete", 
      priceBeforeTax: data.subtotal + 179.99, 
      savings: totals.savings + 50, 
      features: ["Mercury motor", "Premium controls & rigging", "Marine starting battery", "Standard propeller", "Priority installation"], 
      recommended: true 
    },
    { 
      id: "best", 
      label: "Premium", 
      priceBeforeTax: data.subtotal + 179.99 + 500, 
      savings: totals.savings + 150, 
      features: ["Mercury motor", "Premium controls & rigging", "Marine starting battery", "Performance propeller upgrade", "Extended warranty", "White-glove installation"] 
    },
  ];

  // Build accessory breakdown for legacy components
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

  // Get financing rate
  const financingRate = promo?.rate || 7.99;

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

  const selectedPackageData = packages.find(p => p.id === selectedPackage) || packages[1];

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
        
        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          {/* Main Content - Left Column */}
          <div className="space-y-6">
            {/* Hero Price Section */}
            <HeroPrice 
              yourPriceBeforeTax={totals.subtotal}
              totalWithTax={totals.total}
              discount={totals.discount}
              promoValue={totals.promoValue}
              showMonthly={true}
              rate={financingRate}
            />

            {/* Package Selection */}
            <PackageCards
              options={packages}
              selectedId={selectedPackage}
              onSelect={handlePackageSelect}
              rate={financingRate}
            />

            {/* Active Promotions */}
            <PromoPanel motorHp={hp} />

            {/* Detailed Pricing Breakdown */}
            <PricingTable
              pricing={{
                msrp: totals.msrp,
                discount: totals.discount,
                promoValue: totals.promoValue,
                subtotal: totals.subtotal,
                tax: totals.tax,
                total: totals.total,
                savings: totals.savings
              }}
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
          <div>
            <StickySummary
              packageLabel={selectedPackageData.label}
              yourPriceBeforeTax={selectedPackageData.priceBeforeTax}
              totalSavings={selectedPackageData.savings}
              monthly={undefined}
              bullets={selectedPackageData.features}
              onReserve={handleReserveDeposit}
              depositAmount={200}
            />
          </div>
        </div>
      </div>
    </QuoteLayout>
  );
}