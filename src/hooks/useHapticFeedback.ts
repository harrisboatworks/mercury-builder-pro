import { useCallback } from 'react';

export type HapticIntensity = 'light' | 'medium' | 'heavy';
export type HapticPattern = 'messageSent' | 'responseReceived' | 'error' | 'motorSelected' | 'addedToQuote' | 'packageChanged';
export type HapticType = HapticIntensity | HapticPattern;

const HAPTIC_PATTERNS: Record<HapticType, number | number[]> = {
  light: 10,                          // Subtle tap
  medium: 20,                         // Normal button press
  heavy: 30,                          // Important action
  messageSent: [8, 50, 8],            // Quick double-tap - confirms action
  responseReceived: [5, 30, 10],      // Soft pulse - gentle notification
  error: [15, 40, 15, 40, 15],        // Triple burst - alerts user
  motorSelected: [12, 60, 12],        // Satisfying double-tap for motor selection
  addedToQuote: [8, 40, 8, 40, 8],    // Triple pulse - confirms addition
  packageChanged: [10, 50, 10],       // Package selection feedback
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
