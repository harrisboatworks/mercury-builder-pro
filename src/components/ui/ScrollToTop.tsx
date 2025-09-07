import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    // Calculate scroll position - scroll to just below header and progress bar
    // Header + trust indicators + progress bar is approximately 200px
    const scrollTarget = 120;
    
    // Smooth scroll to the target position
    window.scrollTo({
      top: scrollTarget,
      behavior: 'smooth'
    });

    // Focus on the main content for accessibility
    const mainContent = document.querySelector('main') || document.querySelector('[role="main"]');
    if (mainContent) {
      // Set focus on main content for screen readers, but don't show focus ring
      mainContent.setAttribute('tabindex', '-1');
      mainContent.focus({ preventScroll: true });
      
      // Remove tabindex after focus to prevent it from being focusable via keyboard
      setTimeout(() => {
        mainContent.removeAttribute('tabindex');
      }, 100);
    }
  }, [location.pathname]);

  return null;
}