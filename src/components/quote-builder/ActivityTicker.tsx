import React, { useEffect, useMemo, useState } from 'react';

interface ActivityTickerProps {
  activities?: string[];
  intervalMs?: number;
}

export const ActivityTicker: React.FC<ActivityTickerProps> = ({
  activities = [
    'Mike from Peterborough just reserved a 50HP Mercury',
    'Sarah from Rice Lake is viewing this motor',
    '3 people got quotes in the last hour',
    'Spring installation spots: 7 remaining',
    'Last 9.9HP ProKicker sold 2 hours ago',
  ],
  intervalMs = 5000,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const safeActivities = useMemo(() => (activities.length > 0 ? activities : ['Shopping is heating up right now!']), [activities]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % safeActivities.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs, safeActivities.length]);

  return (
    <div className="activity-ticker rounded-md border-l-4 border-primary bg-accent/30 p-3 mb-4" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 bg-in-stock rounded-full pulse" aria-hidden="true" />
        <p className="text-sm text-muted-foreground animate-fade-in">
          {safeActivities[currentIndex]}
        </p>
      </div>
    </div>
  );
};
