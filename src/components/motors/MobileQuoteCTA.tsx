import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileQuoteCTAProps {
  /** Number of motor cards that must scroll past before showing */
  triggerCardCount?: number;
  onStartQuote: () => void;
}

/**
 * Floating mobile CTA that appears after the user scrolls past N motor cards.
 * Designed to nudge browsing users into the quote funnel.
 */
export function MobileQuoteCTA({ triggerCardCount = 2, onStartQuote }: MobileQuoteCTAProps) {
  const isMobile = useIsMobile();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!isMobile || dismissed) return;

    // Watch for the Nth motor card entering the viewport
    const checkCards = () => {
      const gridSection = document.querySelector('.motor-grid-section');
      if (!gridSection) return;

      const cards = gridSection.querySelectorAll('[data-motor-card]');
      const targetCard = cards[triggerCardCount]; // 0-indexed, so index 2 = 3rd card
      if (!targetCard) {
        // Fewer cards than threshold — show after a delay instead
        setTimeout(() => setVisible(true), 4000);
        return;
      }

      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observerRef.current?.disconnect();
          }
        },
        { threshold: 0.3 }
      );
      observerRef.current.observe(targetCard);
    };

    // Small delay to let the grid render
    const timer = setTimeout(checkCards, 800);

    return () => {
      clearTimeout(timer);
      observerRef.current?.disconnect();
    };
  }, [isMobile, dismissed, triggerCardCount]);

  if (!isMobile || dismissed) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-20 left-4 right-4 z-40 sm:hidden"
        >
          <button
            onClick={() => {
              // Fire analytics
              if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'cta_build_quote', {
                  source: 'mobile_floating_cta'
                });
              }
              onStartQuote();
            }}
            className="w-full flex items-center justify-between gap-3 px-5 py-3.5 
              bg-[hsl(var(--cta-navy))] text-white rounded-xl shadow-lg
              active:scale-[0.97] active:bg-[hsl(var(--cta-navy-active))]
              transition-all duration-150 touch-manipulation"
          >
            <div className="text-left">
              <span className="block text-[15px] font-medium leading-tight">
                Build Your Quote
              </span>
              <span className="block text-[11px] opacity-70 mt-0.5">
                Tap any motor to configure &amp; get pricing
              </span>
            </div>
            <ArrowRight className="w-5 h-5 flex-shrink-0 opacity-80" />
          </button>

          {/* Dismiss tap target */}
          <button
            onClick={() => setDismissed(true)}
            className="absolute -top-2 -right-1 w-7 h-7 flex items-center justify-center 
              rounded-full bg-white/90 shadow-sm text-gray-400 text-xs
              active:bg-gray-100 transition-colors"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
