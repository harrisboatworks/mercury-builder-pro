export interface BilingualTrustItem {
  en: string;
  zh: string;
}

export interface BilingualTrustCardProps {
  eyebrow?: string;
  heading: string;
  headingTranslated: string;
  items: BilingualTrustItem[];
  cta?: { en: string; zh: string; href: string };
}

export function BilingualTrustCard({
  eyebrow,
  heading,
  headingTranslated,
  items,
  cta,
}: BilingualTrustCardProps) {
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
        <p
          className="font-sans text-base text-muted-foreground leading-relaxed mt-1 mb-0"
          lang="zh-Hans"
        >
          {headingTranslated}
        </p>
      </div>
      <div className="px-6 py-6 md:px-8 md:py-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item, i) => (
          <div key={i} className="rounded-lg bg-repower-navy-900/5 p-4 flex flex-col gap-1">
            <span className="font-display font-semibold text-repower-navy-900 text-sm">
              {item.en}
            </span>
            <span className="font-sans text-repower-navy-900/70 text-sm" lang="zh-Hans">
              {item.zh}
            </span>
          </div>
        ))}
      </div>
      {cta ? (
        <a
          href={cta.href}
          className="block bg-repower-mercury-red text-white text-center px-6 py-4 md:px-8 hover:opacity-90 transition-opacity"
        >
          <span className="block font-display font-bold text-base">{cta.en}</span>
          <span className="block font-sans text-sm opacity-90 mt-0.5" lang="zh-Hans">
            {cta.zh}
          </span>
        </a>
      ) : null}
    </div>
  );
}

export default BilingualTrustCard;
