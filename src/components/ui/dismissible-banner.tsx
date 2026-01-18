import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

// Known promo banner storage keys for reset utility
const PROMO_BANNER_KEYS = [
  'get7_choose_one_banner_dismissed',
  // Add other promo banner keys here as needed
];

/**
 * Reset all promotional banners - useful for testing
 * Call from browser console: window.resetAllPromoBanners()
 */
export function resetAllPromoBanners() {
  PROMO_BANNER_KEYS.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore
    }
  });
  console.log('All promo banners reset. Refresh the page to see them again.');
}

// Expose to window for easy console access
if (typeof window !== 'undefined') {
  (window as unknown as { resetAllPromoBanners: typeof resetAllPromoBanners }).resetAllPromoBanners = resetAllPromoBanners;
}

/**
 * Custom hook for managing dismissible state with localStorage persistence
 * and time-based expiration for returning visitors
 */
export function useDismissibleState(storageKey: string, expirationDays: number = 1) {
  const expirationMs = expirationDays * 24 * 60 * 60 * 1000;

  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      const dismissedAt = parseInt(localStorage.getItem(storageKey) || '0', 10);
      
      // Handle legacy 'true' values or invalid data - treat as expired
      if (!dismissedAt || isNaN(dismissedAt)) {
        localStorage.removeItem(storageKey);
        return false;
      }
      
      const isExpired = Date.now() - dismissedAt > expirationMs;
      if (isExpired) {
        // Clean up expired entry
        localStorage.removeItem(storageKey);
        return false;
      }
      return true;
    } catch {
      return false;
    }
  });

  const dismiss = useCallback(() => {
    try {
      // Store timestamp instead of boolean
      localStorage.setItem(storageKey, Date.now().toString());
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
  /** Days until dismissed banner reappears (default: 1) */
  expirationDays?: number;
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
  /** Full-width image to show on mobile instead of text content */
  mobileImageUrl?: string;
  /** Alt text for mobile image */
  mobileImageAlt?: string;
}

export function DismissibleBanner({
  storageKey,
  children,
  variant = 'info',
  className,
  expirationDays = 1,
  onDismiss,
  actionLabel,
  actionHref,
  onActionClick,
  imageUrl,
  imageAlt = '',
  mobileImageUrl,
  mobileImageAlt = '',
}: DismissibleBannerProps) {
  const { isDismissed, dismiss } = useDismissibleState(storageKey, expirationDays);

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
        {/* Mobile: Full image banner */}
        {mobileImageUrl && (
          <div className="block sm:hidden relative">
            <Link to={actionHref || '#'} className="block">
              <img
                src={mobileImageUrl}
                alt={mobileImageAlt}
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </Link>
            {/* Mobile dismiss button */}
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        )}

        {/* Desktop: Text-based layout (also mobile fallback if no mobileImageUrl) */}
        <div
          className={cn(
            'rounded-lg p-3 flex flex-col sm:flex-row items-center sm:justify-between gap-3 shadow-lg relative',
            variantStyles[variant],
            mobileImageUrl ? 'hidden sm:flex' : 'flex'
          )}
        >
          {/* Mobile dismiss button - only show if no mobile image */}
          {!mobileImageUrl && (
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 sm:hidden p-1 hover:bg-white/10 rounded transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4" />
            </button>
          )}

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
