import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useScrollCoordination } from '../../hooks/useScrollCoordination';

export function ScrollToTop() {
  const location = useLocation();
  const { isScrollLocked, getScrollLockReason } = useScrollCoordination();

  useEffect(() => {
    // Enhanced modal detection - check multiple sources
    if (isScrollLocked()) {
      console.log('⏸️ ScrollToTop skipped - scroll locked by:', getScrollLockReason());
      return;
    }

    // Enhanced DOM-based modal detection for MotorDetailsSheet and other modals
    const modalSelectors = [
      '[role="dialog"]',
      '.fixed.inset-0.z-50',  // MotorDetailsSheet specific
      'div.fixed.inset-0[class*="z-"]',  // Any fixed overlay with z-index
      '[data-state="open"]'
    ];
    
    const activeModals = document.querySelectorAll(modalSelectors.join(', '));
    if (activeModals.length > 0) {
      console.log('⏸️ ScrollToTop skipped - active modals found:', activeModals.length);
      return;
    }

    // Z-index based modal detection - check for high z-index elements (modals)
    const allElements = document.querySelectorAll('*');
    for (let element of allElements) {
      const computedStyle = window.getComputedStyle(element);
      const zIndex = parseInt(computedStyle.zIndex);
      if (zIndex >= 50 && computedStyle.position === 'fixed') {
        console.log('⏸️ ScrollToTop skipped - high z-index modal detected:', zIndex);
        return;
      }
    }

    // Check for body position fixed (modal scroll lock indicator)
    const bodyStyle = window.getComputedStyle(document.body);
    if (bodyStyle.position === 'fixed') {
      console.log('⏸️ ScrollToTop skipped - body scroll locked');
      return;
    }

    // Extended delay to ensure modal transitions complete (300ms > 200ms modal restoration)
    const timer = setTimeout(() => {
      // Calculate dynamic header height with better element detection
      const header = document.querySelector('header') as HTMLElement;
      const trustBar = (
        document.querySelector('[class*="trust"]') || 
        document.querySelector('.bg-slate-50') ||
        document.querySelector('[class*="bg-slate-50"]')
      ) as HTMLElement;
      const progressBar = (
        document.querySelector('[class*="progress"]') || 
        document.querySelector('.mb-8') ||
        document.querySelector('[class*="QuoteProgress"]')
      ) as HTMLElement;
      
      let headerHeight = 0;
      if (header) headerHeight += header.offsetHeight;
      if (trustBar) headerHeight += trustBar.offsetHeight;
      if (progressBar) headerHeight += progressBar.offsetHeight;
      
      // Enhanced heading detection - prioritize page-level headings
      const mainContent = document.querySelector('main');
      
      // First try to find page-level headings (not in cards or components)
      const pageHeading = mainContent?.querySelector(
        'main > div:first-child h1, ' +           // Direct child headings
        'main > div > h1:first-child, ' +         // First heading in main sections
        '.lg\\:hidden h1, ' +                     // Mobile page titles
        'h1:not([class*="card"] *):not([class*="motor"] *):not([class*="grid"] *)' // H1s not inside cards
      );
      
      // Fallback to any heading if no page-level heading found
      const stepHeading = pageHeading || mainContent?.querySelector('h1, h2');
      
      let scrollTarget = headerHeight + 60; // Default with reduced padding
      
      if (stepHeading) {
        // Get the heading's position and calculate optimal viewing position
        const headingRect = stepHeading.getBoundingClientRect();
        const currentScrollY = window.scrollY;
        const headingTop = headingRect.top + currentScrollY;
        
        // Optimized padding for better positioning - heading should appear "just above" the fold
        const isMobile = window.innerWidth < 768;
        const padding = isMobile ? 80 : 120; // Reduced padding for tighter positioning
        scrollTarget = Math.max(0, headingTop - headerHeight - padding);
        
        // Get better heading text by checking for specific heading tags first
        const headingElement = stepHeading.tagName?.match(/^H[1-6]$/) 
          ? stepHeading 
          : stepHeading.querySelector('h1, h2, h3');
        const headingText = headingElement?.textContent?.trim() || stepHeading.textContent?.trim();
        
        console.log('ScrollToTop Debug:', {
          headingText: headingText?.substring(0, 50),
          headerHeight,
          headingTop,
          padding,
          scrollTarget
        });
      }
      
      // Smooth scroll to the calculated position
      window.scrollTo({
        top: scrollTarget,
        behavior: 'smooth'
      });

      // Focus on the main content for accessibility
      if (mainContent) {
        mainContent.setAttribute('tabindex', '-1');
        mainContent.focus({ preventScroll: true });
        
        setTimeout(() => {
          mainContent.removeAttribute('tabindex');
        }, 100);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return null;
}