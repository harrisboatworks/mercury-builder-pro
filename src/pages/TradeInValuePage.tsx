import React, { useState, useRef, useEffect } from 'react';
import { Helmet } from '@/lib/helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { RepowerHeader } from '@/components/repower/RepowerHeader';
import { SiteFooter } from '@/components/ui/site-footer';
import { TradeInValuation } from '@/components/quote-builder/TradeInValuation';
import { type TradeInInfo } from '@/lib/trade-valuation';
import { SITE_URL } from '@/lib/site';

const DRAFT_KEY = 'tradeInValuePage:draft';

const INITIAL_TRADE_IN: TradeInInfo = {
  hasTradeIn: true,
  brand: '',
  year: 0,
  horsepower: 0,
  model: '',
  serialNumber: '',
  condition: 'good' as const,
  estimatedValue: 0,
  confidenceLevel: 'medium' as const,
};

function loadDraft(): { data: TradeInInfo; restored: boolean } {
  if (typeof window === 'undefined') return { data: INITIAL_TRADE_IN, restored: false };
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return { data: INITIAL_TRADE_IN, restored: false };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { data: INITIAL_TRADE_IN, restored: false };
    const merged = { ...INITIAL_TRADE_IN, ...parsed } as TradeInInfo;
    // Only count as "restored" if user actually entered something
    const hasContent = Boolean(
      merged.brand || merged.year || merged.horsepower || (merged.model && merged.model.trim())
    );
    return { data: merged, restored: hasContent };
  } catch {
    return { data: INITIAL_TRADE_IN, restored: false };
  }
}

export default function TradeInValuePage() {
  const initial = useRef(loadDraft());
  const [tradeInInfo, setTradeInInfo] = useState<TradeInInfo>(initial.current.data);
  const [showRestored, setShowRestored] = useState(initial.current.restored);
  const navigate = useNavigate();

  // Auto-hide restored banner
  useEffect(() => {
    if (!showRestored) return;
    const t = setTimeout(() => setShowRestored(false), 4000);
    return () => clearTimeout(t);
  }, [showRestored]);

  // Debounced autosave to localStorage
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(tradeInInfo));
      } catch (e) {
        console.error('Failed to autosave trade-in draft:', e);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [tradeInInfo]);

  const handleClearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
    setTradeInInfo(INITIAL_TRADE_IN);
    setShowRestored(false);
  };

  const handleStartQuote = () => {
    // Store trade-in data so the quote builder can pick it up
    try {
      const stored = localStorage.getItem('quoteBuilder');
      const parsed = stored ? JSON.parse(stored) : { state: {} };
      parsed.state = { ...parsed.state, tradeInInfo, hasTradein: true };
      localStorage.setItem('quoteBuilder', JSON.stringify(parsed));
    } catch (e) {
      console.error('Failed to persist trade-in to localStorage:', e);
    }
    // Clear the standalone draft, it has now been promoted into the quote flow
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
    navigate('/quote/motor-selection');
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Trade-In Value', item: `${SITE_URL}/trade-in-value` },
    ],
  };

  return (
    <>
      <Helmet>
        <title>What's Your Outboard Worth? | Free Trade-In Estimator | Harris Boat Works</title>
        <meta
          name="description"
          content="Get a free instant estimate for your outboard motor trade-in value. Mercury, Yamaha, Honda, Suzuki and more, check what your motor is worth in seconds."
        />
        <link rel="canonical" href={`${SITE_URL}/trade-in-value`} />
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <RepowerHeader />

      <main className="min-h-screen bg-repower-paper pt-[64px] lg:pt-[72px]">
        <div className="max-w-[1100px] mx-auto px-6 md:px-14 py-14 md:py-20">
          {/* Heading zone */}
          <div className="text-center mb-10 md:mb-14">
            <div className="flex items-center justify-center gap-3 mb-5">
              <span className="h-px w-8 bg-repower-mercury-red" />
              <p className="font-sans font-semibold text-[11px] uppercase tracking-[0.24em] text-repower-mercury-red">
                Free Instant Estimate
              </p>
              <span className="h-px w-8 bg-repower-mercury-red" />
            </div>
            <h1
              className="font-display font-bold text-repower-navy-900 mb-5"
              style={{ fontSize: 'clamp(40px, 5vw, 64px)', letterSpacing: '-0.025em', lineHeight: 1.05 }}
            >
              What's Your Outboard Worth?
            </h1>
            <p className="font-sans text-[18px] text-repower-navy-900/65 max-w-[60ch] mx-auto">
              Find out your motor's trade-in value in seconds, no account needed.
              When you're ready, roll it right into a full quote.
            </p>
            <div className="h-px bg-repower-navy-900/10 mt-10 max-w-[200px] mx-auto" />
          </div>

          {showRestored && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-center justify-between gap-3 rounded border border-repower-navy-900/10 bg-white px-4 py-2.5 text-sm"
            >
              <span className="font-sans text-repower-navy-900/65">
                Restored your previous entries.
              </span>
              <button
                type="button"
                onClick={handleClearDraft}
                className="inline-flex items-center gap-1.5 font-sans text-[13px] font-semibold text-repower-navy-900 hover:text-repower-mercury-red transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Start over
              </button>
            </motion.div>
          )}

          <TradeInValuation
            standalone
            tradeInInfo={tradeInInfo}
            onTradeInChange={setTradeInInfo}
            onAutoAdvance={handleStartQuote}
          />

          {tradeInInfo.estimatedValue > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 rounded border border-repower-navy-900/10 bg-repower-cream p-8 text-center"
            >
              <p className="font-display text-[22px] text-repower-navy-900 mb-5">
                Ready to see how much you'll save on a new Mercury?
              </p>
              <button
                onClick={handleStartQuote}
                className="group inline-flex items-center gap-2 bg-repower-mercury-red text-repower-cream px-7 py-4 font-sans font-bold text-[13px] uppercase tracking-[0.14em] hover:bg-repower-mercury-red-deep transition-colors"
              >
                Start a Quote With This Trade-In
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </motion.div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
