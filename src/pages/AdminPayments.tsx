import React from 'react';
import { PaymentsDashboard } from '@/components/admin/PaymentsDashboard';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function AdminPayments() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen w-full overflow-y-auto">
        <div className="container mx-auto px-4 pt-8 pb-32">
          <PaymentsDashboard />
        </div>
      </div>
    </ProtectedRoute>
  );
}