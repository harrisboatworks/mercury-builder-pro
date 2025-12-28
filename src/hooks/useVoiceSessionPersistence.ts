import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VoiceSessionData {
  id: string;
  session_id: string;
  user_id: string | null;
  conversation_id: string | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  messages_exchanged: number;
  context: Record<string, unknown>;
  summary: string | null;
  end_reason: string | null;
  motor_context: Record<string, unknown> | null;
}

interface PreviousSessionSummary {
  date: string;
  motorsDiscussed: string[];
  duration: number;
  messageCount: number;
  summary: string | null;
}

export interface VoiceSessionContext {
  previousSessions: PreviousSessionSummary[];
  totalPreviousChats: number;
  lastVisitDate: string | null;
  preferredMotorSize?: string;
  recentMotorsViewed: string[];
}

const SESSION_ID_KEY = 'chat_session_id';

// Generate cryptographically secure session ID
function generateSecureSessionId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return `voice_${Array.from(array, b => b.toString(16).padStart(2, '0')).join('')}`;
}

function getOrCreateSessionId(): string {
  let sessionId = localStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = generateSecureSessionId();
    localStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}

export function useVoiceSessionPersistence() {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messageCountRef = useRef(0);
  const sessionStartTimeRef = useRef<Date | null>(null);

  // Load previous voice sessions for context (for returning customers)
  const loadPreviousSessionContext = useCallback(async (): Promise<VoiceSessionContext | null> => {
    try {
      const sessionId = getOrCreateSessionId();
      const { data: { user } } = await supabase.auth.getUser();
      
      // Query by user_id if logged in, otherwise by session_id
      let query = supabase
        .from('voice_sessions')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(5);
      
      if (user) {
        query = query.eq('user_id', user.id);
      } else {
        query = query.eq('session_id', sessionId);
      }
      
      const { data: sessions, error } = await query;
      
      if (error) {
        console.error('Error loading previous voice sessions:', error);
        return null;
      }
      
      if (!sessions || sessions.length === 0) {
        return null;
      }
      
      // Build context from previous sessions
      const recentMotorsViewed: string[] = [];
      const previousSessions: PreviousSessionSummary[] = sessions.map(session => {
        const motorCtx = session.motor_context as Record<string, unknown> | null;
        if (motorCtx?.model) {
          const model = String(motorCtx.model);
          if (!recentMotorsViewed.includes(model)) {
            recentMotorsViewed.push(model);
          }
        }
        
        return {
          date: new Date(session.started_at).toLocaleDateString(),
          motorsDiscussed: motorCtx?.model ? [String(motorCtx.model)] : [],
          duration: session.duration_seconds || 0,
          messageCount: session.messages_exchanged || 0,
          summary: session.summary,
        };
      });
      
      return {
        previousSessions,
        totalPreviousChats: sessions.length,
        lastVisitDate: sessions[0]?.started_at ? new Date(sessions[0].started_at).toLocaleDateString() : null,
        recentMotorsViewed,
      };
    } catch (err) {
      console.error('Error loading voice session context:', err);
      return null;
    }
  }, []);

  // Start a new voice session
  const startSession = useCallback(async (
    motorContext?: { model: string; hp: number; price?: number } | null,
    pageContext?: string,
    conversationId?: string
  ): Promise<string | null> => {
    try {
      setIsLoading(true);
      messageCountRef.current = 0;
      sessionStartTimeRef.current = new Date();
      
      const sessionId = getOrCreateSessionId();
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('voice_sessions')
        .insert({
          session_id: sessionId,
          user_id: user?.id || null,
          conversation_id: conversationId || null,
          context: {
            page: pageContext,
            startedAt: new Date().toISOString(),
          },
          motor_context: motorContext || null,
          messages_exchanged: 0,
        })
        .select('id')
        .single();
      
      if (error) {
        console.error('Error creating voice session:', error);
        return null;
      }
      
      setCurrentSessionId(data.id);
      console.log('[VoiceSession] Started session:', data.id);
      return data.id;
    } catch (err) {
      console.error('Error starting voice session:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Increment message count
  const incrementMessageCount = useCallback(() => {
    messageCountRef.current += 1;
  }, []);

  // End the current voice session
  const endSession = useCallback(async (
    endReason: 'user_ended' | 'timeout' | 'goodbye' | 'error' = 'user_ended',
    summary?: string
  ) => {
    if (!currentSessionId) return;
    
    try {
      const duration = sessionStartTimeRef.current
        ? Math.floor((Date.now() - sessionStartTimeRef.current.getTime()) / 1000)
        : 0;
      
      const { error } = await supabase
        .from('voice_sessions')
        .update({
          ended_at: new Date().toISOString(),
          duration_seconds: duration,
          messages_exchanged: messageCountRef.current,
          end_reason: endReason,
          summary: summary || null,
        })
        .eq('id', currentSessionId);
      
      if (error) {
        console.error('Error ending voice session:', error);
      } else {
        console.log('[VoiceSession] Ended session:', currentSessionId, { endReason, duration, messages: messageCountRef.current });
      }
    } catch (err) {
      console.error('Error ending voice session:', err);
    } finally {
      setCurrentSessionId(null);
      messageCountRef.current = 0;
      sessionStartTimeRef.current = null;
    }
  }, [currentSessionId]);

  // Update motor context mid-session
  const updateMotorContext = useCallback(async (
    motorContext: { model: string; hp: number; price?: number }
  ) => {
    if (!currentSessionId) return;
    
    try {
      await supabase
        .from('voice_sessions')
        .update({
          motor_context: motorContext,
        })
        .eq('id', currentSessionId);
    } catch (err) {
      console.error('Error updating motor context:', err);
    }
  }, [currentSessionId]);

  return {
    currentSessionId,
    isLoading,
    startSession,
    endSession,
    incrementMessageCount,
    updateMotorContext,
    loadPreviousSessionContext,
  };
}
