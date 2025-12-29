import { ChevronDown, ArrowUpDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'hp-asc' | 'hp-desc' | 'stock';

interface SortDropdownProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
  className?: string;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
  { value: 'hp-asc', label: 'HP: Low → High' },
  { value: 'hp-desc', label: 'HP: High → Low' },
  { value: 'stock', label: 'In Stock First' },
];

export function SortDropdown({ value, onChange, className }: SortDropdownProps) {
  const currentLabel = SORT_OPTIONS.find(o => o.value === value)?.label || 'Sort';
  
  return (
    <Select value={value} onValueChange={(v) => onChange(v as SortOption)}>
      <SelectTrigger 
        className={cn(
          'h-9 w-auto min-w-[120px] gap-1.5 bg-background border-border/50',
          'text-sm font-light rounded-full px-3',
          'hover:bg-muted/50 transition-colors',
          className
        )}
      >
        <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <SelectValue placeholder="Sort">
          <span className="truncate">{currentLabel}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent 
        align="end" 
        className="bg-background border-border shadow-lg z-50"
      >
        {SORT_OPTIONS.map((option) => (
          <SelectItem 
            key={option.value} 
            value={option.value}
            className="text-sm"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
