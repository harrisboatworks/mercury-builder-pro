import { motion } from 'framer-motion';
import { Shield, Calendar, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CountdownTimer } from '@/components/ui/countdown-timer';
import mercuryLogo from '@/assets/mercury-logo.png';

interface PromotionHeroProps {
  endDate?: string | null;
  bonusTitle?: string | null;
  bonusDescription?: string | null;
  termsUrl?: string | null;
  imageUrl?: string | null;
  hasOfferDetails?: boolean;
}

export function PromotionHero({ endDate, bonusTitle, bonusDescription, termsUrl, imageUrl, hasOfferDetails = false }: PromotionHeroProps) {
  const formattedEndDate = endDate
    ? new Date(endDate).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;
  const safeImageUrl = imageUrl && !/(?:7[-_ ]?year|get[-_ ]?7)/i.test(imageUrl) ? imageUrl : null;
  const detailsHref = termsUrl || (hasOfferDetails ? '#offer-details' : null);

  return (
    <section className="relative bg-repower-paper text-repower-navy-900 py-20 md:py-28 px-6 md:px-14">
      <div className="relative max-w-5xl mx-auto">
        {/* Mercury logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-center mb-10"
        >
          <img
            src={mercuryLogo}
            alt="Mercury Marine"
            className="h-9 opacity-80"
          />
        </motion.div>

        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="font-sans font-semibold text-[13px] md:text-sm uppercase tracking-[0.24em] text-repower-mercury-red mb-5 flex items-center justify-center gap-3"
        >
          <span className="inline-block h-px w-8 bg-repower-mercury-red/60" />
          Current offers at Harris Boat Works
          <span className="inline-block h-px w-8 bg-repower-mercury-red/60" />
        </motion.p>

        {/* H1 */}
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-display font-bold text-repower-navy-900 text-center mb-6"
          style={{ fontSize: 'clamp(40px, 5vw, 64px)', letterSpacing: '-0.025em', lineHeight: 1.05 }}
        >
          {bonusTitle || <>Current <em className="not-italic italic text-repower-mercury-red">Mercury</em> Offers</>}
        </motion.h1>

        {/* Subhead */}
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="font-sans text-[17px] md:text-[18px] text-repower-navy-900/65 max-w-[60ch] mx-auto text-center leading-relaxed mb-12"
        >
          {bonusDescription ||
            'Current Mercury outboard offers from Harris Boat Works, including financing, rebates, and any active bonus warranty terms. Standard Mercury factory warranty applies to every new motor.'}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.18 }}
          className="mb-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center"
        >
          <Link
            to="/quote/motor-selection"
            className="group inline-flex min-h-[48px] items-center justify-center gap-2 rounded bg-repower-mercury-red px-7 py-3 font-sans text-[13px] font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-repower-mercury-red-deep"
          >
            Build Your Quote
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          {detailsHref && (
            <a
              href={detailsHref}
              target={detailsHref.startsWith('http') ? '_blank' : undefined}
              rel={detailsHref.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="inline-flex min-h-[48px] items-center justify-center rounded border border-repower-navy-900/20 bg-white px-7 py-3 font-sans text-[13px] font-bold uppercase tracking-[0.12em] text-repower-navy-900 transition-colors hover:border-repower-navy-900"
            >
              Review Offer Details
            </a>
          )}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.2 }}
          className="mx-auto mb-10 max-w-3xl text-center font-sans text-xs leading-relaxed text-repower-navy-900/65"
        >
          {formattedEndDate ? `Offer ends ${formattedEndDate}. ` : ''}
          Eligible new Mercury models and purchase dates only. {hasOfferDetails ? 'Choose-one benefits cannot be combined. ' : ''}Financing is OAC; final eligibility and terms are confirmed before purchase.
        </motion.p>

        {/* Render only current offer artwork supplied by the active promotion. */}
        {safeImageUrl && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-12"
          >
            <div className="bg-white border border-repower-navy-900/10 p-4 md:p-6 max-w-3xl mx-auto">
              <img
                src={safeImageUrl}
                alt={bonusTitle || 'Current Harris Boat Works Mercury outboard offer'}
                className="w-full h-auto"
              />
            </div>
          </motion.div>
        )}

        {/* Warranty callout, on cream */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.25 }}
          className="bg-repower-cream border-l-2 border-repower-gold p-6 md:p-8 max-w-3xl mx-auto flex items-start gap-5 mb-10"
        >
          <Shield className="w-7 h-7 text-repower-gold shrink-0 mt-0.5" strokeWidth={1.75} />
          <div>
            <div className="font-display font-semibold text-[18px] text-repower-navy-900 tracking-tight">
              Factory Warranty
            </div>
            <div className="font-sans text-[14px] text-repower-navy-900/65 mt-1">
              Standard Mercury factory warranty; current bonuses listed here
            </div>
          </div>
        </motion.div>

        {/* Countdown */}
        {endDate && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.3 }}
            className="max-w-md mx-auto text-center"
          >
            <div className="flex items-center justify-center gap-2 font-sans font-semibold text-[11px] uppercase tracking-[0.24em] text-repower-navy-900/55 mb-3">
              <Calendar className="w-4 h-4" strokeWidth={1.75} />
              <span>{formattedEndDate ? `Ends ${formattedEndDate}` : 'Limited time offer'}</span>
            </div>
            <CountdownTimer endDate={endDate} />
          </motion.div>
        )}
      </div>
    </section>
  );
}
