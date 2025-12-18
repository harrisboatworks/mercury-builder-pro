import { useState, useEffect, useRef, useCallback } from 'react';
import { getMotorSpecificPrompts } from '@/components/chat/getMotorSpecificPrompts';

interface MotorContext {
  hp: number;
  family?: string;
  model?: string;
}

interface UseRotatingPromptsOptions {
  context: MotorContext | null;
  rotationInterval?: number; // ms, default 45 seconds
  promptCount?: number;
  enabled?: boolean;
  onRotate?: () => void;
}

export function useRotatingPrompts({
  context,
  rotationInterval = 45000,
  promptCount = 4,
  enabled = true,
  onRotate,
}: UseRotatingPromptsOptions) {
  const [prompts, setPrompts] = useState<string[]>([]);
  const [isRotating, setIsRotating] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastContextRef = useRef<string | null>(null);
  
  // Generate context key for change detection
  const contextKey = context ? `${context.hp}_${context.family}_${context.model}` : null;
  
  // Get fresh prompts
  const refreshPrompts = useCallback(() => {
    if (!context) {
      setPrompts([]);
      return;
    }
    
    setIsRotating(true);
    
    // Small delay for animation
    setTimeout(() => {
      const newPrompts = getMotorSpecificPrompts(context, promptCount);
      setPrompts(newPrompts);
      setIsRotating(false);
      onRotate?.();
    }, 150);
  }, [context, promptCount, onRotate]);
  
  // Initial load and context change detection
  useEffect(() => {
    if (!enabled || !context) {
      setPrompts([]);
      return;
    }
    
    // Check if context changed
    if (contextKey !== lastContextRef.current) {
      lastContextRef.current = contextKey;
      refreshPrompts();
    }
  }, [contextKey, enabled, context, refreshPrompts]);
  
  // Set up rotation timer
  useEffect(() => {
    if (!enabled || !context) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    
    // Start rotation timer
    timerRef.current = setInterval(() => {
      refreshPrompts();
    }, rotationInterval);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, context, rotationInterval, refreshPrompts]);
  
  // Manual refresh function
  const forceRefresh = useCallback(() => {
    if (context) {
      refreshPrompts();
    }
  }, [context, refreshPrompts]);
  
  return {
    prompts,
    isRotating,
    forceRefresh,
  };
}
