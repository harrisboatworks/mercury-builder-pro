import React, { useEffect, useMemo, useState } from 'react';
import { generateActivityMessages, getDailyKey } from '@/lib/activityGenerator';

interface ActivityTickerProps {
  activities?: string[];
  intervalMs?: number; // base interval; actual tick will jitter slightly
}

export const ActivityTicker: React.FC<ActivityTickerProps> = ({
  activities = [],
  intervalMs = 5000,
}) => {
  const dayKey = getDailyKey();

  // Generate a daily-seeded activity feed to avoid repetition for returning visitors
  const generatedActivities = useMemo(() => generateActivityMessages(60), [dayKey]);
  const safeActivities = useMemo(
    () => (activities.length > 0 ? activities : generatedActivities),
    [activities, generatedActivities]
  );

  const storageKey = `activityTicker.index.${dayKey}`;
  const [currentIndex, setCurrentIndex] = useState(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null;
    const idx = saved ? parseInt(saved, 10) : 0;
    return Number.isFinite(idx) ? Math.abs(idx) % (safeActivities.length || 1) : 0;
  });

  // Keep index in range if activities list changes
  useEffect(() => {
    setCurrentIndex((prev) => (safeActivities.length ? prev % safeActivities.length : 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeActivities.length]);

  useEffect(() => {
    if (!safeActivities.length) return;

    let cancelled = false;
    let timeoutId: NodeJS.Timeout;
    const jitterRange = 2000; // Increased jitter for more varied timing
    
    const tick = () => {
      if (cancelled || document.hidden) return; // Pause when tab is not active
      
      setCurrentIndex((prev) => {
        const next = (prev + 1) % safeActivities.length;
        try {
          window.localStorage.setItem(storageKey, String(next));
        } catch {}
        return next;
      });
      
      const jitter = Math.floor((Math.random() - 0.5) * 2 * jitterRange);
      const nextDelay = Math.max(3000, intervalMs + jitter); // Increased base delay
      timeoutId = setTimeout(tick, nextDelay);
    };

    // Handle visibility changes to pause/resume
    const handleVisibilityChange = () => {
      if (!document.hidden && !cancelled) {
        // Resume with a random delay when tab becomes active again
        clearTimeout(timeoutId);
        const resumeDelay = Math.max(1000, Math.random() * 3000);
        timeoutId = setTimeout(tick, resumeDelay);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Start the ticking with an initial delay
    const startDelay = Math.max(2000, intervalMs + Math.floor(Math.random() * 2000));
    timeoutId = setTimeout(tick, startDelay);
    
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [intervalMs, safeActivities.length, storageKey]);

  return (
    <div className="activity-ticker rounded-md border-l-4 border-primary bg-accent/30 p-3 mb-4" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 bg-in-stock rounded-full pulse" aria-hidden="true" />
        <p className="text-sm text-muted-foreground animate-fade-in">
          {safeActivities[currentIndex] || 'Shopping is heating up right now!'}
        </p>
      </div>
    </div>
  );
};
