"use client";
import { useActivePromotions } from "@/hooks/useActivePromotions";

function daysLeft(end: string | null) {
  if (!end) return null;
  const now = new Date();
  const d = new Date(end);
  const diff = Math.ceil((d.getTime() - now.getTime()) / (1000*60*60*24));
  return diff < 0 ? 0 : diff;
}

export default function BonusOffersBadge() {
  const { getWarrantyPromotions } = useActivePromotions();
  const promos = getWarrantyPromotions?.() ?? [];
  if (!promos.length) return null;

  const p = promos[0]; // show first relevant warranty promo
  const left = daysLeft(p.end_date);

  return (
    <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50 p-4 text-emerald-900 shadow-sm dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <div className="text-sm font-semibold">Bonus Offers Included</div>
          <div className="text-sm">
            {p.bonus_title ?? p.name}
            {p.warranty_extra_years ? (
              <> • <span className="font-medium">+{p.warranty_extra_years} years warranty</span> at no cost</>
            ) : null}
          </div>
          {p.bonus_description ? (
            <div className="text-xs text-emerald-800/80 dark:text-emerald-200/80">{p.bonus_description}</div>
          ) : null}
        </div>
        {left !== null && (
          <div className="whitespace-nowrap text-xs font-semibold">
            Ends in {left} day{left === 1 ? "" : "s"}
          </div>
        )}
      </div>
    </div>
  );
}