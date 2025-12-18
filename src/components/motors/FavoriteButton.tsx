import React from 'react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface FavoriteButtonProps {
  isFavorite: boolean;
  onToggle: () => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function FavoriteButton({ 
  isFavorite, 
  onToggle, 
  className,
  size = 'sm'
}: FavoriteButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle();
  };

  const iconSize = size === 'sm' ? 16 : 20;
  const buttonSize = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleClick}
            className={cn(
              buttonSize,
              'rounded-full flex items-center justify-center transition-all duration-200',
              isFavorite 
                ? 'bg-red-50 text-red-500 shadow-md' 
                : 'bg-white/90 backdrop-blur-sm text-gray-600 hover:bg-gray-100 border border-gray-200',
              'active:scale-90',
              className
            )}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart 
              size={iconSize} 
              className={cn(
                'transition-all duration-200',
                isFavorite && 'fill-red-500'
              )}
            />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
