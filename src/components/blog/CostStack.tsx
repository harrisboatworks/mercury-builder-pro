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
          <div className="text-xs font-bold uppercase tracking-wide text-mercury-red mb-2">
            {eyebrow}
          </div>
        ) : null}
        <h3 className="font-display font-bold text-2xl text-repower-navy-900 m-0">{heading}</h3>
        {subhead ? (
          <p className="font-sans text-sm text-repower-navy-900/70 mt-2 mb-0">{subhead}</p>
        ) : null}
      </div>
      <div className="px-6 py-6 md:px-8 md:py-8 flex flex-col gap-3">
        {items.map((item, i) => {
          const barClass = item.accent
            ? 'bg-repower-mercury-red/15'
            : 'bg-repower-navy-900/10';
          const valueClass = item.accent ? 'text-mercury-red' : 'text-repower-navy-900';
          return (
            <div key={i} className="flex flex-col gap-1">
              <div className={`flex items-center justify-between gap-4 rounded-md px-4 py-3 ${barClass}`}>
                <span className="font-display font-semibold text-repower-navy-900 text-sm md:text-base">
                  {item.label}
                </span>
                <span className={`font-display font-bold text-sm md:text-base ${valueClass}`}>
                  {item.value}
                </span>
              </div>
              {item.note ? (
                <p className="italic text-repower-navy-900/60 text-xs px-1 m-0">{item.note}</p>
              ) : null}
            </div>
          );
        })}
      </div>
      {total ? (
        <div className="bg-repower-navy-900 text-white px-6 py-4 md:px-8 flex items-center justify-between gap-4">
          <span className="font-display font-bold text-lg">{total.label}</span>
          <span className="font-display font-bold text-lg">{total.value}</span>
        </div>
      ) : null}
      {caveat ? (
        <div className="border-t border-repower-navy-900/15 px-6 py-3 md:px-8 text-center italic text-repower-navy-900/60 text-xs">
          {caveat}
        </div>
      ) : null}
    </div>
  );
}

export default CostStack;
