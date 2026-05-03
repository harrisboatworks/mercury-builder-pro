import { motion, AnimatePresence } from 'framer-motion';
import { Scale, ArrowRight, X } from 'lucide-react';
import type { ComparisonMotor } from '@/hooks/useMotorComparison';

interface ComparisonFloatingBarProps {
  motors: ComparisonMotor[];
  onOpen: () => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

/**
 * Persistent bottom-right (desktop) / bottom-full (mobile) bar that appears
 * as soon as the user adds a motor to comparison. Tells them what to do next
 * ("Compare X/3 motors →") and shows the picked motors as removable thumbs.
 */
export function ComparisonFloatingBar({
  motors,
  onOpen,
  onRemove,
  onClear,
}: ComparisonFloatingBarProps) {
  const count = motors.length;
  const canCompare = count >= 2;

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-[80] sm:max-w-[520px]"
        >
          <div className="bg-repower-navy-900 text-repower-cream rounded-2xl shadow-2xl border border-repower-gold/20 px-3 py-2.5 sm:px-4 sm:py-3 flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 shrink-0">
              <Scale size={16} className="text-repower-gold" />
              <span className="text-xs font-semibold uppercase tracking-wider text-repower-gold whitespace-nowrap">
                {count}/3
              </span>
            </div>

            {/* Numbered model name list */}
            <ul className="flex flex-col min-w-0 flex-1 leading-tight">
              {motors.map((m, i) => (
                <li
                  key={m.id}
                  className="flex flex-row items-start gap-1.5 min-w-0 h-5"
                >
                  <span className="text-[11px] font-bold text-repower-gold/80 shrink-0 tabular-nums w-3.5 leading-none">
                    {i + 1}.
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-repower-cream truncate leading-none">
                    {m.model}
                  </span>
                  <button
                    onClick={() => onRemove(m.id)}
                    aria-label={`Remove ${m.model} from comparison`}
                    className="ml-auto shrink-0 w-4 h-4 rounded-full text-repower-cream/40 hover:text-repower-mercury-red opacity-60 hover:opacity-100 focus:opacity-100 transition flex items-center justify-center"
                  >
                    <X size={11} strokeWidth={2.5} />
                  </button>
                </li>
              ))}
            </ul>

            <button
              onClick={onOpen}
              disabled={!canCompare}
              className="shrink-0 inline-flex items-center gap-1.5 bg-repower-gold hover:bg-repower-gold/90 disabled:bg-repower-cream/15 disabled:text-repower-cream/40 disabled:cursor-not-allowed text-repower-navy-900 font-bold text-xs sm:text-sm uppercase tracking-wide px-3 sm:px-4 py-2 rounded-lg transition-colors"
            >
              <span className="hidden xs:inline sm:inline">
                {canCompare ? 'Compare' : 'Add 1 more'}
              </span>
              <span className="xs:hidden sm:hidden">
                {canCompare ? 'Go' : '+1'}
              </span>
              {canCompare && <ArrowRight size={14} />}
            </button>

            <button
              onClick={onClear}
              aria-label="Clear comparison"
              className="shrink-0 w-7 h-7 rounded-full hover:bg-repower-cream/10 text-repower-cream/50 hover:text-repower-cream flex items-center justify-center transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {!canCompare && (
            <p className="text-[10px] text-repower-cream/60 text-center mt-1.5 sm:hidden">
              Pick at least 2 motors to compare
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
