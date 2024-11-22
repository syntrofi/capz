'use client';

import React, { useState, useEffect } from 'react';
import AccountCard from '@/components/AccountCard';
import WalletSetupModal from '@/components/WalletSetupModal';
import { walletStorage } from '@/services/localStorage';
import { useRouter } from 'next/navigation';
import { Wallet } from '@/types/types';  // Add this import at the top of the file

const AccountsPage: React.FC = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadedWallets = walletStorage.getWallets();
    console.log('Loaded wallets in useEffect:', loadedWallets);
    setWallets(loadedWallets);
  }, []);

  
 // For Demo purposes, update the balance every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setWallets(prevWallets =>
        prevWallets.map(wallet => ({
          ...wallet,
          balance: wallet.balance + 50
        }))
      );
    }, 5000); // Update every 5 seconds

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Save updated wallets to localStorage whenever they change
    walletStorage.saveAllWallets(wallets);
  }, [wallets]);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const addNewWallet = async (newWallet: Omit<Wallet, 'id' | 'balance'>) => {
    console.log('Adding new wallet:', newWallet);
    const savedWallet = await walletStorage.saveWallet(newWallet);
    console.log('Saved wallet:', savedWallet);
    setWallets(prevWallets => [...prevWallets, savedWallet]);
  };

  const clearStorage = () => {
    console.log('Clearing storage');
    walletStorage.clearWallets();
    setWallets([]);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Your Accounts</h1>
        <button onClick={openModal} className="btn btn-primary">
          Add New Account
        </button>
      </div>
      {wallets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wallets.map((wallet) => (
            <AccountCard key={wallet.id} wallet={wallet} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="mb-4 text-white">You haven't set up any accounts yet.</p>
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