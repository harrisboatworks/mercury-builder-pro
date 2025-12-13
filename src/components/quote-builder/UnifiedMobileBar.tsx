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
    nextPath: '/quote/purchase-path',
    aiMessage: 'Help me find the right motor for my boat'
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
        className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-border/50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex flex-row flex-nowrap items-center h-14 px-2 gap-1.5">
          {/* AI Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleOpenAI}
            className="h-10 w-10 shrink-0 rounded-full bg-primary/5 hover:bg-primary/10"
            aria-label="Ask AI assistant"
          >
            <MessageCircle className="h-5 w-5 text-primary" />
          </Button>

          {/* Center: Motor Info (tappable) or Prompt */}
          <button
            onClick={handleOpenDrawer}
            disabled={!hasMotor}
            className="flex-1 min-w-0 flex flex-row flex-nowrap items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors disabled:opacity-60"
          >
            {hasMotor ? (
              <>
                <ChevronUp className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${isDrawerOpen ? 'rotate-180' : ''}`} />
                <span className="text-sm font-medium truncate">{displayName}</span>
                <span className="text-sm text-muted-foreground shrink-0">
                  {money(runningTotal)}
                </span>
                {monthlyPayment > 0 && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    ≈{money(monthlyPayment)}/mo
                  </span>
                )}
              </>
            ) : (
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" />
                Select a motor
              </span>
            )}
          </button>

          {/* Contact Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleOpenContact}
            className="h-10 w-10 shrink-0 rounded-full hover:bg-muted"
            aria-label="Contact us"
          >
            <Phone className="h-5 w-5 text-muted-foreground" />
          </Button>

          {/* Primary CTA - Only show when motor selected */}
          {hasMotor && (
            <Button
              size="sm"
              onClick={handlePrimary}
              className="shrink-0 h-10 px-3 text-xs font-medium"
            >
              {pageConfig.primaryLabel} →
            </Button>
          )}
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
