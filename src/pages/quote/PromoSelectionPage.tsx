import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, CalendarOff, Percent, Banknote, Check, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CountdownTimer } from '@/components/ui/countdown-timer';
import { useQuote } from '@/contexts/QuoteContext';
import { useActivePromotions } from '@/hooks/useActivePromotions';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { cn } from '@/lib/utils';
import mercuryLogo from '@/assets/mercury-logo.png';
import { PageTransition } from '@/components/ui/page-transition';
import { calculateMonthly, FINANCING_MINIMUM } from '@/lib/finance';

type PromoOptionId = 'no_payments' | 'special_financing' | 'cash_rebate';

interface PromoOption {
  id: PromoOptionId;
  title: string;
  subtitle: string;
  description: string;
  highlight: string;
  icon: typeof CalendarOff;
}

interface FinancingRate {
  months: number;
  rate: number;
}


export default function PromoSelectionPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useQuote();
  const { promotions, getRebateForHP, getSpecialFinancingRates } = useActivePromotions();
  const { triggerHaptic } = useHapticFeedback();
  
  // Restore from context if user navigates back
  const [selectedOption, setSelectedOption] = useState<PromoOptionId | null>(
    state.selectedPromoOption || null
  );
  const [selectedRate, setSelectedRate] = useState<FinancingRate | null>(
    state.selectedPromoRate && state.selectedPromoTerm
      ? { rate: state.selectedPromoRate, months: state.selectedPromoTerm }
      : null
  );
  const [hasJustSelected, setHasJustSelected] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  
  // Ref for auto-scrolling to rate selector
  const rateSelectorRef = useRef<HTMLDivElement>(null);

  const activePromo = promotions.length > 0 ? promotions[0] : null;
  const endDate = activePromo?.end_date ? new Date(activePromo.end_date) : null;
  
  // Get dynamic values based on motor HP
  const motorHP = state.motor?.hp || 150;
  const rebateAmount = getRebateForHP(motorHP) || 250;
  const financingRates = getSpecialFinancingRates() || [];
  const lowestRate = financingRates?.[0]?.rate || 2.99;

  // Estimate financing amount (motor price + tax + fees - trade-in)
  const estimatedFinancingAmount = useMemo(() => {
    const motorPrice = state.motor?.salePrice || state.motor?.price || 0;
    const tradeInValue = state.tradeInInfo?.estimatedValue || 0;
    const taxMultiplier = 1.13; // HST
    const dealerplanFee = 299;
    return (motorPrice * taxMultiplier) + dealerplanFee - tradeInValue;
  }, [state.motor, state.tradeInInfo]);

  // Check if eligible for financing-dependent options (no_payments and special_financing)
  const isEligibleForFinancing = estimatedFinancingAmount >= FINANCING_MINIMUM;

  const options: PromoOption[] = [
    {
      id: 'no_payments',
      title: '6 Months No Payments',
      subtitle: 'Buy Now, Pay Later',
      description: 'Take delivery of your new motor today and make no payments for 6 full months. Perfect for getting on the water now.',
      highlight: 'Deferred',
      icon: CalendarOff,
    },
    {
      id: 'special_financing',
      title: 'Special Financing',
      subtitle: `As Low As ${lowestRate}% APR`,
      description: 'Lock in promotional financing rates well below standard rates. Save thousands over the life of your loan.',
      highlight: 'Low Rate',
      icon: Percent,
    },
    {
      id: 'cash_rebate',
      title: 'Factory Rebate',
      subtitle: `$${rebateAmount.toLocaleString()} Back`,
      description: `Get $${rebateAmount.toLocaleString()} cash back from Mercury applied directly to your purchase. Instant savings at checkout.`,
      highlight: 'Your Rebate',
      icon: Banknote,
    },
  ];

  // Filter to only eligible options - hide financing-dependent options if not eligible
  const eligibleOptions = useMemo(() => {
    return options.filter(option => {
      if ((option.id === 'no_payments' || option.id === 'special_financing') && !isEligibleForFinancing) {
        return false;
      }
      return true;
    });
  }, [options, isEligibleForFinancing, rebateAmount, lowestRate]);

  // Set default rate when special financing is selected
  useEffect(() => {
    if (selectedOption === 'special_financing' && !selectedRate && financingRates.length > 0) {
      const defaultRate = financingRates.find(r => r.months === 36) || financingRates[0];
      setSelectedRate(defaultRate);
    }
  }, [selectedOption, selectedRate, financingRates]);

  // Auto-scroll to rate selector ONLY after user explicitly selects special financing
  useEffect(() => {
    if (hasUserInteracted && selectedOption === 'special_financing' && isEligibleForFinancing && rateSelectorRef.current) {
      setTimeout(() => {
        rateSelectorRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 150);
    }
  }, [hasUserInteracted, selectedOption, isEligibleForFinancing]);

  useEffect(() => {
    document.title = 'Quote Builder';
  }, []);

  // Redirect if no motor selected
  useEffect(() => {
    if (!state.motor) {
      navigate('/quote/motor-selection');
    }
  }, [state.motor, navigate]);

  // Auto-skip if no active promotions OR if promo has no "choose one" options (warranty-only)
  const hasChooseOneOptions = activePromo?.promo_options?.type === 'choose_one' && 
    (activePromo.promo_options.options?.length ?? 0) > 0;

  useEffect(() => {
    if (state.motor && (!activePromo || !hasChooseOneOptions)) {
      // For warranty-only promos, auto-apply the warranty and skip
      if (activePromo && !hasChooseOneOptions) {
        dispatch({ type: 'SET_SELECTED_PACKAGE', payload: { id: 'good', label: 'Essential', priceBeforeTax: 0 } });
        dispatch({ type: 'SET_WARRANTY_CONFIG', payload: { extendedYears: 0, warrantyPrice: 0, totalYears: 3 + (activePromo.warranty_extra_years || 0) } });
      }
      navigate('/quote/summary', { replace: true });
    }
  }, [activePromo, hasChooseOneOptions, state.motor, navigate]);

  const handleOptionSelect = (optionId: PromoOptionId) => {
    setSelectedOption(optionId);
    setHasJustSelected(true);
    setHasUserInteracted(true);
    triggerHaptic('light');
    
    if (optionId !== 'special_financing') {
      setSelectedRate(null);
      
      const promoValue = optionId === 'no_payments' 
        ? 'First payment deferred 6 months' 
        : `$${rebateAmount.toLocaleString()} rebate`;
      
      dispatch({ 
        type: 'SET_PROMO_DETAILS', 
        payload: {
          option: optionId,
          rate: null,
          term: null,
          value: promoValue,
        }
      });
    }
    
    setTimeout(() => setHasJustSelected(false), 5000);
  };

  const handleRateSelect = (rate: FinancingRate) => {
    setSelectedRate(rate);
    setHasJustSelected(true);
    triggerHaptic('light');
    
    dispatch({ 
      type: 'SET_PROMO_DETAILS', 
      payload: {
        option: 'special_financing',
        rate: rate.rate,
        term: rate.months,
        value: `${rate.rate}% APR for ${rate.months} months`,
      }
    });
    
    setTimeout(() => setHasJustSelected(false), 5000);
  };

  const handleContinue = () => {
    dispatch({ type: 'SET_SELECTED_PACKAGE', payload: { id: 'good', label: 'Essential', priceBeforeTax: 0 } });
    dispatch({ type: 'SET_WARRANTY_CONFIG', payload: { extendedYears: 0, warrantyPrice: 0, totalYears: 7 } });
    navigate('/quote/summary');
  };

  const handleBack = () => {
    if (state.purchasePath === 'installed') {
      navigate('/quote/installation');
    } else {
      navigate('/quote/trade-in');
    }
  };

  const getEstimatedPayment = (rate: number, months: number): number => {
    return calculateMonthly(estimatedFinancingAmount, rate, months);
  };

  // If no active promo, show nothing (auto-skip handles redirect)
  if (!activePromo) return null;

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-background via-secondary/30 to-accent/50">
        {/* Header */}
        <div className="container mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="text-foreground hover:bg-accent"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 pb-12">
          <div className="max-w-4xl mx-auto text-center">
            {/* Mercury Logo */}
            <img
              src={mercuryLogo}
              alt="Mercury Marine"
              className="h-12 mx-auto mb-6 brightness-0 dark:invert"
            />

            {/* Main Headline */}
            <motion.h1
              initial={{ y: 16 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="text-3xl md:text-5xl font-bold text-foreground mb-4"
              style={{ opacity: 1 }}
            >
              7-Year Factory-Backed Warranty
            </motion.h1>

            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              Every new Mercury outboard from Harris Boat Works comes with 7 years of factory warranty.
              Mercury stopped running promos — so we're running our own.
            </p>

            {/* Warranty Badge - Included with Shimmer Effect — no opacity animation */}
            <div className="relative inline-flex items-center gap-4 bg-green-50 dark:bg-green-950/30 backdrop-blur-sm border border-green-200 dark:border-green-800 rounded-xl px-6 py-4 mb-10 overflow-hidden">
              {/* Shimmer overlay */}
              <div 
                className="absolute inset-0 -translate-x-full animate-shimmer-sweep bg-gradient-to-r from-transparent via-green-200/30 to-transparent pointer-events-none" 
              />
              
              {/* Floating Shield Icon */}
              <motion.div 
                className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center"
                animate={{ y: [0, -6, 0] }}
                transition={{ 
                  duration: 3, 
                  ease: 'easeInOut', 
                  repeat: Infinity 
                }}
              >
                <Shield className="w-6 h-6 text-green-400" />
              </motion.div>
              <div className="text-left">
                <div className="text-foreground font-bold text-lg">7 Years Factory Warranty</div>
                <div className="text-muted-foreground text-sm">3 years standard + 4 years FREE extension</div>
              </div>
              {/* Pulsing INCLUDED Badge */}
              <motion.div 
                className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full ml-2"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                ✓ INCLUDED
              </motion.div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex-1 h-px bg-border"></div>
              <span className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Choose Your Bonus</span>
              <div className="flex-1 h-px bg-border"></div>
            </div>

            {/* Option Cards — transform-only entrance, no opacity */}
            <div className={cn(
              "grid gap-6 mb-6",
              eligibleOptions.length === 2 ? "md:grid-cols-2 max-w-2xl mx-auto" : "md:grid-cols-3"
            )}>
              {eligibleOptions.map((option, index) => {
                const Icon = option.icon;
                const isSelected = selectedOption === option.id;

                return (
                  <motion.button
                    key={option.id}
                    initial={{ y: 24 }}
                    animate={{ y: 0 }}
                    transition={{ 
                      delay: index * 0.1,
                      type: 'spring',
                      stiffness: 100,
                      damping: 15
                    }}
                    style={{ opacity: 1 }}
                    whileHover={{ scale: 1.03, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleOptionSelect(option.id)}
                    className={cn(
                      'relative bg-white rounded-xl border-2 p-6 text-left transition-all duration-200',
                      isSelected
                        ? 'border-primary shadow-xl ring-2 ring-primary/30'
                        : 'border-transparent hover:border-primary/50 hover:shadow-xl'
                    )}
                  >
                    {/* Selected Checkmark */}
                    {isSelected && (
                      <motion.div 
                        className="absolute -top-3 -right-3 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                      >
                        <Check className="w-5 h-5 text-white" />
                      </motion.div>
                    )}

                    {/* Icon with Hover Effect */}
                    <motion.div 
                      className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <Icon className="w-7 h-7 text-primary" />
                    </motion.div>

                    {/* Title */}
                    <h3 className="text-xl font-semibold text-foreground mb-1">{option.title}</h3>

                    {/* Highlight Badge */}
                    <span className="inline-block px-3 py-1 rounded-full text-sm font-medium mb-3 bg-green-100 text-green-800">
                      {option.highlight}
                    </span>

                    {/* Description */}
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {option.description}
                    </p>
                  </motion.button>
                );
              })}
            </div>

            {/* Rate/Term Selection for Special Financing */}
            <AnimatePresence>
              {selectedOption === 'special_financing' && isEligibleForFinancing && financingRates.length > 0 && (
                <motion.div
                  ref={rateSelectorRef}
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mb-8"
                  style={{ opacity: 1 }}
                >
                    <div className="bg-card border border-border rounded-xl p-6 max-w-2xl mx-auto">
                    <h3 className="text-foreground font-semibold mb-4">Select Your Rate & Term</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {financingRates.map((rate) => {
                        const isRateSelected = selectedRate?.months === rate.months;
                        const estimatedPayment = getEstimatedPayment(rate.rate, rate.months);
                        
                        return (
                          <button
                            key={rate.months}
                            onClick={() => handleRateSelect(rate)}
                            className={cn(
                              'p-4 rounded-lg border-2 text-center transition-all duration-200',
                              isRateSelected
                                ? 'border-primary bg-primary/10 shadow-lg'
                                : 'border-border bg-muted/50 hover:border-primary/50 hover:bg-accent'
                            )}
                          >
                            <div className="text-2xl font-bold text-foreground">{rate.rate}%</div>
                            <div className="text-sm text-muted-foreground">{rate.months} months</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              ~${Math.round(estimatedPayment)}/mo
                            </div>
                            {isRateSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="mt-2"
                              >
                                <Check className="w-4 h-4 text-primary mx-auto" />
                              </motion.div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-muted-foreground text-xs mt-4">
                      💡 Tip: Shorter terms = lower rates but higher monthly payments
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Countdown Timer */}
            {endDate && (
              <div className="mb-8">
                <p className="text-muted-foreground text-sm mb-2">Offer ends March 31, 2026</p>
                <CountdownTimer endDate={endDate} className="justify-center" />
              </div>
            )}

            {/* Continue Button — static */}
            <div>
              <Button
                size="lg"
                onClick={handleContinue}
                disabled={!selectedOption || (selectedOption === 'special_financing' && !selectedRate)}
                className={`px-8 py-6 text-lg font-semibold transition-all ${hasJustSelected ? 'animate-pulse-glow' : ''}`}
              >
                Apply Bonus & Continue
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              {!selectedOption && (
                <p className="text-muted-foreground text-sm mt-2">Select one of the options above</p>
              )}
              {selectedOption === 'special_financing' && !selectedRate && (
                <p className="text-amber-600 dark:text-amber-400 text-sm mt-2">Please select a rate and term above</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
