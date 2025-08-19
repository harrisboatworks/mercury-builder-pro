import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusIndicator } from '@/components/StatusIndicator';
import { MobileQuoteForm } from '@/components/ui/mobile-quote-form';
import { MobileStickyCTA } from '@/components/ui/mobile-sticky-cta';
import { useState } from 'react';

const Index = () => {
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the new quote builder
    navigate('/quote/motor-selection');
  }, [navigate]);

  return (
    <>
      <div className="container mx-auto px-4 py-2 flex justify-end">
        <StatusIndicator />
      </div>
      
      {/* Loading state while redirecting */}
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
      
      {/* Global Mobile Components */}
      <MobileStickyCTA onQuoteClick={() => setShowQuoteForm(true)} />
      <MobileQuoteForm 
        isOpen={showQuoteForm}
        onClose={() => setShowQuoteForm(false)}
      />
    </>
  );
};

export default Index;
