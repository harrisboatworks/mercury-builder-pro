import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef, useMemo, useState } from 'react';
import { Motor, BoatInfo, QuoteData } from '@/components/QuoteBuilder';
import { findMotorSpecs, type MercuryMotor } from '@/lib/data/mercury-motors';

interface WarrantyConfig {
  extendedYears: number;
  warrantyPrice: number;
  totalYears: number;
}

interface QuoteState {
  motor: Motor | null;
  motorSpecs: MercuryMotor | null; // Full specs available for AI assistant
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
  warrantyConfig: WarrantyConfig | null;
  hasTradein: boolean;
  completedSteps: number[];
  currentStep: number;
  isLoading: boolean;
  uiFlags: {
    // Can add other UI flags here if needed in the future
  };
}

type QuoteAction = 
  | { type: 'SET_MOTOR'; payload: Motor }
  | { type: 'SET_PURCHASE_PATH'; payload: 'loose' | 'installed' }
  | { type: 'SET_BOAT_INFO'; payload: BoatInfo }
  | { type: 'SET_TRADE_IN_INFO'; payload: any }
  | { type: 'SET_FUEL_TANK_CONFIG'; payload: any }
  | { type: 'SET_INSTALL_CONFIG'; payload: any }
  | { type: 'SET_FINANCING'; payload: { downPayment: number; term: number; rate: number } }
  | { type: 'SET_WARRANTY_CONFIG'; payload: WarrantyConfig }
  | { type: 'SET_HAS_TRADEIN'; payload: boolean }
  | { type: 'COMPLETE_STEP'; payload: number }
  | { type: 'SET_CURRENT_STEP'; payload: number }
  | { type: 'LOAD_FROM_STORAGE'; payload: QuoteState }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_UI_FLAG'; payload: { key: string; value: any } }
  | { type: 'RESET_QUOTE' };

const initialState: QuoteState = {
  motor: null,
  motorSpecs: null,
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
  warrantyConfig: null,
  hasTradein: false,
  completedSteps: [],
  currentStep: 1,
  isLoading: true,
  uiFlags: {
    // Can add other UI flags here if needed in the future
  }
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
      const motorSpecs = findMotorSpecs(action.payload.hp, action.payload.model);
      return { ...state, motor: action.payload, motorSpecs };
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
    case 'SET_WARRANTY_CONFIG':
      return { ...state, warrantyConfig: action.payload };
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
    case 'SET_UI_FLAG':
      return { 
        ...state, 
        uiFlags: { 
          ...state.uiFlags, 
          [action.payload.key]: action.payload.value 
        } 
      };
    case 'RESET_QUOTE':
      return { ...initialState, isLoading: false };
    default:
      return state;
  }
}

export const QuoteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(quoteReducer, initialState);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const prevTradeInRef = useRef<any>(undefined);
  const [navigationBlocked, setNavigationBlocked] = useState(false);

  // Clear localStorage helper
  const clearStoredQuote = useCallback(() => {
    localStorage.removeItem('quoteBuilder');
    console.log('🧹 Cleared quote from localStorage');
  }, []);

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }

    // Auto-clear after 30 minutes of inactivity
    inactivityTimeoutRef.current = setTimeout(() => {
      console.log('⏰ 30 minutes of inactivity - clearing quote data');
      clearStoredQuote();
    }, 30 * 60 * 1000);
  }, [clearStoredQuote]);

  // Load from localStorage on mount
  useEffect(() => {
    console.log('🔄 QuoteContext: Starting localStorage load...');
    
    // Safety timeout to prevent infinite loading - reduced to 3 seconds for faster recovery
    const loadingTimeout = setTimeout(() => {
      console.warn('⚠️ QuoteContext: Loading timeout reached (3s), forcing isLoading: false');
      dispatch({ type: 'SET_LOADING', payload: false });
    }, 3000);

    try {
      const saved = localStorage.getItem('quoteBuilder');
      console.log('📦 QuoteContext: localStorage data found:', !!saved);
      
      if (saved) {
        try {
          const parsedData = JSON.parse(saved);
          console.log('✅ QuoteContext: Data parsed successfully', {
            hasState: !!parsedData.state,
            hasMotor: !!parsedData.state?.motor,
            timestamp: parsedData.timestamp ? new Date(parsedData.timestamp).toLocaleString() : 'No timestamp'
          });
          
          // Check if data structure is valid
          if (!parsedData.state || typeof parsedData.state !== 'object') {
            console.warn('⚠️ QuoteContext: Invalid data structure, removing');
            clearStoredQuote();
            dispatch({ type: 'SET_LOADING', payload: false });
            return;
          }
          
          // Check if data is not too old (24 hours) and not inactive for 30 minutes
          const dataAge = parsedData.timestamp ? Date.now() - parsedData.timestamp : Infinity;
          const maxAge = 24 * 60 * 60 * 1000; // 24 hours
          const lastActivity = parsedData.lastActivity || parsedData.timestamp || 0;
          const inactivityDuration = Date.now() - lastActivity;
          
          if (parsedData.timestamp && dataAge < maxAge && inactivityDuration < 30 * 60 * 1000) {
            console.log('✅ QuoteContext: Data is fresh, loading state', {
              ageHours: Math.round(dataAge / (60 * 60 * 1000) * 10) / 10
            });
            dispatch({ type: 'LOAD_FROM_STORAGE', payload: parsedData.state });
            resetInactivityTimer();
            // Add a small delay to ensure the reducer has finished processing
            setTimeout(() => {
              dispatch({ type: 'SET_LOADING', payload: false });
            }, 100);
            clearTimeout(loadingTimeout); // Clear the safety timeout
            return; // Exit early so we don't set isLoading = false again below
          } else {
            console.log('⏰ QuoteContext: Data is stale or inactive, removing', {
              hasTimestamp: !!parsedData.timestamp,
              ageHours: parsedData.timestamp ? Math.round(dataAge / (60 * 60 * 1000) * 10) / 10 : 'unknown'
            });
            clearStoredQuote();
            dispatch({ type: 'SET_LOADING', payload: false });
          }
        } catch (parseError) {
          console.error('❌ QuoteContext: JSON parse error:', parseError);
          console.log('🧹 QuoteContext: Cleaning up corrupted localStorage data');
          try {
            clearStoredQuote();
          } catch (cleanupError) {
            console.error('❌ QuoteContext: Failed to cleanup localStorage:', cleanupError);
          }
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } else {
        console.log('📭 QuoteContext: No saved data found');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      console.error('❌ QuoteContext: Unexpected error during load:', error);
      // Try to clear potentially corrupted data
      try {
        clearStoredQuote();
        console.log('🧹 QuoteContext: Cleared localStorage after error');
      } catch (cleanupError) {
        console.error('❌ QuoteContext: Failed to cleanup after error:', cleanupError);
      }
      dispatch({ type: 'SET_LOADING', payload: false });
    } finally {
      clearTimeout(loadingTimeout);
      console.log('🏁 QuoteContext: Load process completed');
    }

    return () => {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
    };
  }, [clearStoredQuote, resetInactivityTimer]);

  // Debounced save to localStorage with immediate save for trade-in changes
  useEffect(() => {
    if (state.isLoading) return; // Don't save during initial load
    
    // Initialize ref on first run if undefined
    if (prevTradeInRef.current === undefined) {
      prevTradeInRef.current = state.tradeInInfo;
    }
    
    // Check if trade-in specifically changed using deep comparison
    const currentTradeInStr = JSON.stringify(state.tradeInInfo);
    const prevTradeInStr = JSON.stringify(prevTradeInRef.current);
    const tradeInChanged = currentTradeInStr !== prevTradeInStr;
    
    if (tradeInChanged && state.tradeInInfo !== undefined) {
      prevTradeInRef.current = state.tradeInInfo;
      resetInactivityTimer(); // Reset on activity
      
      try {
        const dataToSave = {
          state,
          timestamp: Date.now(),
          lastActivity: Date.now()
        };
        localStorage.setItem('quoteBuilder', JSON.stringify(dataToSave));
        console.log('💾 QuoteContext: Immediate save for trade-in change', {
          hasTradeIn: state.tradeInInfo?.hasTradeIn,
          estimatedValue: state.tradeInInfo?.estimatedValue,
          brand: state.tradeInInfo?.brand
        });
        return; // Skip debounced save
      } catch (error) {
        console.error('❌ QuoteContext: Failed to save trade-in:', error);
      }
    }
    
    // Regular debounced save for other changes
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      resetInactivityTimer(); // Reset on activity
      
      try {
        const dataToSave = {
          state,
          timestamp: Date.now(),
          lastActivity: Date.now()
        };
        localStorage.setItem('quoteBuilder', JSON.stringify(dataToSave));
        console.log('💾 QuoteContext: Quote data saved to localStorage', {
          hasMotor: !!state.motor,
          purchasePath: state.purchasePath,
          timestamp: new Date().toLocaleString()
        });
      } catch (error) {
        console.error('❌ QuoteContext: Failed to save to localStorage:', error);
        // Don't throw error, just log it - continue operating without persistence
      }
    }, 1000); // Increased to 1000ms debounce for better performance
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state, resetInactivityTimer]);

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
          // More robust: if hasTradein is false OR if hasTradein is true AND tradeInInfo exists
          const tradeInSatisfied = !state.hasTradein || (state.hasTradein && !!state.tradeInInfo);
          const isAccessible = hasMotor && hasPath && hasBoatInfo && tradeInSatisfied;
          
          if (!isAccessible) {
            console.log('Step 6 accessibility check failed (installed path):', {
              hasMotor,
              hasPath,
              hasBoatInfo,
              hasTradein: state.hasTradein,
              hasTradeInInfo: !!state.tradeInInfo,
              tradeInSatisfied
            });
          }
          
          return isAccessible;
        } else {
          // More robust: if hasTradein is false OR if hasTradein is true AND tradeInInfo exists
          const tradeInSatisfied = !state.hasTradein || (state.hasTradein && !!state.tradeInInfo);
          const isAccessible = hasMotor && hasPath && tradeInSatisfied;
          
          if (!isAccessible) {
            console.log('Step 6 accessibility check failed (motor-only path):', {
              hasMotor,
              hasPath,
              hasTradein: state.hasTradein,
              hasTradeInInfo: !!state.tradeInInfo,
              tradeInSatisfied
            });
          }
          
          return isAccessible;
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
    warrantyConfig: state.warrantyConfig,
    hasTradein: state.hasTradein
  });

  const clearQuote = () => {
    console.log('🧹 QuoteContext: Clearing quote and localStorage');
    try {
      localStorage.removeItem('quoteBuilder');
      console.log('✅ QuoteContext: localStorage cleared successfully');
    } catch (error) {
      console.error('❌ QuoteContext: Failed to clear localStorage:', error);
    }
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