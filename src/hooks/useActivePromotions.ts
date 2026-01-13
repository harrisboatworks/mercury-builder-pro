import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PromoOption {
  id: string;
  title: string;
  description: string;
  icon?: string;
  rates?: Array<{ months: number; rate: number }>;
  minimum_amount?: number;
  matrix?: Array<{ hp_min: number; hp_max: number; rebate: number }>;
}

export interface ActivePromotion {
  id: string;
  name: string;
  discount_percentage: number;
  discount_fixed_amount: number;
  warranty_extra_years: number | null;
  bonus_title: string | null;
  bonus_description: string | null;
  end_date: string | null;
  promo_options?: {
    type: 'choose_one';
    options: PromoOption[];
  } | null;
}

// Simple in-memory cache
let cachedPromotions: ActivePromotion[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useActivePromotions() {
  const [promotions, setPromotions] = useState<ActivePromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPromotions() {
      try {
        // Check cache first
        const now = Date.now();
        if (cachedPromotions && (now - cacheTimestamp) < CACHE_DURATION) {
          setPromotions(cachedPromotions);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('promotions')
          .select(`
            id,
            name,
            discount_percentage,
            discount_fixed_amount,
            warranty_extra_years,
            bonus_title,
            bonus_description,
            end_date,
            promo_options
          `)
          .eq('is_active', true)
          .or('end_date.is.null,end_date.gte.now()')
          .order('priority', { ascending: false });

        if (error) {
          console.error('Error fetching active promotions:', error);
          setError('Failed to load promotions');
          return;
        }

        const activePromotions = data || [];
        
        // Update cache
        cachedPromotions = activePromotions;
        cacheTimestamp = now;
        
        setPromotions(activePromotions);
        setError(null);
      } catch (err) {
        console.error('Unexpected error fetching promotions:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchPromotions();
  }, []);

  // Helper function to get total warranty bonus years from all applicable promotions
  const getTotalWarrantyBonusYears = () => {
    return promotions.reduce((total, promo) => {
      return total + (promo.warranty_extra_years || 0);
    }, 0);
  };

  // Helper function to get promotions that include warranty bonuses
  const getWarrantyPromotions = () => {
    return promotions.filter(promo => promo.warranty_extra_years && promo.warranty_extra_years > 0);
  };

  // Helper function to calculate total dollar savings from all promotions
  const getTotalPromotionalSavings = (basePrice: number = 0) => {
    return promotions.reduce((total, promo) => {
      const fixedAmount = promo.discount_fixed_amount || 0;
      const percentAmount = promo.discount_percentage ? (basePrice * promo.discount_percentage / 100) : 0;
      return total + fixedAmount + percentAmount;
    }, 0);
  };

  // Helper function to get the "Choose One" promotion options
  const getChooseOneOptions = (): PromoOption[] => {
    const chooseOnePromo = promotions.find(p => p.promo_options?.type === 'choose_one');
    return chooseOnePromo?.promo_options?.options || [];
  };

  // Helper function to get rebate amount for a given HP
  // Includes fallback to nearest tier if exact match not found
  const getRebateForHP = (hp: number): number | null => {
    const options = getChooseOneOptions();
    const rebateOption = options.find(o => o.id === 'cash_rebate');
    if (!rebateOption?.matrix || rebateOption.matrix.length === 0) return null;
    
    // Try exact match first
    const exactMatch = rebateOption.matrix.find(row => hp >= row.hp_min && hp <= row.hp_max);
    if (exactMatch) return exactMatch.rebate;
    
    // Fallback: find nearest tier to prevent $0 rebate
    console.warn(`[Rebate Matrix] No exact match for ${hp}HP - finding nearest tier`);
    
    const sorted = [...rebateOption.matrix].sort((a, b) => {
      const distA = Math.min(Math.abs(hp - a.hp_min), Math.abs(hp - a.hp_max));
      const distB = Math.min(Math.abs(hp - b.hp_min), Math.abs(hp - b.hp_max));
      return distA - distB;
    });
    
    return sorted[0]?.rebate ?? null;
  };

  // Helper function to get special financing rates
  const getSpecialFinancingRates = () => {
    const options = getChooseOneOptions();
    const financingOption = options.find(o => o.id === 'special_financing');
    return financingOption?.rates || null;
  };

  return {
    promotions,
    loading,
    error,
    getTotalWarrantyBonusYears,
    getWarrantyPromotions,
    getTotalPromotionalSavings,
    getChooseOneOptions,
    getRebateForHP,
    getSpecialFinancingRates,
  };
}