import React, { useState, useRef, useEffect } from 'react';
import { Helmet } from '@/lib/helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, DollarSign, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LuxuryHeader } from '@/components/ui/luxury-header';
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
    // Clear the standalone draft — it has now been promoted into the quote flow
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
          content="Get a free instant estimate for your outboard motor trade-in value. Mercury, Yamaha, Honda, Suzuki and more — check what your motor is worth in seconds."
        />
        <link rel="canonical" href={`${SITE_URL}/trade-in-value`} />
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <LuxuryHeader />

      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="bg-gradient-to-b from-muted/60 to-background py-12 md:py-16">
          <div className="max-w-3xl mx-auto px-4 text-center space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
                <DollarSign className="w-4 h-4" />
                Free Instant Estimate
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-tight text-foreground">
                What's Your Outboard Worth?
              </h1>
              <p className="text-lg text-muted-foreground font-light mt-3 max-w-xl mx-auto">
                Find out your motor's trade-in value in seconds — no account needed. 
                When you're ready, roll it right into a full quote.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Form */}
        <section className="max-w-3xl mx-auto px-4 -mt-4 pb-16">
          {showRestored && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex items-center justify-between gap-3 rounded-md border border-border bg-muted/40 px-4 py-2.5 text-sm"
            >
              <span className="text-muted-foreground">
                Restored your previous entries.
              </span>
              <button
                type="button"
                onClick={handleClearDraft}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground hover:text-primary transition-colors"
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

          {/* CTA below estimate */}
          {tradeInInfo.estimatedValue > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              <Card className="p-6 border-border bg-muted/30 text-center space-y-4">
                <p className="text-lg font-light text-foreground">
                  Ready to see how much you'll save on a new Mercury?
                </p>
                <Button
                  size="lg"
                  onClick={handleStartQuote}
                  className="min-h-[52px] text-base gap-2"
                >
                  Start a Quote With This Trade-In
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Card>
            </motion.div>
          )}
        </section>
      </main>
    </>
  );
}
