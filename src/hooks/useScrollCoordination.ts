import { useCallback } from 'react';

// Global scroll coordination to prevent conflicts between ScrollToTop and modals
export function useScrollCoordination() {
  const setScrollLock = useCallback((locked: boolean, reason?: string) => {
    const key = 'scroll-management-lock';
    if (locked) {
      sessionStorage.setItem(key, reason || 'locked');
      console.log('🔒 Scroll lock activated:', reason);
    } else {
      sessionStorage.removeItem(key);
      console.log('🔓 Scroll lock released:', reason);
    }
  }, []);

  const isScrollLocked = useCallback(() => {
    return sessionStorage.getItem('scroll-management-lock') !== null;
  }, []);

  const getScrollLockReason = useCallback(() => {
    return sessionStorage.getItem('scroll-management-lock');
  }, []);

  return {
    setScrollLock,
    isScrollLocked,
    getScrollLockReason
  };
}