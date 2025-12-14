import { useState, useRef, useCallback, useEffect } from 'react';

interface PullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  disabled?: boolean;
}

interface PullToRefreshState {
  isRefreshing: boolean;
  pullDistance: number;
  isPulling: boolean;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  disabled = false
}: PullToRefreshOptions) {
  const [state, setState] = useState<PullToRefreshState>({
    isRefreshing: false,
    pullDistance: 0,
    isPulling: false
  });
  
  const startY = useRef(0);
  const currentY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || state.isRefreshing) return;
    
    // Only trigger if scrolled to top
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop > 5) return;
    
    startY.current = e.touches[0].clientY;
    setState(prev => ({ ...prev, isPulling: true }));
  }, [disabled, state.isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!state.isPulling || disabled || state.isRefreshing) return;
    
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop > 5) {
      setState(prev => ({ ...prev, isPulling: false, pullDistance: 0 }));
      return;
    }
    
    currentY.current = e.touches[0].clientY;
    const distance = Math.max(0, currentY.current - startY.current);
    
    // Apply resistance for a natural feel
    const resistedDistance = Math.min(distance * 0.5, threshold * 1.5);
    
    setState(prev => ({ ...prev, pullDistance: resistedDistance }));
    
    // Prevent default scroll if pulling down
    if (distance > 10) {
      e.preventDefault();
    }
  }, [state.isPulling, disabled, state.isRefreshing, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!state.isPulling || disabled) return;
    
    if (state.pullDistance >= threshold && !state.isRefreshing) {
      setState(prev => ({ ...prev, isRefreshing: true, isPulling: false }));
      
      try {
        await onRefresh();
      } finally {
        setState({ isRefreshing: false, pullDistance: 0, isPulling: false });
      }
    } else {
      setState({ isRefreshing: false, pullDistance: 0, isPulling: false });
    }
  }, [state.isPulling, state.pullDistance, state.isRefreshing, threshold, disabled, onRefresh]);

  useEffect(() => {
    // Only enable on mobile/touch devices
    if (typeof window === 'undefined' || window.innerWidth >= 1024) return;
    
    const options = { passive: false };
    
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, options);
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(state.pullDistance / threshold, 1);
  const shouldTrigger = state.pullDistance >= threshold;

  return {
    containerRef,
    isRefreshing: state.isRefreshing,
    pullDistance: state.pullDistance,
    isPulling: state.isPulling,
    progress,
    shouldTrigger
  };
}
