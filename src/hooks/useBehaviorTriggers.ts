import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import type { MessageVariant } from './useNudgeExperiment';

interface TriggerConfig {
  timeThreshold: number; // seconds
  scrollThreshold: number; // percentage 0-100
  idleThreshold: number; // seconds
  variants: MessageVariant[];
}

export interface BehaviorTriggerResult {
  shouldShowNudge: boolean;
  triggerType: 'time' | 'scroll' | 'idle' | 'revisit' | null;
  variants: MessageVariant[];
  timeOnPage: number;
  scrollDepth: number;
  dismissNudge: () => void;
  resetTriggers: () => void;
}

// Multi-variant configurations for A/B testing
const PAGE_TRIGGERS: Record<string, TriggerConfig> = {
  '/quote/motor-selection': {
    timeThreshold: 45,
    scrollThreshold: 80,
    idleThreshold: 30,
    variants: [
      { id: 'A', message: "Taking your time? I can help you compare motors!" },
      { id: 'B', message: "Need help choosing? Tell me about your boat!" },
      { id: 'C', message: "🎯 What's your boat type? I'll find perfect matches!" },
      { id: 'D', message: "Comparing options? Let me highlight key differences!" }
    ]
  },
  '/quote/summary': {
    timeThreshold: 60,
    scrollThreshold: 90,
    idleThreshold: 30,
    variants: [
      { id: 'A', message: "Questions about your quote? I'm here to help!" },
      { id: 'B', message: "Want me to explain any of these charges?" },
      { id: 'C', message: "💬 Get instant answers about your quote" }
    ]
  },
  '/financing-application': {
    timeThreshold: 90,
    scrollThreshold: 70,
    idleThreshold: 60,
    variants: [
      { id: 'A', message: "Need help with the application? Ask me anything!" },
      { id: 'B', message: "Stuck on a field? I can explain what's needed!" },
      { id: 'C', message: "📋 Quick help available - just ask!" }
    ]
  },
  '/promotions': {
    timeThreshold: 60,
    scrollThreshold: 80,
    idleThreshold: 45,
    variants: [
      { id: 'A', message: "Want to find the best deal for your boat?" },
      { id: 'B', message: "I know which promos apply to your setup!" },
      { id: 'C', message: "💰 Let me find the perfect savings for you!" }
    ]
  },
  '/': {
    timeThreshold: 30,
    scrollThreshold: 70,
    idleThreshold: 40,
    variants: [
      { id: 'A', message: "Looking for a new motor? I can help you find the perfect fit!" },
      { id: 'B', message: "First time buying? Let me guide you through options!" },
      { id: 'C', message: "🚤 Tell me about your boat - I'll recommend motors!" }
    ]
  }
};

const DEFAULT_TRIGGER: TriggerConfig = {
  timeThreshold: 60,
  scrollThreshold: 85,
  idleThreshold: 45,
  variants: [
    { id: 'A', message: "Have questions? I'm here to help!" },
    { id: 'B', message: "Need assistance? Just ask!" }
  ]
};

const SESSION_KEY = 'chat_nudge_dismissed';
const REVISIT_KEY = 'pages_visited_this_session';
const MIN_SITE_TIME = 15; // seconds before any trigger can fire

const REVISIT_VARIANTS: MessageVariant[] = [
  { id: 'R1', message: "Welcome back! Still deciding? I can help!" },
  { id: 'R2', message: "Good to see you again! Need some guidance?" },
  { id: 'R3', message: "Back for more? Let me help you compare!" }
];

export const useBehaviorTriggers = (isChatOpen: boolean): BehaviorTriggerResult => {
  const location = useLocation();
  const [shouldShowNudge, setShouldShowNudge] = useState(false);
  const [triggerType, setTriggerType] = useState<'time' | 'scroll' | 'idle' | 'revisit' | null>(null);
  const [currentVariants, setCurrentVariants] = useState<MessageVariant[]>([]);
  
  const pageTimeRef = useRef(0);
  const siteTimeRef = useRef(0);
  const lastActivityRef = useRef(Date.now());
  const hasTriggeredRef = useRef(false);
  const scrollDepthRef = useRef(0);

  const getConfig = useCallback((): TriggerConfig => {
    return PAGE_TRIGGERS[location.pathname] || DEFAULT_TRIGGER;
  }, [location.pathname]);

  const dismissNudge = useCallback(() => {
    setShouldShowNudge(false);
    setTriggerType(null);
    hasTriggeredRef.current = true;
    sessionStorage.setItem(SESSION_KEY, 'true');
  }, []);

  const resetTriggers = useCallback(() => {
    pageTimeRef.current = 0;
    hasTriggeredRef.current = false;
    setShouldShowNudge(false);
    setTriggerType(null);
  }, []);

  const triggerNudge = useCallback((type: 'time' | 'scroll' | 'idle' | 'revisit', variants: MessageVariant[]) => {
    if (hasTriggeredRef.current || isChatOpen) return;
    if (siteTimeRef.current < MIN_SITE_TIME) return;
    if (sessionStorage.getItem(SESSION_KEY) === 'true') return;

    hasTriggeredRef.current = true;
    setTriggerType(type);
    setCurrentVariants(variants);
    setShouldShowNudge(true);
  }, [isChatOpen]);

  // Check for page revisit
  useEffect(() => {
    const visitedPages = JSON.parse(sessionStorage.getItem(REVISIT_KEY) || '[]') as string[];
    const currentPath = location.pathname;
    
    if (visitedPages.includes(currentPath) && currentPath === '/quote/motor-selection') {
      const timeout = setTimeout(() => {
        triggerNudge('revisit', REVISIT_VARIANTS);
      }, 3000);
      return () => clearTimeout(timeout);
    } else {
      visitedPages.push(currentPath);
      sessionStorage.setItem(REVISIT_KEY, JSON.stringify([...new Set(visitedPages)]));
    }
  }, [location.pathname, triggerNudge]);

  // Reset page time and variants when route changes
  useEffect(() => {
    pageTimeRef.current = 0;
    scrollDepthRef.current = 0;
    hasTriggeredRef.current = false;
    setCurrentVariants([]);
    setTriggerType(null);
    setShouldShowNudge(false);
  }, [location.pathname]);

  // Time tracking
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        pageTimeRef.current += 1;
        siteTimeRef.current += 1;
        
        const config = getConfig();
        if (pageTimeRef.current >= config.timeThreshold) {
          triggerNudge('time', config.variants);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [getConfig, triggerNudge]);

  // Scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      lastActivityRef.current = Date.now();
      
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      
      if (scrollPercent > scrollDepthRef.current) {
        scrollDepthRef.current = scrollPercent;
        
        const config = getConfig();
        if (scrollPercent >= config.scrollThreshold) {
          triggerNudge('scroll', config.variants);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [getConfig, triggerNudge]);

  // Idle detection
  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const checkIdle = setInterval(() => {
      const idleTime = (Date.now() - lastActivityRef.current) / 1000;
      const config = getConfig();
      
      if (idleTime >= config.idleThreshold && pageTimeRef.current > 10) {
        triggerNudge('idle', config.variants);
      }
    }, 5000);

    window.addEventListener('mousemove', updateActivity, { passive: true });
    window.addEventListener('click', updateActivity, { passive: true });
    window.addEventListener('keydown', updateActivity, { passive: true });
    window.addEventListener('touchstart', updateActivity, { passive: true });

    return () => {
      clearInterval(checkIdle);
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
    };
  }, [getConfig, triggerNudge]);

  // Hide nudge when chat opens
  useEffect(() => {
    if (isChatOpen && shouldShowNudge) {
      setShouldShowNudge(false);
    }
  }, [isChatOpen, shouldShowNudge]);

  return {
    shouldShowNudge,
    triggerType,
    variants: currentVariants,
    timeOnPage: pageTimeRef.current,
    scrollDepth: scrollDepthRef.current,
    dismissNudge,
    resetTriggers
  };
};
