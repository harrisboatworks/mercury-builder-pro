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
  staggerIndex
}: LineItemRowProps) {
  const staggerClass = staggerIndex !== undefined ? `stagger-${Math.min(staggerIndex, 8)}` : '';
  
  return (
    <div className={cn(
      "flex items-center justify-between py-2 spec-row-animate opacity-0",
      staggerClass,
      isTotal && "border-t border-border font-semibold text-lg",
      isSubtotal && "border-t border-border/50 font-medium",
      className
    )}>
      <div className="flex-1">
        <div className={cn(
          "text-sm",
          isTotal ? "text-primary font-semibold" : "text-foreground",
          isDiscount && "text-emerald-600 dark:text-emerald-400"
        )}>
          {label}
        </div>
        {description && (
          <div className="text-xs text-muted-foreground">
            {description}
          </div>
        )}
      </div>
      <div className={cn(
        "text-right font-medium tabular-nums",
        isTotal ? "text-lg font-semibold text-primary" : "text-foreground",
        isDiscount ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
      )}>
        {isDiscount && "−"}{money(amount)}
      </div>
    </div>
  );
}