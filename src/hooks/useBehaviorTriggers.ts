import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface TriggerConfig {
  timeThreshold: number; // seconds
  scrollThreshold: number; // percentage 0-100
  idleThreshold: number; // seconds
  message: string;
}

interface BehaviorTriggerResult {
  shouldShowNudge: boolean;
  nudgeMessage: string;
  triggerType: 'time' | 'scroll' | 'idle' | 'revisit' | null;
  dismissNudge: () => void;
  resetTriggers: () => void;
}

const PAGE_TRIGGERS: Record<string, TriggerConfig> = {
  '/quote/motor-selection': {
    timeThreshold: 45,
    scrollThreshold: 80,
    idleThreshold: 30,
    message: "Taking your time? I can help you compare motors!"
  },
  '/quote/summary': {
    timeThreshold: 60,
    scrollThreshold: 90,
    idleThreshold: 30,
    message: "Questions about your quote? I'm here to help!"
  },
  '/financing-application': {
    timeThreshold: 90,
    scrollThreshold: 70,
    idleThreshold: 60,
    message: "Need help with the application? Ask me anything!"
  },
  '/promotions': {
    timeThreshold: 60,
    scrollThreshold: 80,
    idleThreshold: 45,
    message: "Want to find the best deal for your boat?"
  },
  '/': {
    timeThreshold: 30,
    scrollThreshold: 70,
    idleThreshold: 40,
    message: "Looking for a new motor? I can help you find the perfect fit!"
  }
};

const DEFAULT_TRIGGER: TriggerConfig = {
  timeThreshold: 60,
  scrollThreshold: 85,
  idleThreshold: 45,
  message: "Have questions? I'm here to help!"
};

const SESSION_KEY = 'chat_nudge_dismissed';
const REVISIT_KEY = 'pages_visited_this_session';
const MIN_SITE_TIME = 15; // seconds before any trigger can fire

export const useBehaviorTriggers = (isChatOpen: boolean): BehaviorTriggerResult => {
  const location = useLocation();
  const [shouldShowNudge, setShouldShowNudge] = useState(false);
  const [nudgeMessage, setNudgeMessage] = useState('');
  const [triggerType, setTriggerType] = useState<'time' | 'scroll' | 'idle' | 'revisit' | null>(null);
  
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

  const triggerNudge = useCallback((type: 'time' | 'scroll' | 'idle' | 'revisit', message: string) => {
    if (hasTriggeredRef.current || isChatOpen) return;
    if (siteTimeRef.current < MIN_SITE_TIME) return;
    if (sessionStorage.getItem(SESSION_KEY) === 'true') return;

    hasTriggeredRef.current = true;
    setTriggerType(type);
    setNudgeMessage(message);
    setShouldShowNudge(true);
  }, [isChatOpen]);

  // Check for page revisit
  useEffect(() => {
    const visitedPages = JSON.parse(sessionStorage.getItem(REVISIT_KEY) || '[]') as string[];
    const currentPath = location.pathname;
    
    if (visitedPages.includes(currentPath) && currentPath === '/quote/motor-selection') {
      // Small delay before showing revisit trigger
      const timeout = setTimeout(() => {
        triggerNudge('revisit', "Welcome back! Still deciding? I can help!");
      }, 3000);
      return () => clearTimeout(timeout);
    } else {
      visitedPages.push(currentPath);
      sessionStorage.setItem(REVISIT_KEY, JSON.stringify([...new Set(visitedPages)]));
    }
  }, [location.pathname, triggerNudge]);

  // Reset page time when route changes
  useEffect(() => {
    pageTimeRef.current = 0;
    scrollDepthRef.current = 0;
  }, [location.pathname]);

  // Time tracking
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        pageTimeRef.current += 1;
        siteTimeRef.current += 1;
        
        const config = getConfig();
        if (pageTimeRef.current >= config.timeThreshold) {
          triggerNudge('time', config.message);
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
          triggerNudge('scroll', config.message);
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
        triggerNudge('idle', config.message);
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
    nudgeMessage,
    triggerType,
    dismissNudge,
    resetTriggers
  };
};
