'use client';

import React from 'react';
import WalletSetupForm from '@/components/WalletSetupForm';

export default function WalletSetupPage() {
  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4 md:p-8">
      <WalletSetupForm />
    </div>
  );
}