"use client";
import { useActivePromotions } from "@/hooks/useActivePromotions";

function daysLeft(end: string | null) {
  if (!end) return null;
  const now = new Date();
  const d = new Date(end);
  const diff = Math.ceil((d.getTime() - now.getTime()) / (1000*60*60*24));
  return diff < 0 ? 0 : diff;
}

export default function CurrentPromotions() {
  const { getWarrantyPromotions } = useActivePromotions();
  const promos = getWarrantyPromotions?.() ?? [];
  if (!promos.length) return null;

  const p = promos[0];
  const left = daysLeft(p.end_date);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            Current Promotions
          </div>
          <div className="text-base font-medium text-slate-900 dark:text-white">
            {p.bonus_title || p.name}
            {p.warranty_extra_years && (
              <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
                +{p.warranty_extra_years} years warranty included
              </span>
            )}
          </div>
          {p.bonus_description && (
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {p.bonus_description}
            </div>
          )}
        </div>
        {left !== null && (
          <div className="flex-shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-800">
            {left} day{left === 1 ? "" : "s"} left
          </div>
        )}
      </div>
    </div>
  );
}