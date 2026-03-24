import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TradeValuationBracket {
  id: string;
  brand: string;
  year_range: string;
  horsepower: number;
  excellent: number;
  good: number;
  fair: number;
  poor: number;
}

export interface TradeValuationConfig {
  key: string;
  value: Record<string, number>;
  description: string | null;
}

export interface TradeValuationData {
  brackets: TradeValuationBracket[];
  config: Record<string, Record<string, number>>;
  /** HP-to-MSRP lookup for Mercury motors (enables MSRP-based valuation) */
  referenceMsrps: Record<number, number>;
}

async function fetchTradeValuationData(): Promise<TradeValuationData> {
  const [bracketsResult, configResult, msrpResult] = await Promise.all([
    supabase.from('trade_valuation_brackets').select('*'),
    supabase.from('trade_valuation_config').select('*'),
    supabase.from('motor_models')
      .select('horsepower, msrp')
      .eq('make', 'Mercury')
      .eq('is_brochure', true)
      .not('msrp', 'is', null)
      .not('horsepower', 'is', null)
  ]);

  if (bracketsResult.error) {
    console.warn('Failed to fetch trade valuation brackets:', bracketsResult.error);
    throw bracketsResult.error;
  }

  if (configResult.error) {
    console.warn('Failed to fetch trade valuation config:', configResult.error);
    throw configResult.error;
  }

  // Transform config array into a keyed object for easy lookup
  const configMap: Record<string, Record<string, number>> = {};
  for (const item of configResult.data || []) {
    configMap[item.key] = item.value as Record<string, number>;
  }

  // Build HP-to-MSRP lookup from Mercury motor_models using median MSRP per HP class
  const msrpsByHp: Record<number, number[]> = {};
  const referenceMsrps: Record<number, number> = {};
  for (const motor of msrpResult.data || []) {
    if (motor.horsepower && motor.msrp) {
      // Collect all MSRPs for each HP class to compute median
      const hp = Number(motor.horsepower);
      const msrp = Number(motor.msrp);
      if (!msrpsByHp[hp]) msrpsByHp[hp] = [];
      msrpsByHp[hp].push(msrp);
    }
  }

  // Compute median MSRP for each HP class
  for (const [hpStr, msrps] of Object.entries(msrpsByHp)) {
    const sorted = [...msrps].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    referenceMsrps[Number(hpStr)] = sorted.length % 2 === 0
      ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
      : sorted[mid];
  }

  return {
    brackets: bracketsResult.data || [],
    config: configMap,
    referenceMsrps
  };
}

/**
 * Hook to fetch and cache trade valuation data from Supabase.
 * Data is cached for 1 hour with stale-while-revalidate.
 * Falls back gracefully if the database is unreachable.
 */
export function useTradeValuationData() {
  return useQuery({
    queryKey: ['trade-valuation-data'],
    queryFn: fetchTradeValuationData,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours cache
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Helper to convert database brackets into the format expected by estimateTradeValue
 */
export function convertBracketsToTradeValues(brackets: TradeValuationBracket[]): Record<string, Record<string, Record<string, { excellent: number; good: number; fair: number; poor: number }>>> {
  const result: Record<string, Record<string, Record<string, { excellent: number; good: number; fair: number; poor: number }>>> = {};
  
  for (const bracket of brackets) {
    if (!result[bracket.brand]) {
      result[bracket.brand] = {};
    }
    if (!result[bracket.brand][bracket.year_range]) {
      result[bracket.brand][bracket.year_range] = {};
    }
    result[bracket.brand][bracket.year_range][bracket.horsepower.toString()] = {
      excellent: Number(bracket.excellent),
      good: Number(bracket.good),
      fair: Number(bracket.fair),
      poor: Number(bracket.poor)
    };
  }
  
  return result;
}
