import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import harrisLogo from '@/assets/harris-logo.png';
import { supabase } from '@/integrations/supabase/client';

export default function FinancingFromQuote() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const quoteId = searchParams.get('quoteId');
    
    if (quoteId) {
      // NEW PATH: Restore complete quote from database
      loadQuoteFromDatabase(quoteId);
    } else {
      // EXISTING PATH: Parse URL parameters (fallback)
      loadQuoteFromParams();
    }
  }, [searchParams, navigate]);

  async function loadQuoteFromDatabase(quoteId: string) {
    try {
      setStatus('loading');
      
      // Fetch saved quote from database
      const { data: savedQuote, error } = await supabase
        .from('saved_quotes')
        .select('*')
        .eq('id', quoteId)
        .single();
      
      if (error || !savedQuote) {
        console.error('Quote not found:', error);
        setStatus('error');
        setTimeout(() => navigate('/financing-application'), 2000);
        return;
      }
      
      // Validate expiration
      if (new Date(savedQuote.expires_at) < new Date()) {
        console.error('Quote expired');
        setStatus('error');
        setTimeout(() => navigate('/financing-application'), 2000);
        return;
      }
      
      // Update access count for analytics
      await supabase
        .from('saved_quotes')
        .update({ 
          access_count: (savedQuote.access_count || 0) + 1,
          last_accessed: new Date().toISOString()
        })
        .eq('id', quoteId);
      
      setStatus('success');
      
      // Redirect with full quote state
      setTimeout(() => {
        navigate('/financing-application?quoteId=' + quoteId + '&fromQr=true', {
          state: { savedQuoteState: savedQuote.quote_state }
        });
      }, 1500);
      
    } catch (error) {
      console.error('Error loading quote:', error);
      setStatus('error');
      setTimeout(() => navigate('/financing-application'), 2000);
    }
  }

  function loadQuoteFromParams() {
    // Support BOTH legacy param names (motor/price/package/down/trade)
    // and the newer names used by current QR codes (motorModel/motorPrice/...)
    const motorModel = searchParams.get('motorModel') || searchParams.get('motor');
    const motorPrice = searchParams.get('motorPrice') || searchParams.get('price');
    const packageName = searchParams.get('packageName') || searchParams.get('package');
    const downPayment = searchParams.get('downPayment') || searchParams.get('down') || '0';
    const tradeInValue = searchParams.get('tradeInValue') || searchParams.get('trade') || '0';

    // Validate required parameters
    if (!motorModel || !motorPrice) {
      setStatus('error');
      setTimeout(() => navigate('/financing-application'), 2000);
      return;
    }

    // Show success state briefly
    setStatus('success');

    // Redirect to main financing application with pre-filled data
    setTimeout(() => {
      const params = new URLSearchParams({
        motorModel,
        motorPrice,
        packageName: packageName || '',
        downPayment,
        tradeInValue,
        fromQr: 'true' // Flag to indicate QR code entry
      });

      navigate(`/financing-application?${params.toString()}`);
    }, 1500);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="max-w-md w-full p-8 text-center border-border">
        <img 
          src={harrisLogo} 
          alt="Harris Boat Works" 
          className="h-12 mx-auto mb-6"
        />

        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Loading Your Quote</h2>
            <p className="text-muted-foreground font-light">
              Preparing your financing application with motor details...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Quote Loaded!</h2>
            <p className="text-muted-foreground font-light">
              Redirecting to your application...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-red-600">Invalid Link</h2>
            <p className="text-muted-foreground font-light">
              Redirecting to financing application...
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
