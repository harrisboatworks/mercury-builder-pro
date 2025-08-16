import QuoteBuilder from '@/components/quote-builder/QuoteBuilder';
import { StatusIndicator } from '@/components/StatusIndicator';
import { MobileQuoteForm } from '@/components/ui/mobile-quote-form';
import { MobileStickyCTA } from '@/components/ui/mobile-sticky-cta';
import { useState } from 'react';

const Index = () => {
  const [showQuoteForm, setShowQuoteForm] = useState(false);

  return (
    <>
      <div className="container mx-auto px-4 py-2 flex justify-end">
        <StatusIndicator />
      </div>
      <QuoteBuilder />
      
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
