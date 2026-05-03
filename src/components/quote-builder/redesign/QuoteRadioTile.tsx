import { ReactNode, MouseEvent } from 'react';
import { cn } from '@/lib/utils';

interface QuoteRadioTileProps {
  selected: boolean;
  onClick?: () => void;
  icon?: ReactNode;
  label: ReactNode;
  description?: ReactNode;
  priceTag?: ReactNode;
  badge?: ReactNode;
  multi?: boolean;
  disabled?: boolean;
  trailing?: ReactNode;
  className?: string;
  children?: ReactNode;
}

export function QuoteRadioTile({
  selected,
  onClick,
  icon,
  label,
  description,
  priceTag,
  badge,
  multi,
  disabled,
  trailing,
  className,
  children,
}: QuoteRadioTileProps) {
  const handleClick = (e: MouseEvent) => {
    if (disabled) return;
    onClick?.();
  };

  return (
    <div
      role={multi ? 'checkbox' : 'radio'}
      aria-checked={selected}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={cn(
        'relative flex items-start gap-4 rounded-lg bg-white px-[22px] py-[18px] cursor-pointer transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-repower-gold/40',
        selected
          ? 'border-2 border-repower-navy-900 -m-px'
          : 'border border-repower-navy-900/10 hover:bg-repower-cream',
        disabled && 'opacity-50 cursor-not-allowed hover:bg-white',
        className
      )}
    >
      {selected && (
        <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-repower-mercury-red" aria-hidden />
      )}
      {icon && <div className="shrink-0 text-repower-navy-900/70 mt-0.5">{icon}</div>}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-sans font-semibold text-[16px] text-repower-navy-900 leading-snug">{label}</div>
            {badge && <div className="mt-1">{badge}</div>}
            {description && (
              <div className="mt-1 font-sans text-[14px] text-repower-navy-900/65 leading-snug">{description}</div>
            )}
          </div>
          {priceTag !== undefined && (
            <div className="shrink-0 font-display font-bold text-repower-navy-900 text-right">{priceTag}</div>
          )}
        </div>
        {children}
      </div>
      {trailing}
    </div>
  );
}
