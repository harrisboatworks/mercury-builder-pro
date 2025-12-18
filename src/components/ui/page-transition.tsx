import { motion } from 'framer-motion';
import { ReactNode, useEffect, useState } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

// Detect iOS or reduced motion preference
const shouldReduceMotion = () => {
  if (typeof window === 'undefined') return false;
  
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  return prefersReducedMotion || isIOS;
};

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.2,
      ease: "easeIn"
    }
  }
};

// Safe variants that skip opacity animations
const safeVariants = {
  initial: { y: 10 },
  animate: { y: 0, transition: { duration: 0.2 } },
  exit: { y: -10, transition: { duration: 0.15 } }
};

export function PageTransition({ children, className }: PageTransitionProps) {
  const [reduceMotion, setReduceMotion] = useState(false);
  
  useEffect(() => {
    setReduceMotion(shouldReduceMotion());
  }, []);

  // For iOS/reduced motion: render immediately without opacity animation
  if (reduceMotion) {
    return (
      <motion.div
        variants={safeVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={className}
        style={{ opacity: 1 }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  );
}
