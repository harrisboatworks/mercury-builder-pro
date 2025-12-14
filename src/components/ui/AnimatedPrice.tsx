import { useEffect, useRef } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedPriceProps {
  value: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  duration?: number;
  formatOptions?: Intl.NumberFormatOptions;
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
  formatOptions = { maximumFractionDigits: 0 }
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

  useEffect(() => {
    // Only animate if value actually changed
    if (prevValue.current !== value) {
      spring.set(value);
      prevValue.current = value;
    }
  }, [value, spring]);

  // Set initial value without animation
  useEffect(() => {
    spring.jump(value);
  }, []);

  return (
    <motion.span className={cn('tabular-nums', className)}>
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
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
