import React from 'react';
import { useMotorView, ViewMode } from '@/contexts/MotorViewContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function ViewModeToggle() {
  const { viewMode, setViewMode } = useMotorView();
  
  return (
    <TooltipProvider>
      <div className="inline-flex items-center rounded-full bg-gray-100 p-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setViewMode('simple')}
              className={`px-4 py-1.5 text-xs tracking-wide font-medium rounded-full transition-all duration-200 ${
                viewMode === 'simple'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Simple
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            <p>Browse by horsepower with guided selection</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setViewMode('expert')}
              className={`px-4 py-1.5 text-xs tracking-wide font-medium rounded-full transition-all duration-200 ${
                viewMode === 'expert'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Expert
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            <p>View all model variants directly</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
