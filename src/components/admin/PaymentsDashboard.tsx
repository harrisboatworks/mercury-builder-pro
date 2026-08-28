import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, DollarSign, TrendingUp, Users, Search, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PaymentStats {
  totalRevenue: number;
  totalPayments: number;
  avgPaymentAmount: number;
  depositsCount: number;
  quotesCount: number;
}

interface RecentPayment {
  id: string;
  amount: number;
  customerEmail: string;
  customerName?: string;
  paymentType: string;
  status: string;
  created: string;
  reference: string;
}

export const PaymentsDashboard = () => {
  const [stats, setStats] = useState<PaymentStats>({
    totalRevenue: 0,
    totalPayments: 0,
    avgPaymentAmount: 0,
    depositsCount: 0,
    quotesCount: 0
  });
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadPayments = useCallback(async (showToast = false) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('id, zaprite_order_id, customer_email, customer_name, amount_cents, payment_type, status, created_at, paid_at')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const rows = data ?? [];
      const paid = rows.filter((p: any) => p.status === 'succeeded' || p.status === 'paid');
      const totalRevenue = paid.reduce((s: number, p: any) => s + (p.amount_cents ?? 0), 0) / 100;
      const depositsCount = paid.filter((p: any) => p.payment_type === 'deposit').length;
      const quotesCount = paid.filter((p: any) => p.payment_type !== 'deposit').length;

      setStats({
        totalRevenue,
        totalPayments: paid.length,
        avgPaymentAmount: paid.length ? Math.round(totalRevenue / paid.length) : 0,
        depositsCount,
        quotesCount,
      });

      setRecentPayments(
        rows.map((p: any) => ({
          id: p.id,
          amount: (p.amount_cents ?? 0) / 100,
          customerEmail: p.customer_email ?? '',
          customerName: p.customer_name ?? undefined,
          paymentType: p.payment_type ?? 'payment',
          status: p.status ?? 'unknown',
          created: p.paid_at ?? p.created_at,
          reference: p.zaprite_order_id ?? p.id,
        }))
      );

      if (showToast) {
        toast({ title: 'Data Refreshed', description: 'Payment data has been updated.' });
      }
    } catch (error: any) {
      console.error('Failed to load payments:', error);
      toast({
        title: 'Load Failed',
        description: error?.message || 'Unable to load payment data.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded':
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'expired':
        return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentTypeColor = (type: string) => {
    switch (type) {
      case 'deposit': return 'bg-blue-100 text-blue-800';
      case 'quote': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleExport = () => {
    if (recentPayments.length === 0) {
      toast({ title: 'Nothing to export', description: 'No payments available.' });
      return;
    }
    const headers = ['Reference', 'Customer Name', 'Customer Email', 'Amount (CAD)', 'Type', 'Status', 'Created'];
    const escape = (v: any) => {
      const s = String(v ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = recentPayments.map(p => [
      p.reference, p.customerName ?? '', p.customerEmail, p.amount.toFixed(2),
      p.paymentType, p.status, new Date(p.created).toISOString(),
    ].map(escape).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Export Complete', description: `${recentPayments.length} payments exported.` });
  };

  const filteredPayments = recentPayments.filter(payment =>
    payment.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.reference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payments Dashboard</h2>
          <p className="text-muted-foreground">Track deposits and payment processing</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => loadPayments(true)} disabled={isLoading} variant="outline">
            <TrendingUp className="w-4 h-4 mr-2" />
            {isLoading ? 'Refreshing...' : 'Refresh Data'}
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={recentPayments.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across completed payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPayments}</div>
            <p className="text-xs text-muted-foreground">Succeeded / paid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Payment</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.avgPaymentAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Per completed payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deposits</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.depositsCount}</div>
            <p className="text-xs text-muted-foreground">
              {stats.quotesCount} other payments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Payments</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPayments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {isLoading ? 'Loading payments...' : searchTerm ? 'No payments found matching your search.' : 'No payments yet.'}
              </div>
            ) : (
              filteredPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{payment.customerName || payment.customerEmail || 'Unknown'}</span>
                      <Badge className={getPaymentTypeColor(payment.paymentType)}>
                        {payment.paymentType}
                      </Badge>
                      <Badge className={getStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {payment.customerEmail} • {payment.reference} • {new Date(payment.created).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">${payment.amount.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(payment.created).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
