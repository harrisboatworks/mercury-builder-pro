import React, { createContext, useContext, useReducer, useEffect } from 'react';
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

  // Save to localStorage whenever state changes
  useEffect(() => {
    const dataToSave = {
      state,
      timestamp: Date.now()
    };
    localStorage.setItem('quoteBuilder', JSON.stringify(dataToSave));
  }, [state]);

  const isStepAccessible = (step: number): boolean => {
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
          return !!state.motor && !!state.boatInfo && (!!state.tradeInInfo || !state.hasTradein);
        } else {
          return !!state.motor && (!!state.tradeInInfo || !state.hasTradein);
        }
      case 6: // Quote display OR schedule
        if (state.purchasePath === 'installed') {
          return !!state.motor && !!state.boatInfo && !!state.installConfig && (!!state.tradeInInfo || !state.hasTradein);
        } else {
          return !!state.motor && (!!state.tradeInInfo || !state.hasTradein);
        }
      case 7: // Schedule consultation
        return !!state.motor;
      default:
        return false;
    }
  };

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

  return (
    <QuoteContext.Provider value={{ 
      state, 
      dispatch, 
      isStepAccessible,
      getQuoteData,
      clearQuote
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