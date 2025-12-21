"use client";
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Shield } from 'lucide-react';
import { money } from "@/lib/money";
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface UpgradeNudgeBarProps {
  isVisible: boolean;
  coverageGain: number; // Years gained by upgrading
  monthlyDelta: number; // Additional monthly cost
  upgradeToLabel: string; // e.g. "Complete"
  onUpgrade: () => void;
}

export function UpgradeNudgeBar({
  isVisible,
  coverageGain,
  monthlyDelta,
  upgradeToLabel,
  onUpgrade,
}: UpgradeNudgeBarProps) {
  const { triggerHaptic } = useHapticFeedback();

  const handleUpgrade = () => {
    triggerHaptic('medium');
    onUpgrade();
  };

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
          className="relative overflow-hidden rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 via-white to-blue-50 p-4 shadow-sm dark:border-blue-800/50 dark:from-blue-950/40 dark:via-slate-900 dark:to-blue-950/40"
        >
          {/* Animated background shimmer */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-100/50 to-transparent dark:via-blue-500/10"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Left side - Benefits */}
            <div className="flex items-start gap-3">
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
                className="flex-shrink-0 rounded-full bg-blue-100 p-2 dark:bg-blue-900/50"
              >
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </motion.div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    Get{' '}
                    <motion.span 
                      className="text-blue-600 dark:text-blue-400"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      +{coverageGain} years
                    </motion.span>
                    {' '}more coverage
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Upgrade to {upgradeToLabel} for just{' '}
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
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
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              <span>Upgrade to {upgradeToLabel}</span>
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <ArrowRight className="h-4 w-4" />
              </motion.div>
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default UpgradeNudgeBar;
