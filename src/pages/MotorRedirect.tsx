import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

/**
 * Resolves a motor slug (derived from model_key) to its ID,
 * then redirects into the quote builder with that motor pre-selected.
 *
 * URL format: /motors/fs-115-elpt-ct
 * model_key in DB: FS_115_ELPT_CT
 */
export default function MotorRedirect() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      navigate('/quote/motor-selection', { replace: true });
      return;
    }

    const resolve = async () => {
      // Convert slug back to model_key format: fs-115-elpt-ct → FS_115_ELPT_CT
      const modelKey = slug.toUpperCase().replace(/-/g, '_');

      const { data, error: dbError } = await supabase
        .from('motor_models')
        .select('id')
        .eq('model_key', modelKey)
        .limit(1)
        .maybeSingle();

      if (dbError || !data) {
        // Try a fuzzy match (slug might be a partial or alternate format)
        const { data: fuzzy } = await supabase
          .from('motor_models')
          .select('id, model_key')
          .ilike('model_key', `%${modelKey}%`)
          .limit(1)
          .maybeSingle();

        if (fuzzy) {
          navigate(`/quote/motor-selection?motor=${fuzzy.id}`, { replace: true });
          return;
        }

        setError(`Motor "${slug}" not found. Redirecting to all motors…`);
        setTimeout(() => navigate('/quote/motor-selection', { replace: true }), 2000);
        return;
      }

      navigate(`/quote/motor-selection?motor=${data.id}`, { replace: true });
    };

    resolve();
  }, [slug, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        {error ? (
          <p className="text-muted-foreground">{error}</p>
        ) : (
          <>
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading motor details…</p>
          </>
        )}
      </div>
    </div>
  );
}
