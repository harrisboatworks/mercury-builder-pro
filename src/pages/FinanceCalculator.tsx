import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useLocation, useNavigate, Link } from 'react-router-dom';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { supabase } from '@/integrations/supabase/client';
import { formatMotorTitle } from '@/lib/card-title';
import { useActivePromotions } from '@/hooks/useActivePromotions';
import { findMotorSpecs } from '@/lib/data/mercury-motors';
import {
  calculatePaymentWithFrequency,
  DEALERPLAN_FEE,
  getFinancingTerm,
  getMotorCalculatorApr,
  type PaymentFrequency,
} from '@/lib/finance';
import { RepowerHeader } from '@/components/repower/RepowerHeader';
import { SiteFooter } from '@/components/ui/site-footer';
import { FinanceCalculatorSEO } from '@/components/seo/FinanceCalculatorSEO';
import { useQuote } from '@/contexts/QuoteContext';
import { Search, Calculator, FileText, Anchor, Calendar, Percent, CreditCard, ShieldCheck, ArrowRight, Phone, Sparkles } from 'lucide-react';
import { getCurrentMercuryFinancingRate } from '@/components/promotions/TDAlwaysOnOffer';
import { getDealerPrice } from '@/lib/canonical-pricing';

const CURRENT_RATE = getCurrentMercuryFinancingRate();

// ── Static data ──────────────────────────────────────────────

const STEPS = [
  { icon: Search, title: 'Choose Your Motor', desc: 'Browse our full Mercury lineup' },
  { icon: Calculator, title: 'Build Your Quote', desc: 'Configure options & pricing' },
  { icon: FileText, title: 'Apply Online', desc: 'Quick 5-minute application' },
  { icon: Anchor, title: 'Hit the Water', desc: 'Get approved & enjoy' },
];

const BENEFITS = [
  { icon: Calendar, title: 'Flexible Amortization', desc: 'Payment calculations can use amortization up to 240 months; the active TD contract term is up to 60 months.' },
  { icon: Percent, title: 'Competitive Rates', desc: `${CURRENT_RATE.programLabel}. Promotional rates may apply.` },
  { icon: CreditCard, title: 'Payment Options', desc: 'Choose weekly, bi-weekly, or monthly payments.' },
  { icon: ShieldCheck, title: 'No Early Payoff Penalty', desc: 'Pay off your motor anytime with zero extra fees.' },
];

const FAQ_ITEMS = [
  { q: 'What credit score do I need?', a: "We work with a range of credit profiles. While stronger credit gets better rates, we have options for many situations. Apply and we'll find the best fit." },
  { q: 'What documents do I need to apply?', a: 'A valid government-issued ID, proof of income (recent pay stubs or tax returns), and proof of address. The application itself takes about 5 minutes.' },
  { q: 'How long does approval take?', a: 'Most applications receive a decision within 1–2 business days. Some are approved same-day.' },
  { q: "What's the minimum amount for financing?", a: 'Financing is available on purchases of $5,000 or more. For smaller purchases, we recommend our cash rebate options when available.' },
  { q: 'Can I pay off my loan early?', a: 'Absolutely. There are no prepayment penalties, pay off your balance anytime without extra fees.' },
  { q: "What's included in the financed amount?", a: `The financed total includes the motor price, 13% HST, and a $${DEALERPLAN_FEE} finance administration fee. Your down payment and any trade-in value are subtracted before calculating payments.` },
];

// ── Types ────────────────────────────────────────────────────

interface DbMotor {
  id: string;
  model: string;
  model_display?: string | null;
  model_number?: string | null;
  year: number;
  base_price: number | null;
  sale_price: number | null;
  dealer_price?: number | null;
}

// ── SEO helper ───────────────────────────────────────────────

const setSeo = (title: string, description: string) => {
  document.title = title;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', description);
  else {
    const m = document.createElement('meta');
    m.name = 'description';
    m.content = description;
    document.head.appendChild(m);
  }
  // Canonical is owned by the prerendered HTML / FinanceCalculatorSEO; no runtime mutation.
};

// ── Component ────────────────────────────────────────────────

export default function FinanceCalculator() {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const calcRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);
  const [motor, setMotor] = useState<DbMotor | null>(null);
  const { state: quoteState } = useQuote();

  const modelId = params.get('model');
  const navState = useMemo(
    () => (location.state as { motorPrice?: number; motorModel?: string; motorId?: string; motorHp?: number; fromModal?: boolean } | null) || {},
    [location.state]
  );

  const [totalFinanced, setTotalFinanced] = useState<number>(0);
  const [down, setDown] = useState<number>(0);
  const [apr, setApr] = useState<number>(() => getMotorCalculatorApr(0));
  const [term, setTerm] = useState<number>(60);
  const [frequency, setFrequency] = useState<PaymentFrequency>('monthly');
  const { promotions, getPromotionOptions, getSpecialFinancingRates } = useActivePromotions();

  // Derive promo-aware content for hero pill & banner
  const financingPromoData = useMemo(() => {
    const rates = getSpecialFinancingRates();
    const options = getPromotionOptions();
    const hasFinancingOption = options.some(o => o.id === 'special_financing' || o.id === 'no_payments');
    const lowestRate = rates ? Math.min(...rates.map(r => r.rate)) : null;
    const noPaymentsOption = options.find(o => o.id === 'no_payments');
    const parentPromo = promotions.find(p => (p.promo_options?.options?.length ?? 0) > 0);
    return { hasFinancingOption, lowestRate, noPaymentsOption, parentPromo, rates };
  }, [promotions, getPromotionOptions, getSpecialFinancingRates]);

  const heroPillText = useMemo(() => {
    if (financingPromoData.lowestRate) return `Promo rates from ${financingPromoData.lowestRate}% APR`;
    if (financingPromoData.noPaymentsOption) return financingPromoData.noPaymentsOption.title;
    return `Rates ${CURRENT_RATE.rate}`;
  }, [financingPromoData]);

  const normalizedAmortization = Math.min(240, Math.max(36, term || 60));

  // ── SEO ──
  useEffect(() => {
    setSeo('Finance Your Mercury Outboard | Harris Boat Works', `Estimate payments and apply for Canadian Mercury outboard financing. Rates ${CURRENT_RATE.rate}; amortization may be available up to 240 months, OAC.`);
  }, []);

  // ── Motor loading (unchanged logic) ──
  useEffect(() => {
    const run = async () => {
      if (navState.motorPrice && navState.motorModel) {
        const motorPrice = Math.round(navState.motorPrice);
        const totalWithFees = motorPrice * 1.13 + DEALERPLAN_FEE;
        setTotalFinanced(Math.round(totalWithFees));
        setTerm(getFinancingTerm(Math.round(totalWithFees)));
        setMotor({ id: navState.motorId || 'nav-state', model: navState.motorModel, year: new Date().getFullYear(), base_price: navState.motorPrice, sale_price: navState.motorPrice });
        return;
      }
      if (quoteState.motor) {
        const motorPrice = quoteState.motor.price || 0;
        const totalWithFees = motorPrice * 1.13 + DEALERPLAN_FEE;
        setTotalFinanced(Math.round(totalWithFees));
        setTerm(getFinancingTerm(Math.round(totalWithFees)));
        setMotor({ id: quoteState.motor.id || 'quote-context', model: quoteState.motor.model || '', year: quoteState.motor.year || new Date().getFullYear(), base_price: motorPrice, sale_price: motorPrice });
        return;
      }
      if (!modelId) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('motor_models')
        .select('id, model, model_display, model_number, year, base_price, sale_price, dealer_price')
        .eq('id', modelId)
        .maybeSingle();
      if (!error && data) {
        const canonicalDealerPrice = data.model_number ? getDealerPrice(data.model_number) : null;
        const motorPrice = canonicalDealerPrice
          ?? (data.dealer_price && data.dealer_price > 0 ? data.dealer_price : null)
          ?? (data.sale_price && data.sale_price > 0 ? data.sale_price : null)
          ?? data.base_price
          ?? 0;
        setMotor({
          ...(data as DbMotor),
          model: data.model_display || data.model,
          base_price: motorPrice,
          sale_price: motorPrice,
        });
        const totalWithFees = motorPrice * 1.13 + DEALERPLAN_FEE;
        setTotalFinanced(Math.round(totalWithFees));
        setTerm(getFinancingTerm(Math.round(totalWithFees)));
      }
      setLoading(false);
    };
    run();
  }, [modelId, navState, quoteState.motor]);

  useEffect(() => {
    if (totalFinanced > 0) {
      setApr(getMotorCalculatorApr(totalFinanced));
    }
  }, [totalFinanced]);

  // ── Calculations (unchanged) ──
  const paymentCalculation = useMemo(() => {
    const principal = Math.max(0, totalFinanced - down);
    if (!principal || principal <= 0) return { amount: 0, frequency };
    const result = calculatePaymentWithFrequency(principal, frequency, apr, normalizedAmortization);
    return { amount: result.payment, frequency, termPeriods: result.termPeriods };
  }, [totalFinanced, down, apr, frequency, normalizedAmortization]);

  const breakdown = useMemo(() => {
    if (totalFinanced <= 0) {
      return { motorPrice: 0, hst: 0, financeFee: 0, total: 0 };
    }
    const motorPrice = Math.max(0, Math.round((totalFinanced - DEALERPLAN_FEE) / 1.13));
    const hst = Math.round(motorPrice * 0.13);
    return { motorPrice, hst, financeFee: DEALERPLAN_FEE, total: totalFinanced };
  }, [totalFinanced]);

  const handleApplyForFinancing = () => {
    if (!motor) {
      navigate('/financing-application');
      return;
    }
    navigate('/financing-application', {
      state: {
        motorId: motor.id, motorModel: motor.model, motorYear: motor.year,
        motorPrice: motor.base_price || motor.sale_price || 0,
        totalFinanced, downPayment: down, apr, frequency,
        amortizationMonths: normalizedAmortization,
        estimatedPayment: paymentCalculation.amount, fromCalculator: true,
      },
    });
  };

  const scrollToCalc = () => calcRef.current?.scrollIntoView({ behavior: 'smooth' });

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-repower-paper">
      <FinanceCalculatorSEO />
      <RepowerHeader />

      <main className="pt-[64px] lg:pt-[72px]">
        {/* ─── 1. Heading zone ─── */}
        <section className="px-6 md:px-14 py-14 md:py-20">
          <div className="max-w-[1100px] mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-5">
              <span className="h-px w-8 bg-repower-mercury-red" />
              <p className="font-sans font-semibold text-[13px] md:text-sm uppercase tracking-[0.24em] text-repower-mercury-red">
                {heroPillText}
              </p>
              <span className="h-px w-8 bg-repower-mercury-red" />
            </div>
            <h1
              className="font-display font-bold text-repower-navy-900 mb-5"
              style={{ fontSize: 'clamp(40px, 5vw, 64px)', letterSpacing: '-0.025em', lineHeight: 1.05 }}
            >
              Finance Your Mercury Outboard
            </h1>
            <p className="font-sans text-[18px] text-repower-navy-900/65 max-w-[60ch] mx-auto mb-8">
              Clear estimates. Flexible financing. On the water sooner.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={scrollToCalc}
                className="group inline-flex items-center justify-center gap-2 bg-repower-mercury-red text-repower-cream px-7 py-4 font-sans font-bold text-[13px] uppercase tracking-[0.14em] hover:bg-repower-mercury-red-deep transition-colors"
              >
                Estimate My Payment
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <Link
                to="/quote/motor-selection"
                className="inline-flex items-center justify-center border border-repower-navy-900/20 bg-white text-repower-navy-900 px-7 py-4 font-sans font-bold text-[13px] uppercase tracking-[0.14em] hover:border-repower-navy-900 transition-colors"
              >
                Build Your Quote
              </Link>
            </div>

            <button
              onClick={handleApplyForFinancing}
              className="mt-5 min-h-[44px] font-sans text-[13px] font-semibold text-repower-navy-900/70 hover:text-repower-mercury-red transition-colors underline underline-offset-4"
            >
              Already have your numbers? Apply for financing
            </button>
            <p className="mx-auto mt-4 max-w-2xl font-sans text-[12px] leading-relaxed text-repower-navy-900/60">
              Payment and rate examples are estimates, not a credit offer. The active TD program uses a contract of up to 60 months with amortization up to 240 months; a remaining balance may be due at maturity. Approval and final structure are confirmed by the Canadian lender.
            </p>
            <div className="h-px bg-repower-navy-900/10 mt-12 max-w-[200px] mx-auto" />
          </div>
        </section>

        {/* ─── 2. How It Works ─── */}
        <section className="hidden py-14 px-6 md:block md:px-14 bg-white">
          <div className="max-w-[1100px] mx-auto">
            <h2 className="text-center font-display font-bold text-[clamp(28px,3.5vw,40px)] text-repower-navy-900 mb-10" style={{ letterSpacing: '-0.025em' }}>
              How It Works
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {STEPS.map((step, i) => (
                <div key={i} className="flex flex-col items-center text-center gap-3">
                  <step.icon className="h-7 w-7 text-repower-mercury-red" strokeWidth={1.5} />
                  <div className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-repower-navy-900/55">Step {i + 1}</div>
                  <h3 className="font-display font-semibold text-[16px] text-repower-navy-900">{step.title}</h3>
                  <p className="font-sans text-[13px] text-repower-navy-900/65">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── 3. Benefits ─── */}
        <section className="hidden py-14 px-6 md:block md:px-14 bg-repower-paper">
          <div className="max-w-[1100px] mx-auto">
            <h2 className="text-center font-display font-bold text-[clamp(28px,3.5vw,40px)] text-repower-navy-900 mb-10" style={{ letterSpacing: '-0.025em' }}>
              Why Finance With Us
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {BENEFITS.map((b, i) => (
                <div key={i} className="bg-white border border-repower-navy-900/10 p-6 transition-shadow hover:shadow-md">
                  <b.icon className="h-7 w-7 text-repower-mercury-red mb-4" strokeWidth={1.5} />
                  <h3 className="font-display font-semibold text-[17px] text-repower-navy-900 mb-2">{b.title}</h3>
                  <p className="font-sans text-[14px] text-repower-navy-900/65">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── 4. Active Promotion Banner (conditional) ─── */}
        {financingPromoData.hasFinancingOption && financingPromoData.parentPromo && (
          <section className="py-10 px-6 md:px-14 bg-white">
            <div className="max-w-[1100px] mx-auto border border-repower-gold/40 bg-repower-cream p-8 text-center">
              <div className="inline-flex items-center gap-2 mb-3 font-display font-semibold text-[18px] text-repower-navy-900">
                <Sparkles className="h-5 w-5 text-repower-gold" />
                {financingPromoData.parentPromo.name}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 font-sans text-[13px] text-repower-navy-900/65 mb-5">
                {financingPromoData.lowestRate && (
                  <span className="bg-white px-3 py-1 border border-repower-navy-900/10">Rates from {financingPromoData.lowestRate}% APR</span>
                )}
                {financingPromoData.noPaymentsOption && (
                  <span className="bg-white px-3 py-1 border border-repower-navy-900/10">{financingPromoData.noPaymentsOption.title}</span>
                )}
                {financingPromoData.parentPromo.end_date && (
                  <span>Ends {new Date(financingPromoData.parentPromo.end_date).toLocaleDateString()}</span>
                )}
              </div>
              <p className="mx-auto mb-5 max-w-2xl font-sans text-[12px] leading-relaxed text-repower-navy-900/60">
                OAC. Eligibility, final APR, term, and financed amount are determined by the lender. Offer details and availability may change; review the full promotion before applying.
              </p>
              <Link
                to="/promotions"
                className="inline-flex items-center gap-2 border border-repower-navy-900/20 bg-white text-repower-navy-900 px-5 py-2.5 font-sans font-bold text-[12px] uppercase tracking-[0.14em] hover:border-repower-navy-900 transition-colors"
              >
                View Full Promotion Details <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </section>
        )}

        {/* ─── 5. Calculator ─── */}
        <section ref={calcRef} id="calculator" className="py-14 md:py-20 px-6 md:px-14 bg-repower-paper scroll-mt-20">
          <div className="max-w-[1100px] mx-auto">
            <h2 className="font-display font-bold text-[clamp(28px,3.5vw,40px)] text-repower-navy-900 text-center mb-2" style={{ letterSpacing: '-0.025em' }}>
              Estimate Your Payment
            </h2>
            <p className="font-sans text-[13px] text-repower-navy-900/55 text-center mb-10">
              Values are estimates only and do not represent a credit offer.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Inputs (60%) */}
              <div className="lg:col-span-3 space-y-6">
                {motor && (
                  <div className="bg-white border border-repower-navy-900/10 p-6">
                    <div className="font-display font-semibold text-[17px] text-repower-navy-900 mb-4">{formatMotorTitle(motor.year, motor.model)}</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-sans text-[13px]">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-repower-navy-900/55 mb-1">Motor</div>
                        <div className="text-repower-navy-900">${breakdown.motorPrice.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-repower-navy-900/55 mb-1">HST (13%)</div>
                        <div className="text-repower-navy-900">${breakdown.hst.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-repower-navy-900/55 mb-1">Finance Fee</div>
                        <div className="text-repower-navy-900">${DEALERPLAN_FEE}</div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-repower-navy-900/55 mb-1">Total</div>
                        <div className="text-repower-navy-900 font-semibold">${totalFinanced.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white border border-repower-navy-900/10 p-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {[
                      { id: 'totalFinanced', label: 'Total Financed', value: totalFinanced, set: (v: number) => setTotalFinanced(v), num: true },
                      { id: 'down', label: 'Down Payment', value: down, set: (v: number) => setDown(v), num: true },
                    ].map((f) => (
                      <div key={f.id}>
                        <label htmlFor={f.id} className="block mb-2 font-sans font-semibold text-[12px] uppercase tracking-[0.14em] text-repower-navy-900/70">{f.label}</label>
                        <input
                          id={f.id}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={f.value}
                          onChange={(e) => f.set(Number(e.target.value.replace(/[^0-9]/g, '') || 0))}
                          className="w-full rounded bg-white border border-repower-navy-900/10 px-4 py-[14px] font-sans text-[15px] text-repower-navy-900 focus:outline-none focus:border-repower-gold focus:ring-[3px] focus:ring-repower-gold/15"
                        />
                      </div>
                    ))}
                    <div>
                      <label htmlFor="apr" className="block mb-2 font-sans font-semibold text-[12px] uppercase tracking-[0.14em] text-repower-navy-900/70">APR (%)</label>
                      <input
                        id="apr"
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        value={apr}
                        onChange={(e) => setApr(Number(e.target.value || 0))}
                        aria-describedby="apr-help"
                        className="w-full rounded bg-white border border-repower-navy-900/10 px-4 py-[14px] font-sans text-[15px] text-repower-navy-900 focus:outline-none focus:border-repower-gold focus:ring-[3px] focus:ring-repower-gold/15"
                      />
                      <p id="apr-help" className="mt-2 font-sans text-[12px] leading-relaxed text-repower-navy-900/55">
                        Defaults to the current standing estimate ({CURRENT_RATE.rate}). Short-term promotional rates have their own terms; see the promotion details before comparing payments.
                      </p>
                    </div>
                    <div>
                      <label htmlFor="term" className="block mb-2 font-sans font-semibold text-[12px] uppercase tracking-[0.14em] text-repower-navy-900/70">Amortization (months)</label>
                      <input
                        id="term"
                        type="number"
                        inputMode="numeric"
                        min={36}
                        max={240}
                        value={term}
                        onChange={(e) => setTerm(Number(e.target.value || 0))}
                        onBlur={() => setTerm(normalizedAmortization)}
                        className="w-full rounded bg-white border border-repower-navy-900/10 px-4 py-[14px] font-sans text-[15px] text-repower-navy-900 focus:outline-none focus:border-repower-gold focus:ring-[3px] focus:ring-repower-gold/15"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2 font-sans font-semibold text-[12px] uppercase tracking-[0.14em] text-repower-navy-900/70">Payment Frequency</label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['monthly', 'bi-weekly', 'weekly'] as PaymentFrequency[]).map((f) => {
                        const labels: Record<PaymentFrequency, string> = { monthly: 'Monthly', 'bi-weekly': 'Bi-weekly', weekly: 'Weekly' };
                        const active = frequency === f;
                        return (
                          <button
                            key={f}
                            type="button"
                            onClick={() => setFrequency(f)}
                            className={`rounded bg-white px-4 py-3 font-sans text-[14px] text-repower-navy-900 border transition-colors ${active ? 'border-repower-navy-900' : 'border-repower-navy-900/10 hover:border-repower-navy-900/30'}`}
                          >
                            {labels[f]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {financingPromoData.lowestRate && (
                    <div className="bg-repower-cream border border-repower-gold/40 p-4 font-sans text-[13px] text-repower-navy-900">
                      <span className="font-semibold">A lower promotional rate may be available:</span>{' '}
                      from {financingPromoData.lowestRate}% APR for the term shown in the{' '}
                      <Link to="/promotions" className="font-semibold underline underline-offset-4">
                        current promotion details
                      </Link>
                      . It is not automatically mixed into this standing-rate estimate.
                    </div>
                  )}

                  <p className="font-sans text-[12px] text-repower-navy-900/55">* Includes 13% HST and ${DEALERPLAN_FEE} finance fee</p>
                </div>
              </div>

              {/* Sticky payment summary (40%) */}
              <div className="lg:col-span-2">
                <div className="lg:sticky lg:top-24 bg-repower-cream border border-repower-navy-900/10 p-8">
                  <div className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-repower-navy-900/55 mb-3">
                    Estimated {frequency === 'bi-weekly' ? 'Bi-weekly' : frequency === 'weekly' ? 'Weekly' : 'Monthly'} Payment
                  </div>
                  <div className="font-display font-bold text-repower-navy-900 mb-2" style={{ fontSize: 'clamp(36px, 5vw, 48px)', letterSpacing: '-0.025em', lineHeight: 1 }}>
                    ${paymentCalculation.amount.toLocaleString()}
                  </div>
                  {paymentCalculation.termPeriods && (
                    <div className="font-sans text-[13px] text-repower-navy-900/65 mb-6">
                      Payment calculated on a {normalizedAmortization}-month amortization
                    </div>
                  )}

                  <p className="font-sans text-[12px] leading-relaxed text-repower-navy-900/60">
                    Calculated at {apr.toFixed(2)}% APR using the values shown. The active TD program has a contract term of up to 60 months. If the selected amortization is longer, a balance remains due at maturity; the lender confirms the exact amount and final structure.
                  </p>

                  <div className="h-px bg-repower-navy-900/10 my-6" />

                  <div className="space-y-2.5 font-sans text-[13px] mb-6">
                    <div className="flex justify-between text-repower-navy-900/65"><span>Motor</span><span>${breakdown.motorPrice.toLocaleString()}</span></div>
                    <div className="flex justify-between text-repower-navy-900/65"><span>HST (13%)</span><span>${breakdown.hst.toLocaleString()}</span></div>
                    <div className="flex justify-between text-repower-navy-900/65"><span>Finance Fee</span><span>${breakdown.financeFee.toLocaleString()}</span></div>
                    <div className="flex justify-between text-repower-navy-900 font-semibold pt-2 border-t border-repower-navy-900/10"><span>Total Financed</span><span>${totalFinanced.toLocaleString()}</span></div>
                    {down > 0 && (
                      <div className="flex justify-between text-repower-navy-900/65"><span>Less: Down Payment</span><span>-${down.toLocaleString()}</span></div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handleApplyForFinancing}
                      className="group w-full inline-flex items-center justify-center gap-2 bg-repower-mercury-red text-repower-cream px-7 py-4 font-sans font-bold text-[13px] uppercase tracking-[0.14em] hover:bg-repower-mercury-red-deep transition-colors"
                    >
                      Apply for Financing
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </button>
                    <Link
                      to="/quote/motor-selection"
                      className="w-full inline-flex items-center justify-center border border-repower-navy-900/20 bg-white text-repower-navy-900 px-7 py-4 font-sans font-bold text-[13px] uppercase tracking-[0.14em] hover:border-repower-navy-900 transition-colors"
                    >
                      Build a Full Quote
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 6. FAQ ─── */}
        <section className="py-14 md:py-20 px-6 md:px-14 bg-white">
          <div className="max-w-[800px] mx-auto">
            <h2 className="font-display font-bold text-[clamp(28px,3.5vw,40px)] text-repower-navy-900 text-center mb-10" style={{ letterSpacing: '-0.025em' }}>
              Frequently Asked Questions
            </h2>
            <Accordion type="single" collapsible className="border-t border-repower-navy-900/10">
              {FAQ_ITEMS.map((item, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border-b border-repower-navy-900/10">
                  <AccordionTrigger className="text-left font-sans font-semibold text-[16px] text-repower-navy-900 hover:no-underline py-5 hover:bg-repower-navy-900/[0.04] px-2 -mx-2">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="font-sans text-[15px] text-repower-navy-900/75 pb-5 pt-1 border-t border-repower-gold">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* ─── 7. Final CTA Bar ─── */}
        <section className="py-14 px-6 md:px-14 bg-repower-navy-900">
          <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div>
              <h2 className="font-display font-bold text-[28px] text-repower-cream mb-1" style={{ letterSpacing: '-0.025em' }}>Ready to Get Started?</h2>
              <p className="font-sans text-[15px] text-repower-cream/70">Apply online or give us a call, we're here to help.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={handleApplyForFinancing}
                className="group inline-flex items-center gap-2 bg-repower-mercury-red text-repower-cream px-7 py-4 font-sans font-bold text-[13px] uppercase tracking-[0.14em] hover:bg-repower-mercury-red-deep transition-colors"
              >
                Apply Now <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <a href="tel:+19053422153" className="inline-flex items-center gap-2 font-sans text-[14px] font-semibold text-repower-cream/90 hover:text-repower-cream transition-colors">
                <Phone className="h-4 w-4" /> (905) 342-2153
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
