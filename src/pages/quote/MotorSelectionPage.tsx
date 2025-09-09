import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PremiumMotorSelection from './PremiumMotorSelection';
import { useQuote } from '@/contexts/QuoteContext';
import { Motor } from '@/components/QuoteBuilder';

export default function MotorSelectionPage() {
  const navigate = useNavigate();
  const { dispatch } = useQuote();

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

  return <PremiumMotorSelection onStepComplete={handleStepComplete} />;
}