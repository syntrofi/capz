import { useState, useEffect } from 'react';
import { walletStorage } from '@/services/localStorage';

export function useWallets() {
  const [wallets, setWallets] = useState([]);

  useEffect(() => {
    const loadedWallets = walletStorage.getWallets();
    setWallets(loadedWallets);
  }, []);

  return wallets;
}