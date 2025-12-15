import { useCallback } from 'react';

export type HapticIntensity = 'light' | 'medium' | 'heavy';
export type HapticPattern = 'messageSent' | 'responseReceived' | 'error';
export type HapticType = HapticIntensity | HapticPattern;

const HAPTIC_PATTERNS: Record<HapticType, number | number[]> = {
  light: 10,      // Subtle tap
  medium: 20,     // Normal button press
  heavy: 30,      // Important action
  messageSent: [8, 50, 8],           // Quick double-tap - confirms action
  responseReceived: [5, 30, 10],     // Soft pulse - gentle notification
  error: [15, 40, 15, 40, 15],       // Triple burst - alerts user
} as const;

export function useHapticFeedback() {
  const triggerHaptic = useCallback((type: HapticType = 'light') => {
    // Only on mobile devices
    if (!('ontouchstart' in window)) return;
    
    // Check if Vibration API is supported
    if ('vibrate' in navigator) {
      try {
        const pattern = HAPTIC_PATTERNS[type];
        navigator.vibrate(pattern);
      } catch (error) {
        // Silently fail - not critical
        console.debug('Haptic feedback not available');
      }
    }
  }, []);

  return { triggerHaptic };
}
