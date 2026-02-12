import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function TikTokCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setErrorMsg(searchParams.get('error_description') || 'Authorization was denied.');
      return;
    }

    if (!code) {
      setStatus('error');
      setErrorMsg('No authorization code received from TikTok.');
      return;
    }

    const exchangeCode = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke('auth-tiktok-callback', {
          body: { code },
        });

        if (fnError) throw fnError;
        if (data?.error) throw new Error(data.error);

        setStatus('success');
        setTimeout(() => navigate('/dashboard'), 2000);
      } catch (err: any) {
        setStatus('error');
        setErrorMsg(err.message || 'Failed to complete TikTok authorization.');
      }
    };

    exchangeCode();
  }, [searchParams, navigate]);

  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-4 text-center">
        {status === 'loading' && (
          <div className="space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <h1 className="text-xl font-medium text-foreground">Connecting TikTok…</h1>
            <p className="text-sm text-muted-foreground">Completing authorization, please wait.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
            <h1 className="text-xl font-medium text-foreground">TikTok Connected!</h1>
            <p className="text-sm text-muted-foreground">Redirecting to dashboard…</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <XCircle className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="text-xl font-medium text-foreground">Connection Failed</h1>
            <p className="text-sm text-muted-foreground">{errorMsg}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
