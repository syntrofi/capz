'use client';

import React from 'react';
import WalletSetupForm from '@/components/WalletSetupForm';
import { useRouter } from 'next/navigation';
import { walletStorage } from '@/services/localStorage';
import { Wallet } from '@/types/types';

export default function WalletSetupPage() {
  const router = useRouter();

  const handleSave = (walletData: Omit<Wallet, 'id' | 'balance'>) => {
    walletStorage.saveWallet(walletData);
    router.push('/accounts');
  };

  const handleClose = () => {
    router.push('/accounts');
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4 md:p-8">
      <WalletSetupForm onClose={handleClose} onSave={handleSave} />
    </div>
  );
}