import React from 'react';
import { SyncStatusDashboard } from '@/components/admin/SyncStatusDashboard';
import AdminNav from '@/components/admin/AdminNav';

export default function AdminSync() {
  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sync Management</h1>
            <p className="text-muted-foreground">
              Monitor and manage automated Mercury inventory synchronization
            </p>
          </div>
          
          <SyncStatusDashboard />
        </div>
      </main>
    </div>
  );
}