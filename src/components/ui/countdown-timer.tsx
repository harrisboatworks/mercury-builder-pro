import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface CountdownTimerProps {
  endDate: string | Date;
  onExpire?: () => void;
  className?: string;
  compact?: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

const calculateTimeLeft = (endDate: Date): TimeLeft => {
  const difference = endDate.getTime() - new Date().getTime();
  
  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }
  
  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    total: difference,
  };
};

const getUrgencyLevel = (days: number): 'normal' | 'warning' | 'critical' | 'urgent' => {
  if (days < 1) return 'urgent';
  if (days < 3) return 'critical';
  if (days < 7) return 'warning';
  return 'normal';
};

export function CountdownTimer({ endDate, onExpire, className, compact = false }: CountdownTimerProps) {
  const targetDate = typeof endDate === 'string' ? new Date(endDate) : endDate;
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft(targetDate));
  const [hasExpired, setHasExpired] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(targetDate);
      setTimeLeft(newTimeLeft);
      
      if (newTimeLeft.total <= 0 && !hasExpired) {
        setHasExpired(true);
        onExpire?.();
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onExpire, hasExpired]);

  if (hasExpired || timeLeft.total <= 0) {
    return (
      <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md", className)}>
        <span className="text-sm font-medium text-muted-foreground">Promotion Ended</span>
      </div>
    );
  }

  const urgency = getUrgencyLevel(timeLeft.days);
  
  const urgencyStyles = {
    normal: {
      container: 'bg-stone-50 border-stone-200',
      box: 'bg-white border-stone-200',
      text: 'text-foreground',
      label: 'text-muted-foreground',
    },
    warning: {
      container: 'bg-amber-50 border-amber-200',
      box: 'bg-white border-amber-300',
      text: 'text-amber-700',
      label: 'text-amber-600',
    },
    critical: {
      container: 'bg-red-50 border-red-200',
      box: 'bg-white border-red-300',
      text: 'text-red-600',
      label: 'text-red-500',
    },
    urgent: {
      container: 'bg-red-100 border-red-300 animate-pulse',
      box: 'bg-white border-red-400',
      text: 'text-red-700 font-bold',
      label: 'text-red-600',
    },
  };

  const styles = urgencyStyles[urgency];
  const padNumber = (num: number) => num.toString().padStart(2, '0');

  if (compact) {
    return (
      <div className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border",
        styles.container,
        className
      )}>
        <span className={cn("text-sm font-semibold tabular-nums", styles.text)}>
          {timeLeft.days}d {padNumber(timeLeft.hours)}h {padNumber(timeLeft.minutes)}m
        </span>
      </div>
    );
  }

  const timeUnits = [
    { value: timeLeft.days, label: 'DAYS' },
    { value: timeLeft.hours, label: 'HRS' },
    { value: timeLeft.minutes, label: 'MINS' },
    { value: timeLeft.seconds, label: 'SECS' },
  ];

  return (
    <div className={cn(
      "inline-flex items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-lg border",
      styles.container,
      className
    )}>
      {timeUnits.map((unit, index) => (
        <div key={unit.label} className="flex items-center gap-1 sm:gap-2">
          <div className={cn(
            "flex flex-col items-center justify-center px-2 py-1.5 sm:px-3 sm:py-2 rounded-md border min-w-[40px] sm:min-w-[52px]",
            styles.box
          )}>
            <span className={cn(
              "text-lg sm:text-2xl font-bold tabular-nums leading-none",
              styles.text
            )}>
              {padNumber(unit.value)}
            </span>
            <span className={cn(
              "text-[9px] sm:text-[10px] font-medium tracking-wider mt-0.5",
              styles.label
            )}>
              {unit.label}
            </span>
          </div>
          {index < timeUnits.length - 1 && (
            <span className={cn("text-lg sm:text-xl font-light", styles.text)}>:</span>
          )}
        </div>
      ))}
    </div>
  );
}
