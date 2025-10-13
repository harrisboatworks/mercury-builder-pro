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
import { isTillerMotor, requiresMercuryControls } from '@/lib/motor-helpers';

import { useQuote } from '@/contexts/QuoteContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { computeTotals, calculateMonthlyPayment, getFinancingTerm } from '@/lib/finance';
import { calculateQuotePricing } from '@/lib/quote-utils';
import { supabase } from '@/integrations/supabase/client';
import { useActiveFinancingPromo } from '@/hooks/useActiveFinancingPromo';
import { useActivePromotions } from '@/hooks/useActivePromotions';
import { useToast } from '@/hooks/use-toast';
import { Download } from 'lucide-react';
import { generateQuotePDF, downloadPDF } from '@/lib/react-pdf-generator';

export default function QuoteSummaryPage() {
  const navigate = useNavigate();
  const { state, dispatch, isStepAccessible, getQuoteData, isNavigationBlocked } = useQuote();
  const { promo } = useActiveFinancingPromo();
  const { getWarrantyPromotions, getTotalWarrantyBonusYears, getTotalPromotionalSavings } = useActivePromotions();
  const { toast } = useToast();
  const [selectedPackage, setSelectedPackage] = useState<string>('better');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
  const [warrantyPricing, setWarrantyPricing] = useState<any>(null);
  const [warrantyLoading, setWarrantyLoading] = useState(true);

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

  // Fetch warranty pricing from database based on motor HP
  useEffect(() => {
    const motorHP = state.motor ? (typeof state.motor.hp === 'string' ? parseFloat(state.motor.hp) : state.motor.hp) : 0;
    
    if (!state.motor || !motorHP) {
      setWarrantyLoading(false);
      return;
    }

    async function fetchWarrantyPricing() {
      try {
        setWarrantyLoading(true);
        const { data, error } = await supabase
          .from('warranty_pricing')
          .select('*')
          .lte('hp_min', motorHP)
          .gte('hp_max', motorHP)
          .single();

        if (error) {
          console.error('Error fetching warranty pricing:', error);
          return;
        }

        setWarrantyPricing(data);
      } catch (error) {
        console.error('Unexpected error fetching warranty pricing:', error);
      } finally {
        setWarrantyLoading(false);
      }
    }

    fetchWarrantyPricing();
  }, [state.motor]);

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

  // Motor details for header - use existing state only
  const motor = state?.motor ?? {} as any;
  const motorName = motor?.model ?? motor?.name ?? motor?.displayName ?? "Mercury Outboard";
  const modelYear = motor?.year ?? motor?.modelYear ?? undefined;
  const hp = quoteData.motor?.hp || motor?.hp || motor?.horsepower || 0;
  const motorHp = hp;
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
  
  // Calculate base accessories needed based on motor type
  const motorModel = motor?.model || '';
  const isManualTiller = isTillerMotor(motorModel);
  const needsControls = requiresMercuryControls(motor);
  const isManualStart = motorModel.includes('MH') || motorModel.includes('MLH');
  
  // Calculate base accessory costs
  const controlsCost = needsControls ? 2500 : 0;
  const batteryCost = !isManualStart ? 179.99 : 0;
  const baseAccessoryCost = controlsCost; // Battery separate from base
  
  // Add warranty price if selected
  const warrantyPrice = state.warrantyConfig?.warrantyPrice || 0;
  
  // Calculate proper MSRP and discount from motor data
  const motorMSRP = quoteData.motor?.basePrice || 0;
  const motorSalePrice = quoteData.motor?.salePrice || quoteData.motor?.price || motorMSRP;
  const motorDiscount = motorMSRP - motorSalePrice;
  
  // Get promotional savings dynamically
  const promoSavings = getTotalPromotionalSavings?.(motorMSRP) || 0;
  
  // Calculate complete pricing with proper structure
  const totals = calculateQuotePricing({
    motorMSRP,
    motorDiscount,
    accessoryTotal: baseAccessoryCost,
    warrantyPrice,
    promotionalSavings: promoSavings,
    tradeInValue: state.tradeInInfo?.estimatedValue || 0,
    taxRate: 0.13
  });

  // Get financing rate
  const financingRate = promo?.rate || 7.99;

  // Coverage years calculation (no math beyond reading promo years)
  const baseYears = 3;
  const promoYears = getTotalWarrantyBonusYears?.() ?? 0;
  const currentCoverageYears = Math.min(baseYears + promoYears, 8);
  const maxCoverageYears = 8;

  // Calculate real warranty pricing based on HP and database data
  const calculateWarrantyPricing = () => {
    if (!warrantyPricing || warrantyLoading) return [];

    const options = [];
    const availableYears = Math.min(maxCoverageYears - currentCoverageYears, 3); // Max 3 additional years

    for (let i = 1; i <= availableYears; i++) {
      const targetYears = currentCoverageYears + i;
      
      // Get direct price for this duration (each year_x_price is the total for x additional years)
      const yearKey = `year_${i}_price` as keyof typeof warrantyPricing;
      const warrantyPrice = warrantyPricing[yearKey] || 0;

      // Add HST (13%) to warranty price
      const priceWithTax = warrantyPrice * 1.13;
      
      // Calculate monthly payment delta
      const termMonths = getFinancingTerm(priceWithTax);
      const { payment: monthlyPayment } = calculateMonthlyPayment(priceWithTax, financingRate);
      
      options.push({
        years: targetYears,
        price: Math.round(warrantyPrice),
        priceWithTax: Math.round(priceWithTax),
        monthlyDelta: Math.round(monthlyPayment)
      });
    }

    return options;
  };

  const warrantyOptions = calculateWarrantyPricing();
  
  const targets: WarrantyTarget[] = warrantyOptions
    .filter(o => o.years > currentCoverageYears && o.years <= maxCoverageYears)
    .map(o => ({ 
      targetYears: o.years, 
      oneTimePrice: o.price, 
      monthlyDelta: o.monthlyDelta,
      label: `${o.years} Year Total Coverage`
    }));

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
      const opt = warrantyOptions.find(o => o.years === targetYears);
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

  // Calculate warranty costs for package tiers
  const completeTargetYears = Math.max(currentCoverageYears, 6);
  const premiumTargetYears = maxCoverageYears;

  // Find the warranty option that matches each package's target
  const completeWarrantyOption = warrantyOptions.find(o => o.years === completeTargetYears);
  const premiumWarrantyOption = warrantyOptions.find(o => o.years === premiumTargetYears);

  // Get the warranty cost (already calculated correctly in warrantyOptions)
  const completeWarrantyCost = completeWarrantyOption?.price || 0;
  const premiumWarrantyCost = premiumWarrantyOption?.price || 0;

  // Calculate base subtotal (motor + base accessories, NO battery)
  const baseSubtotal = (motorMSRP - motorDiscount) + baseAccessoryCost - promoSavings - (state.tradeInInfo?.estimatedValue || 0);

  // Package options with ACTUAL warranty costs included
  const packages: PackageOption[] = [
    { 
      id: "good", 
      label: "Essential", 
      priceBeforeTax: baseSubtotal, 
      savings: totals.savings, 
      features: [
        "Mercury motor", 
        "Standard controls & rigging", 
        `${currentCoverageYears} years coverage included`,
        "Basic installation",
        "Customer supplies battery"
      ],
      coverageYears: currentCoverageYears
    },
    { 
      id: "better", 
      label: "Complete", 
      priceBeforeTax: baseSubtotal + batteryCost + completeWarrantyCost, 
      savings: totals.savings, 
      features: [
        "Everything in Essential",
        "Marine starting battery ($180 value)", 
        `Extended to ${completeTargetYears} years total coverage`,
        completeWarrantyCost > 0 ? `(+${completeTargetYears - currentCoverageYears} years extension • $${completeWarrantyCost})` : null,
        "Priority installation"
      ].filter(Boolean), 
      recommended: true,
      coverageYears: completeTargetYears,
      targetWarrantyYears: completeTargetYears
    },
    { 
      id: "best", 
      label: "Premium • Max Coverage", 
      priceBeforeTax: baseSubtotal + batteryCost + premiumWarrantyCost + 299.99, 
      savings: totals.savings, 
      features: [
        "Everything in Complete",
        `Maximum ${premiumTargetYears} years total coverage`,
        premiumWarrantyCost > 0 ? `(+${premiumTargetYears - currentCoverageYears} years extension • $${premiumWarrantyCost})` : null,
        "Premium stainless propeller ($300 value)", 
        "White-glove installation"
      ].filter(Boolean),
      coverageYears: premiumTargetYears,
      targetWarrantyYears: premiumTargetYears
    },
  ];

  // Build accessory breakdown based on motor requirements
  const accessoryBreakdown = [];
  
  // Only add controls if the motor requires them (not for tiller motors)
  if (needsControls) {
    accessoryBreakdown.push({
      name: 'Controls & Rigging',
      price: controlsCost,
      description: 'Premium marine controls and installation hardware'
    });
  }
  
  // Only add battery for electric start motors or if package includes it
  if (!isManualStart || selectedPackage !== 'good') {
    accessoryBreakdown.push({
      name: 'Marine Battery',
      price: batteryCost,
      description: isManualStart ? 'Optional marine battery' : 'Marine starting battery (required)'
    });
  }
  
  // Add selected warranty as line item
  if (warrantyPrice > 0 && state.warrantyConfig?.totalYears) {
    const extendedYears = state.warrantyConfig.totalYears - currentCoverageYears;
    accessoryBreakdown.push({
      name: `Extended Warranty (${extendedYears} additional year${extendedYears > 1 ? 's' : ''})`,
      price: warrantyPrice,
      description: `Total coverage: ${state.warrantyConfig.totalYears} years`
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
    setIsGeneratingPDF(true);
    
    try {
      const quoteData = getQuoteData();
      const quoteNumber = `HBW-${Date.now().toString().slice(-6)}`;
      
      // Get selected package info - it already has correct pricing
      const selectedPkg = packages.find(p => p.id === selectedPackage) || packages[1];
      
      // Use the package's correctly calculated pricing
      const packageSubtotal = selectedPkg.priceBeforeTax;
      const packageTax = packageSubtotal * 0.13;
      const packageTotal = packageSubtotal + packageTax;
      
      // Transform quote data for React PDF
      const pdfData = {
        quoteNumber,
        customerName: 'Valued Customer',
        customerEmail: '',
        customerPhone: '',
        motor: quoteData.motor || {},
        selectedPackage: {
          id: selectedPackage,
          label: selectedPkg.label,
          coverageYears: selectedTargetYears ?? currentCoverageYears,
          features: selectedPkg.features
        },
        warrantyTargets: targets, // Add warranty targets for PDF
        // Use the selected package's pricing (already includes everything)
        pricing: {
          msrp: motorMSRP,
          discount: motorDiscount,
          promoValue: promoSavings,
          subtotal: packageSubtotal,
          hst: packageTax,
          totalCashPrice: packageTotal,
          savings: motorDiscount + promoSavings
        }
      };

      toast({
        title: "Generating PDF...",
        description: "Please wait while we create your professional quote.",
      });
      
      // Save lead data when PDF is downloaded
      try {
        const { saveLead } = await import('@/lib/leadCapture');
        await saveLead({
          motor_model: quoteData.motor?.model,
          motor_hp: quoteData.motor?.hp,
          base_price: packageSubtotal,
          final_price: packageTotal,
          lead_status: 'downloaded',
          lead_source: 'pdf_download',
          quote_data: quoteData
        });
      } catch (leadError) {
        console.error('Failed to save lead:', leadError);
        // Don't block PDF generation if lead save fails
      }
      
      // Generate PDF using React PDF
      const pdfUrl = await generateQuotePDF(pdfData);
      
      // Download the PDF
      await downloadPDF(pdfUrl, `Mercury-Quote-${quoteNumber}.pdf`);
      
      toast({
        title: "PDF Generated Successfully!",
        description: "Your professional quote has been downloaded.",
      });
      
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "Error", 
        description: "Failed to generate PDF. Please try again.",
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
    } else {
      // Clear warranty if package doesn't include extended coverage
      onSelectWarranty(null);
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
              yourPriceBeforeTax={selectedPackageData.priceBeforeTax}
              totalWithTax={selectedPackageData.priceBeforeTax * 1.13}
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
              pricing={totals}
              motorName={quoteData.motor?.model || 'Mercury Motor'}
              accessoryBreakdown={accessoryBreakdown}
              tradeInValue={state.tradeInInfo?.estimatedValue || 0}
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
