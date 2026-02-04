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
}

async function fetchTradeValuationData(): Promise<TradeValuationData> {
  const [bracketsResult, configResult] = await Promise.all([
    supabase.from('trade_valuation_brackets').select('*'),
    supabase.from('trade_valuation_config').select('*')
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

  return {
    brackets: bracketsResult.data || [],
    config: configMap
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
