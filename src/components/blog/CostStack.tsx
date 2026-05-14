import { motion } from 'framer-motion';

export interface CostStackItem {
  label: string;
  value: string;
  note?: string;
  accent?: boolean;
}

export interface CostStackProps {
  eyebrow?: string;
  heading: string;
  subhead?: string;
  items: CostStackItem[];
  total?: { label: string; value: string };
  caveat?: string;
}

export function CostStack({ eyebrow, heading, subhead, items, total, caveat }: CostStackProps) {
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
          <p className="font-sans text-sm text-muted-foreground leading-relaxed mt-2 mb-0">{subhead}</p>
        ) : null}
      </div>
      <div className="px-6 py-6 md:px-8 md:py-8 flex flex-col">
        {items.map((item, i) => {
          const dividerClass = i > 0 ? 'border-t border-border/40 pt-3 mt-3' : '';
          const rowAccent = item.accent
            ? 'bg-mercury-red/5 border-l-2 border-l-mercury-red'
            : '';
          const valueClass = item.accent ? 'text-mercury-red' : 'text-repower-navy-900';
          return (
            <div key={i} className={`flex flex-col gap-1 ${dividerClass}`}>
              <div className={`flex items-center justify-between gap-4 rounded-md px-4 py-3 ${rowAccent}`}>
                <span className="font-display font-semibold text-repower-navy-900 text-sm md:text-base">
                  {item.label}
                </span>
                <span className={`font-display font-bold text-sm md:text-base text-right tabular-nums ${valueClass}`}>
                  {item.value}
                </span>
              </div>
              {item.note ? (
                <p className="italic text-muted-foreground text-xs px-1 m-0">{item.note}</p>
              ) : null}
            </div>
          );
        })}
      </div>
      {total ? (
        <div className="bg-repower-paper border-t-2 border-repower-navy-900/30 text-repower-navy-900 px-6 py-4 md:px-8 flex items-center justify-between gap-4">
          <span className="font-display font-bold text-lg tracking-tight">{total.label}</span>
          <span className="font-display font-bold text-xl text-right tabular-nums">{total.value}</span>
        </div>
      ) : null}
      {caveat ? (
        <div className="border-t border-repower-navy-900/15 px-6 py-3 md:px-8 text-center italic text-muted-foreground text-xs">
          {caveat}
        </div>
      ) : null}
    </div>
  );
}

export default CostStack;
