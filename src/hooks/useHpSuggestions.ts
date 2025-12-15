import { useMemo } from 'react';
import type { Motor } from '@/components/QuoteBuilder';

export interface HpSuggestion {
  hp: number;
  count: number;
  isExactMatch: boolean;
  inStockCount: number;
}

export function useHpSuggestions(query: string, motors: Motor[]): HpSuggestion[] {
  return useMemo(() => {
    const trimmedQuery = query.trim();
    
    // Only show suggestions for numeric input
    if (!trimmedQuery || !/^\d/.test(trimmedQuery)) {
      return [];
    }
    
    // Group motors by HP
    const hpGroups = new Map<number, { total: number; inStock: number }>();
    
    motors.forEach(motor => {
      const existing = hpGroups.get(motor.hp) || { total: 0, inStock: 0 };
      existing.total++;
      if (motor.in_stock) {
        existing.inStock++;
      }
      hpGroups.set(motor.hp, existing);
    });
    
    // Convert to suggestions and filter by query
    const queryNum = parseFloat(trimmedQuery);
    const suggestions: HpSuggestion[] = [];
    hpGroups.forEach((counts, hp) => {
      // Exact match
      const isExact = hp === queryNum;
      // Smart match: "9" matches "9.9" (integer typed, decimal HP)
      const isSmartMatch = Number.isInteger(queryNum) && Math.floor(hp) === queryNum && hp !== Math.floor(hp);
      
      if (isExact || isSmartMatch) {
        suggestions.push({
          hp,
          count: counts.total,
          isExactMatch: isExact,
          inStockCount: counts.inStock,
        });
      }
    });
    
    // Sort: exact matches first, then by HP ascending
    suggestions.sort((a, b) => {
      if (a.isExactMatch && !b.isExactMatch) return -1;
      if (!a.isExactMatch && b.isExactMatch) return 1;
      return a.hp - b.hp;
    });
    
    // Limit to top 8 suggestions
    return suggestions.slice(0, 8);
  }, [query, motors]);
}
