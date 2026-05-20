/**
 * MercuryPriceTable — blog directive component.
 *
 * Renders the current Mercury outboard price table grouped by HP class,
 * sourced from src/data/mercury-dealer-prices.csv via motorPriceTable.ts.
 *
 * Authoring directive (in blog markdown):
 *
 *   ::mercury-price-table
 *   ::
 *
 * Optional params:
 *   group: portable | mid-range | high-output | v6-v8
 *   minHp: 25
 *   maxHp: 150
 *
 * Default (no params) renders the full curated list.
 */

import {
  filterMotorPriceRows,
  formatCad,
  groupRows,
  type MotorGroupKey,
} from '@/data/motorPriceTable';

export interface MercuryPriceTableProps {
  group?: MotorGroupKey;
  minHp?: number;
  maxHp?: number;
}

export function MercuryPriceTable({ group, minHp, maxHp }: MercuryPriceTableProps) {
  const rows = filterMotorPriceRows({ group, minHp, maxHp });
  const grouped = groupRows(rows);

  if (grouped.length === 0) {
    return null;
  }

  return (
    <div className="my-8 w-full rounded-xl border-2 border-repower-navy-900 bg-white shadow-sm overflow-hidden">
      <div className="px-6 pt-6 md:px-8 md:pt-8">
        <div className="text-[11px] uppercase tracking-[0.14em] font-medium text-muted-foreground mb-2">
          Mercury Outboard Pricing (CAD)
        </div>
        <h3 className="font-display font-bold text-2xl text-repower-navy-900 m-0 text-balance tracking-tight">
          Current dealer pricing by HP class
        </h3>
        <p className="font-sans text-sm text-muted-foreground leading-relaxed mt-2 mb-0">
          Bare motor pricing in CAD, before HST. Pricing tracks the same CSV the rest of the site uses.
        </p>
      </div>

      <div className="px-6 py-6 md:px-8 md:py-8 flex flex-col gap-8">
        {grouped.map(({ group: g, rows: gRows }) => (
          <section key={g.key} className="flex flex-col gap-3">
            <header>
              <h4 className="font-display font-semibold text-lg text-repower-navy-900 m-0">
                {g.label}
              </h4>
              <p className="text-xs text-muted-foreground m-0 mt-0.5">{g.description}</p>
            </header>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-repower-navy-900/30">
                    <th className="text-left py-2 pr-3 font-display font-semibold text-repower-navy-900">Model</th>
                    <th className="text-right py-2 px-3 font-display font-semibold text-repower-navy-900 tabular-nums w-16">HP</th>
                    <th className="text-right py-2 pl-3 font-display font-semibold text-repower-navy-900 tabular-nums w-32">Price (CAD)</th>
                  </tr>
                </thead>
                <tbody>
                  {gRows.map((r) => (
                    <tr
                      key={r.modelNumber}
                      className="border-b border-border/40 last:border-b-0"
                    >
                      <td className="py-2 pr-3 text-repower-navy-900">{r.description}</td>
                      <td className="py-2 px-3 text-right tabular-nums text-repower-navy-900">{r.hp}</td>
                      <td className="py-2 pl-3 text-right tabular-nums font-semibold text-repower-navy-900">
                        {formatCad(r.dealerPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>

      <div className="border-t border-repower-navy-900/15 px-6 py-4 md:px-8 text-xs text-muted-foreground italic">
        Motor prices are the bare motor. A full repower also includes rigging, controls, and installation.{' '}
        <a
          href="/quote/motor-selection"
          className="text-mercury-red font-semibold not-italic underline underline-offset-2"
        >
          Build an installed total in the quote builder
        </a>
        .
      </div>
    </div>
  );
}

export default MercuryPriceTable;
