import { motion } from 'framer-motion';
import { Sparkles, Shield, Calendar } from 'lucide-react';
import { CountdownTimer } from '@/components/ui/countdown-timer';
import mercuryLogo from '@/assets/mercury-logo.png';

interface PromotionHeroProps {
  endDate?: string | null;
}

export function PromotionHero({ endDate }: PromotionHeroProps) {
  return (
    <section className="relative bg-gradient-to-b from-stone-900 via-stone-800 to-stone-900 py-16 px-4 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Mercury logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center mb-6"
        >
          <img src={mercuryLogo} alt="Mercury Marine" className="h-12" />
        </motion.div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-500 text-white px-5 py-2.5 rounded-full text-sm font-semibold mb-6 shadow-lg"
        >
          <Sparkles className="w-4 h-4" />
          Limited Time: January 12 – March 31, 2026
        </motion.div>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-4"
        >
          Get <span className="text-red-500">7 Years</span> of Coverage
          <br />
          <span className="text-3xl md:text-4xl lg:text-5xl text-stone-300">+ Choose One Bonus!</span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-lg md:text-xl text-stone-300 max-w-2xl mx-auto mb-8"
        >
          Every qualifying Mercury outboard comes with 7 years of factory warranty protection
          <strong className="text-white"> PLUS </strong>
          your choice of 6 months no payments, special financing, or a factory rebate.
        </motion.p>

        {/* Warranty badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 mb-8"
        >
          <Shield className="w-10 h-10 text-green-400" />
          <div className="text-left">
            <div className="text-white font-bold text-lg">7 Years Factory Warranty</div>
            <div className="text-stone-400 text-sm">3 years standard + 4 years FREE extension</div>
          </div>
        </motion.div>

        {/* Countdown */}
        {endDate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="max-w-md mx-auto"
          >
            <div className="flex items-center justify-center gap-2 text-stone-400 text-sm mb-3">
              <Calendar className="w-4 h-4" />
              <span>Offer ends March 31, 2026</span>
            </div>
            <CountdownTimer endDate={endDate} />
          </motion.div>
        )}
      </div>
    </section>
  );
}
