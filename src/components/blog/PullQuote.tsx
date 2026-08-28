import { motion } from 'framer-motion';

export interface PullQuoteProps {
  quote: string;
  attribution?: string;
  source?: string;
}

// Render inline **bold** spans as Mercury-red accent highlights.
// Plain text otherwise. Avoids a full markdown dependency for one inline rule.
function renderQuoteWithAccents(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const m = /^\*\*([^*]+)\*\*$/.exec(part);
    if (m) {
      return (
        <span key={i} className="text-mercury-red font-semibold">
          {m[1]}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function PullQuote({ quote, attribution, source }: PullQuoteProps) {
  const hasFooter = Boolean(attribution || source);
  return (
    <motion.div
      initial={{ y: 8 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="my-8 w-full bg-repower-paper p-4 rounded-2xl shadow-sm border border-border/30"
    >
      <div className="bg-repower-navy-900 text-repower-paper rounded-xl p-8 md:p-10 relative overflow-hidden">
        <span
          aria-hidden="true"
          className="absolute top-2 left-4 md:top-3 md:left-6 font-display text-mercury-red leading-none select-none pointer-events-none"
          style={{ fontSize: '6rem' }}
        >
          &ldquo;
        </span>
        <blockquote className="relative font-display text-2xl md:text-3xl leading-tight font-semibold text-balance text-repower-paper m-0 pt-8 md:pt-6">
          {renderQuoteWithAccents(quote)}
        </blockquote>
        {hasFooter ? (
          <div className="mt-6 flex items-center gap-3 text-[11px] uppercase tracking-[0.14em] text-repower-paper/70 font-medium">
            <span aria-hidden="true">&ndash;</span>
            {attribution ? <span>{attribution}</span> : null}
            {attribution && source ? <span aria-hidden="true">&ndash;</span> : null}
            {source ? <span>{source}</span> : null}
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

export default PullQuote;
