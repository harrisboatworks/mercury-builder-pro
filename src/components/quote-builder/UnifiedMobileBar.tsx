import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronUp, MessageCircle, Phone, Sparkles, ArrowRight, Shield, Award, DollarSign, Check, Flag, Heart, RefreshCw, Mic, Volume2, Eye, Clock, Scale } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuote } from '@/contexts/QuoteContext';
import { useAIChat } from '@/components/chat/GlobalAIChat';
import { useVoiceSafe } from '@/contexts/VoiceContext';
import { useIsMobileOrTablet } from '@/hooks/use-mobile';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useActiveFinancingPromo } from '@/hooks/useActiveFinancingPromo';
import { useMotorComparison } from '@/hooks/useMotorComparison';
import { calculateMonthlyPayment, DEALERPLAN_FEE } from '@/lib/finance';
import { money } from '@/lib/money';
import { MobileQuoteDrawer } from './MobileQuoteDrawer';
import { ComparisonDrawer } from '@/components/motors/ComparisonDrawer';
import { cn } from '@/lib/utils';
import { getHPRange, HP_SPECIFIC_MESSAGES, MOTOR_FAMILY_TIPS, getMotorFamilyKey, getMotorFamilyConfiguratorTip } from '@/components/chat/conversationalMessages';

// Nudge types for different visual treatments
type NudgeType = 'tip' | 'success' | 'celebration' | 'progress' | 'social-proof' | 'info' | 'comparison';

interface NudgeMessage {
  delay: number;
  message: string;
  icon?: string;
}

interface PageNudges {
  idle: NudgeMessage[];
  withSelection?: string;
  withoutSelection?: string;
  encouragement?: string;
  contextHint?: string;
  configuratorTips?: { step: string; message: string; icon?: string }[];
}

interface PageConfig {
  primaryLabel: string | ((state: any, hasMotor: boolean) => string);
  nextPath: string;
  aiMessage: string;
  nudges: PageNudges;
}

// Rich nudge content for each page
const PAGE_CONFIG: Record<string, PageConfig> = {
  '/quote/motor-selection': {
    primaryLabel: (state, hasMotor) => {
      // When previewing a motor (configurator open), show "Select This Motor"
      if (state.previewMotor) return 'Select This Motor';
      // When motor is selected, show "Continue"
      if (hasMotor) return 'Continue';
      return 'Configure';
    },
    nextPath: '/quote/options',
    aiMessage: 'Help me find the right motor for my boat',
    nudges: {
      idle: [
        { delay: 10, message: '20" shaft fits most boats — 15" for small tenders', icon: 'check' },
        { delay: 18, message: 'Electric start = push-button convenience', icon: 'sparkles' },
        { delay: 25, message: "We'll match the perfect motor to your boat", icon: 'heart' },
        { delay: 35, message: 'Not sure? Tap AI for expert help →', icon: 'sparkles' },
        { delay: 45, message: '60 years of Mercury expertise at your service', icon: 'award' },
      ],
      encouragement: "Excellent choice! Let's customize it",
      contextHint: 'Great specs for your boat type',
      configuratorTips: [
        { step: 'start', message: 'Electric start is more popular, manual is simpler', icon: 'sparkles' },
        { step: 'shaft', message: '20" shaft fits most boats — measure transom if unsure', icon: 'check' },
        { step: 'control', message: 'Tiller for boats under 16ft, remote for larger', icon: 'check' },
        { step: 'features', message: 'Command Thrust adds control for heavy boats', icon: 'shield' },
        { step: 'result', message: 'Tap to review specs, then select your motor', icon: 'heart' },
      ],
    }
  },
  '/quote/options': {
    primaryLabel: (state) => state.selectedPackage ? 'Continue' : 'Skip Options',
    nextPath: '/quote/purchase-path',
    aiMessage: 'Need help choosing options or accessories?',
    nudges: {
      idle: [
        { delay: 15, message: 'Packages save you money vs à la carte', icon: 'dollar' },
        { delay: 25, message: 'Complete includes everything for peace of mind', icon: 'shield' },
        { delay: 40, message: 'Not sure? AI can compare packages for you →', icon: 'sparkles' },
      ],
      withSelection: 'Smart choice! Full protection included',
      withoutSelection: 'Most customers choose Complete for worry-free boating',
      encouragement: 'Perfect package! Moving forward →',
    }
  },
  '/quote/purchase-path': {
    primaryLabel: 'Boat Info',
    nextPath: '/quote/boat-info',
    aiMessage: 'Should I pick up the motor loose or have Harris install it?',
    nudges: {
      idle: [
        { delay: 15, message: 'Most customers choose professional install', icon: 'check' },
        { delay: 25, message: 'We handle rigging, controls & lake test', icon: 'shield' },
        { delay: 40, message: 'Loose motor? Great for DIYers', icon: 'wrench' },
      ],
      encouragement: "Great! Let's get your boat details",
    }
  },
  '/quote/boat-info': {
    primaryLabel: 'Continue',
    nextPath: '/quote/trade-in',
    aiMessage: 'Questions about boat compatibility or controls?',
    nudges: {
      idle: [
        { delay: 15, message: 'This helps us ensure a perfect fit', icon: 'check' },
        { delay: 25, message: 'Compatibility matters for performance & safety', icon: 'shield' },
        { delay: 40, message: 'Questions? Tap AI for expert guidance →', icon: 'sparkles' },
      ],
      encouragement: 'Perfect fit confirmed! Almost there →',
    }
  },
  '/quote/trade-in': {
    primaryLabel: (state) => state.tradeInInfo?.estimatedValue ? 'Apply Trade-In' : 'Skip Trade-In',
    nextPath: '/quote/installation',
    aiMessage: 'Curious about trade-in values or the process?',
    nudges: {
      idle: [
        { delay: 15, message: 'Have a motor to trade? Get instant value', icon: 'refresh' },
        { delay: 25, message: 'Trade-ins reduce your upfront cost', icon: 'dollar' },
        { delay: 40, message: 'We accept most outboard motors', icon: 'check' },
      ],
      withSelection: "Nice! That's ${value} toward your new motor",
      withoutSelection: 'No trade-in? No problem →',
      encouragement: 'Great savings applied!',
    }
  },
  '/quote/installation': {
    primaryLabel: 'Continue',
    nextPath: '/quote/fuel-tank',
    aiMessage: 'Questions about installation or rigging?',
    nudges: {
      idle: [
        { delay: 15, message: 'Professional installation includes sea trial', icon: 'check' },
        { delay: 25, message: 'Full rigging & setup by certified techs', icon: 'shield' },
        { delay: 40, message: 'Average install time: 4-6 hours', icon: 'award' },
      ],
      encouragement: 'Expert installation confirmed!',
    }
  },
  '/quote/fuel-tank': {
    primaryLabel: 'View Summary',
    nextPath: '/quote/summary',
    aiMessage: 'Need help choosing a fuel tank size?',
    nudges: {
      idle: [
        { delay: 15, message: 'Tank size affects your range on the water', icon: 'check' },
        { delay: 25, message: "We'll recommend the right fit for your boat", icon: 'heart' },
        { delay: 40, message: 'Larger tanks = fewer fill-ups', icon: 'dollar' },
      ],
      encouragement: 'Ready for the water! Final step →',
    }
  },
  '/quote/schedule': {
    primaryLabel: 'Submit Quote',
    nextPath: '/quote/summary',
    aiMessage: 'Questions about scheduling or what happens next?',
    nudges: {
      idle: [
        { delay: 15, message: 'Review your quote and submit when ready', icon: 'check' },
        { delay: 25, message: 'Questions? Tap AI or call us', icon: 'sparkles' },
        { delay: 40, message: 'We typically respond within 24 hours', icon: 'award' },
      ],
      encouragement: "You're all set!",
    }
  },
  '/quote/summary': {
    primaryLabel: 'Submit Quote',
    nextPath: '/quote/schedule',
    aiMessage: 'Questions about your quote or financing?',
    nudges: {
      idle: [
        { delay: 0, message: "Your price is locked — take your time", icon: 'shield' },
        { delay: 6, message: "Quote valid for 30 days — no rush", icon: 'check' },
        { delay: 12, message: "Family-owned since 1947", icon: 'heart' },
        { delay: 18, message: "Mercury dealer since 1965 — we know these motors", icon: 'award' },
        { delay: 24, message: "Download PDF to share or review later", icon: 'check' },
        { delay: 30, message: "Financing available — tap to see options", icon: 'dollar' },
        { delay: 36, message: "Questions? Tap to chat or call us", icon: 'sparkles' },
        { delay: 42, message: "Most customers take a few days to decide", icon: 'clock' },
        { delay: 48, message: "Text us anytime: 647-952-2153", icon: 'phone' },
      ],
      encouragement: "Great choices — ready when you are",
      contextHint: "Everything in one place",
    }
  },
  '/repower': {
    primaryLabel: 'Build Your Quote',
    nextPath: '/quote/motor-selection',
    aiMessage: 'Questions about repowering your boat?',
    nudges: {
      idle: [
        { delay: 5, message: "Keeping your boat? Smart. New motor = new life", icon: 'refresh' },
        { delay: 12, message: "70% of the benefit for 30% of the cost 👍", icon: 'dollar' },
        { delay: 20, message: "Modern motors are 30-40% more fuel efficient", icon: 'check' },
        { delay: 28, message: "Free quote takes 2 minutes — tap to start →", icon: 'sparkles' },
        { delay: 36, message: "Mercury dealer since 1965 — we know repower", icon: 'award' },
        { delay: 44, message: "Questions? Tap here to chat with an expert →", icon: 'sparkles' },
        { delay: 52, message: "Winter is the best time to repower — no wait!", icon: 'shield' },
        { delay: 60, message: "Your old boat + new power = best of both worlds", icon: 'heart' },
      ],
      encouragement: "Let's find the right motor for your boat!",
      contextHint: "We handle everything — rigging, controls, lake test",
    }
  }
};

// Social proof messages (shown occasionally)
const SOCIAL_PROOF_NUDGES = [
  '127+ quotes generated this month',
  'Trusted by Ontario boaters since 1947',
  'CSI Award Winner',
  'Mercury dealer since 1965',
];

// Pages where the unified bar should NOT show
const HIDE_ON_PAGES = [
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
const SHOW_ON_PAGES = ['/', '/motors', '/quote', '/financing', '/accessories', '/repower'];

// Spring animation config for snappy micro-interactions
const springConfig = { type: 'spring', stiffness: 400, damping: 17 };

// Enhanced breathing animation for AI button - premium layered glow
const breathingAnimation = {
  boxShadow: [
    '0 0 0 0 rgba(59, 130, 246, 0), 0 0 0 0 rgba(59, 130, 246, 0)',
    '0 0 0 8px rgba(59, 130, 246, 0.25), 0 0 12px 4px rgba(59, 130, 246, 0.15)',
    '0 0 0 0 rgba(59, 130, 246, 0), 0 0 0 0 rgba(59, 130, 246, 0)'
  ]
};

// Sparkle rotation animation for micro-interaction
const sparkleAnimation = {
  rotate: [0, 15, -15, 0],
  scale: [1, 1.1, 1],
  opacity: [0.6, 1, 0.6]
};

export const UnifiedMobileBar: React.FC = () => {
  const isMobileOrTablet = useIsMobileOrTablet();
  const location = useLocation();
  const navigate = useNavigate();
  const { state, dispatch } = useQuote();
  const { openChat, closeChat, isOpen, isLoading, unreadCount } = useAIChat();
  const voice = useVoiceSafe(); // Fix: Move hook to top level (was inside JSX)
  const { triggerHaptic } = useHapticFeedback();
  const { promo } = useActiveFinancingPromo();
  const { 
    comparisonList, 
    count: comparisonCount, 
    removeFromComparison, 
    clearComparison 
  } = useMotorComparison();
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showComparisonDrawer, setShowComparisonDrawer] = useState(false);
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

  // Check if we should show the bar (mobile + tablet, under 1024px)
  const shouldShow = useMemo(() => {
    if (!isMobileOrTablet) return false;
    if (HIDE_ON_PAGES.some(path => location.pathname.startsWith(path))) return false;
    return SHOW_ON_PAGES.some(path => 
      location.pathname === path || location.pathname.startsWith(path + '/')
    );
  }, [isMobileOrTablet, location.pathname]);

  // Use preview motor if available (viewing modal), otherwise use selected motor
  const displayMotor = state.previewMotor || state.motor;
  const hasMotor = !!displayMotor;
  const isPreview = !!state.previewMotor;

  // Calculate running total
  const runningTotal = useMemo(() => {
    // On summary page, use the selected package price from context
    if (location.pathname === '/quote/summary' && state.selectedPackage?.priceBeforeTax) {
      return state.selectedPackage.priceBeforeTax;
    }

    const motorPrice = displayMotor?.price || displayMotor?.basePrice || displayMotor?.msrp || 0;
    if (!motorPrice) return 0;

    let total = motorPrice;

    // Only add extras if not previewing (actual selected motor)
    if (!isPreview) {
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
    }

    return total;
  }, [
    location.pathname, state.selectedPackage?.priceBeforeTax,
    displayMotor?.price, displayMotor?.basePrice, displayMotor?.msrp,
    isPreview, state.motor?.model,
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
    aiMessage: 'Questions about your motor configuration?',
    nudges: {
      idle: [
        { delay: 20, message: 'Questions? Tap AI for help', icon: 'sparkles' },
      ]
    }
  };

  const getPrimaryLabel = (): string => {
    // Summary page shows Reserve CTA
    if (location.pathname === '/quote/summary') {
      return 'Reserve $200';
    }
    // When previewing a motor on motor-selection, show Configure
    if (isPreview && location.pathname === '/quote/motor-selection') {
      return 'Configure';
    }
    if (typeof pageConfig.primaryLabel === 'function') {
      return pageConfig.primaryLabel(state, hasMotor);
    }
    return pageConfig.primaryLabel;
  };

  // Track recent meaningful actions for celebrations
  const [recentAction, setRecentAction] = useState<string | null>(null);
  const prevMotorRef = useRef(state.motor?.id);
  const prevOptionsRef = useRef(state.selectedOptions?.length || 0);
  const prevTradeInRef = useRef(state.tradeInInfo?.estimatedValue);

  // Detect meaningful actions for micro-celebrations
  useEffect(() => {
    // Motor selected
    if (state.motor?.id && state.motor.id !== prevMotorRef.current) {
      setRecentAction('motor-selected');
      triggerHaptic('medium');
      const timer = setTimeout(() => setRecentAction(null), 4000);
      prevMotorRef.current = state.motor.id;
      return () => clearTimeout(timer);
    }
    prevMotorRef.current = state.motor?.id;
  }, [state.motor?.id, triggerHaptic]);

  useEffect(() => {
    // Options selected
    const currentOptionsLength = state.selectedOptions?.length || 0;
    if (currentOptionsLength > 0 && currentOptionsLength !== prevOptionsRef.current) {
      setRecentAction('package-selected');
      triggerHaptic('light');
      const timer = setTimeout(() => setRecentAction(null), 4000);
      prevOptionsRef.current = currentOptionsLength;
      return () => clearTimeout(timer);
    }
    prevOptionsRef.current = currentOptionsLength;
  }, [state.selectedOptions?.length, triggerHaptic]);

  useEffect(() => {
    // Trade-in applied
    if (state.tradeInInfo?.estimatedValue && state.tradeInInfo.estimatedValue !== prevTradeInRef.current) {
      setRecentAction('tradein-applied');
      triggerHaptic('medium');
      const timer = setTimeout(() => setRecentAction(null), 4000);
      prevTradeInRef.current = state.tradeInInfo.estimatedValue;
      return () => clearTimeout(timer);
    }
    prevTradeInRef.current = state.tradeInInfo?.estimatedValue;
  }, [state.tradeInInfo?.estimatedValue, triggerHaptic]);

  // Generate motor-specific social proof with seeded randomness
  const getMotorSocialProof = (motorId: string, hp: number): { message: string; icon: string } => {
    // Simple seeded random based on motor ID for consistency
    let hash = 0;
    for (let i = 0; i < motorId.length; i++) {
      hash = ((hash << 5) - hash) + motorId.charCodeAt(i);
      hash |= 0;
    }
    const viewCount = 8 + Math.abs(hash % 25); // 8-32 views
    
    const hpRange = getHPRange(hp);
    if (hpRange === 'high-power') {
      return { message: `${viewCount} pros checked this out today`, icon: 'eye' };
    } else if (hpRange === 'portable') {
      return { message: `Popular with cottage owners — ${viewCount} views`, icon: 'eye' };
    }
    return { message: `${viewCount} Ontario boaters viewed this week`, icon: 'eye' };
  };

  // Get chatMinimizedAt from AI chat context
  const { chatMinimizedAt } = useAIChat();

  // Smart nudge selection with priority layers
  const activeNudge = useMemo((): { message: string; type: NudgeType; icon?: string } | null => {
    const nudges = pageConfig.nudges;
    if (!nudges) return null;

    // Priority -2 (HIGHEST): Comparison active - show in nudge bar
    if (comparisonCount > 0) {
      return { 
        message: `Compare ${comparisonCount} motor${comparisonCount > 1 ? 's' : ''} — tap to view`, 
        type: 'comparison', 
        icon: 'scale' 
      };
    }

    // Priority -1: Chat minimized notification
    if (chatMinimizedAt && (Date.now() - chatMinimizedAt < 30000)) {
      return { 
        message: 'Chat minimized — tap to continue', 
        type: 'info', 
        icon: 'sparkles' 
      };
    }

    // Priority 0: Configurator-specific tips - instantly react to step changes
    // Prioritize motor family-specific tips (Pro XS, Verado, etc.) over generic tips
    // Now includes available options awareness for contextually accurate tips
    if (state.configuratorStep && location.pathname === '/quote/motor-selection') {
      const motorFamily = displayMotor?.model ? getMotorFamilyKey(displayMotor.model) : null;
      const familyTip = getMotorFamilyConfiguratorTip(
        motorFamily, 
        state.configuratorStep,
        state.configuratorOptions // Pass available options for filtering
      );
      
      if (familyTip) {
        return { message: familyTip.message, type: 'tip', icon: familyTip.icon };
      }
      
      // Fall back to generic configurator tips
      if (nudges.configuratorTips) {
        const stepTip = nudges.configuratorTips.find(t => t.step === state.configuratorStep);
        if (stepTip) {
          return { message: stepTip.message, type: 'tip', icon: stepTip.icon };
        }
      }
    }

    // Priority 0.5: HP-aware tips + Social proof when previewing a motor
    if (isPreview && displayMotor?.hp) {
      const hpRange = getHPRange(displayMotor.hp);
      const hpMessages = HP_SPECIFIC_MESSAGES[hpRange] || [];
      
      // Get motor family tips if available (Pro XS, Verado, etc.)
      const familyKey = getMotorFamilyKey(displayMotor.model || '');
      const familyTips = familyKey ? MOTOR_FAMILY_TIPS[familyKey] || [] : [];
      
      // Generate motor-specific social proof
      const socialProof = getMotorSocialProof(displayMotor.id || 'default', displayMotor.hp);
      
      // Combine all messages: HP tips + Family tips + Social proof + CTA
      const allMessages: { message: string; icon: string; type: NudgeType }[] = [
        ...hpMessages.map(m => ({ message: m.message, icon: m.icon || 'check', type: 'tip' as NudgeType })),
        ...familyTips.map(m => ({ message: m.message, icon: m.icon || 'sparkles', type: 'tip' as NudgeType })),
        { message: socialProof.message, icon: socialProof.icon, type: 'social-proof' as NudgeType },
        { message: "Like what you see? Tap Configure!", icon: 'sparkles', type: 'tip' as NudgeType },
      ];
      
      // Rotate every 5 seconds
      const msgIndex = Math.floor(idleSeconds / 5) % allMessages.length;
      const msg = allMessages[msgIndex];
      return { message: msg.message, type: msg.type, icon: msg.icon };
    }

    // Priority 1: Micro-celebration for recent actions
    if (recentAction === 'motor-selected' && nudges.encouragement) {
      return { message: nudges.encouragement, type: 'celebration', icon: 'sparkles' };
    }
    if (recentAction === 'package-selected' && nudges.withSelection) {
      return { message: nudges.withSelection, type: 'success', icon: 'check' };
    }
    if (recentAction === 'tradein-applied' && nudges.withSelection) {
      const msg = nudges.withSelection.replace('${value}', money(state.tradeInInfo?.estimatedValue || 0));
      return { message: msg, type: 'success', icon: 'dollar' };
    }

    // Priority 2: Progress encouragement when near completion
    if (hasMotor && quoteProgress.remaining <= 2 && quoteProgress.remaining > 0 && idleSeconds >= 20) {
      return { 
        message: `Almost there! ${quoteProgress.remaining} step${quoteProgress.remaining > 1 ? 's' : ''} to go`,
        type: 'progress',
        icon: 'flag'
      };
    }

    // Priority 3: Context-aware state messages
    if (location.pathname === '/quote/trade-in' && state.tradeInInfo?.estimatedValue) {
      const msg = (nudges.withSelection || '').replace('${value}', money(state.tradeInInfo.estimatedValue));
      if (msg) return { message: msg, type: 'success', icon: 'dollar' };
    }
    if (location.pathname === '/quote/options' && state.selectedOptions?.length) {
      if (nudges.withSelection) return { message: nudges.withSelection, type: 'success', icon: 'shield' };
    }

    // Priority 4: Rotating idle nudges (with dynamic nudges for summary page)
    if (nudges.idle && idleSeconds >= (location.pathname === '/quote/summary' ? 0 : 15)) {
      // Build dynamic nudges array for summary page
      let allNudges = [...nudges.idle];
      
      if (location.pathname === '/quote/summary') {
        // Add dynamic savings nudge only when currentSavings > 0
        if (currentSavings > 0) {
          allNudges.push({ 
            delay: 54, 
            message: `You're saving ${money(currentSavings)} on this package`, 
            icon: 'dollar' 
          });
        }
        
        // Add promo rate nudge when active promo exists
        if (promo) {
          const formatPromoDate = (dateStr: string): string => {
            try {
              return new Date(dateStr).toLocaleDateString('en-CA', { 
                month: 'short', 
                day: 'numeric' 
              });
            } catch {
              return dateStr;
            }
          };
          
          const promoMessage = promo.promo_end_date 
            ? `Promo rate: ${promo.rate}% APR — ends ${formatPromoDate(promo.promo_end_date)}`
            : `Special rate: ${promo.rate}% APR — locked in for you`;
          allNudges.push({ delay: 60, message: promoMessage, icon: 'sparkles' });
        }
      }
      
      const applicableNudges = allNudges.filter(n => idleSeconds >= n.delay);
      if (applicableNudges.length > 0) {
        const nudge = applicableNudges[applicableNudges.length - 1];
        return { message: nudge.message, type: 'tip', icon: nudge.icon };
      }
    }

    // Priority 5: Occasional social proof (every ~60s idle, cycling through)
    if (idleSeconds >= 60 && idleSeconds % 20 < 5) {
      const proofIndex = Math.floor(idleSeconds / 20) % SOCIAL_PROOF_NUDGES.length;
      return { message: SOCIAL_PROOF_NUDGES[proofIndex], type: 'social-proof', icon: 'award' };
    }

    return null;
  }, [
    comparisonCount, chatMinimizedAt, pageConfig.nudges, recentAction, idleSeconds, hasMotor, quoteProgress.remaining,
    location.pathname, state.tradeInInfo?.estimatedValue, state.selectedOptions?.length,
    isPreview, displayMotor?.hp, displayMotor?.id, displayMotor?.model, state.configuratorStep,
    state.configuratorOptions, currentSavings, monthlyPayment, promo
  ]);

  // Helper to render nudge icon
  const NudgeIcon = ({ icon }: { icon?: string }) => {
    const className = "h-3.5 w-3.5 mr-1.5 inline-block";
    switch (icon) {
      case 'sparkles': return <Sparkles className={className} />;
      case 'shield': return <Shield className={className} />;
      case 'award': return <Award className={className} />;
      case 'dollar': return <DollarSign className={className} />;
      case 'check': return <Check className={className} />;
      case 'flag': return <Flag className={className} />;
      case 'heart': return <Heart className={className} />;
      case 'refresh': return <RefreshCw className={className} />;
      case 'eye': return <Eye className={className} />;
      case 'clock': return <Clock className={className} />;
      case 'phone': return <Phone className={className} />;
      case 'scale': return <Scale className={className} />;
      default: return null;
    }
  };

  const handlePrimary = () => {
    triggerHaptic('light');
    // If previewing a motor on selection page, select it first
    if (isPreview && location.pathname === '/quote/motor-selection' && state.previewMotor) {
      dispatch({ type: 'SET_MOTOR', payload: state.previewMotor });
    }
    navigate(pageConfig.nextPath);
  };

  const handleOpenAI = () => {
    triggerHaptic('medium');
    setIdleSeconds(0);
    
    // Toggle: close if already open
    if (isOpen) {
      closeChat();
      return;
    }
    
    // Motor context flows through QuoteContext.previewMotor - no marker needed
    openChat();
  };

  const handleOpenDrawer = () => {
    if (hasMotor) {
      triggerHaptic('light');
      setIsDrawerOpen(true);
    }
  };

  if (!shouldShow) return null;

  // Use full model name directly (e.g., "6 MLH FourStroke")
  const compactMotorName = displayMotor?.model || '';
  
  const displayTotal = runningTotal || displayMotor?.price || displayMotor?.basePrice || displayMotor?.msrp || 0;

  // Get contextual empty state message based on current page
  const getEmptyStateMessage = () => {
    if (location.pathname === '/') return 'Browse Mercury Motors';
    if (location.pathname.startsWith('/promotions')) return 'View Current Promos';
    if (location.pathname.startsWith('/financing')) return 'Explore Financing';
    return 'Select a motor to begin';
  };

  // Get contextual default prompt message for each page when no active nudge
  const getDefaultPromptMessage = (): string => {
    const path = location.pathname;
    
    if (path === '/' || path === '/motors') {
      return hasMotor 
        ? `Ask about your ${displayMotor?.hp || ''}HP motor →`
        : 'Ask about Mercury motors or get help choosing →';
    }
    if (path.includes('/motor-selection')) {
      return hasMotor 
        ? `Ask about ${displayMotor?.hp}HP specs or compare motors →`
        : 'Need help choosing? Ask me anything →';
    }
    if (path.includes('/options')) {
      return 'Compare packages or ask about warranties →';
    }
    if (path.includes('/purchase-path')) {
      return 'Questions about installation vs loose motor? →';
    }
    if (path.includes('/boat-info')) {
      return 'Ask about compatibility or control options →';
    }
    if (path.includes('/trade-in')) {
      return 'Curious about trade-in values? Ask me →';
    }
    if (path.includes('/installation')) {
      return 'Questions about professional installation? →';
    }
    if (path.includes('/fuel-tank')) {
      return 'Help me choose the right fuel tank size →';
    }
    if (path.includes('/schedule')) {
      return 'Questions about next steps? Ask here →';
    }
    if (path.includes('/promotions')) {
      return 'Ask about current Mercury promotions →';
    }
    if (path.includes('/financing')) {
      return 'Questions about financing options? →';
    }
    if (path.includes('/repower')) {
      return 'Questions about repowering your boat? →';
    }
    
    return 'Ask me anything about Mercury motors →';
  };

  // Detect phone numbers in nudge messages and determine action type
  const extractPhoneAction = (message: string): { type: 'sms' | 'tel', number: string } | null => {
    // Match patterns like "647-952-2153" or "(905) 342-2153"
    const phoneMatch = message.match(/(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/);
    if (!phoneMatch) return null;
    
    const number = phoneMatch[1].replace(/[-.\s]/g, '');
    // If message mentions "text", use SMS, otherwise default to tel
    const type = message.toLowerCase().includes('text') ? 'sms' : 'tel';
    return { type, number };
  };

  // Handle nudge bar tap - phone numbers open native apps, comparison opens drawer, otherwise open AI chat
  const handleNudgeClick = () => {
    if (activeNudge) {
      // If comparison nudge, open comparison drawer
      if (activeNudge.type === 'comparison') {
        triggerHaptic('light');
        setShowComparisonDrawer(true);
        return;
      }
      
      const phoneAction = extractPhoneAction(activeNudge.message);
      if (phoneAction) {
        triggerHaptic('light');
        window.location.href = `${phoneAction.type}:${phoneAction.number}`;
        return;
      }
    }
    // Default: open AI chat
    handleOpenAI();
  };
  
  // Handle motor selection from comparison drawer
  const handleComparisonSelect = (motor: any) => {
    dispatch({ type: 'SET_MOTOR', payload: motor });
    setShowComparisonDrawer(false);
    navigate('/quote/options');
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
        className="fixed bottom-0 left-0 right-0 z-[80] 
          bg-white border-t border-gray-200
          shadow-[0_-2px_20px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Always-Visible Tappable Prompt Bar */}
        <motion.button
          onClick={handleNudgeClick}
          whileTap={{ scale: 0.98 }}
          className="w-full overflow-hidden text-left relative"
        >
          {/* Tap ripple effect overlay */}
          <motion.span
            initial={false}
            className="absolute inset-0 bg-black/5 opacity-0 pointer-events-none"
            whileTap={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          />
          <AnimatePresence mode="wait">
            <motion.div
              key={isOpen ? 'chat-open' : (isLoading ? 'typing' : (activeNudge?.message || 'default-prompt'))}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "px-4 py-2 border-b text-center transition-colors",
                isOpen && "bg-gradient-to-r from-primary/15 to-primary/10 border-primary/30 text-primary",
                !isOpen && isLoading && "bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 text-primary",
                !isOpen && !isLoading && activeNudge?.type === 'comparison' && "bg-gradient-to-r from-indigo-50 to-purple-100/50 border-indigo-200/60 text-indigo-700",
                !isOpen && !isLoading && activeNudge?.type === 'tip' && "bg-gradient-to-r from-gray-50 to-gray-100/80 border-gray-200/60 text-gray-600",
                !isOpen && !isLoading && activeNudge?.type === 'success' && "bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-emerald-200/60 text-emerald-700",
                !isOpen && !isLoading && activeNudge?.type === 'celebration' && "bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 text-primary",
                !isOpen && !isLoading && activeNudge?.type === 'progress' && "bg-gradient-to-r from-amber-50 to-amber-100/50 border-amber-200/60 text-amber-700",
                !isOpen && !isLoading && activeNudge?.type === 'social-proof' && "bg-gradient-to-r from-slate-50 to-slate-100/80 border-slate-200/60 text-slate-600",
                !isOpen && !isLoading && !activeNudge && "bg-gray-50/80 border-gray-200/50 text-gray-500",
              )}
            >
              <span className="text-xs font-medium inline-flex items-center justify-center">
                {isOpen ? (
                  <>
                    <MessageCircle className="h-3.5 w-3.5 mr-1.5 inline-block" />
                    Chat is open • Swipe down to close
                  </>
                ) : isLoading ? (
                  <>
                    <span className="mr-1.5">AI is thinking</span>
                    <span className="inline-flex gap-0.5">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="w-1 h-1 bg-current rounded-full"
                          animate={{ y: [0, -3, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.12 }}
                        />
                      ))}
                    </span>
                  </>
                ) : activeNudge ? (
                  <>
                    {extractPhoneAction(activeNudge.message) ? (
                      <Phone className="h-3.5 w-3.5 mr-1.5 inline-block" />
                    ) : (
                      <NudgeIcon icon={activeNudge.icon} />
                    )}
                    {activeNudge.message}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 mr-1.5 inline-block" />
                    {getDefaultPromptMessage()}
                  </>
                )}
              </span>
            </motion.div>
          </AnimatePresence>
        </motion.button>

        <div 
          className="flex flex-row items-center h-14 min-[375px]:h-16 keep-flex
            px-2 min-[375px]:px-3 min-[428px]:px-4
            gap-1.5 min-[375px]:gap-2 min-[428px]:gap-3"
          style={{ paddingLeft: 'max(0.5rem, env(safe-area-inset-left))', paddingRight: 'max(0.5rem, env(safe-area-inset-right))' }}
        >
          {/* Text Chat Button */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            animate={!isOpen && !voice?.isConnected ? breathingAnimation : {}}
            transition={{
              ...springConfig,
              boxShadow: {
                duration: 3,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1]
              }
            }}
            onClick={handleOpenAI}
            className={cn(
              "flex flex-col items-center justify-center shrink-0 relative overflow-visible",
              "h-10 w-10 min-[375px]:h-11 min-[375px]:w-11 rounded-xl",
              isOpen 
                ? "bg-primary text-white border border-primary shadow-lg shadow-primary/30" 
                : "bg-gradient-to-br from-primary/20 via-primary/10 to-blue-400/10 border-2 border-primary/30"
            )}
            aria-label="Text chat with AI assistant"
          >
            {/* Premium inner glow ring */}
            {!isOpen && (
              <motion.span
                className="absolute inset-[2px] rounded-[10px] border border-primary/20 pointer-events-none"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
            
            {/* Sparkle micro-animation overlay */}
            {!isOpen && (
              <motion.span
                className="absolute -top-0.5 -right-0.5 pointer-events-none"
                animate={sparkleAnimation}
                transition={{ 
                  duration: 2.5, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  times: [0, 0.3, 0.7, 1]
                }}
              >
                <Sparkles className="h-3 w-3 text-primary/70" />
              </motion.span>
            )}
            
            {/* Unread badge */}
            {unreadCount > 0 && !isOpen && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center shadow-md z-10"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
            
            {isLoading && !isOpen ? (
              <>
                <div className="flex gap-0.5 items-center">
                  {[0, 1, 2].map(i => (
                    <motion.span
                      key={i}
                      className="w-1.5 h-1.5 bg-primary rounded-full"
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                    />
                  ))}
                </div>
                <span className="text-[7px] min-[375px]:text-[8px] font-semibold mt-0.5 text-primary/80">...</span>
              </>
            ) : (
              <>
                <MessageCircle className={cn(
                  "h-5 w-5 min-[375px]:h-5.5 min-[375px]:w-5.5",
                  isOpen ? "text-white" : "text-primary"
                )} />
                <span className={cn(
                  "text-[7px] min-[375px]:text-[8px] font-bold mt-0.5 tracking-wide",
                  isOpen ? "text-white" : "text-primary"
                )}>
                  Chat
                </span>
              </>
            )}
          </motion.button>

          {/* Voice Call Button - Separate prominent entry point */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            animate={voice?.isConnected ? {
              boxShadow: [
                '0 0 0 0 rgba(34, 197, 94, 0)',
                '0 0 0 8px rgba(34, 197, 94, 0.3)',
                '0 0 0 0 rgba(34, 197, 94, 0)'
              ]
            } : {
              boxShadow: [
                '0 0 0 0 rgba(34, 197, 94, 0)',
                '0 0 0 6px rgba(34, 197, 94, 0.15)',
                '0 0 0 0 rgba(34, 197, 94, 0)'
              ]
            }}
            transition={{
              ...springConfig,
              boxShadow: {
                duration: voice?.isConnected ? 1.5 : 3,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1]
              }
            }}
            onClick={() => {
              triggerHaptic('medium');
              if (voice?.isConnected) {
                // If already connected, end the voice chat
                voice?.endVoiceChat();
              } else {
                // Start voice chat directly
                voice?.startVoiceChat();
              }
            }}
            className={cn(
              "flex flex-col items-center justify-center shrink-0 relative overflow-visible",
              "h-10 w-10 min-[375px]:h-11 min-[375px]:w-11 rounded-xl",
              voice?.isConnected
                ? voice?.isSpeaking
                  ? "bg-gradient-to-br from-green-500 to-green-600 text-white border border-green-500 shadow-lg shadow-green-500/40"
                  : "bg-gradient-to-br from-green-500 to-green-600 text-white border border-green-500 shadow-lg shadow-green-500/40"
                : "bg-gradient-to-br from-green-500/20 via-green-500/10 to-emerald-400/10 border-2 border-green-500/30"
            )}
            aria-label={voice?.isConnected ? "Voice chat active - tap to view" : "Start voice call with Harris"}
          >
            {/* Premium inner glow ring for inactive state */}
            {!voice?.isConnected && (
              <motion.span
                className="absolute inset-[2px] rounded-[10px] border border-green-500/20 pointer-events-none"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
            
            {voice?.isConnected ? (
              <>
                {voice?.isSpeaking ? (
                  <Volume2 className="h-4 w-4 min-[375px]:h-4.5 min-[375px]:w-4.5 text-white animate-pulse" />
                ) : (
                  <Mic className="h-4 w-4 min-[375px]:h-4.5 min-[375px]:w-4.5 text-white" />
                )}
                <span className="text-[7px] min-[375px]:text-[8px] font-bold mt-0.5 text-white tracking-wide">
                  LIVE
                </span>
              </>
            ) : (
              <>
                <Phone className="h-5 w-5 min-[375px]:h-5.5 min-[375px]:w-5.5 text-green-600" />
                <span className="text-[7px] min-[375px]:text-[8px] font-bold mt-0.5 text-green-600 tracking-wide">
                  Voice
                </span>
              </>
            )}
          </motion.button>

          {/* Center: Motor Info Card (tappable) or Prompt */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            transition={springConfig}
            onClick={handleOpenDrawer}
            disabled={!hasMotor}
            className="flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-2 min-[375px]:py-1.5 min-[375px]:px-3 
              rounded-xl bg-gray-50/80 border border-gray-200/60
              disabled:opacity-50"
          >
            {hasMotor ? (
              <>
                {/* Drag Handle with breathing pulse */}
                <motion.div 
                  animate={{ 
                    opacity: [0.4, 0.7, 0.4],
                    width: ['24px', '32px', '24px']
                  }}
                  transition={{ 
                    duration: 2.5, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className="h-0.5 min-[375px]:h-1 rounded-full bg-gray-300 mb-0.5" 
                />
                {/* Preview indicator */}
                {isPreview && (
                  <span className="text-[9px] min-[375px]:text-[10px] text-primary font-medium tracking-wide uppercase">
                    Previewing
                  </span>
                )}
                {/* Line 1: HP + Motor Family */}
                <span className="text-xs min-[375px]:text-sm font-semibold text-gray-900 truncate max-w-full">
                  {compactMotorName || 'Motor Selected'}
                </span>
                {/* Line 2: Animated Price + Monthly */}
                <div className="flex items-center gap-1 min-[375px]:gap-1.5 text-[10px] min-[375px]:text-xs">
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
                      <span className="text-gray-300 hidden min-[375px]:inline">•</span>
                      <span className="text-gray-500 hidden min-[375px]:inline">≈{money(monthlyPayment)}/mo</span>
                    </>
                  )}
                  <ChevronUp className={`h-3 w-3 text-gray-400 transition-transform duration-200 ${isDrawerOpen ? 'rotate-180' : ''}`} />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-xs min-[375px]:text-sm text-gray-600 flex items-center gap-1 min-[375px]:gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 min-[375px]:h-4 min-[375px]:w-4" />
                  {getEmptyStateMessage()}
                </span>
                <span className="text-[9px] min-[375px]:text-[10px] text-gray-400 mt-0.5">Tap to explore</span>
              </div>
            )}
          </motion.button>


          {/* Primary CTA - Smart contextual label */}
          {(hasMotor || location.pathname !== '/quote/motor-selection') && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              transition={springConfig}
              onClick={handlePrimary}
              disabled={!hasMotor}
              className="shrink-0 rounded-xl font-semibold
                h-10 px-2.5 text-xs min-[375px]:h-11 min-[375px]:px-3 min-[375px]:text-sm min-[428px]:px-4
                bg-gray-900 text-white 
                shadow-lg shadow-gray-900/20
                disabled:opacity-40 disabled:bg-gray-400 disabled:shadow-none
                flex items-center gap-1"
            >
              {getPrimaryLabel()}
              <ArrowRight className="h-3 w-3 min-[375px]:h-3.5 min-[375px]:w-3.5" />
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

      {/* Comparison Drawer */}
      <ComparisonDrawer 
        isOpen={showComparisonDrawer}
        onClose={() => setShowComparisonDrawer(false)}
        motors={comparisonList}
        onRemove={removeFromComparison}
        onClear={clearComparison}
        onSelectMotor={handleComparisonSelect}
      />

    </>
  );
};
