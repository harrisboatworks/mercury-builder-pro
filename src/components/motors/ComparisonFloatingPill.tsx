import React from 'react';
import { Scale } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ComparisonFloatingPillProps {
  count: number;
  onClick: () => void;
  className?: string;
}

export function ComparisonFloatingPill({ count, onClick, className }: ComparisonFloatingPillProps) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.button
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          onClick={onClick}
          className={cn(
            'fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-40',
            'flex items-center gap-2 px-4 py-2.5',
            'bg-black text-white rounded-full shadow-lg',
            'hover:bg-gray-800 transition-colors',
            'active:scale-95',
            className
          )}
        >
          <Scale size={18} />
          <span className="font-medium text-sm">
            Compare ({count})
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
