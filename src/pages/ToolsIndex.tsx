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
          content="Trade-in value estimator, repower cost calculator, Boost eligibility checker, shaft length picker. Real CAD numbers from a Mercury Premier dealer in Gores Landing, ON."
        />
      </Helmet>

      <div className="min-h-screen bg-repower-paper">
        <RepowerHeader />
        <div className="pt-[64px] lg:pt-[72px]" />

        <main className="max-w-5xl mx-auto px-4 py-10 md:py-14">
          <header className="mb-10 md:mb-12">
            <div className="flex items-center gap-3 mb-4">
              <span className="block h-px w-8 bg-repower-mercury-red/70" aria-hidden />
              <span className="font-sans text-[13px] md:text-sm font-semibold uppercase tracking-[0.24em] text-repower-mercury-red">
                Free Tools
              </span>
            </div>
            <h1
              className="font-display font-bold text-repower-navy-900 leading-[1.05] tracking-[-0.025em]"
              style={{ fontSize: 'clamp(32px, 4vw, 48px)' }}
            >
              Free Mercury Repower Tools
            </h1>
            <p className="mt-4 font-sans text-[17px] text-repower-navy-900/65 leading-relaxed max-w-3xl">
              Four quick calculators to help you scope a repower before you call. No signup, no
              email gate, real CAD numbers.
            </p>
            <div className="mt-7 h-px w-full bg-repower-navy-900/10" aria-hidden />
          </header>

          <section aria-label="Available tools" className="grid gap-6 md:grid-cols-2 mb-14">
            {TOOLS.map(({ id, name, description, Icon }) => (
              <div
                key={id}
                className="rounded-xl border border-repower-navy-900/15 bg-white p-6 flex flex-col shadow-sm"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-repower-navy-900/5 text-repower-navy-900">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h2 className="font-display font-bold text-lg text-repower-navy-900" style={{ letterSpacing: '-0.02em' }}>
                    {name}
                  </h2>
                </div>
                <p className="font-sans text-[14px] text-repower-navy-900/70 mb-5 flex-1 leading-relaxed">
                  {description}
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="w-full sm:w-auto self-start border-repower-navy-900/20 text-repower-navy-900 hover:bg-repower-navy-900/5"
                >
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
                className="scroll-mt-24 border-t border-repower-navy-900/10 pt-10"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="block h-px w-8 bg-repower-mercury-red/70" aria-hidden />
                  <span className="font-sans text-[13px] md:text-sm font-semibold uppercase tracking-[0.24em] text-repower-mercury-red">
                    Tool
                  </span>
                </div>
                <h2
                  id={`${id}-heading`}
                  className="font-display font-bold text-repower-navy-900 mb-6 leading-[1.1] tracking-[-0.025em]"
                  style={{ fontSize: 'clamp(26px, 3vw, 34px)' }}
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
