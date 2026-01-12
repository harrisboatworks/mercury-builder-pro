import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ChooseOneCard } from './ChooseOneCard';
import { RebateMatrix } from './RebateMatrix';
import { FinancingRatesCard } from './FinancingRatesCard';
import { Button } from '@/components/ui/button';
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
    <section className="max-w-6xl mx-auto px-4 py-16">
      {/* Section header */}
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4"
        >
          Choose Your Bonus
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-3xl md:text-4xl font-bold text-foreground mb-4"
        >
          Pick One of These Exclusive Benefits
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-lg text-muted-foreground max-w-2xl mx-auto"
        >
          In addition to 7 years of factory coverage, choose the bonus that works best for you.
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
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
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
                  <button className="w-full flex items-center justify-center gap-2 text-sm text-primary font-medium mt-2 py-2 hover:underline">
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
                  <button className="w-full flex items-center justify-center gap-2 text-sm text-primary font-medium mt-2 py-2 hover:underline">
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
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center"
      >
        <Link to="/">
          <Button size="lg" className="gap-2">
            Build Your Quote & Choose Your Bonus
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
        <p className="text-sm text-muted-foreground mt-3">
          Your selected bonus will be applied when you finalize your purchase
        </p>
      </motion.div>
    </section>
  );
}
