import { useEffect, useRef, useCallback } from 'react';
import { useQuote } from '@/contexts/QuoteContext';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'react-router-dom';

const SESSION_KEY = 'quote_activity_session_id';
const UTM_KEY = 'quote_activity_utm';
const DEBOUNCE_MS = 2000;

function getOrCreateSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      const arr = new Uint8Array(12);
      crypto.getRandomValues(arr);
      id = `qa_${Array.from(arr, b => b.toString(16).padStart(2, '0')).join('')}`;
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `qa_fallback_${Date.now()}`;
  }
}

interface UtmParams {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  referrer: string | null;
}

/** Capture UTM params from URL on first visit, persist in sessionStorage */
function captureUtmParams(): UtmParams {
  try {
    const cached = sessionStorage.getItem(UTM_KEY);
    if (cached) return JSON.parse(cached);
  } catch { /* ignore */ }

  const params = new URLSearchParams(window.location.search);
  const utm: UtmParams = {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
    utm_term: params.get('utm_term'),
    utm_content: params.get('utm_content'),
    referrer: document.referrer || null,
  };

  try { sessionStorage.setItem(UTM_KEY, JSON.stringify(utm)); } catch { /* ignore */ }
  return utm;
}

type EventType =
  | 'motor_selected'
  | 'options_configured'
  | 'purchase_path_chosen'
  | 'trade_in_entered'
  | 'financing_calculated'
  | 'quote_abandoned';

interface PendingEvent {
  event_type: EventType;
  motor_model: string | null;
  motor_hp: number | null;
  quote_value: number | null;
  event_data: Record<string, unknown>;
  page_path: string;
}

/**
 * Silently tracks anonymous quote-building activity in the background.
 * Watches QuoteContext state and fires debounced events to Supabase.
 */
export function useQuoteActivityTracker() {
  const { state } = useQuote();
  const { user } = useAuth();
  const location = useLocation();

  const sessionId = useRef(getOrCreateSessionId());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flushing = useRef(false);

  // Track previous values to detect meaningful changes
  const prevMotorId = useRef<string | null>(null);
  const prevOptionsCount = useRef(0);
  const prevPurchasePath = useRef<string | null>(null);
  const prevHasTradeIn = useRef(false);
  const prevFinancingTerm = useRef(0);
  const hasActiveQuote = useRef(false);

  const utmParams = useRef(captureUtmParams());

  const flush = useCallback(async (event: PendingEvent) => {
    if (flushing.current) return;
    flushing.current = true;
    try {
      const utm = utmParams.current;
      await (supabase as any).from('quote_activity_events').insert({
        session_id: sessionId.current,
        user_id: user?.id ?? null,
        event_type: event.event_type,
        motor_model: event.motor_model,
        motor_hp: event.motor_hp,
        quote_value: event.quote_value,
        event_data: event.event_data,
        page_path: event.page_path,
        utm_source: utm.utm_source,
        utm_medium: utm.utm_medium,
        utm_campaign: utm.utm_campaign,
        utm_term: utm.utm_term,
        utm_content: utm.utm_content,
        referrer: utm.referrer,
      });
    } catch {
      // Silently fail — analytics should never break the app
    } finally {
      flushing.current = false;
    }
  }, [user?.id]);

  const scheduleFlush = useCallback((event: PendingEvent) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => flush(event), DEBOUNCE_MS);
  }, [flush]);

  // Helper to get current motor info
  const getMotorInfo = useCallback(() => {
    const m = state.motor;
    if (!m) return { model: null, hp: null, price: null };
    return {
      model: m.model || null,
      hp: m.hp ?? null,
      price: m.price ?? null,
    };
  }, [state.motor]);

  // Detect motor selection
  useEffect(() => {
    if (state.isLoading) return;
    const motorId = state.motor?.id ?? null;
    if (motorId && motorId !== prevMotorId.current) {
      prevMotorId.current = motorId;
      hasActiveQuote.current = true;
      const { model, hp, price } = getMotorInfo();
      scheduleFlush({
        event_type: 'motor_selected',
        motor_model: model,
        motor_hp: hp,
        quote_value: price,
        event_data: { motorId },
        page_path: location.pathname,
      });
    }
  }, [state.motor?.id, state.isLoading, getMotorInfo, scheduleFlush, location.pathname]);

  // Detect options changes
  useEffect(() => {
    if (state.isLoading || !state.motor) return;
    const count = state.selectedOptions.length;
    if (count > 0 && count !== prevOptionsCount.current) {
      prevOptionsCount.current = count;
      const { model, hp, price } = getMotorInfo();
      const optionNames = state.selectedOptions.map(o => o.name);
      const optionsTotal = state.selectedOptions.reduce((s, o) => s + (o.price || 0), 0);
      scheduleFlush({
        event_type: 'options_configured',
        motor_model: model,
        motor_hp: hp,
        quote_value: (price ?? 0) + optionsTotal,
        event_data: { optionCount: count, options: optionNames },
        page_path: location.pathname,
      });
    }
  }, [state.selectedOptions, state.isLoading, state.motor, getMotorInfo, scheduleFlush, location.pathname]);

  // Detect purchase path
  useEffect(() => {
    if (state.isLoading || !state.motor) return;
    if (state.purchasePath && state.purchasePath !== prevPurchasePath.current) {
      prevPurchasePath.current = state.purchasePath;
      const { model, hp, price } = getMotorInfo();
      scheduleFlush({
        event_type: 'purchase_path_chosen',
        motor_model: model,
        motor_hp: hp,
        quote_value: price,
        event_data: { path: state.purchasePath },
        page_path: location.pathname,
      });
    }
  }, [state.purchasePath, state.isLoading, state.motor, getMotorInfo, scheduleFlush, location.pathname]);

  // Detect trade-in
  useEffect(() => {
    if (state.isLoading || !state.motor) return;
    if (state.hasTradein && !prevHasTradeIn.current) {
      prevHasTradeIn.current = true;
      const { model, hp, price } = getMotorInfo();
      const tradeValue = state.tradeInInfo?.estimatedValue ?? null;
      scheduleFlush({
        event_type: 'trade_in_entered',
        motor_model: model,
        motor_hp: hp,
        quote_value: price,
        event_data: { tradeInValue: tradeValue, brand: state.tradeInInfo?.brand },
        page_path: location.pathname,
      });
    }
  }, [state.hasTradein, state.tradeInInfo, state.isLoading, state.motor, getMotorInfo, scheduleFlush, location.pathname]);

  // Detect financing changes
  useEffect(() => {
    if (state.isLoading || !state.motor) return;
    if (state.financing.term > 0 && state.financing.term !== prevFinancingTerm.current) {
      prevFinancingTerm.current = state.financing.term;
      const { model, hp, price } = getMotorInfo();
      scheduleFlush({
        event_type: 'financing_calculated',
        motor_model: model,
        motor_hp: hp,
        quote_value: price,
        event_data: {
          term: state.financing.term,
          rate: state.financing.rate,
          downPayment: state.financing.downPayment,
        },
        page_path: location.pathname,
      });
    }
  }, [state.financing, state.isLoading, state.motor, getMotorInfo, scheduleFlush, location.pathname]);

  // Quote abandoned — fires on page unload if quote is in progress
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!hasActiveQuote.current || !state.motor) return;
      const { model, hp, price } = getMotorInfo();
      const utm = utmParams.current;
      // Use sendBeacon for reliability during unload
      const payload = JSON.stringify({
        session_id: sessionId.current,
        user_id: user?.id ?? null,
        event_type: 'quote_abandoned',
        motor_model: model,
        motor_hp: hp,
        quote_value: price,
        event_data: { step: state.currentStep },
        page_path: location.pathname,
        utm_source: utm.utm_source,
        utm_medium: utm.utm_medium,
        utm_campaign: utm.utm_campaign,
        utm_term: utm.utm_term,
        utm_content: utm.utm_content,
        referrer: utm.referrer,
      });
      const url = `${(supabase as any).supabaseUrl}/rest/v1/quote_activity_events`;
      const apiKey = (supabase as any).supabaseKey;
      navigator.sendBeacon(
        url,
        new Blob([payload], { type: 'application/json' })
      );
      // sendBeacon doesn't support custom headers, so use fetch with keepalive as fallback
      try {
        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: apiKey,
            Authorization: `Bearer ${apiKey}`,
            Prefer: 'return=minimal',
          },
          body: payload,
          keepalive: true,
        });
      } catch {
        // Best effort
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.motor, state.currentStep, getMotorInfo, user?.id, location.pathname]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);
}
