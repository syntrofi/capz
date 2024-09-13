'use client';

import React, { useState } from 'react';
import AccountCard from '@/components/AccountCard';
import WalletSetupModal from '@/components/WalletSetupModal';
import { useWallets } from '@/hooks/useWallets';
import { useRouter } from 'next/navigation';

const AccountsPage: React.FC = () => {
  const wallets = useWallets();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const clearStorage = () => {
    localStorage.removeItem('capz_wallets');
    router.refresh();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Accounts</h1>
        <div>
          <button onClick={openModal} className="btn btn-primary mr-2">
            Add New Account
          </button>
          <button onClick={clearStorage} className="btn btn-secondary">
            Clear Storage
          </button>
        </div>
      </div>
      {wallets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wallets.map(wallet => (
            <AccountCard key={wallet.id} wallet={wallet} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="mb-4">You haven't set up any accounts yet.</p>
          <button onClick={openModal} className="btn btn-primary">
            Set Up an Account
          </button>
        </div>
      )}

      <WalletSetupModal isOpen={isModalOpen} onClose={closeModal} />
    </div>
  );
};

export default AccountsPage;