import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Calendar, Percent, DollarSign, Check, ArrowRight, ArrowLeft, Lock, Sparkles, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CountdownTimer } from '@/components/ui/countdown-timer';
import { useQuote } from '@/contexts/QuoteContext';
import { useActivePromotions } from '@/hooks/useActivePromotions';
import { cn } from '@/lib/utils';
import mercuryLogo from '@/assets/mercury-logo.png';
import { PageTransition } from '@/components/ui/page-transition';

type PromoOptionId = 'no_payments' | 'special_financing' | 'cash_rebate';

interface PromoOption {
  id: PromoOptionId;
  title: string;
  tag: string;
  tagColor: string;
  description: string;
  guidance: string;
  icon: typeof Calendar;
}

export default function PromoSelectionPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useQuote();
  const { promotions, getRebateForHP, getSpecialFinancingRates } = useActivePromotions();
  
  const [selectedOption, setSelectedOption] = useState<PromoOptionId | null>(
    state.selectedPromoOption || null
  );

  const activePromo = promotions.length > 0 ? promotions[0] : null;
  const endDate = activePromo?.end_date ? new Date(activePromo.end_date) : new Date('2026-03-31');
  
  // Get dynamic values based on motor HP
  const motorHP = state.motor?.hp || 150;
  const rebateAmount = getRebateForHP(motorHP) || 250;
  const financingRates = getSpecialFinancingRates();
  const lowestRate = financingRates?.[0]?.rate || 2.99;

  const options: PromoOption[] = [
    {
      id: 'no_payments',
      title: '6 Months No Payments',
      tag: '6 Mo. Deferral',
      tagColor: 'bg-blue-100 text-blue-800',
      description: 'Take delivery today and make no payments for 6 full months. Get on the water immediately.',
      guidance: 'Best if you want to get on the water now',
      icon: Calendar,
    },
    {
      id: 'special_financing',
      title: 'Special Financing',
      tag: `${lowestRate}% APR`,
      tagColor: 'bg-purple-100 text-purple-800',
      description: `Lock in rates as low as ${lowestRate}% APR. Save significantly over the life of your loan.`,
      guidance: 'Best for long-term financing savings',
      icon: Percent,
    },
    {
      id: 'cash_rebate',
      title: 'Factory Rebate',
      tag: `$${rebateAmount.toLocaleString()} Back`,
      tagColor: 'bg-green-100 text-green-800',
      description: `Get $${rebateAmount.toLocaleString()} cash back applied directly to your purchase. Instant savings.`,
      guidance: 'Best for immediate price reduction',
      icon: DollarSign,
    },
  ];

  useEffect(() => {
    document.title = 'Choose Your Bonus | Mercury Get 7 Promotion';
  }, []);

  // Redirect if no motor selected
  useEffect(() => {
    if (!state.motor) {
      navigate('/quote/motor');
    }
  }, [state.motor, navigate]);

  const handleContinue = () => {
    if (selectedOption) {
      dispatch({ type: 'SET_PROMO_OPTION', payload: selectedOption });
      navigate('/quote/summary');
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 relative overflow-hidden">
        {/* Subtle radial glow at top */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.06),transparent_50%)]" />
        
        {/* Subtle wave pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M21.184 20c.357-.13.72-.264 1.088-.402l1.768-.661C33.64 15.347 39.647 14 50 14c10.271 0 15.362 1.222 24.629 4.928.955.383 1.869.74 2.75 1.072h6.225c-2.51-.73-5.139-1.691-8.233-2.928C65.888 13.278 60.562 12 50 12c-10.626 0-16.855 1.397-26.66 5.063l-1.767.662c-2.475.923-4.66 1.674-6.724 2.275h6.335zm0-20C13.258 2.892 8.077 4 0 4v2c5.744 0 9.951-.574 14.85-2.36l1.768-.661C26.34 0.347 32.647-1 43-1c10.271 0 15.362 1.222 24.629 4.928C72.18 5.608 76.136 6.966 81 8.048V6c-4.1-.858-7.47-2.057-11.621-3.072C59.888-1.722 54.562-3 44-3c-10.626 0-16.855 1.397-26.66 5.063l-1.767.662c-2.475.923-4.66 1.674-6.724 2.275H21.184z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
            backgroundSize: '100px 20px'
          }}
        />

        {/* Header */}
        <div className="relative z-10 container mx-auto px-4 py-4 md:py-6">
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
        <div className="relative z-10 container mx-auto px-4 pb-12">
          <div className="max-w-4xl mx-auto text-center">
            {/* Mercury Logo */}
            <motion.img
              src={mercuryLogo}
              alt="Mercury Marine"
              className="h-10 md:h-12 mx-auto mb-4 md:mb-6 brightness-0 invert"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            />

            {/* Limited Time Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 bg-red-500/20 text-red-300 border border-red-500/30 px-4 py-1.5 rounded-full text-sm font-medium mb-4"
            >
              <Clock className="w-4 h-4" />
              Limited Time: January 12 – March 31, 2026
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl md:text-4xl font-bold text-white mb-2"
            >
              Get 7 Years of Coverage
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-xl md:text-2xl text-primary font-semibold mb-4"
            >
              + Choose One Bonus!
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-stone-400 text-sm md:text-base mb-6 max-w-xl mx-auto"
            >
              Every qualifying Mercury outboard comes with 7 years of factory warranty
              PLUS your choice of one additional benefit.
            </motion.p>

            {/* Warranty Banner - Distinctly Different */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="relative overflow-hidden bg-gradient-to-r from-emerald-900/40 via-emerald-800/30 to-emerald-900/40 border border-emerald-500/30 rounded-2xl p-4 md:p-5 mb-6 md:mb-8"
            >
              {/* Subtle pattern watermark */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' fill='%2310b981' fill-opacity='1'/%3E%3C/svg%3E")`,
                  backgroundSize: '20px 20px'
                }} />
              </div>
              
              <div className="relative flex flex-col sm:flex-row items-center justify-between gap-3 md:gap-4">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-11 h-11 md:w-14 md:h-14 rounded-full bg-emerald-500/20 flex items-center justify-center ring-2 ring-emerald-400/30 flex-shrink-0">
                    <Shield className="w-5 h-5 md:w-7 md:h-7 text-emerald-400" />
                  </div>
                  <div className="text-center sm:text-left">
                    <div className="text-white font-bold text-base md:text-xl">7 Years Factory Warranty</div>
                    <div className="text-emerald-200/70 text-xs md:text-sm">3 years standard + 4 years FREE extension</div>
                  </div>
                </div>
                <div className="bg-emerald-500 text-white text-xs md:text-sm font-bold px-3 md:px-4 py-1.5 md:py-2 rounded-full flex items-center gap-1.5 shadow-lg shadow-emerald-500/30 flex-shrink-0">
                  <Lock className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  INCLUDED
                </div>
              </div>
            </motion.div>

            {/* Section Divider */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-3 md:gap-4 mb-5 md:mb-6"
            >
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              <div className="flex flex-col items-center">
                <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-primary mb-0.5 md:mb-1" />
                <span className="text-white text-xs md:text-sm font-bold uppercase tracking-[0.1em] md:tracking-[0.15em]">
                  Choose Your Bonus
                </span>
                <span className="text-stone-400 text-[10px] md:text-xs mt-0.5">Select 1 of 3</span>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            </motion.div>

            {/* Option Cards */}
            <div className="grid md:grid-cols-3 gap-3 md:gap-5 mb-6 md:mb-8">
              {options.map((option, index) => {
                const Icon = option.icon;
                const isSelected = selectedOption === option.id;

                return (
                  <motion.button
                    key={option.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 + index * 0.08 }}
                    onClick={() => setSelectedOption(option.id)}
                    className="relative w-full text-left focus:outline-none group"
                  >
                    {/* Glow effect for selected card */}
                    {isSelected && (
                      <div className="absolute -inset-1.5 md:-inset-2 bg-primary/20 rounded-2xl blur-xl transition-all" />
                    )}
                    
                    <div className={cn(
                      'relative bg-white rounded-xl md:rounded-2xl border-2 p-4 md:p-5 transition-all duration-200 h-full',
                      isSelected
                        ? 'border-primary shadow-2xl shadow-primary/20 ring-2 ring-primary/30 scale-[1.02]'
                        : 'border-stone-200 hover:border-primary/50 hover:shadow-xl'
                    )}>
                      {/* Selection indicator - ALWAYS visible */}
                      <div className={cn(
                        'absolute top-3 right-3 md:top-4 md:right-4 w-6 h-6 md:w-7 md:h-7 rounded-full border-2 flex items-center justify-center transition-all',
                        isSelected 
                          ? 'bg-primary border-primary' 
                          : 'border-stone-300 bg-white group-hover:border-primary/50'
                      )}>
                        {isSelected && <Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />}
                      </div>

                      {/* Icon */}
                      <div className={cn(
                        'w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center mb-3 md:mb-4 transition-colors',
                        isSelected ? 'bg-primary/15' : 'bg-primary/10 group-hover:bg-primary/15'
                      )}>
                        <Icon className="w-6 h-6 md:w-7 md:h-7 text-primary" />
                      </div>

                      {/* Title */}
                      <h3 className="text-base md:text-lg font-bold text-stone-900 mb-2 pr-8">{option.title}</h3>

                      {/* Tag Badge */}
                      <span className={cn(
                        'inline-flex items-center px-2.5 md:px-3 py-0.5 md:py-1 rounded-full text-xs md:text-sm font-semibold shadow-sm',
                        option.tagColor
                      )}>
                        {option.tag}
                      </span>

                      {/* Description */}
                      <p className="text-stone-600 text-xs md:text-sm mt-2 md:mt-3 leading-relaxed">
                        {option.description}
                      </p>
                      
                      {/* Guidance text */}
                      <p className="text-[10px] md:text-xs text-stone-400 italic mt-2 md:mt-3 pt-2 md:pt-3 border-t border-stone-100">
                        {option.guidance}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Countdown Timer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex justify-center mb-6 md:mb-8"
            >
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 md:px-6 py-2.5 md:py-3">
                <div className="text-stone-400 text-[10px] md:text-xs uppercase tracking-wider text-center mb-1.5 md:mb-2">
                  Offer ends March 31, 2026
                </div>
                <CountdownTimer 
                  endDate={endDate} 
                  compact
                  className="justify-center"
                />
              </div>
            </motion.div>

            {/* Continue Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75 }}
              className="flex flex-col items-center"
            >
              <Button
                size="lg"
                onClick={handleContinue}
                disabled={!selectedOption}
                className="w-full md:w-auto min-w-[280px] bg-primary hover:bg-primary/90 text-white font-semibold py-5 md:py-6 text-base md:text-lg shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Summary
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              {!selectedOption && (
                <p className="text-stone-500 text-xs md:text-sm text-center mt-3">
                  Please select a bonus option to continue
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
