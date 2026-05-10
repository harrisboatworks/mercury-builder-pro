import { Helmet } from '@/lib/helmet';
import { DollarSign, Calculator, Zap, Ruler, ArrowRight } from 'lucide-react';
import { RepowerHeader } from '@/components/repower/RepowerHeader';
import { SiteFooter } from '@/components/ui/site-footer';
import { Button } from '@/components/ui/button';
import { TradeInValueEstimator } from '@/components/tools/TradeInValueEstimator';
import { RepowerCostEstimator } from '@/components/tools/RepowerCostEstimator';
import { BoostEligibilityChecker } from '@/components/tools/BoostEligibilityChecker';
import { ShaftLengthPicker } from '@/components/tools/ShaftLengthPicker';

const TOOLS = [
  {
    id: 'trade-in-value',
    name: 'Trade-In Value Estimator',
    description: "What's my old motor worth as a trade?",
    Icon: DollarSign,
    Component: TradeInValueEstimator,
  },
  {
    id: 'repower-cost',
    name: 'Repower Cost Estimator',
    description: 'Ballpark cost for a complete repower with install.',
    Icon: Calculator,
    Component: RepowerCostEstimator,
  },
  {
    id: 'boost-eligibility',
    name: 'Boost Eligibility Checker',
    description: 'Is my Mercury 150 Pro XS eligible for the Boost upgrade?',
    Icon: Zap,
    Component: BoostEligibilityChecker,
  },
  {
    id: 'shaft-length',
    name: 'Shaft Length Picker',
    description: 'What shaft length fits my transom?',
    Icon: Ruler,
    Component: ShaftLengthPicker,
  },
] as const;

export default function ToolsIndex() {
  return (
    <>
      <Helmet>
        <title>Free Mercury Repower Tools | Harris Boat Works</title>
        <meta
          name="description"
          content="Trade-in value estimator, repower cost calculator, Boost eligibility checker, shaft length picker. Real CAD numbers from a Mercury Platinum dealer in Gores Landing, ON."
        />
        <link rel="canonical" href="https://www.mercuryrepower.ca/tools" />
      </Helmet>

      <div className="min-h-screen bg-repower-paper">
        <RepowerHeader />
        <div className="pt-[64px] lg:pt-[72px]" />

        <main className="max-w-5xl mx-auto px-4 py-10 md:py-14">
          <header className="mb-10 md:mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Free Mercury Repower Tools
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl">
              Four quick calculators to help you scope a repower before you call. No signup, no
              email gate, real CAD numbers.
            </p>
          </header>

          <section aria-label="Available tools" className="grid gap-6 md:grid-cols-2 mb-14">
            {TOOLS.map(({ id, name, description, Icon }) => (
              <div
                key={id}
                className="rounded-xl border border-border bg-card p-6 flex flex-col"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">{name}</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-5 flex-1">{description}</p>
                <Button asChild variant="outline" className="w-full sm:w-auto self-start">
                  <a href={`#${id}`}>
                    Open tool
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </a>
                </Button>
              </div>
            ))}
          </section>

          <div className="space-y-16">
            {TOOLS.map(({ id, name, Component }) => (
              <section
                key={id}
                id={id}
                aria-labelledby={`${id}-heading`}
                className="scroll-mt-24 border-t border-border pt-10"
              >
                <h2
                  id={`${id}-heading`}
                  className="text-2xl md:text-3xl font-bold text-foreground mb-6"
                >
                  {name}
                </h2>
                <Component />
              </section>
            ))}
          </div>
        </main>

        <SiteFooter />
      </div>
    </>
  );
}
