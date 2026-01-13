import { useMemo } from 'react';

interface RebateRow {
  hp_min: number;
  hp_max: number;
  rebate: number;
}

interface ValidationResult {
  isValid: boolean;
  gaps: { from: number; to: number }[];
  uncoveredHPs: number[];
  warnings: string[];
}

/**
 * Validates a rebate matrix for gaps and coverage of catalog HP values.
 * Use this to ensure all motor HP values have a matching rebate tier.
 */
export function useRebateMatrixValidation(
  matrix: RebateRow[] | null | undefined,
  catalogHPs: number[] = []
): ValidationResult {
  return useMemo(() => {
    const gaps: { from: number; to: number }[] = [];
    const uncoveredHPs: number[] = [];
    
    if (!matrix || matrix.length === 0) {
      return {
        isValid: false,
        gaps: [],
        uncoveredHPs: catalogHPs,
        warnings: ['No rebate matrix defined'],
      };
    }
    
    // Sort matrix by hp_min to check for gaps
    const sorted = [...matrix].sort((a, b) => a.hp_min - b.hp_min);
    
    // Check for gaps between consecutive tiers
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];
      
      // Gap exists if next tier doesn't start immediately after current tier ends
      if (next.hp_min > current.hp_max + 1) {
        gaps.push({ 
          from: current.hp_max + 1, 
          to: next.hp_min - 1 
        });
      }
    }
    
    // Check which catalog HPs aren't covered by any tier
    catalogHPs.forEach(hp => {
      const covered = matrix.some(row => hp >= row.hp_min && hp <= row.hp_max);
      if (!covered) {
        uncoveredHPs.push(hp);
      }
    });
    
    // Generate human-readable warnings
    const warnings: string[] = [
      ...gaps.map(g => 
        g.from === g.to 
          ? `Gap in rebate matrix: ${g.from}HP has no rebate tier`
          : `Gap in rebate matrix: ${g.from}-${g.to}HP has no rebate tier`
      ),
      ...uncoveredHPs.map(hp => `Motor at ${hp}HP has no matching rebate tier`),
    ];
    
    return {
      isValid: gaps.length === 0 && uncoveredHPs.length === 0,
      gaps,
      uncoveredHPs,
      warnings,
    };
  }, [matrix, catalogHPs]);
}

/**
 * Standalone validation function for use outside React components
 */
export function validateRebateMatrix(
  matrix: RebateRow[] | null | undefined,
  catalogHPs: number[] = []
): ValidationResult {
  const gaps: { from: number; to: number }[] = [];
  const uncoveredHPs: number[] = [];
  
  if (!matrix || matrix.length === 0) {
    return {
      isValid: false,
      gaps: [],
      uncoveredHPs: catalogHPs,
      warnings: ['No rebate matrix defined'],
    };
  }
  
  const sorted = [...matrix].sort((a, b) => a.hp_min - b.hp_min);
  
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    
    if (next.hp_min > current.hp_max + 1) {
      gaps.push({ 
        from: current.hp_max + 1, 
        to: next.hp_min - 1 
      });
    }
  }
  
  catalogHPs.forEach(hp => {
    const covered = matrix.some(row => hp >= row.hp_min && hp <= row.hp_max);
    if (!covered) {
      uncoveredHPs.push(hp);
    }
  });
  
  const warnings: string[] = [
    ...gaps.map(g => 
      g.from === g.to 
        ? `Gap in rebate matrix: ${g.from}HP has no rebate tier`
        : `Gap in rebate matrix: ${g.from}-${g.to}HP has no rebate tier`
    ),
    ...uncoveredHPs.map(hp => `Motor at ${hp}HP has no matching rebate tier`),
  ];
  
  return {
    isValid: gaps.length === 0 && uncoveredHPs.length === 0,
    gaps,
    uncoveredHPs,
    warnings,
  };
}
