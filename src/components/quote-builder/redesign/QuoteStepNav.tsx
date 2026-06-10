import { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuoteStepNavProps {
  onBack?: () => void;
  onContinue?: () => void;
  backLabel?: string;
  continueLabel?: string;
  continueDisabled?: boolean;
  rightSlot?: ReactNode;
  hideBack?: boolean;
}

const primaryClass =
  "group inline-flex items-center justify-center gap-2 px-7 py-4 rounded bg-repower-mercury-red text-repower-cream font-sans font-bold text-[13px] uppercase tracking-[0.12em] transition-all duration-200 hover:bg-repower-mercury-red-deep hover:-translate-y-px hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none";

const secondaryClass =
  "inline-flex items-center justify-center gap-2 px-7 py-4 rounded bg-transparent border border-repower-navy-900/20 text-repower-navy-900 font-sans font-bold text-[13px] uppercase tracking-[0.12em] transition-colors duration-200 hover:bg-repower-navy-900/5";

export function QuoteStepNav({
  onBack,
  onContinue,
  backLabel = 'Back',
  continueLabel = 'Continue',
  continueDisabled,
  rightSlot,
  hideBack,
}: QuoteStepNavProps) {
  return (
    <>
      {/* Desktop: inline */}
      <div className="hidden md:flex items-center justify-between pt-8 mt-2 border-t border-repower-navy-900/10">
        <div>
          {!hideBack && onBack && (
            <button type="button" onClick={onBack} className={secondaryClass}>
              {backLabel}
            </button>
          )}
        </div>
        <div className="flex items-center gap-6">
          {rightSlot}
          {onContinue && (
            <button type="button" onClick={onContinue} disabled={continueDisabled} className={primaryClass}>
              {continueLabel}
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile: sticky bottom */}
      <div className="md:hidden h-[152px]" aria-hidden />
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-repower-paper border-t border-repower-navy-900/10 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] flex flex-col gap-2">
        {rightSlot && <div className="flex items-center justify-center text-center">{rightSlot}</div>}
        {onContinue && (
          <button type="button" onClick={onContinue} disabled={continueDisabled} className={cn(primaryClass, 'w-full')}>
            {continueLabel}
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
        {!hideBack && onBack && (
          <button type="button" onClick={onBack} className={cn(secondaryClass, 'w-full')}>
            {backLabel}
          </button>
        )}
      </div>
    </>
  );
}
