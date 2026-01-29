import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuoteLayout } from '@/components/quote-builder/QuoteLayout';
import { PageTransition } from '@/components/ui/page-transition';
import { TradeInValuation } from '@/components/quote-builder/TradeInValuation';
import { useQuote } from '@/contexts/QuoteContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import type { TradeInInfo } from '@/lib/trade-valuation';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function TradeInPage() {
  const navigate = useNavigate();
  const { state, dispatch, isStepAccessible } = useQuote();
  const [tradeInInfo, setTradeInInfo] = useState<TradeInInfo>({
    hasTradeIn: false,
    brand: '',
    year: 0,
    horsepower: 0,
    model: '',
    serialNumber: '',
    condition: 'good' as const,
    estimatedValue: 0,
    confidenceLevel: 'medium' as const
  });
  
  // Track unsaved changes
  const [isDirty, setIsDirty] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  
  // Track save indicator
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  const saveIndicatorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Trust navigation if we have required state
    if (state.motor && state.purchasePath) {
      // Always start with clean trade-in state - no auto-loading from context
      console.log('🧹 TradeInPage: Starting with clean trade-in state');
      setTradeInInfo({
        hasTradeIn: false,
        brand: '',
        year: 0,
        horsepower: 0,
        model: '',
        serialNumber: '',
        condition: 'good' as const,
        estimatedValue: 0,
        confidenceLevel: 'medium' as const
      });

      document.title = 'Trade-In Valuation | Harris Boat Works';
      
      let desc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      if (!desc) {
        desc = document.createElement('meta');
        desc.name = 'description';
        document.head.appendChild(desc);
      }
      desc.content = 'Get an instant trade-in valuation for your current outboard motor.';
      return;
    }

    // Only redirect if no motor selected
    if (!state.motor) {
      navigate('/quote/motor-selection');
    }
  }, [state.motor, state.purchasePath, navigate]);

  const handleTradeInChange = (updatedTradeInInfo: TradeInInfo) => {
    console.log('🔄 TradeInPage: Trade-in changed', {
      hasTradeIn: updatedTradeInInfo.hasTradeIn,
      brand: updatedTradeInInfo.brand,
      estimatedValue: updatedTradeInInfo.estimatedValue
    });
    
    setTradeInInfo(updatedTradeInInfo);
    
    // Mark as dirty if user has selected "Yes" and filled any fields
    const hasData = updatedTradeInInfo.hasTradeIn && (
      updatedTradeInInfo.brand !== '' ||
      updatedTradeInInfo.year > 0 ||
      updatedTradeInInfo.horsepower > 0 ||
      updatedTradeInInfo.model !== ''
    );
    setIsDirty(hasData);
    
    // Dispatch immediately to context (don't wait for handleComplete)
    dispatch({ type: 'SET_TRADE_IN_INFO', payload: updatedTradeInInfo });
    dispatch({ type: 'SET_HAS_TRADEIN', payload: updatedTradeInInfo.hasTradeIn });
  };

  const handleComplete = () => {
    console.log('🔄 TradeInPage handleComplete - tradeInInfo:', tradeInInfo);
    
    // If no trade-in, ensure clean state
    const finalTradeInInfo = tradeInInfo.hasTradeIn ? tradeInInfo : {
      hasTradeIn: false,
      brand: '',
      year: 0,
      horsepower: 0,
      model: '',
      serialNumber: '',
      condition: 'good' as const,
      estimatedValue: 0,
      confidenceLevel: 'medium' as const
    };
    
    // If no trade-in, clear it from localStorage before navigating
    if (!finalTradeInInfo.hasTradeIn) {
      try {
        const stored = localStorage.getItem('quoteBuilder');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.state) {
            parsed.state.tradeInInfo = finalTradeInInfo;
            parsed.state.hasTradein = false;
            localStorage.setItem('quoteBuilder', JSON.stringify(parsed));
            console.log('🧹 Cleared trade-in from localStorage on navigation');
          }
        }
      } catch (e) {
        console.error('Failed to clear localStorage:', e);
      }
    }
    
    // Dispatch all state updates - React 18 will batch these automatically
    dispatch({ type: 'SET_TRADE_IN_INFO', payload: finalTradeInInfo });
    dispatch({ type: 'SET_HAS_TRADEIN', payload: finalTradeInInfo.hasTradeIn });
    dispatch({ type: 'COMPLETE_STEP', payload: 4 });
    
    console.log('🚀 TradeInPage: State updates dispatched, navigating', {
      hasTradeIn: finalTradeInInfo.hasTradeIn,
      estimatedValue: finalTradeInInfo.estimatedValue
    });
    
    // Reset dirty flag - data is saved
    setIsDirty(false);
    
    // Navigate to promo selection first, then summary
    const target = state.purchasePath === 'installed' ? '/quote/installation' : '/quote/promo-selection';
    navigate(target);
  };

  const navigateBack = () => {
    if (state.purchasePath === 'installed') {
      navigate('/quote/boat-info');
    } else {
      const isSmallTillerMotor = state.motor && state.motor.hp <= 9.9 && state.motor.type?.toLowerCase().includes('tiller');
      if (isSmallTillerMotor) {
        navigate('/quote/fuel-tank');
      } else {
        navigate('/quote/purchase-path');
      }
    }
  };

  const handleBack = () => {
    if (isDirty) {
      // Show confirmation dialog instead of navigating immediately
      const target = state.purchasePath === 'installed' 
        ? '/quote/boat-info' 
        : state.motor && state.motor.hp <= 9.9 && state.motor.type?.toLowerCase().includes('tiller')
          ? '/quote/fuel-tank'
          : '/quote/purchase-path';
      setPendingNavigation(target);
      setShowExitDialog(true);
    } else {
      // Safe to navigate - no changes
      navigateBack();
    }
  };
  
  // Prevent browser navigation/reload with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);
  
  // Show save indicator when trade-in data changes
  useEffect(() => {
    // Only show indicator if:
    // 1. User has selected "Yes" for trade-in
    // 2. There's meaningful data (not just the initial empty state)
    
    if (!state.tradeInInfo?.hasTradeIn) return;
    
    const hasData = state.tradeInInfo.brand !== '' || 
                    state.tradeInInfo.year > 0 || 
                    state.tradeInInfo.horsepower > 0;
    
    if (!hasData) return;
    
    // Show the indicator
    setShowSaveIndicator(true);
    
    // Hide after 2 seconds
    if (saveIndicatorTimeoutRef.current) {
      clearTimeout(saveIndicatorTimeoutRef.current);
    }
    
    saveIndicatorTimeoutRef.current = setTimeout(() => {
      setShowSaveIndicator(false);
    }, 2000);
    
    return () => {
      if (saveIndicatorTimeoutRef.current) {
        clearTimeout(saveIndicatorTimeoutRef.current);
      }
    };
  }, [state.tradeInInfo]);

  // Show loading skeleton while context is hydrating
  if (state.isLoading) {
    return (
      <PageTransition>
        <QuoteLayout>
          <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
            {/* Skeleton back button */}
            <Skeleton className="h-9 w-32" />
            
            {/* Skeleton card */}
            <div className="p-8 border border-border bg-card rounded-lg space-y-6">
              <div className="space-y-3">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-5 w-96" />
              </div>
              
              {/* Skeleton trade-in options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <Skeleton className="h-28 rounded-lg" />
                <Skeleton className="h-28 rounded-lg" />
              </div>
            </div>
          </div>
        </QuoteLayout>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <QuoteLayout>
          <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleBack}
                className="border-gray-300 hover:border-gray-900 font-light"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          
          {showSaveIndicator && (
            <div className="flex items-center gap-2 text-xs text-green-600 animate-in fade-in slide-in-from-top-1 duration-300">
              <svg 
                className="w-3.5 h-3.5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M5 13l4 4L19 7" 
                />
              </svg>
              <span className="font-normal">Changes saved</span>
            </div>
          )}
          
          {/* Trade-in valuation */}
          <TradeInValuation 
            tradeInInfo={tradeInInfo}
            onTradeInChange={handleTradeInChange}
            onAutoAdvance={handleComplete}
            currentMotorBrand={state.boatInfo?.currentMotorBrand}
            currentHp={state.boatInfo?.currentHp}
            currentMotorYear={state.boatInfo?.currentMotorYear}
          />
        </div>
      
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard trade-in information?</AlertDialogTitle>
            <AlertDialogDescription className="font-normal">
              You have unsaved trade-in details. If you leave now, your trade-in information will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-normal">
              Stay on Page
            </AlertDialogCancel>
            <AlertDialogAction
              className="font-medium"
              onClick={() => {
                setIsDirty(false);
                setShowExitDialog(false);
                if (pendingNavigation) {
                  navigate(pendingNavigation);
                }
              }}
            >
              Leave Without Saving
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </QuoteLayout>
    </PageTransition>
  );
}