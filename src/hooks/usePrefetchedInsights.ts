import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MotorContext {
  id?: string;
  hp: number;
  model: string;
  family?: string;
}

interface PrefetchedInsights {
  insights: string[];
  isLoading: boolean;
  error: string | null;
  motorContext: MotorContext | null;
}

// Session storage key for caching insights client-side
const INSIGHTS_CACHE_KEY = 'prefetched_motor_insights';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour client-side cache

interface CachedInsights {
  insights: string[];
  motorKey: string;
  timestamp: number;
}

function getCacheKey(motor: MotorContext): string {
  return `${motor.hp}-${motor.family || 'unknown'}-${motor.model}`.toLowerCase().replace(/\s+/g, '-');
}

function getClientCache(): CachedInsights | null {
  try {
    const cached = sessionStorage.getItem(INSIGHTS_CACHE_KEY);
    if (cached) {
      const parsed: CachedInsights = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
        return parsed;
      }
    }
  } catch {
    // Ignore cache errors
  }
  return null;
}

function setClientCache(insights: string[], motorKey: string): void {
  try {
    const cached: CachedInsights = {
      insights,
      motorKey,
      timestamp: Date.now()
    };
    sessionStorage.setItem(INSIGHTS_CACHE_KEY, JSON.stringify(cached));
  } catch {
    // Ignore cache errors
  }
}

/**
 * Hook to prefetch motor-specific insights from Perplexity.
 * Fetches 3-5 interesting facts about the motor being viewed.
 * Results are cached both server-side (24h) and client-side (1h).
 */
export function usePrefetchedInsights(motor: MotorContext | null): PrefetchedInsights {
  const [insights, setInsights] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [motorContext, setMotorContext] = useState<MotorContext | null>(null);
  
  // Track which motor we've already fetched to avoid duplicate calls
  const lastFetchedKey = useRef<string | null>(null);
  
  useEffect(() => {
    if (!motor || !motor.hp) {
      setInsights([]);
      setMotorContext(null);
      return;
    }
    
    const motorKey = getCacheKey(motor);
    
    // Skip if we've already fetched for this exact motor
    if (lastFetchedKey.current === motorKey) {
      return;
    }
    
    // Check client-side cache first
    const clientCache = getClientCache();
    if (clientCache && clientCache.motorKey === motorKey) {
      console.log('[usePrefetchedInsights] Client cache hit for', motorKey);
      setInsights(clientCache.insights);
      setMotorContext(motor);
      lastFetchedKey.current = motorKey;
      return;
    }
    
    // Fetch from server
    const fetchInsights = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('[usePrefetchedInsights] Fetching insights for', motorKey);
        
        const { data, error: fnError } = await supabase.functions.invoke('perplexity-prefetch', {
          body: { motor }
        });
        
        if (fnError) {
          console.error('[usePrefetchedInsights] Function error:', fnError);
          setError(fnError.message);
          return;
        }
        
        if (data?.success && data.insights?.length > 0) {
          console.log('[usePrefetchedInsights] Got', data.insights.length, 'insights');
          setInsights(data.insights);
          setMotorContext(motor);
          setClientCache(data.insights, motorKey);
          lastFetchedKey.current = motorKey;
        } else {
          console.log('[usePrefetchedInsights] No insights returned');
          setInsights([]);
        }
      } catch (err) {
        console.error('[usePrefetchedInsights] Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch insights');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInsights();
  }, [motor?.hp, motor?.model, motor?.family]);
  
  return { insights, isLoading, error, motorContext };
}

/**
 * Get a random insight from the prefetched list.
 * Useful for proactive "Did you know?" messages.
 */
export function getRandomInsight(insights: string[]): string | null {
  if (!insights || insights.length === 0) return null;
  return insights[Math.floor(Math.random() * insights.length)];
}

/**
 * Get the next insight in rotation, tracking which ones have been shown.
 */
export function useRotatingInsight(insights: string[], intervalMs: number = 30000) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentInsight, setCurrentInsight] = useState<string | null>(null);
  
  useEffect(() => {
    if (!insights || insights.length === 0) {
      setCurrentInsight(null);
      return;
    }
    
    setCurrentInsight(insights[currentIndex % insights.length]);
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % insights.length);
    }, intervalMs);
    
    return () => clearInterval(interval);
  }, [insights, intervalMs, currentIndex]);
  
  // Update insight when index changes
  useEffect(() => {
    if (insights && insights.length > 0) {
      setCurrentInsight(insights[currentIndex % insights.length]);
    }
  }, [currentIndex, insights]);
  
  return currentInsight;
}
