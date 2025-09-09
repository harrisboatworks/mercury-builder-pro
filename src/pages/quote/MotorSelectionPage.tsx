import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuoteLayout } from '@/components/quote-builder/QuoteLayout';
import { MotorSelection } from '@/components/quote-builder/MotorSelection';
import { useQuote } from '@/contexts/QuoteContext';
import { Motor } from '@/components/QuoteBuilder';
import StickyQuoteBar from '@/components/quote/StickyQuoteBar';
import { useMotorMonthlyPayment } from '@/hooks/useMotorMonthlyPayment';

export default function MotorSelectionPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useQuote();
  
  // Get monthly payment if motor is selected
  const monthlyPayment = useMotorMonthlyPayment({ 
    motorPrice: state.motor?.price || 0 
  });

  useEffect(() => {
    document.title = 'Select Mercury Outboard Motor | Harris Boat Works';
    
    let desc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!desc) {
      desc = document.createElement('meta');
      desc.name = 'description';
      document.head.appendChild(desc);
    }
    desc.content = 'Choose from our selection of Mercury outboard motors with live pricing and current promotions.';
  }, []);

  const handleStepComplete = (motor: Motor) => {
    dispatch({ type: 'SET_MOTOR', payload: motor });
    dispatch({ type: 'COMPLETE_STEP', payload: 1 });
    navigate('/quote/purchase-path');
  };

  const getModelString = () => {
    if (!state.motor) return undefined;
    return `${state.motor.year} Mercury ${state.motor.hp}HP ${state.motor.model}`;
  };

  const getTotalWithTax = () => {
    if (!state.motor?.price) return undefined;
    return Math.round(state.motor.price * 1.13); // 13% HST
  };

  const getCoverageYears = () => {
    const baseYears = 3; // Standard Mercury warranty
    const extendedYears = state.warrantyConfig?.extendedYears || 0;
    return baseYears + extendedYears;
  };

  return (
    <>
      <QuoteLayout title="Select Your Mercury Motor">
        <MotorSelection onStepComplete={handleStepComplete} useCategoryView={true} />
      </QuoteLayout>
      
      {/* Sticky Quote Bar - show when motor is selected and flag is enabled */}
      {state.motor && state.uiFlags?.useStickyQuoteBar && (
        <StickyQuoteBar
          model={getModelString()}
          totalWithTax={getTotalWithTax()}
          monthly={monthlyPayment?.amount || null}
          coverageYears={getCoverageYears()}
          primaryLabel="Continue"
          secondaryLabel="Change Motor"
          onPrimary={() => navigate('/quote/purchase-path')}
          onSecondary={() => {
            dispatch({ type: 'SET_MOTOR', payload: null });
          }}
        />
      )}
    </>
  );
}