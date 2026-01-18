import { useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import type { Motor } from '@/components/QuoteBuilder';

interface StockCountIndicatorProps {
  motors: Motor[];
  onFilterInStock?: () => void;
}

export function StockCountIndicator({ motors, onFilterInStock }: StockCountIndicatorProps) {
  const [animateCount, setAnimateCount] = useState(false);
  
  const inStockCount = useMemo(() => {
    return motors.filter(m => m.in_stock).length;
  }, [motors]);

  // Subscribe to real-time stock changes
  useEffect(() => {
    const channel = supabase
      .channel('motor-stock-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'motor_models', filter: 'in_stock=eq.true' },
        () => {
          // Trigger animation when stock changes
          setAnimateCount(true);
          setTimeout(() => setAnimateCount(false), 600);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (inStockCount === 0) return null;

  return (
    <button
      onClick={onFilterInStock}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer group"
      aria-label={`${inStockCount} motors in stock. Click to filter.`}
    >
      {/* Pulsing green dot */}
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
      </span>
      
      {/* Count with animation */}
      <AnimatePresence mode="wait">
        <motion.span
          key={inStockCount}
          initial={animateCount ? { y: -10, opacity: 0 } : false}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 10, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="text-sm font-semibold text-emerald-700"
        >
          {inStockCount}
        </motion.span>
      </AnimatePresence>
      
      <span className="text-sm text-emerald-600 group-hover:text-emerald-700">
        In Stock Now
      </span>
    </button>
  );
}
