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
}

export function CompareButton({ 
  isInComparison, 
  isFull, 
  onToggle, 
  count,
  className,
  size = 'sm'
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

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleClick}
            disabled={disabled}
            className={cn(
              buttonSize,
              'rounded-full flex items-center justify-center transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2',
              isInComparison 
                ? 'bg-primary text-primary-foreground shadow-md' 
                : 'bg-white/90 backdrop-blur-sm text-gray-600 hover:bg-gray-100 border border-gray-200 hover:shadow-md hover:shadow-primary/10 hover:border-primary/30',
              disabled && 'opacity-50 cursor-not-allowed',
              className
            )}
            aria-label={isInComparison ? 'Remove from comparison' : 'Add to comparison'}
            aria-pressed={isInComparison}
          >
            <Scale size={iconSize} />
          </button>
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
