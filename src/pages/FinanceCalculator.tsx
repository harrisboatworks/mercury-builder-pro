import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { supabase } from '@/integrations/supabase/client';
import { formatMotorTitle } from '@/lib/card-title';
import { useActiveFinancingPromo } from '@/hooks/useActiveFinancingPromo';
import { useActivePromotions } from '@/hooks/useActivePromotions';
import { findMotorSpecs } from '@/lib/data/mercury-motors';
import { calculatePaymentWithFrequency, getDefaultFinancingRate, getFinancingTerm, type PaymentFrequency } from '@/lib/finance';
import { LuxuryHeader } from '@/components/ui/luxury-header';
import { SiteFooter } from '@/components/ui/site-footer';
import { useQuote } from '@/contexts/QuoteContext';
import { Search, Calculator, FileText, Anchor, Calendar, Percent, CreditCard, ShieldCheck, ArrowRight, Phone, Sparkles } from 'lucide-react';

// ── Static data ──────────────────────────────────────────────

const STEPS = [
  { icon: Search, title: 'Choose Your Motor', desc: 'Browse our full Mercury lineup' },
  { icon: Calculator, title: 'Build Your Quote', desc: 'Configure options & pricing' },
  { icon: FileText, title: 'Apply Online', desc: 'Quick 5-minute application' },
  { icon: Anchor, title: 'Hit the Water', desc: 'Get approved & enjoy' },
];

const BENEFITS = [
  { icon: Calendar, title: 'Flexible Terms', desc: '36 to 180 months — find the payment that fits your budget.' },
  { icon: Percent, title: 'Competitive Rates', desc: 'Tiered rates starting at 7.99% APR, with promotional rates when available.' },
  { icon: CreditCard, title: 'Payment Options', desc: 'Choose weekly, bi-weekly, or monthly payments.' },
  { icon: ShieldCheck, title: 'No Early Payoff Penalty', desc: 'Pay off your motor anytime with zero extra fees.' },
];

const FAQ_ITEMS = [
  { q: 'What credit score do I need?', a: "We work with a range of credit profiles. While stronger credit gets better rates, we have options for many situations. Apply and we'll find the best fit." },
  { q: 'What documents do I need to apply?', a: 'A valid government-issued ID, proof of income (recent pay stubs or tax returns), and proof of address. The application itself takes about 5 minutes.' },
  { q: 'How long does approval take?', a: 'Most applications receive a decision within 1–2 business days. Some are approved same-day.' },
  { q: "What's the minimum amount for financing?", a: 'Financing is available on purchases of $5,000 or more. For smaller purchases, we recommend our cash rebate options when available.' },
  { q: 'Can I pay off my loan early?', a: 'Absolutely. There are no prepayment penalties — pay off your balance anytime without extra fees.' },
  { q: "What's included in the financed amount?", a: 'The financed total includes the motor price, 13% HST, and a $299 finance administration fee. Your down payment and any trade-in value are subtracted before calculating payments.' },
];

// ── Types ────────────────────────────────────────────────────

interface DbMotor {
  id: string;
  model: string;
  year: number;
  base_price: number | null;
  sale_price: number | null;
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
  const canonicalHref = window.location.origin + '/finance-calculator';
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); }
  link.href = canonicalHref;
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
  const navState = location.state as { motorPrice?: number; motorModel?: string; motorId?: string; motorHp?: number; fromModal?: boolean } || {};

  const [totalFinanced, setTotalFinanced] = useState<number>(0);
  const [down, setDown] = useState<number>(0);
  const [apr, setApr] = useState<number>(8.99);
  const [term, setTerm] = useState<number>(60);
  const [frequency, setFrequency] = useState<PaymentFrequency>('monthly');
  const { promo } = useActiveFinancingPromo();
  const { promotions, getChooseOneOptions, getSpecialFinancingRates } = useActivePromotions();

  // Derive promo-aware content for hero pill & banner
  const financingPromoData = useMemo(() => {
    const rates = getSpecialFinancingRates();
    const options = getChooseOneOptions();
    const hasFinancingOption = options.some(o => o.id === 'special_financing' || o.id === 'no_payments');
    const lowestRate = rates ? Math.min(...rates.map(r => r.rate)) : null;
    const noPaymentsOption = options.find(o => o.id === 'no_payments');
    const parentPromo = promotions.find(p => p.promo_options?.type === 'choose_one');
    return { hasFinancingOption, lowestRate, noPaymentsOption, parentPromo, rates };
  }, [promotions, getChooseOneOptions, getSpecialFinancingRates]);

  const heroPillText = useMemo(() => {
    if (financingPromoData.lowestRate) return `Promo rates from ${financingPromoData.lowestRate}% APR`;
    if (financingPromoData.noPaymentsOption) return financingPromoData.noPaymentsOption.title;
    return 'Rates from 7.99% APR';
  }, [financingPromoData]);

  // ── SEO ──
  useEffect(() => {
    setSeo('Finance Your Mercury Outboard | Harris Boats', 'Estimate payments and apply for flexible Mercury outboard financing. Rates from 7.99% APR, terms up to 180 months.');
  }, []);

  // ── Motor loading (unchanged logic) ──
  useEffect(() => {
    const run = async () => {
      if (navState.motorPrice && navState.motorModel) {
        const motorPrice = Math.round(navState.motorPrice);
        const totalWithFees = motorPrice * 1.13 + 299;
        setTotalFinanced(Math.round(totalWithFees));
        setTerm(getFinancingTerm(Math.round(totalWithFees)));
        if (!promo?.rate) setApr(getDefaultFinancingRate(Math.round(totalWithFees)));
        setMotor({ id: navState.motorId || 'nav-state', model: navState.motorModel, year: new Date().getFullYear(), base_price: navState.motorPrice, sale_price: navState.motorPrice });
        return;
      }
      if (quoteState.motor) {
        const motorPrice = quoteState.motor.price || 0;
        const totalWithFees = motorPrice * 1.13 + 299;
        setTotalFinanced(Math.round(totalWithFees));
        setTerm(getFinancingTerm(Math.round(totalWithFees)));
        if (!promo?.rate) setApr(getDefaultFinancingRate(Math.round(totalWithFees)));
        setMotor({ id: quoteState.motor.id || 'quote-context', model: quoteState.motor.model || '', year: quoteState.motor.year || new Date().getFullYear(), base_price: motorPrice, sale_price: motorPrice });
        return;
      }
      if (!modelId) return;
      setLoading(true);
      const { data, error } = await supabase.from('motor_models').select('id, model, year, base_price, sale_price').eq('id', modelId).maybeSingle();
      if (!error && data) {
        setMotor(data as DbMotor);
        const motorPrice = (data.sale_price && data.sale_price > 0 ? data.sale_price : data.base_price) || 0;
        const totalWithFees = motorPrice * 1.13 + 299;
        setTotalFinanced(Math.round(totalWithFees));
        setTerm(getFinancingTerm(Math.round(totalWithFees)));
        if (!promo?.rate) setApr(getDefaultFinancingRate(Math.round(totalWithFees)));
      }
      setLoading(false);
    };
    run();
  }, [modelId, navState, quoteState.motor]);

  useEffect(() => {
    if (promo?.rate && totalFinanced > 0) {
      const tieredRate = getDefaultFinancingRate(totalFinanced);
      if (promo.rate < tieredRate) setApr(Number(promo.rate));
    }
  }, [promo, totalFinanced]);

  // ── Calculations (unchanged) ──
  const paymentCalculation = useMemo(() => {
    const principal = Math.max(0, totalFinanced - down);
    if (!principal || principal <= 0) return { amount: 0, frequency };
    const result = calculatePaymentWithFrequency(principal, frequency, apr, term);
    return { amount: result.payment, frequency, termPeriods: result.termPeriods };
  }, [totalFinanced, down, apr, frequency, term]);

  const breakdown = useMemo(() => {
    const motorPrice = Math.round((totalFinanced - 299) / 1.13);
    const hst = Math.round(motorPrice * 0.13);
    return { motorPrice, hst, financeFee: 299, total: totalFinanced };
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
        estimatedPayment: paymentCalculation.amount, fromCalculator: true,
      },
    });
  };

  const scrollToCalc = () => calcRef.current?.scrollIntoView({ behavior: 'smooth' });

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col">
      <LuxuryHeader />

      {/* ─── 1. Hero ─── */}
      <section className="bg-gradient-to-b from-stone-100 to-white py-16 md:py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Promo pill */}
          <div className="inline-flex items-center gap-2 mb-6 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            {heroPillText}
          </div>

          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            Finance Your Mercury Outboard
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Low payments. Flexible terms. On the water sooner.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link to="/">Build Your Quote</Link>
            </Button>
            <Button size="lg" variant="outline" onClick={handleApplyForFinancing}>
              Apply Now <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <button onClick={scrollToCalc} className="mt-6 text-sm text-muted-foreground hover:text-primary transition-colors underline underline-offset-4">
            or estimate your payment ↓
          </button>
        </div>
      </section>

      {/* ─── 2. How It Works ─── */}
      <section className="py-14 px-4 bg-background">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-2xl font-semibold text-foreground mb-10">How It Works</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {STEPS.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-3">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary">
                  <step.icon className="h-6 w-6" />
                </div>
                <div className="text-xs font-medium text-muted-foreground">Step {i + 1}</div>
                <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
                <p className="text-xs text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 3. Benefits ─── */}
      <section className="py-14 px-4 bg-gradient-to-b from-stone-50 to-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-2xl font-semibold text-foreground mb-10">Why Finance With Us</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {BENEFITS.map((b, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="pt-6 flex flex-col items-center text-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
                    <b.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-foreground">{b.title}</h3>
                  <p className="text-sm text-muted-foreground">{b.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 4. Active Promotion Banner (conditional) ─── */}
      {financingPromoData.hasFinancingOption && financingPromoData.parentPromo && (
        <section className="py-10 px-4">
          <div className="max-w-4xl mx-auto rounded-xl border border-primary/20 bg-primary/5 p-6 md:p-8 text-center">
            <div className="inline-flex items-center gap-2 mb-3 text-primary font-semibold text-lg">
              <Sparkles className="h-5 w-5" />
              {financingPromoData.parentPromo.name}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground mb-4">
              {financingPromoData.lowestRate && (
                <span className="bg-background px-3 py-1 rounded-full border">Rates from {financingPromoData.lowestRate}% APR</span>
              )}
              {financingPromoData.noPaymentsOption && (
                <span className="bg-background px-3 py-1 rounded-full border">{financingPromoData.noPaymentsOption.title}</span>
              )}
              {financingPromoData.parentPromo.end_date && (
                <span>Ends {new Date(financingPromoData.parentPromo.end_date).toLocaleDateString()}</span>
              )}
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/promotions">View Full Promotion Details <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
        </section>
      )}

      {/* ─── 5. Calculator ─── */}
      <section ref={calcRef} id="calculator" className="py-14 px-4 bg-background scroll-mt-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold text-foreground mb-2 text-center">Estimate Your Payment</h2>
          <p className="text-sm text-muted-foreground mb-8 text-center">Values are estimates only and do not represent a credit offer.</p>

          {/* Prefilled motor info */}
          {motor && (
            <Card className="mb-6">
              <CardContent className="pt-5 pb-4">
                <div className="font-semibold text-foreground mb-2">{formatMotorTitle(motor.year, motor.model)}</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Motor</span><br />${breakdown.motorPrice.toLocaleString()}</div>
                  <div><span className="text-muted-foreground">HST (13%)</span><br />${breakdown.hst.toLocaleString()}</div>
                  <div><span className="text-muted-foreground">Finance Fee</span><br />$299</div>
                  <div><span className="text-muted-foreground">Total</span><br /><span className="font-semibold">${totalFinanced.toLocaleString()}</span></div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="totalFinanced">Total Financed</Label>
                  <Input id="totalFinanced" type="text" inputMode="numeric" pattern="[0-9]*" value={totalFinanced} onChange={(e) => setTotalFinanced(Number(e.target.value.replace(/[^0-9]/g, '') || 0))} />
                </div>
                <div>
                  <Label htmlFor="down">Down Payment</Label>
                  <Input id="down" type="text" inputMode="numeric" pattern="[0-9]*" value={down} onChange={(e) => setDown(Number(e.target.value.replace(/[^0-9]/g, '') || 0))} />
                </div>
                <div>
                  <Label htmlFor="apr">APR (%)</Label>
                  <Input id="apr" type="number" step="0.01" inputMode="decimal" value={apr} onChange={(e) => setApr(Number(e.target.value || 0))} />
                </div>
                <div>
                  <Label htmlFor="term">Term (months)</Label>
                  <Input id="term" type="number" inputMode="numeric" value={term} onChange={(e) => setTerm(Number(e.target.value || 0))} />
                </div>
              </div>

              <div className="mt-4">
                <Label>Payment Frequency</Label>
                <RadioGroup value={frequency} onValueChange={(v: PaymentFrequency) => setFrequency(v)} className="flex flex-col sm:flex-row gap-3 sm:gap-6 mt-2">
                  <div className="flex items-center space-x-2"><RadioGroupItem value="monthly" id="monthly" /><Label htmlFor="monthly" className="cursor-pointer">Monthly</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="bi-weekly" id="bi-weekly" /><Label htmlFor="bi-weekly" className="cursor-pointer">Bi-weekly</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="weekly" id="weekly" /><Label htmlFor="weekly" className="cursor-pointer">Weekly</Label></div>
                </RadioGroup>
              </div>

              {promo && (
                <div className="mt-4 text-sm text-foreground">
                  <span className="font-medium">Promo APR applied:</span> {promo.rate}%{' '}
                  {promo.promo_text && <span>— {promo.promo_text}</span>}{' '}
                  {promo.promo_end_date && <span>(ends {new Date(promo.promo_end_date).toLocaleDateString()})</span>}
                </div>
              )}

              <div className="mt-3 text-xs text-muted-foreground">* Includes 13% HST and $299 finance fee</div>

              {/* Result */}
              <div className="mt-6 flex items-baseline gap-3">
                <span className="text-muted-foreground">Estimated {frequency === 'bi-weekly' ? 'Bi-weekly' : frequency === 'weekly' ? 'Weekly' : 'Monthly'}:</span>
                <span className="text-3xl font-bold text-foreground">${paymentCalculation.amount.toLocaleString()}</span>
              </div>
              {paymentCalculation.termPeriods && (
                <div className="mt-1 text-sm text-muted-foreground">
                  {paymentCalculation.termPeriods} {frequency === 'bi-weekly' ? 'bi-weekly' : frequency === 'weekly' ? 'weekly' : 'monthly'} payments
                </div>
              )}

              {/* CTAs */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button size="lg" className="flex-1" onClick={handleApplyForFinancing}>
                  Apply for Financing <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="flex-1" asChild>
                  <Link to="/">Build a Full Quote</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ─── 6. FAQ ─── */}
      <section className="py-14 px-4 bg-gradient-to-b from-stone-50 to-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold text-foreground mb-8 text-center">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border rounded-lg px-4">
                <AccordionTrigger className="text-left font-medium">{item.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ─── 7. Final CTA Bar ─── */}
      <section className="py-12 px-4 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <h2 className="text-2xl font-bold mb-1">Ready to Get Started?</h2>
            <p className="text-primary-foreground/80">Apply online or give us a call — we're here to help.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button size="lg" variant="secondary" onClick={handleApplyForFinancing}>
              Apply Now <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <a href="tel:+17057501414" className="inline-flex items-center gap-2 text-sm font-medium text-primary-foreground/90 hover:text-primary-foreground transition-colors">
              <Phone className="h-4 w-4" /> (705) 750-1414
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
