import { useCallback } from 'react';

export type HapticIntensity = 'light' | 'medium' | 'heavy';

const HAPTIC_PATTERNS = {
  light: 10,    // Subtle tap
  medium: 20,   // Normal button press
  heavy: 30,    // Important action
} as const;

export function useHapticFeedback() {
  const triggerHaptic = useCallback((intensity: HapticIntensity = 'light') => {
    // Only on mobile devices
    if (!('ontouchstart' in window)) return;
    
    // Check if Vibration API is supported
    if ('vibrate' in navigator) {
      try {
        const duration = HAPTIC_PATTERNS[intensity];
        navigator.vibrate(duration);
      } catch (error) {
        // Silently fail - not critical
        console.debug('Haptic feedback not available');
      }
    }
  }, []);

  return { triggerHaptic };
}
