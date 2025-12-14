import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { parseMotorCodes, MOTOR_CODES } from '@/lib/motor-codes';
import { HelpCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface MotorCodeTooltipProps {
  modelName: string;
  showIcon?: boolean;
  className?: string;
}

export function MotorCodeTooltip({ modelName, showIcon = true, className = '' }: MotorCodeTooltipProps) {
  const codes = parseMotorCodes(modelName);
  const isMobile = useIsMobile();
  
  if (codes.length === 0) return null;
  
  const content = (
    <div className="space-y-2 max-w-xs">
      <p className="font-medium text-sm border-b pb-2 mb-2">
        📖 Model Code Breakdown
      </p>
      {codes.map(({ code, definition }) => (
        <div key={code} className="flex gap-2 text-sm">
          <span className="font-mono font-bold text-gray-900 w-12">{code}</span>
          <div>
            <span className="text-gray-700">{definition.meaning}</span>
            <p className="text-gray-500 text-xs">{definition.benefit}</p>
          </div>
        </div>
      ))}
    </div>
  );
  
  // Use Popover on mobile for better UX
  if (isMobile) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button 
            className={`inline-flex items-center gap-1 text-gray-400 hover:text-gray-600 ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            {showIcon && <HelpCircle className="w-3.5 h-3.5" />}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-4" align="start">
          {content}
        </PopoverContent>
      </Popover>
    );
  }
  
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <button 
            className={`inline-flex items-center gap-1 text-gray-400 hover:text-gray-600 ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            {showIcon && <HelpCircle className="w-3.5 h-3.5" />}
          </button>
        </TooltipTrigger>
        <TooltipContent className="w-72 p-4" side="right">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Inline component for displaying decoded model name with highlighted codes
export function DecodedModelName({ modelName }: { modelName: string }) {
  const codes = parseMotorCodes(modelName);
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="font-semibold">{modelName}</span>
        <MotorCodeTooltip modelName={modelName} />
      </div>
      
      {codes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {codes.map(({ code, definition }) => (
            <span 
              key={code}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700"
            >
              <span>{definition.icon}</span>
              <span>{definition.meaning}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
