import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Shield, Users, Activity } from 'lucide-react';

interface SecurityEvent {
  id: string;
  user_id: string;
  action: string;
  table_name: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

interface SecurityStats {
  totalEvents: number;
  failedLogins: number;
  activeSessions: number;
  recentSuspiciousActivity: SecurityEvent[];
}

export const SecurityDashboard = () => {
  const [stats, setStats] = useState<SecurityStats>({
    totalEvents: 0,
    failedLogins: 0,
    activeSessions: 0,
    recentSuspiciousActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSecurityStats();
  }, []);

  const fetchSecurityStats = async () => {
    try {
      // Get total security events from last 24 hours
      const { data: totalEvents, error: totalError } = await supabase
        .from('security_audit_log')
        .select('id')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Get failed login attempts
      const { data: failedLogins, error: failedError } = await supabase
        .from('security_audit_log')
        .select('id')
        .eq('action', 'signin_failure')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Get active sessions
      const { data: activeSessions, error: sessionsError } = await supabase
        .from('user_sessions')
        .select('id')
        .eq('is_active', true)
        .gte('last_activity', new Date(Date.now() - 30 * 60 * 1000).toISOString());

      // Get recent suspicious activity (multiple failed logins)
      const { data: suspiciousActivity, error: suspiciousError } = await supabase
        .from('security_audit_log')
        .select('*')
        .in('action', ['signin_failure', 'rate_limit_exceeded', 'unauthorized_access'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (totalError || failedError || sessionsError || suspiciousError) {
        console.error('Error fetching security stats:', { totalError, failedError, sessionsError, suspiciousError });
        return;
      }

      setStats({
        totalEvents: totalEvents?.length || 0,
        failedLogins: failedLogins?.length || 0,
        activeSessions: activeSessions?.length || 0,
        recentSuspiciousActivity: suspiciousActivity || []
      });
    } catch (error) {
      console.error('Failed to fetch security stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'signin_failure':
        return 'destructive';
      case 'rate_limit_exceeded':
        return 'destructive';
      case 'unauthorized_access':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events (24h)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
            <p className="text-xs text-muted-foreground">Security events logged</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins (24h)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.failedLogins}</div>
            <p className="text-xs text-muted-foreground">Authentication failures</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSessions}</div>
            <p className="text-xs text-muted-foreground">Currently logged in</p>
          </CardContent>
        </Card>
      </div>

      {stats.failedLogins > 10 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            High number of failed login attempts detected ({stats.failedLogins} in the last 24 hours). 
            Consider reviewing authentication logs and potentially implementing additional security measures.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Recent Security Events
          </CardTitle>
          <CardDescription>
            Latest suspicious activity and security-related events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentSuspiciousActivity.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No recent suspicious activity detected</p>
          ) : (
            <div className="space-y-3">
              {stats.recentSuspiciousActivity.map((event) => (
                <div key={event.id} className="flex items-center justify-between border-b pb-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={getActionBadgeVariant(event.action)}>
                        {event.action}
                      </Badge>
                      <span className="text-sm font-medium">{event.table_name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      IP: {event.ip_address} • User: {event.user_id}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{formatDate(event.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={fetchSecurityStats} variant="outline">
          <Shield className="h-4 w-4 mr-2" />
          Refresh Security Data
        </Button>
      </div>
    </div>
  );
};