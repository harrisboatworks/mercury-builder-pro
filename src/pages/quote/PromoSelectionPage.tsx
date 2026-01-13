import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, CalendarOff, Percent, Banknote, Check, ArrowRight, ArrowLeft } from 'lucide-react';
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
  subtitle: string;
  description: string;
  highlight: string;
  icon: typeof CalendarOff;
}

export default function PromoSelectionPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useQuote();
  const { promotions, getRebateForHP, getSpecialFinancingRates } = useActivePromotions();
  
  const [selectedOption, setSelectedOption] = useState<PromoOptionId>(
    state.selectedPromoOption || 'cash_rebate'
  );

  const activePromo = promotions.length > 0 ? promotions[0] : null;
  const endDate = activePromo?.end_date ? new Date(activePromo.end_date) : null;
  
  // Get dynamic values based on motor HP
  const motorHP = state.motor?.hp || 150;
  const rebateAmount = getRebateForHP(motorHP) || 250;
  const financingRates = getSpecialFinancingRates();
  const lowestRate = financingRates?.[0]?.rate || 2.99;

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
    dispatch({ type: 'SET_PROMO_OPTION', payload: selectedOption });
    navigate('/quote/summary');
  };

  const handleBack = () => {
    navigate(-1);
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

            {/* Warranty Badge - Included */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="inline-flex items-center gap-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 mb-10"
            >
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-400" />
              </div>
              <div className="text-left">
                <div className="text-white font-bold text-lg">7 Years Factory Warranty</div>
                <div className="text-stone-400 text-sm">3 years standard + 4 years FREE extension</div>
              </div>
              <div className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full ml-2">
                ✓ INCLUDED
              </div>
            </motion.div>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex-1 h-px bg-white/20"></div>
              <span className="text-white/60 text-sm font-medium uppercase tracking-wider">Choose Your Bonus</span>
              <div className="flex-1 h-px bg-white/20"></div>
            </div>

            {/* Option Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-10">
              {options.map((option, index) => {
                const Icon = option.icon;
                const isSelected = selectedOption === option.id;

                return (
                  <motion.button
                    key={option.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    onClick={() => setSelectedOption(option.id)}
                    className={cn(
                      'relative bg-white rounded-xl border-2 p-6 text-left transition-all duration-200',
                      'hover:shadow-xl hover:scale-[1.02]',
                      isSelected
                        ? 'border-primary shadow-xl ring-2 ring-primary/30'
                        : 'border-transparent hover:border-primary/50'
                    )}
                  >
                    {/* Selected Checkmark */}
                    {isSelected && (
                      <div className="absolute -top-3 -right-3 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    )}

                    {/* Icon */}
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="w-7 h-7 text-primary" />
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-semibold text-foreground mb-1">{option.title}</h3>

                    {/* Highlight Badge */}
                    <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium mb-3">
                      {option.highlight}
                    </span>

                    {/* Description */}
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {option.description}
                    </p>
                  </motion.button>
                );
              })}
            </div>

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
                className="px-8 py-6 text-lg font-semibold"
              >
                Continue to Summary
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
