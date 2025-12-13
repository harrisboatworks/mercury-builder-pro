import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronUp, MessageCircle, Phone, Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuote } from '@/contexts/QuoteContext';
import { useAIChat } from '@/components/chat/GlobalAIChat';
import { useIsMobile } from '@/hooks/use-mobile';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useActiveFinancingPromo } from '@/hooks/useActiveFinancingPromo';
import { calculateMonthlyPayment, DEALERPLAN_FEE } from '@/lib/finance';
import { money } from '@/lib/money';
import { MobileQuoteDrawer } from './MobileQuoteDrawer';
import { ContactModal } from '@/components/ui/contact-button';

// Page-specific configuration for button labels and AI messages
interface PageConfig {
  primaryLabel: string | ((state: any, hasMotor: boolean) => string);
  nextPath: string;
  aiMessage: string;
  idleNudge?: string;
}

const PAGE_CONFIG: Record<string, PageConfig> = {
  '/quote/motor-selection': {
    primaryLabel: 'Configure',
    nextPath: '/quote/options',
    aiMessage: 'Help me find the right motor for my boat',
    idleNudge: 'Not sure which motor? Tap AI →'
  },
  '/quote/options': {
    primaryLabel: (state) => state.selectedPackage ? 'Continue' : 'Skip Options',
    nextPath: '/quote/purchase-path',
    aiMessage: 'Need help choosing options or accessories?',
    idleNudge: 'Packages include warranty & accessories'
  },
  '/quote/purchase-path': {
    primaryLabel: 'Boat Info',
    nextPath: '/quote/boat-info',
    aiMessage: 'Need help choosing between installation options?',
    idleNudge: 'Most customers choose professional install'
  },
  '/quote/boat-info': {
    primaryLabel: 'Continue',
    nextPath: '/quote/trade-in',
    aiMessage: 'Questions about boat compatibility or controls?'
  },
  '/quote/trade-in': {
    primaryLabel: (state) => state.tradeInInfo?.estimatedValue ? 'Apply Trade-In' : 'Skip Trade-In',
    nextPath: '/quote/installation',
    aiMessage: 'Curious about trade-in values or the process?',
    idleNudge: 'Have a motor to trade? Get instant value'
  },
  '/quote/installation': {
    primaryLabel: 'Continue',
    nextPath: '/quote/fuel-tank',
    aiMessage: 'Questions about installation or rigging?'
  },
  '/quote/fuel-tank': {
    primaryLabel: 'View Summary',
    nextPath: '/quote/summary',
    aiMessage: 'Need help choosing a fuel tank size?'
  },
  '/quote/schedule': {
    primaryLabel: 'Submit Quote',
    nextPath: '/quote/summary',
    aiMessage: 'Questions about scheduling or what happens next?'
  }
};

// Pages where the unified bar should NOT show
const HIDE_ON_PAGES = [
  '/quote/summary',
  '/quote/success',
  '/login',
  '/auth',
  '/dashboard',
  '/settings',
  '/admin',
  '/test',
  '/staging',
  '/my-quotes',
  '/deposits',
  '/contact',
];

// Pages where the unified bar SHOULD show (customer journey paths)
const SHOW_ON_PAGES = ['/', '/motors', '/quote', '/promotions', '/financing', '/accessories'];

// Spring animation config for snappy micro-interactions
const springConfig = { type: 'spring', stiffness: 400, damping: 17 };

// Breathing animation for AI button
const breathingAnimation = {
  boxShadow: [
    '0 0 0 0 rgba(59, 130, 246, 0)',
    '0 0 0 6px rgba(59, 130, 246, 0.15)',
    '0 0 0 0 rgba(59, 130, 246, 0)'
  ]
};

export const UnifiedMobileBar: React.FC = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useQuote();
  const { openChat } = useAIChat();
  const { triggerHaptic } = useHapticFeedback();
  const { promo } = useActiveFinancingPromo();
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [idleSeconds, setIdleSeconds] = useState(0);
  const [showSavingsCelebration, setShowSavingsCelebration] = useState(false);
  const [savingsAmount, setSavingsAmount] = useState(0);
  const prevSavingsRef = useRef(0);
  const prevTotalRef = useRef(0);

  // Idle detection - reset on any touch
  useEffect(() => {
    const timer = setInterval(() => setIdleSeconds(s => s + 1), 1000);
    const resetIdle = () => setIdleSeconds(0);
    
    window.addEventListener('touchstart', resetIdle, { passive: true });
    window.addEventListener('scroll', resetIdle, { passive: true });
    
    return () => {
      clearInterval(timer);
      window.removeEventListener('touchstart', resetIdle);
      window.removeEventListener('scroll', resetIdle);
    };
  }, []);

  // Reset idle on page change
  useEffect(() => {
    setIdleSeconds(0);
  }, [location.pathname]);

  // Check if we should show the bar
  const shouldShow = useMemo(() => {
    if (!isMobile) return false;
    if (HIDE_ON_PAGES.some(path => location.pathname.startsWith(path))) return false;
    return SHOW_ON_PAGES.some(path => 
      location.pathname === path || location.pathname.startsWith(path + '/')
    );
  }, [isMobile, location.pathname]);

  const hasMotor = !!state.motor;

  // Calculate running total
  const runningTotal = useMemo(() => {
    const motorPrice = state.motor?.price || state.motor?.basePrice || state.motor?.msrp || 0;
    if (!motorPrice) return 0;

    let total = motorPrice;

    if (state.boatInfo?.controlsOption) {
      if (state.boatInfo.controlsOption === 'none') total += 1200;
      else if (state.boatInfo.controlsOption === 'adapter') total += 125;
    }

    const isTiller = state.motor?.model?.includes('TLR') || state.motor?.model?.includes('MH');
    if (state.purchasePath === 'installed' && !isTiller) {
      total += 450;
    }

    if (state.installConfig?.installationCost) {
      total += state.installConfig.installationCost;
    }

    if (state.fuelTankConfig?.tankCost) {
      total += state.fuelTankConfig.tankCost;
    }

    if (state.warrantyConfig?.warrantyPrice) {
      total += state.warrantyConfig.warrantyPrice;
    }

    if (state.tradeInInfo?.estimatedValue) {
      total -= state.tradeInInfo.estimatedValue;
    }

    return total;
  }, [
    state.motor?.price, state.motor?.basePrice, state.motor?.msrp, state.motor?.model,
    state.boatInfo?.controlsOption, state.purchasePath,
    state.installConfig?.installationCost, state.fuelTankConfig?.tankCost,
    state.warrantyConfig?.warrantyPrice, state.tradeInInfo?.estimatedValue
  ]);

  // Calculate current savings (trade-in + promos)
  const currentSavings = useMemo(() => {
    let savings = 0;
    if (state.tradeInInfo?.estimatedValue) {
      savings += state.tradeInInfo.estimatedValue;
    }
    // Could add promo savings here too
    return savings;
  }, [state.tradeInInfo?.estimatedValue]);

  // Savings celebration effect
  useEffect(() => {
    if (currentSavings > prevSavingsRef.current && prevSavingsRef.current > 0) {
      const newSavings = currentSavings - prevSavingsRef.current;
      setSavingsAmount(newSavings);
      setShowSavingsCelebration(true);
      triggerHaptic('medium');
      
      const timer = setTimeout(() => setShowSavingsCelebration(false), 3000);
      return () => clearTimeout(timer);
    }
    prevSavingsRef.current = currentSavings;
  }, [currentSavings, triggerHaptic]);

  // Calculate monthly payment
  const monthlyPayment = useMemo(() => {
    if (!runningTotal) return 0;
    const priceWithHST = runningTotal * 1.13;
    const priceWithFee = priceWithHST + DEALERPLAN_FEE;
    const promoRate = promo?.rate || null;
    const { payment } = calculateMonthlyPayment(priceWithFee, promoRate);
    return payment;
  }, [runningTotal, promo]);

  // Calculate progress through quote journey
  const quoteProgress = useMemo(() => {
    let completed = 0;
    const total = 6;
    
    if (state.motor) completed++;
    if (state.purchasePath) completed++;
    if (state.boatInfo?.type) completed++;
    if (state.tradeInInfo !== undefined) completed++;
    if (state.installConfig) completed++;
    if (state.fuelTankConfig) completed++;
    
    return { completed, total, remaining: total - completed };
  }, [state.motor, state.purchasePath, state.boatInfo, state.tradeInInfo, state.installConfig, state.fuelTankConfig]);

  // Get page config with dynamic label resolution
  const pageConfig = PAGE_CONFIG[location.pathname] || {
    primaryLabel: 'Continue',
    nextPath: '/quote/summary',
    aiMessage: 'Questions about your motor configuration?'
  };

  const getPrimaryLabel = (): string => {
    if (typeof pageConfig.primaryLabel === 'function') {
      return pageConfig.primaryLabel(state, hasMotor);
    }
    return pageConfig.primaryLabel;
  };

  // Proactive nudge message based on idle time and context
  const nudgeMessage = useMemo(() => {
    if (idleSeconds < 15) return null;
    
    // Page-specific idle nudges
    if (pageConfig.idleNudge && idleSeconds >= 20) {
      return pageConfig.idleNudge;
    }
    
    // Generic nudges
    if (!hasMotor && location.pathname === '/quote/motor-selection' && idleSeconds >= 25) {
      return 'Tap AI for personalized recommendations →';
    }
    
    if (hasMotor && idleSeconds >= 30 && quoteProgress.remaining <= 2) {
      return `Almost there! ${quoteProgress.remaining} step${quoteProgress.remaining > 1 ? 's' : ''} left`;
    }
    
    if (hasMotor && idleSeconds >= 35) {
      return 'Ready to continue? →';
    }
    
    return null;
  }, [idleSeconds, hasMotor, location.pathname, pageConfig.idleNudge, quoteProgress.remaining]);

  const handlePrimary = () => {
    triggerHaptic('light');
    navigate(pageConfig.nextPath);
  };

  const handleOpenAI = () => {
    triggerHaptic('medium');
    setIdleSeconds(0);
    const motorContext = state.motor?.hp 
      ? `I'm configuring a ${state.motor.hp}HP ${state.motor.model}. ${pageConfig.aiMessage}`
      : pageConfig.aiMessage;
    openChat(motorContext);
  };

  const handleOpenContact = () => {
    triggerHaptic('medium');
    setIsContactOpen(true);
  };

  const handleOpenDrawer = () => {
    if (hasMotor) {
      triggerHaptic('light');
      setIsDrawerOpen(true);
    }
  };

  if (!shouldShow) return null;

  // Extract HP and motor family for compact display
  const getMotorFamily = (model: string | undefined): string => {
    if (!model) return '';
    const lowerModel = model.toLowerCase();
    if (lowerModel.includes('verado')) return 'Verado';
    if (lowerModel.includes('pro xs')) return 'Pro XS';
    if (lowerModel.includes('seapro')) return 'SeaPro';
    if (lowerModel.includes('fourstroke')) return 'FourStroke';
    return '';
  };
  
  const motorHP = state.motor?.hp;
  const motorFamily = getMotorFamily(state.motor?.model);
  const compactMotorName = motorHP ? `${motorHP} HP ${motorFamily}`.trim() : '';
  
  const displayTotal = runningTotal || state.motor?.price || state.motor?.basePrice || state.motor?.msrp || 0;

  // Get contextual empty state message based on current page
  const getEmptyStateMessage = () => {
    if (location.pathname === '/') return 'Browse Mercury Motors';
    if (location.pathname.startsWith('/promotions')) return 'View Current Promos';
    if (location.pathname.startsWith('/financing')) return 'Explore Financing';
    return 'Select a motor to begin';
  };

  return (
    <>
      {/* Savings Celebration Toast */}
      <AnimatePresence>
        {showSavingsCelebration && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[65]
              bg-emerald-500 text-white px-4 py-2 rounded-full
              shadow-lg shadow-emerald-500/30
              text-sm font-semibold"
          >
            🎉 You're saving {money(savingsAmount)}!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unified Mobile Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[60] 
          bg-white border-t border-gray-200
          shadow-[0_-2px_20px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Proactive Nudge Banner */}
        <AnimatePresence>
          {nudgeMessage && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 py-1.5 bg-gradient-to-r from-primary/5 to-primary/10 
                border-b border-primary/10 text-center">
                <span className="text-xs font-medium text-primary/80">
                  {nudgeMessage}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-row items-center h-16 px-3 gap-2 keep-flex">
          {/* AI Button - Breathing animation */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            animate={breathingAnimation}
            transition={{
              ...springConfig,
              boxShadow: {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
            onClick={handleOpenAI}
            className="flex flex-col items-center justify-center h-11 w-11 shrink-0 
              rounded-xl bg-gradient-to-br from-primary/15 to-primary/5
              border border-primary/20"
            aria-label="Ask AI assistant"
          >
            <MessageCircle className="h-4.5 w-4.5 text-primary" />
            <span className="text-[9px] font-semibold text-primary/80 mt-0.5">AI</span>
          </motion.button>

          {/* Center: Motor Info Card (tappable) or Prompt */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            transition={springConfig}
            onClick={handleOpenDrawer}
            disabled={!hasMotor}
            className="flex-1 min-w-0 flex flex-col items-center justify-center py-1.5 px-3 
              rounded-xl bg-gray-50/80 border border-gray-200/60
              disabled:opacity-50"
          >
            {hasMotor ? (
              <>
                {/* Drag Handle with breathing pulse */}
                <motion.div 
                  animate={{ 
                    opacity: [0.4, 0.7, 0.4],
                    width: ['32px', '40px', '32px']
                  }}
                  transition={{ 
                    duration: 2.5, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className="h-1 rounded-full bg-gray-300 mb-0.5" 
                />
                {/* Line 1: HP + Motor Family */}
                <span className="text-sm font-semibold text-gray-900">
                  {compactMotorName || 'Motor Selected'}
                </span>
                {/* Line 2: Animated Price + Monthly */}
                <div className="flex items-center gap-1.5 text-xs">
                  <motion.span 
                    key={displayTotal}
                    initial={{ scale: 1.15, color: '#22c55e' }}
                    animate={{ scale: 1, color: '#111827' }}
                    transition={{ duration: 0.4 }}
                    className="font-semibold"
                  >
                    {money(displayTotal)}
                  </motion.span>
                  {monthlyPayment > 0 && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span className="text-gray-500">≈{money(monthlyPayment)}/mo</span>
                    </>
                  )}
                  <ChevronUp className={`h-3 w-3 text-gray-400 transition-transform duration-200 ${isDrawerOpen ? 'rotate-180' : ''}`} />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-sm text-gray-600 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  {getEmptyStateMessage()}
                </span>
                <span className="text-[10px] text-gray-400 mt-0.5">Tap to explore</span>
              </div>
            )}
          </motion.button>

          {/* Contact Button */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            transition={springConfig}
            onClick={handleOpenContact}
            className="flex flex-col items-center justify-center h-11 w-11 shrink-0 
              rounded-xl hover:bg-gray-100/80"
            aria-label="Contact us"
          >
            <Phone className="h-4.5 w-4.5 text-gray-500" />
            <span className="text-[9px] font-medium text-gray-500 mt-0.5">Contact</span>
          </motion.button>

          {/* Primary CTA - Smart contextual label */}
          {(hasMotor || location.pathname !== '/quote/motor-selection') && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              transition={springConfig}
              onClick={handlePrimary}
              disabled={!hasMotor}
              className="shrink-0 h-11 px-4 rounded-xl text-sm font-semibold
                bg-gray-900 text-white 
                shadow-lg shadow-gray-900/20
                disabled:opacity-40 disabled:bg-gray-400 disabled:shadow-none
                flex items-center gap-1.5"
            >
              {getPrimaryLabel()}
              <ArrowRight className="h-3.5 w-3.5" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Spacer */}
      <div className="h-16" style={{ marginBottom: 'env(safe-area-inset-bottom)' }} />

      {/* Expandable Drawer */}
      <MobileQuoteDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      {/* Contact Modal */}
      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </>
  );
};
