import { cn } from '@/lib/utils';
import type { RebateTier } from '@/lib/promotion-discounts';

interface RebateTableProps {
  matrix: RebateTier[];
  className?: string;
}

export function RebateTable({ matrix, className }: RebateTableProps) {
  if (!matrix.length) return null;

  return (
    <div className={cn('overflow-hidden rounded-xl border border-repower-navy-900/10 bg-white', className)}>
      <table className="w-full text-left text-sm sm:text-base">
        <caption className="sr-only">Factory rebates by engine horsepower, in Canadian dollars</caption>
        <thead className="bg-repower-navy-900 text-white">
          <tr>
            <th scope="col" className="px-5 py-4 font-semibold">Horsepower</th>
            <th scope="col" className="px-5 py-4 text-right font-semibold">Rebate (CAD)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-repower-navy-900/10">
          {matrix.map(row => (
            <tr key={`${row.hp_min}-${row.hp_max}`}>
              <th scope="row" className="px-5 py-4 font-medium text-repower-navy-900">
                {row.hp_min === row.hp_max ? row.hp_min : `${row.hp_min}–${row.hp_max}`} HP
              </th>
              <td className="px-5 py-4 text-right font-bold text-repower-mercury-red">
                ${row.rebate.toLocaleString('en-CA')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-repower-navy-900/10 bg-repower-cream px-5 py-4 text-xs leading-relaxed text-repower-navy-900/70">
        Eligible rebates are included in your quote by horsepower, subject to dealer verification. Qualifying promo financing can be added (OAC).
      </p>
    </div>
  );
}
