import { Link } from 'react-router-dom';
import { Percent, ArrowRight } from 'lucide-react';
import { TDRateCardImage } from './TDRateCardImage';
import { MERCURY_PROMO_APR, formatFinancingRate } from '@/lib/finance';

const RATE_CARD_IMAGE = '/lovable-uploads/td-financing-2026-rate-card.jpg';
const RATE_CARD_ALT =
  `Mercury TD Always On financing offer: ${formatFinancingRate()} up to 240-month amortization through December 31, 2026`;


/**
 * Mercury TD "Always On" Financing offer (HBW internal: "TD 5.48% Always On").
 * Source: Sean Beamish, Business Development Manager, Mercury Marine Canada, email 2026-05-27.
 * Funded through TD Auto Finance via HBW's Dealerplan Peterborough relationship.
 *
 * Effective May 26, 2026 through December 31, 2026.
 *
 * TODO: Mercury renews these programs annually. Sean Beamish at Mercury Marine
 * Canada is the contact for the 2027 program codes. Update OFFER_END_ISO below
 * (and the Brunswick program codes referenced in the source-of-truth email)
 * when the renewal lands.
 */

// Hard stop: Dec 31, 2026 23:59:59 Eastern Time.
// ET is UTC-5 (EST) in December, so this is the exact cutoff in ISO 8601.
const OFFER_END_ISO = '2026-12-31T23:59:59-05:00';

export function isTDAlwaysOnActive(now: Date = new Date()): boolean {
  return now.getTime() <= new Date(OFFER_END_ISO).getTime();
}

// Legacy tiered rates that apply when no manufacturer subvention is active.
export const LEGACY_RATE_UNDER_10K = '8.99% APR';
export const LEGACY_RATE_OVER_10K = '7.99% APR';

export function getCurrentMercuryFinancingRate(): {
  rate: string;
  ratePercent: number;
  programLabel: string;
  isPromo: boolean;
} {
  if (isTDAlwaysOnActive()) {
    return {
      rate: formatFinancingRate(MERCURY_PROMO_APR),
      ratePercent: MERCURY_PROMO_APR,
      programLabel: `Mercury TD program: ${formatFinancingRate(MERCURY_PROMO_APR)} through Dec 31, 2026 (OAC)`,
      isPromo: true,
    };
  }

  return {
    rate: 'from 7.99% APR',
    ratePercent: 7.99,
    programLabel: 'Mercury financing: tiered rates from 7.99% APR (OAC)',
    isPromo: false,
  };
}

export const TD_ACTIVE_FAQ_ANSWER =
  `Through December 31, 2026, Mercury Marine Canada's TD 'Always On' program offers ${formatFinancingRate(MERCURY_PROMO_APR)} (OAC) on new eligible Mercury outboards. Standard tiered rates resume after the program ends.`;

export const LEGACY_TIERED_FAQ_ANSWER =
  'Standard tiered rates: 8.99% APR under $10,000, 7.99% APR $10,000 and up (OAC). Terms vary by lender.';

export function getMercuryFinancingFaqAnswer(): string {
  return isTDAlwaysOnActive() ? TD_ACTIVE_FAQ_ANSWER : LEGACY_TIERED_FAQ_ANSWER;
}




export function TDAlwaysOnCard() {
  // Auto-hide after expiry. See OFFER_END_ISO above.
  if (!isTDAlwaysOnActive()) return null;

  return (
    <section className="bg-white py-16 md:py-20 px-6 md:px-14 border-t border-repower-navy-900/10">
      <div className="max-w-[1100px] mx-auto">
        <div className="bg-repower-cream border border-repower-navy-900/10 rounded-lg p-6 md:p-12">
          <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-stretch">
            <div className="order-1">
              <TDRateCardImage
                src={RATE_CARD_IMAGE}
                alt={RATE_CARD_ALT}
                className="w-full h-auto rounded-md shadow-sm"
              />

            </div>

            <div className="order-2 flex flex-col gap-5 justify-center">
              <h3 className="font-display text-2xl md:text-[30px] font-bold text-repower-navy-900 leading-tight">
                TD Financing Available
              </h3>
              <p className="font-sans text-[16px] md:text-[17px] text-repower-navy-900/70 leading-relaxed">
                Low-rate TD financing on a new Mercury repower, plus the standard 3-year factory warranty that comes on every new Mercury.
              </p>
              <p className="font-sans text-[14px] text-repower-navy-900/65 leading-relaxed">
                Not all customers will qualify. Approval depends on TD's credit review.
              </p>
              <Link
                to="/financing-application"
                className="group inline-flex items-center justify-center gap-2 bg-repower-mercury-red text-repower-cream px-6 py-4 font-sans font-bold text-[13px] uppercase tracking-[0.14em] hover:bg-repower-mercury-red-deep transition-colors self-start mt-2"
              >
                Apply for Financing
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={1.75} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function TDAlwaysOnBanner() {
  // Auto-hide after expiry. See OFFER_END_ISO above.
  if (!isTDAlwaysOnActive()) return null;

  return (
    <div className="max-w-2xl mx-auto mb-6">
      <div className="bg-repower-cream border border-repower-navy-900/10 rounded-lg p-4 md:p-5 flex items-start gap-3">
        <Percent className="w-5 h-5 text-repower-mercury-red flex-shrink-0 mt-0.5" strokeWidth={1.75} />
        <div className="font-sans text-[14px] text-repower-navy-900 leading-relaxed">
          <span className="font-semibold">Mercury TD "Always On":</span> {formatFinancingRate(MERCURY_PROMO_APR)} up to 240-month amortization on new eligible Mercury outboards. OAC. Available through Dec 31, 2026.
        </div>
      </div>
    </div>
  );
}
