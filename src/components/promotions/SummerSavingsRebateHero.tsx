import { Link } from 'react-router-dom';
import { Calendar, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CountdownTimer } from '@/components/ui/countdown-timer';
import { RebateMatrix } from './RebateMatrix';

const BANNER_IMAGE =
  '/lovable-uploads/mercury-summer-savings-rebate-2026-banner-1920x675.jpg';
const BANNER_ALT =
  'Mercury Summer Savings Rebate: save up to $700 CAD plus financing as low as 2.99%, ends August 31, 2026';

// Hard stop: August 31, 2026 23:59:59 Eastern Time (EDT = UTC-4 in August).
const OFFER_END_ISO = '2026-08-31T23:59:59-04:00';

const REBATE_MATRIX = [
  { hp_min: 2.5, hp_max: 3.5, rebate: 50 },
  { hp_min: 4, hp_max: 8, rebate: 75 },
  { hp_min: 9.9, hp_max: 25, rebate: 100 },
  { hp_min: 30, hp_max: 115, rebate: 250 },
  { hp_min: 150, hp_max: 200, rebate: 350 },
  { hp_min: 225, hp_max: 425, rebate: 700 },
];

const BULLETS = [
  'Up to $700 CAD factory rigging rebate, based on horsepower',
  'Eligible new Mercury FourStroke repower outboards, 2.5 to 425 HP',
  'Promo financing as low as 2.99% for 24 months, on approved credit',
  'Program runs July 15 to August 31, 2026 (delivery and retail sale must fall in window)',
];

export function SummerSavingsRebateHero() {
  return (
    <section className="relative overflow-hidden bg-repower-navy-900">
      {/* Full-width banner */}
      <div className="relative w-full">
        <img
          src={BANNER_IMAGE}
          alt={BANNER_ALT}
          className="w-full h-auto block"
          width={1920}
          height={675}
          loading="eager"
        />
      </div>

      <div className="max-w-[1100px] mx-auto px-6 md:px-14 py-16 md:py-20">
        <div className="grid md:grid-cols-2 gap-10 md:gap-12 items-start">
          <div>
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="h-px w-8 bg-repower-mercury-red" />
              <span className="font-sans text-[13px] md:text-sm font-semibold tracking-[0.24em] uppercase text-repower-mercury-red">
                Mercury Repower Rigging Promotion
              </span>
            </div>

            <h1
              className="font-display font-bold text-white mb-4"
              style={{ fontSize: 'clamp(32px, 4vw, 48px)', letterSpacing: '-0.025em', lineHeight: 1.05 }}
            >
              Summer Savings Rebate: Save Up to $700 CAD
            </h1>

            <p className="font-sans text-base md:text-lg text-white/75 mb-6 leading-relaxed">
              Save up to $700 CAD on eligible new Mercury FourStroke repower outboards, plus
              promotional financing as low as 2.99% for 24 months (OAC). Available July 15 to
              August 31, 2026 at Harris Boat Works.
            </p>

            <ul className="space-y-2 mb-8">
              {BULLETS.map((b) => (
                <li key={b} className="flex items-start gap-2 font-sans text-sm text-white/85">
                  <Check className="w-4 h-4 mt-0.5 shrink-0 text-repower-gold" strokeWidth={2.25} />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
              <Link to="/quote/motor-selection">
                <Button
                  size="lg"
                  className="bg-repower-mercury-red text-white hover:bg-repower-mercury-red-deep min-w-[220px] w-full sm:w-auto"
                >
                  Build Your Quote
                </Button>
              </Link>
              <Link to="/financing-application">
                <Button
                  size="lg"
                  variant="ghost"
                  className="text-white/80 hover:text-white hover:bg-white/10 min-w-[200px] w-full sm:w-auto"
                >
                  Apply for Financing
                </Button>
              </Link>
            </div>

            <div className="max-w-md">
              <div className="flex items-center gap-2 font-sans font-semibold text-[11px] uppercase tracking-[0.24em] text-white/60 mb-3">
                <Calendar className="w-4 h-4" strokeWidth={1.75} />
                <span>Offer ends August 31, 2026</span>
              </div>
              <CountdownTimer endDate={OFFER_END_ISO} />
            </div>
          </div>

          <div className="bg-white/[0.04] border border-white/10 rounded-lg p-6 md:p-8">
            <div className="mb-5">
              <h2 className="font-display font-semibold text-white text-[22px] md:text-[24px] mb-1">
                Rigging Rebate by Horsepower
              </h2>
              <p className="font-sans text-[14px] text-white/60">
                All figures in CAD. Applied by the dealer as a credit at purchase.
              </p>
            </div>
            <div className="bg-white rounded-md p-2 md:p-3">
              <RebateMatrix matrix={REBATE_MATRIX} />
            </div>
            <p className="font-sans text-[12px] text-white/55 mt-4 leading-relaxed">
              Rebate applies to eligible repower engines sold for recreational use and is issued by
              the dealer as a credit to the customer. Eligible units limited to available new dealer
              stock; backorders do not qualify. Excludes engines sold as part of a boat and engine
              package, commercial, camp, resort, or guide applications, Mercury Racing, MerCruiser,
              CPO, SportJet, OptiMax, V12, all two-stroke engines, and Avator. Warranty must be
              registered by September 15, 2026. Offer void where prohibited. See Harris Boat Works
              for complete details. Call (905) 342-2153.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export const SUMMER_SAVINGS_END_ISO = OFFER_END_ISO;
