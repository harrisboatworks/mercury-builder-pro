"use client";
import { money } from "@/lib/money";
import { calculateMonthlyPayment, getFinancingDisplay } from "@/lib/finance";
import { AnimatedPrice } from "@/components/ui/AnimatedPrice";

type HeroPriceProps = {
  yourPriceBeforeTax: number;   // after discounts/promos, before tax
  totalWithTax?: number;        // show smaller tax-included if provided
  discount: number;
  promoValue: number;
  showMonthly?: boolean;
  rate?: number;
  termMonths?: number;
};

export default function HeroPrice({
  yourPriceBeforeTax,
  totalWithTax,
  discount,
  promoValue,
  showMonthly = true,
  rate = 7.99,
  termMonths = 60,
}: HeroPriceProps) {
  const savings = (discount || 0) + (promoValue || 0);

  const { payment: monthly } = calculateMonthlyPayment(yourPriceBeforeTax, rate !== 7.99 ? rate : null);

  return (
    <section 
      aria-label="Your price summary" 
      className="rounded-2xl glass-card-primary p-5 premium-glow-hover animate-card-entrance"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Your Price</h2>
        <div className="flex flex-wrap items-end gap-x-3">
          <AnimatedPrice 
            value={yourPriceBeforeTax} 
            className="text-3xl font-semibold tracking-tight text-foreground"
            withGlow
            duration={0.8}
          />
          {totalWithTax != null && (
            <div className="text-sm text-slate-500">
              inc. tax: <span className="font-medium">{money(totalWithTax)}</span>
            </div>
          )}
        </div>

        <div className="mt-1 text-sm text-muted-foreground">
          MSRP − Dealer Savings − Promo Value
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span
            aria-live="polite"
            className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400 ring-1 ring-inset ring-emerald-200 dark:ring-emerald-800 premium-pulse"
          >
            You save <AnimatedPrice value={savings} className="ml-1" duration={0.6} />
          </span>

          {showMonthly && (
            <span className="text-sm text-slate-700">
              {getFinancingDisplay(yourPriceBeforeTax, rate !== 7.99 ? rate : null)}
              <span className="text-slate-500"> • OAC</span>
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
