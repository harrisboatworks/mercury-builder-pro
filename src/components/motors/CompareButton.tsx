import React from 'react';
import { Scale } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

interface CompareButtonProps {
  isInComparison: boolean;
  isFull: boolean;
  onToggle: () => void;
  count: number;
  className?: string;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export function CompareButton({ 
  isInComparison, 
  isFull, 
  onToggle, 
  count,
  className,
  size = 'sm',
  showLabel = false
}: CompareButtonProps) {
  const disabled = !isInComparison && isFull;
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      onToggle();
      // Show toast feedback
      if (isInComparison) {
        toast.info('Removed from comparison');
      } else {
        toast.success(`Added to comparison (${count + 1}/3)`);
      }
    }
  };

  const iconSize = size === 'sm' ? 16 : 20;
  const buttonSize = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';

  const buttonBody = (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'flex items-center transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2',
        showLabel
          ? 'flex-row h-8 pl-2 pr-3 gap-2 rounded-full bg-repower-cream/95 backdrop-blur-sm text-repower-navy-900 border border-repower-navy-900/15 active:scale-95 whitespace-nowrap'
          : cn(buttonSize, 'rounded-full justify-center', isInComparison 
              ? 'bg-primary text-primary-foreground shadow-md' 
              : 'bg-repower-cream/95 backdrop-blur-sm text-repower-navy-900 hover:bg-repower-paper border border-repower-navy-900/15 hover:shadow-md hover:shadow-primary/10 hover:border-primary/30'),
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      aria-label={isInComparison ? 'Remove from comparison' : 'Add to comparison'}
      aria-pressed={isInComparison}
    >
      <Scale size={iconSize} />
      {showLabel && (
        <span className="text-[11px] font-semibold uppercase tracking-wide">
          Compare
        </span>
      )}
    </button>
  );

  if (showLabel) {
    return buttonBody;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {buttonBody}
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {disabled 
            ? 'Comparison full (3 max)' 
            : isInComparison 
              ? 'Remove from comparison' 
              : `Add to comparison (${count}/3)`
          }
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
