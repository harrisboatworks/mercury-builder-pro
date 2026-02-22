// SSE Stream Parser for AI Chat with Typewriter Effect + Mobile Fallback

const SUPABASE_URL = 'https://eutsoqdpjurknjsshxes.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1dHNvcWRwanVya25qc3NoeGVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NTI0NzIsImV4cCI6MjA3MDEyODQ3Mn0.QsPdm3kQx1XC-epK1MbAQVyaAY1oxGyKdSYzrctGMaU';

const STREAM_TIMEOUT_MS = 25_000; // 25s timeout for mobile connections

export interface StreamChatParams {
  message: string;
  conversationHistory: Array<{ role: string; content: string }>;
  context?: {
    currentMotor?: {
      id?: string;
      model: string;
      hp: number;
      price?: number;
      family?: string;
      description?: string;
      features?: any;
    };
    currentPage?: string;
    boatInfo?: any;
    quoteProgress?: {
      step: number;
      total: number;
      selectedPackage?: string | null;
      tradeInValue?: number | null;
    };
    prefetchedInsights?: string[];
    voiceContext?: {
      summary: string | null;
      motorsDiscussed: string[];
      lastVoiceAt: string | null;
      messageCount: number;
    };
  };
  onDelta: (chunk: string) => void;
  onDone: (fullResponse: string) => void;
  onError: (error: Error) => void;
}

// Non-streaming fallback request (used when SSE fails on mobile)
async function fetchNonStreaming(
  message: string,
  conversationHistory: Array<{ role: string; content: string }>,
  context: StreamChatParams['context'],
  onDelta: (chunk: string) => void,
  onDone: (fullResponse: string) => void,
): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), STREAM_TIMEOUT_MS);

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-chatbot-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ message, conversationHistory, context, stream: false }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Fallback request failed: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.reply || data.error || 'No response received';

    // Simulate typewriter effect for non-streaming response
    const words = reply.split(' ');
    let fullResponse = '';
    for (let i = 0; i < words.length; i++) {
      const word = words[i] + (i < words.length - 1 ? ' ' : '');
      fullResponse += word;
      onDelta(word);
      await new Promise(r => setTimeout(r, 30));
    }
    onDone(fullResponse);
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

export async function streamChat({
  message,
  conversationHistory,
  context,
  onDelta,
  onDone,
  onError
}: StreamChatParams): Promise<void> {
  try {
    // Attempt streaming request with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), STREAM_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(`${SUPABASE_URL}/functions/v1/ai-chatbot-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ message, conversationHistory, context, stream: true }),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timeout);
      // Network error or timeout — fall back to non-streaming
      console.warn('[StreamChat] Streaming fetch failed, retrying without streaming:', fetchErr);
      try {
        await fetchNonStreaming(message, conversationHistory, context, onDelta, onDone);
        return;
      } catch (fallbackErr) {
        throw fallbackErr;
      }
    }

    clearTimeout(timeout);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Stream failed: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    
    // Handle SSE streaming response
    if (contentType?.includes('text/event-stream') && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullResponse = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              
              if (data === '[DONE]') {
                onDone(fullResponse);
                return;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullResponse += content;
                  onDelta(content);
                }
              } catch {
                // Incomplete JSON, skip
              }
            }
          }
        }
      } catch (streamReadErr) {
        // Stream read failed mid-response (connection drop on mobile)
        console.warn('[StreamChat] Stream read failed mid-response, falling back:', streamReadErr);
        
        // If we already got some content, deliver what we have
        if (fullResponse.length > 20) {
          onDone(fullResponse);
          return;
        }
        
        // Otherwise retry without streaming
        try {
          await fetchNonStreaming(message, conversationHistory, context, onDelta, onDone);
          return;
        } catch (fallbackErr) {
          throw fallbackErr;
        }
      }

      // Final flush
      if (buffer.trim()) {
        const lines = buffer.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && line.slice(6).trim() !== '[DONE]') {
            try {
              const parsed = JSON.parse(line.slice(6));
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullResponse += content;
                onDelta(content);
              }
            } catch {
              // Ignore
            }
          }
        }
      }

      onDone(fullResponse);
    } else {
      // Fallback: Non-streaming JSON response
      const data = await response.json();
      const reply = data.reply || data.error || 'No response received';
      
      const words = reply.split(' ');
      let fullResponse = '';
      
      for (let i = 0; i < words.length; i++) {
        const word = words[i] + (i < words.length - 1 ? ' ' : '');
        fullResponse += word;
        onDelta(word);
        await new Promise(r => setTimeout(r, 30));
      }
      
      onDone(fullResponse);
    }
  } catch (error) {
    console.error('Stream chat error:', error);
    onError(error instanceof Error ? error : new Error('Unknown streaming error'));
  }
}

// Detect if message is a comparison query
export function detectComparisonQuery(message: string): { 
  isComparison: boolean; 
  hp1?: number; 
  hp2?: number 
} {
  const patterns = [
    /compare\s+(\d+)\s*hp?\s*(vs|versus|or|and|to|with)\s*(\d+)\s*hp?/i,
    /(\d+)\s*hp?\s*(vs|versus|compared to|or)\s*(\d+)\s*hp?/i,
    /difference between\s+(\d+)\s*hp?\s*and\s*(\d+)\s*hp?/i,
    /(\d+)\s*vs\s*(\d+)/i,
    /which is better[,:]?\s*(\d+)\s*hp?\s*or\s*(\d+)\s*hp?/i
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      const numbers = match.slice(1).filter(m => /^\d+$/.test(m)).map(Number);
      if (numbers.length >= 2) {
        return { 
          isComparison: true, 
          hp1: Math.min(numbers[0], numbers[1]), 
          hp2: Math.max(numbers[0], numbers[1]) 
        };
      }
    }
  }

  return { isComparison: false };
}
