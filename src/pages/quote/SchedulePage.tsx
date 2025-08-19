import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuoteLayout } from '@/components/quote-builder/QuoteLayout';
import { ScheduleConsultation } from '@/components/quote-builder/ScheduleConsultation';
import { useQuote } from '@/contexts/QuoteContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function SchedulePage() {
  const navigate = useNavigate();
  const { state, dispatch, isStepAccessible, getQuoteData } = useQuote();

  useEffect(() => {
    // Redirect if step not accessible
    if (!isStepAccessible(7)) {
      navigate('/quote/motor-selection');
      return;
    }

    document.title = 'Schedule Consultation | Harris Boat Works';
    
    let desc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!desc) {
      desc = document.createElement('meta');
      desc.name = 'description';
      document.head.appendChild(desc);
    }
    desc.content = 'Schedule your consultation with our Mercury outboard motor experts.';
  }, [isStepAccessible, navigate]);

  const handleBack = () => {
    navigate('/quote/summary');
  };

  const quoteData = getQuoteData();

  return (
    <QuoteLayout title="Schedule Your Consultation">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Quote
          </Button>
        </div>
        
        <ScheduleConsultation 
          quoteData={quoteData}
          onBack={handleBack}
        />
      </div>
    </QuoteLayout>
  );
}