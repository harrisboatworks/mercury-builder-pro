"use client";
import { useState, useEffect } from 'react';
import { money } from "@/lib/money";
import { Download, CreditCard, Bookmark } from "lucide-react";
import { PaymentMethodBadges } from "@/components/payments/PaymentMethodBadges";
import { useAuth } from '@/components/auth/AuthProvider';

type StickySummaryProps = {
  packageLabel: string;
  yourPriceBeforeTax: number;
  totalWithTax?: number;
  totalSavings: number;
  monthly?: number;
  bullets?: string[];
  onReserve: () => void;
  onReview?: () => void;
  callHref: string;
  smsHref: string;
  quoteReference: string | null;
  onCall: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  onText: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  depositAmount?: number;
  coverageYears?: number;
  promoWarrantyYears?: number;
  onDownloadPDF?: () => void;
  onSaveForLater?: () => void;
  onApplyForFinancing?: () => void;
  isGeneratingPDF?: boolean;
  reserveDisabled?: boolean;
  // Payment processing prop
  isProcessingPayment?: boolean;
  // Quote expiry
  quoteValidUntil?: Date;
};

export default function StickySummary({
  packageLabel,
  yourPriceBeforeTax,
  totalWithTax,
  totalSavings,
  monthly,
  bullets = [],
  onReserve,
  onReview,
  callHref,
  smsHref,
  quoteReference,
  onCall,
  onText,
  depositAmount = 200,
  coverageYears,
  promoWarrantyYears,
  onDownloadPDF,
  onSaveForLater,
  onApplyForFinancing,
  isGeneratingPDF = false,
  reserveDisabled = false,
  // Payment processing prop
  isProcessingPayment = false,
  // Quote expiry
  quoteValidUntil,
}: StickySummaryProps) {
  const { user } = useAuth();
  const [showPulse, setShowPulse] = useState(false);

  // Trigger pulse animation after a delay
  useEffect(() => {
    const timer = setTimeout(() => setShowPulse(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Desktop sticky card */}
      <aside
        aria-label="Summary"
        className="sticky top-24 hidden h-fit rounded-[12px] border border-repower-navy-900/10 bg-[#F5F1EA] p-8 lg:block"
      >
        <div className="font-sans text-[12px] font-semibold uppercase tracking-[0.14em] text-repower-mercury-red">
          TOTAL
        </div>

        <div className="mt-3 font-display font-bold text-repower-navy-900 leading-none tracking-[-0.03em]" style={{ fontSize: '48px' }}>
          {money(totalWithTax ?? yourPriceBeforeTax)}
        </div>
        {totalWithTax != null && (
          <div className="mt-2 font-sans text-[13px] text-repower-navy-900/55">
            Before tax: {money(yourPriceBeforeTax)}
          </div>
        )}

        <div className="my-5 h-px w-full bg-repower-navy-900/10" aria-hidden />

        <div className="font-sans text-[14px] text-repower-navy-900/70">
          {monthly != null && (
            <>From <span className="font-display font-semibold text-repower-gold tabular-nums">{money(Math.round(monthly))}/mo</span> · </>
          )}
          You save <span className="font-display font-semibold text-repower-navy-900 tabular-nums">{money(totalSavings)}</span>
        </div>

        <div className="mt-2 font-sans text-[12px] uppercase tracking-[0.12em] text-repower-navy-900/55">
          {packageLabel}
        </div>

        {typeof coverageYears === "number" && (
          <div className="mt-2 font-sans text-[14px] text-repower-navy-900/70">
            Mercury coverage: <span className="font-medium text-repower-navy-900">{coverageYears} years total</span>
          </div>
        )}
        {promoWarrantyYears ? (
          <div className="mt-1 font-sans text-[12px] text-repower-mercury-red">
            Includes +{promoWarrantyYears} yrs promo warranty
          </div>
        ) : null}

        {quoteValidUntil && (
          <div className="mt-2 text-xs text-muted-foreground">
            {(() => {
              const now = new Date();
              const diffDays = Math.ceil((quoteValidUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              const formatted = quoteValidUntil.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
              if (diffDays <= 0) return <span className="text-destructive font-medium">Quote pricing has expired</span>;
              if (diffDays <= 7) return <span className="text-repower-mercury-red font-medium">Pricing expires in {diffDays} day{diffDays !== 1 ? 's' : ''}, {formatted}</span>;
              return <>Pricing valid until {formatted}</>;
            })()}
          </div>
        )}

        <ul className="mt-4 space-y-1.5 font-sans text-[14px] text-repower-navy-900/70">
          {bullets.slice(0, 3).map((b, i) => (
            <li key={i} className="flex items-start gap-2">
              <span aria-hidden className="mt-1.5 h-1 w-1 rounded-full bg-repower-navy-900/40 flex-shrink-0" />
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <div className="my-5 h-px w-full bg-repower-navy-900/10" aria-hidden />

        <div className="space-y-3">
          <div className="pb-1 text-center font-sans">
            <p className="text-[13px] font-semibold text-repower-navy-900">Questions about this quote? Talk to a person.</p>
            {quoteReference && (
              <p className="mt-1 select-text text-[12px] text-repower-navy-900/60">Quote {quoteReference}</p>
            )}
          </div>
          <a
            href={callHref}
            onClick={onCall}
            data-cta-location="quote_summary"
            className="group flex w-full items-center justify-center rounded bg-repower-mercury-red px-6 py-4 text-center font-sans text-[13px] font-bold uppercase tracking-[0.12em] text-repower-cream transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-repower-mercury-red"
          >
            <span className="inline-flex items-center justify-center gap-2">
              Call (905) 342-2153
              <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">→</span>
            </span>
          </a>
          <a
            href={smsHref}
            onClick={onText}
            data-cta-location="quote_summary"
            className="group flex w-full items-center justify-center rounded border border-repower-navy-900 bg-transparent px-6 py-4 text-center font-sans text-[13px] font-bold uppercase tracking-[0.12em] text-repower-navy-900 transition hover:bg-repower-navy-900 hover:text-repower-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-repower-gold/40"
          >
            <span className="inline-flex items-center justify-center gap-2">
              Text This Quote to HBW
              <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">→</span>
            </span>
          </a>

          {onReview && (
            <button
              onClick={onReview}
              className="group w-full rounded border border-repower-navy-900 bg-transparent px-6 py-4 font-sans text-[13px] font-bold uppercase tracking-[0.12em] text-repower-navy-900 transition hover:bg-repower-navy-900 hover:text-repower-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-repower-gold/40"
            >
              <span className="inline-flex items-center justify-center gap-2">
                Have HBW Review My Quote
                <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">→</span>
              </span>
            </button>
          )}

          <div className="flex items-center gap-3 py-1" aria-hidden>
            <span className="h-px flex-1 bg-repower-navy-900/10" />
            <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-repower-navy-900/45">
              Ready to lock it in?
            </span>
            <span className="h-px flex-1 bg-repower-navy-900/10" />
          </div>
          <button
            onClick={onReserve}
            disabled={isProcessingPayment || reserveDisabled}
            title={reserveDisabled ? 'Reservation terms could not be verified' : undefined}
            className={`group w-full rounded border border-repower-navy-900 bg-transparent px-6 py-4 text-center font-sans text-[13px] font-bold uppercase tracking-[0.12em] text-repower-navy-900 transition hover:bg-repower-navy-900 hover:text-repower-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-repower-gold/40 disabled:cursor-not-allowed disabled:opacity-50 ${showPulse && !isProcessingPayment && !reserveDisabled ? 'premium-pulse' : ''}`}
          >
            <span className="inline-flex items-center justify-center gap-2">
              {isProcessingPayment
                ? 'Processing...'
                : `Reserve this motor, ${money(depositAmount)}`
              }
              {!isProcessingPayment && (
                <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">→</span>
              )}
            </span>
          </button>
          <p className="px-1 text-center font-sans text-[12px] leading-relaxed text-repower-navy-900/60">
            Secure Stripe checkout. HBW confirms details before ordering.
          </p>

          {onSaveForLater && (
            <button
              onClick={onSaveForLater}
              className="w-full rounded border border-repower-navy-900/15 bg-transparent px-6 py-4 font-sans text-[13px] font-bold uppercase tracking-[0.12em] text-repower-navy-900 transition hover:border-repower-navy-900/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-repower-gold/40"
            >
              <span className="inline-flex items-center justify-center gap-2">
                <Bookmark className="w-4 h-4" />
                {user ? 'Save Quote' : 'Save My Quote'}
              </span>
            </button>
          )}

          {onDownloadPDF && (
            <button
              onClick={onDownloadPDF}
              disabled={isGeneratingPDF}
              className="w-full rounded border border-repower-navy-900/15 bg-transparent px-6 py-4 font-sans text-[13px] font-bold uppercase tracking-[0.12em] text-repower-navy-900 transition hover:border-repower-navy-900/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-repower-gold/40 disabled:opacity-50"
            >
              <span className="inline-flex items-center justify-center gap-2">
                <Download className="w-4 h-4" />
                {isGeneratingPDF ? 'Generating PDF...' : 'Download PDF Quote'}
              </span>
            </button>
          )}

          {onApplyForFinancing && (
            <button
              onClick={onApplyForFinancing}
              className="w-full rounded border border-repower-navy-900/15 bg-transparent px-6 py-4 font-sans text-[13px] font-bold uppercase tracking-[0.12em] text-repower-navy-900 transition hover:border-repower-navy-900/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-repower-gold/40"
            >
              <span className="inline-flex items-center justify-center gap-2">
                <CreditCard className="w-4 h-4" />
                Apply for Financing
              </span>
            </button>
          )}

          <PaymentMethodBadges className="mt-2" />
        </div>
      </aside>
    </>
  );
}
