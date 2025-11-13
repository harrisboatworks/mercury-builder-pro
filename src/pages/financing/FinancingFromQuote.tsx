import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import harrisLogo from '@/assets/harris-logo.png';

export default function FinancingFromQuote() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    // Parse URL parameters
    const motorModel = searchParams.get('motor');
    const motorPrice = searchParams.get('price');
    const packageName = searchParams.get('package');
    const downPayment = searchParams.get('down') || '0';
    const tradeInValue = searchParams.get('trade') || '0';

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
  }, [searchParams, navigate]);

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
