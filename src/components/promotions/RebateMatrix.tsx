import { cn } from '@/lib/utils';

interface RebateRow {
  hp_min: number;
  hp_max: number;
  rebate: number;
}

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
    return highlightHP >= row.hp_min && highlightHP <= row.hp_max;
  };

  if (compact) {
    return (
      <div className={cn('grid grid-cols-2 gap-2 text-sm', className)}>
        {matrix.map((row, index) => (
          <div
            key={index}
            className={cn(
              'flex justify-between px-3 py-2 rounded-lg',
              isHighlighted(row)
                ? 'bg-primary text-primary-foreground font-semibold'
                : 'bg-muted'
            )}
          >
            <span>{formatHPRange(row)}</span>
            <span className="font-medium">${row.rebate}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('overflow-hidden rounded-lg border border-border', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50">
            <th className="text-left px-4 py-3 font-semibold text-foreground">Horsepower Range</th>
            <th className="text-right px-4 py-3 font-semibold text-foreground">Rebate Amount</th>
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, index) => (
            <tr
              key={index}
              className={cn(
                'border-t border-border transition-colors',
                isHighlighted(row)
                  ? 'bg-primary/10 font-semibold'
                  : index % 2 === 0 ? 'bg-white' : 'bg-muted/20'
              )}
            >
              <td className="px-4 py-3">
                <span className={cn(isHighlighted(row) && 'text-primary')}>
                  {formatHPRange(row)}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className={cn(
                  'font-semibold',
                  isHighlighted(row) ? 'text-primary' : 'text-green-600'
                )}>
                  ${row.rebate.toLocaleString()}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Helper to calculate rebate amount for a given HP
 */
export function getRebateForHP(matrix: RebateRow[], hp: number): number | null {
  const match = matrix.find(row => hp >= row.hp_min && hp <= row.hp_max);
  return match ? match.rebate : null;
}
