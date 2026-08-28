import { Link } from 'react-router-dom';
import { Check, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TDRateCardImage } from './TDRateCardImage';
import { CountdownTimer } from '@/components/ui/countdown-timer';
import { MERCURY_PROMO_APR, formatFinancingRate } from '@/lib/finance';

const TD_RATE_CARD_IMAGE = '/lovable-uploads/td-financing-2026-rate-card.jpg';
const TD_RATE_CARD_ALT =
  `Mercury TD Always On financing offer: ${formatFinancingRate(MERCURY_PROMO_APR)} up to 240-month amortization through December 31, 2026`;

interface TDFinancingHeroProps {
  endDate?: string | null;
}

export function TDFinancingHero({ endDate }: TDFinancingHeroProps) {
  const rate = formatFinancingRate(MERCURY_PROMO_APR);

  const bullets = [
    'Available on new eligible Mercury outboards',
    'Up to 60-month term',
    'Up to 240-month amortization',
    'Program runs through December 31, 2026',
  ];

  return (
    <section className="relative py-16 md:py-24 px-6 md:px-14 overflow-hidden bg-repower-navy-900">
      <div className="relative max-w-[1100px] mx-auto">
        <div className="grid md:grid-cols-2 gap-10 md:gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="h-px w-8 bg-repower-mercury-red" />
              <span className="font-sans text-[13px] md:text-sm font-semibold tracking-[0.24em] uppercase text-repower-mercury-red">
                Ready to Repower Sales Event
              </span>
            </div>

            <h1
              className="font-display font-bold text-white mb-4"
              style={{ fontSize: 'clamp(32px, 4vw, 48px)', letterSpacing: '-0.025em', lineHeight: 1.05 }}
            >
              Mercury Financing as Low as {rate}
            </h1>

            <p className="font-sans text-base md:text-lg text-white/75 mb-6 leading-relaxed">
              Eligible new Mercury outboards may qualify for TD financing as low as {rate}, with terms up to 60 months and amortization up to 240 months, on approved credit.
            </p>

            <ul className="space-y-2 mb-8">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-2 font-sans text-sm text-white/80">
                  <Check className="w-4 h-4 mt-0.5 shrink-0 text-repower-gold" strokeWidth={2.25} />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
              <Link to="/financing-application">
                <Button size="lg" className="bg-repower-mercury-red text-white hover:bg-repower-mercury-red-deep min-w-[200px] w-full sm:w-auto">
                  Apply for Financing
                </Button>
              </Link>
              <Link to="/quote/motor-selection">
                <Button size="lg" variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 min-w-[200px] w-full sm:w-auto">
                  Build Your Quote
                </Button>
              </Link>
            </div>

            <p className="font-sans text-xs md:text-sm text-white/55 leading-relaxed max-w-md">
              Financing available OAC. Eligibility, rates, terms, and approval may vary. See Harris Boat Works for complete details.
            </p>

            {endDate && (
              <div className="mt-8 max-w-md">
                <div className="flex items-center gap-2 font-sans font-semibold text-[11px] uppercase tracking-[0.24em] text-white/60 mb-3">
                  <Calendar className="w-4 h-4" strokeWidth={1.75} />
                  <span>Limited time offer</span>
                </div>
                <CountdownTimer endDate={endDate} />
              </div>
            )}
          </div>

          <div className="order-first md:order-last">
            <TDRateCardImage
              src={TD_RATE_CARD_IMAGE}
              alt={TD_RATE_CARD_ALT}
              className="w-full h-auto rounded-md shadow-lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
