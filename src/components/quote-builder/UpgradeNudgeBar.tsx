"use client";
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Shield } from 'lucide-react';
import { money } from "@/lib/money";
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useSound } from '@/contexts/SoundContext';

interface UpgradeNudgeBarProps {
  isVisible: boolean;
  coverageGain: number; // Years gained by upgrading
  monthlyDelta: number; // Additional monthly cost
  upgradeToLabel: string; // e.g. "Complete"
  onUpgrade: () => void;
  promoMessage?: string; // e.g., "Keeps your 2.99% APR"
}

export function UpgradeNudgeBar({
  isVisible,
  coverageGain,
  monthlyDelta,
  upgradeToLabel,
  onUpgrade,
  promoMessage,
}: UpgradeNudgeBarProps) {
  const { triggerHaptic } = useHapticFeedback();
  const { playPackageSelect } = useSound();

  const handleUpgrade = () => {
    triggerHaptic('medium');
    playPackageSelect();
    onUpgrade();
  };

  // Don't show if no coverage gain
  if (coverageGain <= 0) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 25,
            delay: 0.2
          }}
          className="relative overflow-hidden rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 via-white to-blue-50 p-3 sm:p-4 shadow-sm"
        >
          {/* Animated background shimmer */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-100/50 to-transparent"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            {/* Left side - Benefits */}
            <div className="flex items-center gap-3">
              {/* Shield icon - hidden on mobile for cleaner look */}
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                className="hidden sm:flex flex-shrink-0 rounded-full bg-blue-100 p-2"
              >
                <Shield className="h-5 w-5 text-blue-600" />
              </motion.div>
              
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-semibold text-slate-900">
                    Get{' '}
                    <motion.span 
                      className="text-blue-600"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      +{coverageGain} years
                    </motion.span>
                    {' '}more coverage
                  </span>
                  {promoMessage && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700 font-medium">
                      {promoMessage}
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-600">
                  Upgrade to {upgradeToLabel} for just{' '}
                  <span className="font-semibold text-emerald-600">
                    +{money(Math.round(monthlyDelta))}/mo
                  </span>
                </p>
              </div>
            </div>

            {/* Right side - CTA Button */}
            <motion.button
              onClick={handleUpgrade}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <span>Upgrade to {upgradeToLabel}</span>
              <motion.span
                className="inline-flex"
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <ArrowRight className="h-4 w-4" />
              </motion.span>
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default UpgradeNudgeBar;
