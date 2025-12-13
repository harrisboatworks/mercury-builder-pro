import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronUp, MessageCircle, Phone, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuote } from '@/contexts/QuoteContext';
import { useAIChat } from '@/components/chat/GlobalAIChat';
import { useIsMobile } from '@/hooks/use-mobile';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useActiveFinancingPromo } from '@/hooks/useActiveFinancingPromo';
import { calculateMonthlyPayment, DEALERPLAN_FEE } from '@/lib/finance';
import { money } from '@/lib/money';
import { formatMotorDisplayName } from '@/lib/motor-display-formatter';
import { MobileQuoteDrawer } from './MobileQuoteDrawer';
import { ContactModal } from '@/components/ui/contact-button';

// Page-specific configuration for button labels and AI messages
const PAGE_CONFIG: Record<string, { 
  primaryLabel: string; 
  nextPath: string; 
  aiMessage: string;
}> = {
  '/quote/motor-selection': {
    primaryLabel: 'Configure',
    nextPath: '/quote/options',
    aiMessage: 'Help me find the right motor for my boat'
  },
  '/quote/options': {
    primaryLabel: 'Purchase Path',
    nextPath: '/quote/purchase-path',
    aiMessage: 'Need help choosing options or accessories?'
  },
  '/quote/purchase-path': {
    primaryLabel: 'Boat Info',
    nextPath: '/quote/boat-info',
    aiMessage: 'Need help choosing between installation options?'
  },
  '/quote/boat-info': {
    primaryLabel: 'Continue',
    nextPath: '/quote/trade-in',
    aiMessage: 'Questions about boat compatibility or controls?'
  },
  '/quote/trade-in': {
    primaryLabel: 'Continue',
    nextPath: '/quote/installation',
    aiMessage: 'Curious about trade-in values or the process?'
  },
  '/quote/installation': {
    primaryLabel: 'Continue',
    nextPath: '/quote/fuel-tank',
    aiMessage: 'Questions about installation or rigging?'
  },
  '/quote/fuel-tank': {
    primaryLabel: 'Summary',
    nextPath: '/quote/summary',
    aiMessage: 'Need help choosing a fuel tank size?'
  },
  '/quote/schedule': {
    primaryLabel: 'Submit',
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

  // Check if we should show the bar - now shows on all customer journey pages
  const shouldShow = useMemo(() => {
    if (!isMobile) return false;
    
    // Hide on admin/auth/utility pages
    if (HIDE_ON_PAGES.some(path => location.pathname.startsWith(path))) return false;
    
    // Show on designated customer journey pages
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

    // Add controls cost from boat info
    if (state.boatInfo?.controlsOption) {
      if (state.boatInfo.controlsOption === 'none') total += 1200;
      else if (state.boatInfo.controlsOption === 'adapter') total += 125;
    }

    // Add installation labor for remote motors
    const isTiller = state.motor?.model?.includes('TLR') || state.motor?.model?.includes('MH');
    if (state.purchasePath === 'installed' && !isTiller) {
      total += 450;
    }

    // Add installation config costs
    if (state.installConfig?.installationCost) {
      total += state.installConfig.installationCost;
    }

    // Add fuel tank config
    if (state.fuelTankConfig?.tankCost) {
      total += state.fuelTankConfig.tankCost;
    }

    // Add warranty
    if (state.warrantyConfig?.warrantyPrice) {
      total += state.warrantyConfig.warrantyPrice;
    }

    // Subtract trade-in
    if (state.tradeInInfo?.estimatedValue) {
      total -= state.tradeInInfo.estimatedValue;
    }

    return total;
  }, [
    state.motor?.price,
    state.motor?.basePrice,
    state.motor?.msrp,
    state.motor?.model,
    state.boatInfo?.controlsOption,
    state.purchasePath,
    state.installConfig?.installationCost,
    state.fuelTankConfig?.tankCost,
    state.warrantyConfig?.warrantyPrice,
    state.tradeInInfo?.estimatedValue
  ]);

  // Calculate monthly payment
  const monthlyPayment = useMemo(() => {
    if (!runningTotal) return 0;
    const priceWithHST = runningTotal * 1.13;
    const priceWithFee = priceWithHST + DEALERPLAN_FEE;
    const promoRate = promo?.rate || null;
    const { payment } = calculateMonthlyPayment(priceWithFee, promoRate);
    return payment;
  }, [runningTotal, promo]);

  // Get page config
  const pageConfig = PAGE_CONFIG[location.pathname] || {
    primaryLabel: 'Continue',
    nextPath: '/quote/summary',
    aiMessage: 'Questions about your motor configuration?'
  };

  const handlePrimary = () => {
    triggerHaptic('light');
    navigate(pageConfig.nextPath);
  };

  const handleOpenAI = () => {
    triggerHaptic('medium');
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

  // Extract HP and motor family for compact display (e.g., "9.9 HP FourStroke")
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
  
  // Calculate price with fallback
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
      {/* Unified Mobile Bar - Premium Glass-Morphism Design */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[60] 
          bg-white border-t border-gray-200
          shadow-[0_-2px_20px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex flex-row items-center h-16 px-3 gap-2 keep-flex">
          {/* AI Button - Premium gradient accent */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            transition={springConfig}
            onClick={handleOpenAI}
            className="flex flex-col items-center justify-center h-11 w-11 shrink-0 
              rounded-xl bg-gradient-to-br from-primary/15 to-primary/5
              border border-primary/20
              shadow-sm"
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
              shadow-sm
              disabled:opacity-50 disabled:shadow-none"
          >
            {hasMotor ? (
              <>
                {/* Drag Handle Indicator */}
                <div className="w-8 h-1 rounded-full bg-gray-300 mb-0.5" />
                {/* Line 1: HP + Motor Family (compact, no truncation) */}
                <span className="text-sm font-semibold text-gray-900">
                  {compactMotorName || 'Motor Selected'}
                </span>
                {/* Line 2: Price + Monthly */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-semibold text-gray-900">{money(displayTotal)}</span>
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

          {/* Contact Button - Minimal ghost style */}
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

          {/* Primary CTA - Luxury black button (hidden on motor-selection when no motor) */}
          {(hasMotor || location.pathname !== '/quote/motor-selection') && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              transition={springConfig}
              onClick={handlePrimary}
              disabled={!hasMotor}
              className="shrink-0 h-11 px-5 rounded-xl text-sm font-semibold
                bg-gray-900 text-white 
                shadow-lg shadow-gray-900/20
                disabled:opacity-40 disabled:bg-gray-400 disabled:shadow-none"
            >
              {pageConfig.primaryLabel}
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
