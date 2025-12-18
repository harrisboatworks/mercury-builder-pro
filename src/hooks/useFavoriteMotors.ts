import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'favorite-motors';
const MAX_FAVORITES = 20;

export function useFavoriteMotors() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setFavoriteIds(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to load favorites:', e);
    }
  }, []);

  // Save to localStorage when list changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteIds));
    } catch (e) {
      console.warn('Failed to save favorites:', e);
    }
  }, [favoriteIds]);

  const addFavorite = useCallback((motorId: string) => {
    setFavoriteIds(prev => {
      if (prev.length >= MAX_FAVORITES) return prev;
      if (prev.includes(motorId)) return prev;
      return [...prev, motorId];
    });
  }, []);

  const removeFavorite = useCallback((motorId: string) => {
    setFavoriteIds(prev => prev.filter(id => id !== motorId));
  }, []);

  const toggleFavorite = useCallback((motorId: string) => {
    setFavoriteIds(prev => {
      if (prev.includes(motorId)) {
        return prev.filter(id => id !== motorId);
      }
      if (prev.length >= MAX_FAVORITES) return prev;
      return [...prev, motorId];
    });
  }, []);

  const isFavorite = useCallback((motorId: string) => {
    return favoriteIds.includes(motorId);
  }, [favoriteIds]);

  const clearFavorites = useCallback(() => {
    setFavoriteIds([]);
  }, []);

  return {
    favoriteIds,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    clearFavorites,
    count: favoriteIds.length,
    isFull: favoriteIds.length >= MAX_FAVORITES,
    maxFavorites: MAX_FAVORITES
  };
}
