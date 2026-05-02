import { useEffect, useState, type ReactNode } from 'react';
import { LuxuryHeader } from '@/components/ui/luxury-header';

/**
 * Wraps /repower content with transparent-over-hero header behavior.
 * Does NOT modify LuxuryHeader source. Toggles a body-level data attribute
 * + a thin overlay class on scroll past 60px.
 */
export function RepowerLayout({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    document.documentElement.setAttribute('data-repower', 'true');
    return () => {
      window.removeEventListener('scroll', onScroll);
      document.documentElement.removeAttribute('data-repower');
    };
  }, []);

  return (
    <div
      className="min-h-screen bg-background"
      data-repower-scrolled={scrolled ? 'true' : 'false'}
    >
      <style>{`
        [data-repower-scrolled="false"] > header,
        [data-repower-scrolled="false"] header[class*="luxury"] {
          background: transparent !important;
          border-color: transparent !important;
          backdrop-filter: none !important;
        }
        [data-repower-scrolled="true"] header[class*="luxury"] {
          background: rgba(5, 14, 28, 0.92) !important;
          backdrop-filter: blur(12px);
        }
      `}</style>
      <LuxuryHeader />
      {children}
    </div>
  );
}
