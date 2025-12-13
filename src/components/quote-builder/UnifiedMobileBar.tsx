import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronUp, MessageSquare, Phone, Sparkles } from 'lucide-react';
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
  secondaryLabel?: string;
}> = {
  '/quote/purchase-path': {
    primaryLabel: 'Next: Boat Info',
    nextPath: '/quote/boat-info',
    aiMessage: 'Need help choosing between installation options?'
  },
  '/quote/boat-info': {
    primaryLabel: 'Next: Trade-In',
    nextPath: '/quote/trade-in',
    aiMessage: 'Questions about boat compatibility or controls?'
  },
  '/quote/trade-in': {
    primaryLabel: 'Next: Installation',
    nextPath: '/quote/installation',
    aiMessage: 'Curious about trade-in values or the process?'
  },
  '/quote/installation': {
    primaryLabel: 'View Summary',
    nextPath: '/quote/summary',
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
    aiMessage: 'Questions about scheduling or what happens next?',
    secondaryLabel: 'Back to Summary'
  }
};

// Pages where the unified bar should NOT show
const HIDE_ON_PAGES = [
  '/quote/motor-selection',
  '/quote/summary',
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
    if (!state.motor) return false;
    return !HIDE_ON_PAGES.some(path => location.pathname.startsWith(path));
  }, [isMobile, state.motor, location.pathname]);

  // Calculate running total
  const runningTotal = useMemo(() => {
    if (!state.motor?.price) return null;

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

    // Apply HST (13%)
    return total * 1.13;
  }, [state]);

  // Calculate monthly payment
  const monthlyPayment = useMemo(() => {
    if (!runningTotal) return null;
    const priceWithFee = runningTotal + DEALERPLAN_FEE;
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

  const handleSecondary = () => {
    triggerHaptic('light');
    if (pageConfig.secondaryLabel === 'Back to Summary') {
      navigate('/quote/summary');
    } else {
      navigate('/quote/summary');
    }
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
    triggerHaptic('light');
    setIsDrawerOpen(true);
  };

  if (!shouldShow) return null;

  return (
    <>
      {/* Unified Mobile Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/98 backdrop-blur-lg border-t border-border shadow-lg"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Row 1: Motor Info (tappable to expand) */}
        <button
          onClick={handleOpenDrawer}
          className="w-full flex items-center justify-between px-4 py-2.5 border-b border-border/50 active:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium text-foreground truncate text-sm">
              {state.motor?.model}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm shrink-0">
            {runningTotal && (
              <span className="font-semibold text-foreground">{money(runningTotal)}</span>
            )}
            {monthlyPayment && (
              <span className="text-muted-foreground">≈ {money(monthlyPayment)}/mo</span>
            )}
            {state.warrantyConfig?.totalYears && (
              <span className="text-muted-foreground">{state.warrantyConfig.totalYears}yr</span>
            )}
          </div>
        </button>

        {/* Row 2: Actions */}
        <div className="flex items-center gap-2 px-3 py-2.5">
          {/* AI Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleOpenAI}
            className="h-11 w-11 shrink-0 relative"
            aria-label="Ask AI assistant"
          >
            <MessageSquare className="h-5 w-5" />
            <Sparkles className="absolute -top-0.5 -right-0.5 h-3 w-3 text-amber-500" />
          </Button>

          {/* Contact Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleOpenContact}
            className="h-11 w-11 shrink-0"
            aria-label="Contact us"
          >
            <Phone className="h-5 w-5" />
          </Button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Secondary Action */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSecondary}
            className="h-11 px-3 text-xs font-normal"
          >
            {pageConfig.secondaryLabel || 'Summary'}
          </Button>

          {/* Primary Action */}
          <Button
            size="sm"
            onClick={handlePrimary}
            className="h-11 px-4 text-xs font-semibold"
          >
            {pageConfig.primaryLabel}
          </Button>
        </div>
      </div>

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
