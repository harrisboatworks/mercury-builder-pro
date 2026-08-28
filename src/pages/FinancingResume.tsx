import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useFinancing } from '@/contexts/FinancingContext';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { loadFinancingDraft } from '@/lib/financingApplicationApi';

import { useNoIndex } from '@/hooks/useNoIndex';
export default function FinancingResume() {
  useNoIndex();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { dispatch } = useFinancing();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadApplication = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setError('No resume token provided');
        setLoading(false);
        return;
      }

      try {
        const { application } = await loadFinancingDraft(token);
        
        // Load application into context
        dispatch({ type: 'LOAD_FROM_DATABASE', payload: application });
        
        // Navigate to application page
        navigate('/financing-application', { replace: true });
      } catch (err) {
        console.error('Failed to load application:', err);
        setError('This private resume link is invalid, expired, or has already been submitted.');
        setLoading(false);
      }
    };

    loadApplication();
  }, [searchParams, dispatch, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-repower-paper px-4">
        <Card className="w-full max-w-md rounded-sm border-repower-navy-900/10 bg-white p-8 text-center shadow-xl">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-repower-mercury-red" />
          <p className="font-display text-xl font-semibold text-repower-navy-900">Loading your application</p>
          <p className="mt-2 font-sans text-sm text-repower-navy-900/55">Checking your private resume link…</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-repower-paper px-4">
        <Card className="w-full max-w-md rounded-sm border-repower-navy-900/10 bg-white p-8 text-center shadow-xl">
          <p className="mb-3 font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-repower-mercury-red">Private application link</p>
          <h2 className="mb-3 font-display text-2xl font-bold text-repower-navy-900">Unable to resume</h2>
          <p className="mb-6 font-sans text-sm leading-relaxed text-repower-navy-900/60">{error}</p>
          <button
            onClick={() => navigate('/financing-application')}
            className="min-h-12 bg-repower-mercury-red px-6 py-3 font-sans text-[12px] font-bold uppercase tracking-[0.1em] text-white hover:bg-repower-mercury-red-deep"
          >
            Start new application
          </button>
          <p className="mt-5 font-sans text-xs text-repower-navy-900/50">Need help? Call (905) 342-2153.</p>
        </Card>
      </div>
    );
  }

  return null;
}
