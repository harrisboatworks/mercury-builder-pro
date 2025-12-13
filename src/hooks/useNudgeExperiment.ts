import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  selectVariant, 
  getDeviceType, 
  getExperimentSessionId,
  type VariantStats 
} from '@/lib/thompsonSampling';

export interface MessageVariant {
  id: string;
  message: string;
}

interface ExperimentResult {
  variantId: string;
  message: string;
  isGraduatedWinner: boolean;
  explorationMode: 'exploring' | 'exploiting' | 'graduated';
  trackImpression: (timeOnPage: number, scrollDepth: number) => Promise<string | null>;
  trackAccept: () => Promise<void>;
  trackDismiss: () => Promise<void>;
  trackAutoDismiss: () => Promise<void>;
  isReady: boolean;
}

export function useNudgeExperiment(
  pagePath: string,
  triggerType: string | null,
  variants: MessageVariant[]
): ExperimentResult {
  const [selectedVariant, setSelectedVariant] = useState<VariantStats | null>(null);
  const [explorationMode, setExplorationMode] = useState<'exploring' | 'exploiting' | 'graduated'>('exploring');
  const [isReady, setIsReady] = useState(false);
  const experimentIdRef = useRef<string | null>(null);
  const hasTrackedImpressionRef = useRef(false);

  // Fetch variant stats and select using Thompson Sampling
  useEffect(() => {
    if (!triggerType || variants.length === 0) {
      setIsReady(true);
      return;
    }

    const fetchAndSelect = async () => {
      try {
        // Fetch current stats from database
        const { data: stats } = await supabase
          .from('nudge_variant_stats')
          .select('*')
          .eq('page_path', pagePath)
          .eq('trigger_type', triggerType);

        // Build variant stats, merging DB data with config
        const variantStats: VariantStats[] = variants.map(v => {
          const dbStats = stats?.find(s => s.variant_id === v.id);
          return {
            variantId: v.id,
            message: v.message,
            impressions: dbStats?.impressions || 0,
            accepts: dbStats?.accepts || 0,
            isWinner: dbStats?.is_winner || false
          };
        });

        // Use Thompson Sampling to select variant
        const result = selectVariant(variantStats);
        setSelectedVariant(result.selectedVariant);
        setExplorationMode(result.explorationMode);
        setIsReady(true);
      } catch (error) {
        console.error('Error fetching variant stats:', error);
        // Fallback to random selection
        const randomIndex = Math.floor(Math.random() * variants.length);
        setSelectedVariant({
          variantId: variants[randomIndex].id,
          message: variants[randomIndex].message,
          impressions: 0,
          accepts: 0
        });
        setIsReady(true);
      }
    };

    fetchAndSelect();
  }, [pagePath, triggerType, variants]);

  // Track impression when nudge is shown
  const trackImpression = useCallback(async (timeOnPage: number, scrollDepth: number): Promise<string | null> => {
    if (!selectedVariant || !triggerType || hasTrackedImpressionRef.current) return null;

    hasTrackedImpressionRef.current = true;
    const sessionId = getExperimentSessionId();
    const deviceType = getDeviceType();

    try {
      const { data, error } = await supabase
        .from('nudge_experiments')
        .insert({
          session_id: sessionId,
          page_path: pagePath,
          trigger_type: triggerType,
          variant_id: selectedVariant.variantId,
          message_text: selectedVariant.message,
          time_on_page_seconds: timeOnPage,
          scroll_depth_percent: Math.round(scrollDepth),
          device_type: deviceType
        })
        .select('id')
        .single();

      if (error) throw error;
      experimentIdRef.current = data?.id || null;
      return experimentIdRef.current;
    } catch (error) {
      console.error('Error tracking impression:', error);
      return null;
    }
  }, [selectedVariant, triggerType, pagePath]);

  // Track when user clicks "Chat Now"
  const trackAccept = useCallback(async () => {
    if (!experimentIdRef.current) return;

    try {
      await supabase
        .from('nudge_experiments')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', experimentIdRef.current);
    } catch (error) {
      console.error('Error tracking accept:', error);
    }
  }, []);

  // Track when user clicks "Not now" or X
  const trackDismiss = useCallback(async () => {
    if (!experimentIdRef.current) return;

    try {
      await supabase
        .from('nudge_experiments')
        .update({ dismissed_at: new Date().toISOString() })
        .eq('id', experimentIdRef.current);
    } catch (error) {
      console.error('Error tracking dismiss:', error);
    }
  }, []);

  // Track when timer expires
  const trackAutoDismiss = useCallback(async () => {
    if (!experimentIdRef.current) return;

    try {
      await supabase
        .from('nudge_experiments')
        .update({ auto_dismissed_at: new Date().toISOString() })
        .eq('id', experimentIdRef.current);
    } catch (error) {
      console.error('Error tracking auto-dismiss:', error);
    }
  }, []);

  // Reset tracking when trigger type changes
  useEffect(() => {
    hasTrackedImpressionRef.current = false;
    experimentIdRef.current = null;
  }, [triggerType]);

  // Defensive fallback for empty variants
  const safeVariants = Array.isArray(variants) && variants.length > 0 ? variants : [{ id: 'default', message: '' }];
  
  return {
    variantId: selectedVariant?.variantId || safeVariants[0]?.id || 'A',
    message: selectedVariant?.message || safeVariants[0]?.message || '',
    isGraduatedWinner: explorationMode === 'graduated',
    explorationMode,
    trackImpression,
    trackAccept,
    trackDismiss,
    trackAutoDismiss,
    isReady
  };
}
