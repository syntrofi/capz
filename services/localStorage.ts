interface Wallet {
  id: string;
  name: string;
  targetIncome: number;
  timeFrame: string;
  address: string;
  redistributionStrategy: string;
  balance: number;
}

const STORAGE_KEY = 'capz_wallets';

export const walletStorage = {
  getWallets: (): Wallet[] => {
    const wallets = localStorage.getItem(STORAGE_KEY);
    return wallets ? JSON.parse(wallets) : [];
  },

  saveWallet: (wallet: Omit<Wallet, 'id' | 'balance'>): Wallet => {
    const wallets = walletStorage.getWallets();
    const newWallet = {
      ...wallet,
      id: Date.now().toString(),
      balance: 0, // Initialize balance to 0
    };
    wallets.push(newWallet);
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
  }
};