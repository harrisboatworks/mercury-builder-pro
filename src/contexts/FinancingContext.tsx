import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ActiveFinancingPromo = {
  id: string;
  name: string;
  rate: number;
  promo_text?: string | null;
  promo_end_date?: string | null;
};

export type MonthlyPaymentInfo = {
  amount: number;
  rate: number;
  isPromoRate: boolean;
  termMonths: number;
};

interface FinancingContextType {
  promo: ActiveFinancingPromo | null;
  loading: boolean;
  error: string | null;
  calculateMonthlyPayment: (motorPrice: number, minimumThreshold?: number) => MonthlyPaymentInfo | null;
}

const FinancingContext = createContext<FinancingContextType | undefined>(undefined);

// Simple cache to prevent excessive API calls
let cachedPromo: ActiveFinancingPromo | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function FinancingProvider({ children }: { children: ReactNode }) {
  const [promo, setPromo] = useState<ActiveFinancingPromo | null>(cachedPromo);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const now = Date.now();
    
    // Use cached data if it's still fresh
    if (cachedPromo && (now - cacheTimestamp) < CACHE_DURATION) {
      setPromo(cachedPromo);
      return;
    }

    const fetchPromo = async () => {
      setLoading(true);
      setError(null);
      try {
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const { data, error } = await (supabase as any)
          .from('financing_options')
          .select('id, name, rate, promo_text, promo_end_date, is_promo, is_active')
          .eq('is_active', true)
          .eq('is_promo', true)
          .or(`promo_end_date.is.null,promo_end_date.gte.${today}`)
          .order('display_order', { ascending: true })
          .order('rate', { ascending: true })
          .limit(1);
        if (error) throw error;
        const first = (data || [])[0] as any | undefined;
        const promoData = first ? {
          id: first.id,
          name: first.name,
          rate: Number(first.rate),
          promo_text: first.promo_text ?? null,
          promo_end_date: first.promo_end_date ?? null,
        } : null;
        
        // Update cache
        cachedPromo = promoData;
        cacheTimestamp = now;
        setPromo(promoData);
      } catch (e: any) {
        setError(e?.message || 'Failed to load financing promo');
      } finally {
        setLoading(false);
      }
    };

    fetchPromo();
  }, []);

  const calculateMonthlyPayment = (motorPrice: number, minimumThreshold = 5000): MonthlyPaymentInfo | null => {
    // Only calculate for motors above threshold
    if (motorPrice <= minimumThreshold || motorPrice <= 0) {
      return null;
    }

    // Calculate price including HST (13% for Canada)
    const priceWithHST = motorPrice * 1.13;
    
    // Get smart financing term based on price
    const getFinancingTerm = (price: number): number => {
      if (price < 5000) return 36;
      if (price < 10000) return 48;
      if (price < 20000) return 60;
      return 120;
    };
    
    const termMonths = getFinancingTerm(priceWithHST);
    const promoRate = promo?.rate || null;
    const rate = promoRate || 7.99;
    
    const monthlyRate = rate / 100 / 12;
    const payment = priceWithHST * 
      (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
      (Math.pow(1 + monthlyRate, termMonths) - 1);
    
    return {
      amount: Math.round(payment),
      rate: rate,
      isPromoRate: !!promo,
      termMonths: termMonths
    };
  };

  return (
    <FinancingContext.Provider value={{ promo, loading, error, calculateMonthlyPayment }}>
      {children}
    </FinancingContext.Provider>
  );
}

export function useFinancing() {
  const context = useContext(FinancingContext);
  if (context === undefined) {
    throw new Error('useFinancing must be used within a FinancingProvider');
  }
  return context;
}