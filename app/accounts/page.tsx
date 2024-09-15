'use client';

import React, { useState, useEffect } from 'react';
import AccountCard from '@/components/AccountCard';
import WalletSetupModal from '@/components/WalletSetupModal';
import { walletStorage } from '@/services/localStorage';
import { useRouter } from 'next/navigation';

const AccountsPage: React.FC = () => {
  const [wallets, setWallets] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadedWallets = walletStorage.getWallets();
    console.log('Loaded wallets:', loadedWallets);
    setWallets(loadedWallets);
  }, []);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const addNewWallet = (newWallet) => {
    console.log('Adding new wallet:', newWallet);
    setWallets(prevWallets => [...prevWallets, newWallet]);
  };

  const clearStorage = () => {
    console.log('Clearing storage');
    walletStorage.clearWallets();
    setWallets([]);
  };

  console.log('Rendering AccountsPage with wallets:', wallets);

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
          {wallets.map((wallet, index) => (
            <AccountCard key={wallet?.id || index} wallet={wallet} />
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

      <WalletSetupModal isOpen={isModalOpen} onClose={closeModal} onSave={addNewWallet} />
    </div>
  );
};

export default AccountsPage;