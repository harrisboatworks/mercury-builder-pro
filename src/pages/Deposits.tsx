import React from 'react';
import { DepositPayment } from '@/components/payments/DepositPayment';

export default function Deposits() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-transparent to-transparent">
      <div className="container mx-auto px-4 py-8">
        <DepositPayment />
      </div>
    </div>
  );
}