import React from 'react';

export interface BlogCostBreakdownProps {
  title?: string;
  items: { label: string; note?: string }[];
  note?: string;
}

export function BlogCostBreakdown({ title, items, note }: BlogCostBreakdownProps) {
  return (
    <aside
      role="group"
      aria-label={title || 'Cost breakdown'}
      className="not-prose my-8 rounded-2xl border border-repower-navy-900/10 bg-repower-paper p-5 md:p-6 shadow-sm print:shadow-none print:border-black/40"
    >
      {title && (
        <h3 className="font-display text-lg md:text-xl font-semibold text-repower-navy-900 mb-4">
          {title}
        </h3>
      )}
      <ul className="space-y-3">
        {items.map((it, i) => (
          <li
            key={i}
            className="flex gap-3 rounded-lg bg-white/60 px-3 py-2 border-l-[3px] border-repower-mercury-red"
          >
            <span
              aria-hidden="true"
              className="mt-1 h-2 w-2 rounded-full bg-repower-mercury-red shrink-0"
            />
            <div className="min-w-0">
              <div className="font-semibold text-repower-navy-900">{it.label}</div>
              {it.note && (
                <div className="text-sm text-repower-navy-900/70 mt-0.5">{it.note}</div>
              )}
            </div>
          </li>
        ))}
      </ul>
      {note && (
        <p className="mt-4 text-xs md:text-sm text-repower-navy-900/65 italic">{note}</p>
      )}
    </aside>
  );
}

export default BlogCostBreakdown;
