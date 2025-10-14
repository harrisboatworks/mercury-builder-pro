import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ActivePromotion {
  id: string;
  name: string;
  discount_percentage: number;
  discount_fixed_amount: number;
  warranty_extra_years: number | null;
  bonus_title: string | null;
  bonus_description: string | null;
  end_date: string | null;
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
            end_date
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

  // Memoize helper functions to prevent recreation on every render
  const getTotalWarrantyBonusYears = useMemo(() => () => {
    return promotions.reduce((total, promo) => {
      return total + (promo.warranty_extra_years || 0);
    }, 0);
  }, [promotions]);

  const getWarrantyPromotions = useMemo(() => () => {
    return promotions.filter(promo => promo.warranty_extra_years && promo.warranty_extra_years > 0);
  }, [promotions]);

  const getTotalPromotionalSavings = useMemo(() => (basePrice: number = 0) => {
    return promotions.reduce((total, promo) => {
      const fixedAmount = promo.discount_fixed_amount || 0;
      const percentAmount = promo.discount_percentage ? (basePrice * promo.discount_percentage / 100) : 0;
      return total + fixedAmount + percentAmount;
    }, 0);
  }, [promotions]);

  // Memoize the return object to maintain stable references
  return useMemo(() => ({
    promotions,
    loading,
    error,
    getTotalWarrantyBonusYears,
    getWarrantyPromotions,
    getTotalPromotionalSavings
  }), [promotions, loading, error, getTotalWarrantyBonusYears, getWarrantyPromotions, getTotalPromotionalSavings]);
}