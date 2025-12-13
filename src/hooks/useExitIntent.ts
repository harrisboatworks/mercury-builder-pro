import { useState, useEffect, useCallback, useRef } from 'react';

interface UseExitIntentOptions {
  threshold?: number; // Mouse Y position threshold to trigger
  delay?: number; // Minimum time on page before triggering (ms)
  triggerOnce?: boolean; // Only trigger once per session
  storageKey?: string; // Key for sessionStorage to track if already shown
}

export const useExitIntent = (options: UseExitIntentOptions = {}) => {
  const {
    threshold = 50,
    delay = 5000, // 5 seconds minimum on page
    triggerOnce = true,
    storageKey = 'promo_reminder_shown'
  } = options;

  const [showExitIntent, setShowExitIntent] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const pageLoadTime = useRef(Date.now());
  const isEnabled = useRef(true);

  // Check if already shown this session
  useEffect(() => {
    if (triggerOnce && sessionStorage.getItem(storageKey)) {
      isEnabled.current = false;
    }
  }, [triggerOnce, storageKey]);

  const triggerExitIntent = useCallback(() => {
    if (!isEnabled.current || hasTriggered) return;
    
    // Check if enough time has passed
    const timeOnPage = Date.now() - pageLoadTime.current;
    if (timeOnPage < delay) return;

    setShowExitIntent(true);
    setHasTriggered(true);
    
    if (triggerOnce) {
      sessionStorage.setItem(storageKey, 'true');
    }
  }, [hasTriggered, delay, triggerOnce, storageKey]);

  const dismiss = useCallback(() => {
    setShowExitIntent(false);
    isEnabled.current = false;
    if (triggerOnce) {
      sessionStorage.setItem(storageKey, 'true');
    }
  }, [triggerOnce, storageKey]);

  const reset = useCallback(() => {
    setShowExitIntent(false);
    setHasTriggered(false);
    isEnabled.current = true;
    sessionStorage.removeItem(storageKey);
  }, [storageKey]);

  // Mouse leave detection (desktop)
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= threshold) {
        triggerExitIntent();
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [threshold, triggerExitIntent]);

  // Tab visibility change (mobile & desktop)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        triggerExitIntent();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [triggerExitIntent]);

  // Back button detection
  useEffect(() => {
    const handlePopState = () => {
      triggerExitIntent();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [triggerExitIntent]);

  return {
    showExitIntent,
    dismiss,
    reset,
    hasTriggered,
    triggerManually: triggerExitIntent
  };
};
