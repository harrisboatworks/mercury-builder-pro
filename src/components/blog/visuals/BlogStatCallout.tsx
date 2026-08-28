import React from 'react';

export interface BlogStatCalloutProps {
  stat: string;
  label: string;
  sub?: string;
  accent?: 'navy' | 'red';
}

export function BlogStatCallout({ stat, label, sub, accent = 'navy' }: BlogStatCalloutProps) {
  const statColor =
    accent === 'red' ? 'text-repower-mercury-red' : 'text-repower-navy-900';
  return (
    <aside
      role="figure"
      aria-label={`${stat} — ${label}`}
      className="not-prose my-6 inline-flex w-full md:w-auto flex-col rounded-2xl border border-repower-navy-900/10 bg-repower-paper px-6 py-5 shadow-sm print:shadow-none print:border-black/40"
    >
      <div
        className={`font-display font-bold leading-none ${statColor}`}
        style={{ fontSize: 'clamp(2.25rem, 4vw, 3.25rem)', letterSpacing: '-0.02em' }}
      >
        {stat}
      </div>
      <div className="mt-2 text-sm md:text-base font-semibold text-repower-navy-900/85 max-w-xs">
        {label}
      </div>
      {sub && (
        <div className="mt-1 text-xs md:text-sm text-repower-navy-900/60 max-w-xs">{sub}</div>
      )}
      <div
        aria-hidden="true"
        className="mt-3 h-[3px] w-10 rounded bg-repower-mercury-red"
      />
    </aside>
  );
}

export default BlogStatCallout;
