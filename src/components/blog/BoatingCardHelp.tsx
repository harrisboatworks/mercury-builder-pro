import { useState } from 'react';
import { BadgeCheck, Check, Copy, ExternalLink } from 'lucide-react';
import { getDeviceType, getPageCategory, trackEvent } from '@/lib/analytics';

const MYBOATCARD_URL = 'https://myboatcard.com/card/harrisboat';
const DISCOUNT_CODE = 'HARRIS15';

export interface BoatingCardHelpProps {
  variant?: 'full' | 'compact';
}

function trackingContext(placement: string) {
  const pathname = typeof window === 'undefined' ? '' : window.location.pathname;
  return {
    partner: 'myboatcard',
    offer_code: DISCOUNT_CODE,
    entry_page: pathname || '(direct)',
    entry_cta: placement,
    page_category: getPageCategory(pathname),
    device_type: getDeviceType(),
  };
}

export function BoatingCardHelp({ variant = 'compact' }: BoatingCardHelpProps) {
  const [copied, setCopied] = useState(false);
  const full = variant === 'full';

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(DISCOUNT_CODE);
      setCopied(true);
      trackEvent('partner_code_copy', trackingContext(`blog_boating_card_${variant}`));
    } catch {
      setCopied(false);
    }
  };

  const trackReferral = () => {
    trackEvent('partner_referral_click', trackingContext(`blog_boating_card_${variant}`));
  };

  return (
    <aside
      className="not-prose my-8 overflow-hidden rounded-xl border border-repower-navy-900/15 bg-repower-cream/70 shadow-sm"
      aria-label="Boat operator card help"
    >
      <div className="flex flex-col gap-5 p-5 md:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-2 flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-[0.16em] text-repower-navy-900/60">
            <BadgeCheck className="h-4 w-4 text-repower-gold" aria-hidden="true" />
            Before your rental
          </div>
          <h3 className="mb-2 font-display text-xl font-bold text-repower-navy-900 md:text-2xl">
            {full ? 'Need your Pleasure Craft Operator Card?' : 'Driving an HBW rental?'}
          </h3>
          <p className="mb-0 font-sans text-[15px] leading-relaxed text-repower-navy-900/75">
            {full
              ? "HBW requires every rental driver to bring a valid PCOC. Passengers don't need one. If you still need yours, MyBoatCard provides the Transport Canada-accredited online course. Finish it before rental day; we'll accept the temporary card at check-in."
              : "Bring a valid Pleasure Craft Operator Card. Passengers don't need one. If you still need yours, MyBoatCard provides the Transport Canada-accredited online course."}
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-stretch">
          <button
            type="button"
            onClick={copyCode}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-dashed border-repower-navy-900/30 bg-white px-4 py-2 font-sans text-sm text-repower-navy-900 transition-colors hover:border-repower-navy-900/60"
            aria-label={`Copy discount code ${DISCOUNT_CODE}`}
          >
            <span className="text-repower-navy-900/60">Save 15%</span>
            <strong className="tracking-[0.08em]">{DISCOUNT_CODE}</strong>
            {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
            <span className="sr-only" aria-live="polite">{copied ? 'Discount code copied' : ''}</span>
          </button>

          <a
            href={MYBOATCARD_URL}
            target="_blank"
            rel="sponsored noopener noreferrer"
            onClick={trackReferral}
            data-cta-location={`blog_boating_card_${variant}`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-repower-navy-900 px-5 py-2.5 font-sans text-sm font-semibold text-white no-underline transition-colors hover:bg-repower-navy-800"
          >
            Get your operator card
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>

      <div className="border-t border-repower-navy-900/10 bg-white/60 px-5 py-3 font-sans text-xs leading-relaxed text-repower-navy-900/60 md:px-6">
        Your PCOC is valid for life. HBW may receive a referral fee when you use this link.
      </div>
    </aside>
  );
}

export default BoatingCardHelp;
