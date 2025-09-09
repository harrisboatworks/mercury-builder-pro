"use client";
import { money } from "@/lib/money";

interface RightSummaryProps {
  priceBeforeTax: number;
  totalWithTax: number;
  bullets: string[];
  onReserve: () => void;
  monthly?: number;
}

export default function RightSummary({ 
  priceBeforeTax, 
  totalWithTax, 
  bullets, 
  onReserve, 
  monthly 
}: RightSummaryProps) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.12em] p-quiet">
        Your build
      </div>
      <div className="mt-2 text-[28px] font-semibold text-slate-900 dark:text-white">
        {money(totalWithTax)}
      </div>
      {typeof monthly === "number" && (
        <div className="text-sm p-quiet">
          Approx {money(Math.round(monthly))}/mo OAC
        </div>
      )}
      <ul className="mt-3 space-y-1 text-sm text-slate-700 dark:text-slate-300">
        {bullets.map((b, i) => (
          <li key={i}>• {b}</li>
        ))}
      </ul>
      <button 
        onClick={onReserve} 
        className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-3 text-white shadow-sm transition hover:scale-[1.01] hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        Reserve
      </button>
      <div className="mt-2 text-xs p-quiet">
        Fully refundable deposit.
      </div>
    </div>
  );
}