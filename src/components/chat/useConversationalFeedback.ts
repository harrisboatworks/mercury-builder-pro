// Hook for managing conversational feedback bar state and messaging
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuote } from '@/contexts/QuoteContext';
import { money } from '@/lib/money';
import {
  ConversationalNudge,
  WELCOME_MESSAGES,
  ACTION_PROMPTS,
  ENGAGING_QUESTIONS,
  CORRECTION_NUDGES,
  REACTION_MESSAGES,
  PROGRESS_MESSAGES,
  SOCIAL_PROOF,
  OFFER_HELP,
  MOTOR_FAMILY_TIPS,
  pickRandom,
  getMotorFamilyKey,
} from './conversationalMessages';

export type NudgeType = 'welcome' | 'action' | 'question' | 'correction' | 'reaction' | 'progress' | 'social' | 'offer-help' | 'default';

export interface ActiveNudge extends ConversationalNudge {
  type: NudgeType;
}

interface FeedbackState {
  activeNudge: ActiveNudge | null;
  recentAction: string | null;
  pageEntryTime: number;
  secondsOnPage: number;
}

export const useConversationalFeedback = () => {
  const location = useLocation();
  const { state } = useQuote();
  
  const [feedbackState, setFeedbackState] = useState<FeedbackState>({
    activeNudge: null,
    recentAction: null,
    pageEntryTime: Date.now(),
    secondsOnPage: 0,
  });

  // Track previous values for detecting changes
  const prevMotorRef = useRef(state.motor?.id);
  const prevOptionsRef = useRef(state.selectedOptions?.length);
  const prevTradeInRef = useRef(state.tradeInInfo?.estimatedValue);
  const prevBoatInfoRef = useRef(state.boatInfo?.type);
  const prevPathRef = useRef(location.pathname);

  // Display motor (preview or selected)
  const displayMotor = state.previewMotor || state.motor;
  const isPreview = !!state.previewMotor;
  const hasMotor = !!displayMotor;

  // Calculate progress
  const quoteProgress = useMemo(() => {
    let completed = 0;
    if (state.motor) completed++;
    if (state.purchasePath) completed++;
    if (state.boatInfo?.type) completed++;
    if (state.tradeInInfo !== undefined) completed++;
    if (state.installConfig) completed++;
    if (state.fuelTankConfig) completed++;
    return { completed, total: 6, remaining: 6 - completed };
  }, [state.motor, state.purchasePath, state.boatInfo, state.tradeInInfo, state.installConfig, state.fuelTankConfig]);

  // Reset timer on page change
  useEffect(() => {
    if (location.pathname !== prevPathRef.current) {
      setFeedbackState(prev => ({
        ...prev,
        pageEntryTime: Date.now(),
        secondsOnPage: 0,
        recentAction: null,
      }));
      prevPathRef.current = location.pathname;
    }
  }, [location.pathname]);

  // Page timer
  useEffect(() => {
    const timer = setInterval(() => {
      setFeedbackState(prev => ({
        ...prev,
        secondsOnPage: Math.floor((Date.now() - prev.pageEntryTime) / 1000),
      }));
    }, 1000);

    // Reset on user interaction
    const resetTimer = () => {
      setFeedbackState(prev => ({
        ...prev,
        pageEntryTime: Date.now(),
        secondsOnPage: 0,
      }));
    };

    window.addEventListener('touchstart', resetTimer, { passive: true });
    window.addEventListener('scroll', resetTimer, { passive: true });

    return () => {
      clearInterval(timer);
      window.removeEventListener('touchstart', resetTimer);
      window.removeEventListener('scroll', resetTimer);
    };
  }, []);

  // Detect user actions and set reaction messages
  useEffect(() => {
    // Motor selected
    if (state.motor?.id && state.motor.id !== prevMotorRef.current) {
      const hp = state.motor.hp || 0;
      const model = state.motor.model?.toLowerCase() || '';
      
      let actionType = 'motor-selected';
      if (hp >= 150) actionType = 'high-hp-selected';
      if (model.includes('prokicker')) actionType = 'prokicker-selected';
      
      setFeedbackState(prev => ({ ...prev, recentAction: actionType }));
      
      const timer = setTimeout(() => {
        setFeedbackState(prev => ({ ...prev, recentAction: null }));
      }, 4000);
      
      prevMotorRef.current = state.motor.id;
      return () => clearTimeout(timer);
    }
    prevMotorRef.current = state.motor?.id;
  }, [state.motor?.id, state.motor?.hp, state.motor?.model]);

  useEffect(() => {
    // Package/options selected
    const currentLength = state.selectedOptions?.length || 0;
    const prevLength = prevOptionsRef.current || 0;
    if (currentLength > 0 && currentLength !== prevLength) {
      setFeedbackState(prev => ({ ...prev, recentAction: 'package-selected' }));
      
      const timer = setTimeout(() => {
        setFeedbackState(prev => ({ ...prev, recentAction: null }));
      }, 4000);
      
      prevOptionsRef.current = currentLength;
      return () => clearTimeout(timer);
    }
    prevOptionsRef.current = currentLength;
  }, [state.selectedOptions?.length]);

  useEffect(() => {
    // Trade-in applied
    if (state.tradeInInfo?.estimatedValue && state.tradeInInfo.estimatedValue !== prevTradeInRef.current) {
      setFeedbackState(prev => ({ ...prev, recentAction: 'trade-in-applied' }));
      
      const timer = setTimeout(() => {
        setFeedbackState(prev => ({ ...prev, recentAction: null }));
      }, 4000);
      
      prevTradeInRef.current = state.tradeInInfo.estimatedValue;
      return () => clearTimeout(timer);
    }
    prevTradeInRef.current = state.tradeInInfo?.estimatedValue;
  }, [state.tradeInInfo?.estimatedValue]);

  useEffect(() => {
    // Boat info complete
    if (state.boatInfo?.type && state.boatInfo.type !== prevBoatInfoRef.current) {
      setFeedbackState(prev => ({ ...prev, recentAction: 'boat-info-complete' }));
      
      const timer = setTimeout(() => {
        setFeedbackState(prev => ({ ...prev, recentAction: null }));
      }, 3000);
      
      prevBoatInfoRef.current = state.boatInfo.type;
      return () => clearTimeout(timer);
    }
    prevBoatInfoRef.current = state.boatInfo?.type;
  }, [state.boatInfo?.type]);

  // Build AI context for when user taps to chat
  const buildAIContext = useCallback(() => {
    const hasPackage = (state.selectedOptions?.length || 0) > 0;
    return {
      currentPage: location.pathname,
      currentNudge: feedbackState.activeNudge?.message,
      motor: displayMotor ? {
        hp: displayMotor.hp,
        model: displayMotor.model,
        price: displayMotor.price || displayMotor.msrp,
        family: getMotorFamilyKey(displayMotor.model),
      } : null,
      isPreviewingMotor: isPreview,
      quoteProgress: {
        completed: quoteProgress.completed,
        remaining: quoteProgress.remaining,
        hasPackage,
        hasTradeIn: !!state.tradeInInfo?.estimatedValue,
        tradeInValue: state.tradeInInfo?.estimatedValue,
      },
      secondsOnPage: feedbackState.secondsOnPage,
    };
  }, [location.pathname, feedbackState.activeNudge, displayMotor, isPreview, quoteProgress, state.selectedOptions?.length, state.tradeInInfo, feedbackState.secondsOnPage]);

  // Calculate the active nudge based on timing and state
  const activeNudge = useMemo((): ActiveNudge | null => {
    const path = location.pathname;
    const { secondsOnPage, recentAction } = feedbackState;
    
    // Priority 0: Reaction to recent action (highest priority)
    if (recentAction && REACTION_MESSAGES[recentAction]) {
      const reaction = pickRandom(REACTION_MESSAGES[recentAction]);
      // Replace placeholders
      let message = reaction.message;
      if (recentAction === 'trade-in-applied' && state.tradeInInfo?.estimatedValue) {
        message = `Boom! ${money(state.tradeInInfo.estimatedValue)} coming off the top 🎉`;
      }
      return { ...reaction, message, type: 'reaction' };
    }

    // Priority 1: Welcome message (0-3 seconds)
    if (secondsOnPage < 3 && WELCOME_MESSAGES[path]) {
      const welcome = pickRandom(WELCOME_MESSAGES[path]);
      return { ...welcome, type: 'welcome' };
    }

    // Priority 2: Motor family tip when previewing (3-10 seconds)
    if (isPreview && secondsOnPage >= 3 && secondsOnPage < 10) {
      const familyKey = getMotorFamilyKey(displayMotor?.model);
      if (familyKey && MOTOR_FAMILY_TIPS[familyKey]) {
        const tip = pickRandom(MOTOR_FAMILY_TIPS[familyKey]);
        return { ...tip, type: 'action' };
      }
    }

    // Priority 3: Action prompt (3-10 seconds)
    if (secondsOnPage >= 3 && secondsOnPage < 10 && ACTION_PROMPTS[path]) {
      const prompts = ACTION_PROMPTS[path];
      const index = Math.floor(secondsOnPage / 3) % prompts.length;
      return { ...prompts[index], type: 'action' };
    }

    // Priority 4: Engaging question (10-20 seconds)
    if (secondsOnPage >= 10 && secondsOnPage < 20 && ENGAGING_QUESTIONS[path]) {
      const questions = ENGAGING_QUESTIONS[path];
      const index = Math.floor((secondsOnPage - 10) / 5) % questions.length;
      return { ...questions[index], type: 'question' };
    }

    // Priority 5: Progress encouragement (20-30 seconds, if making progress)
    if (secondsOnPage >= 20 && secondsOnPage < 30 && quoteProgress.completed >= 1) {
      const progressMsg = PROGRESS_MESSAGES[quoteProgress.completed];
      if (progressMsg) {
        return { ...progressMsg, type: 'progress' };
      }
    }

    // Priority 6: Gentle correction if needed
    if (secondsOnPage >= 15) {
      const hasOptions = (state.selectedOptions?.length || 0) > 0;
      // Check for skipping options quickly
      if (path === '/quote/purchase-path' && !hasOptions && secondsOnPage < 20) {
        return { ...CORRECTION_NUDGES['skipping-options-fast'], type: 'correction' };
      }
    }

    // Priority 7: Social proof (30-45 seconds)
    if (secondsOnPage >= 30 && secondsOnPage < 45) {
      const index = Math.floor((secondsOnPage - 30) / 5) % SOCIAL_PROOF.length;
      return { ...SOCIAL_PROOF[index], type: 'social' };
    }

    // Priority 8: Offer help (45+ seconds)
    if (secondsOnPage >= 45) {
      const index = Math.floor((secondsOnPage - 45) / 15) % OFFER_HELP.length;
      return { ...OFFER_HELP[index], type: 'offer-help' };
    }

    return null;
  }, [
    location.pathname,
    feedbackState.secondsOnPage,
    feedbackState.recentAction,
    state.tradeInInfo?.estimatedValue,
    state.selectedOptions?.length,
    displayMotor?.model,
    displayMotor?.hp,
    isPreview,
    quoteProgress.completed,
  ]);

  // Update active nudge in state
  useEffect(() => {
    setFeedbackState(prev => ({ ...prev, activeNudge }));
  }, [activeNudge]);

  return {
    activeNudge,
    recentAction: feedbackState.recentAction,
    secondsOnPage: feedbackState.secondsOnPage,
    quoteProgress,
    displayMotor,
    isPreview,
    hasMotor,
    buildAIContext,
  };
};
