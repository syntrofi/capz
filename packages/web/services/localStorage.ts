import { Wallet } from '@/types/types';

const STORAGE_KEY = 'capz_wallets';

export const walletStorage = {
  getWallets: (): Wallet[] => {
    if (typeof window === 'undefined') return [];
    const wallets = localStorage.getItem(STORAGE_KEY);
    console.log('Raw wallets from localStorage:', wallets);
    const parsedWallets = wallets ? JSON.parse(wallets) : [];
    console.log('Parsed wallets:', parsedWallets);
    return parsedWallets;
  },

  saveWallet: (walletData: Omit<Wallet, 'id' | 'balance'>): Wallet => {
    const wallets = walletStorage.getWallets();
    const newWallet: Wallet = {
      ...walletData,
      id: Date.now().toString(),
      balance: 0,
    };
    wallets.push(newWallet);
    console.log('Saving wallets:', wallets);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wallets));
    return newWallet;
  },

  updateWallet: (wallet: Wallet): void => {
    const wallets = walletStorage.getWallets();
    const index = wallets.findIndex(w => w.id === wallet.id);
    if (index !== -1) {
      wallets[index] = wallet;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wallets));
    }
  },

  deleteWallet: (id: string): void => {
    const wallets = walletStorage.getWallets();
    const updatedWallets = wallets.filter(w => w.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedWallets));
  },

  clearWallets: (): void => {
    localStorage.removeItem(STORAGE_KEY);
  },

  saveAllWallets: (wallets: Wallet[]): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wallets));
  }
};