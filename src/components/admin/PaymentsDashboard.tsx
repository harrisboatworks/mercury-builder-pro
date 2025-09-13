import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, DollarSign, TrendingUp, Users, Search, Download } from 'lucide-react';

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
  paymentType: 'deposit' | 'quote';
  status: 'succeeded' | 'pending' | 'failed';
  created: string;
  sessionId: string;
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

  // Mock data for demonstration
  useEffect(() => {
    // In a real app, this would fetch from Stripe API via edge function
    setStats({
      totalRevenue: 15750,
      totalPayments: 23,
      avgPaymentAmount: 685,
      depositsCount: 18,
      quotesCount: 5
    });

    setRecentPayments([
      {
        id: 'pi_1234567890',
        amount: 500,
        customerEmail: 'john@example.com',
        customerName: 'John Smith',
        paymentType: 'deposit',
        status: 'succeeded',
        created: new Date().toISOString(),
        sessionId: 'cs_test_1234'
      },
      {
        id: 'pi_0987654321',
        amount: 1000,
        customerEmail: 'sarah@example.com', 
        customerName: 'Sarah Johnson',
        paymentType: 'deposit',
        status: 'succeeded',
        created: new Date(Date.now() - 86400000).toISOString(),
        sessionId: 'cs_test_5678'
      },
      {
        id: 'pi_1122334455',
        amount: 12500,
        customerEmail: 'mike@example.com',
        customerName: 'Mike Wilson',
        paymentType: 'quote',
        status: 'succeeded',
        created: new Date(Date.now() - 172800000).toISOString(),
        sessionId: 'cs_test_9012'
      }
    ]);
  }, []);

  const handleRefreshData = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement actual data fetching from Stripe via edge function
      toast({
        title: "Data Refreshed",
        description: "Payment data has been updated from Stripe.",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed", 
        description: "Unable to refresh payment data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
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

  const filteredPayments = recentPayments.filter(payment =>
    payment.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payments Dashboard</h2>
          <p className="text-muted-foreground">Track deposits and payment processing</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefreshData} disabled={isLoading} variant="outline">
            <TrendingUp className="w-4 h-4 mr-2" />
            {isLoading ? 'Refreshing...' : 'Refresh Data'}
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
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
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPayments}</div>
            <p className="text-xs text-muted-foreground">
              +5 from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Payment</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.avgPaymentAmount}</div>
            <p className="text-xs text-muted-foreground">
              -2% from last month
            </p>
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
              {stats.quotesCount} quote payments
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
                {searchTerm ? 'No payments found matching your search.' : 'No payments yet.'}
              </div>
            ) : (
              filteredPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{payment.customerName || payment.customerEmail}</span>
                      <Badge className={getPaymentTypeColor(payment.paymentType)}>
                        {payment.paymentType}
                      </Badge>
                      <Badge className={getStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {payment.customerEmail} • {payment.id} • {new Date(payment.created).toLocaleDateString()}
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

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4">
              <div className="text-center">
                <CreditCard className="w-8 h-8 mx-auto mb-2" />
                <div className="font-medium">View in Stripe</div>
                <div className="text-sm text-muted-foreground">Open Stripe Dashboard</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4">
              <div className="text-center">
                <Download className="w-8 h-8 mx-auto mb-2" />
                <div className="font-medium">Export Report</div>
                <div className="text-sm text-muted-foreground">Download payment data</div>
              </div>
            </Button>

            <Button variant="outline" className="h-auto p-4">
              <div className="text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2" />
                <div className="font-medium">Analytics</div>
                <div className="text-sm text-muted-foreground">View detailed reports</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};