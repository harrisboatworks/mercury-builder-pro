import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Shield, Sparkles, Star, HelpCircle, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageTransition } from '@/components/ui/page-transition';
import { PackageCards, type PackageOption } from '@/components/quote-builder/PackageCards';
import { PackageComparisonTable } from '@/components/quote-builder/PackageComparisonTable';
import { UpgradeNudgeBar } from '@/components/quote-builder/UpgradeNudgeBar';
import { CountdownTimer } from '@/components/ui/countdown-timer';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useQuote } from '@/contexts/QuoteContext';
import { useActiveFinancingPromo } from '@/hooks/useActiveFinancingPromo';
import { useActivePromotions } from '@/hooks/useActivePromotions';
import { calculateMonthlyPayment, DEALERPLAN_FEE } from '@/lib/finance';
import { calculateQuotePricing, calculateWarrantyExtensionCost } from '@/lib/quote-utils';
import { isTillerMotor, requiresMercuryControls, includesPropeller, canAddExternalFuelTank } from '@/lib/motor-helpers';
import { getPackageRecommendation, getRecommendationExplanation } from '@/lib/package-recommendation';
import mercuryLogo from '@/assets/mercury-logo.png';

// Package warranty year constants
const COMPLETE_TARGET_YEARS = 7;
const PREMIUM_TARGET_YEARS = 8;

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  }
};

export default function PackageSelectionPage() {
  const navigate = useNavigate();
  const { state, dispatch, getQuoteData } = useQuote();
  const { promo } = useActiveFinancingPromo();
  const { promotions, getTotalWarrantyBonusYears, getTotalPromotionalSavings, getSpecialFinancingRates } = useActivePromotions();
  
  // Only pre-select if user already explicitly chose a package
  const [selectedPackage, setSelectedPackage] = useState<string | null>(
    state.selectedPackage?.id || null
  );
  const [hasJustSelected, setHasJustSelected] = useState(false);
  const [completeWarrantyCost, setCompleteWarrantyCost] = useState<number>(0);
  const [premiumWarrantyCost, setPremiumWarrantyCost] = useState<number>(0);
  const [isMounted, setIsMounted] = useState(false);

  // Calculate effective promo rate based on user's promo selection
  const effectivePromoRate = useMemo(() => {
    if (state.selectedPromoOption === 'special_financing') {
      const rates = getSpecialFinancingRates();
      return rates?.[0]?.rate || null;
    }
    return promo?.rate || null;
  }, [state.selectedPromoOption, getSpecialFinancingRates, promo?.rate]);

  // Create promo message for nudge bars
  const promoMessage = useMemo(() => {
    switch (state.selectedPromoOption) {
      case 'special_financing': {
        const rates = getSpecialFinancingRates();
        return `Keeps ${rates?.[0]?.rate || 2.99}% APR`;
      }
      case 'no_payments':
        return 'Keeps 6 Mo. No Payments';
      case 'cash_rebate':
        return 'Keeps your rebate';
      default:
        return undefined;
    }
  }, [state.selectedPromoOption, getSpecialFinancingRates]);

  // Get promo end date for countdown
  const promoEndDate = promotions?.[0]?.end_date ? new Date(promotions[0].end_date) : null;

  useEffect(() => {
    document.title = 'Choose Your Package | Harris Boat Works';
    setIsMounted(true);
  }, []);

  // Redirect if no motor or promo option selected
  useEffect(() => {
    if (isMounted) {
      if (!state.motor) {
        navigate('/quote/motor');
      } else if (!state.selectedPromoOption) {
        navigate('/quote/promo-selection');
      }
    }
  }, [isMounted, state.motor, state.selectedPromoOption, navigate]);

  const quoteData = getQuoteData();
  const motor = state?.motor ?? {} as any;
  const motorName = motor?.model ?? motor?.name ?? "Mercury Outboard";
  const hp = quoteData.motor?.hp || motor?.hp || motor?.horsepower || 0;
  const motorHP = hp;
  const boatType = state.boatInfo?.type || quoteData.boatInfo?.type;

  // Get smart package recommendation based on boat type and motor HP
  const recommendation = useMemo(() => 
    getPackageRecommendation(boatType, motorHP, state.purchasePath),
    [boatType, motorHP, state.purchasePath]
  );

  // Get explanation for the recommendation
  const recommendationExplanation = useMemo(() =>
    getRecommendationExplanation(boatType, motorHP, recommendation.packageId),
    [boatType, motorHP, recommendation.packageId]
  );

  // Motor type calculations
  const motorModel = motor?.model || '';
  const isManualTiller = isTillerMotor(motorModel);
  const needsControls = requiresMercuryControls(motor);
  const isManualStart = motorModel.includes('MH') || motorModel.includes('MLH');
  const includesProp = includesPropeller(motor);
  const canAddFuelTank = canAddExternalFuelTank(motor);

  // Calculate costs
  const getControlsCostFromSelection = (): number => {
    if (!needsControls) return 0;
    const controlsOption = state.boatInfo?.controlsOption;
    switch (controlsOption) {
      case 'none': return 1200;
      case 'adapter': return 125;
      case 'compatible': return 0;
      default: return 0;
    }
  };

  const controlsCost = getControlsCostFromSelection();
  const installationLaborCost = !isManualTiller ? 450 : 0;
  const batteryCost = !isManualStart ? 179.99 : 0;
  const baseAccessoryCost = controlsCost + installationLaborCost;
  const tillerInstallCost = isManualTiller ? (state.installConfig?.installationCost || 0) : 0;

  // Motor pricing
  const motorMSRP = quoteData.motor?.msrp || quoteData.motor?.basePrice || 0;
  const motorSalePrice = quoteData.motor?.salePrice || quoteData.motor?.price || motorMSRP;
  const motorDiscount = motorMSRP - motorSalePrice;
  const promoSavings = getTotalPromotionalSavings?.(motorMSRP) || 0;
  const selectedOptionsTotal = (state.selectedOptions || []).reduce((sum, opt) => sum + opt.price, 0);

  // Coverage years
  const baseYears = 3;
  const promoYears = getTotalWarrantyBonusYears?.() ?? 0;
  const currentCoverageYears = useMemo(() => Math.min(baseYears + promoYears, 8), [promoYears]);

  // Pricing totals
  const totals = calculateQuotePricing({
    motorMSRP,
    motorDiscount,
    accessoryTotal: baseAccessoryCost + selectedOptionsTotal,
    warrantyPrice: 0,
    promotionalSavings: promoSavings,
    tradeInValue: state.tradeInInfo?.estimatedValue || 0,
    taxRate: 0.13
  });

  // Fetch warranty costs
  useEffect(() => {
    async function fetchWarrantyCosts() {
      const completeCost = await calculateWarrantyExtensionCost(motorHP, currentCoverageYears, COMPLETE_TARGET_YEARS);
      const premiumCost = await calculateWarrantyExtensionCost(motorHP, currentCoverageYears, PREMIUM_TARGET_YEARS);
      setCompleteWarrantyCost(completeCost);
      setPremiumWarrantyCost(premiumCost);
    }
    if (motorHP > 0) fetchWarrantyCosts();
  }, [motorHP, currentCoverageYears]);

  // Base subtotal
  const baseSubtotal = (motorMSRP - motorDiscount) + baseAccessoryCost + selectedOptionsTotal - promoSavings - (state.tradeInInfo?.estimatedValue || 0);

  // Package options with smart recommendations
  const packages: PackageOption[] = useMemo(() => [
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
      coverageYears: currentCoverageYears,
      recommended: recommendation.packageId === 'good',
      recommendationReason: recommendation.packageId === 'good' ? recommendation.reason : undefined
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
      coverageYears: COMPLETE_TARGET_YEARS,
      targetWarrantyYears: COMPLETE_TARGET_YEARS,
      recommended: recommendation.packageId === 'better',
      recommendationReason: recommendation.packageId === 'better' ? recommendation.reason : undefined
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
      targetWarrantyYears: PREMIUM_TARGET_YEARS,
      recommended: recommendation.packageId === 'best',
      recommendationReason: recommendation.packageId === 'best' ? recommendation.reason : undefined
    },
  ], [baseSubtotal, tillerInstallCost, totals.savings, isManualTiller, currentCoverageYears, isManualStart, batteryCost, completeWarrantyCost, premiumWarrantyCost, includesProp, canAddFuelTank, recommendation]);

  // Calculate monthly payments for upgrade nudges
  const essentialPackage = packages.find(p => p.id === 'good') || packages[0];
  const completePackage = packages.find(p => p.id === 'better') || packages[1];
  const premiumPackage = packages.find(p => p.id === 'best') || packages[2];

  const essentialMonthly = calculateMonthlyPayment(
    (essentialPackage.priceBeforeTax * 1.13) + DEALERPLAN_FEE,
    effectivePromoRate
  ).payment;
  
  const completeMonthly = calculateMonthlyPayment(
    (completePackage.priceBeforeTax * 1.13) + DEALERPLAN_FEE,
    effectivePromoRate
  ).payment;
  
  const premiumMonthly = calculateMonthlyPayment(
    (premiumPackage.priceBeforeTax * 1.13) + DEALERPLAN_FEE,
    effectivePromoRate
  ).payment;

  const monthlyDeltaToComplete = completeMonthly - essentialMonthly;
  const coverageGainToComplete = (completePackage.coverageYears || COMPLETE_TARGET_YEARS) - (essentialPackage.coverageYears || currentCoverageYears);
  
  const monthlyDeltaToPremium = premiumMonthly - completeMonthly;
  const coverageGainToPremium = (premiumPackage.coverageYears || PREMIUM_TARGET_YEARS) - (completePackage.coverageYears || COMPLETE_TARGET_YEARS);

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackage(packageId);
    setHasJustSelected(true);
    
    // Auto-reset after 5 seconds
    setTimeout(() => setHasJustSelected(false), 5000);
    
    // Update warranty config and dispatch to context immediately
    const selectedPkg = packages.find(p => p.id === packageId);
    if (selectedPkg) {
      const totalYears = selectedPkg.coverageYears || currentCoverageYears;
      const extendedYears = Math.max(0, totalYears - currentCoverageYears);
      
      let warrantyPrice = 0;
      if (packageId === 'better') warrantyPrice = completeWarrantyCost;
      else if (packageId === 'best') warrantyPrice = premiumWarrantyCost;
      
      dispatch({
        type: 'SET_WARRANTY_CONFIG',
        payload: { totalYears, extendedYears, warrantyPrice }
      });
      
      // Dispatch package selection immediately so UnifiedMobileBar can detect it
      dispatch({ 
        type: 'SET_SELECTED_PACKAGE', 
        payload: { 
          id: selectedPkg.id, 
          label: selectedPkg.label, 
          priceBeforeTax: selectedPkg.priceBeforeTax 
        } 
      });
    }
  };

  const handleContinue = () => {
    // Require explicit selection before continuing
    if (!selectedPackage) return;
    navigate('/quote/summary');
  };

  const handleBack = () => {
    navigate('/quote/promo-selection');
  };

  const selectedPackageData = selectedPackage ? packages.find(p => p.id === selectedPackage) : null;

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-stone-900/80 backdrop-blur-md border-b border-stone-700/50">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="text-stone-300 hover:text-white hover:bg-stone-700/50 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            {promoEndDate && (
              <div className="flex items-center gap-2 text-xs text-stone-400">
                <span>Offer ends in</span>
                <CountdownTimer endDate={promoEndDate} compact />
              </div>
            )}
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Logo and Header */}
            <motion.div variants={itemVariants} className="text-center space-y-6">
              <img 
                src={mercuryLogo} 
                alt="Mercury Marine" 
                className="h-10 md:h-12 mx-auto brightness-0 invert opacity-90"
              />
              
              {/* Coverage Badge */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/30"
              >
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-300">
                  {currentCoverageYears} Years Factory Warranty Included
                </span>
              </motion.div>

              <div className="space-y-3">
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                  Choose Your Coverage Package
                </h1>
                <p className="text-stone-400 text-lg max-w-2xl mx-auto">
                  Select the level of protection that's right for your{' '}
                  <span className="text-white font-medium">{motorName}</span>
                </p>
              </div>
            </motion.div>

            {/* Smart Recommendation Badge with Tooltip */}
            <TooltipProvider>
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.4, type: "spring" }}
                className="relative mx-auto max-w-md"
              >
                <div className="bg-white rounded-xl border-2 border-primary shadow-lg px-5 py-4">
                  <div className="flex items-center justify-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Star className="w-5 h-5 text-primary fill-primary" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-foreground">
                        Recommended for You: {recommendation.packageId === 'good' ? 'Essential' : recommendation.packageId === 'better' ? 'Complete' : 'Premium'}
                      </p>
                      <p className="text-xs text-muted-foreground">{recommendation.reason}</p>
                    </div>
                    
                    {/* Why This? Tooltip */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="ml-1 p-1.5 rounded-full hover:bg-muted transition-colors">
                          <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent 
                        side="bottom" 
                        className="max-w-xs p-4 bg-white border shadow-xl"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-primary" />
                            <span className="font-semibold text-foreground">{recommendationExplanation.title}</span>
                          </div>
                          <p className="text-xs text-muted-foreground font-medium">Based on your setup:</p>
                          <ul className="space-y-2">
                            {recommendationExplanation.factors.map((factor, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-xs text-foreground">
                                <span className="text-primary mt-0.5">•</span>
                                <span>{factor}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="pt-2 border-t border-border">
                            <p className="text-xs text-muted-foreground italic">
                              You can always choose a different package based on your preferences.
                            </p>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </motion.div>
            </TooltipProvider>

            {/* Package Cards */}
            <motion.div variants={itemVariants} className="pt-4">
              <PackageCards
                options={packages}
                selectedId={selectedPackage}
                onSelect={handlePackageSelect}
                promoRate={promo?.rate || null}
                showUpgradeDeltas={true}
                revealComplete={true}
                variant="dark"
              />
            </motion.div>

            {/* Comparison Table */}
            <motion.div variants={itemVariants}>
              <PackageComparisonTable
                selectedId={selectedPackage}
                onSelectPackage={handlePackageSelect}
                currentCoverageYears={currentCoverageYears}
                isManualStart={isManualStart}
                includesProp={includesProp}
                canAddFuelTank={canAddFuelTank}
              />
            </motion.div>

            {/* Upgrade Nudge Bars */}
            <AnimatePresence mode="wait">
              {selectedPackage === 'good' && (
                <motion.div
                  key="nudge-complete"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <UpgradeNudgeBar
                    isVisible={true}
                    coverageGain={coverageGainToComplete}
                    monthlyDelta={monthlyDeltaToComplete}
                    upgradeToLabel="Complete"
                    onUpgrade={() => handlePackageSelect('better')}
                    promoMessage={promoMessage}
                  />
                </motion.div>
              )}
              {selectedPackage === 'better' && (
                <motion.div
                  key="nudge-premium"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <UpgradeNudgeBar
                    isVisible={true}
                    coverageGain={coverageGainToPremium}
                    monthlyDelta={monthlyDeltaToPremium}
                    upgradeToLabel="Premium"
                    onUpgrade={() => handlePackageSelect('best')}
                    promoMessage={promoMessage}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Selected Package Summary - only show when a package is selected */}
            {selectedPackageData && (
              <motion.div 
                variants={itemVariants}
                className="bg-stone-800/50 border border-stone-700/50 rounded-2xl p-6 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-stone-400">Selected Package</p>
                      <p className="text-lg font-semibold text-white">{selectedPackageData.label}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-stone-400">Starting at</p>
                    <p className="text-2xl font-bold text-white">
                      ${selectedPackageData.priceBeforeTax.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-stone-500">before tax</p>
                  </div>
                </div>
                
                {/* Features preview */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {selectedPackageData.features.slice(0, 3).map((feature, i) => (
                    <span 
                      key={i}
                      className="px-3 py-1 text-xs rounded-full bg-stone-700/50 text-stone-300"
                    >
                      {feature}
                    </span>
                  ))}
                  {selectedPackageData.features.length > 3 && (
                    <span className="px-3 py-1 text-xs rounded-full bg-stone-700/50 text-stone-400">
                      +{selectedPackageData.features.length - 3} more
                    </span>
                  )}
                </div>
              </motion.div>
            )}

            {/* Continue Button */}
            <motion.div variants={itemVariants} className="pt-4">
              <Button
                onClick={handleContinue}
                disabled={!selectedPackage}
                size="lg"
                className={`w-full md:w-auto md:min-w-[280px] md:mx-auto md:flex font-semibold text-lg h-14 rounded-xl transition-all ${
                  selectedPackage 
                    ? `bg-white text-stone-900 hover:bg-stone-100 shadow-lg shadow-white/10 ${hasJustSelected ? 'animate-pulse-glow' : ''}` 
                    : 'bg-stone-700 text-stone-400 cursor-not-allowed'
                }`}
              >
                {selectedPackage ? 'Continue to Summary' : 'Select a Package'}
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
