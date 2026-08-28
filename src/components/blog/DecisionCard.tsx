import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

export interface DecisionCardColumn {
  label: string;
  criteria: string[];
  outcome: string;
  variant?: 'recommended' | 'alternative';
}

export interface DecisionCardProps {
  eyebrow?: string;
  heading: string;
  subhead?: string;
  leftColumn: DecisionCardColumn;
  rightColumn: DecisionCardColumn;
  whenInDoubt?: string;
}

function Column({
  column,
  defaultVariant,
  index,
}: {
  column: DecisionCardColumn;
  defaultVariant: 'recommended' | 'alternative';
  index: number;
}) {
  const variant = column.variant ?? defaultVariant;
  const isRecommended = variant === 'recommended';
  const edgeClass = isRecommended
    ? 'border-l-[3px] border-l-mercury-red bg-mercury-red/5'
    : 'border-l-[3px] border-l-repower-navy-900 bg-white';
  const outcomeClass = isRecommended
    ? 'bg-repower-navy-900 text-white'
    : 'bg-repower-paper text-repower-navy-900 border border-repower-navy-900/15';
  return (
    <motion.div
      initial={{ y: 8 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className={`flex flex-col gap-4 p-6 md:p-8 flex-1 ${edgeClass}`}
    >
      <div className="text-[11px] uppercase tracking-[0.14em] font-medium text-muted-foreground">
        {column.label}
      </div>
      <ul className="flex flex-col gap-2.5 list-none pl-0 m-0">
        {column.criteria.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-repower-navy-900 leading-snug">
            <Check className="h-4 w-4 mt-0.5 flex-shrink-0 text-repower-navy-900" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <div className={`mt-auto rounded-full px-4 py-2 text-center text-sm font-display font-semibold ${outcomeClass}`}>
        {column.outcome}
      </div>
    </motion.div>
  );
}

export function DecisionCard({
  eyebrow,
  heading,
  subhead,
  leftColumn,
  rightColumn,
  whenInDoubt,
}: DecisionCardProps) {
  return (
    <div className="my-8 w-full rounded-xl border-2 border-repower-navy-900 bg-white shadow-sm overflow-hidden">
      <div className="px-6 pt-6 md:px-8 md:pt-8">
        {eyebrow ? (
          <div className="text-[11px] uppercase tracking-[0.14em] font-medium text-muted-foreground mb-2">
            {eyebrow}
          </div>
        ) : null}
        <h3 className="font-display font-bold text-2xl text-repower-navy-900 m-0 text-balance tracking-tight">
          {heading}
        </h3>
        {subhead ? (
          <p className="font-sans text-sm text-muted-foreground leading-relaxed mt-2 mb-0">
            {subhead}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col md:flex-row mt-2 divide-y md:divide-y-0 md:divide-x divide-repower-navy-900/15">
        <Column column={leftColumn} defaultVariant="recommended" index={0} />
        <Column column={rightColumn} defaultVariant="alternative" index={1} />
      </div>
      {whenInDoubt ? (
        <div className="border-t border-repower-navy-900/15 px-6 py-4 md:px-8 text-sm italic text-repower-navy-900/80 text-center">
          <span className="font-semibold not-italic mr-1">When in doubt:</span>
          {whenInDoubt}
        </div>
      ) : null}
    </div>
  );
}

export default DecisionCard;
