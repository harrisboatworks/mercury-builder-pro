import React from 'react';
import { PaymentsDashboard } from '@/components/admin/PaymentsDashboard';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function AdminPayments() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <PaymentsDashboard />
      </div>
    </ProtectedRoute>
  );
}