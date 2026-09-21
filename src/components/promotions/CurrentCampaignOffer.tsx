import { Link } from 'react-router-dom';
import { formatPromoCalendarDate } from '@/lib/quote-utils';

export interface CurrentCampaign {
  name: string;
  bonus_description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  image_url?: string | null;
  image_alt_text?: string | null;
  details?: {
    mobile_image_url?: string;
    artwork_clarification?: string;
    coverage_summary?: string;
    financing_qualification?: string;
    legal?: string;
    eligibility?: { products?: string[]; exclusions?: string[]; stock_requirement?: string; use?: string };
    requirements?: string[];
  };
}

/** The current Canadian record owns the campaign text and supplied artwork. */
export function CurrentCampaignOffer({ promotion }: { promotion: CurrentCampaign }) {
  const details = promotion.details;
  return <section className="bg-repower-paper py-8 md:py-12 px-5 md:px-14">
    <div className="max-w-[1100px] mx-auto">
      {promotion.image_url && <picture>
        {details?.mobile_image_url && <source media="(max-width: 639px)" srcSet={details.mobile_image_url} />}
        <img src={promotion.image_url} alt={promotion.image_alt_text || promotion.name} className="w-full h-auto rounded-lg mb-7" fetchPriority="high" />
      </picture>}
      {details?.artwork_clarification && <p className="text-sm leading-relaxed mb-5">{details.artwork_clarification}</p>}
      <p className="text-sm font-semibold uppercase tracking-wide text-repower-mercury-red mb-3">
        {promotion.start_date && formatPromoCalendarDate(promotion.start_date)} – {promotion.end_date && formatPromoCalendarDate(promotion.end_date)}
      </p>
      <h1 className="font-display font-bold text-4xl md:text-5xl text-repower-navy-900 mb-4">{promotion.name}</h1>
      <p className="text-lg leading-relaxed max-w-3xl mb-6">{promotion.bonus_description}</p>
      <Link to="/quote/motor-selection" className="inline-flex min-h-12 items-center rounded bg-repower-mercury-red text-white px-6 py-3 font-semibold mb-8">Build Your Repower Quote</Link>
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        {details?.coverage_summary && <div className="p-5 rounded-lg bg-white border"><h2 className="font-semibold text-xl mb-2">Mercury Product Protection Gold</h2><p>{details.coverage_summary}</p></div>}
        {details?.financing_qualification && <div className="p-5 rounded-lg bg-white border"><h2 className="font-semibold text-xl mb-2">Optional TD repower financing</h2><p>{details.financing_qualification}</p></div>}
      </div>
      <details className="border-t pt-4 text-sm leading-relaxed">
        <summary className="cursor-pointer font-semibold text-base py-2">Eligibility and full offer conditions</summary>
        <p className="mt-3">{details?.eligibility?.products?.join(' ')}</p>
        <p>{details?.eligibility?.use}. {details?.eligibility?.stock_requirement}.</p>
        <ul className="list-disc pl-5 my-3">{details?.requirements?.map(item => <li key={item}>{item}</li>)}</ul>
        <p>{details?.legal}</p>
        {details?.eligibility?.exclusions?.length ? <p className="mt-3">Excluded: {details.eligibility.exclusions.join('; ')}.</p> : null}
      </details>
    </div>
  </section>;
}
