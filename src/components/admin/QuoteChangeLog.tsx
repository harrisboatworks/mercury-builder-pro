import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, DollarSign, FileText, Plus, Edit2 } from 'lucide-react';
import { format } from 'date-fns';

interface ChangeLogEntry {
  id: string;
  quote_id: string;
  changed_by: string;
  change_type: string;
  changes: Record<string, { old?: any; new?: any }>;
  notes: string | null;
  created_at: string;
}

interface QuoteChangeLogProps {
  quoteId: string;
}

export function QuoteChangeLog({ quoteId }: QuoteChangeLogProps) {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['quote-change-log', quoteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quote_change_log')
        .select('*')
        .eq('quote_id', quoteId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ChangeLogEntry[];
    },
    enabled: !!quoteId
  });

  // Fetch profiles for changed_by users
  const { data: profiles } = useQuery({
    queryKey: ['profiles-for-logs', logs?.map(l => l.changed_by)],
    queryFn: async () => {
      if (!logs?.length) return {};
      const userIds = [...new Set(logs.map(l => l.changed_by))];
      const { data } = await supabase
        .from('profiles')
        .select('user_id, display_name, email')
        .in('user_id', userIds);
      
      const profileMap: Record<string, { display_name?: string; email?: string }> = {};
      data?.forEach(p => {
        profileMap[p.user_id] = p;
      });
      return profileMap;
    },
    enabled: !!logs?.length
  });

  const getChangeTypeIcon = (type: string) => {
    switch (type) {
      case 'created': return <Plus className="w-4 h-4" />;
      case 'discount': return <DollarSign className="w-4 h-4" />;
      case 'notes': return <FileText className="w-4 h-4" />;
      default: return <Edit2 className="w-4 h-4" />;
    }
  };

  const getChangeTypeBadge = (type: string) => {
    switch (type) {
      case 'created':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Created</Badge>;
      case 'discount':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Discount</Badge>;
      case 'notes':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Notes</Badge>;
      case 'status':
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">Status</Badge>;
      default:
        return <Badge variant="secondary">Updated</Badge>;
    }
  };

  const formatChangeValue = (key: string, value: any): string => {
    if (value == null || value === '') return '(empty)';
    if (key.includes('discount') || key.includes('price')) {
      return `$${Number(value).toLocaleString()}`;
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  const getUserName = (userId: string): string => {
    const profile = profiles?.[userId];
    return profile?.display_name || profile?.email?.split('@')[0] || 'Admin';
  };

  const getInitials = (userId: string): string => {
    const name = getUserName(userId);
    return name.slice(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Change Log
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5" />
        Change Log
        {logs?.length ? (
          <span className="text-sm text-muted-foreground font-normal">({logs.length})</span>
        ) : null}
      </h3>
      
      {!logs?.length ? (
        <p className="text-sm text-muted-foreground">No changes recorded yet.</p>
      ) : (
        <div className="space-y-4">
          {logs.map((log, idx) => (
            <div key={log.id} className="relative">
              {/* Timeline connector */}
              {idx < logs.length - 1 && (
                <div className="absolute left-5 top-12 w-0.5 h-full bg-border -translate-x-1/2" />
              )}
              
              <div className="flex gap-3">
                <Avatar className="w-10 h-10 shrink-0">
                  <AvatarFallback className="text-xs bg-primary/10">
                    {getInitials(log.changed_by)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{getUserName(log.changed_by)}</span>
                    {getChangeTypeBadge(log.change_type)}
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  
                  {/* Changes detail */}
                  <div className="mt-2 space-y-1">
                    {Object.entries(log.changes).map(([key, change]) => (
                      <div key={key} className="text-sm">
                        <span className="text-muted-foreground capitalize">
                          {key.replace(/_/g, ' ')}:
                        </span>{' '}
                        {change.old !== undefined && (
                          <>
                            <span className="text-red-600 dark:text-red-400 line-through">
                              {formatChangeValue(key, change.old)}
                            </span>
                            {' → '}
                          </>
                        )}
                        <span className="text-green-600 dark:text-green-400">
                          {formatChangeValue(key, change.new)}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  {log.notes && (
                    <p className="text-sm text-muted-foreground mt-1 italic">
                      "{log.notes}"
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
