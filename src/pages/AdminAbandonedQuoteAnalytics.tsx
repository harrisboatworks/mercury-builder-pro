import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, MousePointerClick, Eye, ShoppingCart, DollarSign, Percent, Clock } from "lucide-react";
import AdminNav from "@/components/admin/AdminNav";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { format, formatDistanceToNow } from "date-fns";

interface AbandonedQuoteSequence {
  id: string;
  email: string;
  customer_name: string | null;
  status: string;
  emails_sent: number;
  email_opens: number | null;
  email_clicks: number | null;
  current_step: number;
  created_at: string;
  last_opened_at: string | null;
  last_clicked_at: string | null;
  metadata: {
    motorModel?: string;
    motorHP?: number;
    selectedPromoOption?: string;
    promoDisplayValue?: string;
    quoteTotal?: number;
    promoEndDate?: string;
  } | null;
}

export default function AdminAbandonedQuoteAnalytics() {
  // Fetch abandoned quote sequences
  const { data: sequences = [], isLoading } = useQuery({
    queryKey: ['abandoned-quote-sequences'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_sequence_queue')
        .select('*')
        .eq('sequence_type', 'abandoned_quote')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []) as AbandonedQuoteSequence[];
    },
  });

  // Calculate stats
  const stats = {
    total: sequences.length,
    active: sequences.filter(s => s.status === 'active').length,
    completed: sequences.filter(s => s.status === 'completed').length,
    unsubscribed: sequences.filter(s => s.status === 'unsubscribed').length,
    totalOpens: sequences.reduce((sum, s) => sum + (s.email_opens || 0), 0),
    totalClicks: sequences.reduce((sum, s) => sum + (s.email_clicks || 0), 0),
    totalSent: sequences.reduce((sum, s) => sum + s.emails_sent, 0),
  };

  const openRate = stats.totalSent > 0 ? ((stats.totalOpens / stats.totalSent) * 100).toFixed(1) : '0';
  const clickRate = stats.totalSent > 0 ? ((stats.totalClicks / stats.totalSent) * 100).toFixed(1) : '0';

  // Group by promo option
  const byPromoOption = sequences.reduce((acc, seq) => {
    const option = seq.metadata?.selectedPromoOption || 'unknown';
    if (!acc[option]) {
      acc[option] = { count: 0, opens: 0, clicks: 0, sent: 0 };
    }
    acc[option].count++;
    acc[option].opens += seq.email_opens || 0;
    acc[option].clicks += seq.email_clicks || 0;
    acc[option].sent += seq.emails_sent;
    return acc;
  }, {} as Record<string, { count: number; opens: number; clicks: number; sent: number }>);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Active</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'unsubscribed':
        return <Badge variant="default" className="bg-gray-100 text-gray-800">Unsubscribed</Badge>;
      case 'paused':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Paused</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPromoIcon = (option: string) => {
    switch (option) {
      case 'no_payments':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'special_financing':
        return <Percent className="h-4 w-4 text-purple-600" />;
      case 'cash_rebate':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      default:
        return <Mail className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPromoLabel = (option: string) => {
    switch (option) {
      case 'no_payments':
        return 'No Payments';
      case 'special_financing':
        return 'Special Financing';
      case 'cash_rebate':
        return 'Cash Rebate';
      default:
        return 'Unknown';
    }
  };

  // Conversion funnel data
  const funnelData = [
    { label: 'Quotes Started', value: stats.total, percent: 100, color: 'bg-blue-500' },
    { label: 'Email 1 Sent', value: sequences.filter(s => s.emails_sent >= 1).length, percent: stats.total > 0 ? (sequences.filter(s => s.emails_sent >= 1).length / stats.total) * 100 : 0, color: 'bg-blue-400' },
    { label: 'Opened Any', value: sequences.filter(s => (s.email_opens || 0) > 0).length, percent: stats.total > 0 ? (sequences.filter(s => (s.email_opens || 0) > 0).length / stats.total) * 100 : 0, color: 'bg-green-400' },
    { label: 'Clicked CTA', value: sequences.filter(s => (s.email_clicks || 0) > 0).length, percent: stats.total > 0 ? (sequences.filter(s => (s.email_clicks || 0) > 0).length / stats.total) * 100 : 0, color: 'bg-green-500' },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <AdminNav />
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Abandoned Quote Campaigns</h1>
            <p className="text-muted-foreground mt-1">Track email recovery performance for abandoned quotes</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Total Sequences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats.total}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.active} active
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Open Rate
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{openRate}%</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.totalOpens} opens / {stats.totalSent} sent
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-2">
                      <MousePointerClick className="h-4 w-4" />
                      Click Rate
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{clickRate}%</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.totalClicks} clicks
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      Completed
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats.completed}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(0) : 0}% conversion
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Conversion Funnel */}
              <Card>
                <CardHeader>
                  <CardTitle>Conversion Funnel</CardTitle>
                  <CardDescription>Track customer journey through the email sequence</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {funnelData.map((stage, idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <div className="w-32 text-sm text-muted-foreground">{stage.label}</div>
                        <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden relative">
                          <div 
                            className={`h-full ${stage.color} transition-all duration-500`}
                            style={{ width: `${stage.percent}%` }}
                          />
                          <span className="absolute inset-0 flex items-center justify-center text-sm font-medium">
                            {stage.value} ({stage.percent.toFixed(0)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Breakdown by Promo Option */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance by Promo Option</CardTitle>
                  <CardDescription>Compare engagement across different promotional bonuses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(byPromoOption).map(([option, data]) => (
                      <div 
                        key={option} 
                        className="p-4 border rounded-lg flex items-start gap-3"
                      >
                        <div className="p-2 bg-muted rounded-lg">
                          {getPromoIcon(option)}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{getPromoLabel(option)}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {data.count} sequences
                          </div>
                          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{data.sent > 0 ? ((data.opens / data.sent) * 100).toFixed(0) : 0}% opens</span>
                            <span>{data.sent > 0 ? ((data.clicks / data.sent) * 100).toFixed(0) : 0}% clicks</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Individual Sequences Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Individual Sequences</CardTitle>
                  <CardDescription>Detailed view of all abandoned quote email sequences</CardDescription>
                </CardHeader>
                <CardContent>
                  {sequences.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No abandoned quote sequences yet. They will appear here when customers save quotes but don't complete them.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Motor</TableHead>
                          <TableHead>Bonus</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-center">Sent</TableHead>
                          <TableHead className="text-center">Opens</TableHead>
                          <TableHead className="text-center">Clicks</TableHead>
                          <TableHead>Last Activity</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sequences.map((seq) => (
                          <TableRow key={seq.id}>
                            <TableCell>
                              <div className="font-medium truncate max-w-[200px]">{seq.email}</div>
                              {seq.customer_name && (
                                <div className="text-xs text-muted-foreground">{seq.customer_name}</div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{seq.metadata?.motorModel || '-'}</div>
                              {seq.metadata?.motorHP && (
                                <div className="text-xs text-muted-foreground">{seq.metadata.motorHP} HP</div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getPromoIcon(seq.metadata?.selectedPromoOption || '')}
                                <span className="text-sm">
                                  {seq.metadata?.promoDisplayValue || getPromoLabel(seq.metadata?.selectedPromoOption || '')}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(seq.status)}</TableCell>
                            <TableCell className="text-center">{seq.emails_sent}</TableCell>
                            <TableCell className="text-center">{seq.email_opens || 0}</TableCell>
                            <TableCell className="text-center">{seq.email_clicks || 0}</TableCell>
                            <TableCell>
                              <div className="text-sm text-muted-foreground">
                                {seq.last_opened_at 
                                  ? formatDistanceToNow(new Date(seq.last_opened_at), { addSuffix: true })
                                  : format(new Date(seq.created_at), 'MMM d')}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
