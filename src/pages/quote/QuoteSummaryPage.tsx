import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuoteLayout } from '@/components/quote-builder/QuoteLayout';
import HeroPrice from '@/components/quote-builder/HeroPrice';
import { PackageCards, type PackageOption } from '@/components/quote-builder/PackageCards';
import StickySummary from '@/components/quote-builder/StickySummary';
import { PromoPanel } from '@/components/quote-builder/PromoPanel';
import { PricingTable } from '@/components/quote-builder/PricingTable';
import { BonusOffers } from '@/components/quote-builder/BonusOffers';
import WarrantyAddOnUI, { type WarrantyTarget } from '@/components/quote-builder/WarrantyAddOnUI';
import BonusOffersBadge from '@/components/quote-builder/BonusOffersBadge';
import MotorHeader from '@/components/quote-builder/MotorHeader';
import CoverageComparisonTooltip from '@/components/quote-builder/CoverageComparisonTooltip';

import { useQuote } from '@/contexts/QuoteContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { computeTotals } from '@/lib/finance';
import { useActiveFinancingPromo } from '@/hooks/useActiveFinancingPromo';
import { useActivePromotions } from '@/hooks/useActivePromotions';
import { useMotorMonthlyPayment } from '@/hooks/useMotorMonthlyPayment';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Download } from 'lucide-react';

export default function QuoteSummaryPage() {
  const navigate = useNavigate();
  const { state, dispatch, isStepAccessible, getQuoteData, isNavigationBlocked } = useQuote();
  const { promo } = useActiveFinancingPromo();
  const { getWarrantyPromotions, getTotalWarrantyBonusYears } = useActivePromotions();
  const { toast } = useToast();
  const [selectedPackage, setSelectedPackage] = useState<string>('better');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);

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

  // Motor details for header - use existing state only
  const motor = state?.motor ?? {} as any;
  const motorName = motor?.model ?? motor?.name ?? motor?.displayName ?? "Mercury Outboard";
  const modelYear = motor?.year ?? motor?.modelYear ?? undefined;
  const motorHp = motor?.hp ?? motor?.horsepower ?? hp;
  const sku = motor?.sku ?? motor?.partNumber ?? null;
  const imageUrl = motor?.imageUrl ?? motor?.thumbnail ?? null;

  // Build spec pills from known fields (show only those that exist)
  const specs = [
    motor?.shaftLength ? { label: "Shaft", value: String(motor.shaftLength) } : null,
    motor?.starting ? { label: "Start", value: String(motor.starting) } : null,
    motor?.controls ? { label: "Controls", value: String(motor.controls) } : null,
    motor?.weight ? { label: "Weight", value: `${motor.weight} lb` } : null,
    motor?.alternatorOutput ? { label: "Alt", value: `${motor.alternatorOutput} A` } : null,
  ].filter(Boolean) as Array<{label:string; value:string}>;

  // Short "why this motor" bullets – keep generic unless you already store use-case text
  const why = [
    "Quiet, low-vibration four-stroke performance",
    "Excellent fuel economy & range", 
    "Factory-backed service at Harris Boat Works",
  ];

  const specSheetUrl = motor?.specSheetUrl ?? null;
  
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

  // Get financing rate
  const financingRate = promo?.rate || 7.99;

  // Coverage years calculation (no math beyond reading promo years)
  const baseYears = 3;
  const promoYears = getTotalWarrantyBonusYears?.() ?? 0;
  const currentCoverageYears = Math.min(baseYears + promoYears, 8);
  const maxCoverageYears = 8;

  // Mock warranty pricing data - in real app this would come from state.warrantyOptions
  const mockWarrantyPricing = [
    { years: 6, price: 899, monthlyDelta: 15 },
    { years: 7, price: 1199, monthlyDelta: 20 },
    { years: 8, price: 1499, monthlyDelta: 25 },
  ];

  const targets: WarrantyTarget[] = mockWarrantyPricing
    .filter(o => o.years > currentCoverageYears && o.years <= maxCoverageYears)
    .map(o => ({ targetYears: o.years, oneTimePrice: o.price, monthlyDelta: o.monthlyDelta }));

  // Currently selected target years (total), or null
  const selectedTargetYears =
    state?.warrantyConfig?.totalYears && state.warrantyConfig.totalYears > currentCoverageYears
      ? state.warrantyConfig.totalYears
      : null;

  // Precomputed "+$/mo" for the selected target (if any)
  const selectedMonthlyDelta = selectedTargetYears
    ? targets.find(t => t.targetYears === selectedTargetYears)?.monthlyDelta
    : undefined;

  const onSelectWarranty = (targetYears: number | null) => {
    if (targetYears === null) {
      dispatch({ type: "SET_WARRANTY_CONFIG", payload: { extendedYears: 0, warrantyPrice: 0, totalYears: currentCoverageYears } });
    } else {
      const opt = mockWarrantyPricing.find(o => o.years === targetYears);
      const extendedYears = Math.max(0, targetYears - currentCoverageYears);
      dispatch({
        type: "SET_WARRANTY_CONFIG",
        payload: {
          extendedYears,
          warrantyPrice: opt?.price ?? 0,
          totalYears: targetYears,
        },
      });
    }
  };

  // Promo warranty years for sticky summary
  const warrantyPromos = getWarrantyPromotions?.() ?? [];
  const promoWarrantyYears = warrantyPromos[0]?.warranty_extra_years ?? 0;

  // Package options with coverage info
  const packages: PackageOption[] = [
    { 
      id: "good", 
      label: "Essential", 
      priceBeforeTax: data.subtotal, 
      savings: totals.savings, 
      features: ["Mercury motor", "Standard controls & rigging", "Basic installation"],
      coverageYears: currentCoverageYears
    },
    { 
      id: "better", 
      label: "Complete", 
      priceBeforeTax: data.subtotal + 179.99, 
      savings: totals.savings + 50, 
      features: ["Mercury motor", "Premium controls & rigging", "Marine starting battery", "Standard propeller", "Priority installation"], 
      recommended: true,
      coverageYears: Math.max(currentCoverageYears, 6),
      targetWarrantyYears: Math.max(currentCoverageYears, 6)
    },
    { 
      id: "best", 
      label: "Premium • Max coverage", 
      priceBeforeTax: data.subtotal + 179.99 + 500, 
      savings: totals.savings + 150, 
      features: ["Max coverage", "Priority install", "Premium prop", "Extended warranty", "White-glove installation"],
      coverageYears: maxCoverageYears,
      targetWarrantyYears: maxCoverageYears
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

  // CTA handlers
  const handleReserveDeposit = () => {
    toast({
      title: "Reserve Your Motor",
      description: "Deposit functionality would be integrated here.",
    });
  };

  const handleDownloadPDF = async () => {
    if (isGeneratingPDF) return;
    
    setIsGeneratingPDF(true);
    
    try {
      console.log('Starting PDF generation...');
      
      const pdfQuoteData = {
        quoteNumber: Date.now().toString().slice(-6),
        customerName: 'Valued Customer',
        customerEmail: '',
        customerPhone: '',
        motor: {
          model: quoteData.motor?.model || 'Mercury Motor',
          hp: quoteData.motor?.hp || 0,
          year: quoteData.motor?.year,
          sku: (quoteData.motor as any)?.sku,
        },
        pricing: {
          msrp: totals.msrp,
          discount: totals.discount,
          promoValue: totals.promoValue,
          subtotal: totals.subtotal,
          tradeInValue: 0,
          subtotalAfterTrade: totals.subtotal,
          hst: totals.tax,
          totalCashPrice: totals.total,
          savings: totals.savings
        },
        specs: [
          { label: "HP", value: `${quoteData.motor?.hp || 0}` },
          { label: "Year", value: `${quoteData.motor?.year || 2025}` }
        ].filter(spec => spec.value && spec.value !== '0')
      };
      
      console.log('Quote data:', pdfQuoteData);
      
      const { data, error } = await supabase.functions.invoke('generate-professional-pdf', {
        body: { quoteData: pdfQuoteData }
      });
      
      console.log('Supabase response:', { data, error });
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      if (!data?.pdfUrl) {
        console.error('No PDF URL in response:', data);
        throw new Error('No PDF URL received');
      }
      
      // Try to open the PDF - with popup blocker detection
      console.log('Opening PDF URL:', data.pdfUrl);
      
      const newWindow = window.open(data.pdfUrl, '_blank', 'noopener,noreferrer');
      
      // Check if popup was blocked
      if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
        console.warn('Popup blocked - providing fallback');
        
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = data.pdfUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.download = `Mercury-Quote-${pdfQuoteData.quoteNumber}.pdf`;
        
        // Add to DOM temporarily
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "PDF Generated",
          description: "If the PDF didn't open automatically, check your downloads folder or allow popups for this site.",
        });
      } else {
        toast({
          title: "PDF Generated",
          description: "PDF opened in new tab",
        });
      }
      
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate PDF",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPDF(false);
    }
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
    // If package implies a target, apply it so engine reprices
    const pkg = packages.find(p => p.id === packageId);
    if (pkg?.targetWarrantyYears) {
      onSelectWarranty(pkg.targetWarrantyYears);
    }
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
            {/* Motor Header */}
            <MotorHeader
              name={motorName}
              modelYear={modelYear}
              hp={motorHp}
              sku={sku}
              imageUrl={imageUrl}
              specs={specs}
              why={why}
              specSheetUrl={specSheetUrl}
            />

            {/* Hero Price Section */}
            <HeroPrice 
              yourPriceBeforeTax={totals.subtotal}
              totalWithTax={totals.total}
              discount={totals.discount}
              promoValue={totals.promoValue}
              showMonthly={true}
              rate={financingRate}
            />

            {/* Bonus offers badge directly under hero price */}
            <BonusOffersBadge />

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
            
            {/* New Warranty Add-on UI */}
            <WarrantyAddOnUI
              currentCoverageYears={currentCoverageYears}
              maxCoverageYears={maxCoverageYears}
              targets={targets}
              selectedTargetYears={selectedTargetYears}
              onSelectWarranty={onSelectWarranty}
            />

            {/* Legacy Components - Keep for compatibility */}
            <div className="grid md:grid-cols-2 gap-6">
              <BonusOffers motor={quoteData.motor} />
            </div>

            {/* Mobile CTA Section */}
            <div className="lg:hidden space-y-4">
              <Button 
                onClick={handleDownloadPDF}
                variant="outline"
                className="w-full"
                size="lg"
                disabled={isGeneratingPDF}
              >
                <Download className="w-4 h-4 mr-2" />
                {isGeneratingPDF ? 'Generating PDF...' : 'Download PDF Quote'}
              </Button>
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
              coverageYears={selectedTargetYears ?? currentCoverageYears}
              monthlyDelta={selectedMonthlyDelta}
              onDownloadPDF={handleDownloadPDF}
              isGeneratingPDF={isGeneratingPDF}
            />
          </div>
        </div>
      </div>
    </QuoteLayout>
  );
}
