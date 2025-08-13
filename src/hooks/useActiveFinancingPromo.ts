// src/hooks/useActiveFinancingPromo.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ActiveFinancingPromo = {
  id: string;
  name: string;
  rate: number;
  promo_text?: string | null;
  promo_end_date?: string | null;
};

export function useActiveFinancingPromo() {
  const [promo, setPromo] = useState<ActiveFinancingPromo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
        if (first) {
          setPromo({
            id: first.id,
            name: first.name,
            rate: Number(first.rate),
            promo_text: first.promo_text ?? null,
            promo_end_date: first.promo_end_date ?? null,
          });
        } else {
          setPromo(null);
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load financing promo');
      } finally {
        setLoading(false);
      }
    };

    fetchPromo();
  }, []);

  return { promo, loading, error } as const;
}
