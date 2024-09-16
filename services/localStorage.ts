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
    if (typeof window === 'undefined') return [];
    const wallets = window.localStorage.getItem(STORAGE_KEY);
    console.log('Raw wallets from localStorage:', wallets);
    const parsedWallets = wallets ? JSON.parse(wallets) : [];
    console.log('Parsed wallets:', parsedWallets);
    return parsedWallets;
  },

  saveWallet: (wallet: Omit<Wallet, 'id' | 'balance'>): Wallet => {
    const wallets = walletStorage.getWallets();
    const newWallet: Wallet = {
      ...wallet,
      id: Date.now().toString(),
      balance: 0,
    };
    wallets.push(newWallet);
    console.log('Saving wallets:', wallets);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(wallets));
      console.log('Wallets saved successfully');
    } catch (error) {
      console.error('Error saving wallets:', error);
    }
    return newWallet;
  },

  clearWallets: (): void => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }
};