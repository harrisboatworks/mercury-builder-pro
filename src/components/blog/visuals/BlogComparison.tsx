import React from 'react';

export interface BlogComparisonProps {
  title?: string;
  columns: string[];
  rows: { label: string; values: string[] }[];
  note?: string;
}

export function BlogComparison({ title, columns, rows, note }: BlogComparisonProps) {
  return (
    <figure
      role="group"
      aria-label={title || 'Comparison'}
      className="not-prose my-8 rounded-2xl border border-repower-navy-900/10 bg-repower-paper p-5 md:p-6 shadow-sm print:shadow-none print:border-black/40"
    >
      {title && (
        <figcaption className="font-display text-lg md:text-xl font-semibold text-repower-navy-900 mb-4">
          {title}
        </figcaption>
      )}
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-sm md:text-[15px] border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="sticky left-0 bg-repower-paper text-left font-semibold text-repower-navy-900/70 py-2 pr-3 align-bottom">
                <span className="sr-only">Attribute</span>
              </th>
              {columns.map((c, i) => (
                <th
                  key={i}
                  scope="col"
                  className="text-left font-semibold text-repower-navy-900 py-2 px-3 border-b-2 border-repower-mercury-red/70 whitespace-nowrap"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={ri} className={ri % 2 ? 'bg-repower-cream/40' : ''}>
                <th
                  scope="row"
                  className="sticky left-0 bg-inherit text-left font-medium text-repower-navy-900/80 py-3 pr-3 align-top whitespace-nowrap"
                >
                  {r.label}
                </th>
                {r.values.map((v, vi) => (
                  <td
                    key={vi}
                    className="py-3 px-3 align-top text-repower-navy-900 border-t border-repower-navy-900/10"
                  >
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note && (
        <p className="mt-4 text-xs md:text-sm text-repower-navy-900/65 italic">{note}</p>
      )}
    </figure>
  );
}

export default BlogComparison;
