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
    meta: 'About 2 minutes · See an estimated CAD range',
    cta: 'Estimate My Trade-In',
    Icon: DollarSign,
    Component: TradeInValueEstimator,
  },
  {
    id: 'repower-cost',
    name: 'Repower Cost Estimator',
    description: 'Ballpark cost for a complete repower with install.',
    meta: 'About 2 minutes · See a budget range',
    cta: 'Estimate My Repower Cost',
    Icon: Calculator,
    Component: RepowerCostEstimator,
  },
  {
    id: 'boost-eligibility',
    name: 'Boost Eligibility Checker',
    description: 'Is my Mercury 150 Pro XS eligible for the Boost upgrade?',
    meta: 'Under 1 minute · Get an eligibility result',
    cta: 'Check Boost Eligibility',
    Icon: Zap,
    Component: BoostEligibilityChecker,
  },
  {
    id: 'shaft-length',
    name: 'Shaft Length Picker',
    description: 'What shaft length fits my transom?',
    meta: 'About 1 minute · Get a shaft recommendation',
    cta: 'Find My Shaft Length',
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
          content="Trade-in value estimator, repower cost calculator, and shaft length picker. Real CAD numbers from a Mercury Premier dealer in Gores Landing, Ontario."
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

          <nav aria-label="Tool shortcuts" className="grid gap-6 md:grid-cols-2 mb-14">
            {TOOLS.map(({ id, name, description, meta, cta, Icon }) => (
              <div
                key={id}
                className="rounded-xl border border-repower-navy-900/15 bg-white p-6 flex flex-col shadow-sm"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-repower-navy-900/5 text-repower-navy-900">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <span className="font-display font-bold text-lg text-repower-navy-900" style={{ letterSpacing: '-0.02em' }}>
                    {name}
                  </span>
                </div>
                <p className="font-sans text-[14px] text-repower-navy-900/70 mb-5 flex-1 leading-relaxed">
                  {description}
                </p>
                <p className="mb-4 font-sans text-[12px] font-medium text-repower-navy-900/60">{meta}</p>
                <Button
                  asChild
                  variant="outline"
                  className="w-full sm:w-auto self-start border-repower-navy-900/20 text-repower-navy-900 hover:bg-repower-navy-900/5"
                >
                  <a href={`#${id}`}>
                    {cta}
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </a>
                </Button>
              </div>
            ))}
          </nav>

          <div className="space-y-16">
            {TOOLS.map(({ id, Component }) => (
              <div
                key={id}
                id={id}
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
              </div>
            ))}
          </div>
        </main>

        <SiteFooter />
      </div>
    </>
  );
}
