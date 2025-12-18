import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'recently-viewed-motors';
const MAX_ITEMS = 5;
const EXPIRY_DAYS = 7;

interface RecentlyViewedItem {
  id: string;
  model: string;
  hp: number;
  price: number;
  image?: string;
  viewedAt: number;
}

export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([]);

  // Load from localStorage on mount and filter expired items
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const items: RecentlyViewedItem[] = JSON.parse(stored);
        const now = Date.now();
        const expiryMs = EXPIRY_DAYS * 24 * 60 * 60 * 1000;
        const validItems = items.filter(item => (now - item.viewedAt) < expiryMs);
        setRecentlyViewed(validItems);
      }
    } catch (e) {
      console.warn('Failed to load recently viewed:', e);
    }
  }, []);

  // Save to localStorage when list changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentlyViewed));
    } catch (e) {
      console.warn('Failed to save recently viewed:', e);
    }
  }, [recentlyViewed]);

  const addToRecentlyViewed = useCallback((motor: {
    id: string;
    model: string;
    hp: number;
    price: number;
    image?: string;
  }) => {
    setRecentlyViewed(prev => {
      // Remove if already exists
      const filtered = prev.filter(item => item.id !== motor.id);
      
      // Add to front with timestamp
      const newItem: RecentlyViewedItem = {
        ...motor,
        viewedAt: Date.now()
      };
      
      // Keep only MAX_ITEMS
      return [newItem, ...filtered].slice(0, MAX_ITEMS);
    });
  }, []);

  const clearRecentlyViewed = useCallback(() => {
    setRecentlyViewed([]);
  }, []);

  const removeFromRecentlyViewed = useCallback((motorId: string) => {
    setRecentlyViewed(prev => prev.filter(item => item.id !== motorId));
  }, []);

  return {
    recentlyViewed,
    addToRecentlyViewed,
    clearRecentlyViewed,
    removeFromRecentlyViewed,
    count: recentlyViewed.length,
    hasItems: recentlyViewed.length > 0
  };
}
