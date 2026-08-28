import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSound } from '@/contexts/SoundContext';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useIsMobile } from '@/hooks/use-mobile';
import { money, calculateMonthly } from '@/lib/quote-utils';
import { X, Shield } from 'lucide-react';
import confetti from 'canvas-confetti';
import harrisLogo from '@/assets/harris-logo.png';
import harrisLogoWhite from '@/assets/harris-logo-white.png';
import mercuryLogo from '@/assets/mercury-logo.png';

interface QuoteRevealCinematicProps {
  isVisible: boolean;
  onComplete: () => void;
  motorName: string;
  finalPrice: number;
  msrp?: number;
  savings: number;
  coverageYears: number;
  imageUrl?: string;
  // Promo information
  selectedPromoOption?: 'no_payments' | 'special_financing' | 'cash_rebate' | null;
  selectedPromoValue?: string;
  // Pre-calculated monthly payment to ensure consistency with PDF/Summary
  monthlyPayment?: number;
  showMonthlyPayment?: boolean;
  // Trade-in value for dynamic label display
  tradeInValue?: number;
}

// Helper to get display-friendly promo label
const getPromoLabel = (option: string, value: string): string => {
  switch (option) {
    case 'no_payments': return '6 Mo. Deferred';
    case 'special_financing': return `${value} APR`;
    case 'cash_rebate': return `${value} Rebate`;
    default: return value;
  }
};

// Premium gold/silver confetti burst
const triggerPremiumConfetti = () => {
  const defaults = {
    origin: { y: 0.6 },
    zIndex: 10000,
    disableForReducedMotion: true,
  };
  
  // Gold/silver premium burst - subtle
  confetti({
    ...defaults,
    particleCount: 25,
    spread: 50,
    startVelocity: 30,
    colors: ['#D4AF37', '#C0C0C0', '#FFD700', '#E8E8E8'],
    scalar: 0.8,
  });
};

// Golden shimmer particles component - reduced count on mobile
function GoldenShimmer({ isActive, isMobile }: { isActive: boolean; isMobile: boolean }) {
  if (!isActive) return null;
  
  const particleCount = isMobile ? 6 : 12;
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(particleCount)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(212,175,55,0.8) 0%, transparent 70%)',
            left: `${15 + Math.random() * 70}%`,
            top: `${10 + Math.random() * 60}%`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 0.7, 0],
            scale: [0, 1.5, 0],
            y: [0, -30, -60],
          }}
          transition={{
            duration: 2.5 + Math.random() * 1.5,
            delay: 0.5 + i * 0.15,
            repeat: Infinity,
            repeatDelay: Math.random() * 2,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

export function QuoteRevealCinematic({
  isVisible,
  onComplete,
  motorName,
  finalPrice,
  msrp,
  savings,
  coverageYears,
  imageUrl,
  selectedPromoOption,
  selectedPromoValue,
  monthlyPayment: passedMonthlyPayment,
  showMonthlyPayment = true,
  tradeInValue
}: QuoteRevealCinematicProps) {
  const [stage, setStage] = useState<'spotlight' | 'motor' | 'msrp' | 'price' | 'savings' | 'details' | 'complete'>('spotlight');
  const [displayPrice, setDisplayPrice] = useState(0);
  const [priceComplete, setPriceComplete] = useState(false);
  const [showSavingsBadge, setShowSavingsBadge] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [progress, setProgress] = useState(0);
  const [canTapToSkip, setCanTapToSkip] = useState(false);
  const [showTapHint, setShowTapHint] = useState(false);
  const { playReveal, playSwoosh, playTick, playComplete, playAmbientPad, playCelebration, playMotorNameReveal } = useSound();
  const { triggerHaptic } = useHapticFeedback();
  const priceIntervalRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<number>(0);
  const onCompleteRef = useRef(onComplete);
  const priceStartedRef = useRef(false);
  const priceCompleteRef = useRef(false);
  const isMobile = useIsMobile();
  
  // Keep refs in sync, prevents dependency changes from restarting effects
  onCompleteRef.current = onComplete;
  const playRevealRef = useRef(playReveal);
  playRevealRef.current = playReveal;
  const playSwooshRef = useRef(playSwoosh);
  playSwooshRef.current = playSwoosh;
  const playTickRef = useRef(playTick);
  playTickRef.current = playTick;
  const playCompleteRef = useRef(playComplete);
  playCompleteRef.current = playComplete;
  const playAmbientPadRef = useRef(playAmbientPad);
  playAmbientPadRef.current = playAmbientPad;
  const playCelebrationRef = useRef(playCelebration);
  playCelebrationRef.current = playCelebration;
  const playMotorNameRevealRef = useRef(playMotorNameReveal);
  playMotorNameRevealRef.current = playMotorNameReveal;
  
  const TOTAL_DURATION = 12500; // Match the auto-close timing
  
  // Calculate savings percentage
  const savingsPercent = msrp && msrp > 0 ? Math.round((savings / msrp) * 100) : 0;
  
  // Use pre-calculated monthly payment if provided, otherwise calculate (fallback)
  const calculatedMonthly = calculateMonthly(finalPrice);
  const monthlyPayment = passedMonthlyPayment ?? calculatedMonthly.amount;

  // Detect iOS for rendering workarounds
  const isIOS = typeof navigator !== 'undefined' && (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );

  // Smooth skip handler with fade-out animation (instant on iOS to prevent washed-out artifacts)
  const handleSkip = () => {
    if (isSkipping) return;
    setIsSkipping(true);
    triggerHaptic('light');
    if (isIOS) {
      onComplete();
    } else {
      setTimeout(onComplete, 500);
    }
  };

  // Handle tap-to-skip for mobile
  const handleTapToSkip = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canTapToSkip || !isMobile) return;
    // Ignore if tapping the skip button area
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    handleSkip();
  };

  // Enable tap-to-skip after 3 seconds on mobile
  useEffect(() => {
    if (isVisible && isMobile) {
      const tapTimeout = setTimeout(() => setCanTapToSkip(true), 3000);
      const hintTimeout = setTimeout(() => setShowTapHint(true), 5000);
      return () => {
        clearTimeout(tapTimeout);
        clearTimeout(hintTimeout);
      };
    }
  }, [isVisible, isMobile]);

  // Haptic feedback when price completes
  useEffect(() => {
    if (priceComplete) {
      triggerHaptic('motorSelected');
    }
  }, [priceComplete, triggerHaptic]);

  // Haptic feedback when savings badge appears
  useEffect(() => {
    if (showSavingsBadge) {
      triggerHaptic('addedToQuote');
    }
  }, [showSavingsBadge, triggerHaptic]);

  // Play motor name reveal sound with the animation delay
  useEffect(() => {
    if (stage === 'motor') {
      const soundTimeout = setTimeout(() => {
        playMotorNameRevealRef.current();
      }, 400);
      return () => clearTimeout(soundTimeout);
    }
  }, [stage]);

  // Progress bar countdown
  useEffect(() => {
    if (!isVisible) return;
    
    startTimeRef.current = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min((elapsed / TOTAL_DURATION) * 100, 100);
      setProgress(newProgress);
    }, 50);
    
    return () => clearInterval(interval);
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) {
      setStage('spotlight');
      setDisplayPrice(0);
      setPriceComplete(false);
      setShowSavingsBadge(false);
      setIsSkipping(false);
      setProgress(0);
      setCanTapToSkip(false);
      setShowTapHint(false);
      priceStartedRef.current = false;
      priceCompleteRef.current = false;
      return;
    }

    // Play ambient pad at start for immersive atmosphere
    playAmbientPadRef.current();

    // Extended luxury timeline with MSRP flash
    const timeline = [
      { stage: 'spotlight' as const, delay: 0, sound: () => playRevealRef.current() },
      { stage: 'motor' as const, delay: 1000, sound: () => playSwooshRef.current() },
      { stage: 'msrp' as const, delay: 2500, sound: null },
      { stage: 'price' as const, delay: 3500, sound: null },
      { stage: 'savings' as const, delay: 5800, sound: () => { playCelebrationRef.current?.(); triggerPremiumConfetti(); } },
      { stage: 'details' as const, delay: 7200, sound: () => playCompleteRef.current() },
      { stage: 'complete' as const, delay: 9800, sound: null },
    ];

    const timeouts: NodeJS.Timeout[] = [];

    timeline.forEach(({ stage, delay, sound }) => {
      const timeout = setTimeout(() => {
        setStage(stage);
        if (sound) sound();
      }, delay);
      timeouts.push(timeout);
    });

    // Show savings badge with delay
    const badgeTimeout = setTimeout(() => setShowSavingsBadge(true), 6200);
    timeouts.push(badgeTimeout);

    // Complete callback - use ref to avoid dependency on onComplete
    const completeTimeout = setTimeout(() => onCompleteRef.current(), 12500);
    timeouts.push(completeTimeout);

    // Safety timeout: force-dismiss if overlay somehow gets stuck
    const safetyTimeout = setTimeout(() => onCompleteRef.current(), 15000);
    timeouts.push(safetyTimeout);

    return () => {
      timeouts.forEach(clearTimeout);
      if (priceIntervalRef.current) clearInterval(priceIntervalRef.current);
    };
  // Sound functions stored in refs, only isVisible triggers
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  // Smoother price counting animation, runs exactly once
  useEffect(() => {
    if (stage !== 'price' && stage !== 'savings' && stage !== 'details' && stage !== 'complete') return;
    // Ref-based guards: prevent restart even if React re-renders or stage changes
    if (priceStartedRef.current || priceCompleteRef.current) return;
    priceStartedRef.current = true;

    const duration = 2000;
    const steps = 50;
    const increment = finalPrice / steps;
    let current = 0;

    priceIntervalRef.current = setInterval(() => {
      current += increment;
      if (current >= finalPrice) {
        setDisplayPrice(finalPrice);
        setPriceComplete(true);
        priceCompleteRef.current = true;
        if (priceIntervalRef.current) clearInterval(priceIntervalRef.current);
      } else {
        setDisplayPrice(Math.floor(current));
        playTickRef.current();
      }
    }, duration / steps);

    return () => {
      if (priceIntervalRef.current) clearInterval(priceIntervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, finalPrice]);

  // Safety net: snap displayPrice to current finalPrice after counter completes
  // Covers late promo data arriving after the counter already finished
  useEffect(() => {
    if (priceComplete && displayPrice !== finalPrice) {
      setDisplayPrice(finalPrice);
    }
  }, [priceComplete, finalPrice, displayPrice]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isSkipping ? 0 : 1 }}
        exit={{ opacity: 0, transition: { duration: isIOS ? 0 : 0.3 } }}
        transition={{ duration: isSkipping ? (isIOS ? 0 : 0.5) : 0.3 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
        style={{ willChange: 'opacity' }}
        onClick={handleTapToSkip}
        onTouchEnd={handleTapToSkip}
      >
        {/* Near-black background with subtle vignette */}
        <motion.div 
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          style={{
            background: 'radial-gradient(ellipse at center, #0F0F0F 0%, #0A0A0A 50%, #050505 100%)',
            willChange: 'opacity',
          }}
        />
        
        {/* Subtle warm spotlight - barely visible */}
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: stage !== 'spotlight' ? 0.4 : 0.15,
            scale: 1 
          }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 50% 35%, rgba(255, 252, 245, 0.06) 0%, transparent 70%)',
          }}
        />

        {/* Golden shimmer particles - active during price reveal */}
        <GoldenShimmer isActive={stage === 'price' || stage === 'savings' || stage === 'details'} isMobile={isMobile} />

        {/* Soft edge vignette for cinematic framing */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 40%, rgba(0,0,0,0.4) 100%)',
          }}
        />

        {/* Motor Image - Refined entrance with mobile positioning */}
        <AnimatePresence>
          {(stage !== 'spotlight') && (
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.7, filter: isMobile ? 'blur(8px)' : 'blur(12px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ 
                duration: 1.8, 
                ease: [0.16, 1, 0.3, 1],
                scale: { duration: 2.2, ease: [0.16, 1, 0.3, 1] }
              }}
              className="absolute top-[8%] md:top-[10%] z-10"
            >
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt={motorName}
                  className="h-28 md:h-44 object-contain"
                  style={{
                    filter: 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.6))',
                  }}
                />
              ) : (
                <img 
                  src={harrisLogoWhite}
                  alt="Harris Boat Works"
                  className="h-20 md:h-32 w-auto object-contain"
                  style={{
                    filter: 'drop-shadow(0 4px 20px rgba(255, 255, 255, 0.15))',
                    opacity: 0.9,
                  }}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Motor Name - Editorial display type, neutral halo */}
        <AnimatePresence>
          {(stage !== 'spotlight') && (
            <motion.h2
              initial={{ opacity: 0, y: 20, filter: 'blur(4px)', scale: 0.95 }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
              transition={{ duration: 1.2, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              className="absolute top-[26%] md:top-[34%] font-display text-xl md:text-3xl font-medium text-center px-4"
              style={{
                color: 'rgba(245, 241, 234, 0.95)',
                letterSpacing: '-0.02em',
                textShadow: '0 2px 18px rgba(0, 0, 0, 0.5)',
              }}
            >
              {motorName}
            </motion.h2>
          )}
        </AnimatePresence>

        {/* MSRP Display - Shows briefly with strikethrough */}
        <AnimatePresence>
          {(stage === 'msrp' || stage === 'price' || stage === 'savings' || stage === 'details' || stage === 'complete') && msrp && msrp > finalPrice && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: stage === 'msrp' ? 1 : 0.4, y: 0 }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
              className="absolute top-[32%] md:top-[40%] flex flex-col items-center"
            >
              <motion.span
                className="text-[10px] md:text-[11px] font-medium uppercase mb-1.5"
                style={{ color: 'rgba(245, 241, 234, 0.5)', letterSpacing: '0.22em' }}
              >
                MSRP
              </motion.span>
              <motion.span
                className="font-display text-xl md:text-2xl tabular-nums relative"
                style={{ color: 'rgba(245, 241, 234, 0.55)', letterSpacing: '-0.02em' }}
              >
                {money(msrp)}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="absolute top-1/2 left-0 right-0 h-px origin-left"
                  style={{ background: 'rgba(245, 241, 234, 0.45)' }}
                />
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>


        {/* Price Display - Elegant serif with separate glow layer (fixes gold box bug) */}
        <AnimatePresence>
          {(stage === 'price' || stage === 'savings' || stage === 'details' || stage === 'complete') && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
              className="absolute top-[38%] md:top-[48%] flex flex-col items-center"
            >
              <motion.span
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-[10px] md:text-[11px] font-medium uppercase mb-3"
                style={{ color: 'rgba(245, 241, 234, 0.65)', letterSpacing: '0.22em' }}
              >
                Your Price
              </motion.span>

              {/* Price with savings badge */}
              <div className="relative">
              {/* Soft warm halo behind the price - restrained */}
                {priceComplete && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: [0.18, 0.32, 0.18],
                      scale: [1, 1.05, 1],
                    }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute inset-0 -m-6 blur-2xl pointer-events-none"
                    style={{
                      background: 'radial-gradient(circle, rgba(245, 241, 234, 0.35) 0%, transparent 70%)',
                    }}
                  />
                )}

                {/* Price text - luminous off-white, subtle breathing */}
                <motion.span
                  className="relative z-10 font-display text-4xl md:text-6xl font-semibold tabular-nums"
                  style={{
                    color: 'rgba(250, 248, 244, 0.98)',
                    letterSpacing: '-0.03em',
                  }}
                  animate={
                    priceComplete
                      ? {
                          filter: ['brightness(1)', 'brightness(1.08)', 'brightness(1)'],
                        }
                      : { filter: 'brightness(1)' }
                  }
                  transition={
                    priceComplete
                      ? { duration: 3.5, repeat: Infinity, ease: 'easeInOut' }
                      : undefined
                  }
                >
                  {money(displayPrice)}
                </motion.span>

                {/* "+ HST" suffix - appears after price counter completes */}
                <AnimatePresence>
                  {priceComplete && (
                    <motion.span
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 0.55, x: 0 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                      className="absolute -right-16 md:-right-20 bottom-1 md:bottom-2 text-xs md:text-sm font-medium"
                      style={{ color: 'rgba(245, 241, 234, 0.55)', letterSpacing: '0.04em' }}
                    >
                      + HST
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              {/* Savings badge - hairline-framed chip, no neon */}
              <AnimatePresence>
                {showSavingsBadge && savingsPercent > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                    className="mt-4 inline-flex items-baseline gap-2 rounded-full px-4 py-1.5"
                    style={{
                      border: '1px solid rgba(245, 241, 234, 0.25)',
                      background: 'rgba(245, 241, 234, 0.04)',
                    }}
                  >
                    <span
                      className="font-display font-semibold tabular-nums text-sm md:text-base"
                      style={{ color: 'rgba(250, 248, 244, 0.95)', letterSpacing: '-0.02em' }}
                    >
                      {savingsPercent}%
                    </span>
                    <span
                      className="text-[10px] md:text-[11px] font-medium uppercase"
                      style={{ color: 'rgba(245, 241, 234, 0.6)', letterSpacing: '0.22em' }}
                    >
                      Saved
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Monthly payment teaser */}
              {showMonthlyPayment && (
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 0.7, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  className="mt-4 text-sm md:text-base font-display"
                  style={{ color: 'rgba(245, 241, 234, 0.65)', letterSpacing: '-0.01em' }}
                >
                  Or just {money(monthlyPayment)}/mo
                </motion.span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Details - Minimal elegant lines with refined stagger */}
        <AnimatePresence>
          {(stage === 'details' || stage === 'complete') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="absolute top-[68%] md:top-[78%] flex gap-10 md:gap-16 items-start"
            >
              {savings > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
                  className="text-center"
                >
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                    className="block text-[10px] md:text-[11px] font-medium uppercase mb-2"
                    style={{ color: 'rgba(245, 241, 234, 0.55)', letterSpacing: '0.22em' }}
                  >
                    {tradeInValue && tradeInValue > 0 ? 'Savings + Trade-In' : 'Total Savings'}
                  </motion.span>
                  <span
                    className="font-display text-lg md:text-xl font-semibold tabular-nums"
                    style={{ color: 'rgba(250, 248, 244, 0.95)', letterSpacing: '-0.02em' }}
                  >
                    {money(savings)}
                  </span>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
                className="text-center"
              >
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.4 }}
                  className="flex items-center justify-center gap-1.5 text-[10px] md:text-[11px] font-medium uppercase mb-2"
                  style={{ color: 'rgba(245, 241, 234, 0.55)', letterSpacing: '0.22em' }}
                >
                  <Shield className="w-3 h-3" strokeWidth={1.5} />
                  Coverage
                </motion.span>
                <span
                  className="font-display text-lg md:text-xl font-semibold"
                  style={{ color: 'rgba(250, 248, 244, 0.95)', letterSpacing: '-0.02em' }}
                >
                  {coverageYears} Years
                </span>
              </motion.div>

              {/* Selected Promo Bonus */}
              {selectedPromoOption && selectedPromoValue && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.7, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
                  className="text-center"
                >
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9, duration: 0.4 }}
                    className="block text-[10px] md:text-[11px] font-medium uppercase mb-2"
                    style={{ color: 'rgba(245, 241, 234, 0.55)', letterSpacing: '0.22em' }}
                  >
                    Your Bonus
                  </motion.span>
                  <span
                    className="font-display text-lg md:text-xl font-semibold"
                    style={{ color: 'rgba(250, 248, 244, 0.95)', letterSpacing: '-0.02em' }}
                  >
                    {getPromoLabel(selectedPromoOption, selectedPromoValue)}
                  </span>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>


        {/* Skip Intro button with label - smooth fade transition, better touch target */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: isSkipping ? 0 : 0.5 }}
          whileHover={{ opacity: isSkipping ? 0 : 0.9 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          onClick={handleSkip}
          disabled={isSkipping}
          className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-2 px-4 py-3 md:px-3 md:py-2 min-h-[44px] min-w-[44px] rounded-full transition-colors hover:bg-white/5"
          style={{
            color: 'rgba(245, 241, 234, 0.6)',
            paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
          }}
          aria-label="Skip intro"
        >
          <span className="text-[11px] font-medium uppercase" style={{ letterSpacing: '0.22em' }}>Skip</span>
          <X className="h-4 w-4" strokeWidth={1.5} />
        </motion.button>


        {/* Tap to skip hint - mobile only */}
        <AnimatePresence>
          {isMobile && showTapHint && canTapToSkip && !isSkipping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-16 text-[11px] font-medium uppercase"
              style={{ color: 'rgba(245, 241, 234, 0.5)', letterSpacing: '0.22em' }}
            >
              Tap anywhere to continue
            </motion.div>
          )}
        </AnimatePresence>

        {/* Subtle horizontal hairline accent — warm cream */}
        <AnimatePresence>
          {(stage === 'details' || stage === 'complete') && (
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              className="absolute top-[64%] md:top-[74%] w-24 h-px origin-center"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(245, 241, 234, 0.35), transparent)' }}
            />
          )}
        </AnimatePresence>

        {/* Mercury Marine Authorized Dealer Badge - Premium bottom placement */}
        <AnimatePresence>
          {(stage === 'details' || stage === 'complete') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 0.75, y: 0 }}
              transition={{ duration: 0.8, delay: 1, ease: [0.25, 0.1, 0.25, 1] }}
              className="absolute bottom-10 md:bottom-12 flex flex-col items-center gap-2.5"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              <span
                className="text-[9px] md:text-[10px] uppercase font-medium"
                style={{ color: 'rgba(245, 241, 234, 0.5)', letterSpacing: '0.3em' }}
              >
                Authorized Dealer
              </span>
              <img
                src={mercuryLogo}
                alt="Mercury Marine"
                className="h-5 md:h-7 w-auto"
                style={{
                  filter: 'brightness(0) invert(1)',
                  opacity: 0.7,
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auto-close countdown progress bar with safe area */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="absolute bottom-0 left-0 right-0 h-px bg-white/10"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <motion.div
            className="h-full"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, rgba(245, 241, 234, 0.55), rgba(245, 241, 234, 0.2))',
            }}
          />
        </motion.div>

      </motion.div>
    </AnimatePresence>
  );
}
