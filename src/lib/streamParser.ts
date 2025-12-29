// SSE Stream Parser for AI Chat with Typewriter Effect

const SUPABASE_URL = 'https://eutsoqdpjurknjsshxes.supabase.co';

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
    // Prefetched motor insights from Perplexity for proactive knowledge sharing
    prefetchedInsights?: string[];
  };
  onDelta: (chunk: string) => void;
  onDone: (fullResponse: string) => void;
  onError: (error: Error) => void;
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
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-chatbot-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message, 
        conversationHistory,
        context,
        stream: true
      })
    });

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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE lines
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
      
      // Simulate typewriter effect for non-streaming responses
      const words = reply.split(' ');
      let fullResponse = '';
      
      for (let i = 0; i < words.length; i++) {
        const word = words[i] + (i < words.length - 1 ? ' ' : '');
        fullResponse += word;
        onDelta(word);
        await new Promise(r => setTimeout(r, 30)); // Small delay for effect
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
      // Extract the two HP values
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
