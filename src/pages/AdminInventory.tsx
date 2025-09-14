import React from 'react';
import { InventoryMonitor } from '@/components/admin/InventoryMonitor';
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
              Monitor motor inventory status and manage stock levels
            </p>
          </div>
          
          <InventoryMonitor />
        </div>
      </main>
    </div>
  );
}