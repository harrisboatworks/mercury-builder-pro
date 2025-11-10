import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useFinancing } from '@/contexts/FinancingContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function FinancingResume() {
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
        const { data, error: fetchError } = await supabase
          .from('financing_applications')
          .select('*')
          .eq('resume_token', token)
          .gt('resume_expires_at', new Date().toISOString())
          .is('deleted_at', null)
          .single();

        if (fetchError || !data) {
          setError('Application not found or expired');
          setLoading(false);
          return;
        }

        // Load application into context
        dispatch({ type: 'LOAD_FROM_DATABASE', payload: data });
        
        // Navigate to application page
        navigate('/financing/apply', { replace: true });
      } catch (err) {
        console.error('Failed to load application:', err);
        setError('Failed to load application');
        setLoading(false);
      }
    };

    loadApplication();
  }, [searchParams, dispatch, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center">
        <Card className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your application...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center px-4">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-xl font-bold text-foreground mb-2">Unable to Resume</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={() => navigate('/financing/apply')}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Start New Application
          </button>
        </Card>
      </div>
    );
  }

  return null;
}
