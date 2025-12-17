import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, MousePointer, Eye, Users, TrendingUp, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface EmailSequence {
  id: string;
  email: string;
  customer_name: string | null;
  status: string;
  emails_sent: number;
  email_opens: number;
  email_clicks: number;
  current_step: number;
  created_at: string;
  last_opened_at: string | null;
  last_clicked_at: string | null;
  sequence_type: string;
}

interface AnalyticsSummary {
  sequence_type: string;
  total_sequences: number;
  completed: number;
  active: number;
  unsubscribed: number;
  total_emails_sent: number;
  total_opens: number;
  total_clicks: number;
  open_rate: number;
  click_rate: number;
  engaged_leads: number;
}

export default function AdminEmailAnalytics() {
  const { data: sequences, isLoading: sequencesLoading } = useQuery({
    queryKey: ['email-sequences'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_sequence_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as EmailSequence[];
    },
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['email-analytics-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_analytics_summary')
        .select('*');
      
      if (error) throw error;
      return data as AnalyticsSummary[];
    },
  });

  const isLoading = sequencesLoading || summaryLoading;
  const stats = summary?.[0] || {
    total_sequences: 0,
    completed: 0,
    active: 0,
    unsubscribed: 0,
    total_emails_sent: 0,
    total_opens: 0,
    total_clicks: 0,
    open_rate: 0,
    click_rate: 0,
    engaged_leads: 0,
  };

  const completionRate = stats.total_sequences > 0 
    ? ((stats.completed / stats.total_sequences) * 100).toFixed(1) 
    : '0';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      case 'unsubscribed':
        return <Badge variant="destructive">Unsubscribed</Badge>;
      case 'paused':
        return <Badge variant="secondary">Paused</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Calculate funnel data
  const funnelData = [
    { label: 'Guide Downloads', count: stats.total_sequences, percent: 100 },
    { label: 'Email 1 Sent', count: stats.total_emails_sent, percent: stats.total_sequences ? (stats.total_emails_sent / stats.total_sequences) * 100 : 0 },
    { label: 'Opened Any Email', count: sequences?.filter(s => s.email_opens > 0).length || 0, percent: stats.total_sequences ? ((sequences?.filter(s => s.email_opens > 0).length || 0) / stats.total_sequences) * 100 : 0 },
    { label: 'Clicked CTA', count: stats.engaged_leads, percent: stats.total_sequences ? (stats.engaged_leads / stats.total_sequences) * 100 : 0 },
  ];

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Email Analytics</h1>
          <p className="text-muted-foreground mt-1">Track repower guide email sequence performance</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.total_sequences}</p>
                      <p className="text-sm text-muted-foreground">Total Leads</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Eye className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.open_rate}%</p>
                      <p className="text-sm text-muted-foreground">Open Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <MousePointer className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.click_rate}%</p>
                      <p className="text-sm text-muted-foreground">Click Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{completionRate}%</p>
                      <p className="text-sm text-muted-foreground">Completion</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Funnel Visualization */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Conversion Funnel
                </CardTitle>
                <CardDescription>Lead progression through email sequence</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {funnelData.map((stage, index) => (
                    <div key={stage.label} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{stage.label}</span>
                        <span className="text-muted-foreground">
                          {stage.count} ({stage.percent.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="h-8 bg-muted rounded-lg overflow-hidden">
                        <div 
                          className="h-full bg-primary/80 rounded-lg transition-all duration-500"
                          style={{ width: `${Math.max(stage.percent, 2)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sequences Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Sequences
                </CardTitle>
                <CardDescription>Individual lead engagement tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Sent</TableHead>
                      <TableHead className="text-center">Opens</TableHead>
                      <TableHead className="text-center">Clicks</TableHead>
                      <TableHead>Last Activity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sequences?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No email sequences yet. Downloads will appear here.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sequences?.map((seq) => (
                        <TableRow key={seq.id}>
                          <TableCell className="font-medium">{seq.email}</TableCell>
                          <TableCell>{seq.customer_name || '—'}</TableCell>
                          <TableCell>{getStatusBadge(seq.status)}</TableCell>
                          <TableCell className="text-center">{seq.emails_sent}</TableCell>
                          <TableCell className="text-center">
                            <span className={seq.email_opens > 0 ? 'text-green-600 font-medium' : ''}>
                              {seq.email_opens}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={seq.email_clicks > 0 ? 'text-blue-600 font-medium' : ''}>
                              {seq.email_clicks}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {seq.last_clicked_at 
                              ? formatDistanceToNow(new Date(seq.last_clicked_at), { addSuffix: true })
                              : seq.last_opened_at
                              ? formatDistanceToNow(new Date(seq.last_opened_at), { addSuffix: true })
                              : formatDistanceToNow(new Date(seq.created_at), { addSuffix: true })
                            }
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
