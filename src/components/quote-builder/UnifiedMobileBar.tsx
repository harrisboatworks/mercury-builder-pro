import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronUp, MessageCircle, Phone, Sparkles } from 'lucide-react';
import { useQuote } from '@/contexts/QuoteContext';
import { useAIChat } from '@/components/chat/GlobalAIChat';
import { useIsMobile } from '@/hooks/use-mobile';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useActiveFinancingPromo } from '@/hooks/useActiveFinancingPromo';
import { calculateMonthlyPayment, DEALERPLAN_FEE } from '@/lib/finance';
import { money } from '@/lib/money';
import { Button } from '@/components/ui/button';
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
  '/financing',
  '/login',
  '/auth',
  '/dashboard',
  '/settings',
  '/admin',
  '/test',
  '/staging',
  '/my-quotes',
  '/deposits',
  '/accessories',
  '/contact',
  '/calculator',
  '/promotions',
];

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

  // Check if we should show the bar
  const shouldShow = useMemo(() => {
    if (!isMobile) return false;
    if (!location.pathname.startsWith('/quote')) return false;
    return !HIDE_ON_PAGES.some(path => location.pathname.startsWith(path));
  }, [isMobile, location.pathname]);

  const hasMotor = !!state.motor;

  // Calculate running total
  const runningTotal = useMemo(() => {
    if (!state.motor?.price) return 0;

    let total = state.motor.price;

    // Add controls cost from boat info
    if (state.boatInfo?.controlsOption) {
      if (state.boatInfo.controlsOption === 'none') total += 1200;
      else if (state.boatInfo.controlsOption === 'adapter') total += 125;
    }

    // Add installation labor for remote motors
    const isTiller = state.motor.model?.includes('TLR') || state.motor.model?.includes('MH');
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
  }, [state]);

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

  const motorName = state.motor?.model || '';
  const displayName = motorName.length > 16 ? motorName.substring(0, 16) + '...' : motorName;

  return (
    <>
      {/* Unified Mobile Bar - Single Row Premium Design */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[60] bg-white border-t border-gray-200 shadow-lg"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex flex-row items-center h-16 px-3 gap-2 keep-flex">
          {/* AI Button with label */}
          <button
            onClick={handleOpenAI}
            className="flex flex-col items-center justify-center h-12 w-12 shrink-0 rounded-lg bg-primary/10 hover:bg-primary/20 active:scale-95 transition-all"
            aria-label="Ask AI assistant"
          >
            <MessageCircle className="h-5 w-5 text-primary" />
            <span className="text-[10px] font-medium text-primary mt-0.5">AI</span>
          </button>

          {/* Center: Motor Info (tappable) or Prompt */}
          <button
            onClick={handleOpenDrawer}
            disabled={!hasMotor}
            className="flex-1 min-w-0 flex flex-col items-center justify-center py-1.5 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {hasMotor ? (
              <>
                <div className="flex items-center gap-1.5 w-full justify-center">
                  <span className="text-sm font-semibold text-gray-900 truncate max-w-[120px]">{displayName}</span>
                  <ChevronUp className={`h-3.5 w-3.5 shrink-0 text-gray-500 transition-transform ${isDrawerOpen ? 'rotate-180' : ''}`} />
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="font-medium">{money(runningTotal)}</span>
                  {monthlyPayment > 0 && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span>{money(monthlyPayment)}/mo</span>
                    </>
                  )}
                </div>
              </>
            ) : (
              <span className="text-sm text-gray-500 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" />
                Select a motor to begin
              </span>
            )}
          </button>

          {/* Contact Button with label */}
          <button
            onClick={handleOpenContact}
            className="flex flex-col items-center justify-center h-12 w-12 shrink-0 rounded-lg hover:bg-gray-100 active:scale-95 transition-all"
            aria-label="Contact us"
          >
            <Phone className="h-5 w-5 text-gray-600" />
            <span className="text-[10px] font-medium text-gray-600 mt-0.5">Call</span>
          </button>

          {/* Primary CTA - Always visible but styled differently when no motor */}
          <Button
            size="sm"
            onClick={handlePrimary}
            disabled={!hasMotor}
            className="shrink-0 h-12 px-4 text-sm font-semibold disabled:opacity-40"
          >
            {pageConfig.primaryLabel}
          </Button>
        </div>
      </div>

      {/* Spacer */}
      <div className="h-14" style={{ marginBottom: 'env(safe-area-inset-bottom)' }} />

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
