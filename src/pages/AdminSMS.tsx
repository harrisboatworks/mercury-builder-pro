import React from 'react';
import { SMSDashboard } from '@/components/admin/SMSDashboard';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function AdminSMS() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <SMSDashboard />
      </div>
    </ProtectedRoute>
  );
}