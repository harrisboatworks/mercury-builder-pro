import React from 'react';
import { EmailDashboard } from '@/components/admin/EmailDashboard';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function AdminEmail() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <EmailDashboard />
      </div>
    </ProtectedRoute>
  );
}