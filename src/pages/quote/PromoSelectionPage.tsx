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
  
  // Start with no selection - user must choose
  const [selectedOption, setSelectedOption] = useState<PromoOptionId | null>(null);
  const [selectedRate, setSelectedRate] = useState<FinancingRate | null>(null);
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
      // Both "no_payments" and "special_financing" require financing eligibility
      if ((option.id === 'no_payments' || option.id === 'special_financing') && !isEligibleForFinancing) {
        return false;
      }
      return true;
    });
  }, [options, isEligibleForFinancing, rebateAmount, lowestRate]);

  // Clear any persisted promo selection on mount - fresh choice each time
  useEffect(() => {
    dispatch({ type: 'SET_PROMO_DETAILS', payload: { option: null, rate: null, term: null, value: null } });
  }, [dispatch]);

  // Set default rate when special financing is selected
  useEffect(() => {
    if (selectedOption === 'special_financing' && !selectedRate && financingRates.length > 0) {
      // Default to 36-month option as a balanced choice
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
    document.title = 'Choose Your Bonus | Mercury Get 7 Promotion';
  }, []);

  // Redirect if no motor selected
  useEffect(() => {
    if (!state.motor) {
      navigate('/quote/motor-selection');
    }
  }, [state.motor, navigate]);

  const handleOptionSelect = (optionId: PromoOptionId) => {
    setSelectedOption(optionId);
    setHasJustSelected(true);
    setHasUserInteracted(true);
    triggerHaptic('light');
    
    // Clear rate selection if switching away from special financing
    if (optionId !== 'special_financing') {
      setSelectedRate(null);
      
      // Dispatch to context immediately for non-financing options (enables mobile bar glow)
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
    
    // Auto-reset after 5 seconds
    setTimeout(() => setHasJustSelected(false), 5000);
  };

  const handleRateSelect = (rate: FinancingRate) => {
    setSelectedRate(rate);
    setHasJustSelected(true);
    triggerHaptic('light');
    
    // Dispatch to context immediately with rate details (enables mobile bar glow)
    dispatch({ 
      type: 'SET_PROMO_DETAILS', 
      payload: {
        option: 'special_financing',
        rate: rate.rate,
        term: rate.months,
        value: `${rate.rate}% APR for ${rate.months} months`,
      }
    });
    
    // Auto-reset after 5 seconds
    setTimeout(() => setHasJustSelected(false), 5000);
  };

  const getPromoDisplayValue = (): string => {
    switch (selectedOption) {
      case 'no_payments':
        return 'First payment deferred 6 months';
      case 'special_financing':
        return selectedRate ? `${selectedRate.rate}% APR for ${selectedRate.months} months` : '';
      case 'cash_rebate':
        return `$${rebateAmount.toLocaleString()} rebate`;
      default:
        return '';
    }
  };

  const handleContinue = () => {
    // Context is already updated in handleOptionSelect/handleRateSelect
    // Just navigate to the next page
    navigate('/quote/package-selection');
  };

  const handleBack = () => {
    // Navigate based on purchase path - mirrors forward navigation logic
    if (state.purchasePath === 'installed') {
      navigate('/quote/installation');
    } else {
      navigate('/quote/trade-in');
    }
  };

  // Calculate estimated monthly payment for each rate
  const getEstimatedPayment = (rate: number, months: number): number => {
    return calculateMonthly(estimatedFinancingAmount, rate, months);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-stone-900 via-stone-800 to-stone-900">
        {/* Header */}
        <div className="container mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 pb-12">
          <div className="max-w-4xl mx-auto text-center">
            {/* Mercury Logo */}
            <motion.img
              src={mercuryLogo}
              alt="Mercury Marine"
              className="h-12 mx-auto mb-6 brightness-0 invert"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            />

            {/* Limited Time Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-1.5 rounded-full text-sm font-medium mb-6"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              Limited Time: January 12 – March 31, 2026
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl md:text-5xl font-bold text-white mb-4"
            >
              Get 7 Years of Coverage
              <br />
              <span className="text-primary">+ Choose One Bonus!</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-stone-400 text-lg mb-8 max-w-2xl mx-auto"
            >
              Every qualifying Mercury outboard comes with 7 years of factory warranty
              PLUS your choice of one additional benefit.
            </motion.p>

            {/* Warranty Badge - Included with Shimmer Effect */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="relative inline-flex items-center gap-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 mb-10 overflow-hidden"
            >
              {/* Shimmer overlay */}
              <div 
                className="absolute inset-0 -translate-x-full animate-shimmer-sweep bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" 
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
                <div className="text-white font-bold text-lg">7 Years Factory Warranty</div>
                <div className="text-stone-400 text-sm">3 years standard + 4 years FREE extension</div>
              </div>
              {/* Pulsing INCLUDED Badge */}
              <motion.div 
                className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full ml-2"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                ✓ INCLUDED
              </motion.div>
            </motion.div>

            {/* Divider with Animation */}
            <motion.div 
              className="flex items-center gap-4 mb-8"
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.45, duration: 0.5 }}
            >
              <div className="flex-1 h-px bg-white/20"></div>
              <span className="text-white/60 text-sm font-medium uppercase tracking-wider">Choose Your Bonus</span>
              <div className="flex-1 h-px bg-white/20"></div>
            </motion.div>

            {/* Option Cards with Staggered Entrance - only eligible options */}
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
                    initial={{ opacity: 0, y: 40, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      delay: 0.5 + index * 0.15,
                      type: 'spring',
                      stiffness: 100,
                      damping: 15
                    }}
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
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mb-8"
                >
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 max-w-2xl mx-auto">
                    <h3 className="text-white font-semibold mb-4">Select Your Rate & Term</h3>
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
                                ? 'border-primary bg-primary/20 shadow-lg'
                                : 'border-white/20 bg-white/5 hover:border-primary/50 hover:bg-white/10'
                            )}
                          >
                            <div className="text-2xl font-bold text-white">{rate.rate}%</div>
                            <div className="text-sm text-white/70">{rate.months} months</div>
                            <div className="text-xs text-white/50 mt-1">
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
                    <p className="text-white/50 text-xs mt-4">
                      💡 Tip: Shorter terms = lower rates but higher monthly payments
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Countdown Timer */}
            {endDate && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mb-8"
              >
                <p className="text-stone-500 text-sm mb-2">Offer ends March 31, 2026</p>
                <CountdownTimer endDate={endDate} className="justify-center" />
              </motion.div>
            )}

            {/* Continue Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <Button
                size="lg"
                onClick={handleContinue}
                disabled={!selectedOption || (selectedOption === 'special_financing' && !selectedRate)}
                className={`px-8 py-6 text-lg font-semibold transition-all ${hasJustSelected ? 'animate-pulse-glow' : ''}`}
              >
                Choose Package
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              {!selectedOption && (
                <p className="text-white/50 text-sm mt-2">Select one of the options above</p>
              )}
              {selectedOption === 'special_financing' && !selectedRate && (
                <p className="text-amber-400 text-sm mt-2">Please select a rate and term above</p>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
