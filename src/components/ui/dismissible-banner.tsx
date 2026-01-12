import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

/**
 * Custom hook for managing dismissible state with localStorage persistence
 */
export function useDismissibleState(storageKey: string) {
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return localStorage.getItem(storageKey) === 'true';
    } catch {
      return false;
    }
  });

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(storageKey, 'true');
    } catch {
      // localStorage might be unavailable
    }
    setIsDismissed(true);
  }, [storageKey]);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // localStorage might be unavailable
    }
    setIsDismissed(false);
  }, [storageKey]);

  return { isDismissed, dismiss, reset };
}

const variantStyles = {
  promotional: 'bg-gradient-to-r from-red-900 to-red-800 text-white',
  info: 'bg-gradient-to-r from-slate-700 to-slate-600 text-white',
  warning: 'bg-gradient-to-r from-amber-600 to-amber-500 text-white',
  success: 'bg-gradient-to-r from-emerald-700 to-emerald-600 text-white',
} as const;

export interface DismissibleBannerProps {
  /** localStorage key for persistence */
  storageKey: string;
  /** Main content */
  children: React.ReactNode;
  /** Visual variant */
  variant?: keyof typeof variantStyles;
  /** Additional container styles */
  className?: string;
  /** Callback when dismissed */
  onDismiss?: () => void;
  /** Action button label */
  actionLabel?: string;
  /** Action button link destination */
  actionHref?: string;
  /** Action button click handler (used if actionHref not provided) */
  onActionClick?: () => void;
  /** Optional image URL */
  imageUrl?: string;
  /** Image alt text */
  imageAlt?: string;
}

export function DismissibleBanner({
  storageKey,
  children,
  variant = 'info',
  className,
  onDismiss,
  actionLabel,
  actionHref,
  onActionClick,
  imageUrl,
  imageAlt = '',
}: DismissibleBannerProps) {
  const { isDismissed, dismiss } = useDismissibleState(storageKey);

  const handleDismiss = useCallback(() => {
    dismiss();
    onDismiss?.();
  }, [dismiss, onDismiss]);

  if (isDismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={className}
      >
        <div
          className={cn(
            'rounded-lg p-3 flex flex-col sm:flex-row items-center sm:justify-between gap-3 shadow-lg relative',
            variantStyles[variant]
          )}
        >
          {/* Mobile dismiss button - absolute positioned */}
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 sm:hidden p-1 hover:bg-white/10 rounded transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Content area */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
            {imageUrl && (
              <img
                src={imageUrl}
                alt={imageAlt}
                className="h-8 sm:h-10 w-auto rounded"
              />
            )}
            <div>{children}</div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {actionLabel && actionHref && (
              <Link
                to={actionHref}
                className="text-sm underline underline-offset-2 hover:opacity-80 transition-opacity whitespace-nowrap"
              >
                {actionLabel}
              </Link>
            )}
            {actionLabel && onActionClick && !actionHref && (
              <button
                onClick={onActionClick}
                className="text-sm underline underline-offset-2 hover:opacity-80 transition-opacity whitespace-nowrap"
              >
                {actionLabel}
              </button>
            )}
            {/* Desktop dismiss button */}
            <button
              onClick={handleDismiss}
              className="hidden sm:block p-1 hover:bg-white/10 rounded transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
