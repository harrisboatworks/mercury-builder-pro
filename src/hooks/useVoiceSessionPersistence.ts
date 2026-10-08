import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getOrCreateVoiceSessionId } from './voiceSessionId';

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

interface ActiveSession {
  key: string;
  userId: string | null;
  startedAt: number;
  messages: number;
  closing: boolean;
  creation: Promise<string | null>;
}

async function writeSessionUpdate(session: ActiveSession, id: string, updates: Record<string, unknown>) {
  if (session.userId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id === session.userId) {
        const { data, error } = await supabase.from('voice_sessions')
          .update(updates).eq('id', id).select('id').single();
        if (!error && data?.id === id) return { error: null };
      }
    } catch {
      // Authentication can change during a call or between the check and write.
    }
  }
  return supabase.functions.invoke('voice-sessions-proxy', {
    body: { action: 'update', session_id: session.key, record_id: id, updates },
  });
}

export function useVoiceSessionPersistence() {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const activeSessionRef = useRef<ActiveSession | null>(null);

  // Load previous voice sessions for context (for returning customers)
  // Uses edge function proxy for anonymous users (RLS cannot read HTTP headers)
  const loadPreviousSessionContext = useCallback(async (): Promise<VoiceSessionContext | null> => {
    try {
      const sessionId = getOrCreateVoiceSessionId();
      const { data: { user } } = await supabase.auth.getUser();
      
      let sessions: VoiceSessionData[] | null = null;

      if (user) {
        // Authenticated users can query directly via RLS
        const { data, error } = await supabase
          .from('voice_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('started_at', { ascending: false })
          .limit(5);
        
        if (error) {
          console.error('Error loading previous voice sessions:', error);
          return null;
        }
        sessions = data as VoiceSessionData[] | null;
      } else {
        // Anonymous users go through the edge function proxy
        const { data, error } = await supabase.functions.invoke('voice-sessions-proxy', {
          body: { action: 'list', session_id: sessionId, limit: 5 },
        });

        if (error) {
          console.error('Error loading previous voice sessions via proxy:', error);
          return null;
        }
        sessions = data?.sessions ?? null;
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

  // Called after the provider connects. Keep the pending write in a ref so
  // quick disconnects and callback closures cannot lose the session cleanup.
  const startSession = useCallback((
    motorContext?: { model: string; hp: number; price?: number } | null,
    pageContext?: string,
    conversationId?: string
  ): Promise<string | null> => {
    if (activeSessionRef.current) return activeSessionRef.current.creation;
    let key: string;
    try {
      key = getOrCreateVoiceSessionId();
    } catch {
      console.warn('[VoiceSession] Browser storage is unavailable');
      return Promise.resolve(null);
    }
    const session: ActiveSession = {
      key,
      userId: null,
      startedAt: Date.now(),
      messages: 0,
      closing: false,
      creation: Promise.resolve(null),
    };
    activeSessionRef.current = session;
    setIsLoading(true);
    session.creation = (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        session.userId = user?.id ?? null;
        const result = user
          ? await supabase.from('voice_sessions').insert({
              session_id: session.key,
              user_id: user.id,
              conversation_id: conversationId || null,
              context: { page: pageContext, startedAt: new Date(session.startedAt).toISOString() },
              motor_context: motorContext || null,
              messages_exchanged: 0,
            }).select('id').single()
          : await supabase.functions.invoke('voice-sessions-proxy', {
              body: { action: 'create', session_id: session.key, page: pageContext, motor_context: motorContext || null },
            });
        if (result.error || typeof result.data?.id !== 'string') {
          console.warn('[VoiceSession] Could not save the connected session');
          return null;
        }
        if (activeSessionRef.current === session) setCurrentSessionId(result.data.id);
        return result.data.id;
      } catch {
        console.warn('[VoiceSession] Could not save the connected session');
        return null;
      } finally {
        if (activeSessionRef.current === session) setIsLoading(false);
      }
    })();
    return session.creation;
  }, []);

  const incrementMessageCount = useCallback(() => {
    const session = activeSessionRef.current;
    if (session && !session.closing) session.messages += 1;
  }, []);

  const endSession = useCallback(async (
    endReason: 'user_ended' | 'timeout' | 'goodbye' | 'error' = 'user_ended',
    summary?: string
  ) => {
    const session = activeSessionRef.current;
    if (!session || session.closing) return;
    session.closing = true;
    activeSessionRef.current = null;
    setCurrentSessionId(null);
    setIsLoading(false);
    const endedAt = new Date();
    const updates = {
      ended_at: endedAt.toISOString(),
      duration_seconds: Math.max(0, Math.floor((endedAt.getTime() - session.startedAt) / 1000)),
      messages_exchanged: session.messages,
      end_reason: endReason,
      summary: summary || null,
    };
    try {
      const id = await session.creation;
      if (!id) return;
      const { error } = await writeSessionUpdate(session, id, updates);
      if (error) console.warn('[VoiceSession] Could not save session completion');
    } catch {
      console.warn('[VoiceSession] Could not save session completion');
    }
  }, []);

  const updateMotorContext = useCallback(async (
    motorContext: { model: string; hp: number; price?: number }
  ) => {
    const session = activeSessionRef.current;
    if (!session || session.closing) return;
    try {
      const id = await session.creation;
      if (!id || session.closing) return;
      const { error } = await writeSessionUpdate(session, id, { motor_context: motorContext });
      if (error) console.warn('[VoiceSession] Could not save motor context');
    } catch {
      console.warn('[VoiceSession] Could not save motor context');
    }
  }, []);

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
