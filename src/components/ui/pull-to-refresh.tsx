import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  threshold?: number;
  className?: string;
}

export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  threshold = 80,
  className
}: PullToRefreshIndicatorProps) {
  const progress = Math.min(pullDistance / threshold, 1);
  const shouldTrigger = pullDistance >= threshold;
  const isVisible = pullDistance > 10 || isRefreshing;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ 
            opacity: 1, 
            y: Math.min(pullDistance - 20, 60)
          }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={cn(
            "fixed left-1/2 -translate-x-1/2 z-[100] lg:hidden",
            "flex flex-col items-center justify-center gap-1",
            className
          )}
          style={{ top: 70 }}
        >
          <motion.div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              "bg-background/95 backdrop-blur-sm border border-border shadow-lg",
              shouldTrigger && !isRefreshing && "border-primary/50 bg-primary/5"
            )}
            animate={{
              scale: isRefreshing ? 1 : 0.8 + progress * 0.2,
              rotate: isRefreshing ? 360 : progress * 180
            }}
            transition={{
              rotate: isRefreshing 
                ? { duration: 1, repeat: Infinity, ease: 'linear' }
                : { duration: 0.1 }
            }}
          >
            {isRefreshing ? (
              <RefreshCw className="w-5 h-5 text-primary animate-spin" />
            ) : (
              <ArrowDown 
                className={cn(
                  "w-5 h-5 transition-colors duration-200",
                  shouldTrigger ? "text-primary" : "text-muted-foreground"
                )} 
              />
            )}
          </motion.div>
          
          <motion.span
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              "bg-background/95 backdrop-blur-sm border border-border shadow-sm",
              shouldTrigger && !isRefreshing && "text-primary border-primary/30"
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: pullDistance > 20 || isRefreshing ? 1 : 0 }}
          >
            {isRefreshing 
              ? "Refreshing..." 
              : shouldTrigger 
                ? "Release to refresh" 
                : "Pull to refresh"
            }
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
