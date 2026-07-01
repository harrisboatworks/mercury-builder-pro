import { motion, useReducedMotion } from 'framer-motion';
import { ReactNode, useEffect, useRef, useState } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

// Detect iOS (all browsers) — WebKit's compositor can strand opacity animations.
const detectIOS = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) ||
    /CriOS|FxiOS/.test(ua) ||
    (navigator.platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1);
  return isIOS;
};

/**
 * Page mount transition.
 *
 * Hard rule: the resting state MUST be opacity: 1. Framer-motion animations
 * can be cancelled (route change mid-flight, React unmount, tab throttling)
 * and leave the element stranded at opacity: 0 — which has hidden the
 * SchedulePage form in production. We enforce opacity:1 three ways:
 *
 *   1. Inline `style={{ opacity: 1 }}` is the resting/default value. Framer
 *      writes opacity on the element during the animation and clears it
 *      when the animation resolves; if it never resolves the inline value
 *      wins.
 *   2. `onAnimationComplete` explicitly restores opacity to 1 on the DOM
 *      node in case Framer's cleanup missed it.
 *   3. A t=400ms setTimeout safety net force-writes opacity:1 whether or
 *      not Framer ever fires complete — covers cancelled animations.
 *
 * `prefers-reduced-motion` and iOS skip the opacity animation entirely.
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isIOS] = useState(() => detectIOS());
  const skipOpacity = prefersReducedMotion || isIOS;

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Safety net: no matter what Framer does, ensure opacity is 1 after 400ms.
    const t = window.setTimeout(() => {
      if (ref.current) ref.current.style.opacity = '1';
    }, 400);
    return () => window.clearTimeout(t);
  }, []);

  const initial = skipOpacity ? { y: 10 } : { opacity: 0, y: 20 };
  const animate = skipOpacity
    ? { y: 0, transition: { duration: 0.2, ease: 'easeOut' as const } }
    : { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } };
  const exit = skipOpacity
    ? { y: -10, transition: { duration: 0.15 } }
    : { opacity: 0, y: -20, transition: { duration: 0.2, ease: 'easeIn' as const } };

  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={animate}
      exit={exit}
      onAnimationComplete={() => {
        if (ref.current) ref.current.style.opacity = '1';
      }}
      className={className}
      // Resting value — wins if the animation is ever cancelled mid-flight.
      style={{ opacity: 1 }}
    >
      {children}
    </motion.div>
  );
}
