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
}

export function PromotionHero({ endDate, bonusTitle, bonusDescription }: PromotionHeroProps) {
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
          Mercury stopped running promos, so we're running our own.
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
          Get <em className="not-italic italic text-repower-mercury-red">7 Years</em> of Coverage
        </motion.h1>

        {/* Subhead */}
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="font-sans text-[17px] md:text-[18px] text-repower-navy-900/65 max-w-[60ch] mx-auto text-center leading-relaxed mb-12"
        >
          {bonusDescription ||
            'Buy any new Mercury outboard from Harris Boat Works and get 7 full years of factory-backed warranty coverage. No third-party insurance, straight Mercury protection from a Premier Dealer (Mercury dealer since 1965).'}
        </motion.p>

        {/* Promo image, framed */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-12"
        >
          <div className="bg-white border border-repower-navy-900/10 p-4 md:p-6 max-w-3xl mx-auto">
            <img
              src={harris7YearWarranty}
              alt="Harris Boat Works, Get 7 Years Factory-Backed Warranty on every new Mercury"
              className="w-full h-auto"
            />
          </div>
        </motion.div>

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
              7 Years Factory Warranty
            </div>
            <div className="font-sans text-[14px] text-repower-navy-900/65 mt-1">
              3 years standard + 4 years FREE extension
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
              <span>Limited time offer</span>
            </div>
            <CountdownTimer endDate={endDate} />
          </motion.div>
        )}
      </div>
    </section>
  );
}
