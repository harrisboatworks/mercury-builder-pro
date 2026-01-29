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

    // Only catch actual modal dialogs, not tooltips/popovers/dropdowns
    const modalSelectors = [
      '[role="dialog"][data-state="open"]',  // Actual dialogs only
      '.fixed.inset-0.z-50',  // Full-screen overlays
      'div.fixed.inset-0[class*="z-"]'  // Any fixed overlay with z-index
    ];
    
    const activeModals = document.querySelectorAll(modalSelectors.join(', '));
    if (activeModals.length > 0) {
      console.log('⏸️ ScrollToTop skipped - active modals found:', activeModals.length);
      return;
    }

    // More specific modal detection - only check for full-screen modal overlays
    const modalOverlays = document.querySelectorAll('.fixed.inset-0[class*="z-"], [role="dialog"][class*="fixed"]');
    const visibleModals = Array.from(modalOverlays).filter(el => {
      const computedStyle = window.getComputedStyle(el);
      const zIndex = parseInt(computedStyle.zIndex);
      // Only consider it a modal if it's:
      // 1. High z-index (50+)
      // 2. Fixed position
      // 3. Full-screen overlay (inset-0) OR has dialog role
      // 4. Actually visible (not display:none or opacity:0)
      return (
        zIndex >= 50 && 
        computedStyle.position === 'fixed' &&
        computedStyle.display !== 'none' &&
        computedStyle.visibility !== 'hidden' &&
        parseFloat(computedStyle.opacity) > 0
      );
    });

    if (visibleModals.length > 0) {
      console.log('⏸️ ScrollToTop skipped - visible modal overlays detected:', visibleModals.length);
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