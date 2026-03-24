import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminNav from '@/components/admin/AdminNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Activity, Users, Eye, Clock, Flame, ThermometerSun, Snowflake, ExternalLink } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface QuoteEvent {
  id: string;
  session_id: string;
  event_type: string;
  motor_model: string | null;
  motor_hp: number | null;
  quote_value: number | null;
  device_type: string | null;
  page_path: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  created_at: string;
  event_data: any;
  user_id: string | null;
  referrer: string | null;
}

interface Session {
  sessionId: string;
  events: QuoteEvent[];
  firstEvent: string;
  lastEvent: string;
  motorModel: string | null;
  motorHp: number | null;
  quoteValue: number | null;
  deviceType: string | null;
  utmSource: string | null;
  status: 'active' | 'abandoned' | 'submitted';
  furthestStep: number;
  userId: string | null;
  warmth: 'hot' | 'warm' | 'cool' | 'cold';
  isReturnVisitor: boolean;
}

const STEP_ORDER = [
  'page_view_motor',
  'motor_selected',
  'page_view_options',
  'page_view_package',
  'package_selected',
  'page_view_promo',
  'page_view_summary',
  'quote_submitted',
];

const STEP_LABELS = ['Motor', 'Package', 'Options', 'Promo', 'Summary', 'Submitted'];

function getStepIndex(eventType: string): number {
  if (eventType.includes('motor')) return 0;
  if (eventType.includes('package')) return 1;
  if (eventType.includes('option')) return 2;
  if (eventType.includes('promo')) return 3;
  if (eventType.includes('summary') || eventType.includes('trade') || eventType.includes('boat')) return 4;
  if (eventType.includes('submit') || eventType.includes('deposit') || eventType.includes('save')) return 5;
  return -1;
}

function getSessionStatus(events: QuoteEvent[]): 'active' | 'abandoned' | 'submitted' {
  const hasSubmit = events.some(e => 
    e.event_type.includes('submit') || e.event_type.includes('deposit') || e.event_type.includes('save')
  );
  if (hasSubmit) return 'submitted';
  
  const lastEvent = new Date(events[events.length - 1].created_at);
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
  return lastEvent > thirtyMinAgo ? 'active' : 'abandoned';
}

function groupEventsIntoSessions(events: QuoteEvent[]): Session[] {
  const map = new Map<string, QuoteEvent[]>();
  for (const e of events) {
    const arr = map.get(e.session_id) || [];
    arr.push(e);
    map.set(e.session_id, arr);
  }

  return Array.from(map.entries()).map(([sessionId, evts]) => {
    evts.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const motorEvent = evts.find(e => e.motor_model);
    const quoteEvent = [...evts].reverse().find(e => e.quote_value && e.quote_value > 0);
    const furthestStep = Math.max(...evts.map(e => getStepIndex(e.event_type)), 0);

    return {
      sessionId,
      events: evts,
      firstEvent: evts[0].created_at,
      lastEvent: evts[evts.length - 1].created_at,
      motorModel: motorEvent?.motor_model || null,
      motorHp: motorEvent?.motor_hp || null,
      quoteValue: quoteEvent?.quote_value || null,
      deviceType: evts[0].device_type,
      utmSource: evts[0].utm_source,
      status: getSessionStatus(evts),
      furthestStep,
      userId: evts[0].user_id,
    };
  }).sort((a, b) => new Date(b.lastEvent).getTime() - new Date(a.lastEvent).getTime());
}

export default function AdminQuoteActivity() {
  const [daysBack, setDaysBack] = useState('7');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [motorFilter, setMotorFilter] = useState('');
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['quote-activity-events', daysBack],
    queryFn: async () => {
      const since = new Date(Date.now() - parseInt(daysBack) * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await (supabase as any)
        .from('quote_activity_events')
        .select('*')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(5000);
      if (error) throw error;
      return (data || []) as QuoteEvent[];
    },
    refetchInterval: 60000,
  });

  const sessions = useMemo(() => groupEventsIntoSessions(events), [events]);

  const filtered = useMemo(() => {
    return sessions.filter(s => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (motorFilter && s.motorModel && !s.motorModel.toLowerCase().includes(motorFilter.toLowerCase())) return false;
      return true;
    });
  }, [sessions, statusFilter, motorFilter]);

  const stats = useMemo(() => ({
    total: sessions.length,
    active: sessions.filter(s => s.status === 'active').length,
    abandoned: sessions.filter(s => s.status === 'abandoned').length,
    submitted: sessions.filter(s => s.status === 'submitted').length,
  }), [sessions]);

  const toggleExpand = (id: string) => {
    setExpandedSessions(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
      case 'submitted': return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Submitted</Badge>;
      case 'abandoned': return <Badge variant="secondary">Abandoned</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Quote Activity</h1>
          <p className="text-muted-foreground text-sm">See what visitors are building — even anonymous ones</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Users className="w-3.5 h-3.5" /> Sessions</div>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 text-green-600 text-xs mb-1"><Activity className="w-3.5 h-3.5" /> Active</div>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Clock className="w-3.5 h-3.5" /> Abandoned</div>
              <p className="text-2xl font-bold">{stats.abandoned}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 text-blue-600 text-xs mb-1"><Eye className="w-3.5 h-3.5" /> Submitted</div>
              <p className="text-2xl font-bold text-blue-600">{stats.submitted}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={daysBack} onValueChange={setDaysBack}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 24h</SelectItem>
              <SelectItem value="3">Last 3 days</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="abandoned">Abandoned</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Filter by motor..."
            value={motorFilter}
            onChange={e => setMotorFilter(e.target.value)}
            className="w-[200px]"
          />
        </div>

        {/* Sessions Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No sessions found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead>Time</TableHead>
                    <TableHead>Motor</TableHead>
                    <TableHead>Quote Value</TableHead>
                    <TableHead>Journey</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(session => (
                    <Collapsible key={session.sessionId} asChild>
                      <>
                        <CollapsibleTrigger asChild>
                          <TableRow 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => toggleExpand(session.sessionId)}
                          >
                            <TableCell className="w-8 px-2">
                              {expandedSessions.has(session.sessionId) 
                                ? <ChevronDown className="w-4 h-4" /> 
                                : <ChevronRight className="w-4 h-4" />}
                            </TableCell>
                            <TableCell className="text-xs">
                              <div>{format(new Date(session.lastEvent), 'MMM d, h:mm a')}</div>
                              <div className="text-muted-foreground">{formatDistanceToNow(new Date(session.lastEvent), { addSuffix: true })}</div>
                            </TableCell>
                            <TableCell>
                              {session.motorModel ? (
                                <div>
                                  <div className="font-medium text-sm">{session.motorModel}</div>
                                  {session.motorHp && <div className="text-xs text-muted-foreground">{session.motorHp} HP</div>}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs">Browsing</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {session.quoteValue ? (
                                <span className="font-medium">${session.quoteValue.toLocaleString()}</span>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-0.5">
                                {STEP_LABELS.map((label, i) => (
                                  <div
                                    key={label}
                                    className={`w-3 h-3 rounded-sm text-[7px] flex items-center justify-center font-bold ${
                                      i <= session.furthestStep
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground'
                                    }`}
                                    title={label}
                                  >
                                    {i <= session.furthestStep ? '✓' : ''}
                                  </div>
                                ))}
                              </div>
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                {STEP_LABELS[Math.min(session.furthestStep, STEP_LABELS.length - 1)]}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs capitalize">{session.deviceType || '—'}</TableCell>
                            <TableCell className="text-xs">{session.utmSource || 'direct'}</TableCell>
                            <TableCell>{statusBadge(session.status)}</TableCell>
                          </TableRow>
                        </CollapsibleTrigger>
                        <CollapsibleContent asChild>
                          {expandedSessions.has(session.sessionId) ? (
                            <TableRow>
                              <TableCell colSpan={8} className="bg-muted/30 p-4">
                                <div className="space-y-2">
                                  <div className="text-xs font-medium text-muted-foreground mb-2">
                                    Session: {session.sessionId.slice(0, 12)}...
                                    {session.userId && <span className="ml-2 text-blue-600">(Authenticated)</span>}
                                  </div>
                                  <div className="space-y-1">
                                    {session.events.map(event => (
                                      <div key={event.id} className="flex items-center gap-3 text-xs py-1 border-b border-border/50 last:border-0">
                                        <span className="text-muted-foreground w-[100px] shrink-0">
                                          {format(new Date(event.created_at), 'h:mm:ss a')}
                                        </span>
                                        <Badge variant="outline" className="text-[10px] font-mono">
                                          {event.event_type}
                                        </Badge>
                                        {event.motor_model && (
                                          <span className="text-foreground">{event.motor_model} {event.motor_hp ? `${event.motor_hp}HP` : ''}</span>
                                        )}
                                        {event.quote_value ? (
                                          <span className="text-green-600 font-medium">${event.quote_value.toLocaleString()}</span>
                                        ) : null}
                                        {event.page_path && (
                                          <span className="text-muted-foreground truncate max-w-[200px]">{event.page_path}</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : <></>}
                        </CollapsibleContent>
                      </>
                    </Collapsible>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
