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

interface ChatHistoryResponse {
  conversation: {
    id: string;
    context: Record<string, any>;
    created_at: string;
    last_message_at: string;
  } | null;
  messages: PersistedMessage[];
}

const SESSION_KEY = 'chat_session_id';
const MAX_MESSAGES_TO_LOAD = 20;
const SUPABASE_URL = 'https://eutsoqdpjurknjsshxes.supabase.co';

// Generate cryptographically secure session IDs to prevent enumeration attacks
function generateSecureSessionId(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return `chat_${Array.from(array, b => b.toString(16).padStart(2, '0')).join('')}`;
}

function getOrCreateSessionId(): string {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId || !isValidSessionIdFormat(sessionId)) {
    sessionId = generateSecureSessionId();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

// Validate session ID format matches our secure format
function isValidSessionIdFormat(sessionId: string): boolean {
  return /^chat_[a-f0-9]{64}$/.test(sessionId);
}

// Fetch chat history via secure Edge Function
async function fetchChatHistoryFromEdge(sessionId: string): Promise<ChatHistoryResponse> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/chat-history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ session_id: sessionId }),
    });

    if (!response.ok) {
      console.error('Chat history fetch failed:', response.status);
      return { conversation: null, messages: [] };
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch chat history:', error);
    return { conversation: null, messages: [] };
  }
}

export function useChatPersistence() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasHistory, setHasHistory] = useState(false);

  const sessionId = getOrCreateSessionId();

  // Initialize conversation - only creates new if none exists for this session
  const initializeConversation = useCallback(async (context?: ChatContext) => {
    try {
      // Use Edge Function to securely fetch existing conversation
      const { conversation } = await fetchChatHistoryFromEdge(sessionId);

      if (conversation) {
        setConversationId(conversation.id);
        setHasHistory(true);
        return conversation.id;
      }

      // No existing conversation - create a new one
      const { data: newConvo, error: createError } = await supabase
        .from('chat_conversations')
        .insert({
          session_id: sessionId,
          context: context || {},
        })
        .select('id')
        .single();

      if (createError) throw createError;
      
      setConversationId(newConvo.id);
      setHasHistory(false);
      return newConvo.id;
    } catch (error) {
      console.error('Failed to initialize conversation:', error);
      return null;
    }
  }, [sessionId]);

  // Load messages using Edge Function (secure)
  const loadMessages = useCallback(async (): Promise<PersistedMessage[]> => {
    try {
      const { conversation, messages } = await fetchChatHistoryFromEdge(sessionId);
      
      if (conversation) {
        setConversationId(conversation.id);
      }
      
      const formattedMessages = messages.map(msg => ({
        ...msg,
        role: msg.role as 'user' | 'assistant',
        reaction: msg.reaction as 'thumbs_up' | 'thumbs_down' | null,
        metadata: (msg.metadata || {}) as Record<string, any>,
      }));
      
      setHasHistory(formattedMessages.length > 0);
      return formattedMessages;
    } catch (error) {
      console.error('Failed to load messages:', error);
      return [];
    }
  }, [sessionId]);

  // Save a message to database (direct insert is still allowed by RLS)
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

      // Generate new session ID for fresh start
      const newSessionId = generateSecureSessionId();
      localStorage.setItem(SESSION_KEY, newSessionId);

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
