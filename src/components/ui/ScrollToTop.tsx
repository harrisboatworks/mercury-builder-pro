import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useScrollCoordination } from '../../hooks/useScrollCoordination';

export function ScrollToTop() {
  const location = useLocation();
  const { isScrollLocked, getScrollLockReason } = useScrollCoordination();
  const previousPathname = useRef(location.pathname);

  useEffect(() => {
    // Only run ScrollToTop on actual navigation changes, not React state changes
    if (previousPathname.current === location.pathname) {
      console.log('⏸️ ScrollToTop skipped - same pathname (React state change, not navigation)');
      return;
    }

    // Update the previous pathname for next comparison
    const oldPathname = previousPathname.current;
    previousPathname.current = location.pathname;
    
    console.log('🧭 ScrollToTop triggered by navigation:', oldPathname, '→', location.pathname);
    // Enhanced modal detection - check multiple sources
    if (isScrollLocked()) {
      console.log('⏸️ ScrollToTop skipped - scroll locked by:', getScrollLockReason());
      return;
    }

    // Only block scroll for TRUE full-screen modal overlays
    // Check for elements that:
    // 1. Cover the entire viewport (inset: 0px on all sides)
    // 2. Are fixed position
    // 3. Are actually visible
    // 4. Have high z-index (blocking other content)
    const allFixed = document.querySelectorAll('.fixed, [style*="position: fixed"]');
    const blockingModals = Array.from(allFixed).filter(el => {
      const style = window.getComputedStyle(el);
      
      // Must be fixed position and visible
      if (style.position !== 'fixed') return false;
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      if (parseFloat(style.opacity) === 0) return false;
      
      // Must cover entire viewport (inset: 0 on all sides)
      const isFullScreen = 
        style.top === '0px' && 
        style.right === '0px' && 
        style.bottom === '0px' && 
        style.left === '0px';
      
      if (!isFullScreen) return false;
      
      // Must have high z-index (modal-level)
      const zIndex = parseInt(style.zIndex);
      if (isNaN(zIndex) || zIndex < 40) return false;
      
      // Must have significant size (not a 0x0 hidden element)
      const rect = el.getBoundingClientRect();
      if (rect.width < 100 || rect.height < 100) return false;
      
      return true;
    });

    if (blockingModals.length > 0) {
      console.log('⏸️ ScrollToTop skipped - blocking modal detected');
      return;
    }

    // Check for body position fixed (modal scroll lock indicator)
    const bodyStyle = window.getComputedStyle(document.body);
    if (bodyStyle.position === 'fixed') {
      console.log('⏸️ ScrollToTop skipped - body scroll locked');
      return;
    }

    // Scroll to top immediately for clean navigation experience
    const timer = setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'instant'
      });

      // Focus on the main content for accessibility
      const mainContent = document.querySelector('main');
      if (mainContent) {
        mainContent.setAttribute('tabindex', '-1');
        mainContent.focus({ preventScroll: true });
        
        setTimeout(() => {
          mainContent.removeAttribute('tabindex');
        }, 100);
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return null;
}