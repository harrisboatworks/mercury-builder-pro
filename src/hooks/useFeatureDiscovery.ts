import { useState, useCallback } from 'react';

/**
 * Hook to manage first-time feature discovery
 * Tracks whether a user has seen a particular feature introduction
 */
export function useFeatureDiscovery(featureKey: string) {
  const storageKey = `feature-discovery-${featureKey}`;
  
  const [hasSeen, setHasSeen] = useState(() => {
    try {
      return localStorage.getItem(storageKey) === 'true';
    } catch {
      return false;
    }
  });

  const markAsSeen = useCallback(() => {
    try {
      localStorage.setItem(storageKey, 'true');
      setHasSeen(true);
    } catch {
      // Storage might be full or disabled
      setHasSeen(true);
    }
  }, [storageKey]);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setHasSeen(false);
    } catch {
      setHasSeen(false);
    }
  }, [storageKey]);

  return { hasSeen, markAsSeen, reset };
}
