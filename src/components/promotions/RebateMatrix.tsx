import { cn } from '@/lib/utils';
import {
  getRebateTierForHP,
  resolveRebateForHP,
  type RebateTier,
} from '@/lib/promotion-discounts';

type RebateRow = RebateTier;

interface RebateMatrixProps {
  matrix: RebateRow[];
  highlightHP?: number;
  compact?: boolean;
  className?: string;
}

export function RebateMatrix({ matrix, highlightHP, compact = false, className }: RebateMatrixProps) {
  const formatHPRange = (row: RebateRow) => {
    if (row.hp_min === row.hp_max) {
      return `${row.hp_min}HP`;
    }
    return `${row.hp_min}–${row.hp_max}HP`;
  };

  const isHighlighted = (row: RebateRow) => {
    if (!highlightHP) return false;
    return getRebateTierForHP(matrix, highlightHP) === row;
  };

  if (compact) {
    return (
      <div className={cn('grid grid-cols-2 gap-2', className)}>
        {matrix.map((row, index) => {
          const active = isHighlighted(row);
          return (
            <div
              key={index}
              data-testid="rebate-matrix-row"
              data-highlighted={active ? 'true' : 'false'}
              className={cn(
                'flex items-center justify-between px-3 py-2 rounded-[10px] border transition-colors',
                active
                  ? 'bg-[hsl(var(--repower-cream-deep))] border-repower-navy-900/15'
                  : 'bg-white border-repower-navy-900/10'
              )}
            >
              <span className="flex items-center gap-2 font-medium text-[13px] text-repower-navy-900">
                <span
                  data-testid="rebate-matrix-dot"
                  className={cn(
                    'inline-block w-1.5 h-1.5 rounded-full',
                    active ? 'bg-repower-gold' : 'bg-transparent'
                  )}
                  aria-hidden="true"
                />
                {formatHPRange(row)}
              </span>
              <span className="font-display font-bold text-[14px] text-repower-mercury-red">
                ${row.rebate.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-[12px] border border-repower-navy-900/10 bg-repower-cream p-8',
        className
      )}
    >
      <div className="mb-5 space-y-1">
        <h3 className="font-display font-semibold text-[22px] text-repower-navy-900">
          Rebate by Horsepower
        </h3>
        <p
          className="text-[14px] text-repower-navy-900"
          style={{ color: 'hsl(var(--repower-navy-900) / 0.65)' }}
        >
          Find your factory rebate based on motor horsepower.
        </p>
      </div>

      <ul className="divide-y divide-repower-navy-900/10">
        {matrix.map((row, index) => {
          const active = isHighlighted(row);
          return (
            <li
              key={index}
              data-testid="rebate-matrix-row"
              data-highlighted={active ? 'true' : 'false'}
              className={cn(
                'flex items-center justify-between py-3 px-3 -mx-3 rounded-[8px] transition-colors',
                active && 'bg-[hsl(var(--repower-cream-deep))]'
              )}
            >
              <span className="flex items-center gap-3">
                <span
                  data-testid="rebate-matrix-dot"
                  className={cn(
                    'inline-block w-1.5 h-1.5 rounded-full',
                    active ? 'bg-repower-gold' : 'bg-transparent'
                  )}
                  aria-hidden="true"
                />
                <span className="font-medium text-[14px] text-repower-navy-900">
                  {formatHPRange(row)}
                </span>
              </span>
              <span className="font-display font-bold text-[16px] text-repower-mercury-red">
                ${row.rebate.toLocaleString()}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Helper to calculate rebate amount for a given HP
 */
export function getRebateForHP(matrix: RebateRow[], hp: number): number | null {
  return resolveRebateForHP(matrix, hp);
}
