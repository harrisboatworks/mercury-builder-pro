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

    // Force-reset any leaked body styles from modal scroll locks (iOS Safari fix)
    // Modals set position:fixed/overflow:hidden on body, but cleanup can fail during navigation
    const body = document.body;
    if (body.style.position || body.style.overflow || body.style.top || body.style.width) {
      console.log('🧹 ScrollToTop clearing leaked body styles');
      body.style.position = '';
      body.style.overflow = '';
      body.style.top = '';
      body.style.width = '';
    }
    body.removeAttribute('data-scroll-y');
    document.documentElement.classList.remove('chat-drawer-open');

    // Check scroll coordination lock (active modals that are still mounted)
    if (isScrollLocked()) {
      console.log('⏸️ ScrollToTop skipped scroll - locked by:', getScrollLockReason());
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