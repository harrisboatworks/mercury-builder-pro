import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LuxuryHeader } from '@/components/ui/luxury-header';
import { MercuryProXSSEO, PRO_XS_FAQ, PRO_XS_STATIC_OFFERS } from '@/components/seo/MercuryProXSSEO';
import { ChevronRight, Zap, Trophy, Gauge, Award } from 'lucide-react';

interface ProXSVariant {
  hp: number;
  startingAt: number;
  inStockCount: number;
}

const HP_TIERS = [115, 150, 200, 250];

function formatCAD(n: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(n);
}

export default function MercuryProXS() {
  const [variants, setVariants] = useState<ProXSVariant[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadPricing() {
      try {
        const { data, error } = await supabase
          .from('motor_models')
          .select('horsepower, base_price, sale_price, dealer_price, in_stock, availability, family')
          .eq('family', 'ProXS')
          .neq('availability', 'Exclude')
          .in('horsepower', HP_TIERS);

        if (error || !data) throw error;

        const grouped = HP_TIERS.map(hp => {
          const matches = data.filter(m => Number(m.horsepower) === hp);
          const prices = matches
            .map(m => Number(m.sale_price ?? m.base_price ?? m.dealer_price ?? 0))
            .filter(p => p > 0);
          const startingAt = prices.length ? Math.min(...prices) : 0;
          const inStockCount = matches.filter(m => m.in_stock).length;
          return { hp, startingAt, inStockCount };
        });

        if (!cancelled) {
          setVariants(grouped);
          setLoading(false);
        }
      } catch (err) {
        console.warn('[MercuryProXS] Failed to load live pricing, falling back to static.', err);
        if (!cancelled) {
          setVariants(
            PRO_XS_STATIC_OFFERS.map(o => ({
              hp: o.hp,
              startingAt: o.startingAt,
              inStockCount: 0,
            }))
          );
          setLoading(false);
        }
      }
    }
    loadPricing();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <MercuryProXSSEO />
      <LuxuryHeader />

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
          <ol className="flex items-center gap-2">
            <li><Link to="/" className="hover:text-foreground">Home</Link></li>
            <li><ChevronRight className="h-4 w-4" /></li>
            <li className="text-foreground" aria-current="page">Mercury Pro XS</li>
          </ol>
        </nav>

        {/* Hero */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            <Trophy className="h-3.5 w-3.5" />
            Mercury Performance Series
          </div>
          <h1 className="text-3xl md:text-5xl font-semibold text-foreground mb-4">
            Mercury Pro XS Outboards in Ontario
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tournament-grade performance from 115 to 250 HP. Real CAD pricing, in stock at Harris Boat Works — Mercury Marine Platinum Dealer on Rice Lake. Family-owned since 1947, Mercury dealer since 1965.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link to="/quote/motor-selection">Build Your Pro XS Quote</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/contact">Talk to Sales</Link>
            </Button>
          </div>
        </header>

        {/* Why Pro XS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
          {[
            { icon: Zap, title: 'Hole-shot tuned', body: 'Aggressive calibration and performance gearcase for elite acceleration off the line.' },
            { icon: Gauge, title: 'Top-end speed', body: 'Tournament-grade engine timing and prop pitches built for maximum WOT.' },
            { icon: Award, title: '7-year warranty', body: 'Full Mercury factory-backed coverage at pickup — direct from Mercury, no third-party.' },
          ].map(({ icon: Icon, title, body }) => (
            <Card key={title} className="p-6 text-center">
              <Icon className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
            </Card>
          ))}
        </section>

        {/* HP tier pricing grid */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-foreground mb-2 text-center">
            Pro XS Lineup — Starting at (CAD)
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Live pricing from Harris Boat Works inventory. Pickup only at Gores Landing, Rice Lake.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(loading || !variants) &&
              HP_TIERS.map(hp => (
                <Card key={hp} className="p-5">
                  <Skeleton className="h-6 w-20 mb-3" />
                  <Skeleton className="h-8 w-28 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </Card>
              ))}

            {!loading && variants &&
              variants.map(v => (
                <Card key={v.hp} className="p-5 flex flex-col">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                    {v.hp} HP Pro XS
                  </div>
                  <div className="text-2xl font-semibold text-foreground mb-1">
                    {v.startingAt > 0 ? `from ${formatCAD(v.startingAt)}` : '—'}
                  </div>
                  <div className="text-xs text-muted-foreground mb-4">
                    {v.inStockCount > 0
                      ? `${v.inStockCount} variant${v.inStockCount === 1 ? '' : 's'} in stock`
                      : 'Built to order'}
                  </div>
                  <Button asChild size="sm" variant="outline" className="mt-auto">
                    <Link to="/quote/motor-selection">Configure</Link>
                  </Button>
                </Card>
              ))}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-4">
            Prices in CAD, all-in (plus HST). Financing from $5,000.
          </p>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-foreground mb-6 text-center">
            Pro XS Buying Questions
          </h2>
          <Accordion type="single" collapsible className="w-full space-y-2">
            {PRO_XS_FAQ.map((item, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border border-border rounded-lg px-4 data-[state=open]:bg-muted/40"
              >
                <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline py-4">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4 leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* CTA footer */}
        <section className="text-center bg-muted/30 rounded-2xl p-8 border border-border">
          <h2 className="text-2xl font-semibold text-foreground mb-3">
            Ready to spec a Pro XS?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Build a real quote in 3 minutes with live CAD pricing and financing estimates, or call (905) 342-2153.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link to="/quote/motor-selection">Build Your Quote</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/mercury-outboards-ontario">See Full Mercury Lineup</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
