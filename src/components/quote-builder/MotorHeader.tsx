"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  name: string;             // e.g., "Mercury FourStroke 25HP EFI"
  modelYear?: number;       // e.g., 2025
  hp?: number;              // 25
  sku?: string | null;
  imageUrl?: string | null;
  specs?: Array<{ label: string; value: string }>;
  why?: string[];           // 2–3 bullets
  specSheetUrl?: string | null;
  onBack?: () => void;      // Optional back navigation
};

export default function MotorHeader({
  name,
  modelYear,
  hp,
  sku,
  imageUrl,
  specs = [],
  why = [],
  specSheetUrl,
  onBack,
}: Props) {
  return (
    <section className="mb-6 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start gap-4">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-9 w-9 flex-shrink-0"
            aria-label="Back to motor selection"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        {imageUrl ? (
          <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
            <img src={imageUrl} alt={name} className="h-full w-full object-contain" />
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <h1 className="text-xl lg:text-2xl font-bold leading-tight text-slate-900 dark:text-white mb-1">
            {name}
            {modelYear ? <span className="ml-2 text-base lg:text-lg text-slate-500 dark:text-slate-400 font-normal">({modelYear})</span> : null}
          </h1>
          <div className="mt-2 flex flex-wrap gap-2">
            {specs.map((s, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-700 dark:border-slate-700 dark:text-slate-300"
                title={s.label}
              >
                <span className="mr-1 font-medium">{s.label}:</span> {s.value}
              </span>
            ))}
            {sku ? (
              <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-xs text-slate-600 ring-1 ring-inset ring-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:ring-slate-700">
                SKU: {sku}
              </span>
            ) : null}
          </div>

          {why.length ? (
            <ul className="mt-4 space-y-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {why.slice(0, 3).map((w, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <svg 
                    className="h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {specSheetUrl ? (
            <div className="mt-3">
              <a
                href={specSheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary hover:underline"
              >
                View spec sheet (PDF)
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}