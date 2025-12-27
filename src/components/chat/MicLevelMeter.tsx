import React from 'react';
import { cn } from '@/lib/utils';

interface MicLevelMeterProps {
  level: number; // 0-1 RMS
  peak?: number; // 0-1 peak
  isActive: boolean;
  className?: string;
}

export const MicLevelMeter: React.FC<MicLevelMeterProps> = ({
  level,
  peak,
  isActive,
  className,
}) => {
  // Convert to dB scale for better visual representation
  const levelDb = level > 0 ? 20 * Math.log10(level) : -60;
  const normalizedLevel = Math.max(0, Math.min(1, (levelDb + 60) / 60)); // -60dB to 0dB range
  
  // Color based on level
  const getColor = () => {
    if (!isActive) return 'bg-muted';
    if (normalizedLevel > 0.9) return 'bg-destructive'; // Clipping
    if (normalizedLevel > 0.7) return 'bg-yellow-500';
    if (normalizedLevel > 0.1) return 'bg-green-500';
    return 'bg-muted-foreground/30';
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative flex-1 h-2 bg-muted rounded-full overflow-hidden">
        {/* Level bar */}
        <div
          className={cn(
            'absolute inset-y-0 left-0 rounded-full transition-all duration-75',
            getColor()
          )}
          style={{ width: `${normalizedLevel * 100}%` }}
        />
        {/* Peak indicator */}
        {peak !== undefined && peak > 0 && isActive && (
          <div
            className="absolute inset-y-0 w-0.5 bg-foreground/50"
            style={{ 
              left: `${Math.max(0, Math.min(1, (20 * Math.log10(peak) + 60) / 60)) * 100}%` 
            }}
          />
        )}
      </div>
      {/* dB label */}
      <span className="text-[10px] font-mono text-muted-foreground w-10 text-right">
        {isActive && level > 0.001 ? `${levelDb.toFixed(0)}dB` : '—'}
      </span>
    </div>
  );
};
