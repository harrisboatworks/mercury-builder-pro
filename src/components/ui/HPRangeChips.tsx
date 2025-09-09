"use client";

interface HPRangeChipsProps {
  selectedRange: string;
  onRangeChange: (range: string) => void;
}

const hpRanges = [
  { id: 'all', label: 'All', min: 0, max: 1000 },
  { id: '2.5-20', label: '2.5–20', min: 2.5, max: 20 },
  { id: '25-60', label: '25–60', min: 25, max: 60 },
  { id: '75-150', label: '75–150', min: 75, max: 150 },
  { id: '175-300', label: '175–300', min: 175, max: 300 },
  { id: '350+', label: '350+', min: 350, max: 1000 }
];

export default function HPRangeChips({ selectedRange, onRangeChange }: HPRangeChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {hpRanges.map((range) => (
        <button
          key={range.id}
          onClick={() => onRangeChange(range.id)}
          className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
            selectedRange === range.id
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
          }`}
        >
          {range.label} HP
        </button>
      ))}
    </div>
  );
}

export { hpRanges };