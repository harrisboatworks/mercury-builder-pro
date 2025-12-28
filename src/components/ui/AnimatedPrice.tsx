import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedPriceProps {
  value: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  duration?: number;
  formatOptions?: Intl.NumberFormatOptions;
  withGlow?: boolean;
  onComplete?: () => void;
}

/**
 * Animated price counter that smoothly transitions between values
 * Uses spring physics for natural, premium feel
 */
export function AnimatedPrice({
  value,
  className,
  prefix = '$',
  suffix = '',
  duration = 0.6,
  formatOptions = { maximumFractionDigits: 0 },
  withGlow = false,
  onComplete
}: AnimatedPriceProps) {
  const spring = useSpring(0, {
    stiffness: 100,
    damping: 30,
    duration: duration * 1000
  });

  const display = useTransform(spring, (current) => {
    return new Intl.NumberFormat('en-CA', formatOptions).format(Math.round(current));
  });

  const prevValue = useRef(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Only animate if value actually changed
    if (prevValue.current !== value) {
      setIsAnimating(true);
      spring.set(value);
      prevValue.current = value;
      
      // Reset animation state after duration
      const timer = setTimeout(() => {
        setIsAnimating(false);
        onComplete?.();
      }, duration * 1000);
      
      return () => clearTimeout(timer);
    }
  }, [value, spring, duration, onComplete]);

  // Set initial value without animation
  useEffect(() => {
    spring.jump(value);
  }, []);

  return (
    <motion.span 
      className={cn(
        'tabular-nums',
        withGlow && isAnimating && 'price-glow',
        className
      )}
    >
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </motion.span>
  );
}

/**
 * Large cinematic price display with dramatic animation
 */
export function CinematicPrice({
  value,
  className,
  prefix = '$',
}: {
  value: number;
  className?: string;
  prefix?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (value === 0) return;
    
    const duration = 1500;
    const steps = 40;
    const increment = value / steps;
    let current = 0;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      // Easing - slow down near the end
      const progress = step / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3);
      current = value * easeOut;
      
      if (step >= steps) {
        setDisplayValue(value);
        setIsComplete(true);
        clearInterval(interval);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [value]);

  return (
    <motion.span 
      className={cn(
        'tabular-nums font-bold',
        isComplete && 'price-glow',
        className
      )}
      animate={isComplete ? { scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      {prefix}
      {new Intl.NumberFormat('en-CA', { maximumFractionDigits: 0 }).format(displayValue)}
    </motion.span>
  );
}

/**
 * Animated monthly payment display with "/mo" suffix
 */
export function AnimatedMonthlyPayment({
  value,
  className,
  duration = 0.5
}: {
  value: number;
  className?: string;
  duration?: number;
}) {
  return (
    <AnimatedPrice
      value={value}
      className={className}
      prefix="$"
      suffix="/mo"
      duration={duration}
    />
  );
}

/**
 * Animated savings display with green color and pulse on change
 */
export function AnimatedSavings({
  value,
  className
}: {
  value: number;
  className?: string;
}) {
  return (
    <motion.span
      key={value}
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 0.3 }}
      className={cn('text-green-600', className)}
    >
      <AnimatedPrice value={value} prefix="$" duration={0.4} />
    </motion.span>
  );
}
