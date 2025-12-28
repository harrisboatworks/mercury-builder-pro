import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { money } from '@/lib/quote-utils';
import { Shield, Award, Sparkles, Check } from 'lucide-react';

interface QuoteRevealCinematicProps {
  isVisible: boolean;
  onComplete: () => void;
  motorName: string;
  finalPrice: number;
  savings: number;
  coverageYears: number;
  imageUrl?: string;
}

export function QuoteRevealCinematic({
  isVisible,
  onComplete,
  motorName,
  finalPrice,
  savings,
  coverageYears,
  imageUrl
}: QuoteRevealCinematicProps) {
  const [stage, setStage] = useState<'spotlight' | 'motor' | 'price' | 'details' | 'complete'>('spotlight');
  const [displayPrice, setDisplayPrice] = useState(0);
  const { playReveal, playSwoosh, playTick, playComplete } = useSoundEffects();
  const priceIntervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!isVisible) {
      setStage('spotlight');
      setDisplayPrice(0);
      return;
    }

    // Stage progression with sound
    const timeline = [
      { stage: 'spotlight' as const, delay: 0, sound: playReveal },
      { stage: 'motor' as const, delay: 600, sound: playSwoosh },
      { stage: 'price' as const, delay: 1400, sound: null },
      { stage: 'details' as const, delay: 3200, sound: playComplete },
      { stage: 'complete' as const, delay: 4500, sound: null },
    ];

    const timeouts: NodeJS.Timeout[] = [];

    timeline.forEach(({ stage, delay, sound }) => {
      const timeout = setTimeout(() => {
        setStage(stage);
        if (sound) sound();
      }, delay);
      timeouts.push(timeout);
    });

    // Complete callback
    const completeTimeout = setTimeout(onComplete, 5000);
    timeouts.push(completeTimeout);

    return () => {
      timeouts.forEach(clearTimeout);
      if (priceIntervalRef.current) clearInterval(priceIntervalRef.current);
    };
  }, [isVisible, onComplete, playReveal, playSwoosh, playComplete]);

  // Price counting animation
  useEffect(() => {
    if (stage !== 'price') return;

    const duration = 1500;
    const steps = 30;
    const increment = finalPrice / steps;
    let current = 0;

    priceIntervalRef.current = setInterval(() => {
      current += increment;
      if (current >= finalPrice) {
        setDisplayPrice(finalPrice);
        if (priceIntervalRef.current) clearInterval(priceIntervalRef.current);
      } else {
        setDisplayPrice(Math.floor(current));
        playTick();
      }
    }, duration / steps);

    return () => {
      if (priceIntervalRef.current) clearInterval(priceIntervalRef.current);
    };
  }, [stage, finalPrice, playTick]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      >
        {/* Dark overlay with spotlight */}
        <motion.div 
          className="absolute inset-0 bg-black/95"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
        
        {/* Animated spotlight gradient */}
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ 
            opacity: stage !== 'spotlight' ? 0.8 : 0.3,
            scale: 1 
          }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            background: 'radial-gradient(circle at 50% 40%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)',
          }}
        />

        {/* Motor Image */}
        <AnimatePresence>
          {(stage === 'motor' || stage === 'price' || stage === 'details' || stage === 'complete') && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
              className="absolute top-[15%] z-10"
            >
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt={motorName}
                  className="h-40 md:h-56 object-contain drop-shadow-2xl"
                />
              ) : (
                <div className="h-40 md:h-56 w-40 md:w-56 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Sparkles className="h-16 w-16 text-primary/50" />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Motor Name */}
        <AnimatePresence>
          {(stage === 'motor' || stage === 'price' || stage === 'details' || stage === 'complete') && (
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="absolute top-[38%] md:top-[42%] text-xl md:text-2xl font-medium text-white/90 text-center px-4"
            >
              {motorName}
            </motion.h2>
          )}
        </AnimatePresence>

        {/* Price Display */}
        <AnimatePresence>
          {(stage === 'price' || stage === 'details' || stage === 'complete') && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
              className="absolute top-[46%] md:top-[50%] flex flex-col items-center"
            >
              <span className="text-sm text-white/60 mb-2">Your Price</span>
              <span className="text-5xl md:text-7xl font-bold text-white tabular-nums tracking-tight">
                {money(displayPrice)}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Details */}
        <AnimatePresence>
          {(stage === 'details' || stage === 'complete') && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute top-[64%] md:top-[68%] flex flex-col md:flex-row gap-4 md:gap-8 items-center"
            >
              {savings > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full"
                >
                  <Check className="h-4 w-4" />
                  <span className="font-semibold">You Save {money(savings)}</span>
                </motion.div>
              )}
              
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                className="flex items-center gap-2 bg-blue-500/20 text-blue-400 px-4 py-2 rounded-full"
              >
                <Shield className="h-4 w-4" />
                <span className="font-semibold">{coverageYears} Year Coverage</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skip button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          whileHover={{ opacity: 1 }}
          transition={{ delay: 1 }}
          onClick={onComplete}
          className="absolute bottom-8 text-white/50 hover:text-white text-sm underline underline-offset-4"
        >
          Skip intro
        </motion.button>

        {/* Particle effects */}
        {stage === 'details' && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-primary/50 rounded-full"
                initial={{
                  x: '50%',
                  y: '50%',
                  opacity: 0,
                }}
                animate={{
                  x: `${50 + (Math.random() - 0.5) * 100}%`,
                  y: `${50 + (Math.random() - 0.5) * 100}%`,
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.05,
                  ease: 'easeOut',
                }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
