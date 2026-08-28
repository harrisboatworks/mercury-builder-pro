import { useState, useEffect, useCallback } from 'react';

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
  message_id?: string;
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
async function callChatPersistenceEdge(
  sessionId: string,
  payload: Record<string, unknown> = {},
  throwOnError = false,
): Promise<ChatHistoryResponse> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/chat-history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ session_id: sessionId, ...payload }),
    });

    if (!response.ok) {
      console.error('Chat history fetch failed:', response.status);
      if (throwOnError) throw new Error(`Chat persistence request failed (${response.status})`);
      return { conversation: null, messages: [] };
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch chat history:', error);
    if (throwOnError) throw error;
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
      // The Edge Function owns both creation and lookup so anonymous clients
      // never need a SELECT permission that would expose other sessions.
      const { conversation, messages } = await callChatPersistenceEdge(sessionId, {
        action: 'ensure',
        context: context || {},
      });

      if (conversation) {
        setConversationId(conversation.id);
        setHasHistory(messages.length > 0);
        return conversation.id;
      }

      return null;
    } catch (error: any) {
      // RLS-blocked inserts for anonymous users are expected — silently skip persistence
      const code = error?.code || error?.status;
      const msg = String(error?.message || '');
      if (code === '42501' || msg.toLowerCase().includes('row-level security') || msg.toLowerCase().includes('row level security')) {
        // Silently no-op: chat works locally without persistence
        return null;
      }
      console.warn('Could not initialize conversation persistence (chat will continue locally):', error);
      return null;
    }
  }, [sessionId]);

  // Load messages using Edge Function (secure)
  const loadMessages = useCallback(async (): Promise<PersistedMessage[]> => {
    try {
      const { conversation, messages } = await callChatPersistenceEdge(sessionId);
      
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
    // Do not create a database conversation just to store the local welcome
    // message. Persistence begins with the visitor's first actual message.
    if (!conversationId && role === 'assistant') return null;

    let convoId = conversationId;
    
    if (!convoId) {
      convoId = await initializeConversation();
      if (!convoId) return null;
    }

    try {
      const result = await callChatPersistenceEdge(sessionId, {
        action: 'save_message',
        conversation_id: convoId,
        content,
        role,
        metadata: metadata || {},
      }, true);
      return result.message_id || null;
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
      await callChatPersistenceEdge(sessionId, {
        action: 'reaction',
        message_id: messageId,
        reaction,
      }, true);
      return true;
    } catch (error) {
      console.error('Failed to update reaction:', error);
      return false;
    }
  }, [sessionId]);

  // Clear conversation and start fresh
  const clearConversation = useCallback(async (): Promise<boolean> => {
    if (!conversationId) return true;

    try {
      await callChatPersistenceEdge(sessionId, {
        action: 'clear',
        conversation_id: conversationId,
      }, true);

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
  }, [conversationId, sessionId]);

  // Conversations are loaded when a chat surface opens and created only when
  // the visitor sends a message. This avoids a database write on every page view.
  useEffect(() => {
    setIsLoading(false);
  }, []);

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
