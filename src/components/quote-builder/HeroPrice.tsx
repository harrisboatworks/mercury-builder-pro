"use client";
import { money } from "@/lib/money";
import { calculateMonthly } from "@/lib/finance";
import { useEffect, useState } from "react";

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

  const [animSavings, setAnimSavings] = useState(0);
  useEffect(() => {
    const duration = 600;
    const start = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setAnimSavings(Math.round(savings * p));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [savings]);

  const monthly = calculateMonthly(yourPriceBeforeTax, rate, termMonths);

  return (
    <section aria-label="Your price summary" className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-col gap-1">
        <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Your Price</h2>
        <div className="flex flex-wrap items-end gap-x-3">
          <div className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{money(yourPriceBeforeTax)}</div>
          {totalWithTax != null && (
            <div className="text-sm text-slate-500 dark:text-slate-400">
              inc. tax: <span className="font-medium">{money(totalWithTax)}</span>
            </div>
          )}
        </div>

        <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          MSRP − Dealer Savings − Promo Value
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span
            aria-live="polite"
            className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-800"
          >
            You save {money(animSavings)}
          </span>

          {showMonthly && (
            <span className="text-sm text-slate-700 dark:text-slate-300">
              From <span className="font-semibold">{money(Math.round(monthly))}/mo</span>
              <span className="text-slate-500"> • 60 mo @ {rate}% OAC</span>
            </span>
          )}
        </div>
      </div>
    </section>
  );
}