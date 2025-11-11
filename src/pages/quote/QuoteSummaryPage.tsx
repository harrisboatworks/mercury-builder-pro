import { useEffect, useState, useMemo } from 'react';
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
import { SaveQuoteDialog } from '@/components/quote-builder/SaveQuoteDialog';
import { isTillerMotor, requiresMercuryControls, includesPropeller, canAddExternalFuelTank } from '@/lib/motor-helpers';

import { useQuote } from '@/contexts/QuoteContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { computeTotals, calculateMonthlyPayment, getFinancingTerm, DEALERPLAN_FEE } from '@/lib/finance';
import { calculateQuotePricing } from '@/lib/quote-utils';
import { supabase } from '@/integrations/supabase/client';
import { useActiveFinancingPromo } from '@/hooks/useActiveFinancingPromo';
import { useActivePromotions } from '@/hooks/useActivePromotions';
import { useToast } from '@/hooks/use-toast';
import { Download } from 'lucide-react';
import { generateQuotePDF, downloadPDF } from '@/lib/react-pdf-generator';

// Package warranty year constants (module-level to prevent recreation on every render)
const COMPLETE_TARGET_YEARS = 7; // Complete: 7 years total
const PREMIUM_TARGET_YEARS = 8;  // Premium: 8 years max

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
  const [isMounted, setIsMounted] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Ensure minimum mount time before running accessibility checks
  useEffect(() => {
    console.log('🎬 QuoteSummaryPage: Component mounting...');
    const mountTimer = setTimeout(() => {
      console.log('✅ QuoteSummaryPage: Component fully mounted');
      setIsMounted(true);
    }, 500);
    
    return () => clearTimeout(mountTimer);
  }, []);

  // Set document title and meta description
  useEffect(() => {
    document.title = 'Your Mercury Motor Quote | Harris Boat Works';
    
    let desc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!desc) {
      desc = document.createElement('meta');
      desc.name = 'description';
      document.head.appendChild(desc);
    }
    desc.content = 'Review your complete Mercury outboard motor quote with pricing, financing options, and bonus offers.';
  }, []);

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
  
  // Dynamic controls cost based on boat-info selection
  const getControlsCostFromSelection = (): number => {
    if (!needsControls) return 0;
    
    const controlsOption = state.boatInfo?.controlsOption;
    
    switch (controlsOption) {
      case 'none':
        return 1200;  // "I need new controls"
      case 'adapter':
        return 125;   // "I have Mercury controls (2004+)"
      case 'compatible':
        return 0;     // "I have compatible controls ready"
      default:
        return 0;
    }
  };
  
  const controlsCost = getControlsCostFromSelection();
  
  // Add flat installation labor for remote motors
  const installationLaborCost = !isManualTiller ? 450 : 0;
  
  const batteryCost = !isManualStart ? 179.99 : 0;
  const includesProp = includesPropeller(motor);
  const canAddFuelTank = canAddExternalFuelTank(motor);
  const baseAccessoryCost = controlsCost + installationLaborCost; // Battery separate from base
  
  // Calculate installation cost for tiller motors
  const tillerInstallCost = isManualTiller ? (state.installConfig?.installationCost || 0) : 0;
  
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
    financingFee: DEALERPLAN_FEE,
    taxRate: 0.13
  });

  // Get financing rate
  const financingRate = promo?.rate || 7.99;

  // Coverage years calculation (memoized to prevent infinite loops)
  const baseYears = 3;
  const promoYears = getTotalWarrantyBonusYears?.() ?? 0;
  const currentCoverageYears = useMemo(() => {
    return Math.min(baseYears + promoYears, 8);
  }, [promoYears]);
  const maxCoverageYears = 8;

  // Promo warranty years for sticky summary
  const warrantyPromos = getWarrantyPromotions?.() ?? [];
  const promoWarrantyYears = warrantyPromos[0]?.warranty_extra_years ?? 0;

  // Fetch real warranty extension costs from database
  useEffect(() => {
    async function fetchWarrantyCosts() {
      const { calculateWarrantyExtensionCost } = await import('@/lib/quote-utils');
      
      const completeCost = await calculateWarrantyExtensionCost(
        motorHP,
        currentCoverageYears,
        COMPLETE_TARGET_YEARS
      );
      
      const premiumCost = await calculateWarrantyExtensionCost(
        motorHP,
        currentCoverageYears,
        PREMIUM_TARGET_YEARS
      );
      
      setCompleteWarrantyCost(completeCost);
      setPremiumWarrantyCost(premiumCost);
    }
    
    if (motorHP > 0) {
      fetchWarrantyCosts();
    }
  }, [motorHP, currentCoverageYears]);

  // Initialize warranty config to match default selected package (Complete)
  useEffect(() => {
    if (isMounted && completeWarrantyCost > 0) {
      const totalYears = COMPLETE_TARGET_YEARS;
      const extendedYears = Math.max(0, totalYears - currentCoverageYears);
      
      dispatch({
        type: 'SET_WARRANTY_CONFIG',
        payload: {
          totalYears,
          extendedYears,
          warrantyPrice: completeWarrantyCost
        }
      });
    }
  }, [isMounted, completeWarrantyCost, currentCoverageYears, dispatch]);

  // Calculate base subtotal (motor + base accessories, NO battery)
  const baseSubtotal = (motorMSRP - motorDiscount) + baseAccessoryCost - promoSavings - (state.tradeInInfo?.estimatedValue || 0);

  // Package options with ACTUAL warranty costs included
  const packages: PackageOption[] = [
    { 
      id: "good", 
      label: "Essential • Best Value", 
      priceBeforeTax: baseSubtotal + tillerInstallCost, 
      savings: totals.savings, 
      features: [
        "Mercury motor", 
        isManualTiller ? "Tiller-handle operation" : "Standard controls & rigging", 
        `${currentCoverageYears} years coverage included`,
        isManualTiller && tillerInstallCost === 0 ? "DIY clamp-on mounting" : "Basic installation",
        "Customer supplies battery (if needed)"
      ],
      coverageYears: currentCoverageYears
    },
    { 
      id: "better", 
      label: "Complete • Extended Coverage", 
      priceBeforeTax: baseSubtotal + tillerInstallCost + (isManualStart ? 0 : batteryCost) + completeWarrantyCost, 
      savings: totals.savings, 
      features: [
        "Everything in Essential",
        ...(isManualStart ? [] : ["Marine starting battery ($180 value)"]), 
        `Extended to ${COMPLETE_TARGET_YEARS} years total coverage`,
        completeWarrantyCost > 0 ? `Warranty extension: $${completeWarrantyCost}` : `Already includes ${COMPLETE_TARGET_YEARS}yr coverage`,
        "Priority installation"
      ].filter(Boolean),
      recommended: true,
      coverageYears: COMPLETE_TARGET_YEARS,
      targetWarrantyYears: COMPLETE_TARGET_YEARS
    },
    { 
      id: "best", 
      label: "Premium • Max Coverage", 
      priceBeforeTax: baseSubtotal + tillerInstallCost + (isManualStart ? 0 : batteryCost) + premiumWarrantyCost + (!includesProp ? 299.99 : 0) + (canAddFuelTank ? 199 : 0), 
      savings: totals.savings, 
      features: [
        "Everything in Complete",
        `Maximum ${PREMIUM_TARGET_YEARS} years total coverage`,
        premiumWarrantyCost > 0 ? `Warranty extension: $${premiumWarrantyCost}` : `Already includes ${PREMIUM_TARGET_YEARS}yr coverage`,
        !includesProp ? "Premium aluminum 3-blade propeller ($300 value)" : null,
        canAddFuelTank ? "12L external fuel tank & hose ($199 value)" : null,
        "White-glove installation"
      ].filter(Boolean),
      coverageYears: PREMIUM_TARGET_YEARS,
      targetWarrantyYears: PREMIUM_TARGET_YEARS
    },
  ];
  
  // Auto-select package based on tiller mounting type
  useEffect(() => {
    if (isManualTiller && state.installConfig?.recommendedPackage && isMounted) {
      setSelectedPackage(state.installConfig.recommendedPackage);
    }
  }, [isManualTiller, state.installConfig?.recommendedPackage, isMounted]);

  // Helper function for controls description
  const getControlsDescription = (): string => {
    const controlsOption = state.boatInfo?.controlsOption;
    
    switch (controlsOption) {
      case 'none':
        return 'Complete Mercury remote control kit with cables';
      case 'adapter':
        return 'Control harness adapter for existing Mercury controls';
      case 'compatible':
        return 'Using existing compatible controls (no additional charge)';
      default:
        return 'Premium marine controls and installation hardware';
    }
  };

  // Build accessory breakdown based on motor requirements and selected package
  const accessoryBreakdown = [];
  
  // Add tiller installation cost if applicable
  if (isManualTiller && tillerInstallCost > 0) {
    const mountingType = state.installConfig?.mounting === 'transom_bolt' ? 'Bolt-On Transom' : 'Installation';
    accessoryBreakdown.push({
      name: `${mountingType} Installation`,
      price: tillerInstallCost,
      description: 'Professional mounting and setup'
    });
  } else if (isManualTiller && tillerInstallCost === 0) {
    accessoryBreakdown.push({
      name: 'Clamp-On Installation',
      price: 0,
      description: 'DIY-friendly mounting system (no installation labor required)'
    });
  }
  
  // Only add controls if the motor requires them (not for tiller motors)
  if (needsControls && controlsCost > 0) {
    accessoryBreakdown.push({
      name: 'Controls & Rigging',
      price: controlsCost,
      description: getControlsDescription()
    });
  }
  
  // Add professional installation labor for remote motors
  if (!isManualTiller) {
    accessoryBreakdown.push({
      name: 'Professional Installation',
      price: installationLaborCost,
      description: 'Expert rigging, mounting, and commissioning by certified technicians'
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
        tradeInInfo: state.tradeInInfo?.hasTradeIn ? {
          brand: state.tradeInInfo.brand,
          year: state.tradeInInfo.year,
          horsepower: state.tradeInInfo.horsepower,
          model: state.tradeInInfo.model
        } : undefined,
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

  const handleApplyForFinancing = () => {
    // CRITICAL: packageSpecificTotals.subtotal already has trade-in subtracted.
    // We need to add it back so it's only subtracted once in the financing application.
    const tradeInValue = state.tradeInInfo?.estimatedValue || 0;
    const promoValue = packageSpecificTotals.promoValue || 0;
    
    // Reconstruct the subtotal BEFORE trade-in and promos were applied
    const packageSubtotalBeforeTradeIn = packageSpecificTotals.subtotal + tradeInValue + promoValue;
    
    const packageName = selectedPackageData.label.split('•')[0].trim();
    
    // Calculate the complete financing amount:
    // (Motor + Accessories - Promos) + HST + Dealerplan Fee
    // Trade-in will be subtracted in the financing application
    const subtotalWithTax = packageSubtotalBeforeTradeIn * 1.13;
    const totalWithFees = subtotalWithTax + DEALERPLAN_FEE;
    
    // Save complete pricing data for financing
    const financingData = {
      ...state,
      financingAmount: {
        packageSubtotal: packageSubtotalBeforeTradeIn,  // BEFORE trade-in
        hst: packageSubtotalBeforeTradeIn * 0.13,
        financingFee: DEALERPLAN_FEE,
        totalWithFees: totalWithFees,  // Full price: (motor + accessories - promos) + tax + $299
        motorModel: quoteData.motor?.model || motorName,
        packageName: packageName,
        tradeInValue: tradeInValue  // Saved separately to be subtracted in financing app
      }
    };
    
    localStorage.setItem('quote_state', JSON.stringify(financingData));
    
    // Navigate to financing application
    navigate('/financing/apply');
  };

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackage(packageId);
    
    // Update warranty config in context to match selected package
    const selectedPkg = packages.find(p => p.id === packageId);
    if (selectedPkg && selectedPkg.coverageYears) {
      const totalYears = selectedPkg.coverageYears;
      const extendedYears = Math.max(0, totalYears - currentCoverageYears);
      
      // Determine warranty price based on package
      let warrantyPrice = 0;
      if (packageId === 'better') {
        warrantyPrice = completeWarrantyCost;
      } else if (packageId === 'best') {
        warrantyPrice = premiumWarrantyCost;
      }
      
      dispatch({
        type: 'SET_WARRANTY_CONFIG',
        payload: {
          totalYears,
          extendedYears,
          warrantyPrice
        }
      });
    }
  };

  const selectedPackageData = packages.find(p => p.id === selectedPackage) || packages[1];

  // Calculate totals for the SELECTED PACKAGE (not just base motor)
  const packageSpecificTotals = calculateQuotePricing({
    motorMSRP,
    motorDiscount,
    accessoryTotal: baseAccessoryCost + 
      tillerInstallCost + // Tiller installation cost
      (selectedPackage !== 'good' && !isManualStart ? batteryCost : 0) + // Battery in Complete/Premium
      (selectedPackage === 'better' ? completeWarrantyCost : 0) + // Warranty extension for Complete
      (selectedPackage === 'best' && !includesProp ? 299.99 : 0) + // Propeller in Premium
      (selectedPackage === 'best' && canAddFuelTank ? 199 : 0) + // Fuel tank in Premium
      (selectedPackage === 'best' ? premiumWarrantyCost : 0), // Warranty extension for Premium
    warrantyPrice: 0,  // Already included in accessoryTotal above
    promotionalSavings: promoSavings,
    tradeInValue: state.tradeInInfo?.estimatedValue || 0,
    taxRate: 0.13
  });

  return (
    <QuoteLayout>
      {!isMounted ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground dark:text-gray-400">Loading your quote...</p>
          </div>
        </div>
      ) : (
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
              tradeInInfo={state.tradeInInfo?.hasTradeIn ? {
                brand: state.tradeInInfo.brand,
                year: state.tradeInInfo.year,
                horsepower: state.tradeInInfo.horsepower,
                model: state.tradeInInfo.model
              } : undefined}
              packageName={selectedPackageData.label}
              includesInstallation={state.purchasePath === 'installed'}
            />

            {/* Legacy Components - Keep for compatibility */}
            <div className="grid md:grid-cols-2 gap-6">
              <BonusOffers motor={quoteData.motor} />
            </div>

            {/* Mobile CTA Section */}
            <div className="lg:hidden space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={() => setShowSaveDialog(true)}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Save for Later
                </Button>
                <Button 
                  onClick={handleDownloadPDF}
                  variant="outline"
                  className="w-full"
                  size="lg"
                  disabled={isGeneratingPDF}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isGeneratingPDF ? 'PDF' : 'Download PDF'}
                </Button>
              </div>
              <Button 
                onClick={handleApplyForFinancing}
                variant="default"
                className="w-full"
                size="lg"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Apply for Financing
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
              onSaveForLater={() => setShowSaveDialog(true)}
              onApplyForFinancing={handleApplyForFinancing}
              isGeneratingPDF={isGeneratingPDF}
            />
          </div>
        </div>
      </div>
      )}
      
      <SaveQuoteDialog 
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        quoteData={state}
        motorModel={motorName}
        finalPrice={packageSpecificTotals.total}
      />
    </QuoteLayout>
  );
}
