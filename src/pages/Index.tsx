import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusIndicator } from '@/components/StatusIndicator';
import { MobileQuoteForm } from '@/components/ui/mobile-quote-form';
import { MobileStickyCTA } from '@/components/ui/mobile-sticky-cta';

const Index = () => {
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [redirectFailed, setRedirectFailed] = useState(false);
  const navigate = useNavigate();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (hasRedirected.current) return;
    
    console.log('🔄 Index: Attempting redirect to motor-selection...');
    
    try {
      // Attempt React Router navigation
      navigate('/quote/motor-selection');
      hasRedirected.current = true;
      
      // Fallback timeout in case navigation fails
      const timeout = setTimeout(() => {
        if (window.location.pathname === '/') {
          console.warn('⚠️ React Router redirect failed, using window.location');
          setRedirectFailed(true);
          window.location.href = '/quote/motor-selection';
        }
      }, 2000);
      
      return () => clearTimeout(timeout);
      
    } catch (error) {
      console.error('❌ Navigation error:', error);
      setRedirectFailed(true);
      // Immediate fallback
      window.location.href = '/quote/motor-selection';
    }
  }, [navigate]);

  return (
    <>
      <div className="container mx-auto px-4 py-2 flex justify-end">
        <StatusIndicator />
      </div>
      
      {/* Loading state while redirecting */}
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">
            {redirectFailed ? 'Redirecting...' : 'Loading Mercury Quote Builder...'}
          </p>
          {redirectFailed && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Taking longer than expected?</p>
              <a 
                href="/quote/motor-selection" 
                className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
              >
                Continue to Quote Builder
              </a>
            </div>
          )}
        </div>
      </div>
      
      {/* Global Mobile Components */}
      <MobileStickyCTA onQuoteClick={() => setShowQuoteForm(true)} />
      <MobileQuoteForm 
        isOpen={showQuoteForm}
        onClose={() => setShowQuoteForm(false)}
      />
      
      {/* Meta refresh fallback */}
      <noscript>
        <meta httpEquiv="refresh" content="0;url=/quote/motor-selection" />
      </noscript>
    </>
  );
};

export default Index;
