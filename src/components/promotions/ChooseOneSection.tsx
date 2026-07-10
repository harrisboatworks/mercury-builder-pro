import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ChooseOneCard } from './ChooseOneCard';
import { RebateMatrix } from './RebateMatrix';
import { FinancingRatesCard } from './FinancingRatesCard';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface PromoOption {
  id: string;
  title: string;
  description: string;
  icon?: string;
  rates?: Array<{ months: number; rate: number }>;
  minimum_amount?: number;
  matrix?: Array<{ hp_min: number; hp_max: number; rebate: number }>;
}

interface ChooseOneSectionProps {
  options: PromoOption[];
}

export function ChooseOneSection({ options }: ChooseOneSectionProps) {
  const [expandedOption, setExpandedOption] = useState<string | null>('cash_rebate');

  const noPaymentsOption = options.find(o => o.id === 'no_payments');
  const financingOption = options.find(o => o.id === 'special_financing');
  const rebateOption = options.find(o => o.id === 'cash_rebate');

  return (
    <section className="bg-repower-paper text-repower-navy-900 py-20 md:py-28 px-6 md:px-14">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-14 max-w-3xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-sans font-semibold text-[13px] md:text-sm uppercase tracking-[0.24em] text-repower-mercury-red mb-5 inline-flex items-center gap-3"
          >
            <span className="inline-block h-px w-8 bg-repower-mercury-red/60" />
            Choose Your Bonus
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="font-display font-bold text-repower-navy-900 mb-5"
            style={{ fontSize: 'clamp(32px, 4vw, 44px)', letterSpacing: '-0.025em', lineHeight: 1.1 }}
          >
            Pick One of These Exclusive Benefits
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-sans text-[17px] text-repower-navy-900/65 max-w-[60ch] mx-auto leading-relaxed"
          >
            Choose the active Mercury bonus that works best for you. Standard factory warranty and promotion eligibility are confirmed on your quote.
          </motion.p>
        </div>

      {/* Three option cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {/* Option 1: No Payments */}
        {noPaymentsOption && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0 }}
          >
            <ChooseOneCard
              id={noPaymentsOption.id}
              title={noPaymentsOption.title}
              description={noPaymentsOption.description}
              icon={noPaymentsOption.icon}
              highlight="Buy Now, Pay Later"
            >
              <div className="mt-2 p-4 bg-repower-cream border border-repower-navy-900/10">
                <p className="font-sans text-[13px] text-repower-navy-900/70 leading-relaxed">
                  Perfect for buyers who want to enjoy their new motor now and start payments in 6 months.
                </p>
              </div>
            </ChooseOneCard>
          </motion.div>
        )}

        {/* Option 2: Special Financing */}
        {financingOption && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <Collapsible 
              open={expandedOption === 'special_financing'} 
              onOpenChange={(open) => setExpandedOption(open ? 'special_financing' : null)}
            >
              <ChooseOneCard
                id={financingOption.id}
                title={financingOption.title}
                description={financingOption.description}
                icon={financingOption.icon}
                highlight="As Low As 2.99% APR"
              >
                <CollapsibleTrigger asChild>
                  <button className="w-full inline-flex items-center justify-center gap-2 font-sans font-semibold text-[12px] uppercase tracking-[0.14em] text-repower-mercury-red mt-3 py-2 border-t border-repower-navy-900/10 hover:text-repower-mercury-red-deep transition-colors">
                    {expandedOption === 'special_financing' ? (
                      <>Hide Rates <ChevronUp className="w-4 h-4" /></>
                    ) : (
                      <>View All Rates <ChevronDown className="w-4 h-4" /></>
                    )}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-4">
                    {financingOption.rates && (
                      <FinancingRatesCard 
                        rates={financingOption.rates} 
                        minimumAmount={financingOption.minimum_amount}
                        compact
                      />
                    )}
                  </div>
                </CollapsibleContent>
              </ChooseOneCard>
            </Collapsible>
          </motion.div>
        )}

        {/* Option 3: Cash Rebate */}
        {rebateOption && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Collapsible 
              open={expandedOption === 'cash_rebate'} 
              onOpenChange={(open) => setExpandedOption(open ? 'cash_rebate' : null)}
            >
              <ChooseOneCard
                id={rebateOption.id}
                title={rebateOption.title}
                description={rebateOption.description}
                icon={rebateOption.icon}
                highlight="Up To $1,000 Back"
              >
                <CollapsibleTrigger asChild>
                  <button className="w-full inline-flex items-center justify-center gap-2 font-sans font-semibold text-[12px] uppercase tracking-[0.14em] text-repower-mercury-red mt-3 py-2 border-t border-repower-navy-900/10 hover:text-repower-mercury-red-deep transition-colors">
                    {expandedOption === 'cash_rebate' ? (
                      <>Hide Rebate Chart <ChevronUp className="w-4 h-4" /></>
                    ) : (
                      <>View Rebate Chart <ChevronDown className="w-4 h-4" /></>
                    )}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-4">
                    {rebateOption.matrix && (
                      <RebateMatrix matrix={rebateOption.matrix} compact />
                    )}
                  </div>
                </CollapsibleContent>
              </ChooseOneCard>
            </Collapsible>
          </motion.div>
        )}
      </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Link to="/">
            <button className="group inline-flex items-center justify-center gap-2 bg-repower-mercury-red text-repower-cream px-7 py-4 font-sans font-bold text-[13px] uppercase tracking-[0.14em] hover:bg-repower-mercury-red-deep transition-colors">
              Build Your Quote & Choose Your Bonus
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={1.75} />
            </button>
          </Link>
          <p className="font-sans text-[13px] text-repower-navy-900/55 mt-4">
            Your selected bonus will be applied when you finalize your purchase
          </p>
        </motion.div>
      </div>
    </section>
  );
}
