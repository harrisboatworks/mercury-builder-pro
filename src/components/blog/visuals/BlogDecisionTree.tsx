import React from 'react';

export interface BlogDecisionTreeNode {
  q: string;
  yes: string;
  no: string;
}

export interface BlogDecisionTreeProps {
  title?: string;
  nodes: BlogDecisionTreeNode[];
  note?: string;
}

export function BlogDecisionTree({ title, nodes, note }: BlogDecisionTreeProps) {
  return (
    <figure
      role="group"
      aria-label={title || 'Decision tree'}
      className="not-prose my-8 rounded-2xl border border-repower-navy-900/10 bg-repower-paper p-5 md:p-6 shadow-sm print:shadow-none print:border-black/40"
    >
      {title && (
        <figcaption className="font-display text-lg md:text-xl font-semibold text-repower-navy-900 mb-5">
          {title}
        </figcaption>
      )}
      <ol className="space-y-4">
        {nodes.map((n, i) => {
          const isLast = i === nodes.length - 1;
          const noIsNext = n.no.trim().toLowerCase() === 'next';
          return (
            <li key={i} className="relative">
              <div className="rounded-xl border border-repower-navy-900/15 bg-white/70 p-4">
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-repower-navy-900 text-repower-paper text-xs font-bold"
                  >
                    {i + 1}
                  </span>
                  <p className="font-semibold text-repower-navy-900 leading-snug">{n.q}</p>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 pl-10">
                  <div className="rounded-lg border-l-[3px] border-repower-mercury-red bg-repower-cream/60 px-3 py-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-repower-mercury-red">
                      Yes
                    </div>
                    <div className="text-sm text-repower-navy-900 font-medium">{n.yes}</div>
                  </div>
                  <div className="rounded-lg border-l-[3px] border-repower-navy-900/40 bg-repower-cream/40 px-3 py-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-repower-navy-900/70">
                      No
                    </div>
                    <div className="text-sm text-repower-navy-900 font-medium">
                      {noIsNext && !isLast ? '↓ Next question' : n.no}
                    </div>
                  </div>
                </div>
              </div>
              {!isLast && (
                <div
                  aria-hidden="true"
                  className="mx-auto my-1 h-3 w-px bg-repower-navy-900/25"
                />
              )}
            </li>
          );
        })}
      </ol>
      {note && (
        <p className="mt-4 text-xs md:text-sm text-repower-navy-900/65 italic">{note}</p>
      )}
    </figure>
  );
}

export default BlogDecisionTree;
