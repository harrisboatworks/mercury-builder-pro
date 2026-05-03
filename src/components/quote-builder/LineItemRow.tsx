import { cn } from '@/lib/utils';
import { money } from '@/lib/quote-utils';

interface LineItemRowProps {
  label: string;
  amount: number;
  description?: string;
  isDiscount?: boolean;
  isTotal?: boolean;
  isSubtotal?: boolean;
  className?: string;
  staggerIndex?: number;
}

export function LineItemRow({
  label,
  amount,
  description,
  isDiscount = false,
  isTotal = false,
  isSubtotal = false,
  className,
  staggerIndex,
}: LineItemRowProps) {
  const staggerClass = staggerIndex !== undefined ? `stagger-${Math.min(staggerIndex, 8)}` : '';

  if (isTotal) {
    return (
      <div
        className={cn(
          'flex items-baseline justify-between py-5 border-t-2 spec-row-animate opacity-0',
          staggerClass,
          className
        )}
        style={{ borderTopColor: 'rgba(10, 22, 40, 0.10)' }}
      >
        <div className="font-sans font-semibold text-repower-navy-900/70 uppercase" style={{ fontSize: 14, letterSpacing: '0.18em' }}>
          {label}
        </div>
        <div className="font-display font-bold text-repower-navy-900 tabular-nums text-right" style={{ fontSize: 36, letterSpacing: '-0.025em', lineHeight: 1 }}>
          {money(amount)}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-baseline justify-between py-3 border-b border-repower-navy-900/10 spec-row-animate opacity-0',
        staggerClass,
        isSubtotal && 'border-t border-repower-navy-900/15',
        className
      )}
    >
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            'font-sans',
            isDiscount ? 'text-repower-mercury-red font-semibold' : 'text-repower-navy-900 font-medium'
          )}
          style={{ fontSize: 16 }}
        >
          {label}
        </div>
        {description && (
          <div className="font-sans text-repower-navy-900/55 mt-0.5" style={{ fontSize: 13 }}>
            {description}
          </div>
        )}
      </div>
      <div
        className={cn(
          'font-display font-semibold tabular-nums text-right',
          isDiscount ? 'text-repower-mercury-red' : 'text-repower-navy-900'
        )}
        style={{ fontSize: 18, letterSpacing: '-0.01em' }}
      >
        {isDiscount && '−'}
        {money(amount)}
      </div>
    </div>
  );
}
