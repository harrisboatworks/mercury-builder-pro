import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Percent, Banknote, CreditCard, Check, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CountdownTimer } from '@/components/ui/countdown-timer';
import { useQuote } from '@/contexts/QuoteContext';
import { useActivePromotions } from '@/hooks/useActivePromotions';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { cn } from '@/lib/utils';
import mercuryLogo from '@/assets/mercury-logo.png';
import { PageTransition } from '@/components/ui/page-transition';
import { QuoteLayout } from '@/components/quote-builder/QuoteLayout';
import { QuotePageShell } from '@/components/quote-builder/redesign/QuotePageShell';
import { calculateMonthly, DEALERPLAN_FEE, FINANCING_MINIMUM } from '@/lib/finance';
import { promoEndOfDay } from '@/lib/quote-utils';
import { calculateQuoteFinancingEstimate } from '@/lib/quote-financing-estimate';

type PaymentOptionId = 'cash_purchase' | 'special_financing' | 'standard_financing';

interface PromoOption {
  id: PaymentOptionId;
  title: string;
  subtitle: string;
  description: string;
  highlight: string;
  icon: typeof Percent;
}

interface FinancingRate {
  months: number;
  rate: number;
}


export default function PromoSelectionPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useQuote();
  const { promotions, loading: promoLoading, getRebateForHP, getPromotionSavingsForMotor, getSpecialFinancingRates } = useActivePromotions();
  const { triggerHaptic } = useHapticFeedback();

  // Restore from context if user navigates back
  const [selectedOption, setSelectedOption] = useState<PaymentOptionId | null>(() => {
    if (state.selectedPaymentMethod) return state.selectedPaymentMethod;
    if (state.selectedPromoOption === 'special_financing') return 'special_financing';
    if (state.selectedPromoOption === 'cash_rebate') return 'standard_financing';
    return null;
  });
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
  const endDate = activePromo?.end_date ? promoEndOfDay(activePromo.end_date) : null;

  // Get dynamic values based on motor HP
  const motorHP = state.motor?.hp || 150;
  const rebateAmount = getRebateForHP(motorHP) || 0;
  const financingRates = useMemo(
    () => getSpecialFinancingRates() || [],
    [getSpecialFinancingRates],
  );
  const lowestRate = financingRates?.[0]?.rate || 2.99;
  const shortestPromoTerm = financingRates.length > 0
    ? financingRates.reduce((min, r) => (r.months < min.months ? r : min), financingRates[0])
    : null;

  // Use the same pricing order and quote inputs as the final summary so the
  // payment preview cannot drift from the amount ultimately financed.
  const financingEstimate = useMemo(() => {
    if (!state.motor) return null;
    const motorMSRP = state.frozenPricing?.motorMSRP
      ?? (state.motor.msrp || state.motor.basePrice || state.motor.price || 0);
    const promotionalSavings = state.frozenPricing?.promoSavings
      ?? getPromotionSavingsForMotor(motorHP, motorMSRP);

    return calculateQuoteFinancingEstimate({
      selectedOptions: state.selectedOptions,
      motor: state.motor,
      boatInfo: state.boatInfo,
      purchasePath: state.purchasePath,
      installConfig: state.installConfig,
      looseMotorBattery: state.looseMotorBattery,
      selectedPackage: state.selectedPackage?.id || 'good',
      adminCustomItems: state.adminCustomItems,
      warrantyConfig: state.warrantyConfig,
      tradeInInfo: state.tradeInInfo,
      adminDiscount: state.adminDiscount,
      promotionalSavings,
      motorMSRPOverride: state.frozenPricing?.motorMSRP,
      motorDiscountOverride: state.frozenPricing?.motorDiscount,
      frozenSubtotal: state.frozenPricing?.subtotal,
      dealerFee: DEALERPLAN_FEE,
    });
  }, [
    getPromotionSavingsForMotor,
    motorHP,
    state.adminCustomItems,
    state.adminDiscount,
    state.boatInfo,
    state.frozenPricing,
    state.installConfig,
    state.looseMotorBattery,
    state.motor,
    state.selectedOptions,
    state.selectedPackage?.id,
    state.tradeInInfo,
    state.warrantyConfig,
    state.purchasePath,
  ]);
  const estimatedFinancingAmount = financingEstimate?.financeableAmount || 0;
  const financingEligibilityAmount = state.frozenPricing?.total
    ?? financingEstimate?.pricing.total
    ?? 0;

  // Match the summary CTA gate: DealerPlan's fee is financed, but it does not
  // turn an otherwise below-minimum purchase into an eligible application.
  const isEligibleForFinancing = financingEligibilityAmount >= FINANCING_MINIMUM;

  const options = useMemo<PromoOption[]>(() => [
      {
        id: 'cash_purchase',
        title: 'Cash Purchase',
        subtitle: 'No financing',
        description: 'Pay without financing. Your eligible factory rebate remains fully applied to the quote.',
        highlight: 'No Loan',
        icon: Banknote,
      },
      {
        id: 'special_financing',
        title: 'Promotional Financing',
        subtitle: shortestPromoTerm
          ? `${shortestPromoTerm.rate}% for ${shortestPromoTerm.months} months (OAC)`
          : `As Low As ${lowestRate}% APR (OAC)`,
        description: 'Layered on top of your rebate. Pick promo financing to lock in a low promotional rate, or keep standard TD financing.',
        highlight: 'Optional Add-On',
        icon: Percent,
      },
      {
        id: 'standard_financing',
        title: 'Standard TD Financing',
        subtitle: 'As low as 5.48% APR',
        description: 'Use the standard TD "Always On" program. Your eligible factory rebate remains fully applied.',
        highlight: 'Flexible Terms',
        icon: CreditCard,
      },
    ],
    [lowestRate, shortestPromoTerm],
  );

  // Filter to only eligible options - hide financing-only options if not eligible
  const eligibleOptions = useMemo(() => {
    return options.filter(option => {
      if ((option.id === 'special_financing' || option.id === 'standard_financing') && !isEligibleForFinancing) return false;
      return true;
    });
  }, [options, isEligibleForFinancing]);

  const persistFinancingRate = useCallback((rate: FinancingRate) => {
    dispatch({ type: 'SET_PAYMENT_METHOD', payload: 'special_financing' });
    dispatch({
      type: 'SET_PROMO_DETAILS',
      payload: {
        option: 'special_financing',
        rate: rate.rate,
        term: rate.months,
        value: `${rate.rate}% APR for ${rate.months} months`,
      },
    });
  }, [dispatch]);

  // Set and persist the default rate when special financing is selected.
  // The selected tile and quote state must never disagree.
  useEffect(() => {
    if (selectedOption === 'special_financing' && !selectedRate && financingRates.length > 0) {
      const defaultRate = financingRates.find(r => r.months === 24) || financingRates[0];
      setSelectedRate(defaultRate);
      persistFinancingRate(defaultRate);
    }
  }, [selectedOption, selectedRate, financingRates, persistFinancingRate]);

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

  // Auto-apply the matrix rebate as soon as we know the promo is a matrix
  // promo, so a customer who never reaches this screen (loading race, or
  // auto-skip on a warranty-only promo) still gets the rebate in their
  // summary line items. Idempotent: no-op if the same option is already set.
  useEffect(() => {
    if (!state.motor || !activePromo || rebateAmount <= 0) return;
    if (state.selectedPromoOption === 'special_financing' && state.selectedPromoRate) return;
    if (state.selectedPromoOption === 'cash_rebate') return;
    dispatch({
      type: 'SET_PROMO_DETAILS',
      payload: {
        option: 'cash_rebate',
        rate: null,
        term: null,
        value: `$${rebateAmount.toLocaleString()} rebate`,
      },
    });
  }, [state.motor, activePromo, rebateAmount, state.selectedPromoOption, state.selectedPromoRate, dispatch]);

  // Auto-skip only when we KNOW there are no promotion options. Layered
  // offers still need this step so the customer can opt into promo financing
  // while the rebate remains automatic.
  // Guard against the loading race: while promotions are still loading we
  // must not redirect, otherwise the customer skips the screen before we
  // ever hear back from the DB and the rebate is silently dropped.
  const hasPromotionOptions = (
    activePromo?.promo_options?.type === 'choose_one' ||
    activePromo?.promo_options?.type === 'layered'
  ) && (activePromo.promo_options.options?.length ?? 0) > 0;

  useEffect(() => {
    if (promoLoading) return;
    if (!state.motor) return;
    if (activePromo && hasPromotionOptions) return;

    // For warranty-only promos, auto-apply the warranty and skip
    if (activePromo && !hasPromotionOptions) {
      dispatch({ type: 'SET_SELECTED_PACKAGE', payload: { id: 'good', label: 'Configured Quote', priceBeforeTax: 0 } });
      dispatch({ type: 'SET_WARRANTY_CONFIG', payload: { extendedYears: 0, warrantyPrice: 0, totalYears: 3 + (activePromo.warranty_extra_years || 0) } });
    }
    navigate('/quote/summary', { replace: true });
  }, [promoLoading, activePromo, hasPromotionOptions, state.motor, navigate, dispatch]);

  const handleOptionSelect = (optionId: PaymentOptionId) => {
    setSelectedOption(optionId);
    setHasJustSelected(true);
    setHasUserInteracted(true);
    triggerHaptic('light');

    dispatch({ type: 'SET_PAYMENT_METHOD', payload: optionId });

    if (optionId === 'cash_purchase' || optionId === 'standard_financing') {
      // Cash and standard financing both keep the independently layered rebate.
      setSelectedRate(null);
      dispatch({
        type: 'SET_PROMO_DETAILS',
        payload: {
          option: 'cash_rebate',
          rate: null,
          term: null,
          value: rebateAmount > 0 ? `$${rebateAmount.toLocaleString()} rebate` : null,
        },
      });
    }

    setTimeout(() => setHasJustSelected(false), 5000);
  };

  const handleRateSelect = (rate: FinancingRate) => {
    setSelectedRate(rate);
    setHasJustSelected(true);
    triggerHaptic('light');
    persistFinancingRate(rate);
    
    setTimeout(() => setHasJustSelected(false), 5000);
  };

  const handleContinue = () => {
    // Final persistence guard: continuing with a visibly selected promo rate
    // must save that exact rate even if the customer never clicks its tile.
    if (selectedOption === 'special_financing' && selectedRate) {
      persistFinancingRate(selectedRate);
    }

    const totalWarrantyYears = 3 + (activePromo?.warranty_extra_years ?? 0);
    dispatch({ type: 'SET_SELECTED_PACKAGE', payload: { id: 'good', label: 'Configured Quote', priceBeforeTax: 0 } });
    dispatch({ type: 'SET_WARRANTY_CONFIG', payload: { extendedYears: 0, warrantyPrice: 0, totalYears: totalWarrantyYears } });
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
      <QuoteLayout>
        <div className="mx-auto w-full max-w-[880px] px-6 pt-8">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 font-sans text-[12px] font-semibold uppercase tracking-[0.14em] text-repower-navy-900/65 hover:text-repower-mercury-red transition-colors min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
        <QuotePageShell className="!py-6 md:!py-8">
          <div className="text-center">
            {/* Mercury Logo */}
            <img
              src={mercuryLogo}
              alt="Mercury Marine"
              className="h-12 mx-auto mb-6 brightness-0"
            />


            {/* Main Headline */}
            <motion.h1
              initial={{ y: 16 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="text-3xl md:text-5xl font-bold text-foreground mb-4"
              style={{ opacity: 1 }}
            >
              {(activePromo.warranty_extra_years ?? 0) > 0
                ? `${3 + (activePromo.warranty_extra_years ?? 0)}-Year Factory-Backed Warranty`
                : (activePromo.bonus_title || activePromo.name || 'Current Mercury Promotion')}
            </motion.h1>

            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              {(activePromo.warranty_extra_years ?? 0) > 0
                ? `Every new Mercury outboard from Harris Boat Works during this promotion comes with ${3 + (activePromo.warranty_extra_years ?? 0)} years of factory warranty.`
                : (activePromo.bonus_description || 'Choose the bonus that works best for you.')}
            </p>


            {/* Warranty Badge - Included with Shimmer Effect, no opacity animation */}
            {(activePromo.warranty_extra_years ?? 0) > 0 && (
              <div className="relative inline-flex items-center gap-4 bg-repower-cream backdrop-blur-sm border border-repower-gold/30 rounded-xl px-6 py-4 mb-10 overflow-hidden">
                {/* Shimmer overlay */}
                <div 
                  className="absolute inset-0 -translate-x-full animate-shimmer-sweep bg-gradient-to-r from-transparent via-repower-gold/20 to-transparent pointer-events-none" 
                />
                
                {/* Floating Shield Icon */}
                <motion.div 
                  className="w-12 h-12 rounded-full bg-repower-gold/20 flex items-center justify-center"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ 
                    duration: 3, 
                    ease: 'easeInOut', 
                    repeat: Infinity 
                  }}
                >
                  <Shield className="w-6 h-6 text-repower-navy-900" />
                </motion.div>
                <div className="text-left">
                  <div className="text-foreground font-bold text-lg">
                    {3 + (activePromo.warranty_extra_years ?? 0)} Years Factory Warranty
                  </div>
                  <div className="text-muted-foreground text-sm">
                    3 years standard + {activePromo.warranty_extra_years} years FREE extension
                  </div>
                </div>
                {/* Pulsing INCLUDED Badge */}
                <motion.div 
                  className="bg-repower-mercury-red text-white text-xs font-bold px-3 py-1 rounded-full ml-2"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  ✓ INCLUDED
                </motion.div>
              </div>
            )}

            {/* Auto-applied rebate summary — rebate is layered on top of financing */}
            {rebateAmount > 0 && (
              <div className="mb-6 max-w-2xl mx-auto rounded-xl border border-repower-gold/40 bg-repower-cream/70 p-4 text-left">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 w-8 h-8 rounded-full bg-repower-mercury-red/10 flex items-center justify-center">
                    <Check className="w-4 h-4 text-repower-mercury-red" />
                  </div>
                  <div>
                    <div className="text-foreground font-semibold">
                      Factory Rebate: ${rebateAmount.toLocaleString()} auto-applied
                    </div>
                    <div className="text-muted-foreground text-sm">
                      Based on {motorHP} HP. Applied to every eligible quote, no action needed.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex-1 h-px bg-border"></div>
              <span className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Choose How You'll Pay</span>
              <div className="flex-1 h-px bg-border"></div>
            </div>


            {/* Option Cards, transform-only entrance, no opacity */}
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

                    <div className="mb-3 text-sm font-semibold text-repower-navy-900/75">
                      {option.subtitle}
                    </div>

                    {/* Highlight Badge */}
                    <span className="inline-block px-3 py-1 rounded-full text-sm font-medium mb-3 bg-repower-cream text-repower-navy-900 border border-repower-gold/30">
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
                <p className="text-muted-foreground text-sm mb-2">
                  Offer ends {endDate.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <CountdownTimer endDate={endDate} className="justify-center" />
              </div>
            )}

            {/* Continue Button, static */}
            <div>
              <Button
                size="lg"
                onClick={handleContinue}
                disabled={!selectedOption || (selectedOption === 'special_financing' && !selectedRate)}
                className={`px-8 py-6 text-lg font-semibold transition-all ${hasJustSelected ? 'animate-pulse-glow' : ''}`}
              >
                Continue to Quote
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              {!selectedOption && (
                <p className="text-muted-foreground text-sm mt-2">Select one of the options above</p>
              )}
              {selectedOption === 'special_financing' && !selectedRate && (
                <p className="text-repower-gold text-sm mt-2">Please select a rate and term above</p>
              )}
            </div>
          </div>
        </QuotePageShell>
      </QuoteLayout>
    </PageTransition>
  );
}
