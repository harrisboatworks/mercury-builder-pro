// Enhanced Security Monitoring Dashboard
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Shield, Activity, Users, Lock, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SecurityEvent {
  id: string;
  user_id: string;
  action: string;
  table_name: string;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
}

interface SessionInfo {
  id: string;
  user_id: string;
  last_activity: string;
  is_active: boolean;
  ip_address?: string;
  user_agent?: string;
}

export function SecurityMonitoring() {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [activeSessions, setActiveSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeSessions: 0,
    riskEvents: 0,
    cleanupCount: 0
  });
  const { toast } = useToast();

  const fetchSecurityData = async () => {
    try {
      setLoading(true);

      // Fetch recent security events
      const { data: events, error: eventsError } = await supabase
        .from('security_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (eventsError) throw eventsError;

      // Fetch active sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('is_active', true)
        .order('last_activity', { ascending: false });

      if (sessionsError) throw sessionsError;

      setSecurityEvents(events || []);
      setActiveSessions(sessions || []);

      // Calculate statistics
      const riskActions = ['rate_limit_exceeded', 'invalid_uuid_access_attempt', 'session_track_failed'];
      const riskEvents = events?.filter(event => riskActions.includes(event.action)).length || 0;

      setStats({
        totalEvents: events?.length || 0,
        activeSessions: sessions?.length || 0,
        riskEvents,
        cleanupCount: 0
      });

    } catch (error) {
      console.error('Failed to fetch security data:', error);
      toast({
        title: "Error",
        description: "Failed to load security data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const cleanupExpiredSessions = async () => {
    try {
      const { data: cleanedCount, error } = await supabase.rpc('cleanup_expired_sessions');
      
      if (error) throw error;

      setStats(prev => ({ ...prev, cleanupCount: cleanedCount || 0 }));
      toast({
        title: "Success",
        description: `Cleaned up ${cleanedCount || 0} expired sessions`
      });

      // Refresh data after cleanup
      await fetchSecurityData();
    } catch (error) {
      console.error('Failed to cleanup sessions:', error);
      toast({
        title: "Error",
        description: "Failed to cleanup expired sessions",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchSecurityData();

    // Set up real-time subscription for security events
    const subscription = supabase
      .channel('security_monitoring')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'security_audit_log' },
        () => fetchSecurityData()
      )
      .subscribe();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSecurityData, 30000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const getEventSeverity = (action: string) => {
    const highRisk = ['rate_limit_exceeded', 'invalid_uuid_access_attempt', 'data_access_validation_failed'];
    const mediumRisk = ['session_track_failed', 'login_failed'];
    
    if (highRisk.includes(action)) return 'high';
    if (mediumRisk.includes(action)) return 'medium';
    return 'low';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const formatUserAgent = (userAgent?: string) => {
    if (!userAgent) return 'Unknown';
    
    // Extract browser info
    const chrome = userAgent.match(/Chrome\/([0-9.]+)/);
    const firefox = userAgent.match(/Firefox\/([0-9.]+)/);
    const safari = userAgent.match(/Safari\/([0-9.]+)/);
    
    if (chrome) return `Chrome ${chrome[1]}`;
    if (firefox) return `Firefox ${firefox[1]}`;
    if (safari) return `Safari ${safari[1]}`;
    
    return userAgent.substring(0, 50) + '...';
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Security Monitoring
        </h2>
        <Button onClick={cleanupExpiredSessions} variant="outline">
          <Lock className="h-4 w-4 mr-2" />
          Cleanup Expired Sessions
        </Button>
      </div>

      {/* Security Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSessions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Events</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.riskEvents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions Cleaned</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cleanupCount}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Recent Security Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityEvents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No security events recorded
                  </p>
                ) : (
                  securityEvents.map((event) => {
                    const severity = getEventSeverity(event.action);
                    return (
                      <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={getSeverityColor(severity)}>
                              {event.action}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {event.table_name}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            User: {event.user_id || 'Unknown'} | IP: {event.ip_address || 'Unknown'}
                          </div>
                          {event.user_agent && (
                            <div className="text-xs text-muted-foreground">
                              Browser: {formatUserAgent(event.user_agent)}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {new Date(event.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(event.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Active User Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeSessions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No active sessions
                  </p>
                ) : (
                  activeSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">
                          User: {session.user_id}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          IP: {session.ip_address || 'Unknown'} | 
                          Browser: {formatUserAgent(session.user_agent)}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">Active</Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          Last seen: {new Date(session.last_activity).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}