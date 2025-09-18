import React from 'react';
import { UnifiedInventoryDashboard } from '@/components/admin/UnifiedInventoryDashboard';
import { EmergencyModelCorrection } from '@/components/admin/EmergencyModelCorrection';
import AdminNav from '@/components/admin/AdminNav';

export default function AdminInventory() {
  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
            <p className="text-muted-foreground">
              Monitor motor inventory, sync status, and diagnostics
            </p>
          </div>
          
          {/* Emergency Model Correction - Critical Priority */}
          <EmergencyModelCorrection />
          
          <UnifiedInventoryDashboard />
        </div>
      </main>
    </div>
  );
}