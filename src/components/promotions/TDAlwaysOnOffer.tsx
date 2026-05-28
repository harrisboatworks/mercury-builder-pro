import { Link } from 'react-router-dom';
import { Percent, Calendar, Shield, ArrowRight } from 'lucide-react';

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

const BULLETS = [
  '5.48% APR (OAC)',
  'Term up to 60 months',
  'Amortization up to 240 months',
  'New eligible Mercury outboards only',
  'Ends Dec 31, 2026',
];

export function TDAlwaysOnCard() {
  // Auto-hide after expiry. See OFFER_END_ISO above.
  if (!isTDAlwaysOnActive()) return null;

  return (
    <section className="bg-white py-16 md:py-20 px-6 md:px-14 border-t border-repower-navy-900/10">
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-10 max-w-3xl mx-auto">
          <p className="font-sans font-semibold text-[11px] md:text-xs uppercase tracking-[0.24em] text-repower-mercury-red mb-5 inline-flex items-center gap-3">
            <span className="inline-block h-px w-8 bg-repower-mercury-red/60" />
            Financing Program
          </p>
          <h2
            className="font-display font-bold text-repower-navy-900 mb-4"
            style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', letterSpacing: '-0.025em', lineHeight: 1.1 }}
          >
            Mercury 5.48% Financing on New Outboards
          </h2>
          <p className="font-sans text-[16px] md:text-[17px] text-repower-navy-900/65 leading-relaxed">
            OAC. Through TD Auto Finance via our Dealerplan partner. Up to 240-month amortization keeps payments low.
          </p>
        </div>

        <div className="bg-repower-cream border border-repower-navy-900/10 rounded-lg p-6 md:p-10">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <Percent className="w-6 h-6 text-repower-mercury-red" strokeWidth={1.5} />
                <span className="font-display text-2xl font-bold text-repower-navy-900">5.48% APR</span>
              </div>
              <ul className="space-y-3">
                {BULLETS.map((b) => (
                  <li key={b} className="flex items-start gap-3 font-sans text-[15px] text-repower-navy-900">
                    <span className="mt-2 inline-block w-1.5 h-1.5 rounded-full bg-repower-gold flex-shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-5">
              <div className="flex items-start gap-3 text-repower-navy-900/75 font-sans text-[14px] leading-relaxed">
                <Shield className="w-5 h-5 text-repower-navy-900/60 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                <span>
                  Stacks with the 7-year factory warranty promotion. This is financing, not coverage, so both programs apply.
                </span>
              </div>
              <div className="flex items-start gap-3 text-repower-navy-900/75 font-sans text-[14px] leading-relaxed">
                <Calendar className="w-5 h-5 text-repower-navy-900/60 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                <span>
                  Not all customers will qualify. Approval depends on TD's credit review. Rate and terms above are the program standard; your specific approval may differ.
                </span>
              </div>
              <Link
                to="/financing/application"
                className="group inline-flex items-center justify-center gap-2 bg-repower-mercury-red text-repower-cream px-6 py-4 font-sans font-bold text-[13px] uppercase tracking-[0.14em] hover:bg-repower-mercury-red-deep transition-colors self-start"
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
          <span className="font-semibold">Mercury TD "Always On":</span> 5.48% APR up to 240-month amortization on new eligible Mercury outboards. OAC. Available through Dec 31, 2026.
        </div>
      </div>
    </div>
  );
}
