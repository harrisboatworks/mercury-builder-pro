import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    // Add a small delay to ensure DOM is fully rendered after route change
    const timer = setTimeout(() => {
      // Calculate dynamic header height
      const header = document.querySelector('header') as HTMLElement;
      const trustBar = (document.querySelector('[class*="trust"]') || document.querySelector('.bg-slate-50')) as HTMLElement;
      const progressBar = (document.querySelector('[class*="progress"]') || document.querySelector('.mb-8')) as HTMLElement;
      
      let headerHeight = 0;
      if (header) headerHeight += header.offsetHeight;
      if (trustBar) headerHeight += trustBar.offsetHeight;
      if (progressBar) headerHeight += progressBar.offsetHeight;
      
      // Find the main content heading (h1, h2) within main
      const mainContent = document.querySelector('main');
      const stepHeading = mainContent?.querySelector('h1, h2, [class*="text-3xl"], [class*="text-2xl"]');
      
      let scrollTarget = headerHeight + 80; // Default with padding
      
      if (stepHeading) {
        // Get the heading's position and subtract some padding for optimal viewing
        const headingRect = stepHeading.getBoundingClientRect();
        const currentScrollY = window.scrollY;
        const headingTop = headingRect.top + currentScrollY;
        
        // Position heading with breathing room (80px on desktop, 40px on mobile)
        const isMobile = window.innerWidth < 768;
        const padding = isMobile ? 40 : 80;
        scrollTarget = Math.max(0, headingTop - headerHeight - padding);
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
    }, 50);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return null;
}