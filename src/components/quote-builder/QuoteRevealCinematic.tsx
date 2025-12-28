import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { money } from '@/lib/quote-utils';
import { X } from 'lucide-react';

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

    // Slower, more deliberate timeline for luxury feel
    const timeline = [
      { stage: 'spotlight' as const, delay: 0, sound: playReveal },
      { stage: 'motor' as const, delay: 1000, sound: playSwoosh },
      { stage: 'price' as const, delay: 2200, sound: null },
      { stage: 'details' as const, delay: 4500, sound: playComplete },
      { stage: 'complete' as const, delay: 6000, sound: null },
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
    const completeTimeout = setTimeout(onComplete, 6500);
    timeouts.push(completeTimeout);

    return () => {
      timeouts.forEach(clearTimeout);
      if (priceIntervalRef.current) clearInterval(priceIntervalRef.current);
    };
  }, [isVisible, onComplete, playReveal, playSwoosh, playComplete]);

  // Smoother price counting animation
  useEffect(() => {
    if (stage !== 'price') return;

    const duration = 2000;
    const steps = 50;
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

        {/* Soft edge vignette for cinematic framing */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 40%, rgba(0,0,0,0.4) 100%)',
          }}
        />

        {/* Motor Image */}
        <AnimatePresence>
          {(stage === 'motor' || stage === 'price' || stage === 'details' || stage === 'complete') && (
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
              className="absolute top-[12%] z-10"
            >
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt={motorName}
                  className="h-36 md:h-52 object-contain"
                  style={{
                    filter: 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.6))',
                  }}
                />
              ) : (
                <div 
                  className="h-36 md:h-52 w-36 md:w-52 rounded-full flex items-center justify-center"
                  style={{
                    background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)',
                  }}
                >
                  <span className="text-5xl text-white/20">⚓</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Motor Name - Luxury serif typography */}
        <AnimatePresence>
          {(stage === 'motor' || stage === 'price' || stage === 'details' || stage === 'complete') && (
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
              className="absolute top-[36%] md:top-[38%] font-playfair text-xl md:text-2xl font-normal tracking-wide text-center px-4"
              style={{ color: '#F5F5F5' }}
            >
              {motorName}
            </motion.h2>
          )}
        </AnimatePresence>

        {/* Price Display - Elegant serif with muted label */}
        <AnimatePresence>
          {(stage === 'price' || stage === 'details' || stage === 'complete') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="absolute top-[44%] md:top-[46%] flex flex-col items-center"
            >
              <span 
                className="text-[10px] md:text-xs uppercase tracking-[0.25em] mb-3"
                style={{ color: '#6B7280' }}
              >
                Your Price
              </span>
              <span 
                className="font-playfair text-4xl md:text-6xl font-medium tabular-nums tracking-tight"
                style={{ color: '#FAFAFA' }}
              >
                {money(displayPrice)}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Details - Minimal elegant lines */}
        <AnimatePresence>
          {(stage === 'details' || stage === 'complete') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="absolute top-[60%] md:top-[64%] flex gap-12 md:gap-20 items-start"
            >
              {savings > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="text-center"
                >
                  <span 
                    className="block text-[10px] uppercase tracking-[0.2em] mb-2"
                    style={{ color: '#6B7280' }}
                  >
                    Savings
                  </span>
                  <span 
                    className="font-playfair text-lg md:text-xl"
                    style={{ color: '#E5E7EB' }}
                  >
                    {money(savings)}
                  </span>
                </motion.div>
              )}
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-center"
              >
                <span 
                  className="block text-[10px] uppercase tracking-[0.2em] mb-2"
                  style={{ color: '#6B7280' }}
                >
                  Coverage
                </span>
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

        {/* Subtle dismiss button - appears after 2s */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          whileHover={{ opacity: 0.8 }}
          transition={{ delay: 2, duration: 0.5 }}
          onClick={onComplete}
          className="absolute top-6 right-6 p-2 rounded-full transition-colors"
          style={{ color: '#9CA3AF' }}
          aria-label="Skip intro"
        >
          <X className="h-5 w-5" />
        </motion.button>

        {/* Subtle horizontal line accent */}
        <AnimatePresence>
          {(stage === 'details' || stage === 'complete') && (
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
              className="absolute top-[56%] md:top-[59%] w-24 h-px origin-center"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
