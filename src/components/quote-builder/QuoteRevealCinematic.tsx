import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSound } from '@/contexts/SoundContext';
import { money, calculateMonthly } from '@/lib/quote-utils';
import { X, Shield, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import harrisLogo from '@/assets/harris-logo.png';
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
}

// Haptic feedback utility for mobile devices
const triggerHaptic = (pattern: 'light' | 'medium' | 'success' = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [25],
      success: [15, 50, 15], // Double tap celebration
    };
    try {
      navigator.vibrate(patterns[pattern]);
    } catch {
      // Silently fail if vibration not supported
    }
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

// Golden shimmer particles component
function GoldenShimmer({ isActive }: { isActive: boolean }) {
  if (!isActive) return null;
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(12)].map((_, i) => (
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
  imageUrl
}: QuoteRevealCinematicProps) {
  const [stage, setStage] = useState<'spotlight' | 'motor' | 'msrp' | 'price' | 'savings' | 'details' | 'complete'>('spotlight');
  const [displayPrice, setDisplayPrice] = useState(0);
  const [priceComplete, setPriceComplete] = useState(false);
  const [showSavingsBadge, setShowSavingsBadge] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [progress, setProgress] = useState(0);
  const { playReveal, playSwoosh, playTick, playComplete, playAmbientPad, playCelebration } = useSound();
  const priceIntervalRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<number>(0);
  
  const TOTAL_DURATION = 12500; // Match the auto-close timing
  
  // Calculate savings percentage
  const savingsPercent = msrp && msrp > 0 ? Math.round((savings / msrp) * 100) : 0;
  
  // Calculate monthly payment
  const monthlyPayment = calculateMonthly(finalPrice);

  // Smooth skip handler with fade-out animation
  const handleSkip = () => {
    if (isSkipping) return;
    setIsSkipping(true);
    // Fade out over 500ms, then complete
    setTimeout(onComplete, 500);
  };

  // Haptic feedback when price completes
  useEffect(() => {
    if (priceComplete) {
      triggerHaptic('medium');
    }
  }, [priceComplete]);

  // Haptic feedback when savings badge appears
  useEffect(() => {
    if (showSavingsBadge) {
      triggerHaptic('success');
    }
  }, [showSavingsBadge]);

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
      return;
    }

    // Play ambient pad at start for immersive atmosphere
    playAmbientPad();

    // Extended luxury timeline with MSRP flash
    const timeline = [
      { stage: 'spotlight' as const, delay: 0, sound: playReveal },
      { stage: 'motor' as const, delay: 1000, sound: playSwoosh },
      { stage: 'msrp' as const, delay: 2500, sound: null }, // MSRP flash
      { stage: 'price' as const, delay: 3500, sound: null }, // Price countdown
      { stage: 'savings' as const, delay: 5800, sound: () => { playCelebration?.(); triggerPremiumConfetti(); } }, // Savings celebration
      { stage: 'details' as const, delay: 7200, sound: playComplete },
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

    // Complete callback - extended by 3 seconds for final reveal
    const completeTimeout = setTimeout(onComplete, 12500);
    timeouts.push(completeTimeout);

    return () => {
      timeouts.forEach(clearTimeout);
      if (priceIntervalRef.current) clearInterval(priceIntervalRef.current);
    };
  }, [isVisible, onComplete, playReveal, playSwoosh, playComplete, playAmbientPad, playCelebration]);

  // Smoother price counting animation
  useEffect(() => {
    if (stage !== 'price' && stage !== 'savings' && stage !== 'details' && stage !== 'complete') return;
    if (priceComplete) return;

    const duration = 2000;
    const steps = 50;
    const increment = finalPrice / steps;
    let current = 0;

    priceIntervalRef.current = setInterval(() => {
      current += increment;
      if (current >= finalPrice) {
        setDisplayPrice(finalPrice);
        setPriceComplete(true);
        if (priceIntervalRef.current) clearInterval(priceIntervalRef.current);
      } else {
        setDisplayPrice(Math.floor(current));
        playTick();
      }
    }, duration / steps);

    return () => {
      if (priceIntervalRef.current) clearInterval(priceIntervalRef.current);
    };
  }, [stage, finalPrice, playTick, priceComplete]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isSkipping ? 0 : 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: isSkipping ? 0.5 : 0.3 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      >
        {/* Near-black background with subtle vignette */}
        <motion.div 
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          style={{
            background: 'radial-gradient(ellipse at center, #0F0F0F 0%, #0A0A0A 50%, #050505 100%)',
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
        <GoldenShimmer isActive={stage === 'price' || stage === 'savings' || stage === 'details'} />

        {/* Soft edge vignette for cinematic framing */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 40%, rgba(0,0,0,0.4) 100%)',
          }}
        />

        {/* Motor Image - Refined entrance */}
        <AnimatePresence>
          {(stage !== 'spotlight') && (
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.9, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 1.4, ease: [0.25, 0.1, 0.25, 1] }}
              className="absolute top-[10%] z-10"
            >
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt={motorName}
                  className="h-32 md:h-44 object-contain"
                  style={{
                    filter: 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.6))',
                  }}
                />
              ) : (
                <img 
                  src={harrisLogo}
                  alt="Harris Boat Works"
                  className="h-24 md:h-32 w-auto object-contain"
                  style={{
                    filter: 'brightness(0) invert(1) drop-shadow(0 4px 20px rgba(255, 255, 255, 0.15))',
                    opacity: 0.9,
                  }}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Motor Name - Luxury serif typography with refined blur entrance */}
        <AnimatePresence>
          {(stage !== 'spotlight') && (
            <motion.h2
              initial={{ opacity: 0, y: 20, filter: 'blur(4px)', scale: 0.95 }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
              transition={{ duration: 1.2, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              className="absolute top-[32%] md:top-[34%] font-playfair text-lg md:text-2xl font-normal tracking-wide text-center px-4"
              style={{ color: '#F5F5F5' }}
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
              className="absolute top-[38%] md:top-[40%] flex flex-col items-center"
            >
              <motion.span 
                className="text-[10px] md:text-xs uppercase tracking-[0.25em] mb-1"
                style={{ color: '#6B7280' }}
              >
                MSRP
              </motion.span>
              <motion.span 
                className="font-playfair text-xl md:text-2xl tabular-nums relative"
                style={{ color: '#6B7280' }}
              >
                {money(msrp)}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500/70 origin-left"
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
              className="absolute top-[46%] md:top-[48%] flex flex-col items-center"
            >
              <motion.span 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-[10px] md:text-xs uppercase tracking-[0.25em] mb-3"
                style={{ color: 'hsl(var(--promo-gold-1))' }}
              >
                Your Price
              </motion.span>
              
              {/* Price with savings badge */}
              <div className="relative">
              {/* Pulsing glow BEHIND the price text - enhanced breathing */}
                {priceComplete && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: [0.2, 0.5, 0.2],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute inset-0 -m-8 blur-2xl pointer-events-none"
                    style={{
                      background: 'radial-gradient(circle, rgba(212,175,55,0.5) 0%, transparent 70%)',
                    }}
                  />
                )}
                
                {/* Price text - with enhanced breathing animation */}
                <motion.span
                  className="relative z-10 font-playfair text-4xl md:text-6xl font-medium tabular-nums tracking-tight"
                  style={{
                    color: priceComplete ? 'hsl(var(--promo-gold-1))' : 'hsl(0 0% 98%)',
                  }}
                  animate={
                    priceComplete
                      ? { 
                          filter: ['brightness(1)', 'brightness(1.2)', 'brightness(1)'],
                          scale: [1, 1.02, 1],
                        }
                      : { filter: 'brightness(1)', scale: 1 }
                  }
                  transition={
                    priceComplete
                      ? { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
                      : undefined
                  }
                >
                  {money(displayPrice)}
                </motion.span>
                
                {/* Pulsing glow ring around price when complete */}
                {priceComplete && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: [0, 0.3, 0], scale: [1, 1.3, 1.5] }}
                    transition={{ duration: 1.5, repeat: 1 }}
                    className="absolute inset-0 -m-4 rounded-full pointer-events-none"
                    style={{
                      background: 'radial-gradient(circle, rgba(212,175,55,0.3) 0%, transparent 70%)',
                    }}
                  />
                )}
                
                {/* Savings percentage badge */}
                <AnimatePresence>
                  {showSavingsBadge && savingsPercent > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5, x: 20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      className="absolute -top-3 -right-3 md:-top-4 md:-right-4 flex items-center gap-1 px-2 py-1 rounded-full text-xs md:text-sm font-semibold shadow-lg"
                      style={{
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        color: '#FFFFFF',
                        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                      }}
                    >
                      <Sparkles className="w-3 h-3" />
                      Save {savingsPercent}%
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Monthly payment teaser */}
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.7, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="mt-3 text-sm md:text-base"
                style={{ color: '#9CA3AF' }}
              >
                Or just {money(monthlyPayment.amount)}/mo
              </motion.span>
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
              className="absolute top-[68%] md:top-[72%] flex gap-10 md:gap-16 items-start"
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
                    className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-[0.2em] mb-2"
                    style={{ color: '#10B981' }}
                  >
                    <Sparkles className="w-3 h-3" />
                    Total Savings
                  </motion.span>
                  <span 
                    className="font-playfair text-lg md:text-xl font-medium"
                    style={{ color: '#10B981' }}
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
                  className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-[0.2em] mb-2"
                  style={{ color: '#6B7280' }}
                >
                  <Shield className="w-3 h-3" />
                  Coverage
                </motion.span>
                <span 
                  className="font-playfair text-lg md:text-xl"
                  style={{ color: '#E5E7EB' }}
                >
                  {coverageYears} Years
                </span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skip Intro button with label - smooth fade transition */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: isSkipping ? 0 : 0.5 }}
          whileHover={{ opacity: isSkipping ? 0 : 0.9 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          onClick={handleSkip}
          disabled={isSkipping}
          className="absolute top-6 right-6 flex items-center gap-2 px-3 py-2 rounded-full transition-colors hover:bg-white/5"
          style={{ color: '#9CA3AF' }}
          aria-label="Skip intro"
        >
          <span className="text-xs font-medium tracking-wide">Skip Intro</span>
          <X className="h-4 w-4" />
        </motion.button>

        {/* Subtle horizontal line accent with refined animation */}
        <AnimatePresence>
          {(stage === 'details' || stage === 'complete') && (
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              className="absolute top-[64%] md:top-[68%] w-24 h-px origin-center"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)' }}
            />
          )}
        </AnimatePresence>

        {/* Mercury Marine Authorized Dealer Badge - Premium bottom placement */}
        <AnimatePresence>
          {(stage === 'details' || stage === 'complete') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 0.7, y: 0 }}
              transition={{ duration: 0.8, delay: 1, ease: [0.25, 0.1, 0.25, 1] }}
              className="absolute bottom-8 md:bottom-12 flex flex-col items-center gap-2"
            >
              <span 
                className="text-[8px] md:text-[10px] uppercase tracking-[0.3em] font-medium"
                style={{ color: '#9CA3AF' }}
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

        {/* Auto-close countdown progress bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10"
        >
          <motion.div
            className="h-full"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, hsl(var(--promo-gold-1)), rgba(212,175,55,0.5))',
            }}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}