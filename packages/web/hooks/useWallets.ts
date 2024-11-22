import { useState, useEffect } from 'react';
import { Wallet } from '@/types/types'; // Updated import path
import { walletStorage } from '@/services/localStorage'; // Updated import path

export function useWallets() {
  const [wallets, setWallets] = useState<Wallet[]>([]);

  useEffect(() => {
    const loadedWallets = walletStorage.getWallets();
    setWallets(loadedWallets);
  }, []);

  return wallets;
}