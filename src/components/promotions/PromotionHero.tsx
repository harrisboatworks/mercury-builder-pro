import { motion } from 'framer-motion';
import { Shield, Calendar } from 'lucide-react';
import { CountdownTimer } from '@/components/ui/countdown-timer';
import mercuryLogo from '@/assets/mercury-logo.png';
// Optimized warranty badge: 15KB WebP @ 400w (was 3MB PNG).
const harris7YearWarranty = '/assets/optimized/harris-7-year-warranty-400w.webp';

interface PromotionHeroProps {
  endDate?: string | null;
  bonusTitle?: string | null;
  bonusDescription?: string | null;
  bonusYears?: number;
}

export function PromotionHero({ endDate, bonusTitle, bonusDescription, bonusYears = 0 }: PromotionHeroProps) {
  const hasBonusWarranty = bonusYears > 0;
  const totalWarrantyYears = 3 + bonusYears;

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
          className="font-sans font-semibold text-[11px] md:text-xs uppercase tracking-[0.24em] text-repower-mercury-red mb-5 flex items-center justify-center gap-3"
        >
          <span className="inline-block h-px w-8 bg-repower-mercury-red/60" />
          Current Mercury offer at Harris Boat Works
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
          {bonusTitle || 'Current Mercury Offer'}
        </motion.h1>

        {/* Subhead */}
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="font-sans text-[17px] md:text-[18px] text-repower-navy-900/65 max-w-[60ch] mx-auto text-center leading-relaxed mb-12"
        >
          {bonusDescription || 'See the current Mercury offer, eligibility, and terms. Harris Boat Works confirms all promotion details before purchase.'}
        </motion.p>

        {hasBonusWarranty && (
          <>
            {/* Promo image, shown only when the active database offer includes bonus warranty years. */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-12"
            >
              <div className="bg-white border border-repower-navy-900/10 p-4 md:p-6 max-w-3xl mx-auto">
                <img
                  src={harris7YearWarranty}
                  alt={`Harris Boat Works, ${totalWarrantyYears} years of factory-backed Mercury coverage`}
                  className="w-full h-auto"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.25 }}
              className="bg-repower-cream border-l-2 border-repower-gold p-6 md:p-8 max-w-3xl mx-auto flex items-start gap-5 mb-10"
            >
              <Shield className="w-7 h-7 text-repower-gold shrink-0 mt-0.5" strokeWidth={1.75} />
              <div>
                <div className="font-display font-semibold text-[18px] text-repower-navy-900 tracking-tight">
                  {totalWarrantyYears} Years Factory-Backed Coverage
                </div>
                <div className="font-sans text-[14px] text-repower-navy-900/65 mt-1">
                  3 years standard + {bonusYears} promotional bonus years
                </div>
              </div>
            </motion.div>
          </>
        )}

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
              <span>Limited time offer</span>
            </div>
            <CountdownTimer endDate={endDate} />
          </motion.div>
        )}
      </div>
    </section>
  );
}
