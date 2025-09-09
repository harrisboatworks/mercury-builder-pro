"use client";

interface PremiumChoiceCardProps {
  title: string;
  subtitle?: string;
  img?: string | null;
  selected?: boolean;
  onSelect: () => void;
  recommended?: boolean;
}

export default function PremiumChoiceCard({ 
  title, 
  subtitle, 
  img, 
  selected, 
  onSelect, 
  recommended 
}: PremiumChoiceCardProps) {
  return (
    <button 
      onClick={onSelect} 
      aria-pressed={selected}
      className={`p-fade text-left rounded-2xl border p-3 transition-all ${
        selected 
          ? "border-blue-600 ring-2 ring-blue-600/15" 
          : "border-slate-200 dark:border-slate-700"
      }`}
    >
      {img ? (
        <img 
          src={img} 
          alt="" 
          className="mb-3 h-40 w-full rounded-lg object-cover" 
        />
      ) : null}
      <div className="flex items-center gap-2">
        <div className="text-[15px] font-semibold text-slate-900 dark:text-white">
          {title}
        </div>
        {recommended ? (
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-800">
            Recommended
          </span>
        ) : null}
      </div>
      {subtitle && (
        <div className="mt-0.5 text-sm p-quiet">{subtitle}</div>
      )}
    </button>
  );
}