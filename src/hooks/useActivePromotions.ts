import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  getFirstPromotionRebateForHP,
  getTotalPromotionDiscount,
} from '@/lib/promotion-discounts';

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

export function useActivePromotions(options?: { forceRefresh?: boolean }) {
  const forceRefresh = options?.forceRefresh ?? false;
  const [promotions, setPromotions] = useState<ActivePromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPromotions() {
      try {
        // Check cache first (skipped when forceRefresh is true)
        const now = Date.now();
        if (!forceRefresh && cachedPromotions && (now - cacheTimestamp) < CACHE_DURATION) {
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
  }, [forceRefresh]);

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

  // Legacy helper for callers that do not yet have a motor HP. Matrix promos
  // intentionally contribute $0 until eligibility can be resolved.
  const getTotalPromotionalSavings = (basePrice: number = 0) => {
    return getTotalPromotionDiscount(promotions, { basePrice });
  };

  // Canonical quote calculation: resolves both HP matrices and legacy promo
  // discounts through one production helper.
  const getPromotionSavingsForMotor = (hp: number, basePrice: number = 0) => {
    return getTotalPromotionDiscount(promotions, {
      basePrice,
      horsepower: hp,
    });
  };

  // Helper function to get the "Choose One" promotion options
  const getChooseOneOptions = (): PromoOption[] => {
    const chooseOnePromo = promotions.find(p => p.promo_options?.type === 'choose_one');
    return chooseOnePromo?.promo_options?.options || [];
  };

  // Helper function to get rebate amount for a given HP.
  // Only explicit matrix ranges are eligible; gaps/out-of-range values do not
  // inherit the nearest tier.
  const getRebateForHP = (hp: number): number | null => {
    return getFirstPromotionRebateForHP(promotions, hp);
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
    getPromotionSavingsForMotor,
    getChooseOneOptions,
    getRebateForHP,
    getSpecialFinancingRates,
  };
}
