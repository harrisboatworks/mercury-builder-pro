import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuoteLayout } from '@/components/quote-builder/QuoteLayout';
import { PageTransition } from '@/components/ui/page-transition';
import { ScheduleConsultation } from '@/components/quote-builder/ScheduleConsultation';
import { useQuote } from '@/contexts/QuoteContext';
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

    document.title = 'Submit Your Quote | Harris Boat Works';
    
    let desc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!desc) {
      desc = document.createElement('meta');
      desc.name = 'description';
      document.head.appendChild(desc);
    }
    desc.content = 'Submit your Mercury outboard motor quote and we\'ll contact you to finalize the details.';
  }, [isStepAccessible, navigate]);

  const handleBack = () => {
    navigate('/quote/summary');
  };

  const quoteData = getQuoteData();

  return (
    <PageTransition>
      <QuoteLayout>
        <div className="max-w-[1100px] mx-auto px-6 md:px-14 py-14 md:py-20 space-y-10">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 font-sans font-semibold text-[12px] uppercase tracking-[0.14em] text-repower-navy-900/70 hover:text-repower-mercury-red transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Quote
          </button>

          {/* Heading zone */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-5">
              <span className="h-px w-8 bg-repower-mercury-red" />
              <p className="font-sans font-semibold text-[11px] uppercase tracking-[0.24em] text-repower-mercury-red">
                Step 7 · Schedule
              </p>
              <span className="h-px w-8 bg-repower-mercury-red" />
            </div>
            <h1
              className="font-display font-bold text-repower-navy-900 mb-5"
              style={{ fontSize: 'clamp(40px, 5vw, 64px)', letterSpacing: '-0.025em', lineHeight: 1.05 }}
            >
              Pick a time
            </h1>
            <p className="font-sans text-[18px] text-repower-navy-900/65 max-w-[60ch] mx-auto">
              Choose a time that works for you and we'll confirm the details.
            </p>
            <div className="h-px bg-repower-navy-900/10 mt-10 max-w-[200px] mx-auto" />
          </div>

          <div className="bg-white border border-repower-navy-900/10 p-6 md:p-10">
            <ScheduleConsultation
              quoteData={quoteData}
              onBack={handleBack}
              purchasePath={state.purchasePath}
            />
          </div>
        </div>
      </QuoteLayout>
    </PageTransition>
  );
}