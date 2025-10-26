import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuoteLayout } from '@/components/quote-builder/QuoteLayout';
import { PackageCards, type PackageOption } from '@/components/quote-builder/PackageCards';
import StickySummary from '@/components/quote-builder/StickySummary';
import { PromoPanel } from '@/components/quote-builder/PromoPanel';
import { PricingTable } from '@/components/quote-builder/PricingTable';
import { BonusOffers } from '@/components/quote-builder/BonusOffers';
import CurrentPromotions from '@/components/quote-builder/BonusOffersBadge';
import MotorHeader from '@/components/quote-builder/MotorHeader';
import CoverageComparisonTooltip from '@/components/quote-builder/CoverageComparisonTooltip';
import { isTillerMotor, requiresMercuryControls, includesPropeller, canAddExternalFuelTank } from '@/lib/motor-helpers';

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
  const [completeWarrantyCost, setCompleteWarrantyCost] = useState<number>(0);
  const [premiumWarrantyCost, setPremiumWarrantyCost] = useState<number>(0);

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
  const motorHP = typeof motor.hp === 'string' ? parseFloat(motor.hp) : motor.hp;
  const controlsCost = needsControls ? 2500 : 0;
  const batteryCost = !isManualStart ? 179.99 : 0;
  const includesProp = includesPropeller(motor);
  const canAddFuelTank = canAddExternalFuelTank(motor);
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

  // Promo warranty years for sticky summary
  const warrantyPromos = getWarrantyPromotions?.() ?? [];
  const promoWarrantyYears = warrantyPromos[0]?.warranty_extra_years ?? 0;

  // Package warranty years (coverage included in each tier)
  const completeTargetYears = 7; // Complete: 7 years total
  const premiumTargetYears = 8; // Premium: 8 years max

  // Fetch real warranty extension costs from database
  useEffect(() => {
    async function fetchWarrantyCosts() {
      const { calculateWarrantyExtensionCost } = await import('@/lib/quote-utils');
      
      const completeCost = await calculateWarrantyExtensionCost(
        motorHP,
        currentCoverageYears,
        completeTargetYears
      );
      
      const premiumCost = await calculateWarrantyExtensionCost(
        motorHP,
        currentCoverageYears,
        premiumTargetYears
      );
      
      setCompleteWarrantyCost(completeCost);
      setPremiumWarrantyCost(premiumCost);
    }
    
    if (motorHP > 0) {
      fetchWarrantyCosts();
    }
  }, [motorHP, currentCoverageYears, completeTargetYears, premiumTargetYears]);

  // Calculate base subtotal (motor + base accessories, NO battery)
  const baseSubtotal = (motorMSRP - motorDiscount) + baseAccessoryCost - promoSavings - (state.tradeInInfo?.estimatedValue || 0);

  // Package options with ACTUAL warranty costs included
  const packages: PackageOption[] = [
    { 
      id: "good", 
      label: "Essential • Best Value", 
      priceBeforeTax: baseSubtotal, 
      savings: totals.savings, 
      features: [
        "Mercury motor", 
        isManualTiller ? "Tiller-handle operation" : "Standard controls & rigging", 
        `${currentCoverageYears} years coverage included`,
        "Basic installation",
        "Customer supplies battery (if needed)"
      ],
      coverageYears: currentCoverageYears
    },
    { 
      id: "better", 
      label: "Complete • Extended Coverage", 
      priceBeforeTax: baseSubtotal + (isManualStart ? 0 : batteryCost) + completeWarrantyCost, 
      savings: totals.savings, 
      features: [
        "Everything in Essential",
        ...(isManualStart ? [] : ["Marine starting battery ($180 value)"]), 
        `Extended to ${completeTargetYears} years total coverage`,
        completeWarrantyCost > 0 ? `Warranty extension: $${completeWarrantyCost}` : `Already includes ${completeTargetYears}yr coverage`,
        "Priority installation"
      ].filter(Boolean),
      recommended: true,
      coverageYears: completeTargetYears,
      targetWarrantyYears: completeTargetYears
    },
    { 
      id: "best", 
      label: "Premium • Max Coverage", 
      priceBeforeTax: baseSubtotal + (isManualStart ? 0 : batteryCost) + premiumWarrantyCost + (!includesProp ? 299.99 : 0) + (canAddFuelTank ? 199 : 0), 
      savings: totals.savings, 
      features: [
        "Everything in Complete",
        `Maximum ${premiumTargetYears} years total coverage`,
        premiumWarrantyCost > 0 ? `Warranty extension: $${premiumWarrantyCost}` : `Already includes ${premiumTargetYears}yr coverage`,
        !includesProp ? "Premium aluminum 3-blade propeller ($300 value)" : null,
        canAddFuelTank ? "12L external fuel tank & hose ($199 value)" : null,
        "White-glove installation"
      ].filter(Boolean),
      coverageYears: premiumTargetYears,
      targetWarrantyYears: premiumTargetYears
    },
  ];

  // Build accessory breakdown based on motor requirements and selected package
  const accessoryBreakdown = [];
  
  // Only add controls if the motor requires them (not for tiller motors)
  if (needsControls) {
    accessoryBreakdown.push({
      name: 'Controls & Rigging',
      price: controlsCost,
      description: 'Premium marine controls and installation hardware'
    });
  }
  
  // Only add battery for ELECTRIC START motors (manual start motors don't need batteries)
  if (!isManualStart) {
    accessoryBreakdown.push({
      name: 'Marine Battery',
      price: batteryCost,
      description: 'Marine starting battery (required for electric start)'
    });
  }
  
  // Add premium propeller for Premium package only (if motor doesn't already include one)
  if (selectedPackage === 'best' && !includesProp) {
    accessoryBreakdown.push({
      name: 'Premium Aluminum 3-Blade Propeller',
      price: 299.99,
      description: 'High-performance aluminum 3-blade propeller'
    });
  }
  
  // Add external fuel tank for Premium package only (if motor can benefit from it)
  if (selectedPackage === 'best' && canAddFuelTank) {
    accessoryBreakdown.push({
      name: '12L External Fuel Tank & Hose',
      price: 199,
      description: 'Portable fuel tank for extended range'
    });
  }
  
  // Add warranty extension based on selected package
  const selectedPkg = packages.find(p => p.id === selectedPackage);
  if (selectedPkg && selectedPkg.targetWarrantyYears) {
    const extensionYears = selectedPkg.targetWarrantyYears - currentCoverageYears;
    if (extensionYears > 0) {
      const extensionCost = selectedPackage === 'better' ? completeWarrantyCost : premiumWarrantyCost;
      accessoryBreakdown.push({
        name: `${selectedPkg.label.split('•')[0].trim()} Package: Extended Warranty (${extensionYears} additional year${extensionYears > 1 ? 's' : ''})`,
        price: extensionCost,
        description: `Total coverage: ${selectedPkg.targetWarrantyYears} years`
      });
    }
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
      const motorSubtotal = motorMSRP - motorDiscount - promoSavings;
      
      const pdfData = {
        quoteNumber,
        customerName: 'Valued Customer',
        customerEmail: '',
        customerPhone: '',
        motor: quoteData.motor || {},
        selectedPackage: {
          id: selectedPackage,
          label: selectedPkg.label,
          coverageYears: selectedPkg.coverageYears,
          features: selectedPkg.features
        },
        // Add accessory breakdown and trade-in
        accessoryBreakdown: accessoryBreakdown,
        tradeInValue: state.tradeInInfo?.estimatedValue || 0,
        includesInstallation: state.purchasePath === 'installed',
        // Use the selected package's pricing (already includes everything)
        pricing: {
          msrp: motorMSRP,
          discount: motorDiscount,
          promoValue: promoSavings,
          motorSubtotal: motorSubtotal,
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
  };

  const selectedPackageData = packages.find(p => p.id === selectedPackage) || packages[1];

  // Calculate totals for the SELECTED PACKAGE (not just base motor)
  const packageSpecificTotals = calculateQuotePricing({
    motorMSRP,
    motorDiscount,
    accessoryTotal: baseAccessoryCost + 
      (selectedPackage !== 'good' && !isManualStart ? batteryCost : 0) + // Battery in Complete/Premium
      (selectedPackage === 'better' ? completeWarrantyCost : 0) + // Warranty extension for Complete
      (selectedPackage === 'best' && !includesProp ? 299.99 : 0) + // Propeller in Premium
      (selectedPackage === 'best' && canAddFuelTank ? 199 : 0) + // Fuel tank in Premium
      (selectedPackage === 'best' ? premiumWarrantyCost : 0), // Warranty extension for Premium
    warrantyPrice: state.warrantyConfig?.warrantyPrice || 0, // Current selected warranty
    promotionalSavings: promoSavings,
    tradeInValue: state.tradeInInfo?.estimatedValue || 0,
    taxRate: 0.13
  });

  return (
    <QuoteLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          {/* Main Content - Left Column */}
          <div className="space-y-6">
            {/* Motor Header with integrated back button */}
            <MotorHeader
              name={motorName}
              modelYear={modelYear}
              hp={motorHp}
              sku={sku}
              imageUrl={imageUrl}
              specs={specs}
              why={why}
              specSheetUrl={specSheetUrl}
              onBack={handleBack}
            />

            {/* Current Promotions */}
            <CurrentPromotions />

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
              pricing={packageSpecificTotals}
              motorName={quoteData.motor?.model || 'Mercury Motor'}
              accessoryBreakdown={accessoryBreakdown}
              tradeInValue={state.tradeInInfo?.estimatedValue || 0}
              packageName={selectedPackageData.label}
              includesInstallation={state.purchasePath === 'installed'}
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
              coverageYears={selectedPackageData.coverageYears}
              onDownloadPDF={handleDownloadPDF}
              isGeneratingPDF={isGeneratingPDF}
            />
          </div>
        </div>
      </div>
    </QuoteLayout>
  );
}
