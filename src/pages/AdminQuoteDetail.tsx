import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AdminNav from '@/components/admin/AdminNav';

interface QuoteDetail {
  id: string;
  created_at: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  base_price: number;
  final_price: number;
  deposit_amount: number;
  loan_amount: number;
  monthly_payment: number;
  term_months: number;
  total_cost: number;
  tradein_value_pre_penalty?: number | null;
  tradein_value_final?: number | null;
  penalty_applied?: boolean;
  penalty_factor?: number | null;
  penalty_reason?: string | null;
}

const AdminQuoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [q, setQ] = useState<QuoteDetail | null>(null);

  useEffect(() => {
    document.title = 'Quote Detail | Admin';
    const fetchOne = async () => {
      const { data, error } = await supabase.from('customer_quotes').select('*').eq('id', id).single();
      if (!error) setQ(data as any);
    };
    fetchOne();
  }, [id]);

  const fmt = (n: number | null | undefined) => (n == null ? '-' : `$${Math.round(Number(n)).toLocaleString()}`);

  return (
    <main className="container mx-auto px-4 py-8">
      <AdminNav />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Quote Details</h1>
        <Button variant="secondary" onClick={() => navigate('/admin/quotes')}>Back</Button>
      </div>
      {!q ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-4">
            <h2 className="font-semibold mb-2">Customer</h2>
            <div>Name: {q.customer_name}</div>
            <div>Email: {q.customer_email}</div>
            <div>Phone: {q.customer_phone || '-'}</div>
            <div>Date: {q.created_at ? new Date(q.created_at).toLocaleString() : '-'}</div>
          </Card>
          <Card className="p-4">
            <h2 className="font-semibold mb-2">Trade-In</h2>
            <div>Pre-penalty value: {fmt(q.tradein_value_pre_penalty)}</div>
            <div>Final value: {fmt(q.tradein_value_final)}</div>
            <div>Penalty applied: {q.penalty_applied ? 'Yes' : 'No'}</div>
            {q.penalty_applied && (
              <>
                <div>Penalty factor: {q.penalty_factor}</div>
                <div>Reason: {q.penalty_reason}</div>
              </>
            )}
          </Card>
          <Card className="p-4 md:col-span-2">
            <h2 className="font-semibold mb-2">Financial Summary</h2>
            <div>Base price: {fmt(q.base_price)}</div>
            <div>Deposit amount: {fmt(q.deposit_amount)}</div>
            <div>Loan amount: {fmt(q.loan_amount)}</div>
            <div>Monthly payment: {fmt(q.monthly_payment)}</div>
            <div>Term months: {q.term_months}</div>
            <div>Total cost: {fmt(q.total_cost)}</div>
          </Card>
        </div>
      )}
    </main>
  );
};

export default AdminQuoteDetail;
