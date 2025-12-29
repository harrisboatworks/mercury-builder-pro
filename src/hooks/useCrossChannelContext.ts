import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SESSION_KEY = 'chat_session_id';

export interface VoiceContextForText {
  hasRecentVoice: boolean;
  summary: string | null;
  motorsDiscussed: string[];
  lastVoiceAt: string | null;
  messageCount: number;
}

export interface TextContextForVoice {
  hasRecentText: boolean;
  recentMessages: Array<{ role: 'user' | 'assistant'; content: string }>;
  motorsDiscussed: string[];
  lastTextAt: string | null;
}

/**
 * Hook to load cross-channel context for voice-text handoff
 * Allows text chat to know what was discussed in voice and vice versa
 */
export function useCrossChannelContext() {
  
  /**
   * Load recent voice session context for text chat
   * Returns summary of recent voice conversations for the same session
   */
  const loadVoiceContextForText = useCallback(async (): Promise<VoiceContextForText> => {
    try {
      const sessionId = localStorage.getItem(SESSION_KEY);
      if (!sessionId) {
        return { hasRecentVoice: false, summary: null, motorsDiscussed: [], lastVoiceAt: null, messageCount: 0 };
      }

      // Get recent voice sessions from the last 2 hours for this session
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      
      const { data: sessions, error } = await supabase
        .from('voice_sessions')
        .select('summary, motor_context, started_at, messages_exchanged')
        .eq('session_id', sessionId)
        .gte('started_at', twoHoursAgo)
        .order('started_at', { ascending: false })
        .limit(3);

      if (error || !sessions || sessions.length === 0) {
        return { hasRecentVoice: false, summary: null, motorsDiscussed: [], lastVoiceAt: null, messageCount: 0 };
      }

      // Combine summaries and extract motors discussed
      const motorsDiscussed: string[] = [];
      const summaries: string[] = [];
      let totalMessages = 0;

      sessions.forEach(session => {
        if (session.summary) {
          summaries.push(session.summary);
        }
        totalMessages += session.messages_exchanged || 0;
        
        const motorCtx = session.motor_context as Record<string, unknown> | null;
        if (motorCtx?.model) {
          const model = String(motorCtx.model);
          if (!motorsDiscussed.includes(model)) {
            motorsDiscussed.push(model);
          }
        }
      });

      return {
        hasRecentVoice: true,
        summary: summaries.length > 0 ? summaries.join(' | ') : null,
        motorsDiscussed,
        lastVoiceAt: sessions[0].started_at,
        messageCount: totalMessages,
      };
    } catch (err) {
      console.error('[CrossChannel] Error loading voice context for text:', err);
      return { hasRecentVoice: false, summary: null, motorsDiscussed: [], lastVoiceAt: null, messageCount: 0 };
    }
  }, []);

  /**
   * Load recent text chat context for voice
   * Returns recent messages and topics from text chat
   */
  const loadTextContextForVoice = useCallback(async (): Promise<TextContextForVoice> => {
    try {
      const sessionId = localStorage.getItem(SESSION_KEY);
      if (!sessionId) {
        return { hasRecentText: false, recentMessages: [], motorsDiscussed: [], lastTextAt: null };
      }

      // Find active conversation for this session
      const { data: conversation, error: convError } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('session_id', sessionId)
        .eq('is_active', true)
        .order('last_message_at', { ascending: false })
        .limit(1)
        .single();

      if (convError || !conversation) {
        return { hasRecentText: false, recentMessages: [], motorsDiscussed: [], lastTextAt: null };
      }

      // Get recent messages from the last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const { data: messages, error: msgError } = await supabase
        .from('chat_messages')
        .select('content, role, created_at, metadata')
        .eq('conversation_id', conversation.id)
        .gte('created_at', oneHourAgo)
        .order('created_at', { ascending: false })
        .limit(10);

      if (msgError || !messages || messages.length === 0) {
        return { hasRecentText: false, recentMessages: [], motorsDiscussed: [], lastTextAt: null };
      }

      // Extract motors mentioned in messages (from metadata)
      const motorsDiscussed: string[] = [];
      messages.forEach(msg => {
        const metadata = msg.metadata as Record<string, unknown> | null;
        if (metadata?.motorName) {
          const motorName = String(metadata.motorName);
          if (!motorsDiscussed.includes(motorName)) {
            motorsDiscussed.push(motorName);
          }
        }
      });

      // Format messages for context (most recent first, reversed to chronological for context)
      const recentMessages = messages
        .reverse()
        .map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content.substring(0, 300), // Truncate for context
        }));

      return {
        hasRecentText: true,
        recentMessages,
        motorsDiscussed,
        lastTextAt: messages[messages.length - 1]?.created_at || null,
      };
    } catch (err) {
      console.error('[CrossChannel] Error loading text context for voice:', err);
      return { hasRecentText: false, recentMessages: [], motorsDiscussed: [], lastTextAt: null };
    }
  }, []);

  /**
   * Save voice summary to linked text conversation
   * Called when voice session ends
   */
  const saveVoiceSummaryToTextConversation = useCallback(async (summary: string): Promise<void> => {
    try {
      const sessionId = localStorage.getItem(SESSION_KEY);
      if (!sessionId || !summary) return;

      // Update the active conversation for this session with voice summary
      await supabase
        .from('chat_conversations')
        .update({ 
          voice_summary: summary,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .eq('is_active', true);

      console.log('[CrossChannel] Saved voice summary to text conversation');
    } catch (err) {
      console.error('[CrossChannel] Error saving voice summary:', err);
    }
  }, []);

  /**
   * Generate a brief summary from conversation events
   * Used to create voice session summary on end
   */
  const generateVoiceSummary = useCallback((
    motorsViewed: string[],
    topics: string[],
    messageCount: number
  ): string => {
    const parts: string[] = [];
    
    if (motorsViewed.length > 0) {
      parts.push(`Discussed ${motorsViewed.slice(0, 2).join(' and ')}`);
    }
    
    if (topics.length > 0) {
      parts.push(`Topics: ${topics.slice(0, 3).join(', ')}`);
    }
    
    if (messageCount > 0) {
      parts.push(`${messageCount} messages exchanged`);
    }
    
    return parts.join('. ') || 'Brief voice conversation';
  }, []);

  return {
    loadVoiceContextForText,
    loadTextContextForVoice,
    saveVoiceSummaryToTextConversation,
    generateVoiceSummary,
  };
}
