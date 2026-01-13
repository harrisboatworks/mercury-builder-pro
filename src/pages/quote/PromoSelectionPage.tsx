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
      tagColor: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30',
      description: 'Take delivery today and make no payments for 6 full months. Get on the water immediately.',
      guidance: 'Best if you want to get on the water now',
      icon: Calendar,
    },
    {
      id: 'special_financing',
      title: 'Special Financing',
      tag: `${lowestRate}% APR`,
      tagColor: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30',
      description: `Lock in rates as low as ${lowestRate}% APR. Save significantly over the life of your loan.`,
      guidance: 'Best for long-term financing savings',
      icon: Percent,
    },
    {
      id: 'cash_rebate',
      title: 'Factory Rebate',
      tag: `$${rebateAmount.toLocaleString()} Back`,
      tagColor: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30',
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
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950/80 to-slate-950 relative overflow-hidden">
        {/* Bold radial glow at top - ocean blue */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.15),transparent_60%)]" />
        
        {/* Secondary teal accent glow at bottom right */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(20,184,166,0.1),transparent_50%)]" />
        
        {/* More visible wave pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.04]"
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
              className="h-10 md:h-12 mx-auto mb-4 md:mb-6 brightness-0 invert drop-shadow-lg"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            />

            {/* Limited Time Badge with glow */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500/30 to-orange-500/20 text-red-200 border border-red-400/40 px-4 py-1.5 rounded-full text-sm font-medium mb-4 shadow-lg shadow-red-500/20"
            >
              <Clock className="w-4 h-4 animate-pulse" />
              Limited Time: January 12 – March 31, 2026
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg"
            >
              Get 7 Years of Coverage
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-xl md:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-teal-400 font-semibold mb-4"
            >
              + Choose One Bonus!
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-slate-300 text-sm md:text-base mb-6 max-w-xl mx-auto"
            >
              Every qualifying Mercury outboard comes with 7 years of factory warranty
              PLUS your choice of one additional benefit.
            </motion.p>

            {/* Warranty Banner - Bold Full-Width Treatment */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="relative overflow-hidden mb-6 md:mb-8"
            >
              {/* Full-width banner with bold gradient */}
              <div className="bg-gradient-to-r from-emerald-600/40 via-emerald-500/50 to-emerald-600/40 border-y border-emerald-400/50 py-5 md:py-6 -mx-4 px-4 md:rounded-2xl md:mx-0 md:border">
                {/* Animated shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent animate-shimmer" 
                  style={{ backgroundSize: '200% 100%' }} 
                />
                
                <div className="relative flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6">
                  {/* Larger, glowing shield icon */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-400/40 rounded-full blur-xl animate-pulse" />
                    <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-500/50 ring-4 ring-emerald-400/30">
                      <Shield className="w-8 h-8 md:w-10 md:h-10 text-white drop-shadow-lg" />
                    </div>
                  </div>
                  
                  <div className="text-center sm:text-left">
                    <div className="text-white font-bold text-xl md:text-2xl drop-shadow-lg">7 Years Factory Warranty</div>
                    <div className="text-emerald-100 text-sm md:text-base">3 years standard + 4 years FREE extension</div>
                  </div>
                  
                  {/* Bold "LOCKED IN" badge */}
                  <div className="flex items-center gap-2 bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-full shadow-2xl shadow-emerald-500/50 ring-2 ring-emerald-400/50">
                    <Lock className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="text-sm md:text-base">LOCKED IN</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Section Divider - Enhanced */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="relative py-4 md:py-6 mb-4"
            >
              {/* Decorative lines with gradient */}
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/15" />
              </div>
              
              <div className="relative flex justify-center">
                <div className="bg-gradient-to-r from-slate-900 via-primary/30 to-slate-900 px-6 md:px-8 py-2.5 md:py-3 rounded-full border border-primary/40 shadow-lg shadow-primary/20">
                  <div className="flex items-center gap-2 md:gap-3">
                    <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-primary animate-pulse" />
                    <div className="text-center">
                      <span className="text-white text-sm md:text-base font-bold uppercase tracking-wider">
                        Choose Your Bonus
                      </span>
                      <span className="text-primary text-xs font-medium block">Pick 1 of 3</span>
                    </div>
                    <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-primary animate-pulse" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Option Cards - With Real Depth */}
            <div className="grid md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
              {options.map((option, index) => {
                const Icon = option.icon;
                const isSelected = selectedOption === option.id;

                return (
                  <motion.button
                    key={option.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 + index * 0.08 }}
                    whileHover={{ scale: 1.03, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedOption(option.id)}
                    className="relative w-full text-left focus:outline-none group"
                  >
                    {/* Enhanced glow for selected card */}
                    {isSelected && (
                      <div className="absolute -inset-3 bg-primary/30 rounded-3xl blur-2xl animate-pulse" />
                    )}
                    
                    <div className={cn(
                      'relative bg-white rounded-2xl p-5 md:p-6 transition-all duration-300 h-full',
                      isSelected
                        ? 'border-2 border-primary shadow-2xl shadow-primary/40 ring-4 ring-primary/20'
                        : 'border border-stone-200 shadow-xl shadow-black/20 hover:shadow-2xl hover:shadow-black/30 hover:border-primary/40'
                    )}>
                      {/* Selection indicator - ALWAYS visible, more prominent */}
                      <div className={cn(
                        'absolute top-4 right-4 w-7 h-7 md:w-8 md:h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200',
                        isSelected 
                          ? 'bg-primary border-primary shadow-lg shadow-primary/50' 
                          : 'border-stone-300 bg-white group-hover:border-primary/60 group-hover:bg-primary/5'
                      )}>
                        {isSelected && <Check className="w-4 h-4 md:w-5 md:h-5 text-white" />}
                      </div>

                      {/* Larger Icon with gradient background */}
                      <div className={cn(
                        'w-16 h-16 md:w-18 md:h-18 rounded-2xl flex items-center justify-center mb-4 transition-all duration-200',
                        isSelected 
                          ? 'bg-gradient-to-br from-primary/25 to-primary/15 shadow-lg shadow-primary/20' 
                          : 'bg-gradient-to-br from-stone-100 to-stone-50 group-hover:from-primary/20 group-hover:to-primary/10'
                      )}>
                        <Icon className={cn(
                          'w-8 h-8 md:w-9 md:h-9 transition-colors',
                          isSelected ? 'text-primary' : 'text-primary/80 group-hover:text-primary'
                        )} />
                      </div>

                      {/* Title */}
                      <h3 className="text-lg md:text-xl font-bold text-stone-900 mb-3 pr-10">{option.title}</h3>

                      {/* Bolder Tag Badge with gradient */}
                      <span className={cn(
                        'inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold',
                        option.tagColor
                      )}>
                        {option.tag}
                      </span>

                      {/* Description */}
                      <p className="text-stone-600 text-sm mt-3 md:mt-4 leading-relaxed">
                        {option.description}
                      </p>
                      
                      {/* Guidance text with icon */}
                      <p className="text-xs text-stone-400 italic mt-3 pt-3 border-t border-stone-100 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-primary/60" />
                        {option.guidance}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Countdown Timer - Urgent Style with Boxed Display */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex justify-center mb-6 md:mb-8"
            >
              <div className="relative">
                {/* Subtle pulsing glow behind timer */}
                <div className="absolute inset-0 bg-orange-500/20 rounded-2xl blur-xl animate-pulse" />
                
                <div className="relative bg-gradient-to-r from-orange-950/60 via-red-950/60 to-orange-950/60 backdrop-blur-sm border border-orange-500/40 rounded-2xl px-5 md:px-8 py-4 md:py-5 shadow-2xl shadow-orange-500/20">
                  <div className="text-orange-200 text-xs uppercase tracking-wider text-center mb-3 flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4 animate-pulse" />
                    Limited Time Offer
                  </div>
                  <CountdownTimer 
                    endDate={endDate} 
                    variant="dark"
                    className="justify-center"
                  />
                </div>
              </div>
            </motion.div>

            {/* Continue Button - More Prominent */}
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
                className="w-full md:w-auto min-w-[300px] bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white font-bold py-6 md:py-7 text-lg shadow-2xl shadow-primary/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200"
              >
                Continue to Summary
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              {!selectedOption && (
                <p className="text-slate-400 text-sm text-center mt-3">
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
