import * as React from 'react';
import { cn } from '@/lib/utils';

export interface QuoteInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

const baseInputClass =
  'w-full rounded-sm bg-repower-paper border px-4 py-[14px] font-sans text-[15px] text-repower-navy-900 placeholder:text-repower-navy-900/40 transition-colors duration-150 focus:outline-none focus:border-repower-gold focus:ring-[3px] focus:ring-repower-gold/15 disabled:opacity-50';

export const QuoteInput = React.forwardRef<HTMLInputElement, QuoteInputProps>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        baseInputClass,
        invalid ? 'border-repower-mercury-red' : 'border-repower-navy-900/10',
        className
      )}
      {...props}
    />
  )
);
QuoteInput.displayName = 'QuoteInput';

export const QuoteTextarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(
  ({ className, invalid, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        baseInputClass,
        'min-h-[96px] resize-y',
        invalid ? 'border-repower-mercury-red' : 'border-repower-navy-900/10',
        className
      )}
      {...props}
    />
  )
);
QuoteTextarea.displayName = 'QuoteTextarea';

export { baseInputClass as quoteInputClass };
