import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HybridMotorSearch } from '@/components/motors/HybridMotorSearch';
import { Motor } from '@/components/QuoteBuilder';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onQueryChange: (query: string) => void;
  motors: Motor[];
  onHpSelect: (hp: number) => void;
}

export function SearchOverlay({
  isOpen,
  onClose,
  searchQuery,
  onQueryChange,
  motors,
  onHpSelect
}: SearchOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when overlay opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        const input = overlayRef.current?.querySelector('input');
        input?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />

          {/* Overlay Panel */}
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="fixed top-0 left-0 right-0 z-[61] bg-white shadow-2xl"
          >
            <div className="max-w-4xl mx-auto px-6 py-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-foreground">Search Motors</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                  <span className="sr-only">Close search</span>
                </Button>
              </div>

              {/* Search Component */}
              <HybridMotorSearch
                query={searchQuery}
                onQueryChange={(query) => {
                  onQueryChange(query);
                  // Close overlay if user selects a result (detected by HP select or empty query after selection)
                }}
                motors={motors}
                onHpSelect={(hp) => {
                  onHpSelect(hp);
                  onClose();
                }}
                className="w-full"
              />

              {/* Quick Tips */}
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Tip:</span> Try searching by HP (e.g., "25"), model name, or use filters like "hp:150" for exact matches.
                  Press <kbd className="px-1.5 py-0.5 mx-1 bg-muted rounded text-xs font-mono">Esc</kbd> to close.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
