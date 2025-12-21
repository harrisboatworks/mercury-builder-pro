import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PersistedMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
  reaction: 'thumbs_up' | 'thumbs_down' | null;
  metadata: Record<string, any>;
}

interface ChatContext {
  currentPage?: string;
  motorId?: string;
  motorName?: string;
}

const SESSION_KEY = 'chat_session_id';
const MAX_MESSAGES_TO_LOAD = 20;

// Generate cryptographically secure session IDs to prevent enumeration attacks
function generateSecureSessionId(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return `chat_${Array.from(array, b => b.toString(16).padStart(2, '0')).join('')}`;
}

function getOrCreateSessionId(): string {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = generateSecureSessionId();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export function useChatPersistence() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasHistory, setHasHistory] = useState(false);

  const sessionId = getOrCreateSessionId();

  // Get or create conversation with smart recovery
  const initializeConversation = useCallback(async (context?: ChatContext) => {
    try {
      // First: try existing session ID from localStorage
      const existingSessionId = localStorage.getItem(SESSION_KEY);
      
      if (existingSessionId) {
        const { data: existing } = await supabase
          .from('chat_conversations')
          .select('id')
          .eq('session_id', existingSessionId)
          .eq('is_active', true)
          .order('last_message_at', { ascending: false })
          .limit(1)
          .single();

        if (existing) {
          setConversationId(existing.id);
          return existing.id;
        }
      }

      // FALLBACK: No valid session - try to recover most recent conversation with messages
      const { data: recentConvo } = await supabase
        .from('chat_conversations')
        .select('id, session_id')
        .eq('is_active', true)
        .order('last_message_at', { ascending: false })
        .limit(1)
        .single();

      if (recentConvo) {
        // Check if this conversation has messages
        const { count } = await supabase
          .from('chat_messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', recentConvo.id);

        if (count && count > 0) {
          // Found a conversation with messages - recover it
          localStorage.setItem(SESSION_KEY, recentConvo.session_id || '');
          setConversationId(recentConvo.id);
          setHasHistory(true);
          return recentConvo.id;
        }
      }

      // No recoverable conversation - create new one with secure session ID
      const newSessionId = generateSecureSessionId();
      localStorage.setItem(SESSION_KEY, newSessionId);
      
      const { data: newConvo, error: createError } = await supabase
        .from('chat_conversations')
        .insert({
          session_id: newSessionId,
          context: context || {},
        })
        .select('id')
        .single();

      if (createError) throw createError;
      
      setConversationId(newConvo.id);
      return newConvo.id;
    } catch (error) {
      console.error('Failed to initialize conversation:', error);
      return null;
    }
  }, []);

  // Load messages from database
  const loadMessages = useCallback(async (): Promise<PersistedMessage[]> => {
    if (!conversationId) return [];

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('id, content, role, created_at, reaction, metadata')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(MAX_MESSAGES_TO_LOAD);

      if (error) throw error;
      
      const messages = (data || []).map(msg => ({
        ...msg,
        role: msg.role as 'user' | 'assistant',
        reaction: msg.reaction as 'thumbs_up' | 'thumbs_down' | null,
        metadata: msg.metadata as Record<string, any>,
      }));
      
      setHasHistory(messages.length > 0);
      return messages;
    } catch (error) {
      console.error('Failed to load messages:', error);
      return [];
    }
  }, [conversationId]);

  // Save a message to database
  const saveMessage = useCallback(async (
    content: string,
    role: 'user' | 'assistant',
    metadata?: Record<string, any>
  ): Promise<string | null> => {
    let convoId = conversationId;
    
    if (!convoId) {
      convoId = await initializeConversation();
      if (!convoId) return null;
    }

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: convoId,
          content,
          role,
          metadata: metadata || {},
        })
        .select('id')
        .single();

      if (error) throw error;

      // Update conversation last_message_at
      await supabase
        .from('chat_conversations')
        .update({ last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', convoId);

      return data.id;
    } catch (error) {
      console.error('Failed to save message:', error);
      return null;
    }
  }, [conversationId, initializeConversation]);

  // Update reaction on a message
  const updateReaction = useCallback(async (
    messageId: string,
    reaction: 'thumbs_up' | 'thumbs_down' | null
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({
          reaction,
          reaction_at: reaction ? new Date().toISOString() : null,
        })
        .eq('id', messageId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to update reaction:', error);
      return false;
    }
  }, []);

  // Clear conversation and start fresh
  const clearConversation = useCallback(async (): Promise<boolean> => {
    if (!conversationId) return true;

    try {
      // Mark current conversation as inactive
      await supabase
        .from('chat_conversations')
        .update({ is_active: false })
        .eq('id', conversationId);

      setConversationId(null);
      setHasHistory(false);
      return true;
    } catch (error) {
      console.error('Failed to clear conversation:', error);
      return false;
    }
  }, [conversationId]);

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await initializeConversation();
      setIsLoading(false);
    };
    init();
  }, [initializeConversation]);

  return {
    conversationId,
    isLoading,
    hasHistory,
    loadMessages,
    saveMessage,
    updateReaction,
    clearConversation,
    initializeConversation,
  };
}
