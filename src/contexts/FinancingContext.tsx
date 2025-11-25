import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { 
  PurchaseDetails, 
  Applicant, 
  Employment, 
  Financial, 
  CoApplicant, 
  References, 
  Consent 
} from '@/lib/financingValidation';

interface FinancingState {
  applicationId: string | null;
  resumeToken: string | null;
  currentStep: number;
  completedSteps: number[];
  isLoading: boolean;
  isSaving: boolean;
  
  // Form data for each step
  purchaseDetails: Partial<PurchaseDetails> | null;
  applicant: Partial<Applicant> | null;
  employment: Partial<Employment> | null;
  financial: Partial<Financial> | null;
  coApplicant: Partial<CoApplicant> | null;
  hasCoApplicant: boolean;
  references: Partial<References> | null;
  consent: Partial<Consent> | null;
  
  // Pre-fill from quote
  quoteId: string | null;
}

type FinancingAction =
  | { type: 'SET_APPLICATION_ID'; payload: string }
  | { type: 'SET_RESUME_TOKEN'; payload: string }
  | { type: 'SET_CURRENT_STEP'; payload: number }
  | { type: 'COMPLETE_STEP'; payload: number }
  | { type: 'SET_PURCHASE_DETAILS'; payload: Partial<PurchaseDetails> }
  | { type: 'SET_APPLICANT'; payload: Partial<Applicant> }
  | { type: 'SET_EMPLOYMENT'; payload: Partial<Employment> }
  | { type: 'SET_FINANCIAL'; payload: Partial<Financial> }
  | { type: 'SET_CO_APPLICANT'; payload: Partial<CoApplicant> | null }
  | { type: 'SET_HAS_CO_APPLICANT'; payload: boolean }
  | { type: 'SET_REFERENCES'; payload: Partial<References> }
  | { type: 'SET_CONSENT'; payload: Partial<Consent> }
  | { type: 'SET_QUOTE_ID'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'LOAD_FROM_STORAGE'; payload: Partial<FinancingState> }
  | { type: 'LOAD_FROM_DATABASE'; payload: any }
  | { type: 'RESET_APPLICATION' };

const initialState: FinancingState = {
  applicationId: null,
  resumeToken: null,
  currentStep: 1,
  completedSteps: [],
  isLoading: false,
  isSaving: false,
  purchaseDetails: null,
  applicant: null,
  employment: null,
  financial: null,
  coApplicant: null,
  hasCoApplicant: false,
  references: null,
  consent: null,
  quoteId: null,
};

function financingReducer(state: FinancingState, action: FinancingAction): FinancingState {
  switch (action.type) {
    case 'SET_APPLICATION_ID':
      return { ...state, applicationId: action.payload };
    case 'SET_RESUME_TOKEN':
      return { ...state, resumeToken: action.payload };
    case 'SET_CURRENT_STEP':
      return { ...state, currentStep: action.payload };
    case 'COMPLETE_STEP':
      return {
        ...state,
        completedSteps: [...new Set([...state.completedSteps, action.payload])].sort(),
      };
    case 'SET_PURCHASE_DETAILS':
      return { ...state, purchaseDetails: { ...state.purchaseDetails, ...action.payload } };
    case 'SET_APPLICANT':
      return { ...state, applicant: { ...state.applicant, ...action.payload } };
    case 'SET_EMPLOYMENT':
      return { ...state, employment: { ...state.employment, ...action.payload } };
    case 'SET_FINANCIAL':
      return { ...state, financial: { ...state.financial, ...action.payload } };
    case 'SET_CO_APPLICANT':
      return { ...state, coApplicant: action.payload };
    case 'SET_HAS_CO_APPLICANT':
      return { ...state, hasCoApplicant: action.payload };
    case 'SET_REFERENCES':
      return { ...state, references: { ...state.references, ...action.payload } };
    case 'SET_CONSENT':
      return { ...state, consent: { ...state.consent, ...action.payload } };
    case 'SET_QUOTE_ID':
      return { ...state, quoteId: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_SAVING':
      return { ...state, isSaving: action.payload };
    case 'LOAD_FROM_STORAGE':
      return { ...state, ...action.payload, isLoading: false };
    case 'LOAD_FROM_DATABASE':
      return {
        ...state,
        applicationId: action.payload.id,
        resumeToken: action.payload.resume_token,
        currentStep: action.payload.current_step || 1,
        completedSteps: action.payload.completed_steps || [],
        purchaseDetails: action.payload.purchase_data || null,
        applicant: action.payload.applicant_data || null,
        employment: action.payload.employment_data || null,
        financial: action.payload.financial_data || null,
        coApplicant: action.payload.co_applicant_data || null,
        hasCoApplicant: !!action.payload.co_applicant_data,
        references: action.payload.references_data || null,
        quoteId: action.payload.quote_id || null,
        isLoading: false,
      };
    case 'RESET_APPLICATION':
      return { ...initialState };
    default:
      return state;
  }
}

interface FinancingContextType {
  state: FinancingState;
  dispatch: React.Dispatch<FinancingAction>;
  saveToDatabase: () => Promise<{ applicationId: string; resumeToken: string } | undefined>;
  isStepComplete: (step: number) => boolean;
  canAccessStep: (step: number) => boolean;
  clearStoredData: () => void;
}

const FinancingContext = createContext<FinancingContextType | null>(null);

export const FinancingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(financingReducer, initialState);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Clear localStorage helper
  const clearStoredData = useCallback(() => {
    localStorage.removeItem('financingApplication');
    console.log('🧹 Cleared financing application from localStorage');
  }, []);

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }

    // Auto-clear after 30 minutes of inactivity
    inactivityTimeoutRef.current = setTimeout(() => {
      console.log('⏰ 30 minutes of inactivity - clearing sensitive data');
      clearStoredData();
    }, 30 * 60 * 1000);
  }, [clearStoredData]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('financingApplication');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Check if data is not too old (7 days) and not inactive for 30 minutes
        const age = Date.now() - (parsed.timestamp || 0);
        const lastActivity = parsed.lastActivity || parsed.timestamp || 0;
        const inactivityDuration = Date.now() - lastActivity;
        
        if (parsed.timestamp && age < 7 * 24 * 60 * 60 * 1000 && inactivityDuration < 30 * 60 * 1000) {
          dispatch({ type: 'LOAD_FROM_STORAGE', payload: parsed.state });
          resetInactivityTimer();
        } else {
          clearStoredData();
        }
      } catch (error) {
        console.error('Failed to load financing application from localStorage:', error);
        clearStoredData();
      }
    }

    return () => {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
    };
  }, [clearStoredData, resetInactivityTimer]);

  // Auto-save to localStorage (debounced 1 second)
  useEffect(() => {
    if (state.isLoading) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      resetInactivityTimer(); // Reset timer on save activity
      
      const dataToSave = {
        state: {
          applicationId: state.applicationId,
          resumeToken: state.resumeToken,
          currentStep: state.currentStep,
          completedSteps: state.completedSteps,
          purchaseDetails: state.purchaseDetails,
          applicant: state.applicant,
          employment: state.employment,
          financial: state.financial,
          coApplicant: state.coApplicant,
          hasCoApplicant: state.hasCoApplicant,
          references: state.references,
          quoteId: state.quoteId,
        },
        timestamp: Date.now(),
        lastActivity: Date.now(),
      };
      localStorage.setItem('financingApplication', JSON.stringify(dataToSave));
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state]);
  
  // Auto-save to database (debounced 2 seconds to reduce writes)
  useEffect(() => {
    if (state.isLoading || !state.applicationId) return;
    
    const dbSaveTimeout = setTimeout(async () => {
      try {
        await supabase
          .from('financing_applications')
          .update({
            current_step: state.currentStep,
            completed_steps: state.completedSteps,
            purchase_data: state.purchaseDetails || {},
            applicant_data: state.applicant || {},
            employment_data: state.employment || {},
            financial_data: state.financial || {},
            co_applicant_data: state.coApplicant || null,
            references_data: state.references || {},
            updated_at: new Date().toISOString(),
          })
          .eq('id', state.applicationId);
      } catch (error) {
        console.error('Auto-save to database failed:', error);
      }
    }, 2000); // Debounce 2 seconds
    
    return () => clearTimeout(dbSaveTimeout);
  }, [state, state.applicationId]);

  // Save to database
  const saveToDatabase = useCallback(async () => {
    dispatch({ type: 'SET_SAVING', payload: true });
    
    try {
      const applicationData = {
        purchase_data: state.purchaseDetails || {},
        applicant_data: state.applicant || {},
        employment_data: state.employment || {},
        financial_data: state.financial || {},
        co_applicant_data: state.coApplicant || null,
        references_data: state.references || {},
        current_step: state.currentStep,
        completed_steps: state.completedSteps,
        quote_id: state.quoteId,
        status: 'draft' as const,
      };

      if (state.applicationId) {
        // Update existing application
        const { error } = await supabase
          .from('financing_applications')
          .update(applicationData)
          .eq('id', state.applicationId);

        if (error) throw error;
        
        // Return existing IDs
        return {
          applicationId: state.applicationId,
          resumeToken: state.resumeToken!
        };
      } else {
        // Create new application
        const { data: { user } } = await supabase.auth.getUser();
        
        const { data, error } = await supabase
          .from('financing_applications')
          .insert({
            ...applicationData,
            user_id: user?.id || null,
            resume_token: crypto.randomUUID(),
            resume_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          dispatch({ type: 'SET_APPLICATION_ID', payload: data.id });
          dispatch({ type: 'SET_RESUME_TOKEN', payload: data.resume_token });
          
          // Return new IDs
          return {
            applicationId: data.id,
            resumeToken: data.resume_token
          };
        }
      }
    } catch (error) {
      console.error('Failed to save financing application:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  }, [state]);

  // Check if step is complete
  const isStepComplete = useCallback((step: number): boolean => {
    return state.completedSteps.includes(step);
  }, [state.completedSteps]);

  // Check if user can access a step
  const canAccessStep = useCallback((step: number): boolean => {
    if (step === 1) return true;
    return isStepComplete(step - 1);
  }, [isStepComplete]);

  return (
    <FinancingContext.Provider
      value={{
        state,
        dispatch,
        saveToDatabase,
        isStepComplete,
        canAccessStep,
        clearStoredData,
      }}
    >
      {children}
    </FinancingContext.Provider>
  );
};

export const useFinancing = (): FinancingContextType => {
  const context = useContext(FinancingContext);
  if (!context) {
    throw new Error('useFinancing must be used within a FinancingProvider');
  }
  return context;
};
