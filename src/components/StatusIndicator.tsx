// src/components/StatusIndicator.tsx
import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

export function StatusIndicator() {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchLastUpdate() {
    try {
      const { data, error } = await supabase
        .from('motor_models')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setLastUpdate(data?.updated_at ? new Date(data.updated_at as unknown as string) : null);
    } catch (e) {
      // fail silent – indicator is non-critical
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLastUpdate();
    const id = setInterval(fetchLastUpdate, 60_000); // refresh every minute
    return () => clearInterval(id);
  }, []);

  return (
    <div className="text-xs text-muted-foreground" aria-live="polite">
      {loading ? 'Checking inventory status…' : (
        <>Last updated: {lastUpdate ? `${formatDistanceToNow(lastUpdate)} ago` : 'Just now'}</>
      )}
    </div>
  );
}
