import React from "react";

interface HpRange {
  id: string;
  label: string;
  min: number;
  max: number;
}

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  hpRanges: HpRange[];
  selectedRange: string;
  onRangeChange: (value: string) => void;
  inStockOnly: boolean;
  onToggleStock: () => void;
  search: string;
  onSearchChange: (s: string) => void;
  onApply: () => void;
  onClear: () => void;
}

export default function FilterDrawer({
  open,
  onClose,
  hpRanges,
  selectedRange,
  onRangeChange,
  inStockOnly,
  onToggleStock,
  search,
  onSearchChange,
  onApply,
  onClear,
}: FilterDrawerProps) {
  if (!open) return null;
  
  return (
    <div className="filter-drawer fixed inset-0 z-50">
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm" 
        onClick={onClose} 
      />
      <aside className="sticky-bottom-safe absolute bottom-0 left-0 right-0 mx-auto w-full max-w-xl rounded-t-2xl border border-border bg-card p-4 shadow-2xl">
        <div className="mx-auto h-1.5 w-10 rounded-full bg-border" />
        
        <div className="mt-3 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Filter Motors</h3>
          
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search motors…"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          
          <div>
            <div className="mb-2 text-sm font-semibold text-foreground">Power Range</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {hpRanges.map((range) => (
                <button
                  key={range.id}
                  className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                    selectedRange === range.id 
                      ? "border-primary bg-primary/10 text-primary" 
                      : "border-border text-foreground hover:bg-accent"
                  }`}
                  onClick={() => onRangeChange(range.id)}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
          
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input 
              type="checkbox" 
              checked={inStockOnly} 
              onChange={onToggleStock}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            In stock only
          </label>
          
          <div className="flex items-center justify-end gap-2 pt-2">
            <button 
              onClick={onClear} 
              className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-accent"
            >
              Clear
            </button>
            <button 
              onClick={onApply} 
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Apply
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}