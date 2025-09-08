import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef, useMemo, useState } from 'react';
import { Motor, BoatInfo, QuoteData } from '@/components/QuoteBuilder';

interface QuoteState {
  motor: Motor | null;
  purchasePath: 'loose' | 'installed' | null;
  boatInfo: BoatInfo | null;
  tradeInInfo: any | null;
  fuelTankConfig: any | null;
  installConfig: any | null;
  financing: {
    downPayment: number;
    term: number;
    rate: number;
  };
  hasTradein: boolean;
  completedSteps: number[];
  currentStep: number;
  isLoading: boolean;
}

type QuoteAction = 
  | { type: 'SET_MOTOR'; payload: Motor }
  | { type: 'SET_PURCHASE_PATH'; payload: 'loose' | 'installed' }
  | { type: 'SET_BOAT_INFO'; payload: BoatInfo }
  | { type: 'SET_TRADE_IN_INFO'; payload: any }
  | { type: 'SET_FUEL_TANK_CONFIG'; payload: any }
  | { type: 'SET_INSTALL_CONFIG'; payload: any }
  | { type: 'SET_FINANCING'; payload: { downPayment: number; term: number; rate: number } }
  | { type: 'SET_HAS_TRADEIN'; payload: boolean }
  | { type: 'COMPLETE_STEP'; payload: number }
  | { type: 'SET_CURRENT_STEP'; payload: number }
  | { type: 'LOAD_FROM_STORAGE'; payload: QuoteState }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'RESET_QUOTE' };

const initialState: QuoteState = {
  motor: null,
  purchasePath: null,
  boatInfo: null,
  tradeInInfo: null,
  fuelTankConfig: null,
  installConfig: null,
  financing: {
    downPayment: 0,
    term: 48,
    rate: 7.99
  },
  hasTradein: false,
  completedSteps: [],
  currentStep: 1,
  isLoading: true
};

const QuoteContext = createContext<{
  state: QuoteState;
  dispatch: React.Dispatch<QuoteAction>;
  isStepAccessible: (step: number) => boolean;
  getQuoteData: () => QuoteData;
  clearQuote: () => void;
  isNavigationBlocked: boolean;
  isQuoteComplete: () => boolean;
  getQuoteCompletionStatus: () => {
    hasMotor: boolean;
    hasPath: boolean;
    hasRequiredInfo: boolean;
    isComplete: boolean;
  };
} | null>(null);

function quoteReducer(state: QuoteState, action: QuoteAction): QuoteState {
  switch (action.type) {
    case 'SET_MOTOR':
      return { ...state, motor: action.payload };
    case 'SET_PURCHASE_PATH':
      return { ...state, purchasePath: action.payload };
    case 'SET_BOAT_INFO':
      return { ...state, boatInfo: action.payload };
    case 'SET_TRADE_IN_INFO':
      return { ...state, tradeInInfo: action.payload };
    case 'SET_FUEL_TANK_CONFIG':
      return { ...state, fuelTankConfig: action.payload };
    case 'SET_INSTALL_CONFIG':
      return { ...state, installConfig: action.payload };
    case 'SET_FINANCING':
      return { ...state, financing: action.payload };
    case 'SET_HAS_TRADEIN':
      return { ...state, hasTradein: action.payload };
    case 'COMPLETE_STEP':
      return { 
        ...state, 
        completedSteps: [...state.completedSteps.filter(s => s !== action.payload), action.payload]
      };
    case 'SET_CURRENT_STEP':
      return { ...state, currentStep: action.payload };
    case 'LOAD_FROM_STORAGE':
      return { ...action.payload, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'RESET_QUOTE':
      return initialState;
    default:
      return state;
  }
}

export const QuoteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(quoteReducer, initialState);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [navigationBlocked, setNavigationBlocked] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('quoteBuilder');
    if (saved) {
      try {
        const parsedData = JSON.parse(saved);
        // Check if data is not too old (24 hours)
        if (parsedData.timestamp && Date.now() - parsedData.timestamp < 24 * 60 * 60 * 1000) {
          dispatch({ type: 'LOAD_FROM_STORAGE', payload: parsedData.state });
        } else {
          localStorage.removeItem('quoteBuilder');
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        localStorage.removeItem('quoteBuilder');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Debounced save to localStorage - increased to 1000ms for better performance
  useEffect(() => {
    if (state.isLoading) return; // Don't save during initial load
    
    // Block navigation during state updates to prevent instability
    setNavigationBlocked(true);
    const unblockTimeout = setTimeout(() => setNavigationBlocked(false), 100);
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      const dataToSave = {
        state,
        timestamp: Date.now()
      };
      localStorage.setItem('quoteBuilder', JSON.stringify(dataToSave));
    }, 1000); // Increased to 1000ms debounce for better performance
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      clearTimeout(unblockTimeout);
    };
  }, [state]);

  const isStepAccessible = useMemo(() => (step: number): boolean => {
    switch (step) {
      case 1: // Motor selection
        return true;
      case 2: // Purchase path
        return !!state.motor;
      case 3: // Boat info OR fuel tank config
        return !!state.motor && !!state.purchasePath;
      case 4: // Trade-in OR installation config
        if (state.purchasePath === 'installed') {
          return !!state.motor && !!state.purchasePath && !!state.boatInfo;
        } else {
          return !!state.motor && !!state.purchasePath;
        }
      case 5: // Installation config OR quote display
        if (state.purchasePath === 'installed') {
          return !!state.motor && !!state.boatInfo && state.completedSteps.includes(4);
        } else {
          return !!state.motor && state.completedSteps.includes(4);
        }
      case 6: // Quote display OR schedule
        // More robust check for step 6 - ensure basic requirements are met
        const hasMotor = !!state.motor;
        const hasPath = !!state.purchasePath;
        
        if (state.purchasePath === 'installed') {
          const hasBoatInfo = !!state.boatInfo;
          const tradeInSatisfied = state.hasTradein ? !!state.tradeInInfo : true;
          return hasMotor && hasPath && hasBoatInfo && tradeInSatisfied;
        } else {
          const tradeInSatisfied = state.hasTradein ? !!state.tradeInInfo : true;
          return hasMotor && hasPath && tradeInSatisfied;
        }
      case 7: // Schedule consultation
        return !!state.motor;
      default:
        return false;
    }
  }, [state.motor, state.purchasePath, state.boatInfo, state.completedSteps, state.hasTradein, state.tradeInInfo, state.installConfig]);

  const getQuoteData = (): QuoteData => ({
    motor: state.motor,
    boatInfo: state.boatInfo,
    financing: state.financing,
    hasTradein: state.hasTradein
  });

  const clearQuote = () => {
    localStorage.removeItem('quoteBuilder');
    dispatch({ type: 'RESET_QUOTE' });
  };

  const isQuoteComplete = useCallback((): boolean => {
    const hasMotor = !!state.motor;
    const hasPath = !!state.purchasePath;
    
    if (!hasMotor || !hasPath) return false;
    
    if (state.purchasePath === 'installed') {
      const hasBoatInfo = !!state.boatInfo;
      const tradeInSatisfied = state.hasTradein ? !!state.tradeInInfo : true;
      return hasMotor && hasPath && hasBoatInfo && tradeInSatisfied;
    } else {
      const tradeInSatisfied = state.hasTradein ? !!state.tradeInInfo : true;
      return hasMotor && hasPath && tradeInSatisfied;
    }
  }, [state.motor, state.purchasePath, state.boatInfo, state.hasTradein, state.tradeInInfo]);

  const getQuoteCompletionStatus = useCallback(() => {
    const hasMotor = !!state.motor;
    const hasPath = !!state.purchasePath;
    
    let hasRequiredInfo = false;
    if (state.purchasePath === 'installed') {
      hasRequiredInfo = !!state.boatInfo;
    } else {
      hasRequiredInfo = true; // Loose path doesn't require boat info
    }
    
    const tradeInSatisfied = state.hasTradein ? !!state.tradeInInfo : true;
    const isComplete = hasMotor && hasPath && hasRequiredInfo && tradeInSatisfied;
    
    return {
      hasMotor,
      hasPath,
      hasRequiredInfo,
      isComplete
    };
  }, [state.motor, state.purchasePath, state.boatInfo, state.hasTradein, state.tradeInInfo]);

  return (
    <QuoteContext.Provider value={{ 
      state, 
      dispatch, 
      isStepAccessible,
      getQuoteData,
      clearQuote,
      isNavigationBlocked: navigationBlocked,
      isQuoteComplete,
      getQuoteCompletionStatus
    }}>
      {children}
    </QuoteContext.Provider>
  );
};

export const useQuote = () => {
  const context = useContext(QuoteContext);
  if (!context) {
    throw new Error('useQuote must be used within a QuoteProvider');
  }
  return context;
};