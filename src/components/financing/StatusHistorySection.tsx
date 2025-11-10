import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

interface StatusHistorySectionProps {
  applicationId: string;
}

export function StatusHistorySection({ applicationId }: StatusHistorySectionProps) {
  const { data: history, isLoading } = useQuery({
    queryKey: ['financing-status-history', applicationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financing_application_status_history')
        .select(`
          *,
          profiles:changed_by(full_name, email)
        `)
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        <div className="h-20 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No status history available yet.
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'declined':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Status History</h3>
      <div className="space-y-3">
        {history.map((entry) => (
          <div key={entry.id} className="flex gap-3 p-3 rounded-lg border bg-card">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {entry.old_status && (
                  <>
                    <Badge variant="outline" className={getStatusColor(entry.old_status)}>
                      {entry.old_status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">→</span>
                  </>
                )}
                <Badge variant="outline" className={getStatusColor(entry.new_status)}>
                  {entry.new_status}
                </Badge>
              </div>
              
              {entry.notes && (
                <p className="text-xs text-muted-foreground">{entry.notes}</p>
              )}
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(entry.created_at), 'MMM d, yyyy h:mm a')}</span>
                </div>
                {entry.profiles && (
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{entry.profiles.full_name || entry.profiles.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}