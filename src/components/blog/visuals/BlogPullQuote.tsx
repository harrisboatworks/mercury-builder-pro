import React from 'react';

export interface BlogPullQuoteProps {
  quote: string;
  attribution?: string;
}

export function BlogPullQuote({ quote, attribution }: BlogPullQuoteProps) {
  return (
    <figure className="not-prose my-8 rounded-2xl bg-repower-navy-900 text-repower-paper p-6 md:p-8 shadow-sm relative overflow-hidden print:bg-white print:text-black print:border print:border-black/40">
      <span
        aria-hidden="true"
        className="absolute top-1 left-4 font-display text-repower-mercury-red leading-none select-none pointer-events-none"
        style={{ fontSize: '5rem' }}
      >
        &ldquo;
      </span>
      <span
        aria-hidden="true"
        className="absolute left-0 top-6 bottom-6 w-[3px] bg-repower-mercury-red"
      />
      <blockquote className="relative pl-6 md:pl-8 font-display text-xl md:text-2xl leading-snug font-semibold text-balance">
        {quote}
      </blockquote>
      {attribution && (
        <figcaption className="mt-4 pl-6 md:pl-8 text-xs md:text-sm uppercase tracking-[0.14em] text-repower-paper/70 print:text-black/70">
          — {attribution}
        </figcaption>
      )}
    </figure>
  );
}

export default BlogPullQuote;
