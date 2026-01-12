import { cn } from '@/lib/utils';
import { Percent } from 'lucide-react';

interface FinancingRate {
  months: number;
  rate: number;
}

interface FinancingRatesCardProps {
  rates: FinancingRate[];
  minimumAmount?: number;
  highlightTerm?: number;
  compact?: boolean;
  className?: string;
}

export function FinancingRatesCard({
  rates,
  minimumAmount = 5000,
  highlightTerm,
  compact = false,
  className,
}: FinancingRatesCardProps) {
  if (compact) {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {rates.map((rate) => (
          <div
            key={rate.months}
            className={cn(
              'px-3 py-2 rounded-lg text-center',
              highlightTerm === rate.months
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            )}
          >
            <div className="text-xs text-muted-foreground">{rate.months}mo</div>
            <div className="font-semibold">{rate.rate}%</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Rates grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {rates.map((rate) => (
          <div
            key={rate.months}
            className={cn(
              'text-center p-4 rounded-xl border-2 transition-all',
              highlightTerm === rate.months
                ? 'border-primary bg-primary/5'
                : 'border-border bg-white'
            )}
          >
            <div className="text-2xl font-bold text-primary mb-1">
              {rate.rate}%
            </div>
            <div className="text-sm text-muted-foreground">
              {rate.months} months
            </div>
          </div>
        ))}
      </div>

      {/* Minimum notice */}
      {minimumAmount && (
        <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
          <Percent className="w-3 h-3" />
          ${minimumAmount.toLocaleString()} minimum financed amount required
        </p>
      )}
    </div>
  );
}
