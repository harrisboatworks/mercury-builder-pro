import { useState, useEffect } from 'react';
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

  return {
    promotions,
    loading,
    error,
    getTotalWarrantyBonusYears,
    getWarrantyPromotions
  };
}